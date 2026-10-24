const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, portalLogin, setInitialPortalPassword, getMe, updateRegistrarProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

const portalLoginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait before trying again.' },
});

router.post('/register', register);
router.post('/login', login);
router.post('/portal-login', portalLoginLimit, portalLogin);
router.post('/portal-first-password', portalLoginLimit, setInitialPortalPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateJWT, getMe);
router.put('/registrar/profile', authenticateJWT, requireRole('registrar'), updateRegistrarProfile);

module.exports = router;
