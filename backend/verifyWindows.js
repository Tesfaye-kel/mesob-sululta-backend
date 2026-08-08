require('dotenv').config();
const mongoose = require('mongoose');
const Window = require('./models/Window');
const Service = require('./models/Service');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const windows = await Window.find();
  console.log('Total windows:', windows.length);

  const withServices = await Service.countDocuments({ window: { $ne: null } });
  console.log('Services linked to windows:', withServices);

  const win = windows[0];
  const svcs = await Service.find({ window: win._id }).select('name').limit(3);
  console.log('\nSample window', win.number, 'services:');
  for (const s of svcs) {
    console.log('  -', s.name.or || s.name.en);
  }

  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });