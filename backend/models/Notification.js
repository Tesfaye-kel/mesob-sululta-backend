const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userModel: { type: String, enum: ['CitizenIdentity', 'User'], default: 'CitizenIdentity' },
    type: { type: String, enum: ['booking', 'reminder', 'cancellation', 'feedback_reply', 'feedback_request', 'employee_compliment', 'employee_message'], default: 'booking' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
