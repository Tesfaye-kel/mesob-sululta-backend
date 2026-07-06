const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { getAbout, upsertAbout } = require('../controllers/aboutController');

const router = express.Router();

router.get('/', getAbout);
router.put('/', authenticateJWT, requireAdmin, upsertAbout);

module.exports = router;
