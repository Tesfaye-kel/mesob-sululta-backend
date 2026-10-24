const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const {
  requireEmployeeManager,
  requireAllowedManagementChange,
  requireServiceRequirementManager,
} = require('../middleware/employeeManagementAccess');

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

test('active employee managers can access management before office or schedule assignment', async () => {
  const originalFindOne = User.findOne;
  try {
    User.findOne = () => ({
      select: async () => ({
        employeeType: 'floor_window_manager',
        profile: { officeId: '507f1f77bcf86cd799439013', schedule: [{ day: 'monday' }] },
      }),
    });
    const req = { user: { id: '507f1f77bcf86cd799439012' } };
    const res = createResponse();
    let nextCalled = false;

    await requireEmployeeManager(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.employeeManagementType, 'floor_window_manager');

    User.findOne = () => ({ select: async () => null });
    const deniedResponse = createResponse();
    await requireEmployeeManager({ user: req.user }, deniedResponse, () => { nextCalled = false; });
    assert.equal(deniedResponse.statusCode, 403);

    User.findOne = () => ({
      select: async () => ({ employeeType: 'floor_window_manager', profile: { officeId: null, schedule: [] } }),
    });
    const unassignedResponse = createResponse();
    nextCalled = false;
    await requireEmployeeManager({ user: req.user }, unassignedResponse, () => { nextCalled = true; });
    assert.equal(unassignedResponse.statusCode, 200);
    assert.equal(nextCalled, true);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('structure managers can change floors, offices, and windows only', () => {
  for (const entityType of ['floor', 'office', 'window']) {
    let nextCalled = false;
    requireAllowedManagementChange(
      { employeeManagementType: 'floor_window_manager', body: { entityType } },
      createResponse(),
      () => { nextCalled = true; },
    );
    assert.equal(nextCalled, true, `Structure managers should be able to manage ${entityType} records.`);
  }

  const res = createResponse();
  const req = { employeeManagementType: 'floor_window_manager', body: { entityType: 'service' } };
  let nextCalled = false;

  requireAllowedManagementChange(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('service managers can change services and requirements, but not office structure', () => {
  const allowedResponse = createResponse();
  let nextCalled = false;
  requireAllowedManagementChange(
    { employeeManagementType: 'service_requirement_manager', body: { entityType: 'requirement' } },
    allowedResponse,
    () => { nextCalled = true; },
  );
  assert.equal(nextCalled, true);

  const deniedResponse = createResponse();
  nextCalled = false;
  requireAllowedManagementChange(
    { employeeManagementType: 'service_requirement_manager', body: { entityType: 'window' } },
    deniedResponse,
    () => { nextCalled = true; },
  );
  assert.equal(nextCalled, false);
  assert.equal(deniedResponse.statusCode, 403);
});

test('requirement reordering is limited to service and requirement managers', () => {
  const res = createResponse();
  let nextCalled = false;

  requireServiceRequirementManager({ employeeManagementType: 'floor_window_manager' }, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
