const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running this migration.');

  await mongoose.connect(uri);
  const migrations = mongoose.connection.collection('migrationruns');
  const migrationId = 'employee-office-manager-category-v1';
  const existingMigration = await migrations.findOne({ _id: migrationId });
  if (existingMigration) {
    throw new Error(`Migration ${migrationId} is already ${existingMigration.status}. Inspect the migration record before retrying.`);
  }
  await migrations.insertOne({ _id: migrationId, status: 'running', startedAt: new Date() });

  for (const collectionName of ['users', 'employeeprofiles']) {
    const result = await mongoose.connection.collection(collectionName).updateMany(
      { employeeType: 'office_manager' },
      { $set: { employeeType: 'floor_window_manager' } },
    );
    console.log(`${collectionName}: ${result.modifiedCount} employees moved to Office, Floor and Window Manager.`);
  }

  await migrations.updateOne(
    { _id: migrationId },
    { $set: { status: 'completed', completedAt: new Date() } },
  );
}

migrate()
  .catch((error) => {
    console.error('Office Manager category migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
