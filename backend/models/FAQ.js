const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const faqSchema = new mongoose.Schema(
  {
    question: { ...localizedString, en: { type: String, required: true } },
    answer: { ...localizedString, en: { type: String, required: true } },
    category: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FAQ', faqSchema);