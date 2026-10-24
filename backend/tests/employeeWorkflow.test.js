const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const AuditLog = require('../models/AuditLog');
const AccountRemovalRequest = require('../models/AccountRemovalRequest');
const employeeController = require('../controllers/employeeController');
const authController = require('../controllers/authController');
const { getFanHash } = require('../services/citizenIdentityProvider');

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

test('registrars can see their unassigned employee submissions in the employee list', async () => {
  const original = {
    findById: User.findById,
    find: User.find,
    removalFind: AccountRemovalRequest.find,
  };
  const registrarId = '507f1f77bcf86cd799439012';
  const officeId = '507f1f77bcf86cd799439013';
  const employee = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Example Employee',
    createdBy: registrarId,
    profile: { officeId: null },
  };
  let employeeFilter;
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId } }),
      }),
    });
    User.find = (filter) => {
      employeeFilter = filter;
      const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        lean: async () => [employee],
      };
      return query;
    };
    AccountRemovalRequest.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    const response = createResponse();

    await employeeController.listEmployees({
      user: { id: registrarId, role: 'registrar' },
    }, response, (error) => { throw error; });

    assert.deepEqual(employeeFilter, {
      role: 'employee',
      archivedAt: null,
      $or: [
        { 'profile.officeId': officeId },
        { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
        { createdBy: registrarId },
      ],
    });
    assert.deepEqual(response.body.employees, [{ ...employee, removalRequested: false }]);
  } finally {
    User.findById = original.findById;
    User.find = original.find;
    AccountRemovalRequest.find = original.removalFind;
  }
});

test('registrar can still see their submission after it is assigned to another office', async () => {
  const original = {
    findById: User.findById,
    find: User.find,
    removalFind: AccountRemovalRequest.find,
  };
  const registrarId = '507f1f77bcf86cd799439012';
  const registrarOfficeId = '507f1f77bcf86cd799439013';
  const employeeId = '507f1f77bcf86cd799439011';
  let employeeFilter;
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: registrarOfficeId } }),
      }),
    });
    User.find = (filter) => {
      employeeFilter = filter;
      const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        lean: async () => [{
          _id: employeeId,
          createdBy: registrarId,
          profile: { officeId: '507f1f77bcf86cd799439014' },
        }],
      };
      return query;
    };
    AccountRemovalRequest.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    const response = createResponse();

    await employeeController.listEmployees({
      user: { id: registrarId, role: 'registrar' },
    }, response, (error) => { throw error; });

    assert.deepEqual(employeeFilter.$or, [
      { 'profile.officeId': registrarOfficeId },
      { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
      { createdBy: registrarId },
    ]);
    assert.equal(response.body.employees.length, 1);
  } finally {
    User.findById = original.findById;
    User.find = original.find;
    AccountRemovalRequest.find = original.removalFind;
  }
});

test('registrar list includes an admin-approved employee awaiting office assignment', async () => {
  const original = {
    findById: User.findById,
    find: User.find,
    removalFind: AccountRemovalRequest.find,
  };
  const registrarId = '507f1f77bcf86cd799439012';
  let employeeFilter;
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: '507f1f77bcf86cd799439013' } }),
      }),
    });
    User.find = (filter) => {
      employeeFilter = filter;
      const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        lean: async () => [{
          _id: '507f1f77bcf86cd799439011',
          name: 'Mashote Dese',
          status: 'active',
          createdBy: '507f1f77bcf86cd799439014',
          profile: { officeId: null },
        }],
      };
      return query;
    };
    AccountRemovalRequest.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    const response = createResponse();

    await employeeController.listEmployees({
      user: { id: registrarId, role: 'registrar' },
    }, response, (error) => { throw error; });

    assert.ok(employeeFilter.$or.some((condition) =>
      condition.status?.$in?.includes('active') && condition['profile.officeId'] === null
    ));
    assert.equal(response.body.employees[0].name, 'Mashote Dese');
  } finally {
    User.findById = original.findById;
    User.find = original.find;
    AccountRemovalRequest.find = original.removalFind;
  }
});

