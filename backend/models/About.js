const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const aboutValueSchema = new mongoose.Schema({
  icon: { type: String, default: 'Heart' },
  title: localizedString,
  description: localizedString,
  order: { type: Number, default: 0 },
}, { timestamps: true });

const aboutStatSchema = new mongoose.Schema({
  value: { type: String, default: '' },
  label: localizedString,
  order: { type: Number, default: 0 },
}, { timestamps: true });

const aboutStorySchema = new mongoose.Schema({
  paragraph: localizedString,
  order: { type: Number, default: 0 },
}, { timestamps: true });

const aboutSchema = new mongoose.Schema(
  {
    mission: localizedString,
    vision: localizedString,
    objectives: localizedString,
    branchIntroduction: localizedString,
    history: localizedString,
    // New fields for comprehensive About management
    story: [aboutStorySchema],
    values: [aboutValueSchema],
    stats: [aboutStatSchema],
    managerMessage: localizedString,
    managerName: { type: String, default: '' },
    managerTitle: localizedString,
  },
  { timestamps: true }
);

module.exports = mongoose.model('About', aboutSchema);