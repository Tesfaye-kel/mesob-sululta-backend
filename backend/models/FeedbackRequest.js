const mongoose = require('mongoose');

const feedbackRequestSchema = new mongoose.Schema(
  {
    citizenIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenIdentity', required: true, index: true },
    serviceDeliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceDelivery', required: true, unique: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentBooking', required: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    employeeMessage: { type: String, default: '', maxlength: 2000 },
    employeeMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employeeMessageAt: { type: Date, default: null },
    feedbackDeadlineAt: { type: Date, default: null, index: true },
    type: { type: String, enum: ['compliment', 'complaint', 'suggestion'], required: true },
    category: { type: String, enum: ['service_quality', 'waiting_time', 'staff_conduct', 'suggestion'], default: 'service_quality', index: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'under_review', 'responded', 'resolved'], default: 'new' },
    adminArchivedAt: { type: Date, default: null, index: true },
    response: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    serviceDeliveredAt: { type: Date, default: null },
    appointmentDate: { type: Date, required: true },
  },
  { timestamps: true }
);

feedbackRequestSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackRequest', feedbackRequestSchema);
