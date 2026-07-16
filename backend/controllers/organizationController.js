const Organization = require('../models/Organization');
const Service = require('../models/Service');

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

    const organizations = await Organization.find(filter).sort({ createdAt: -1 });

    // Attach serviceCount to each org
    const orgsWithCount = await Promise.all(
      organizations.map(async (org) => {
        const serviceCount = await Service.countDocuments({ organization: org._id });
        return { ...org.toObject(), serviceCount };
      })
    );

    return res.json(orgsWithCount);
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

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getServicesByOrganization,
};

