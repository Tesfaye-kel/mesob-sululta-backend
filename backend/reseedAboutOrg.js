const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mesob-sululta';

async function reseed() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  
  const About = require('./models/About');
  const OrganizationContent = require('./models/OrganizationContent');
  
  // Clear existing data
  await About.deleteMany({});
  await OrganizationContent.deleteMany({});
  console.log('Cleared About and OrganizationContent collections.');
  
  // Run the seed functions
  const { seedAbout, seedOrganizationContent } = require('./seedContent');
  await seedAbout();
  await seedOrganizationContent();
  
  console.log('Seed completed successfully!');
  await mongoose.disconnect();
}

reseed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});