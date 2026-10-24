const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Service = require('../models/Service');
const { requireServiceManager } = require('../middleware/requireServiceManager');

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

test('service management rejects employees outside the service manager category', async () => {
  const originalFindOne = User.findOne;
  try {
    User.findOne = () => ({ select: async () => null });
    const res = createResponse();
    let nextCalled = false;

    await requireServiceManager({ user: { id: '507f1f77bcf86cd799439012', role: 'employee' } }, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('service and requirement managers can manage services for any listed office', async () => {
  const originalFindOne = User.findOne;
  const officeId = '507f1f77bcf86cd799439013';
  try {
    User.findOne = () => ({
      select: async () => ({ _id: '507f1f77bcf86cd799439012' }),
    });
    const res = createResponse();
    let nextCalled = false;
    const req = {
      user: { id: '507f1f77bcf86cd799439012', role: 'employee' },
      baseUrl: '/api/services',
      method: 'POST',
      body: { organization: officeId },
    };

    await requireServiceManager(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.serviceManagerAllOffices, true);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('admin service and requirement access is read-only', async () => {
  const writeResponse = createResponse();
  let writeNextCalled = false;
  await requireServiceManager({
    user: { role: 'admin' },
    method: 'POST',
  }, writeResponse, () => { writeNextCalled = true; });

  assert.equal(writeNextCalled, false);
  assert.equal(writeResponse.statusCode, 403);

  const readResponse = createResponse();
  let readNextCalled = false;
  await requireServiceManager({
    user: { role: 'admin' },
    method: 'GET',
  }, readResponse, () => { readNextCalled = true; });

  assert.equal(readNextCalled, true);
  assert.equal(readResponse.statusCode, 200);
});

test('registrars cannot create services', async () => {
  const res = createResponse();
  let nextCalled = false;
  await requireServiceManager({
    user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
    baseUrl: '/api/services',
    method: 'POST',
    body: { organization: '507f1f77bcf86cd799439013' },
  }, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Service and Requirement Manager/);
});

test('registrars cannot edit services', async () => {
  const originalFindOne = User.findOne;
  const originalServiceFindById = Service.findById;
  User.findOne = () => { throw new Error('Registrar writes must be rejected before database lookups.'); };
  Service.findById = () => { throw new Error('Registrar writes must be rejected before database lookups.'); };
  try {
    const res = createResponse();
    let nextCalled = false;
    await requireServiceManager({
      user: { id: '507f1f77bcf86cd799439012', role: 'registrar' },
      baseUrl: '/api/services',
      method: 'PUT',
      params: { id: '507f1f77bcf86cd799439014' },
      body: { organization: '507f1f77bcf86cd799439011' },
    }, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Service and Requirement Manager/);
  } finally {
    User.findOne = originalFindOne;
    Service.findById = originalServiceFindById;
  }
});
