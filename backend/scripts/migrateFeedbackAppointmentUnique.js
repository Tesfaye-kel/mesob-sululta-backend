const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running this migration.');
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection('feedbackrequests');
  const duplicates = await collection.aggregate([
    { $group: { _id: '$appointmentId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).toArray();
  if (duplicates.length) {
    throw new Error('Feedback records contain duplicate appointment IDs. Resolve duplicates before applying the unique index.');
  }

  const indexes = await collection.indexes();
  const appointmentIndex = indexes.find((index) =>
    Object.keys(index.key || {}).length === 1 && index.key.appointmentId === 1
  );
  if (appointmentIndex && !appointmentIndex.unique) {
    await collection.dropIndex(appointmentIndex.name);
  }
  await collection.createIndex({ appointmentId: 1 }, { unique: true, name: 'appointmentId_1' });
}

migrate()
  .then(() => console.log('Feedback appointment uniqueness index is ready.'))
  .catch((error) => {
    console.error('Feedback appointment uniqueness migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
