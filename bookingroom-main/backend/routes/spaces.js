const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

const searchSchema = Joi.object({
  building: Joi.string().required(),
  floor: Joi.number().required(),
  type: Joi.string().required(),
  timeSlot: Joi.string().optional(),
  date: Joi.date().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

const myBookingsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

const bookSchema = Joi.object({
  timeSlot: Joi.string().required(),
  date: Joi.date().min('now').required().messages({
    'date.min': 'Ngày đặt chỗ không được trong quá khứ',
  }),
});

const scheduleSchema = Joi.object({
  date: Joi.date().default(() => new Date()),
});

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { building, floor, type, timeSlot, date, page, limit } = value;
    const skip = (page - 1) * limit;

    const query = {
      building,
      floor,
      type,
      $or: [
        { status: 'empty' },
        { status: 'booked', bookedBy: req.user.id },
        { status: 'in-use', bookedBy: req.user.id },
      ],
    };

    let spaceIds = null;
    if (timeSlot && date) {
      const [start, end] = timeSlot.split('-');
      const slotStart = new Date(date);
      const [startHour, startMinute] = start.split(':').map(Number);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const slotEnd = new Date(date);
      const [endHour, endMinute] = end.split(':').map(Number);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      const bookings = await Booking.find({
        bookedAt: { $lte: slotEnd },
        $or: [
          { checkOutAt: null },
          { checkOutAt: { $gte: slotStart } },
        ],
      }).select('spaceId');

      const bookedSpaceIds = bookings.map(b => b.spaceId.toString());
      spaceIds = await Space.find(query).distinct('_id');
      spaceIds = spaceIds.filter(id => !bookedSpaceIds.includes(id.toString()));
      query._id = { $in: spaceIds };
    }

    const spaces = await Space.find(query)
      .skip(skip)
      .limit(limit)
      .populate('bookedBy', 'id name');

    const total = await Space.countDocuments(query);

    res.json({
      success: true,
      data: spaces,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(`Error searching spaces for user ${req.user?.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.get('/options', async (req, res) => {
  try {
    const cacheKey = 'space_options';
    const cachedOptions = cache.get(cacheKey);

    if (cachedOptions) {
      console.log('Serving options from cache');
      return res.json({
        success: true,
        data: cachedOptions,
      });
    }

    const buildings = await Space.distinct('building');
    const floors = await Space.distinct('floor');
    const types = await Space.distinct('type');
    console.log('Fetched options:', { buildings, floors, types });

    const options = { buildings, floors, types };
    cache.set(cacheKey, options);

    if (!buildings.length && !floors.length && !types.length) {
      return res.json({
        success: true,
        data: options,
        message: 'Chưa có dữ liệu tòa, lầu hoặc loại phòng',
      });
    }

    res.json({
      success: true,
      data: options,
    });
  } catch (err) {
    console.error('Error fetching space options:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const { error, value } = myBookingsSchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { page, limit } = value;
    const skip = (page - 1) * limit;

    const spaces = await Space.find({
      bookedBy: req.user.id,
      status: { $in: ['booked', 'in-use'] },
    })
      .skip(skip)
      .limit(limit)
      .populate('bookedBy', 'id name');

    const total = await Space.countDocuments({
      bookedBy: req.user.id,
      status: { $in: ['booked', 'in-use'] },
    });

    console.log(`Fetched bookings for user ${req.user.id}:`, spaces.map(s => ({
      _id: s._id,
      name: s.name,
      status: s.status,
      bookedBy: s.bookedBy ? s.bookedBy._id.toString() : null,
    })));

    res.json({
      success: true,
      data: spaces,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(`Error fetching bookings for user ${req.user?.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/book/:id', authMiddleware, async (req, res) => {
  try {
    const { error, value } = bookSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { timeSlot, date } = value;
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Không gian không tồn tại' });
    if (space.status !== 'empty') return res.status(409).json({ success: false, message: 'Phòng đã được đặt bởi người khác' });

    const [start] = timeSlot.split('-');
    const [startHour, startMinute] = start.split(':').map(Number);
    const bookedAt = new Date(date);
    bookedAt.setHours(startHour, startMinute, 0, 0);

    if (bookedAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Thời gian đặt chỗ không được trong quá khứ' });
    }

    space.status = 'booked';
    space.bookedBy = req.user.id;
    space.bookedAt = bookedAt;
    space.bookedTimeSlot = timeSlot;
    space.bookedDate = new Date(date).setHours(0, 0, 0, 0);
    space.checkInDeadline = new Date(bookedAt.getTime() + 15 * 60 * 1000);
    await space.save();

    const booking = new Booking({
      userId: req.user.id,
      spaceId: space._id,
      bookedAt,
      bookedDate: new Date(date).setHours(0, 0, 0, 0),
      bookedTimeSlot: timeSlot,
    });
    await booking.save();

    const io = req.app.get('io');
    io?.emit('spaceUpdate', { spaceId: space._id, status: space.status });

    const notification = new Notification({
      userId: req.user.id,
      message: `Bạn đã đặt chỗ ${space.name} thành công. Check-in trước ${space.checkInDeadline.toLocaleString()}`,
    });
    await notification.save();
    io?.emit('notification', notification);

    await space.populate('bookedBy', 'id name');
    console.log(`Booked space ${space._id} by user ${req.user.id}:`, {
      status: space.status,
      bookedBy: space.bookedBy ? space.bookedBy._id.toString() : null,
      bookedAt: space.bookedAt,
      bookedDate: space.bookedDate,
    });
    res.json({ success: true, message: 'Đặt chỗ thành công', space });
  } catch (err) {
    console.error(`Error booking space ${req.params.id} by user ${req.user?.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/checkin/:id', authMiddleware, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Không gian không tồn tại' });

    if (!space.bookedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể check-in: Phòng chưa được đặt',
        details: { spaceStatus: space.status, userId: req.user.id }
      });
    }

    if (space.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không thể check-in: Bạn không phải là người đã đặt phòng này',
        details: { bookedBy: space.bookedBy.toString(), userId: req.user.id }
      });
    }

    if (space.status !== 'booked') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể check-in: Phòng không ở trạng thái đã đặt',
        details: { spaceStatus: space.status }
      });
    }

    if (new Date() > space.checkInDeadline) {
      space.status = 'empty';
      space.bookedBy = null;
      space.bookedAt = null;
      space.bookedTimeSlot = null;
      space.bookedDate = null;
      space.checkInDeadline = null;
      await space.save();
      return res.status(400).json({ 
        success: false, 
        message: 'Hết hạn check-in',
        details: { checkInDeadline: space.checkInDeadline }
      });
    }

    space.status = 'in-use';
    await space.save();

    await Booking.updateOne(
      { spaceId: space._id, userId: req.user.id, checkInAt: null },
      { checkInAt: new Date() }
    );

    const io = req.app.get('io');
    io?.emit('spaceUpdate', { spaceId: space._id, status: space.status });

    const notification = new Notification({
      userId: req.user.id,
      message: `Bạn đã check-in tại ${space.name}`,
    });
    await notification.save();
    io?.emit('notification', notification);

    await space.populate('bookedBy', 'id name');
    res.json({ success: true, message: 'Check-in thành công', space });
  } catch (err) {
    console.error(`Error checking in space ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Không gian không tồn tại' });

    if (!space.bookedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể hủy: Phòng chưa được đặt',
        details: { spaceStatus: space.status, userId: req.user.id }
      });
    }

    if (space.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không thể hủy: Bạn không phải là người đã đặt phòng này',
        details: { bookedBy: space.bookedBy.toString(), userId: req.user.id }
      });
    }

    if (space.status !== 'booked') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể hủy: Phòng không ở trạng thái đã đặt',
        details: { spaceStatus: space.status }
      });
    }

    space.status = 'empty';
    space.bookedBy = null;
    space.bookedAt = null;
    space.bookedTimeSlot = null;
    space.bookedDate = null;
    space.checkInDeadline = null;
    await space.save();

    await Booking.updateOne(
      { spaceId: space._id, userId: req.user.id, checkInAt: null, checkOutAt: null },
      { checkOutAt: new Date() }
    );

    const io = req.app.get('io');
    io?.emit('spaceUpdate', { spaceId: space._id, status: space.status });

    const notification = new Notification({
      userId: req.user.id,
      message: `Bạn đã hủy đặt chỗ ${space.name} thành công.`,
    });
    await notification.save();
    io?.emit('notification', notification);

    await space.populate('bookedBy', 'id name');
    res.json({ success: true, message: 'Hủy đặt chỗ thành công', space });
  } catch (err) {
    console.error(`Error canceling booking for space ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/checkout/:id', authMiddleware, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Không gian không tồn tại' });

    if (!space.bookedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể check-out: Phòng chưa được đặt',
        details: { spaceStatus: space.status, userId: req.user.id }
      });
    }

    if (space.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không thể check-out: Bạn không phải là người đã đặt phòng này',
        details: { bookedBy: space.bookedBy.toString(), userId: req.user.id }
      });
    }

    if (space.status !== 'in-use') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể check-out: Phòng không ở trạng thái đang sử dụng',
        details: { spaceStatus: space.status }
      });
    }

    space.status = 'empty';
    space.bookedBy = null;
    space.bookedAt = null;
    space.bookedTimeSlot = null;
    space.bookedDate = null;
    space.checkInDeadline = null;
    await space.save();

    await Booking.updateOne(
      { spaceId: space._id, userId: req.user.id, checkOutAt: null },
      { checkOutAt: new Date() }
    );

    const io = req.app.get('io');
    io?.emit('spaceUpdate', { spaceId: space._id, status: space.status });

    const notification = new Notification({
      userId: req.user.id,
      message: `Bạn đã check-out khỏi ${space.name}. Vui lòng đánh giá chất lượng không gian.`,
    });
    await notification.save();
    io?.emit('notification', notification);

    await space.populate('bookedBy', 'id name');
    res.json({ success: true, message: 'Check-out thành công', space });
  } catch (err) {
    console.error(`Error checking out space ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.get('/:id/schedule', authMiddleware, async (req, res) => {
  try {
    const { error, value } = scheduleSchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { date } = value;
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Không gian không tồn tại' });

    const timeSlots = [
      '08:00-10:00',
      '10:00-12:00',
      '13:00-15:00',
      '15:00-17:00',
    ];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      spaceId: space._id,
      bookedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const schedule = {};
    timeSlots.forEach(slot => {
      const [start, end] = slot.split('-');
      const slotStart = new Date(date);
      const [startHour, startMinute] = start.split(':').map(Number);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const slotEnd = new Date(date);
      const [endHour, endMinute] = end.split(':').map(Number);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      const isBooked = space.status !== 'empty' && space.bookedTimeSlot === slot && space.bookedAt >= startOfDay && space.bookedAt <= endOfDay;

      schedule[slot] = isBooked ? (space.status === 'in-use' ? 'in-use' : 'booked') : 'empty';
    });

    res.json({
      success: true,
      data: { schedule },
    });
  } catch (err) {
    console.error(`Error fetching schedule for space ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

module.exports = router;