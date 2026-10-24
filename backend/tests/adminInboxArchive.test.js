const test = require('node:test');
const assert = require('node:assert/strict');
const AuditLog = require('../models/AuditLog');
const EmployeeMessage = require('../models/EmployeeMessage');
const FeedbackRequest = require('../models/FeedbackRequest');
const Notification = require('../models/Notification');
const { archiveFeedbackFromAdminInbox } = require('../controllers/appointmentManagementController');
const { archiveAllFeedbackFromAdminInbox } = require('../controllers/appointmentManagementController');
const {
  archiveEmployeeMessageFromAdminInbox,
  archiveAllEmployeeMessagesFromAdminInbox,
} = require('../controllers/employeeMessageController');

test('admin can archive citizen feedback and clear its inbox notification', async () => {
  const original = {
    feedbackUpdate: FeedbackRequest.findOneAndUpdate,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
    auditCreate: AuditLog.create,
  };
  const feedbackId = '507f1f77bcf86cd799439011';
  let feedbackFilter;
  let notificationFilter;
  FeedbackRequest.findOneAndUpdate = async (filter) => {
    feedbackFilter = filter;
    return { _id: feedbackId, type: 'compliment' };
  };
  Notification.updateMany = async (filter) => {
    notificationFilter = filter;
    return { modifiedCount: 1 };
  };
  Notification.countDocuments = async () => 2;
  AuditLog.create = async () => ({});

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await archiveFeedbackFromAdminInbox({
      params: { feedbackId },
      user: { id: 'admin-user-id', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(feedbackFilter, { _id: feedbackId, adminArchivedAt: null });
    assert.deepEqual(notificationFilter, {
      relatedId: feedbackId,
      type: 'feedback_request',
      deletedAt: null,
    });
    assert.deepEqual(response.body, { message: 'Feedback removed from the admin inbox.', count: 2 });
  } finally {
    FeedbackRequest.findOneAndUpdate = original.feedbackUpdate;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
    AuditLog.create = original.auditCreate;
  }
});

test('admin can archive employee messages and clear their inbox notification', async () => {
  const original = {
    messageUpdate: EmployeeMessage.findOneAndUpdate,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
    auditCreate: AuditLog.create,
  };
  const messageId = '507f1f77bcf86cd799439012';
  let messageFilter;
  let notificationFilter;
  EmployeeMessage.findOneAndUpdate = async (filter) => {
    messageFilter = filter;
    return { _id: messageId, authorRole: 'employee' };
  };
  Notification.updateMany = async (filter) => {
    notificationFilter = filter;
    return { modifiedCount: 1 };
  };
  Notification.countDocuments = async () => 1;
  AuditLog.create = async () => ({});

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await archiveEmployeeMessageFromAdminInbox({
      params: { messageId },
      user: { id: 'admin-user-id', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(messageFilter, {
      _id: messageId,
      adminArchivedAt: null,
      $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
    });
    assert.deepEqual(notificationFilter, {
      relatedId: messageId,
      type: 'employee_message',
      deletedAt: null,
    });
    assert.deepEqual(response.body, { message: 'Message removed from the admin inbox.', count: 1 });
  } finally {
    EmployeeMessage.findOneAndUpdate = original.messageUpdate;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
    AuditLog.create = original.auditCreate;
  }
});

test('admin can archive all citizen feedback matching selected filters', async () => {
  const original = {
    feedbackFind: FeedbackRequest.find,
    feedbackUpdate: FeedbackRequest.updateMany,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
    auditCreate: AuditLog.create,
  };
  const feedbackIds = [
    '507f1f77bcf86cd799439011',
    '507f1f77bcf86cd799439012',
  ];
  const officeId = '507f1f77bcf86cd799439013';
  let feedbackFilter;
  let updateFilter;
  FeedbackRequest.find = (filter) => {
    feedbackFilter = filter;
    return { select: () => ({ lean: async () => feedbackIds.map((_id) => ({ _id, type: 'compliment' })) }) };
  };
  FeedbackRequest.updateMany = async (filter) => {
    updateFilter = filter;
    return { modifiedCount: feedbackIds.length };
  };
  Notification.updateMany = async () => ({ modifiedCount: feedbackIds.length });
  Notification.countDocuments = async () => 0;
  AuditLog.create = async () => ({});

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await archiveAllFeedbackFromAdminInbox({
      body: { officeId, status: 'new' },
      user: { id: 'admin-user-id', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(feedbackFilter, { adminArchivedAt: null, officeId, status: 'new' });
    assert.deepEqual(updateFilter, { _id: { $in: feedbackIds }, adminArchivedAt: null });
    assert.equal(response.body.archived, 2);
    assert.equal(response.body.count, 0);
  } finally {
    FeedbackRequest.find = original.feedbackFind;
    FeedbackRequest.updateMany = original.feedbackUpdate;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
    AuditLog.create = original.auditCreate;
  }
});

test('admin can archive all registrar messages without affecting employee messages', async () => {
  const original = {
    messageFind: EmployeeMessage.find,
    messageUpdate: EmployeeMessage.updateMany,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
    auditCreate: AuditLog.create,
  };
  const messageIds = ['507f1f77bcf86cd799439014'];
  let messageFilter;
  let updateFilter;
  EmployeeMessage.find = (filter) => {
    messageFilter = filter;
    return { select: () => ({ lean: async () => messageIds.map((_id) => ({ _id })) }) };
  };
  EmployeeMessage.updateMany = async (filter) => {
    updateFilter = filter;
    return { modifiedCount: messageIds.length };
  };
  Notification.updateMany = async () => ({ modifiedCount: messageIds.length });
  Notification.countDocuments = async () => 0;
  AuditLog.create = async () => ({});

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await archiveAllEmployeeMessagesFromAdminInbox({
      body: { audience: 'registrars', type: 'feedback' },
      user: { id: 'admin-user-id', role: 'admin' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(messageFilter, {
      authorRole: 'registrar',
      adminArchivedAt: null,
      registrarId: { $ne: null },
      type: 'feedback',
      $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
    });
    assert.deepEqual(updateFilter, { _id: { $in: messageIds }, adminArchivedAt: null });
    assert.equal(response.body.archived, 1);
    assert.equal(response.body.count, 0);
  } finally {
    EmployeeMessage.find = original.messageFind;
    EmployeeMessage.updateMany = original.messageUpdate;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
    AuditLog.create = original.auditCreate;
  }
});
