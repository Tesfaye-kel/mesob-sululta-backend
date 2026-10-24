const mongoose = require('mongoose');

const otpChallengeSchema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true, unique: true },
    fanHash: { type: String, required: true, index: true },
    otpHash: { type: String, required: true, select: false },
    phoneMasked: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    resendAvailableAt: { type: Date, required: true },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
