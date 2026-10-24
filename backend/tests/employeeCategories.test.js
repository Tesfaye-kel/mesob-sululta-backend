const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const employeeController = require('../controllers/employeeController');

const employeeTypes = [
  'service_window_officer',
  'security_guard',
  'floor_window_manager',
  'receptionist',
  'it_support_officer',
  'service_requirement_manager',
];

test('employee models accept every registrar employee category', () => {
  assert.deepEqual(User.schema.path('employeeType').enumValues, employeeTypes);
  assert.deepEqual(EmployeeProfile.schema.path('employeeType').enumValues, employeeTypes);
});

test('employee registration rejects a missing category', async () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await employeeController.createEmployee({
    body: {
      name: 'Example Employee',
      email: 'example@mesob.org',
      phone: '0922734614',
      nationalId: '123456789012',
      jobTitle: 'Service Clerk',
    },
    user: { id: '507f1f77bcf86cd799439012', role: 'admin' },
    ip: '127.0.0.1',
  }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /employee category/i);
});
