const test = require('node:test');
const assert = require('node:assert/strict');
const employeeRoutes = require('../routes/employeeRoutes');

function getRoleGuard(path, method) {
  const layer = employeeRoutes.stack.find((entry) => (
    entry.route?.path === path && entry.route.methods[method]
  ));
  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} route`);
  return layer.route.stack[1].handle;
}

async function checkRole(guard, role) {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  guard({ user: { role } }, response, () => { nextCalled = true; });
  return { ...response, nextCalled };
}

test('registrars can submit employee registrations but cannot approve or assign them', async () => {
  const createResult = await checkRole(getRoleGuard('/', 'post'), 'registrar');
  assert.equal(createResult.nextCalled, true);

  for (const [path, method] of [
    ['/:employeeId/approve', 'post'],
    ['/:employeeId/assign', 'put'],
    ['/:employeeId/work-schedule', 'put'],
    ['/:employeeId/status', 'patch'],
  ]) {
    const result = await checkRole(getRoleGuard(path, method), 'registrar');
    assert.equal(result.nextCalled, false, `${method.toUpperCase()} ${path} must reject registrars`);
    assert.equal(result.statusCode, 403);
  }
});

test('only administrators can approve or assign employees', async () => {
  for (const [path, method] of [
    ['/:employeeId/approve', 'post'],
    ['/:employeeId/assign', 'put'],
    ['/:employeeId/work-schedule', 'put'],
    ['/:employeeId/status', 'patch'],
  ]) {
    for (const role of ['admin', 'super_admin']) {
      const result = await checkRole(getRoleGuard(path, method), role);
      assert.equal(result.nextCalled, true, `${role} should be allowed to ${method} ${path}`);
    }
  }
});
