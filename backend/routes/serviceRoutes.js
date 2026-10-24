const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireServiceManager } = require('../middleware/requireServiceManager');
const Requirement = require('../models/Requirement');

const {
  createService,
  getAllServices,
  getManageableServices,
  searchServices,
  getServiceById,
  updateService,
  deleteService,
  getServicesByOrganization,
  getServicesByWindow,
} = require('../controllers/serviceController');

const router = express.Router();

router.get('/', getAllServices);
router.get('/search', searchServices);
router.get('/by-organization/:organizationId', getServicesByOrganization);
router.get('/by-window/:windowId', getServicesByWindow);
router.get('/manage', authenticateJWT, requireServiceManager, getManageableServices);
router.get('/:id/requirements', async (req, res, next) => {
  try {
    const requirements = await Requirement.find({ service: req.params.id })
      .where({ isActive: { $ne: false } })
      .sort({ sequenceNo: 1 });
    return res.json(requirements);
  } catch (err) {
    next(err);
  }
});
router.get('/:id', getServiceById);

router.post('/', authenticateJWT, requireServiceManager, createService);
router.put('/:id', authenticateJWT, requireServiceManager, updateService);
router.delete('/:id', authenticateJWT, requireServiceManager, deleteService);

module.exports = router;
