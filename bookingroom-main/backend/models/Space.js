const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  building: { type: String, required: true },
  floor: { type: Number, required: true },
  status: { type: String, enum: ['empty', 'booked', 'in-use'], default: 'empty' },
  bookedTimeSlot: { type: String },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedAt: { type: Date },
  bookedDate: { type: Date },
  checkInDeadline: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Space', spaceSchema);