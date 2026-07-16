const Window = require('../models/Window');
const Service = require('../models/Service');

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
      .populate('organization', 'name logoUrl')
      .populate('services', 'name description fee processingTime workingHours contactPhone requiredDocuments')
      .sort({ number: 1 });

    // Aggregate: group by window number and sum serviceCount
    const grouped = new Map();
    for (const win of windows) {
      const key = win.number;
      if (!grouped.has(key)) {
        grouped.set(key, {
          _id: win._id,
          number: win.number,
          serviceCount: 0,
          organizations: [],
        });
      }
      const entry = grouped.get(key);
      entry.serviceCount += win.services.length;
      entry.organizations.push(win.organization);
    }

    return res.json(Array.from(grouped.values()).sort((a, b) => a.number - b.number));
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/grouped
// Returns windows grouped by number for accordion UI
const getGroupedWindows = async (req, res, next) => {
  try {
    const windows = await Window.find()
      .populate('organization', 'name logoUrl description')
      .populate('services', 'name description fee processingTime workingHours contactPhone requiredDocuments')
      .sort({ number: 1 });

    const groupedMap = new Map();

    for (const win of windows) {
      if (!groupedMap.has(win.number)) {
        groupedMap.set(win.number, { number: win.number, organizations: [] });
      }
      groupedMap.get(win.number).organizations.push({
        organization: win.organization,
        services: win.services,
      });
    }

    const grouped = Array.from(groupedMap.values()).sort((a, b) => a.number - b.number);
    return res.json(grouped);
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

// GET /api/windows/:id/services
const getServicesByWindow = async (req, res, next) => {
  try {
    const { id } = req.params;

    // id is the window NUMBER (1–11) sent from the frontend
    const num = Number(id);
    let windowDocs = [];

    if (!isNaN(num)) {
      // Primary path: lookup by window number — merges all org-split docs
      windowDocs = await Window.find({ number: num }).populate({
        path: 'services',
        populate: { path: 'organization', select: 'name' },
      });
    }

    // Fallback: try by _id in case someone calls the old way
    if (!windowDocs.length && id.match(/^[a-f\d]{24}$/i)) {
      windowDocs = await Window.find({ _id: id }).populate({
        path: 'services',
        populate: { path: 'organization', select: 'name' },
      });
    }

    if (!windowDocs.length) {
      return res.status(404).json({ message: 'Window not found' });
    }

    // Merge services from all Window docs for this number (de-duplicate)
    const seen = new Set();
    const services = [];
    for (const win of windowDocs) {
      for (const svc of win.services) {
        const key = String(svc._id);
        if (!seen.has(key)) {
          seen.add(key);
          services.push(svc);
        }
      }
    }

    return res.json(services);
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
  getGroupedWindows,
  getWindowById,
  getServicesByWindow,
  updateWindow,
  deleteWindow,
};