const mongoose = require('mongoose');
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
    const match = {};
    if (organization) match.organization = new mongoose.Types.ObjectId(organization);

    const windows = await Window.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'window',
          as: 'services',
        },
      },
      {
        $addFields: {
          serviceCount: { $size: '$services' },
        },
      },
      { $sort: { floor: 1, number: 1 } },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      {
        $addFields: {
          organization: { $arrayElemAt: ['$orgInfo', 0] },
        },
      },
      { $project: { services: 0, orgInfo: 0, 'organization.createdAt': 0, 'organization.updatedAt': 0, 'organization.__v': 0 } },
    ]);

    return res.json(windows);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/by-organization/:orgId
// Returns windows grouped by floor for a specific organization
const getWindowsByOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    // Use aggregation to avoid N+1 query problem
    const windows = await Window.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
      { $sort: { floor: 1, number: 1 } },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'window',
          as: 'services',
        },
      },
      {
        $addFields: {
          serviceCount: { $size: '$services' },
        },
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      {
        $addFields: {
          organization: { $arrayElemAt: ['$orgInfo', 0] },
        },
      },
      { $project: { services: 0, orgInfo: 0, 'organization.createdAt': 0, 'organization.updatedAt': 0, 'organization.__v': 0 } },
    ]);

    // Group by floor
    const grouped = new Map();
    for (const win of windows) {
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

// PUT /api/windows/:id/assign-services
const assignServicesToWindow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body; // array of service IDs that should belong to this window

    // Verify window exists
    const win = await Window.findById(id);
    if (!win) return res.status(404).json({ message: 'Window not found' });

    // Get the list of services currently assigned to this window
    const currentServiceIds = await Service.find({ window: id }).distinct('_id');
    const currentIds = currentServiceIds.map(s => s.toString());
    const targetIds = (serviceIds || []).map(s => s.toString());

    // Services to REMOVE from this window (currently assigned but NOT in the new list)
    const toRemove = currentIds.filter(cid => !targetIds.includes(cid));
    if (toRemove.length > 0) {
      await Service.updateMany({ _id: { $in: toRemove } }, { window: null });
    }

    // Services to ADD to this window (in the new list but NOT currently assigned)
    const toAdd = targetIds.filter(tid => !currentIds.includes(tid));
    if (toAdd.length > 0) {
      // First unassign them from any other window they might belong to
      await Service.updateMany({ _id: { $in: toAdd } }, { window: null });
      // Then assign them to this window
      await Service.updateMany(
        { _id: { $in: toAdd }, organization: win.organization },
        { window: id }
      );
    }

    // Return updated services for this window
    const services = await Service.find({ window: id })
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    return res.json({ message: 'Services updated successfully', services });
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/:id/available-services
// Returns services belonging to the same organization that are NOT assigned to this window
const getAvailableServicesForWindow = async (req, res, next) => {
  try {
    const { id } = req.params;

    const win = await Window.findById(id);
    if (!win) return res.status(404).json({ message: 'Window not found' });

    // Services that belong to the same org but are NOT assigned to this window
    const services = await Service.find({
      organization: win.organization,
      $or: [
        { window: null },
        { window: { $ne: id } },
      ],
    })
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    return res.json(services);
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
  assignServicesToWindow,
  getAvailableServicesForWindow,
  deleteWindow,
};
