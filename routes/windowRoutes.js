const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  createWindow,
  getAllWindows,
  getWindowById,
  updateWindow,
  deleteWindow,
} = require('../controllers/windowController');

const router = express.Router();

router.get('/', getAllWindows);
router.get('/:id', getWindowById);

router.post('/', authenticateJWT, requireAdmin, createWindow);
router.put('/:id', authenticateJWT, requireAdmin, updateWindow);
router.delete('/:id', authenticateJWT, requireAdmin, deleteWindow);

module.exports = router;