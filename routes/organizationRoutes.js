const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} = require('../controllers/organizationController');

const router = express.Router();

router.get('/', getAllOrganizations);
router.get('/:id', getOrganizationById);

router.post('/', authenticateJWT, requireAdmin, createOrganization);
router.put('/:id', authenticateJWT, requireAdmin, updateOrganization);
router.delete('/:id', authenticateJWT, requireAdmin, deleteOrganization);

module.exports = router;

