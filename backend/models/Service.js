const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      am: { type: String, required: true, trim: true },
      or: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    window: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Window',
      default: null,
      index: true,
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    resourceLinks: {
      type: [{ type: String, maxlength: 500 }],
      default: [],
      validate: {
        validator: (links) => links.length <= 10 && links.every((link) => /^https?:\/\/[^\s]+$/i.test(link)),
        message: 'Provide no more than 10 resource links, each using HTTP or HTTPS.',
      },
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    processingTime: {
      type: String,
      default: '',
    },
    workingHours: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Index for efficient queries
serviceSchema.index({ organization: 1, window: 1 });

module.exports = mongoose.model('Service', serviceSchema);