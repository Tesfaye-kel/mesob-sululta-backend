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
      enum: ['image', 'video', 'audio', 'document', 'other', 'youtube'],
      required: true,
    },
    url: { type: String, required: true },
    caption: { ...localizedString },
    altText: { ...localizedString },
    description: { ...localizedString },
    displayOrder: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    isCover: { type: Boolean, default: false },
  },
  { _id: true }
);

const newsSchema = new mongoose.Schema(
  {
    title: { ...localizedString, en: { type: String, required: true } },
    content: { ...localizedString, en: { type: String, required: true } },
    excerpt: { ...localizedString },
    category: {
      type: String,
      enum: ['news', 'notice', 'event', 'holiday', 'document', 'update'],
      default: 'news',
    },
    author: { ...localizedString },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    coverImageUrl: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    media: [mediaSchema],
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Index for efficient queries
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ isPublished: 1, publishedAt: -1 });
newsSchema.index({ category: 1, publishedAt: -1 });
newsSchema.index({ tags: 1 });

module.exports = mongoose.model('News', newsSchema);
