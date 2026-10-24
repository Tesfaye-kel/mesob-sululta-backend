const express = require('express');

const {
  getAllWindows,
  getAllWindowsGroupedByFloor,
  getWindowsByOrganization,
  getWindowById,
  getServicesByWindow,
  getAvailableServicesForWindow,
} = require('../controllers/windowController');

const router = express.Router();

// Public
router.get('/', getAllWindows);
router.get('/grouped-by-floor', getAllWindowsGroupedByFloor);
router.get('/by-organization/:orgId', getWindowsByOrganization);
router.get('/:id/services', getServicesByWindow);
router.get('/:id/available-services', getAvailableServicesForWindow);
router.get('/:id', getWindowById);

module.exports = router;
