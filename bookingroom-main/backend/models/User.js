const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: { 
    type: String, 
    sparse: true,
    default: undefined
  },
  name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' },
  birthDate: { type: Date },
  address: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

// Tạo index unique cho studentId
userSchema.index({ studentId: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('User', userSchema); 