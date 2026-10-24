const mongoose = require('mongoose');
const EmployeeProfile = require('../models/EmployeeProfile');
const User = require('../models/User');

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI before running this migration.');

  await mongoose.connect(uri);
  const migrations = mongoose.connection.collection('migrationruns');
  const migrationId = 'employee-category-remap-v1';
  const existingMigration = await migrations.findOne({ _id: migrationId });
  if (existingMigration) {
    throw new Error(`Migration ${migrationId} is already ${existingMigration.status}. Inspect the migration record before retrying.`);
  }
  await migrations.insertOne({ _id: migrationId, status: 'running', startedAt: new Date() });

  for (const model of [User, EmployeeProfile]) {
    const floorWindowManagers = await model.updateMany(
      { employeeType: 'service_window_officer' },
      { $set: { employeeType: 'floor_window_manager' } },
    );
    const serviceWindowOfficers = await model.updateMany(
      { employeeType: 'service_staff' },
      { $set: { employeeType: 'service_window_officer' } },
    );

    console.log(`${model.modelName}: ${floorWindowManagers.modifiedCount} employees moved to Office, Floor and Window Manager, ${serviceWindowOfficers.modifiedCount} Service Window Officers migrated.`);
  }
  await migrations.updateOne(
    { _id: migrationId },
    { $set: { status: 'completed', completedAt: new Date() } },
  );
}

migrate()
  .catch((error) => {
    console.error('Employee category migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
