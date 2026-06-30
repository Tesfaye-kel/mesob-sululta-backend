const express = require('express');

const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const serviceRoutes = require('./serviceRoutes');
const windowRoutes = require('./windowRoutes');
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/services', serviceRoutes);
router.use('/windows', windowRoutes);   // <-- this line was missing

module.exports = router;