const express = require('express');

const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const serviceRoutes = require('./serviceRoutes');
const windowRoutes = require('./windowRoutes');
const aboutRoutes = require('./aboutRoutes');
const contactRoutes = require('./contactRoutes');
const requirementRoutes = require('./requirementRoutes');
const newsRoutes = require('./newsRoutes');
const faqRoutes = require('./faqRoutes');
const testimonialRoutes = require('./testimonialRoutes');
const galleryRoutes = require('./galleryRoutes');
const contactMessageRoutes = require('./contactMessageRoutes');
const adminRoutes = require('./adminRoutes');
const organizationContentRoutes = require('./organizationContentRoutes');
const socialMediaRoutes = require('./socialMediaRoutes');
const floorRoutes = require('./floorRoutes');
const officeRoutes = require('./officeRoutes');
const feedbackRoutes = require('./feedbackRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/services', serviceRoutes);
router.use('/windows', windowRoutes);
router.use('/about', aboutRoutes);
router.use('/contact', contactRoutes);
router.use('/requirements', requirementRoutes);
router.use('/news', newsRoutes);
router.use('/faqs', faqRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/gallery', galleryRoutes);
router.use('/contact-messages', contactMessageRoutes);
router.use('/admin', adminRoutes);
router.use('/organization-content', organizationContentRoutes);
router.use('/social-media', socialMediaRoutes);
router.use('/floors', floorRoutes);
router.use('/offices', officeRoutes);
router.use('/feedback-ratings', feedbackRoutes);

module.exports = router;
