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
const { uploadRoot } = require('./utils/uploadPaths');
const User = require('./models/User');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { ensureDefaultOfficeWindows } = require('./utils/ensureDefaultOfficeWindows');

const app = express();

// Security headers (relaxed for cross-origin image loading in dev)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Serve uploaded files
app.use('/uploads', express.static(uploadRoot));

// Rate limiting (simple protection against brute-force / abuse)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // max requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    // Public/admin pages poll read-only data; rate-limit mutations and auth requests instead.
    skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
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

async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('Admin bootstrap skipped; configure ADMIN_EMAIL and ADMIN_PASSWORD to create an initial administrator.');
    return;
  }

  try {
    const existing = await User.findOne({ email });

    if (!existing && !(await User.exists({ role: 'admin' }))) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email,
        password,
        role: 'admin',
      });
      console.log('Initial admin account created from configured environment values.');
      return;
    }

    if (!existing) {
      console.log('An administrator already exists; initial admin creation skipped.');
      return;
    }

    if (existing.role !== 'admin') {
      console.warn('Configured ADMIN_EMAIL belongs to a non-admin account; no role changes were made.');
    }
  } catch (err) {
    console.error('Failed to ensure default admin:', err.message);
  }
}

async function ensureDefaultPortalAccounts() {
  const portalUsers = [
    {
      email: process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase(),
      password: process.env.SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
      role: 'super_admin',
    },
    {
      email: process.env.OFFICE_ADMIN_EMAIL?.trim().toLowerCase(),
      password: process.env.OFFICE_ADMIN_PASSWORD,
      name: 'Office Admin',
      role: 'office_admin',
    },
    {
      email: process.env.FEEDBACK_OFFICER_EMAIL?.trim().toLowerCase(),
      password: process.env.FEEDBACK_OFFICER_PASSWORD,
      name: 'Feedback Officer',
      role: 'feedback_officer',
    },
  ];

  for (const portalUser of portalUsers) {
    if (!portalUser.email || !portalUser.password) continue;
    try {
      const existing = await User.findOne({ email: portalUser.email });
      if (!existing) {
        await User.create({
          name: portalUser.name,
          email: portalUser.email,
          password: portalUser.password,
          role: portalUser.role,
          status: 'active',
        });
        console.log(`✅ Default ${portalUser.role} created: ${portalUser.email}`);
        continue;
      }

      if (existing.role !== portalUser.role) {
        console.warn(`Configured ${portalUser.role} email belongs to another role; no role changes were made.`);
      }
    } catch (error) {
      console.error(`Failed to ensure ${portalUser.role} account:`, error.message);
    }
  }
}

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) throw new Error('Set MONGODB_URI or MONGO_URI before starting the server.');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('MongoDB connected successfully');
      await ensureDefaultAdmin();
      await ensureDefaultPortalAccounts();
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

connectWithRetry()
  .then(async () => {
    const officeWindows = await ensureDefaultOfficeWindows();
    console.log(
      `Default office windows ready: ${officeWindows.createdWindows} created, ${officeWindows.assignedServices} services assigned`
    );
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize default office windows:', err);
    process.exit(1);
  });
