const mongoose = require('mongoose');

const feedbackSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    percentages: {
      type: Map,
      of: { type: Number, min: 0, max: 100 },
      default: { 1: 90, 2: 92, 3: 94, 4: 97, 5: 100 },
    },
    showOverallProjectScore: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedbackSetting', feedbackSettingSchema);