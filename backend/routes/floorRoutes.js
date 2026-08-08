const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
} = require('../controllers/floorController');

const router = express.Router();

// Public: anyone can read floors
router.get('/', getAllFloors);
router.get('/:id', getFloorById);

// Admin-only: create, update, delete
router.post('/', authenticateJWT, requireAdmin, createFloor);
router.put('/:id', authenticateJWT, requireAdmin, updateFloor);
router.delete('/:id', authenticateJWT, requireAdmin, deleteFloor);

module.exports = router;
