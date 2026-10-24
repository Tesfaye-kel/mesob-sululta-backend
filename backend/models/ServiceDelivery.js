const mongoose = require('mongoose');

const serviceDeliverySchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentBooking', required: true, unique: true },
    citizenIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenIdentity', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null, index: true },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    outcome: { type: String, default: '', trim: true, maxlength: 2000 },
    deliveryDetails: { type: String, default: '', maxlength: 4000 },
    actualAttendanceAt: { type: Date, default: null, index: true },
    feedbackDeadlineAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ['CHECKED_IN', 'AWAITING_APPROVAL', 'PENDING_ADMIN_APPROVAL', 'APPROVED', 'ATTENDANCE_APPROVED', 'REJECTED', 'ATTENDANCE_REJECTED'],
      default: 'PENDING_ADMIN_APPROVAL',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: '', maxlength: 2000 },
    submissionHistory: [{
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      actualAttendanceAt: { type: Date, required: true },
      outcome: { type: String, required: true },
      deliveryDetails: { type: String, default: '' },
      submittedAt: { type: Date, required: true },
    }],
    reviewHistory: [{
      reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      decision: { type: String, enum: ['ATTENDANCE_APPROVED', 'ATTENDANCE_REJECTED'], required: true },
      reason: { type: String, default: '' },
      decidedAt: { type: Date, required: true },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceDelivery', serviceDeliverySchema);
