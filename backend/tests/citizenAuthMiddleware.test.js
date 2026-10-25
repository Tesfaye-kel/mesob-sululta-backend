const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const CitizenIdentity = require('../models/CitizenIdentity');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/authMiddleware');

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

test('active citizen JWT is authenticated against CitizenIdentity instead of User', async () => {
  const original = {
    findById: CitizenIdentity.findById,
    userFindById: User.findById,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'citizen-auth-middleware-test-secret';
  const identityId = '507f1f77bcf86cd799439011';
  let findId;
  let attachedUser;
  let nextCalled = false;
  CitizenIdentity.findById = (id) => {
    findId = id;
    return {
      select: async (fields) => {
        assert.equal(fields, 'status archivedAt isActive');
        return { status: 'active', archivedAt: null, isActive: true };
      },
    };
  };
  User.findById = () => {
    throw new Error('Citizen JWT must not be looked up as a User.');
  };

  try {
    const res = response();
    const token = jwt.sign({ id: identityId, role: 'citizen', verified: true }, process.env.JWT_SECRET);
    await authenticateJWT({ headers: { authorization: `Bearer ${token}` } }, res, (error) => {
      if (error) throw error;
      nextCalled = true;
    });

    assert.equal(findId, identityId);
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  } finally {
    CitizenIdentity.findById = original.findById;
    User.findById = original.userFindById;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});

test('inactive citizen JWT is rejected with a citizen-specific message', async () => {
  const original = {
    findById: CitizenIdentity.findById,
    userFindById: User.findById,
    jwtSecret: process.env.JWT_SECRET,
  };
  process.env.JWT_SECRET = 'citizen-auth-middleware-test-secret';
  CitizenIdentity.findById = () => ({
    select: async () => ({ status: 'approved', archivedAt: null, isActive: false }),
  });
  User.findById = () => {
    throw new Error('Citizen JWT must not be looked up as a User.');
  };

  try {
    const res = response();
    const token = jwt.sign({ id: '507f1f77bcf86cd799439012', role: 'citizen' }, process.env.JWT_SECRET);
    let nextCalled = false;
    await authenticateJWT({ headers: { authorization: `Bearer ${token}` } }, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, 'Citizen account is not active.');
    assert.equal(nextCalled, false);
  } finally {
    CitizenIdentity.findById = original.findById;
    User.findById = original.userFindById;
    if (original.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.jwtSecret;
  }
});
