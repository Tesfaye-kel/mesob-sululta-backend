// Load secret values from .env into process.env
require('dotenv').config();

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

// Security headers
app.use(helmet());

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

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    // Seed data on startup (keeps backend testable immediately)
     await seedOrganizations();
     await seedSiteContent();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
