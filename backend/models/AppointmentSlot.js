const mongoose = require('mongoose');

const appointmentSlotSchema = new mongoose.Schema(
  {
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    slotDate: { type: Date, required: true, index: true },
    session: { type: String, enum: ['session1', 'session2'], required: true },
    capacity: { type: Number, default: 100, min: 0 },
    bookedCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['open', 'closed', 'full'], default: 'open' },
  },
  { timestamps: true }
);

appointmentSlotSchema.index({ windowId: 1, slotDate: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('AppointmentSlot', appointmentSlotSchema);
