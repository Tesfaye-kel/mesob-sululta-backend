const mongoose = require('mongoose');

const localizedString = {
  en: { type: String, default: '' },
  am: { type: String, default: '' },
  or: { type: String, default: '' },
};

const contactSchema = new mongoose.Schema(
  {
    address: localizedString,
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    workingHours: localizedString,
    mapEmbedUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
