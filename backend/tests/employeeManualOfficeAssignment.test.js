const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Organization = require('../models/Organization');
const EmployeeProfile = require('../models/EmployeeProfile');
const AuditLog = require('../models/AuditLog');
const { assignEmployee } = require('../controllers/employeeController');

test('admin can assign an employee using a manual office label', async () => {
  const original = {
    userFindOne: User.findOne,
    organizationExists: Organization.exists,
    employeeProfileFindOne: EmployeeProfile.findOne,
    employeeProfileCreate: EmployeeProfile.create,
    auditCreate: AuditLog.create,
  };
  const employeeId = '507f1f77bcf86cd799439011';
  const employee = {
    _id: employeeId,
    role: 'employee',
    status: 'approved',
    employeeType: 'service_window_officer',
    profile: { officeId: null },
    invitationToken: 'previous-token',
    invitationExpiresAt: new Date(),
    invitationUsedAt: null,
    save: async () => {},
  };
  let createdProfile;
  let auditDetails;
  User.findOne = async () => employee;
  Organization.exists = async () => {
    throw new Error('Manual office assignment must not query registered offices.');
  };
  EmployeeProfile.findOne = async () => null;
  EmployeeProfile.create = async (profile) => { createdProfile = profile; return profile; };
  AuditLog.create = async (entry) => { auditDetails = entry.details; return entry; };

  try {
    const response = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await assignEmployee({
      params: { employeeId },
      body: { officeAssignmentLabel: 'Sululta Branch Office' },
      user: { id: 'admin-id', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(employee.profile.officeId, null);
    assert.equal(employee.profile.officeAssignmentLabel, 'Sululta Branch Office');
    assert.equal(employee.invitationToken, null);
    assert.equal(createdProfile.officeId, null);
    assert.equal(auditDetails.officeId, null);
    assert.equal(auditDetails.officeAssignmentLabel, 'Sululta Branch Office');
    assert.equal('invitationToken' in response.body, false);
  } finally {
    User.findOne = original.userFindOne;
    Organization.exists = original.organizationExists;
    EmployeeProfile.findOne = original.employeeProfileFindOne;
    EmployeeProfile.create = original.employeeProfileCreate;
    AuditLog.create = original.auditCreate;
  }
});
