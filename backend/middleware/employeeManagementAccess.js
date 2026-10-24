const User = require('../models/User');

const requireEmployeeManager = async (req, res, next) => {
  try {
    const employee = await User.findOne({
      _id: req.user.id,
      role: 'employee',
      status: 'active',
      archivedAt: null,
    }).select('employeeType');
    if (!employee || !['floor_window_manager', 'service_requirement_manager'].includes(employee.employeeType)) {
      return res.status(403).json({ message: 'Employee management access is required.' });
    }
    req.employeeManagementType = employee.employeeType;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAllowedManagementChange = (req, res, next) => {
  const allowedTypes = req.employeeManagementType === 'floor_window_manager'
    ? ['floor', 'office', 'window']
    : ['service', 'requirement'];
  if (!allowedTypes.includes(req.body?.entityType)) {
    return res.status(403).json({ message: 'Your employee category cannot manage this record type.' });
  }
  next();
};

const requireServiceRequirementManager = (req, res, next) => {
  if (req.employeeManagementType !== 'service_requirement_manager') {
    return res.status(403).json({ message: 'Service and Requirement Manager access is required.' });
  }
  next();
};

module.exports = {
  requireEmployeeManager,
  requireAllowedManagementChange,
  requireServiceRequirementManager,
};
