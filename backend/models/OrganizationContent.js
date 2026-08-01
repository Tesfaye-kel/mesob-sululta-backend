const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const leadershipSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  role: localizedString,
  avatar: { type: String, default: '' },
  color: { type: String, default: 'bg-brand-green' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const organizationContentSchema = new mongoose.Schema(
  {
    leadership: [leadershipSchema],
    futureExpansion: localizedString,
    hierarchyTitle: localizedString,
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrganizationContent', organizationContentSchema);