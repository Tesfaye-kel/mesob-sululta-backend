const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const announcementSchema = new mongoose.Schema(
  {
    title: { ...localizedString, en: { type: String, required: true } },
    content: { ...localizedString, en: { type: String, required: true } },
    category: {
      type: String,
      enum: ['notice', 'event', 'news', 'holiday', 'press'],
      default: 'notice',
    },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);