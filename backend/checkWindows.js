require('dotenv').config();
const mongoose = require('mongoose');
require('./models/Service'); // register schema first
require('./models/Organization');
const Window = require('./models/Window');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const wins = await Window.find()
    .populate('services', 'name')
    .sort({ number: 1 });

  const grouped = new Map();
  for (const w of wins) {
    if (!grouped.has(w.number)) grouped.set(w.number, new Set());
    for (const s of w.services) grouped.get(w.number).add(s._id.toString());
  }

  for (const [num, ids] of [...grouped.entries()].sort((a, b) => a[0] - b[0])) {
    console.log('Foddaa', num, ':', ids.size, 'services');
  }

  // Also show Foddaa 1 service names
  console.log('\n--- Foddaa 1 services ---');
  const foddaa1 = wins.filter(w => w.number === 1);
  const seen = new Set();
  for (const w of foddaa1) {
    for (const s of w.services) {
      if (!seen.has(s._id.toString())) {
        seen.add(s._id.toString());
        console.log(' -', s.name?.or || s.name?.en);
      }
    }
  }

  await mongoose.disconnect();
});
