const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const Booking = require('../models/Booking');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

// Middleware kiểm tra vai trò admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ admin có quyền truy cập' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
};

// Schema xác thực dữ liệu
const historySchema = Joi.object({
  roomId: Joi.string().optional(),
  floor: Joi.number().optional(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).max(2100).required(),
});

const userSchema = Joi.object({
  id: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  password: Joi.string().min(6).optional(),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().optional().allow(''),
  gender: Joi.string().valid('Nam', 'Nữ', 'Khác').optional(),
  birthDate: Joi.date().optional().allow(null),
  address: Joi.string().optional().allow(''),
  role: Joi.string().valid('user', 'admin').optional(),
});

const spaceSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('Phòng tự học', 'Phòng học nhóm', 'Phòng mentor').required(),
  building: Joi.string().required(),
  floor: Joi.number().min(1).required(),
});

// API lấy danh sách phòng
router.get('/rooms', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const spaces = await Space.find().select('name type building floor status');
    const rooms = spaces.map(space => ({
      _id: space._id,
      roomName: space.name,
      roomType: space.type === 'Phòng tự học' ? 'individual' : space.type === 'Phòng học nhóm' ? 'group' : 'mentor',
      building: space.building,
      floor: space.floor,
      inUse: space.status === 'in-use',
    }));
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách phòng' });
  }
});

// API lấy lịch sử sử dụng
router.get('/history', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error, value } = historySchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { roomId, floor, month, year } = value;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    let query = {
      bookedAt: { $gte: startDate, $lte: endDate },
      checkInAt: { $ne: null },
    };

    if (roomId) {
      const space = await Space.findOne({ name: roomId });
      if (!space) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
      query.spaceId = space._id;
    } else if (floor) {
      const spaces = await Space.find({ floor }).select('_id');
      query.spaceId = { $in: spaces.map(s => s._id) };
    }

    const bookings = await Booking.find(query)
      .populate('spaceId', 'name type')
      .lean();

    const historyData = [];
    const daysInMonth = endDate.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dailyBookings = bookings.filter(b => {
        const bookedDate = new Date(b.bookedAt).toISOString().split('T')[0];
        return bookedDate === dateStr;
      });

      const typeHours = dailyBookings.reduce((acc, b) => {
        const roomType = b.spaceId.type === 'Phòng tự học' ? 'individual' : b.spaceId.type === 'Phòng học nhóm' ? 'group' : 'mentor';
        const checkIn = new Date(b.checkInAt);
        const checkOut = b.checkOutAt ? new Date(b.checkOutAt) : new Date(checkIn.getTime() + 2 * 60 * 60 * 1000);
        const hours = (checkOut - checkIn) / (1000 * 60 * 60);
        acc[roomType] = (acc[roomType] || 0) + hours;
        return acc;
      }, {});

      Object.entries(typeHours).forEach(([roomType, usedHours]) => {
        historyData.push({
          date: dateStr,
          roomType,
          usedHours: Number(usedHours.toFixed(2)),
        });
      });
    }

    res.json({ success: true, data: historyData });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải lịch sử sử dụng' });
  }
});

// API lấy danh sách tất cả người dùng
router.get('/all-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách người dùng' });
  }
});

// API thêm người dùng mới
router.post('/user', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { id, name, password, email, phone, gender, birthDate, address, role } = req.body;
    const existingUser = await User.findOne({ id });
    if (existingUser) return res.status(400).json({ success: false, message: `Mã sinh viên "${id}" đã tồn tại` });

    const hashedPassword = await bcrypt.hash(password || 'default123', 10);
    const user = new User({
      id,
      name,
      password: hashedPassword,
      email: email || '',
      phone: phone || '',
      gender: gender || 'Nam',
      birthDate: birthDate ? new Date(birthDate) : null,
      address: address || '',
      role: role || 'user',
    });
    await user.save();
    res.json({ success: true, message: 'Thêm người dùng thành công' });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: `Mã sinh viên "${req.body.id}" đã tồn tại` });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm người dùng' });
  }
});

// API cập nhật người dùng
router.put('/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const { name, password, email, phone, gender, birthDate, address, role } = req.body;
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;
    user.birthDate = birthDate ? new Date(birthDate) : user.birthDate;
    user.address = address || user.address;
    user.role = role || user.role;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ success: true, message: 'Cập nhật người dùng thành công' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng' });
  }
});

// API xóa người dùng
router.delete('/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }
    await User.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa người dùng' });
  }
});

// API thêm phòng mới
router.post('/space', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = spaceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, type, building, floor } = req.body;
    const existingSpace = await Space.findOne({ name });
    if (existingSpace) return res.status(400).json({ success: false, message: `Phòng "${name}" đã tồn tại` });

    const space = new Space({
      name,
      type,
      building,
      floor,
      status: 'empty',
      createdAt: new Date()
    });
    await space.save();
    res.json({ success: true, message: 'Thêm phòng thành công' });
  } catch (err) {
    console.error('Error creating space:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: `Phòng "${req.body.name}" đã tồn tại` });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm phòng' });
  }
});

// API cập nhật phòng
router.put('/space/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = spaceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }

    const { name, type, building, floor } = req.body;
    space.name = name || space.name;
    space.type = type || space.type;
    space.building = building || space.building;
    space.floor = floor || space.floor;

    await space.save();
    res.json({ success: true, message: 'Cập nhật phòng thành công' });
  } catch (err) {
    console.error('Error updating space:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: `Phòng "${req.body.name}" đã tồn tại` });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phòng' });
  }
});

// API xóa phòng
router.delete('/space/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
    if (space.status !== 'empty') {
      return res.status(400).json({ success: false, message: 'Không thể xóa phòng đang được sử dụng hoặc đã đặt' });
    }
    await Space.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Xóa phòng thành công' });
  } catch (err) {
    console.error('Error deleting space:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa phòng' });
  }
});

module.exports = router;