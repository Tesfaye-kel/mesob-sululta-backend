const mongoose = require('mongoose');

const queueCheckInSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentBooking', required: true, unique: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    queueNumber: { type: Number, required: true },
    status: { type: String, enum: ['waiting', 'called', 'served', 'skipped'], default: 'waiting' },
    checkedInAt: { type: Date, default: Date.now },
    calledAt: { type: Date, default: null },
    servedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QueueCheckIn', queueCheckInSchema);