test('registrar without an office can see approved unassigned employees and their submissions', async () => {
  const original = {
    findById: User.findById,
    find: User.find,
    removalFind: AccountRemovalRequest.find,
  };
  const registrarId = '507f1f77bcf86cd799439012';
  let employeeFilter;
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: null } }),
      }),
    });
    User.find = (filter) => {
      employeeFilter = filter;
      const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        lean: async () => [],
      };
      return query;
    };
    AccountRemovalRequest.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    const response = createResponse();

    await employeeController.listEmployees({
      user: { id: registrarId, role: 'registrar' },
    }, response, (error) => { throw error; });

    assert.deepEqual(employeeFilter, {
      role: 'employee',
      archivedAt: null,
      $or: [
        { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
        { createdBy: registrarId },
      ],
    });
    assert.equal(response.statusCode, 200);
  } finally {
    User.findById = original.findById;
    User.find = original.find;
    AccountRemovalRequest.find = original.removalFind;
  }
});

test('registrar employee submission stores identity and defers assignments and invitation', async () => {
  const original = {
    findOne: User.findOne,
    findById: User.findById,
    exists: User.exists,
    create: User.create,
    profileCreate: EmployeeProfile.create,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  let savedUser;
  let savedProfile;
  try {
    User.findOne = async () => null;
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: '507f1f77bcf86cd799439013' } }),
      }),
    });
    User.exists = async () => false;
    User.create = async (data) => {
      savedUser = data;
      return { ...data, _id: '507f1f77bcf86cd799439011' };
    };
    EmployeeProfile.create = async (data) => { savedProfile = data; };
    AuditLog.create = async () => {};
    const response = createResponse();

    await employeeController.createEmployee({
      body: {
        name: 'Example Employee',
        email: 'EXAMPLE@MESOB.ORG',
        phone: '0912345678',
        nationalId: '123456789012',
        jobTitle: 'Service Clerk',
        employeeType: 'service_window_officer',
      },
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 201);
    assert.equal(savedUser.email, 'example@mesob.org');
    assert.equal(savedUser.profile.officeId, null);
    assert.equal(savedUser.profile.nationalIdHash, getFanHash('123456789012'));
    assert.equal('nationalId' in savedUser.profile, false);
    assert.deepEqual(savedUser.profile.schedule, []);
    assert.equal(savedProfile.status, 'pending');
    assert.equal(savedProfile.officeId, null);
    assert.equal('invitationToken' in savedUser, false);
    assert.equal('invitationToken' in response.body, false);
  } finally {
    User.findOne = original.findOne;
    User.findById = original.findById;
    User.exists = original.exists;
    User.create = original.create;
    EmployeeProfile.create = original.profileCreate;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('registrar assigned a manual office label can submit employees for administrator review', async () => {
  const original = {
    findOne: User.findOne,
    findById: User.findById,
    exists: User.exists,
    create: User.create,
    profileCreate: EmployeeProfile.create,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  let savedUser;
  try {
    User.findOne = async () => null;
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: null, officeAssignmentLabel: 'Local Service Center' } }),
      }),
    });
    User.exists = async () => false;
    User.create = async (data) => {
      savedUser = data;
      return { ...data, _id: '507f1f77bcf86cd799439011' };
    };
    EmployeeProfile.create = async () => {};
    AuditLog.create = async () => {};
    const response = createResponse();

    await employeeController.createEmployee({
      body: {
        name: 'Example Employee',
        email: 'example@mesob.org',
        phone: '0912345678',
        nationalId: '123456789012',
        jobTitle: 'Service Clerk',
        employeeType: 'service_window_officer',
      },
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 201);
    assert.equal(savedUser.createdBy, '507f1f77bcf86cd799439012');
    assert.equal(savedUser.status, 'pending');
    assert.equal(savedUser.profile.officeId, null);
    assert.equal(response.body.employee.status, 'pending');
  } finally {
    User.findOne = original.findOne;
    User.findById = original.findById;
    User.exists = original.exists;
    User.create = original.create;
    EmployeeProfile.create = original.profileCreate;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('admin rejection marks pending employee records rejected and audits the decision', async () => {
  const original = {
    findOne: User.findOne,
    profileFindOneAndUpdate: EmployeeProfile.findOneAndUpdate,
    auditCreate: AuditLog.create,
  };
  const employee = {
    _id: '507f1f77bcf86cd799439011',
    createdBy: '507f1f77bcf86cd799439012',
    profile: { officeId: null },
    status: 'pending',
    invitationToken: 'unused-token',
    invitationExpiresAt: new Date(),
    save: async function () {},
  };
  let profileUpdate;
  let auditRecord;
  try {
    User.findOne = async () => employee;
    EmployeeProfile.findOneAndUpdate = async (...args) => { profileUpdate = args; };
    AuditLog.create = async (record) => { auditRecord = record; };
    const response = createResponse();

    await employeeController.rejectEmployee({
      params: { employeeId: employee._id },
      user: { id: '507f1f77bcf86cd799439013', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(employee.status, 'rejected');
    assert.equal(employee.invitationToken, null);
    assert.equal(employee.invitationExpiresAt, null);
    assert.deepEqual(profileUpdate[1], {
      status: 'rejected',
      invitationToken: null,
      invitationExpiresAt: null,
    });
    assert.equal(auditRecord.action, 'REJECT_EMPLOYEE');
  } finally {
    User.findOne = original.findOne;
    EmployeeProfile.findOneAndUpdate = original.profileFindOneAndUpdate;
    AuditLog.create = original.auditCreate;
  }
});

test('employee registration rejects phone numbers that do not start with 09 and contain 10 digits', async () => {
  const original = {
    findOne: User.findOne,
    findById: User.findById,
    exists: User.exists,
    create: User.create,
  };
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: '507f1f77bcf86cd799439013' } }),
      }),
    });
    User.findOne = async () => null;
    User.exists = async () => false;
    let userCreated = false;
    User.create = async () => {
      userCreated = true;
      return {};
    };
    const response = createResponse();

    await employeeController.createEmployee({
      body: {
        name: 'Example Employee',
        email: 'example@mesob.org',
        phone: '9123456789',
        nationalId: '123456789012',
        jobTitle: 'Service Clerk',
        employeeType: 'service_window_officer',
      },
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /10-digit phone number starting with 09/i);
    assert.equal(userCreated, false);
  } finally {
    User.findOne = original.findOne;
    User.findById = original.findById;
    User.exists = original.exists;
    User.create = original.create;
  }
});

