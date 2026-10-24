const test = require('node:test');
const assert = require('node:assert/strict');
const AccountRemovalRequest = require('../models/AccountRemovalRequest');
const AuditLog = require('../models/AuditLog');
const CitizenIdentity = require('../models/CitizenIdentity');
const User = require('../models/User');
const {
  requestEmployeeRemoval,
  reviewRemovalRequest,
} = require('../controllers/accountRemovalController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('registrar can request removal only for their own unassigned employee submissions', async () => {
  const original = {
    findById: User.findById,
    findOne: User.findOne,
    requestCreate: AccountRemovalRequest.create,
    auditCreate: AuditLog.create,
  };
  const registrarId = '507f1f77bcf86cd799439013';
  const employeeId = '507f1f77bcf86cd799439012';
  let employeeFilter;
  let createdRequest;
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: null } }),
      }),
    });
    User.findOne = (filter) => {
      employeeFilter = filter;
      return { select: async () => ({ _id: employeeId, name: 'Example Employee' }) };
    };
    AccountRemovalRequest.create = async (request) => {
      createdRequest = request;
      return { _id: '507f1f77bcf86cd799439014' };
    };
    AuditLog.create = async () => {};
    const res = response();
    let nextError;

    await requestEmployeeRemoval({
      params: { employeeId },
      body: { reason: 'No longer employed' },
      user: { id: registrarId, role: 'registrar' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 201);
    assert.ok(employeeFilter.$or.some((condition) =>
      condition.status?.$in?.includes('active') && condition['profile.officeId'] === null
    ));
    assert.ok(employeeFilter.$or.some((condition) => condition.createdBy === registrarId));
    assert.equal(createdRequest.targetType, 'employee');
    assert.equal(createdRequest.targetId, employeeId);
  } finally {
    User.findById = original.findById;
    User.findOne = original.findOne;
    AccountRemovalRequest.create = original.requestCreate;
    AuditLog.create = original.auditCreate;
  }
});

test('admin approval archives a citizen and disables access without deleting it', async () => {
  const originalRequestFindOneAndUpdate = AccountRemovalRequest.findOneAndUpdate;
  const originalCitizenFindOneAndUpdate = CitizenIdentity.findOneAndUpdate;
  const originalAuditCreate = AuditLog.create;
  const reviewedAt = new Date();
  let accountUpdate;
  let audit;

  try {
    AccountRemovalRequest.findOneAndUpdate = async () => ({
      _id: '507f1f77bcf86cd799439001',
      targetId: '507f1f77bcf86cd799439002',
      targetType: 'citizen',
      reason: 'Duplicate registration',
      reviewedAt,
    });
    CitizenIdentity.findOneAndUpdate = async (query, update) => {
      accountUpdate = { query, update };
      return { _id: query._id };
    };
    AuditLog.create = async (entry) => { audit = entry; };
    const res = response();
    let nextError;

    await reviewRemovalRequest({
      params: { requestId: '507f1f77bcf86cd799439001' },
      body: { decision: 'approve' },
      user: { id: '507f1f77bcf86cd799439003', role: 'admin' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 200);
    assert.match(res.body.message, /records and service history were retained/);
    assert.equal(accountUpdate.update.$set.status, 'suspended');
    assert.equal(accountUpdate.update.$set.isActive, false);
    assert.equal(accountUpdate.update.$set.archivedAt, reviewedAt);
    assert.equal(audit.action, 'APPROVE_ACCOUNT_ARCHIVAL');
  } finally {
    AccountRemovalRequest.findOneAndUpdate = originalRequestFindOneAndUpdate;
    CitizenIdentity.findOneAndUpdate = originalCitizenFindOneAndUpdate;
    AuditLog.create = originalAuditCreate;
  }
});

test('admin approval archives employee records through suspension, not deletion', async () => {
  const originalRequestFindOneAndUpdate = AccountRemovalRequest.findOneAndUpdate;
  const originalUserFindOneAndUpdate = User.findOneAndUpdate;
  const originalAuditCreate = AuditLog.create;
  let employeeUpdate;

  try {
    AccountRemovalRequest.findOneAndUpdate = async () => ({
      _id: '507f1f77bcf86cd799439011',
      targetId: '507f1f77bcf86cd799439012',
      targetType: 'employee',
      reason: 'Duplicate employee record',
      reviewedAt: new Date(),
    });

    test('admin rejection closes an employee removal request without changing the employee', async () => {
      const originalRequestFindOneAndUpdate = AccountRemovalRequest.findOneAndUpdate;
      const originalUserFindOneAndUpdate = User.findOneAndUpdate;
      const originalAuditCreate = AuditLog.create;
      let employeeChanged = false;

      try {
        AccountRemovalRequest.findOneAndUpdate = async () => ({
          _id: '507f1f77bcf86cd799439021',
          targetId: '507f1f77bcf86cd799439022',
          targetType: 'employee',
          reason: 'Review request',
          reviewedAt: new Date(),
        });
        User.findOneAndUpdate = async () => { employeeChanged = true; };
        AuditLog.create = async () => {};
        const res = response();
        let nextError;

        await reviewRemovalRequest({
          params: { requestId: '507f1f77bcf86cd799439021' },
          body: { decision: 'reject' },
          user: { id: '507f1f77bcf86cd799439023', role: 'admin' },
          ip: '127.0.0.1',
        }, res, (error) => { nextError = error; });

        assert.equal(nextError, undefined);
        assert.equal(res.statusCode, 200);
        assert.equal(employeeChanged, false);
      } finally {
        AccountRemovalRequest.findOneAndUpdate = originalRequestFindOneAndUpdate;
        User.findOneAndUpdate = originalUserFindOneAndUpdate;
        AuditLog.create = originalAuditCreate;
      }
    });
    User.findOneAndUpdate = async (query, update) => {
      employeeUpdate = { query, update };
      return { _id: query._id };
    };
    AuditLog.create = async () => {};
    const res = response();
    let nextError;

    await reviewRemovalRequest({
      params: { requestId: '507f1f77bcf86cd799439011' },
      body: { decision: 'approve' },
      user: { id: '507f1f77bcf86cd799439013', role: 'admin' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(employeeUpdate.query.role, 'employee');
    assert.equal(employeeUpdate.update.$set.status, 'suspended');
    assert.ok(employeeUpdate.update.$set.archivedAt instanceof Date);
    assert.equal(res.statusCode, 200);
  } finally {
    AccountRemovalRequest.findOneAndUpdate = originalRequestFindOneAndUpdate;
    User.findOneAndUpdate = originalUserFindOneAndUpdate;
    AuditLog.create = originalAuditCreate;
  }
});
