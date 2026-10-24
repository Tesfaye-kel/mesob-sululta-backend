const Requirement = require('../models/Requirement');

// POST /api/requirements
const createRequirement = async (req, res, next) => {
  try {
    const {
      service,
      requirementText,
      isMandatory,
      sequenceNo,
      notes,
      isActive,
    } = req.body;

    const requirement = await Requirement.create({
      service,
      requirementText,
      isMandatory,
      sequenceNo,
      notes,
      isActive,
    });

    return res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
};

// GET /api/requirements
const getAllRequirements = async (req, res, next) => {
  try {
    const { serviceId } = req.query;

    const filter = { isActive: { $ne: false } };
    if (serviceId) filter.service = serviceId;

    const requirements = await Requirement.find(filter)
      .populate('service', 'name')
      .sort({ service: 1, sequenceNo: 1 });

    return res.json(requirements);
  } catch (err) {
    next(err);
  }
};

// GET /api/requirements/:id
const getRequirementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findById(id).populate('service', 'name');
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });

    return res.json(requirement);
  } catch (err) {
    next(err);
  }
};

// PUT /api/requirements/:id
const updateRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      service,
      requirementText,
      isMandatory,
      sequenceNo,
      notes,
      isActive,
    } = req.body;

    const requirement = await Requirement.findByIdAndUpdate(
      id,
      {
        service,
        requirementText,
        isMandatory,
        sequenceNo,
        notes,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });

    return res.json(requirement);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/requirements/:id
const deleteRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findByIdAndDelete(id);
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });

    return res.json({ message: 'Requirement deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:serviceId/requirements
const getRequirementsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const requirements = await Requirement.find({ service: serviceId, isActive: { $ne: false } })
      .sort({ sequenceNo: 1 });

    return res.json(requirements);
  } catch (err) {
    next(err);
  }
};

const getRequirementsForManagement = async (req, res, next) => {
  try {
    const requirements = await Requirement.find({ service: req.params.serviceId })
      .sort({ sequenceNo: 1, createdAt: 1 });
    return res.json(requirements);
  } catch (err) {
    next(err);
  }
};

// POST /api/requirements/bulk
const createBulkRequirements = async (req, res, next) => {
  try {
    const { requirements } = req.body;

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ message: 'Requirements array is required' });
    }

    const createdRequirements = await Requirement.insertMany(requirements);

    return res.status(201).json(createdRequirements);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getRequirementsByService,
  getRequirementsForManagement,
  createBulkRequirements,
};
