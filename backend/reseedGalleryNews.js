// Script to clear empty gallery/news items and re-seed
require('dotenv').config();
const mongoose = require('mongoose');
const Gallery = require('./models/Gallery');
const News = require('./models/News');
const { seedGallery, seedNews } = require('./seedContent');

async function reseed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Delete all existing gallery items
  const delGallery = await Gallery.deleteMany({});
  console.log(`Deleted ${delGallery.deletedCount} old gallery items`);

  // Delete all existing news items
  const delNews = await News.deleteMany({});
  console.log(`Deleted ${delNews.deletedCount} old news items`);

  // Re-seed
  await seedGallery();
  await seedNews();

  // Verify
  const galleryCount = await Gallery.countDocuments();
  const newsCount = await News.countDocuments();
  console.log(`Gallery now has ${galleryCount} items`);
  console.log(`News now has ${newsCount} items`);

  await mongoose.disconnect();
  console.log('Done! Restart the backend server now.');
}

reseed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});