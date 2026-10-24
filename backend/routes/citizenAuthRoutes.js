const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { requireVerifiedCitizen } = require('../middleware/citizenAuthMiddleware');
const {
  registerCitizen,
  loginCitizen,
  setupCitizenPassword,
  getPendingCitizenRegistrations,
  updateCitizenStatus,
  updateCitizenRegistration,
  resetCitizenPasswordInPerson,
  resendCitizenSetupLink,
  getCitizenProfile,
  changeCitizenPassword,
} = require('../controllers/citizenAuthController');
const { requestCitizenRemoval } = require('../controllers/accountRemovalController');

const router = express.Router();
const registrationLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again later.' },
});
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait before trying again.' },
});
router.post('/login', loginLimit, loginCitizen);
router.post('/first-password', loginLimit, setupCitizenPassword);
router.get('/profile', ...requireVerifiedCitizen, getCitizenProfile);
router.put('/password', ...requireVerifiedCitizen, changeCitizenPassword);

router.get('/registrar/registrations', authenticateJWT, requireRole('registrar'), getPendingCitizenRegistrations);
router.post('/registrar/register', registrationLimit, authenticateJWT, requireRole('registrar'), registerCitizen);
router.post('/registrar/registrations/:citizenId/setup-link', authenticateJWT, requireRole('registrar'), resendCitizenSetupLink);
router.post('/registrar/registrations/:citizenId/removal-request', authenticateJWT, requireRole('registrar'), requestCitizenRemoval);
router.put('/registrar/registrations/:citizenId', authenticateJWT, requireRole('registrar'), updateCitizenRegistration);
router.patch('/registrar/registrations/:citizenId/status', authenticateJWT, requireRole('registrar'), updateCitizenStatus);
router.post('/registrar/registrations/:citizenId/password-reset', authenticateJWT, requireRole('registrar'), resetCitizenPasswordInPerson);

module.exports = router;
