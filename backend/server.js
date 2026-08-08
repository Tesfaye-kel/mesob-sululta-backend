// Load secret values from .env into process.env
// Try multiple paths for different deployment environments (local, Vercel, etc.)
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
// Also try loading from the backend directory directly (useful for some deployment setups)
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { seedOrganizations} = require('./seed');
const { seedSiteContent } = require('./seedContent');

const app = express();

// Security headers (relaxed for cross-origin image loading in dev)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting (simple protection against brute-force / abuse)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // max requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Allow the frontend (different port) to send requests here
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Allow the server to understand JSON sent in requests
app.use(express.json());

// A simple test route — just to confirm the server is alive
app.get('/', (req, res) => {
  res.send('Mesob Sululta backend is running.');
});

app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i}/${retries} failed:`, err.message);
      if (i === retries) {
        console.error('\n=== CONNECTION FAILED ===');
        console.error('Your IP may not be whitelisted in MongoDB Atlas.');
        console.error('Go to: https://cloud.mongodb.com → Network Access → Add IP Address');
        console.error(`Current IP: check https://api.ipify.org`);
        console.error('========================\n');
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

connectWithRetry().then(async () => {
  await seedOrganizations();
  await seedSiteContent();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
