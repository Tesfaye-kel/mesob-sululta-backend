const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Window = require('../models/Window');

// POST /api/organizations
const createOrganization = async (req, res, next) => {
  try {
    const { name, description, logoUrl } = req.body;

    const org = await Organization.create({ name, description, logoUrl });
    return res.status(201).json(org);
  } catch (err) {
    next(err);
  }
};

// GET /api/organizations
const getAllOrganizations = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { 'name.en': new RegExp(search, 'i') },
        { 'name.am': new RegExp(search, 'i') },
        { 'name.or': new RegExp(search, 'i') },
      ];
    }

    // Use aggregation to avoid N+1 query problem
    const organizations = await Organization.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'organization',
          as: 'services',
        },
      },
      {
        $addFields: {
          serviceCount: { $size: '$services' },
        },
      },
      { $project: { services: 0, __v: 0 } },
    ]);

    return res.json(organizations);
  } catch (err) {
    next(err);
  }
};

// GET /api/organizations/:id
const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    return res.json(org);
  } catch (err) {
    next(err);
  }
};

// PUT /api/organizations/:id
const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, logoUrl } = req.body;

    const org = await Organization.findByIdAndUpdate(
      id,
      { name, description, logoUrl },
      { new: true, runValidators: true }
    );

    if (!org) return res.status(404).json({ message: 'Organization not found' });
    return res.json(org);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/organizations/:id
const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const org = await Organization.findByIdAndDelete(id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    return res.json({ message: 'Organization deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/organizations/:id/services
const getServicesByOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const services = await Service.find({ organization: id })
      .populate('organization', 'name')
      .sort({ createdAt: 1 });
    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/organizations/:id/with-windows
// Combined endpoint: returns org + windows grouped by floor in a single request
const getOrganizationWithWindows = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [org, windows] = await Promise.all([
      Organization.findById(id),
      Window.aggregate([
        { $match: { organization: new mongoose.Types.ObjectId(id) } },
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
      ]),
    ]);

    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Group windows by floor
    const grouped = new Map();
    for (const win of windows) {
      const floor = win.floor;
      if (!grouped.has(floor)) {
        grouped.set(floor, []);
      }
      grouped.get(floor).push(win);
    }

    const windowGroups = Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, wins]) => ({ floor, windows: wins }));

    return res.json({ organization: org, windowGroups });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getServicesByOrganization,
  getOrganizationWithWindows,
};

