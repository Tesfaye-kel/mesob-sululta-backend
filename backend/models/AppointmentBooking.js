const mongoose = require('mongoose');

const appointmentBookingSchema = new mongoose.Schema(
  {
    citizenIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenIdentity', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceDelivery', default: null, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null, index: true },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null, index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentSlot', required: true, index: true },
    slotDate: { type: Date, required: true },
    session: { type: String, enum: ['session1', 'session2'], required: true },
    queueNumber: { type: Number, default: 0 },
    dailyBookingActive: { type: Boolean, default: true, select: false },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'DELIVERED', 'CANCELLED', 'NO_SHOW'],
      default: 'CONFIRMED',
    },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    notes: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
    feedbackDeadlineAt: { type: Date, default: null, index: true },
    startedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    appointmentReference: { type: String, required: true, unique: true, index: true },
    confirmedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

appointmentBookingSchema.index(
  { citizenIdentityId: 1, officeId: 1, slotDate: 1 },
  {
    unique: true,
    partialFilterExpression: { dailyBookingActive: true },
  }
);

module.exports = mongoose.model('AppointmentBooking', appointmentBookingSchema);
