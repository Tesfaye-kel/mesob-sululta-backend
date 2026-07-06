const Service = require('../models/Service');

// POST /api/services
const createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      organization,
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
    const { organizationId } = req.query;

    const filter = {};
    if (organizationId) filter.organization = organizationId;

    const services = await Service.find(filter)
      .populate('organization', 'name logoUrl')
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

    const service = await Service.findById(id).populate('organization', 'name logoUrl');
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
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getServicesByOrganization,
};

