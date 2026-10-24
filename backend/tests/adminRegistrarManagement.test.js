const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const { updateRegistrar } = require('../controllers/adminController');

function createResponse() {
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

test('admin can update registrar identity, registered office, and schedule', async () => {
  const original = {
    userFindOne: User.findOne,
    officeFindById: Organization.findById,
    auditCreate: AuditLog.create,
  };
  const registrarId = '507f1f77bcf86cd799439011';
  const officeId = '507f1f77bcf86cd799439012';
  const registrar = {
    _id: registrarId,
    name: 'Old Name',
    email: 'old@example.org',
    profile: {},
    set(path, value) {
      this.profile[path.slice('profile.'.length)] = value;
    },
    save: async () => {},
  };
  let calls = 0;
  let auditEntry;
  try {
    User.findOne = () => {
      calls += 1;
      if (calls === 1) return Promise.resolve(registrar);
      return {
        select: () => ({
          lean: async () => null,
        }),
      };
    };
    Organization.findById = () => ({
      select: () => ({
        lean: async () => ({ _id: officeId }),
      }),
    });
    AuditLog.create = async (entry) => { auditEntry = entry; };
    const res = createResponse();

    await updateRegistrar({
      params: { registrarId },
      body: {
        name: 'New Name',
        email: 'NEW@example.org',
        officeId,
        officeAssignmentLabel: '',
        schedule: [{ day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' }],
      },
      user: { id: '507f1f77bcf86cd799439013', role: 'admin' },
      ip: '127.0.0.1',
    }, res, (error) => { throw error; });

    assert.equal(res.statusCode, 200);
    assert.equal(registrar.name, 'New Name');
    assert.equal(registrar.email, 'new@example.org');
    assert.equal(registrar.profile.officeId, officeId);
    assert.equal(registrar.profile.officeAssignmentLabel, '');
    assert.equal(registrar.profile.schedule.length, 1);
    assert.equal(auditEntry.action, 'UPDATE_REGISTRAR');
    assert.deepEqual(auditEntry.details.fields, ['name', 'email', 'officeId', 'officeAssignmentLabel', 'schedule']);
  } finally {
    User.findOne = original.userFindOne;
    Organization.findById = original.officeFindById;
    AuditLog.create = original.auditCreate;
  }
});

test('admin cannot assign a registrar to a nonexistent registered office', async () => {
  const original = {
    userFindOne: User.findOne,
    officeFindById: Organization.findById,
  };
  let saved = false;
  let findOneCalls = 0;
  const registrarId = '507f1f77bcf86cd799439011';
  try {
    User.findOne = () => {
      findOneCalls += 1;
      if (findOneCalls === 1) {
        return Promise.resolve({
          _id: registrarId,
          profile: {},
          set() {},
          save: async () => { saved = true; },
        });
      }
      return {
        select: () => ({
          lean: async () => null,
        }),
      };
    };
    Organization.findById = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });
    const res = createResponse();

    await updateRegistrar({
      params: { registrarId },
      body: {
        name: 'Registrar Name',
        email: 'registrar@example.org',
        officeId: '507f1f77bcf86cd799439012',
        schedule: [{ day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' }],
      },
      user: { id: '507f1f77bcf86cd799439013', role: 'admin' },
    }, res, (error) => { throw error; });

    assert.equal(res.statusCode, 404);
    assert.equal(saved, false);
  } finally {
    User.findOne = original.userFindOne;
    Organization.findById = original.officeFindById;
  }
});
