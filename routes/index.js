const express = require('express');

const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const serviceRoutes = require('./serviceRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/services', serviceRoutes);

module.exports = router;

