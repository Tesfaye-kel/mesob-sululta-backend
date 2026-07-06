const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  createRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getRequirementsByService,
  createBulkRequirements,
} = require('../controllers/requirementController');

const router = express.Router();

// Public routes
router.get('/', getAllRequirements);
router.get('/by-service/:serviceId', getRequirementsByService);
router.get('/:id', getRequirementById);

// Protected routes (admin only)
router.post('/bulk', authenticateJWT, requireAdmin, createBulkRequirements);
router.post('/', authenticateJWT, requireAdmin, createRequirement);
router.put('/:id', authenticateJWT, requireAdmin, updateRequirement);
router.delete('/:id', authenticateJWT, requireAdmin, deleteRequirement);

module.exports = router;
