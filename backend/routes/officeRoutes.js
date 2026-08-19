const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
} = require('../controllers/officeController');

const router = express.Router();

// Public routes
router.get('/', getAllOffices);
router.get('/:id', getOfficeById);

// Protected routes (admin only)
router.post('/', authenticateJWT, requireAdmin, createOffice);
router.put('/:id', authenticateJWT, requireAdmin, updateOffice);
router.delete('/:id', authenticateJWT, requireAdmin, deleteOffice);

module.exports = router;
