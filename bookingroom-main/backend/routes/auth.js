const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const authMiddleware = require('../middleware/auth');

const loginSchema = Joi.object({
  id: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  id: Joi.string().min(6).required(),
  studentId: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('Nam', 'Nữ', 'Khác').optional(),
  birthDate: Joi.date().optional(),
  address: Joi.string().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  password: Joi.string().min(6).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('Nam', 'Nữ', 'Khác').optional(),
  birthDate: Joi.date().optional(),
  address: Joi.string().optional(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const adminRegisterSchema = Joi.object({
  id: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  verificationCode: Joi.string().required()
});

const loginAttempts = new Map();

router.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { id, password } = req.body;
  const attempts = loginAttempts.get(id) || 0;
  if (attempts >= 5) return res.status(403).json({ success: false, message: 'Tài khoản bị khóa 5 phút' });

  const user = await User.findOne({ id });
  if (!user) {
    loginAttempts.set(id, attempts + 1);
    setTimeout(() => loginAttempts.delete(id), 5 * 60 * 1000);
    return res.status(400).json({ success: false, message: 'Mã sinh viên hoặc mật khẩu không đúng' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    loginAttempts.set(id, attempts + 1);
    setTimeout(() => loginAttempts.delete(id), 5 * 60 * 1000);
    return res.status(400).json({ success: false, message: `Mã sinh viên hoặc mật khẩu không đúng. Còn ${4 - attempts} lần thử` });
  }

  loginAttempts.delete(id);
  const accessToken = jwt.sign({ id: user._id }, 'secretKey', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, 'refreshSecret', { expiresIn: '7d' });
  res.json({ 
    success: true, 
    accessToken, 
    refreshToken, 
    user: { _id: user._id, id: user.id, name: user.name, role: user.role }
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token provided' });

  const isRevoked = await RevokedToken.findOne({ token: refreshToken });
  if (isRevoked) {
    return res.status(401).json({ success: false, message: 'Refresh token has been revoked' });
  }

  try {
    const decoded = jwt.verify(refreshToken, 'refreshSecret');
    const user = await User.findById(decoded.id).select('id name role');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const accessToken = jwt.sign({ id: decoded.id }, 'secretKey', { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: decoded.id }, 'refreshSecret', { expiresIn: '7d' });
    res.json({ 
      success: true, 
      accessToken, 
      refreshToken: newRefreshToken,
      user: { _id: user._id, id: user.id, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  const { error, value } = logoutSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { refreshToken } = value;
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RevokedToken.create({ token: refreshToken, expiresAt });
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { id, studentId, name, password, email, phone, gender, birthDate, address } = req.body;

  try {
    // Kiểm tra xem id hoặc studentId đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ id }, { studentId }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.id === id ? 'Tên đăng nhập đã tồn tại' : 'Mã sinh viên đã tồn tại' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      id,
      studentId,
      name,
      password: hashedPassword,
      email,
      phone,
      gender,
      birthDate,
      address,
      role: 'user'
    });

    await user.save();
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, password, email, phone, gender, birthDate, address } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (gender) updateData.gender = gender;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Cập nhật thông tin thành công', user });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

// Middleware kiểm tra quyền admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Endpoint đăng ký quản trị viên
router.post('/register-admin', async (req, res) => {
  const { error } = adminRegisterSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { id, name, password, email, phone, verificationCode } = req.body;

  // Kiểm tra mã xác thực
  if (verificationCode !== 'HCMUT2025') {
    return res.status(403).json({ 
      success: false, 
      message: 'Mã xác thực không hợp lệ' 
    });
  }

  try {
    // Kiểm tra xem id đã tồn tại chưa
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      id,
      name,
      password: hashedPassword,
      email,
      phone,
      role: 'admin'
    });

    await user.save();
    res.status(201).json({ success: true, message: 'Đăng ký quản trị viên thành công' });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

module.exports = router;