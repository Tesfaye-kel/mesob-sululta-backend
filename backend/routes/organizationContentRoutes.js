const express = require('express');
const multer = require('multer');
const path = require('path');
const { getUploadDir } = require('../utils/uploadPaths');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getOrganizationContent,
  upsertOrganizationContent,
  addLeadership,
  updateLeadership,
  deleteLeadership,
  uploadLeadershipAvatar,
} = require('../controllers/organizationContentController');

const router = express.Router();

// Configure multer for leadership avatar uploads
const uploadDir = getUploadDir('leadership');

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
router.get('/', getOrganizationContent);

// Admin only
router.put('/', authenticateJWT, requireAdmin, upsertOrganizationContent);

// Leadership sub-documents
router.post('/leadership', authenticateJWT, requireAdmin, addLeadership);
router.put('/leadership/:memberId', authenticateJWT, requireAdmin, updateLeadership);
router.delete('/leadership/:memberId', authenticateJWT, requireAdmin, deleteLeadership);

// Leadership avatar upload
router.post('/leadership/upload', authenticateJWT, requireAdmin, upload.single('avatar'), uploadLeadershipAvatar);

module.exports = router;
