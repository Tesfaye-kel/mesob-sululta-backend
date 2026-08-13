const mongoose = require('mongoose');
const Window = require('../models/Window');
const Service = require('../models/Service');
const Floor = require('../models/Floor');

// POST /api/windows
const createWindow = async (req, res, next) => {
  try {
    const { number, name, floor, organization, description } = req.body;

    if (!floor || floor < 1) {
      return res.status(400).json({ message: 'Floor must be 1 or greater' });
    }

    const win = await Window.create({
      number,
      name: name || { en: '', am: '', or: '' },
      floor,
      organization: organization || null,
      description: description || { en: '', am: '', or: '' },
    });

    // Return with populated organization so frontend gets full data
    const populated = await Window.findById(win._id).populate('organization', 'name');
    return res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows
// Optional query: ?organization=<id>
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
      { $addFields: { serviceCount: { $size: '$services' } } },
      { $sort: { floor: 1, number: 1 } },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      { $addFields: { organization: { $arrayElemAt: ['$orgInfo', 0] } } },
      {
        $project: {
          services: 0,
          orgInfo: 0,
          'organization.createdAt': 0,
          'organization.updatedAt': 0,
          'organization.__v': 0,
        },
      },
    ]);

    return res.json(windows);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/grouped-by-floor
// Returns ALL windows grouped by floor, enriched with floor bilingual names.
// Used by the public Service-by-Window page.
const getAllWindowsGroupedByFloor = async (req, res, next) => {
  try {
    // Fetch all windows with service counts
    const windows = await Window.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'window',
          as: 'services',
        },
      },
      { $addFields: { serviceCount: { $size: '$services' } } },
      { $sort: { floor: 1, number: 1 } },
      { $project: { services: 0 } },
    ]);

    // Fetch all floors for bilingual names
    const floors = await Floor.find().sort({ floorNumber: 1 });
    const floorMap = new Map(floors.map(f => [f.floorNumber, f]));

    // Group by floor number
    const grouped = new Map();
    for (const win of windows) {
      const floorNum = win.floor;
      if (!grouped.has(floorNum)) {
        const floorDoc = floorMap.get(floorNum);
        grouped.set(floorNum, {
          floor: floorNum,
          floorName: floorDoc
            ? { en: floorDoc.name.en, am: floorDoc.name.am, or: floorDoc.name.om }
            : { en: `Floor ${floorNum}`, am: `ወለል ${floorNum}`, or: `Darbii ${floorNum}ffaa` },
          windows: [],
        });
      }
      grouped.get(floorNum).windows.push(win);
    }

    const result = Array.from(grouped.values()).sort((a, b) => a.floor - b.floor);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/by-organization/:orgId
const getWindowsByOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;

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
      { $addFields: { serviceCount: { $size: '$services' } } },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      { $addFields: { organization: { $arrayElemAt: ['$orgInfo', 0] } } },
      {
        $project: {
          services: 0,
          orgInfo: 0,
          'organization.createdAt': 0,
          'organization.updatedAt': 0,
          'organization.__v': 0,
        },
      },
    ]);

    // Group by floor
    const grouped = new Map();
    for (const win of windows) {
      const floor = win.floor;
      if (!grouped.has(floor)) grouped.set(floor, []);
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
    const win = await Window.findById(req.params.id).populate('organization', 'name');
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
      .populate('window', 'number floor name')
      .sort({ createdAt: 1 });
    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// PUT /api/windows/:id
const updateWindow = async (req, res, next) => {
  try {
    const { number, name, floor, organization, description } = req.body;

    if (floor !== undefined && floor < 1) {
      return res.status(400).json({ message: 'Floor must be 1 or greater' });
    }

    const updateData = {};
    if (number !== undefined) updateData.number = number;
    if (name !== undefined) updateData.name = name;
    if (floor !== undefined) updateData.floor = floor;
    if (organization !== undefined) updateData.organization = organization || null;
    if (description !== undefined) updateData.description = description;

    const win = await Window.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('organization', 'name');

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
    const { serviceIds } = req.body;

    const win = await Window.findById(id);
    if (!win) return res.status(404).json({ message: 'Window not found' });

    const currentServiceIds = await Service.find({ window: id }).distinct('_id');
    const currentIds = currentServiceIds.map(s => s.toString());
    const targetIds = (serviceIds || []).map(s => s.toString());

    const toRemove = currentIds.filter(cid => !targetIds.includes(cid));
    if (toRemove.length > 0) {
      await Service.updateMany({ _id: { $in: toRemove } }, { window: null });
    }

    const toAdd = targetIds.filter(tid => !currentIds.includes(tid));
    if (toAdd.length > 0) {
      // Assign window to all target services (no organization filter needed)
      await Service.updateMany(
        { _id: { $in: toAdd } },
        { window: id }
      );
    }

    const services = await Service.find({ window: id })
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    return res.json({ message: 'Services updated successfully', services });
  } catch (err) {
    next(err);
  }
};

// GET /api/windows/:id/available-services
const getAvailableServicesForWindow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const win = await Window.findById(id);
    if (!win) return res.status(404).json({ message: 'Window not found' });

    const services = await Service.find({
      organization: win.organization,
      $or: [{ window: null }, { window: { $ne: id } }],
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
    await Service.updateMany({ window: req.params.id }, { window: null });
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
  getAllWindowsGroupedByFloor,
  getWindowsByOrganization,
  getWindowById,
  getServicesByWindow,
  updateWindow,
  assignServicesToWindow,
  getAvailableServicesForWindow,
  deleteWindow,
};
