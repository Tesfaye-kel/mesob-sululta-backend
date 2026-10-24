const test = require('node:test');
const assert = require('node:assert/strict');
const { isAppointmentVisible } = require('../utils/citizenVisibility');

const booking = (overrides = {}) => ({
  status: 'CONFIRMED',
  slotDate: new Date('2025-01-10T00:00:00.000Z'),
  ...overrides,
});

test('appointment is visible from three local calendar days before through its date', () => {
  assert.equal(isAppointmentVisible(booking(), { now: new Date('2025-01-07T12:00:00.000Z') }), true);
  assert.equal(isAppointmentVisible(booking(), { now: new Date('2025-01-06T12:00:00.000Z') }), false);
  assert.equal(isAppointmentVisible(booking(), { now: new Date('2025-01-10T12:00:00.000Z') }), true);
});

test('unattended past appointments are hidden without deleting their records', () => {
  assert.equal(isAppointmentVisible(booking(), { now: new Date('2025-01-11T12:00:00.000Z') }), false);
  assert.equal(isAppointmentVisible(booking({ status: 'CANCELLED' }), { now: new Date('2025-01-10T12:00:00.000Z') }), false);
  assert.equal(isAppointmentVisible(booking({ status: 'NO_SHOW' }), { now: new Date('2025-01-10T12:00:00.000Z') }), false);
});

test('approved late attendance stays visible for three local calendar days after attendance', () => {
  const lateAttendance = booking({
    status: 'DELIVERED',
    deliveryId: { status: 'ATTENDANCE_APPROVED', actualAttendanceAt: new Date('2025-01-12T08:00:00.000Z') },
  });
  assert.equal(isAppointmentVisible(lateAttendance, { now: new Date('2025-01-15T12:00:00.000Z') }), true);
  assert.equal(isAppointmentVisible(lateAttendance, { now: new Date('2025-01-16T12:00:00.000Z') }), false);
});
