const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireServiceManager } = require('../middleware/requireServiceManager');

const {
  createRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getRequirementsByService,
  getRequirementsForManagement,
} = require('../controllers/requirementController');

const router = express.Router();

// Public routes
router.get('/', getAllRequirements);
router.get('/by-service/:serviceId', getRequirementsByService);
router.get('/manage/by-service/:serviceId', authenticateJWT, requireServiceManager, getRequirementsForManagement);
router.get('/:id', getRequirementById);

router.post('/', authenticateJWT, requireServiceManager, createRequirement);
router.put('/:id', authenticateJWT, requireServiceManager, updateRequirement);
router.delete('/:id', authenticateJWT, requireServiceManager, deleteRequirement);

module.exports = router;