test('employee registration rejects a phone number already used by another employee', async () => {
  const original = {
    findOne: User.findOne,
    findById: User.findById,
    exists: User.exists,
    create: User.create,
  };
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId: '507f1f77bcf86cd799439013' } }),
      }),
    });
    User.findOne = async () => null;
    User.exists = async (query) => query.role === 'employee' && query.phone === '0922734614';
    let userCreated = false;
    User.create = async () => {
      userCreated = true;
      return {};
    };
    const response = createResponse();

    await employeeController.createEmployee({
      body: {
        name: 'Example Employee',
        email: 'example@mesob.org',
        phone: '0922734614',
        nationalId: '123456789012',
        jobTitle: 'Service Clerk',
        employeeType: 'service_window_officer',
      },
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 409);
    assert.match(response.body.message, /phone number is already registered/i);
    assert.equal(userCreated, false);
  } finally {
    User.findOne = original.findOne;
    User.findById = original.findById;
    User.exists = original.exists;
    User.create = original.create;
  }
});

test('registrar password reset clears employee access and requires first-password setup', async () => {
  const original = {
    findById: User.findById,
    findOne: User.findOne,
    auditCreate: AuditLog.create,
    profileUpdate: EmployeeProfile.findOneAndUpdate,
  };
  const employeeId = '507f1f77bcf86cd799439011';
  const officeId = '507f1f77bcf86cd799439013';
  const registrarId = '507f1f77bcf86cd799439012';
  let savedEmployee;
  let profileUpdate;
  let auditEntry;
  const employee = {
    _id: employeeId,
    email: 'employee@example.org',
    password: 'previous-hash',
    status: 'active',
    invitationToken: 'old-token',
    invitationExpiresAt: new Date(),
    invitationUsedAt: new Date(),
    resetPasswordToken: 'old-reset-token',
    resetPasswordExpires: new Date(),
    save: async function () {
      savedEmployee = {
        password: this.password,
        status: this.status,
        invitationToken: this.invitationToken,
        invitationExpiresAt: this.invitationExpiresAt,
        invitationUsedAt: this.invitationUsedAt,
        resetPasswordToken: this.resetPasswordToken,
        resetPasswordExpires: this.resetPasswordExpires,
      };
    },
  };
  try {
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ profile: { officeId } }),
      }),
    });
    User.findOne = async (filter) => {
      assert.equal(String(filter._id), employeeId);
      assert.equal(filter.role, 'employee');
      assert.deepEqual(filter.status.$in, ['approved', 'active']);
      assert.deepEqual(filter.$or, [
        { 'profile.officeId': officeId },
        { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
        { createdBy: registrarId },
      ]);
      return employee;
    };
    AuditLog.create = async (entry) => { auditEntry = entry; };
    EmployeeProfile.findOneAndUpdate = async (filter, update) => { profileUpdate = { filter, update }; };
    const response = createResponse();

    await employeeController.requestEmployeePasswordReset({
      params: { employeeId },
      user: { id: registrarId, role: 'registrar' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.notEqual(savedEmployee.password, 'previous-hash');
    assert.equal(savedEmployee.status, 'approved');
    assert.equal(savedEmployee.invitationToken, null);
    assert.equal(savedEmployee.invitationExpiresAt, null);
    assert.equal(savedEmployee.invitationUsedAt, null);
    assert.equal(savedEmployee.resetPasswordToken, null);
    assert.equal(savedEmployee.resetPasswordExpires, null);
    assert.equal(profileUpdate.update.status, 'approved');
    assert.equal(String(auditEntry.resourceId), employeeId);
    assert.equal(auditEntry.action, 'RESET_EMPLOYEE_PASSWORD');
    assert.match(response.body.message, /must set a new password/i);
  } finally {
    User.findById = original.findById;
    User.findOne = original.findOne;
    AuditLog.create = original.auditCreate;
    EmployeeProfile.findOneAndUpdate = original.profileUpdate;
  }
});

test('employee password reset consumes the emailed token hash and audits the change', async () => {
  const original = {
    findOne: User.findOne,
    auditCreate: AuditLog.create,
  };
  const token = 'b'.repeat(64);
  let lookup;
  let savedUser;
  let auditEntry;
  const employee = {
    _id: '507f1f77bcf86cd799439011',
    role: 'employee',
    password: 'old-password',
    resetPasswordToken: 'token-hash',
    resetPasswordExpires: new Date(Date.now() + 60_000),
    save: async function () {
      savedUser = {
        password: this.password,
        resetPasswordToken: this.resetPasswordToken,
        resetPasswordExpires: this.resetPasswordExpires,
      };
    },
  };
  try {
    User.findOne = async (filter) => {
      lookup = filter;
      return employee;
    };
    AuditLog.create = async (entry) => { auditEntry = entry; };
    const response = createResponse();
    await authController.resetPassword({
      body: { token, newPassword: 'new-secure-password' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(lookup.resetPasswordToken.$in, [
      require('crypto').createHash('sha256').update(token).digest('hex'),
      token,
    ]);
    assert.equal(response.statusCode, 200);
    assert.equal(savedUser.password, 'new-secure-password');
    assert.equal(savedUser.resetPasswordToken, null);
    assert.equal(savedUser.resetPasswordExpires, null);
    assert.equal(auditEntry.action, 'RESET_EMPLOYEE_PASSWORD');
  } finally {
    User.findOne = original.findOne;
    AuditLog.create = original.auditCreate;
  }
});

test('employee activation requires office and weekly schedule but no window or service assignment', async () => {
  const original = {
    findOne: User.findOne,
    findOneAndUpdate: User.findOneAndUpdate,
    profileUpdate: EmployeeProfile.findOneAndUpdate,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  const token = 'a'.repeat(64);
  const nationalId = '123456789012';
  const invitation = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Example Employee',
    employeeType: 'service_window_officer',
    profile: { nationalIdHash: getFanHash(nationalId) },
  };
  try {
    User.findOne = () => ({ select: () => ({ lean: async () => invitation }) });
    let updateFilter;
    User.findOneAndUpdate = async (filter) => {
      updateFilter = filter;
      return null;
    };
    EmployeeProfile.findOneAndUpdate = async () => {};
    const response = createResponse();

    await employeeController.activateEmployee({
      body: { token, name: 'Example Employee', nationalId, password: 'secure-passphrase' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 409);
    assert.ok(updateFilter['profile.officeId']);
    assert.ok(updateFilter['profile.schedule.0']);
    assert.equal('profile.windowId' in updateFilter, false);
    assert.equal('profile.services.0' in updateFilter, false);
  } finally {
    User.findOne = original.findOne;
    User.findOneAndUpdate = original.findOneAndUpdate;
    EmployeeProfile.findOneAndUpdate = original.profileUpdate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('approved employee can set a first password before office or schedule assignment', async () => {
  const original = {
    findOneAndUpdate: User.findOneAndUpdate,
    profileFindOne: EmployeeProfile.findOne,
    profileUpdate: EmployeeProfile.findOneAndUpdate,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  const employeeId = '507f1f77bcf86cd799439011';
  let updateFilter;
  let profileUpdate;
  let auditRecord;
  try {
    process.env.JWT_SECRET = 'employee-workflow-tests';
    User.findOneAndUpdate = async (filter, update) => {
      updateFilter = filter;
      assert.match(update.$set.password, /^\$2[aby]\$/);
      assert.equal(update.$set.status, 'active');
      assert.equal(update.$set.invitationToken, null);
      return { _id: employeeId, employeeType: 'service_window_officer' };
    };
    EmployeeProfile.findOne = () => ({
      select: () => ({ lean: async () => ({ userId: employeeId }) }),
    });
    EmployeeProfile.findOneAndUpdate = async (...args) => { profileUpdate = args; };
    AuditLog.create = async (record) => { auditRecord = record; };
    const response = createResponse();

    await employeeController.setInitialEmployeePassword({
      body: {
        email: 'EMPLOYEE@MESOB.ORG',
        nationalId: '123456789012',
        password: 'secure-passphrase',
        confirmation: 'secure-passphrase',
      },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(updateFilter.email, 'employee@mesob.org');
    assert.equal(updateFilter.status, 'approved');
    assert.deepEqual(updateFilter.$or, [
      { 'profile.nationalIdHash': getFanHash('123456789012') },
      { _id: employeeId },
    ]);
    assert.equal('profile.officeId' in updateFilter, false);
    assert.equal('profile.schedule.0' in updateFilter, false);
    assert.equal(profileUpdate[1].status, 'active');
    assert.equal(auditRecord.action, 'SET_EMPLOYEE_INITIAL_PASSWORD');
  } finally {
    User.findOneAndUpdate = original.findOneAndUpdate;
    EmployeeProfile.findOne = original.profileFindOne;
    EmployeeProfile.findOneAndUpdate = original.profileUpdate;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('active employee without office or schedule receives no assigned bookings while waiting', async () => {
  const original = User.findById;
  try {
    User.findById = () => ({
      select: async () => ({
        status: 'active',
        employeeType: 'service_window_officer',
        profile: { officeId: null, schedule: [] },
      }),
    });
    const response = createResponse();

    await employeeController.getAssignedBookings({
      user: { id: '507f1f77bcf86cd799439011' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { bookings: [], history: [] });
  } finally {
    User.findById = original;
  }
});

test('only service window officers can access assigned appointments', async () => {
  const original = User.findById;
  try {
    User.findById = () => ({
      select: async () => ({
        status: 'active',
        employeeType: 'floor_window_manager',
        profile: { officeId: '507f1f77bcf86cd799439013', schedule: [{ day: 'monday' }] },
      }),
    });
    const response = createResponse();

    await employeeController.getAssignedBookings({
      user: { id: '507f1f77bcf86cd799439011' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /active employee/i);
  } finally {
    User.findById = original;
  }
});

test('employee activation rejects a mismatched name before changing account state', async () => {
  const original = {
    findOne: User.findOne,
    findOneAndUpdate: User.findOneAndUpdate,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  const nationalId = '123456789012';
  User.findOne = () => ({
    select: () => ({
      lean: async () => ({
        _id: '507f1f77bcf86cd799439011',
        name: 'Example Employee',
        employeeType: 'service_window_officer',
        profile: { nationalIdHash: getFanHash(nationalId) },
      }),
    }),
  });
  let updateCalled = false;
  User.findOneAndUpdate = async () => {
    updateCalled = true;
    return null;
  };
  try {
    const response = createResponse();
    await employeeController.activateEmployee({
      body: { token: 'b'.repeat(64), name: 'Someone Else', nationalId, password: 'secure-passphrase' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /does not match/);
    assert.equal(updateCalled, false);
  } finally {
    User.findOne = original.findOne;
    User.findOneAndUpdate = original.findOneAndUpdate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('activated employee receives their server-assigned employee type', async () => {
  const original = {
    findOne: User.findOne,
    findOneAndUpdate: User.findOneAndUpdate,
    profileUpdate: EmployeeProfile.findOneAndUpdate,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  const nationalId = '123456789012';
  User.findOne = () => ({
    select: () => ({
      lean: async () => ({
        _id: '507f1f77bcf86cd799439011',
        name: 'Example Guard',
        employeeType: 'security_guard',
        profile: { nationalIdHash: getFanHash(nationalId) },
      }),
    }),
  });
  let updateFilter;
  User.findOneAndUpdate = async (filter) => {
    updateFilter = filter;
    return { _id: '507f1f77bcf86cd799439011', employeeType: 'security_guard' };
  };
  EmployeeProfile.findOneAndUpdate = async () => {};
  try {
    const response = createResponse();
    await employeeController.activateEmployee({
      body: { token: 'c'.repeat(64), name: 'Example Guard', nationalId, password: 'secure-passphrase' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.employeeType, 'security_guard');
    assert.ok(updateFilter['profile.officeId']);
    assert.ok(updateFilter['profile.schedule.0']);
    assert.equal('profile.windowId' in updateFilter, false);
  } finally {
    User.findOne = original.findOne;
    User.findOneAndUpdate = original.findOneAndUpdate;
    EmployeeProfile.findOneAndUpdate = original.profileUpdate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('approved employee can set a first password with email and National ID', async () => {
  const original = {
    findOneAndUpdate: User.findOneAndUpdate,
    profileFindOne: EmployeeProfile.findOne,
    profileUpdate: EmployeeProfile.findOneAndUpdate,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  const employeeId = '507f1f77bcf86cd799439011';
  let updateFilter;
  let profileUpdate;
  let auditRecord;
  try {
    User.findOneAndUpdate = async (filter, update) => {
      updateFilter = filter;
      assert.match(update.$set.password, /^\$2[aby]\$/);
      return { _id: employeeId, employeeType: 'service_window_officer' };
    };
    EmployeeProfile.findOne = () => ({
      select: () => ({ lean: async () => null }),
    });
    EmployeeProfile.findOneAndUpdate = async (...args) => { profileUpdate = args; };
    AuditLog.create = async (record) => { auditRecord = record; };
    const response = createResponse();

    await employeeController.setInitialEmployeePassword({
      body: {
        email: 'EMPLOYEE@MESOB.ORG',
        nationalId: '123456789012',
        password: 'secure-passphrase',
        confirmation: 'secure-passphrase',
      },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(updateFilter.email, 'employee@mesob.org');
    assert.equal(updateFilter.role, 'employee');
    assert.equal(updateFilter.status, 'approved');
    assert.deepEqual(updateFilter.$or, [
      { 'profile.nationalIdHash': getFanHash('123456789012') },
    ]);
    assert.equal('profile.officeId' in updateFilter, false);
    assert.equal('profile.schedule.0' in updateFilter, false);
    assert.equal(updateFilter.invitationUsedAt, null);
    assert.equal(response.body.employeeType, 'service_window_officer');
    assert.equal(profileUpdate[1].status, 'active');
    assert.equal(auditRecord.action, 'SET_EMPLOYEE_INITIAL_PASSWORD');
  } finally {
    User.findOneAndUpdate = original.findOneAndUpdate;
    EmployeeProfile.findOne = original.profileFindOne;
    EmployeeProfile.findOneAndUpdate = original.profileUpdate;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('employee first-password setup rejects mismatched password confirmation', async () => {
  const original = User.findOneAndUpdate;
  let updateCalled = false;
  try {
    User.findOneAndUpdate = async () => {
      updateCalled = true;
      return null;
    };
    const response = createResponse();
    await employeeController.setInitialEmployeePassword({
      body: {
        email: 'employee@mesob.org',
        nationalId: '123456789012',
        password: 'secure-passphrase',
        confirmation: 'different-passphrase',
      },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 400);
    assert.equal(updateCalled, false);
  } finally {
    User.findOneAndUpdate = original;
  }
});

test('employee portal login does not require MFA even when enabled for the account', async () => {
  const original = {
    findOne: User.findOne,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'employee-workflow-tests';
  let verifyMfaCalled = false;
  const employee = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Example Employee',
    email: 'employee@mesob.org',
    role: 'employee',
    employeeType: 'service_window_officer',
    status: 'active',
    profile: { nationalIdLastFour: '9012', schedule: [] },
    comparePassword: async () => true,
    requiresMfa: () => true,
    verifyMfaCode: () => { verifyMfaCalled = true; return false; },
    save: async () => {},
  };
  try {
    User.findOne = async () => employee;
    const response = createResponse();
    await authController.portalLogin({
      body: { email: employee.email, password: 'valid-password', role: 'employee' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.role, 'employee');
    assert.equal(response.body.user.officeAssigned, false);
    assert.equal(response.body.user.scheduleAssigned, false);
    assert.equal(verifyMfaCalled, false);
  } finally {
    User.findOne = original.findOne;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});
