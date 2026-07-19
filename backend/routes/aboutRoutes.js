const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getAbout,
  upsertAbout,
  addStory,
  updateStory,
  deleteStory,
  addValue,
  updateValue,
  deleteValue,
  addStat,
  updateStat,
  deleteStat,
} = require('../controllers/aboutController');

const router = express.Router();

// Public
router.get('/', getAbout);

// Admin only
router.put('/', authenticateJWT, requireAdmin, upsertAbout);

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

module.exports = router;