const mongoose = require('mongoose');

const citizenIdentitySchema = new mongoose.Schema(
  {
    fanHash: { type: String, required: true, select: false },
    fanLastFour: { type: String, default: '', select: false },
    email: { type: String, default: null, lowercase: true, trim: true },
    password: { type: String, default: null, select: false },
    phoneEncrypted: { type: String, default: '', select: false },
    displayName: { type: String, default: '' },
    occupation: { type: String, default: '' },
    verifiedBy: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'approved', 'active', 'rejected', 'suspended'], default: 'pending', index: true },
    isActive: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null, index: true },
    registrationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    registrationReviewedAt: { type: Date, default: null },
    invitationToken: { type: String, default: null, select: false },
    invitationExpiresAt: { type: Date, default: null },
    invitationUsedAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null },
    passwordResetUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

citizenIdentitySchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

citizenIdentitySchema.index(
  { fanHash: 1 },
  { unique: true, partialFilterExpression: { archivedAt: null }, name: 'fanHash_current_unique' }
);

module.exports = mongoose.model('CitizenIdentity', citizenIdentitySchema);
