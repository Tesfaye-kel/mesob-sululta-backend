const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getDashboardStats,
  getProfile,
  updateProfile,
  changePassword,
  registerAdmin,
  getUsers,
  deleteUser,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticateJWT, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Register new admin (only existing admin can do this)
router.post('/register', registerAdmin);

module.exports = router;