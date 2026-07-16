const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
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
    logoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);

