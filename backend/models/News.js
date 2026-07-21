const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      required: true,
    },
    url: { type: String, required: true },
    caption: { ...localizedString },
  },
  { _id: false }
);

const newsSchema = new mongoose.Schema(
  {
    title: { ...localizedString, en: { type: String, required: true } },
    content: { ...localizedString, en: { type: String, required: true } },
    excerpt: { ...localizedString },
    category: {
      type: String,
      enum: ['news', 'notice', 'event', 'holiday', 'press', 'update'],
      default: 'news',
    },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    coverImageUrl: { type: String, default: '' },
    media: [mediaSchema],
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Index for efficient queries
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ isPublished: 1, publishedAt: -1 });
newsSchema.index({ category: 1, publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);