const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: '' },
    quote: { ...localizedString, en: { type: String, required: true } },
    avatar: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);