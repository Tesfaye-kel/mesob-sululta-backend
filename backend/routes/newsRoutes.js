const express = require('express');
const multer = require('multer');
const path = require('path');
const { getUploadDir } = require('../utils/uploadPaths');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  getNewsList,
  getNewsItem,
  getRelatedNews,
  getCategories,
  getTags,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsMedia,
  uploadMultipleMedia,
  deleteMedia,
  getLatestNews,
} = require('../controllers/newsController');

const router = express.Router();

// Configure multer for news media uploads
const uploadDir = getUploadDir('news');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for media
  fileFilter: (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|gif|webp|svg/;
    const allowedVideos = /mp4|webm|ogg|mov|avi/;
    const allowedAudio = /mp3|wav|ogg|aac|m4a/;
    const allowedDocs = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowedImages.test(ext) ||
      allowedVideos.test(ext) ||
      allowedAudio.test(ext) ||
      allowedDocs.test(ext)
    ) {
      return cb(null, true);
    }
    cb(new Error('Only image, video, audio, and document files are allowed'));
  },
});

// Public routes
router.get('/', getNewsList);
router.get('/latest', getLatestNews);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/related/:id', getRelatedNews);
router.get('/:id', getNewsItem);

// Protected routes (admin only)
router.post('/', authenticateJWT, requireAdmin, createNews);
router.post('/upload', authenticateJWT, requireAdmin, upload.single('media'), uploadNewsMedia);
router.post('/upload-multiple', authenticateJWT, requireAdmin, upload.array('media', 20), uploadMultipleMedia);
router.put('/:id', authenticateJWT, requireAdmin, updateNews);
router.delete('/:id', authenticateJWT, requireAdmin, deleteNews);
router.delete('/media/:filename', authenticateJWT, requireAdmin, deleteMedia);

module.exports = router;
