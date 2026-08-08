const Floor = require('../models/Floor');

// GET /api/floors
const getAllFloors = async (req, res, next) => {
  try {
    const floors = await Floor.find().sort({ floorNumber: 1 });
    return res.json(floors);
  } catch (err) {
    next(err);
  }
};

// GET /api/floors/:id
const getFloorById = async (req, res, next) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    return res.json(floor);
  } catch (err) {
    next(err);
  }
};

// POST /api/floors
const createFloor = async (req, res, next) => {
  try {
    const { floorNumber, name, description } = req.body;
    const floor = await Floor.create({ floorNumber, name, description });
    return res.status(201).json(floor);
  } catch (err) {
    next(err);
  }
};

// PUT /api/floors/:id
const updateFloor = async (req, res, next) => {
  try {
    const { floorNumber, name, description } = req.body;
    const floor = await Floor.findByIdAndUpdate(
      req.params.id,
      { floorNumber, name, description },
      { new: true, runValidators: true }
    );
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    return res.json(floor);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/floors/:id
const deleteFloor = async (req, res, next) => {
  try {
    const floor = await Floor.findByIdAndDelete(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    return res.json({ message: 'Floor deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFloors, getFloorById, createFloor, updateFloor, deleteFloor };
