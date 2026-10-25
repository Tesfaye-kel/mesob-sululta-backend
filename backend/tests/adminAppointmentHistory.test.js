const test = require('node:test');
const assert = require('node:assert/strict');
const AppointmentBooking = require('../models/AppointmentBooking');
const { getCitizenHistory } = require('../controllers/appointmentManagementController');

test('admin appointment history is restricted to check-ins from the last three days', async () => {
  const originalFind = AppointmentBooking.find;
  const originalCountDocuments = AppointmentBooking.countDocuments;
  let filter;
  let skip;
  let limit;

  AppointmentBooking.find = (query) => {
    filter = query;
    return {
      populate() { return this; },
      sort() { return this; },
      skip(value) { skip = value; return this; },
      limit(value) { limit = value; return this; },
      lean: async () => [],
    };
  };
  AppointmentBooking.countDocuments = async (query) => {
    assert.deepEqual(query, filter);
    return 0;
  };

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await getCitizenHistory({ query: { page: '2', limit: '10' } }, response, (error) => { throw error; });

    assert.equal(filter.checkedInAt.$gte instanceof Date, true);
    assert.equal(filter.checkedInAt.$lte instanceof Date, true);
    assert.ok(Math.abs(Date.now() - filter.checkedInAt.$lte.getTime()) < 1000);
    assert.equal(filter.checkedInAt.$lte.getTime() - filter.checkedInAt.$gte.getTime(), 3 * 24 * 60 * 60 * 1000);
    assert.equal(filter.slotDate, undefined);
    assert.equal(skip, 10);
    assert.equal(limit, 10);
    assert.deepEqual(response.body.pagination, { page: 2, limit: 10, total: 0, pages: 0 });
  } finally {
    AppointmentBooking.find = originalFind;
    AppointmentBooking.countDocuments = originalCountDocuments;
  }
});
