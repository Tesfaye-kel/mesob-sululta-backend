const mongoose = require('mongoose');

const registrarSetupChangeSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['floor', 'office', 'window', 'service', 'requirement'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '', maxlength: 1000 },
    appliedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

registrarSetupChangeSchema.index({ status: 1, createdAt: 1 });
registrarSetupChangeSchema.index({ submittedBy: 1, status: 1 });

module.exports = mongoose.model('RegistrarSetupChange', registrarSetupChangeSchema);
