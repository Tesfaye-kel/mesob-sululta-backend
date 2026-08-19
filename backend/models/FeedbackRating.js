const mongoose = require('mongoose');

const feedbackRatingSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    service: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedbackRating', feedbackRatingSchema);