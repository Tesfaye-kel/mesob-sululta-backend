const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');

const router = express.Router();

// Public routes
router.get('/', getGalleryItems);
router.get('/:id', getGalleryItem);

// Protected routes (admin only)
router.post('/', authenticateJWT, requireAdmin, createGalleryItem);
router.put('/:id', authenticateJWT, requireAdmin, updateGalleryItem);
router.delete('/:id', authenticateJWT, requireAdmin, deleteGalleryItem);

module.exports = router;