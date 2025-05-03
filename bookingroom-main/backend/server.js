const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const spaceRoutes = require('./routes/spaces');
const notificationRoutes = require('./routes/notifications');
const bookingRoutes = require('./routes/bookings');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const Notification = require('./models/Notification');
const Space = require('./models/Space');
const Booking = require('./models/Booking');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

app.use(express.json());
app.use(cors());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost/hcmut_study_space', {})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Khởi tạo dữ liệu mẫu
mongoose.connection.once('open', async () => {
  try {
    // Khởi tạo admin mặc định
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        id: 'admin001',
        name: 'Admin',
        password: hashedPassword,
        email: 'admin@hcmut.edu.vn',
        phone: '0123456789',
        gender: 'Nam',
        address: '',
        role: 'admin',
      });
      console.log('Created default admin user: id=admin001, password=admin123');
    }

    // Khởi tạo dữ liệu phòng mẫu
    const count = await Space.countDocuments();
    if (count === 0) {
      const buildings = ["Tòa A"];
      const floors = [1, 2, 3, 4, 5];
      const spaces = [];

      buildings.forEach(building => {
        floors.forEach(floor => {
          for (let i = 1; i <= 5; i++) {
            spaces.push({
              name: `Phòng Tự Học ${floor}0${i}`,
              type: "Phòng tự học",
              building: building,
              floor: floor,
              status: "empty",
              bookedTimeSlot: null,
              bookedBy: null,
              bookedAt: null,
              bookedDate: null,
              checkInDeadline: null,
              createdAt: new Date()
            });
          }
          for (let i = 1; i <= 3; i++) {
            spaces.push({
              name: `Phòng Học Nhóm ${floor}0${i}`,
              type: "Phòng học nhóm",
              building: building,
              floor: floor,
              status: "empty",
              bookedTimeSlot: null,
              bookedBy: null,
              bookedAt: null,
              bookedDate: null,
              checkInDeadline: null,
              createdAt: new Date()
            });
          }
        });
      });

      await Space.insertMany(spaces);
      console.log('Inserted 40 sample spaces into Space collection');
    }
  } catch (err) {
    console.error('Error initializing sample data:', err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Nhắc nhở check-in
setInterval(async () => {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 5 * 60 * 1000);
    const spaces = await Space.find({
      status: 'booked',
      checkInDeadline: { $gte: now, $lte: reminderTime },
    });

    for (const space of spaces) {
      const notification = new Notification({
        userId: space.bookedBy,
        message: `Nhắc nhở: Bạn cần check-in tại ${space.name} trước ${space.checkInDeadline.toLocaleString()}`,
      });
      await notification.save();
      io.emit('notification', notification);
    }
  } catch (err) {
    console.error('Error in reminder interval:', err);
  }
}, 60000);

// Hủy đặt chỗ nếu không check-in
setInterval(async () => {
  try {
    const now = new Date();
    const spaces = await Space.find({ status: 'booked', checkInDeadline: { $lt: now } });

    for (const space of spaces) {
      const userId = space.bookedBy;
      space.status = 'empty';
      space.bookedBy = null;
      space.bookedAt = null;
      space.bookedTimeSlot = null;
      space.bookedDate = null;
      space.checkInDeadline = null;
      await space.save();

      await Booking.updateOne(
        { spaceId: space._id, userId, checkInAt: null, checkOutAt: null },
        { checkOutAt: now }
      );

      io.emit('spaceUpdate', { spaceId: space._id, status: space.status });

      const notification = new Notification({
        userId,
        message: `Đặt chỗ tại ${space.name} đã bị hủy do không check-in đúng hạn.`,
      });
      await notification.save();
      io.emit('notification', notification);
    }
  } catch (err) {
    console.error('Error in cancel booking interval:', err);
  }
}, 60000);

// Tự động check-out sau 2 giờ
setInterval(async () => {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const spaces = await Space.find({ status: 'in-use' })
      .populate('bookedBy', 'id name');

    for (const space of spaces) {
      const booking = await Booking.findOne({
        spaceId: space._id,
        userId: space.bookedBy,
        checkInAt: { $ne: null },
        checkOutAt: null,
      });

      if (booking && booking.checkInAt < twoHoursAgo) {
        const userId = space.bookedBy;
        space.status = 'empty';
        space.bookedBy = null;
        space.bookedAt = null;
        space.bookedTimeSlot = null;
        space.bookedDate = null;
        space.checkInDeadline = null;
        await space.save();

        await Booking.updateOne(
          { spaceId: space._id, userId, checkOutAt: null },
          { checkOutAt: now }
        );

        io.emit('spaceUpdate', { spaceId: space._id, status: space.status });

        const notification = new Notification({
          userId,
          message: `Bạn đã được tự động check-out khỏi ${space.name} sau 2 giờ sử dụng.`,
        });
        await notification.save();
        io.emit('notification', notification);
      }
    }
  } catch (err) {
    console.error('Error in auto-checkout interval:', err);
  }
}, 60000);

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));