const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running this migration.');

  await mongoose.connect(uri);
  const users = mongoose.connection.collection('users');
  const duplicates = await users.aggregate([
    { $match: { role: 'employee', phone: { $type: 'string', $gt: '' } } },
    { $group: { _id: '$phone', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).toArray();
  if (duplicates.length) {
    throw new Error('Employee records contain duplicate phone numbers. Resolve duplicates before applying the unique index.');
  }

  await users.createIndex(
    { phone: 1 },
    {
      unique: true,
      name: 'unique_employee_phone',
      partialFilterExpression: { role: 'employee', phone: { $type: 'string', $gt: '' } },
    }
  );
}

migrate()
  .then(() => console.log('Unique employee phone number index is ready.'))
  .catch((error) => {
    console.error('Employee phone number migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
