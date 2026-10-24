const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { portalLogin, setInitialPortalPassword } = require('../controllers/authController');
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

function createUser(role) {
  return {
    _id: `test-${role}-id`,
    name: `Test ${role}`,
    email: `${role}@example.test`,
    role,
    status: 'active',
    employeeType: 'service_window_officer',
    profile: {
      nationalIdHash: getFanHash('123456789012'),
      nationalIdLastFour: '9012',
      officeId: 'test-office-id',
    },
    comparePassword: async (password) => password === 'correct-password',
    requiresMfa: () => false,
    save: async () => {},
  };
}

test('shared employee portal login accepts employee and registrar accounts', async () => {
  const originalFindOne = User.findOne;
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'shared-portal-login-test-secret';

  try {
    for (const role of ['employee', 'registrar']) {
      const expectedUser = createUser(role);
      User.findOne = async () => expectedUser;
      const res = createResponse();

      await portalLogin({
        body: {
          email: expectedUser.email,
          password: 'correct-password',
          role: 'employee_or_registrar',
        },
      }, res, (error) => { throw error; });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.user.role, role);
      assert.ok(res.body.token);
    }
  } finally {
    User.findOne = originalFindOne;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('shared employee portal login accepts registrar National ID and rejects other roles', async () => {
  const originalFindOne = User.findOne;
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'shared-portal-login-test-secret';

  try {
    const registrar = createUser('registrar');
    User.findOne = async (query) => {
      assert.deepEqual(query, {
        role: 'registrar',
        'profile.nationalIdHash': getFanHash('123456789012'),
      });
      return registrar;
    };
    const registrarResponse = createResponse();

    await portalLogin({
      body: {
        email: '123456789012',
        password: 'correct-password',
        role: 'employee_or_registrar',
      },
    }, registrarResponse, (error) => { throw error; });

    assert.equal(registrarResponse.statusCode, 200);
    assert.equal(registrarResponse.body.user.role, 'registrar');

    User.findOne = async () => createUser('admin');
    const deniedResponse = createResponse();
    await portalLogin({
      body: {
        email: 'admin@example.test',
        password: 'correct-password',
        role: 'employee_or_registrar',
      },
    }, deniedResponse, (error) => { throw error; });

    assert.equal(deniedResponse.statusCode, 403);
    assert.equal(deniedResponse.body.message, 'Access denied: role mismatch.');
  } finally {
    User.findOne = originalFindOne;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('registrar can sign in after resetting and setting a new password', async () => {
  const original = {
    findOne: User.findOne,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'registrar-password-setup-test-secret';
  const registrar = {
    ...createUser('registrar'),
    status: 'pending',
    archivedAt: null,
    invitationToken: null,
    invitationExpiresAt: null,
    invitationUsedAt: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    save: async function () {
      this.password = await bcrypt.hash(this.password, 10);
    },
    comparePassword: async function (candidate) {
      return bcrypt.compare(candidate, this.password);
    },
  };
  User.findOne = () => ({ select: async () => registrar });
  AuditLog.create = async () => ({});

  try {
    const setupResponse = createResponse();
    await setInitialPortalPassword({
      body: {
        email: registrar.email,
        nationalId: '123456789012',
        password: 'new-registrar-password',
        confirmation: 'new-registrar-password',
      },
      ip: '127.0.0.1',
    }, setupResponse, (error) => { throw error; });

    assert.equal(setupResponse.statusCode, 200);
    assert.equal(registrar.status, 'active');
    assert.equal(await registrar.comparePassword('new-registrar-password'), true);

    User.findOne = async () => registrar;
    const loginResponse = createResponse();
    await portalLogin({
      body: {
        email: registrar.email,
        password: 'new-registrar-password',
        role: 'employee_or_registrar',
      },
    }, loginResponse, (error) => { throw error; });

    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.body.user.role, 'registrar');
  } finally {
    User.findOne = original.findOne;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});
