const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    requirementText: {
      en: { type: String, required: true, trim: true },
      am: { type: String, required: true, trim: true },
      or: { type: String, required: true, trim: true },
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    sequenceNo: {
      type: Number,
      default: 0,
    },
    notes: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Index for efficient queries by service
requirementSchema.index({ service: 1, sequenceNo: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);
