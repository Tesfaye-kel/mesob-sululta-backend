const mongoose = require('mongoose');

const accountRemovalRequestSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['citizen', 'employee'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

accountRemovalRequestSchema.index(
  { targetType: 1, targetId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('AccountRemovalRequest', accountRemovalRequestSchema);
