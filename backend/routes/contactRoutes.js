const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { getContact, upsertContact } = require('../controllers/contactController');

const router = express.Router();

router.get('/', getContact);
router.put('/', authenticateJWT, requireAdmin, upsertContact);

module.exports = router;
