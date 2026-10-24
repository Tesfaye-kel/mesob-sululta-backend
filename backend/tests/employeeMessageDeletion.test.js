const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const EmployeeMessage = require('../models/EmployeeMessage');
const Notification = require('../models/Notification');
const employeeController = require('../controllers/employeeController');

test('employee conversation deletion hides its linked administrator reply notification', async () => {
  const original = {
    startSession: mongoose.startSession,
    findOneAndUpdate: EmployeeMessage.findOneAndUpdate,
    updateMany: Notification.updateMany,
    auditCreate: AuditLog.create,
  };
  let notificationFilter;
  let notificationUpdate;
  let audited = false;
  const messageId = new mongoose.Types.ObjectId();
  const employeeId = new mongoose.Types.ObjectId();
  mongoose.startSession = async () => ({
    withTransaction: async (callback) => callback(),
    endSession: async () => {},
  });
  EmployeeMessage.findOneAndUpdate = async (filter, update) => {
    assert.equal(String(filter._id), String(messageId));
    assert.equal(String(filter.employeeId), String(employeeId));
    assert.ok(update.$set.employeeDeletedAt instanceof Date);
    return { _id: messageId };
  };
  Notification.updateMany = async (filter, update) => {
    notificationFilter = filter;
    notificationUpdate = update;
    return { modifiedCount: 1 };
  };
  AuditLog.create = async (entry) => { audited = entry.action === 'HIDE_EMPLOYEE_MESSAGE'; };
  try {
    const response = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await employeeController.deleteEmployeeMessage({
      params: { messageId: String(messageId) },
      user: { id: String(employeeId), role: 'employee' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(notificationFilter.type, { $in: ['feedback_reply', 'employee_message'] });
    assert.equal(String(notificationFilter.relatedId), String(messageId));
    assert.equal(String(notificationFilter.userId), String(employeeId));
    assert.ok(notificationUpdate.$set.deletedAt instanceof Date);
    assert.equal(notificationUpdate.$set.isRead, true);
    assert.equal(audited, true);
  } finally {
    mongoose.startSession = original.startSession;
    EmployeeMessage.findOneAndUpdate = original.findOneAndUpdate;
    Notification.updateMany = original.updateMany;
    AuditLog.create = original.auditCreate;
  }
});
