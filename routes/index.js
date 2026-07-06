const express = require('express');

const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const serviceRoutes = require('./serviceRoutes');
const windowRoutes = require('./windowRoutes');
const aboutRoutes = require('./aboutRoutes');
const contactRoutes = require('./contactRoutes');
const requirementRoutes = require('./requirementRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/services', serviceRoutes);
router.use('/windows', windowRoutes);
router.use('/about', aboutRoutes);
router.use('/contact', contactRoutes);
router.use('/requirements', requirementRoutes);

module.exports = router;