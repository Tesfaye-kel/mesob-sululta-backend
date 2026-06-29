const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getServicesByOrganization,
} = require('../controllers/serviceController');

const router = express.Router();

router.get('/', getAllServices);
router.get('/:id', getServiceById);

router.get('/by-organization/:organizationId', getServicesByOrganization);

router.post('/', authenticateJWT, requireAdmin, createService);
router.put('/:id', authenticateJWT, requireAdmin, updateService);
router.delete('/:id', authenticateJWT, requireAdmin, deleteService);

module.exports = router;

