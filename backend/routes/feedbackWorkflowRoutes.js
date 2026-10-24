const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAnyRole } = require('../middleware/rbacMiddleware');
const { listFeedbackRequests, respondToFeedback } = require('../controllers/feedbackWorkflowController');

const router = express.Router();
router.use(authenticateJWT, requireAnyRole(['feedback_officer', 'super_admin']));
router.get('/', listFeedbackRequests);
router.patch('/:feedbackId', respondToFeedback);

module.exports = router;
