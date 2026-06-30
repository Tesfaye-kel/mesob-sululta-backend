const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema(
  {
    // e.g. "Foddaa 1", "Window 1" -- label shown to citizens
    number: { type: Number, required: true },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    // A window can handle one or more services
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Window', windowSchema);