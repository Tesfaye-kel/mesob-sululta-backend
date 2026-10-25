const test = require('node:test');
const assert = require('node:assert/strict');
const CitizenIdentity = require('../models/CitizenIdentity');
const { getCitizenRegistrations } = require('../controllers/appointmentManagementController');

test('admin citizen registrations return paginated rows with masked national IDs and total count', async () => {
  const originalFind = CitizenIdentity.find;
  const originalCountDocuments = CitizenIdentity.countDocuments;
  const citizenId = '507f1f77bcf86cd799439011';
  let filter;
  let selection;
  let skip;
  let limit;

  CitizenIdentity.find = (query) => {
    filter = query;
    return {
      select(value) {
        selection = value;
        return this;
      },
      sort(value) {
        assert.deepEqual(value, { createdAt: -1, _id: -1 });
        return this;
      },
      skip(value) {
        skip = value;
        return this;
      },
      limit(value) {
        limit = value;
        return this;
      },
      lean: async () => [{
        _id: citizenId,
        displayName: 'Test Citizen',
        email: 'citizen@example.com',
        occupation: 'Farmer',
        status: 'approved',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        fanLastFour: '1234',
        fanHash: 'must-not-be-returned',
        email: 'citizen@example.com',
      }],
    };
  };
  CitizenIdentity.countDocuments = async (query) => {
    assert.deepEqual(query, filter);
    return 26;
  };

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await getCitizenRegistrations({ query: { page: '2', limit: '25' } }, response, (error) => { throw error; });

    assert.deepEqual(filter, { archivedAt: null });
    assert.equal(selection, 'displayName email occupation status createdAt +fanLastFour');
    assert.equal(skip, 25);
    assert.equal(limit, 25);
    assert.deepEqual(response.body, {
      registrations: [{
        _id: citizenId,
        displayName: 'Test Citizen',
        email: 'citizen@example.com',
        occupation: 'Farmer',
        status: 'approved',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        maskedNationalId: '********1234',
      }],
      pagination: { page: 2, limit: 25, total: 26, pages: 2 },
    });
    assert.equal(JSON.stringify(response.body).includes('must-not-be-returned'), false);
  } finally {
    CitizenIdentity.find = originalFind;
    CitizenIdentity.countDocuments = originalCountDocuments;
  }
});

test('admin citizen registrations reject invalid pagination', async () => {
  const originalFind = CitizenIdentity.find;
  CitizenIdentity.find = () => {
    throw new Error('Citizen query must not run for invalid pagination.');
  };

  try {
    let nextError;
    await getCitizenRegistrations({ query: { page: '0', limit: '25' } }, { json() {} }, (error) => { nextError = error; });

    assert.equal(nextError?.status, 400);
    assert.match(nextError?.message || '', /Page must be positive/);
  } finally {
    CitizenIdentity.find = originalFind;
  }
});

test('admin citizen registration search includes the final National ID digits', async () => {
  const originalFind = CitizenIdentity.find;
  const originalCountDocuments = CitizenIdentity.countDocuments;
  let filter;
  CitizenIdentity.find = (query) => {
    filter = query;
    return {
      select() { return this; },
      sort() { return this; },
      skip() { return this; },
      limit() { return this; },
      lean: async () => [],
    };
  };
  CitizenIdentity.countDocuments = async () => 0;

  try {
    const response = { json(body) { this.body = body; } };
    await getCitizenRegistrations({ query: { page: '1', limit: '25', search: '1234' } }, response, (error) => { throw error; });

    assert.deepEqual(filter, {
      archivedAt: null,
      $or: [
        { displayName: { $regex: '1234', $options: 'i' } },
        { email: { $regex: '1234', $options: 'i' } },
        { occupation: { $regex: '1234', $options: 'i' } },
        { status: { $regex: '1234', $options: 'i' } },
        { fanLastFour: { $regex: '1234$' } },
      ],
    });
    assert.deepEqual(response.body.pagination, { page: 1, limit: 25, total: 0, pages: 0 });
  } finally {
    CitizenIdentity.find = originalFind;
    CitizenIdentity.countDocuments = originalCountDocuments;
  }
});
