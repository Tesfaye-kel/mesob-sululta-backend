// Run with: node seedAdmin.js
// Creates the initial admin user for the admin panel

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to seed the initial administrator.');
    }

    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin user already exists:');
      console.log(`  Email: ${email}`);
      console.log('  (Use existing password or create a new user)');
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email,
        password,
        role: 'admin',
      });
      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();