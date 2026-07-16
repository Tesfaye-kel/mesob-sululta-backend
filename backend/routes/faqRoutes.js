const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ,
} = require('../controllers/faqController');

// Public
router.get('/', getFAQs);
router.get('/:id', getFAQ);

// Admin only
router.post('/', authenticateJWT, requireAdmin, createFAQ);
router.put('/:id', authenticateJWT, requireAdmin, updateFAQ);
router.delete('/:id', authenticateJWT, requireAdmin, deleteFAQ);

module.exports = router;