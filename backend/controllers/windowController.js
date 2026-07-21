const Window = require('../models/Window');
const Service = require('../models/Service');

// POST /api/windows
const createWindow = async (req, res, next) => {
  try {
    const { number, floor, organization, description } = req.body;

    // Ensure floor is 1-5
    if (!floor || floor < 1 || floor > 5) {
      return res.status(400).json({ message: 'Floor must be between 1 and 5' });
    }

    const win = await Window.create({ number, floor, organization, description });
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
      .populate('organization', 'name logoUrl')
      .sort({ floor: 1, number: 1 });

    // Attach service count to each window
    const windowsWithCount = await Promise.all(
      windows.map(async (win) => {
        const serviceCount = await Service.countDocuments({ window: win._id });
        return { ...win.toObject(), serviceCount };
      })
    );

    return res.json(windowsWithCount);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/by-organization/:orgId
// Returns windows grouped by floor for a specific organization
const getWindowsByOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    const windows = await Window.find({ organization: orgId })
      .populate('organization', 'name logoUrl')
      .sort({ floor: 1, number: 1 });

    // Attach service count to each window
    const windowsWithCount = await Promise.all(
      windows.map(async (win) => {
        const serviceCount = await Service.countDocuments({ window: win._id });
        return { ...win.toObject(), serviceCount };
      })
    );

    // Group by floor
    const grouped = new Map();
    for (const win of windowsWithCount) {
      const floor = win.floor;
      if (!grouped.has(floor)) {
        grouped.set(floor, []);
      }
      grouped.get(floor).push(win);
    }

    const result = Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, wins]) => ({ floor, windows: wins }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/:id
const getWindowById = async (req, res, next) => {
  try {
    const win = await Window.findById(req.params.id)
      .populate('organization', 'name');

    if (!win) return res.status(404).json({ message: 'Window not found' });
    return res.json(win);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/:id/services
const getServicesByWindow = async (req, res, next) => {
  try {
    const { id } = req.params;

    const services = await Service.find({ window: id })
      .populate('organization', 'name')
      .populate('window', 'number floor')
      .sort({ createdAt: 1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// PUT /api/windows/:id
const updateWindow = async (req, res, next) => {
  try {
    const { number, floor, organization, description } = req.body;

    if (floor !== undefined && (floor < 1 || floor > 5)) {
      return res.status(400).json({ message: 'Floor must be between 1 and 5' });
    }

    const win = await Window.findByIdAndUpdate(
      req.params.id,
      { number, floor, organization, description },
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
    // Delete all services associated with this window
    await Service.deleteMany({ window: req.params.id });
    // Delete the window
    const win = await Window.findByIdAndDelete(req.params.id);
    if (!win) return res.status(404).json({ message: 'Window not found' });
    return res.json({ message: 'Window and associated services deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWindow,
  getAllWindows,
  getWindowsByOrganization,
  getWindowById,
  getServicesByWindow,
  updateWindow,
  deleteWindow,
};