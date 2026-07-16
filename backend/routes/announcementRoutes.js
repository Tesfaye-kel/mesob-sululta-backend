const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

// Public
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);

// Admin only
router.post('/', authenticateJWT, requireAdmin, createAnnouncement);
router.put('/:id', authenticateJWT, requireAdmin, updateAnnouncement);
router.delete('/:id', authenticateJWT, requireAdmin, deleteAnnouncement);

module.exports = router;