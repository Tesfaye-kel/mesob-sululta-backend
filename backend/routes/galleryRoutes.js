const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadGalleryImage,
} = require('../controllers/galleryController');

const router = express.Router();

// Configure multer for gallery image uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  },
});

// Public routes
router.get('/', getGalleryItems);
router.get('/:id', getGalleryItem);

// Protected routes (admin only)
router.post('/', authenticateJWT, requireAdmin, createGalleryItem);
router.post('/upload', authenticateJWT, requireAdmin, upload.single('image'), uploadGalleryImage);
router.put('/:id', authenticateJWT, requireAdmin, updateGalleryItem);
router.delete('/:id', authenticateJWT, requireAdmin, deleteGalleryItem);

module.exports = router;