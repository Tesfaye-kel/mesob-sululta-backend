const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  getNewsList,
  getNewsItem,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsMedia,
  getLatestNews,
} = require('../controllers/newsController');

const router = express.Router();

// Configure multer for news media uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'news');
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for media
  fileFilter: (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|gif|webp|svg/;
    const allowedVideos = /mp4|webm|ogg/;
    const allowedAudio = /mp3|wav|ogg|aac/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowedImages.test(ext) ||
      allowedVideos.test(ext) ||
      allowedAudio.test(ext)
    ) {
      return cb(null, true);
    }
    cb(new Error('Only image, video, and audio files are allowed'));
  },
});

// Public routes
router.get('/', getNewsList);
router.get('/latest', getLatestNews);
router.get('/:id', getNewsItem);

// Protected routes (admin only)
router.post('/', authenticateJWT, requireAdmin, createNews);
router.post('/upload', authenticateJWT, requireAdmin, upload.single('media'), uploadNewsMedia);
router.put('/:id', authenticateJWT, requireAdmin, updateNews);
router.delete('/:id', authenticateJWT, requireAdmin, deleteNews);

module.exports = router;