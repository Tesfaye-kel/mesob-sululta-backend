const User = require('../models/User');
const Service = require('../models/Service');
const Requirement = require('../models/Requirement');
const Window = require('../models/Window');

const windowBelongsToOffice = async (windowId, officeId) => {
  if (!windowId) return true;
  const serviceWindow = await Window.findById(windowId).select('organization assignedOrganizations');
  return serviceWindow?.assignedOrganizations?.length
    ? serviceWindow.assignedOrganizations.some((id) => id.toString() === officeId)
    : serviceWindow?.organization?.toString() === officeId;
};

const requireServiceManager = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      if (req.method !== 'GET') {
        return res.status(403).json({ message: 'Admin access to services and requirements is read-only.' });
      }
      return next();
    }
    let officeId;
    if (req.user?.role === 'registrar') {
      if (req.method !== 'GET') {
        return res.status(403).json({ message: 'Service and requirement changes are managed by an approved Service and Requirement Manager.' });
      }
      const user = await User.findOne({
        _id: req.user.id,
        role: 'registrar',
        status: 'active',
        archivedAt: null,
      }).select('profile.officeId');
      officeId = user?.profile?.officeId?.toString();
      if (!officeId) {
        return res.status(403).json({ message: 'Assign this registrar to an office before managing its services.' });
      }
      req.serviceOfficeId = officeId;
    } else if (req.user?.role === 'employee') {
      const user = await User.findOne({
        _id: req.user.id,
        role: 'employee',
        employeeType: 'service_requirement_manager',
        status: 'active',
        archivedAt: null,
      }).select('_id');
      if (!user) {
        return res.status(403).json({ message: 'Service and Requirement Manager access is required.' });
      }
      req.serviceManagerAllOffices = true;
    } else {
      return res.status(403).json({ message: 'Forbidden: service manager access required.' });
    }

    let targetService;
    if (req.baseUrl.endsWith('/requirements')) {
      if (req.method === 'GET' && req.params.serviceId) {
        targetService = await Service.findById(req.params.serviceId).select('organization');
      } else if (req.method === 'POST') {
        targetService = await Service.findById(req.body.service).select('organization');
      } else if (req.method === 'PUT' || req.method === 'DELETE') {
        const requirement = await Requirement.findById(req.params.id).select('service');
        if (requirement) {
          targetService = await Service.findById(requirement.service).select('organization');
          if (req.body.service && req.body.service.toString() !== requirement.service.toString()) {
            return res.status(403).json({ message: 'A requirement cannot be moved to another service.' });
          }
        }
      }
    } else if (req.method === 'POST') {
      if (!req.serviceManagerAllOffices && req.body.organization?.toString() !== officeId) {
        return res.status(403).json({ message: 'You can only create services for your assigned office.' });
      }
      if (!req.serviceManagerAllOffices && !(await windowBelongsToOffice(req.body.window, officeId))) {
        return res.status(403).json({ message: 'A service can only be assigned to a window in your office.' });
      }
      if (req.serviceManagerAllOffices && req.body.window &&
          !(await windowBelongsToOffice(req.body.window, req.body.organization?.toString()))) {
        return res.status(403).json({ message: 'A service can only be assigned to a window assigned to its office.' });
      }
      return next();
    } else if (req.method === 'PUT' || req.method === 'DELETE') {
      targetService = await Service.findById(req.params.id).select('organization');
      if (!req.serviceManagerAllOffices && req.method === 'PUT' && req.body.organization?.toString() !== officeId) {
        return res.status(403).json({ message: 'You can only manage services for your assigned office.' });
      }
      if (!req.serviceManagerAllOffices && req.method === 'PUT' && !(await windowBelongsToOffice(req.body.window, officeId))) {
        return res.status(403).json({ message: 'A service can only be assigned to a window in your office.' });
      }
      if (req.serviceManagerAllOffices && req.method === 'PUT' && req.body.window &&
          !(await windowBelongsToOffice(req.body.window, req.body.organization?.toString()))) {
        return res.status(403).json({ message: 'A service can only be assigned to a window assigned to its office.' });
      }
    } else if (req.method === 'GET') {
      return next();
    }

    if (!targetService || (!req.serviceManagerAllOffices && targetService.organization?.toString() !== officeId)) {
      return res.status(403).json({ message: 'You can only manage services and requirements for your assigned office.' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireServiceManager };
