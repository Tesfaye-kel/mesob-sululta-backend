const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
    description: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
    caption: {
      en: { type: String, default: '' },
      am: { type: String, default: '' },
      or: { type: String, default: '' },
    },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    category: {
      type: String,
      enum: ['events', 'building', 'community', 'activities'],
      default: 'events',
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', gallerySchema);