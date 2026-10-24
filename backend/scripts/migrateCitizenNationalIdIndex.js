const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running this migration.');
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection('citizenidentities');

  const duplicateCurrentAccounts = await collection.aggregate([
    { $match: { archivedAt: null } },
    { $group: { _id: '$fanHash', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).toArray();
  if (duplicateCurrentAccounts.length) {
    throw new Error('Multiple non-archived citizen accounts share a National ID hash. Resolve those duplicates before migrating the index.');
  }

  const duplicateEmails = await collection.aggregate([
    { $match: { email: { $type: 'string' } } },
    { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]).toArray();
  if (duplicateEmails.length) {
    throw new Error('Multiple citizen accounts share an email address. Resolve those duplicates before migrating the email index.');
  }

  const indexes = await collection.indexes();
  for (const index of indexes) {
    if (index.key?.fanHash === 1) await collection.dropIndex(index.name);
  }
  const emailIndexes = indexes.filter((index) =>
    Object.keys(index.key || {}).length === 1 && index.key.email === 1
  );
  for (const index of emailIndexes) {
    const isDesiredIndex = index.unique &&
      index.partialFilterExpression?.email?.$type === 'string';
    if (!isDesiredIndex) await collection.dropIndex(index.name);
  }

  await collection.createIndex(
    { fanHash: 1 },
    {
      unique: true,
      partialFilterExpression: { archivedAt: null },
      name: 'fanHash_current_unique',
    }
  );
  await collection.createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
      name: 'email_1',
    }
  );
}

migrate()
  .then(() => console.log('Citizen National ID and optional-email indexes are ready.'))
  .catch((error) => {
    console.error('Citizen identity index migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
