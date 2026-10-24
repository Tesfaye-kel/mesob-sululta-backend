const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEmployeeSchedule,
  hasOverlappingShifts,
  validateRegistrarSchedule,
} = require('../utils/employeeSchedule');

test('employee schedule accepts multiple configured shifts and days off', () => {
  assert.equal(validateEmployeeSchedule([
    { day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' },
    { day: 'monday', shift: 'Afternoon', startTime: '13:00', endTime: '17:00' },
  ]), true);
  assert.equal(validateEmployeeSchedule([]), true);
});

test('employee schedule rejects invalid days, times, and non-positive intervals', () => {
  assert.equal(validateEmployeeSchedule([{ day: 'funday', shift: 'Morning', startTime: '08:00', endTime: '12:00' }]), false);
  assert.equal(validateEmployeeSchedule([{ day: 'monday', shift: 'Morning', startTime: '8am', endTime: '12:00' }]), false);
  assert.equal(validateEmployeeSchedule([{ day: 'monday', shift: 'Morning', startTime: '12:00', endTime: '12:00' }]), false);
});

test('employee schedule rejects empty shifts and oversized schedules', () => {
  assert.equal(validateEmployeeSchedule([{ day: 'monday', shift: '', startTime: '08:00', endTime: '12:00' }]), false);
  assert.equal(validateEmployeeSchedule(Array.from({ length: 29 }, () => ({
    day: 'monday',
    shift: 'Shift',
    startTime: '08:00',
    endTime: '12:00',
  }))), false);
});

test('work schedule overlap check detects intersecting shifts on the same day', () => {
  assert.equal(hasOverlappingShifts([
    { day: 'monday', startTime: '08:00', endTime: '12:00' },
    { day: 'monday', startTime: '11:30', endTime: '14:00' },
  ]), true);
  assert.equal(hasOverlappingShifts([
    { day: 'monday', startTime: '08:00', endTime: '12:00' },
    { day: 'tuesday', startTime: '08:00', endTime: '12:00' },
  ]), false);
});

test('registrar schedules use Morning or Afternoon shift names only', () => {
  assert.equal(validateRegistrarSchedule([
    { day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' },
    { day: 'monday', shift: 'Afternoon', startTime: '13:00', endTime: '17:00' },
  ]), true);
  assert.equal(validateRegistrarSchedule([
    { day: 'monday', shift: 'Night', startTime: '20:00', endTime: '23:00' },
  ]), false);
});
