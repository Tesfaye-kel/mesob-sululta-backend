const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getTestimonials, getTestimonial, createTestimonial, updateTestimonial, deleteTestimonial,
} = require('../controllers/testimonialController');

// Public
router.get('/', getTestimonials);
router.get('/:id', getTestimonial);

// Admin only
router.post('/', authenticateJWT, requireAdmin, createTestimonial);
router.put('/:id', authenticateJWT, requireAdmin, updateTestimonial);
router.delete('/:id', authenticateJWT, requireAdmin, deleteTestimonial);

module.exports = router;