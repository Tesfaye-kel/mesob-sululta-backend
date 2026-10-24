const express = require('express');
const {
  getAllFloors,
  getFloorById,
} = require('../controllers/floorController');

const router = express.Router();

// Public: anyone can read floors
router.get('/', getAllFloors);
router.get('/:id', getFloorById);

module.exports = router;
