const test = require('node:test');
const assert = require('node:assert/strict');
const AppointmentBooking = require('../models/AppointmentBooking');
const { ACTIVE_BOOKING_STATUSES } = require('../utils/appointmentBookingRules');

test('appointment uniqueness is limited to one active booking per citizen, office, and date', () => {
  const officeDayIndex = AppointmentBooking.schema.indexes().find(([keys, options]) =>
    keys.citizenIdentityId === 1 &&
    keys.officeId === 1 &&
    keys.slotDate === 1 &&
    options.unique === true
  );

  assert.ok(officeDayIndex, 'a unique citizen-office-date index should exist');
  assert.deepEqual(officeDayIndex[1].partialFilterExpression, {
    dailyBookingActive: true,
  });
  assert.equal(AppointmentBooking.schema.path('dailyBookingActive').defaultValue, true);
  assert.equal(ACTIVE_BOOKING_STATUSES.includes('CANCELLED'), false);
});
