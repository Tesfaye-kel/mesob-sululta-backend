const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { getFanHash } = require('../services/citizenIdentityProvider');

function withEnvironment(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('FAN hashing falls back to the configured JWT secret', () => {
  withEnvironment({ FAN_HASH_SECRET: undefined, JWT_SECRET: 'jwt-secret-for-test' }, () => {
    const expected = crypto.createHmac('sha256', 'jwt-secret-for-test').update('TEST123456').digest('hex');
    assert.equal(getFanHash(' TEST123456 '), expected);
  });
});

test('a configured FAN hash secret takes precedence over the JWT secret', () => {
  withEnvironment({ FAN_HASH_SECRET: 'fan-secret-for-test', JWT_SECRET: 'jwt-secret-for-test' }, () => {
    const expected = crypto.createHmac('sha256', 'fan-secret-for-test').update('TEST123456').digest('hex');
    assert.equal(getFanHash('TEST123456'), expected);
  });
});

test('FAN hashing reports missing required server secrets', () => {
  withEnvironment({ FAN_HASH_SECRET: undefined, JWT_SECRET: undefined }, () => {
    assert.throws(getFanHash, {
      status: 503,
      message: 'JWT_SECRET must be configured before citizen FAN values can be stored safely.',
    });
  });
});
