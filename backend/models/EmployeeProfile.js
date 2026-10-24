const mongoose = require('mongoose');
const { EMPLOYEE_TYPES } = require('../utils/employeeCategories');

const employeeProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeType: { type: String, enum: EMPLOYEE_TYPES, default: 'service_window_officer' },
    nationalIdHash: { type: String, default: '', select: false },
    nationalIdLastFour: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    schedule: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      shift: { type: String, trim: true, maxlength: 40 },
      startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    }],
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', default: null },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['pending', 'approved', 'active', 'suspended', 'rejected', 'transferred'], default: 'pending' },
    invitationToken: { type: String, default: null },
    invitationExpiresAt: { type: Date, default: null },
    invitationUsedAt: { type: Date, default: null },
    transferHistory: [
      {
        fromWindowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', default: null },
        toWindowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', default: null },
        reason: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        changedAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
