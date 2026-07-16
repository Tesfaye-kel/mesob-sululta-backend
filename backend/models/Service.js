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
      required: true,
      index: true,
    },
    requiredDocuments: {
      type: [String],
      default: [],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);

