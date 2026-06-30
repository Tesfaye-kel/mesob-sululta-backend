const Window = require('../models/Window');

// POST /api/windows
const createWindow = async (req, res, next) => {
  try {
    const { number, organization, services } = req.body;

    const win = await Window.create({ number, organization, services });
    return res.status(201).json(win);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows
// Optional query: ?organization=<id> to filter by a specific organization
const getAllWindows = async (req, res, next) => {
  try {
    const { organization } = req.query;
    const filter = {};
    if (organization) filter.organization = organization;

    const windows = await Window.find(filter)
      .populate('organization', 'name')
      .populate('services', 'name')
      .sort({ number: 1 });

    return res.json(windows);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/:id
const getWindowById = async (req, res, next) => {
  try {
    const win = await Window.findById(req.params.id)
      .populate('organization', 'name')
      .populate('services', 'name');

    if (!win) return res.status(404).json({ message: 'Window not found' });
    return res.json(win);
  } catch (err) {
    next(err);
  }
};

// PUT /api/windows/:id
const updateWindow = async (req, res, next) => {
  try {
    const { number, organization, services } = req.body;

    const win = await Window.findByIdAndUpdate(
      req.params.id,
      { number, organization, services },
      { new: true, runValidators: true }
    );

    if (!win) return res.status(404).json({ message: 'Window not found' });
    return res.json(win);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/windows/:id
const deleteWindow = async (req, res, next) => {
  try {
    const win = await Window.findByIdAndDelete(req.params.id);
    if (!win) return res.status(404).json({ message: 'Window not found' });
    return res.json({ message: 'Window deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWindow,
  getAllWindows,
  getWindowById,
  updateWindow,
  deleteWindow,
};