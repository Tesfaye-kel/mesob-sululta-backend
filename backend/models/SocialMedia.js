const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'telegram', 'youtube', 'tiktok', 'whatsapp', 'other'],
    },
    icon: { type: String, default: '' },
    url: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    openInNewTab: { type: Boolean, default: true },
  },
  { timestamps: true }
);

socialMediaSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
