const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const Requirement = require('../models/Requirement');

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
router.get('/by-organization/:organizationId', getServicesByOrganization);

// GET /api/services/:id/requirements  — public shortcut
router.get('/:id/requirements', async (req, res, next) => {
  try {
    const requirements = await Requirement.find({ service: req.params.id })
      .sort({ sequenceNo: 1 });
    return res.json(requirements);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', getServiceById);

router.post('/', authenticateJWT, requireAdmin, createService);
router.put('/:id', authenticateJWT, requireAdmin, updateService);
router.delete('/:id', authenticateJWT, requireAdmin, deleteService);

module.exports = router;

