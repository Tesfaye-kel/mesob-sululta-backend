const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema(
  {
    // e.g. "Foddaa 1", "Window 1" -- label shown to citizens
    number: { type: String, required: true, trim: true },

    // The floor (1-5) this window belongs to
    floor: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    description: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Ensure unique window name per organization
windowSchema.index({ organization: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Window', windowSchema);