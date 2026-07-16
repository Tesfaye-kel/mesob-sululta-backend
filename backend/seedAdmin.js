// Run with: node seedAdmin.js
// Creates the initial admin user for the admin panel

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@mesob.et' });
    if (existing) {
      console.log('Admin user already exists:');
      console.log(`  Email: admin@mesob.et`);
      console.log('  (Use existing password or create a new user)');
    } else {
      await User.create({
        name: 'Admin',
        email: 'admin@mesob.et',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@mesob.et');
      console.log('   Password: admin123');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();