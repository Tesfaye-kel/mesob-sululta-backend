const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const CitizenIdentity = require('../models/CitizenIdentity');
const AuditLog = require('../models/AuditLog');
const { getFanHash } = require('../services/citizenIdentityProvider');
const {
  registerCitizen,
  loginCitizen,
  setupCitizenPassword,
  resetCitizenPasswordInPerson,
} = require('../controllers/citizenAuthController');

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

test('citizen first-password setup requires a 12-digit numeric National ID', async () => {
  const res = createResponse();
  let nextError;

  await setupCitizenPassword({
    body: {
      token: 'a'.repeat(64),
      name: 'Test Citizen',
      nationalId: '12345678901A',
      password: 'secure-password',
      confirmation: 'secure-password',
    },
  }, res, (error) => { nextError = error; });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /12-digit National ID/);
});

test('citizen without a password must use the first-time setup form', async () => {
  const originalFind = CitizenIdentity.find;
  try {
    CitizenIdentity.find = (query) => {
      assert.equal(query.archivedAt, null);
      assert.equal(query.displayName, 'Test Citizen');
      return {
        collation: (options) => {
          assert.deepEqual(options, { locale: 'en', strength: 2 });
          return {
            select: () => ({
              lean: async () => [{
                displayName: 'Test Citizen',
                status: 'approved',
                password: null,
              }],
            }),
          };
        },
      };
    };
    const res = createResponse();
    let nextError;

    await loginCitizen({
      body: { name: 'Test Citizen', password: 'any-password' },
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'The sign-in details are incorrect.');
  } finally {
    CitizenIdentity.find = originalFind;
  }
});

test('registrar citizen password reset clears access and requires verified first-time setup', async () => {
  const original = {
    findOne: CitizenIdentity.findOne,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET,
  };
  const nationalId = '123456789012';
  let savedIdentity;
  let auditEntry;
  let identity;
  try {
    process.env.JWT_SECRET = 'citizen-password-reset-test-secret';
    identity = {
      _id: '507f1f77bcf86cd799439011',
      fanHash: getFanHash(nationalId),
      password: 'previous-hash',
      status: 'active',
      isActive: true,
      invitationToken: 'old-invitation',
      invitationExpiresAt: new Date(),
      invitationUsedAt: new Date(),
      passwordResetToken: 'old-reset',
      passwordResetExpiresAt: new Date(),
      passwordResetUsedAt: new Date(),
      save: async function () {
        savedIdentity = {
          password: this.password,
          status: this.status,
          isActive: this.isActive,
          invitationToken: this.invitationToken,
          invitationExpiresAt: this.invitationExpiresAt,
          invitationUsedAt: this.invitationUsedAt,
          passwordResetToken: this.passwordResetToken,
          passwordResetExpiresAt: this.passwordResetExpiresAt,
          passwordResetUsedAt: this.passwordResetUsedAt,
        };
      },
    };
    CitizenIdentity.findOne = async (filter) => {
      assert.equal(filter._id, identity._id);
      assert.equal(filter.archivedAt, null);
      return identity;
    };
    AuditLog.create = async (entry) => { auditEntry = entry; };
    const res = createResponse();
    let nextError;

    await resetCitizenPasswordInPerson({
      params: { citizenId: identity._id },
      body: { nationalId, nationalIdVerified: true },
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(savedIdentity.password, null);
    assert.equal(savedIdentity.status, 'approved');
    assert.equal(savedIdentity.isActive, false);
    assert.equal(savedIdentity.invitationToken, null);
    assert.equal(savedIdentity.invitationExpiresAt, null);
    assert.equal(savedIdentity.invitationUsedAt, null);
    assert.equal(savedIdentity.passwordResetToken, null);
    assert.equal(savedIdentity.passwordResetExpiresAt, null);
    assert.equal(savedIdentity.passwordResetUsedAt, null);
    assert.equal(auditEntry.action, 'RESET_CITIZEN_PASSWORD_IN_PERSON');
    assert.equal(auditEntry.details.requiresPasswordSetup, true);
  } finally {
    CitizenIdentity.findOne = original.findOne;
    AuditLog.create = original.auditCreate;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('citizen signs in with registered full name and password without National ID', async () => {
  const originalFind = CitizenIdentity.find;
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'citizen-name-login-test-secret';
  try {
    const passwordHash = await bcrypt.hash('secure-password', 4);
    CitizenIdentity.find = (query) => {
      assert.equal(query.displayName, 'Test Citizen');
      assert.equal(query.archivedAt, null);
      return {
        collation: () => ({
          select: () => ({
            lean: async () => [{
              _id: '507f1f77bcf86cd799439011',
              displayName: 'Test Citizen',
              password: passwordHash,
              status: 'active',
              isActive: true,
              occupation: 'Teacher',
              fanLastFour: '9012',
            }],
          }),
        }),
      };
    };
    const res = createResponse();
    let nextError;

    await loginCitizen({
      body: { name: '  Test   Citizen ', password: 'secure-password' },
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.name, 'Test Citizen');
    assert.equal(res.body.user.occupation, 'Teacher');
    assert.equal(res.body.user.maskedNationalId, '********9012');
    assert.equal(typeof res.body.token, 'string');
  } finally {
    CitizenIdentity.find = originalFind;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('citizen login rejects invalid full name or password input', async () => {
  const res = createResponse();
  let findCalled = false;
  const originalFind = CitizenIdentity.find;
  CitizenIdentity.find = () => {
    findCalled = true;
    throw new Error('Should not query for invalid input.');
  };
  try {
    await loginCitizen({ body: { name: 'A', password: '' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 400);
    assert.equal(findCalled, false);
  } finally {
    CitizenIdentity.find = originalFind;
  }
});

test('citizen registration explains that an existing National ID cannot be registered twice', async () => {
  const originalFindOne = CitizenIdentity.findOne;
  const originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-for-citizen-duplicate';
  try {
    CitizenIdentity.findOne = (query) => {
      assert.equal(query.archivedAt, null);
      return {
        select: () => ({
          lean: async () => ({
            displayName: 'Existing Citizen',
            status: 'legacy-status',
            fanLastFour: '9012',
          }),
        }),
      };
    };
    const res = createResponse();
    let nextError;

    await registerCitizen({
      body: { name: 'Test Citizen', nationalId: '123456789012', occupation: 'Teacher' },
      user: { id: '507f1f77bcf86cd799439022', role: 'registrar' },
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /legacy status/);
    assert.equal(res.body.existingAccount.displayName, 'Existing Citizen');
    assert.equal(res.body.existingAccount.status, 'legacy-status');
  } finally {
    CitizenIdentity.findOne = originalFindOne;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('citizen registration can reuse an ID when its previous account is archived', async () => {
  const originalExists = CitizenIdentity.exists;
  const originalFindOne = CitizenIdentity.findOne;
  const originalCreate = CitizenIdentity.create;
  const originalAuditCreate = AuditLog.create;
  const originalHashSecret = process.env.FAN_HASH_SECRET;
  let created;

  process.env.FAN_HASH_SECRET = 'citizen-registration-test-secret';
  try {
    CitizenIdentity.findOne = (query) => {
      assert.equal(query.archivedAt, null);
      return {
        select: () => ({
          lean: async () => null,
        }),
      };
    };
    CitizenIdentity.create = async (document) => {
      created = document;
      return { _id: '507f1f77bcf86cd799439021' };
    };
    AuditLog.create = async () => {};
    const res = createResponse();
    let nextError;

    await registerCitizen({
      body: { name: 'New Citizen', nationalId: '123456789012', occupation: 'Teacher' },
      user: { id: '507f1f77bcf86cd799439022', role: 'registrar' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 201);
    assert.equal(created.fanLastFour, '9012');
    assert.equal(created.status, 'approved');
    assert.match(res.body.message, /create their password from the citizen sign-in page/);
    assert.equal(res.body.setupUrl, undefined);
  } finally {
    CitizenIdentity.exists = originalExists;
    CitizenIdentity.findOne = originalFindOne;
    CitizenIdentity.create = originalCreate;
    AuditLog.create = originalAuditCreate;
    if (originalHashSecret === undefined) delete process.env.FAN_HASH_SECRET;
    else process.env.FAN_HASH_SECRET = originalHashSecret;
  }
});

test('citizen registration does not report an audit-log duplicate as an existing National ID', async () => {
  const originalFindOne = CitizenIdentity.findOne;
  const originalCreate = CitizenIdentity.create;
  const originalAuditCreate = AuditLog.create;
  const originalHashSecret = process.env.FAN_HASH_SECRET;
  const auditError = Object.assign(new Error('duplicate audit entry'), {
    code: 11000,
    keyPattern: { action: 1 },
  });

  process.env.FAN_HASH_SECRET = 'citizen-registration-test-secret';
  try {
    CitizenIdentity.findOne = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });
    CitizenIdentity.create = async () => ({ _id: '507f1f77bcf86cd799439021' });
    AuditLog.create = async () => { throw auditError; };
    const res = createResponse();
    let nextError;

    await registerCitizen({
      body: { name: 'New Citizen', nationalId: '123456789012', occupation: 'Teacher' },
      user: { id: '507f1f77bcf86cd799439022', role: 'registrar' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, auditError);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, null);
  } finally {
    CitizenIdentity.findOne = originalFindOne;
    CitizenIdentity.create = originalCreate;
    AuditLog.create = originalAuditCreate;
    if (originalHashSecret === undefined) delete process.env.FAN_HASH_SECRET;
    else process.env.FAN_HASH_SECRET = originalHashSecret;
  }
});

test('citizen first-password setup hashes the single-use token and activates the citizen', async () => {
  const originalFindOne = CitizenIdentity.findOne;
  const originalFindOneAndUpdate = CitizenIdentity.findOneAndUpdate;
  const originalAuditCreate = AuditLog.create;
  const originalJwtSecret = process.env.JWT_SECRET;
  const rawToken = 'b'.repeat(64);
  let expectedIdHash;
  let lookup;
  let update;
  let audit;

  process.env.JWT_SECRET = 'test-secret-for-citizen-setup';
  try {
    expectedIdHash = require('../services/citizenIdentityProvider').getFanHash('123456789012');
    CitizenIdentity.findOne = (query) => {
      lookup = query;
      return { select: async () => ({ _id: '507f1f77bcf86cd799439011', displayName: 'Test Citizen' }) };
    };
    CitizenIdentity.findOneAndUpdate = async (query, updateDoc, options) => {
      update = { query, updateDoc, options };
      return { _id: '507f1f77bcf86cd799439011' };
    };
    AuditLog.create = async (entry) => { audit = entry; };
    const res = createResponse();
    let nextError;

    await setupCitizenPassword({
      body: {
        token: rawToken,
        name: 'Test Citizen',
        nationalId: '123456789012',
        password: 'secure-password',
        confirmation: 'secure-password',
      },
      user: { id: '507f1f77bcf86cd799439022', role: 'registrar' },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Password set. You can now sign in.');
    assert.equal(lookup.fanHash, expectedIdHash);
    assert.notEqual(lookup.invitationToken, rawToken);
    assert.equal(update.query.invitationToken, lookup.invitationToken);
    assert.equal(update.updateDoc.$set.status, 'active');
    assert.equal(update.updateDoc.$set.isActive, true);
    assert.equal(update.updateDoc.$set.invitationToken, null);
    assert.ok(await bcrypt.compare('secure-password', update.updateDoc.$set.password));
    assert.equal(audit.action, 'SET_CITIZEN_INITIAL_PASSWORD');
    assert.deepEqual(audit.details, {});
    assert.equal(update.options.returnDocument, 'after');
  } finally {
    CitizenIdentity.findOne = originalFindOne;
    CitizenIdentity.findOneAndUpdate = originalFindOneAndUpdate;
    AuditLog.create = originalAuditCreate;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('citizen can create a first password directly with registered name and National ID', async () => {
  const originalFindOne = CitizenIdentity.findOne;
  const originalFindOneAndUpdate = CitizenIdentity.findOneAndUpdate;
  const originalAuditCreate = AuditLog.create;
  const originalHashSecret = process.env.FAN_HASH_SECRET;
  let lookup;
  let update;

  process.env.FAN_HASH_SECRET = 'citizen-direct-password-test-secret';
  try {
    CitizenIdentity.findOne = (query) => {
      lookup = query;
      return {
        select: async () => ({
          _id: '507f1f77bcf86cd799439011',
          displayName: 'Test Citizen',
        }),
      };
    };
    CitizenIdentity.findOneAndUpdate = async (query, updateDoc, options) => {
      update = { query, updateDoc, options };
      return { _id: '507f1f77bcf86cd799439011' };
    };
    AuditLog.create = async () => {};
    const res = createResponse();
    let nextError;

    await setupCitizenPassword({
      body: {
        name: 'Test Citizen',
        nationalId: '123456789012',
        password: 'secure-password',
        confirmation: 'secure-password',
      },
      ip: '127.0.0.1',
    }, res, (error) => { nextError = error; });

    assert.equal(nextError, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Password set. You can now sign in.');
    assert.equal(lookup.status, 'approved');
    assert.equal(lookup.password, null);
    assert.equal(lookup.invitationToken, undefined);
    assert.equal(update.query.invitationToken, undefined);
    assert.equal(update.updateDoc.$set.status, 'active');
    assert.equal(update.updateDoc.$set.isActive, true);
    assert.ok(await bcrypt.compare('secure-password', update.updateDoc.$set.password));
  } finally {
    CitizenIdentity.findOne = originalFindOne;
    CitizenIdentity.findOneAndUpdate = originalFindOneAndUpdate;
    AuditLog.create = originalAuditCreate;
    if (originalHashSecret === undefined) delete process.env.FAN_HASH_SECRET;
    else process.env.FAN_HASH_SECRET = originalHashSecret;
  }
});
