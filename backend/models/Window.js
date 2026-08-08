const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema(
  {
    // Window number (1, 2, 3...)
    number: { type: Number, required: true },

    // Bilingual display name
    name: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },

    // The floor this window belongs to
    floor: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    description: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Unique window number per organization (sparse allows multiple nulls)
windowSchema.index({ organization: 1, number: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Window', windowSchema);
