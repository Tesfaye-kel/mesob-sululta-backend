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
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    logoUrl: { type: String, default: '' },
    closedWeekdays: {
      type: [Number],
      default: [0, 6],
      validate: {
        validator: (days) => days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
        message: 'Closed weekdays must be integers from 0 (Sunday) to 6 (Saturday).',
      },
    },
    timeZone: { type: String, default: 'Africa/Addis_Ababa' },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
