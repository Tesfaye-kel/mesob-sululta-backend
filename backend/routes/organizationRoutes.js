const express = require('express');

const {
  getAllOrganizations,
  getOrganizationById,
  getServicesByOrganization,
  getOrganizationWithWindows,
} = require('../controllers/organizationController');

const router = express.Router();

router.get('/', getAllOrganizations);
router.get('/:id/services', getServicesByOrganization);
router.get('/:id/with-windows', getOrganizationWithWindows);
router.get('/:id', getOrganizationById);

module.exports = router;
