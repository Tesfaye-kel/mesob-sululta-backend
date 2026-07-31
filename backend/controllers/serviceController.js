const Service = require('../models/Service');
const Requirement = require('../models/Requirement');

// POST /api/services
const createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      organization,
      window,
      requiredDocuments,
      fee,
      processingTime,
      workingHours,
      contactPhone,
    } = req.body;

    const service = await Service.create({
      name,
      description,
      organization,
      window: window || null,
      requiredDocuments,
      fee,
      processingTime,
      workingHours,
      contactPhone,
    });

    return res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

// GET /api/services
const getAllServices = async (req, res, next) => {
  try {
    const { organizationId, windowId } = req.query;

    const filter = {};
    if (organizationId) filter.organization = organizationId;
    if (windowId) filter.window = windowId;

    const services = await Service.find(filter)
      .populate('organization', 'name logoUrl')
      .populate('window', 'number floor')
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/by-window/:windowId
const getServicesByWindow = async (req, res, next) => {
  try {
    const { windowId } = req.params;

    const services = await Service.find({ window: windowId })
      .populate('organization', 'name logoUrl')
      .populate('window', 'number floor')
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate('organization', 'name logoUrl')
      .populate('window', 'number floor');
    if (!service) return res.status(404).json({ message: 'Service not found' });

    return res.json(service);
  } catch (err) {
    next(err);
  }
};

// PUT /api/services/:id
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      organization,
      window,
      requiredDocuments,
      fee,
      processingTime,
      workingHours,
      contactPhone,
    } = req.body;

    const service = await Service.findByIdAndUpdate(
      id,
      {
        name,
        description,
        organization,
        window: window || null,
        requiredDocuments,
        fee,
        processingTime,
        workingHours,
        contactPhone,
      },
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ message: 'Service not found' });

    return res.json(service);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Also delete associated requirements
    await Requirement.deleteMany({ service: id });

    const service = await Service.findByIdAndDelete(id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    return res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/organizations/:organizationId/services
const getServicesByOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    const services = await Service.find({ organization: organizationId })
      .populate('window', 'number floor')
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/search?q=...
const searchServices = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const query = q.trim();
    // Escape regex special characters
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const services = await Service.find({
      $or: [
        { 'name.en': regex },
        { 'name.am': regex },
        { 'name.or': regex },
        { 'description.en': regex },
        { 'description.am': regex },
        { 'description.or': regex },
      ],
    })
      .populate('organization', 'name')
      .populate('window', 'number floor')
      .limit(10)
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createService,
  getAllServices,
  searchServices,
  getServiceById,
  updateService,
  deleteService,
  getServicesByOrganization,
  getServicesByWindow,
};

