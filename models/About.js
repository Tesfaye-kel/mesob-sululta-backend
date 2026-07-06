const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const aboutSchema = new mongoose.Schema(
  {
    mission: localizedString,
    vision: localizedString,
    objectives: localizedString,
    branchIntroduction: localizedString,
    history: localizedString,
  },
  { timestamps: true }
);

module.exports = mongoose.model('About', aboutSchema);
