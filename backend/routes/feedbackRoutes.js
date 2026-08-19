const express = require('express');
const { createFeedbackRating, getFeedbackDashboard } = require('../controllers/feedbackController');

const router = express.Router();
router.get('/', getFeedbackDashboard);
router.post('/', createFeedbackRating);

module.exports = router;