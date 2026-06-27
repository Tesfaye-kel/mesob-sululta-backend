const mongoose = require('mongoose');

// This defines the "shape" every Floor document must follow.
// Mongoose will reject any data that doesn't match this shape.
const floorSchema = new mongoose.Schema({
  floorNumber: {
    type: Number,
    required: true,   // every floor MUST have a number
    unique: true       // no two floors can have the same number
  },
  name: {
    en: { type: String, required: true },
    am: { type: String, required: true },
    om: { type: String, required: true }
  },
  description: {
    en: { type: String, default: '' },
    am: { type: String, default: '' },
    om: { type: String, default: '' }
  }
}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model('Floor', floorSchema);