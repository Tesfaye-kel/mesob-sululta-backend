const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getContactMessages,
  getContactMessage,
  createContactMessage,
  updateContactMessage,
  deleteContactMessage,
  markAsRead,
} = require('../controllers/contactMessageController');

const router = express.Router();

// Public - for submitting contact/feedback forms
router.post('/', createContactMessage);

// Admin only
router.get('/', authenticateJWT, requireAdmin, getContactMessages);
router.get('/:id', authenticateJWT, requireAdmin, getContactMessage);
router.put('/:id', authenticateJWT, requireAdmin, updateContactMessage);
router.put('/:id/read', authenticateJWT, requireAdmin, markAsRead);
router.delete('/:id', authenticateJWT, requireAdmin, deleteContactMessage);

module.exports = router;