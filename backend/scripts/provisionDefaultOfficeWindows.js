const mongoose = require('mongoose');
const { ensureDefaultOfficeWindows } = require('../utils/ensureDefaultOfficeWindows');

async function provision() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before provisioning office windows.');
  await mongoose.connect(uri);
  return ensureDefaultOfficeWindows();
}

provision()
  .then((result) => {
    console.log(`Default office windows ready: ${result.createdWindows} created, ${result.assignedServices} services assigned across ${result.offices} active offices.`);
  })
  .catch((error) => {
    console.error('Default office window provisioning failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
