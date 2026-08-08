const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getActiveSocialMedia,
  getAllSocialMedia,
  getSocialMedia,
  createSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
} = require('../controllers/socialMediaController');

// Public routes
router.get('/', getActiveSocialMedia);

// Admin routes
router.get('/all', authenticateJWT, requireAdmin, getAllSocialMedia);
router.get('/:id', authenticateJWT, requireAdmin, getSocialMedia);
router.post('/', authenticateJWT, requireAdmin, createSocialMedia);
router.put('/:id', authenticateJWT, requireAdmin, updateSocialMedia);
router.delete('/:id', authenticateJWT, requireAdmin, deleteSocialMedia);

module.exports = router;
