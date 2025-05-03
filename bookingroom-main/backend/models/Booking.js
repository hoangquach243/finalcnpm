const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  bookedAt: { type: Date, required: true },
  bookedDate: { type: Date },
  bookedTimeSlot: { type: String, required: true },
  checkInAt: { type: Date },
  checkOutAt: { type: Date },
});

module.exports = mongoose.model('Booking', bookingSchema);