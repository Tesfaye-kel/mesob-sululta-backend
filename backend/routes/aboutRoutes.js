const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getAbout,
  upsertAbout,
  uploadManagerPhoto,
  addStory, updateStory, deleteStory,
  addHighlight, updateHighlight, deleteHighlight,
  addValue, updateValue, deleteValue,
  addStat, updateStat, deleteStat,
} = require('../controllers/aboutController');

const router = express.Router();

// Configure multer for manager photo uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'manager');
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

// Public
router.get('/', getAbout);

// Admin only
router.put('/', authenticateJWT, requireAdmin, upsertAbout);

// Manager photo upload
router.post('/upload-manager-photo', authenticateJWT, requireAdmin, upload.single('photo'), uploadManagerPhoto);

// Story sub-documents
router.post('/stories', authenticateJWT, requireAdmin, addStory);
router.put('/stories/:storyId', authenticateJWT, requireAdmin, updateStory);
router.delete('/stories/:storyId', authenticateJWT, requireAdmin, deleteStory);

// Values sub-documents
router.post('/values', authenticateJWT, requireAdmin, addValue);
router.put('/values/:valueId', authenticateJWT, requireAdmin, updateValue);
router.delete('/values/:valueId', authenticateJWT, requireAdmin, deleteValue);

// Stats sub-documents
router.post('/stats', authenticateJWT, requireAdmin, addStat);
router.put('/stats/:statId', authenticateJWT, requireAdmin, updateStat);
router.delete('/stats/:statId', authenticateJWT, requireAdmin, deleteStat);

// Highlights sub-documents
router.post('/highlights', authenticateJWT, requireAdmin, addHighlight);
router.put('/highlights/:highlightId', authenticateJWT, requireAdmin, updateHighlight);
router.delete('/highlights/:highlightId', authenticateJWT, requireAdmin, deleteHighlight);

module.exports = router;

