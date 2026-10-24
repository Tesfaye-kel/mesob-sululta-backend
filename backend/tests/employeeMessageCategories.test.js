const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const EmployeeMessage = require('../models/EmployeeMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
  createEmployeeMessage,
  getAdminEmployeeMessages,
  getItSupportMessages,
  markItSupportMessagesRead,
  archiveItSupportMessage,
  respondToItSupportMessage,
} = require('../controllers/employeeMessageController');

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; },
});

test('IT Support messages persist their category and notify active IT Support officers only', async () => {
  const original = {
    userFindOne: User.findOne,
    userFind: User.find,
    messageCreate: EmployeeMessage.create,
    notificationInsertMany: Notification.insertMany,
    auditCreate: AuditLog.create,
    startSession: mongoose.startSession,
  };
  let createdMessage;
  let notificationRecipients;
  let recipientQuery;
  const employee = { _id: 'employee-id', name: 'Receptionist', employeeType: 'receptionist' };
  User.findOne = () => ({ select: async () => employee });
  User.find = (query) => {
    recipientQuery = query;
    return { select: () => ({ lean: async () => [{ _id: 'it-support-id' }] }) };
  };
  EmployeeMessage.create = async ([message]) => {
    createdMessage = { _id: 'message-id', ...message };
    return [createdMessage];
  };
  Notification.insertMany = async (notifications) => { notificationRecipients = notifications; };
  AuditLog.create = async () => ({});
  mongoose.startSession = async () => ({
    withTransaction: async (callback) => callback(),
    endSession: async () => {},
  });

  try {
    const response = makeResponse();
    await createEmployeeMessage({
      body: { type: 'feedback', recipientCategory: 'it_support', subject: 'Computer issue', message: 'Please help with the office computer.' },
      user: { id: employee._id },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 201);
    assert.equal(createdMessage.recipientCategory, 'it_support');
    assert.deepEqual(recipientQuery, {
      role: 'employee',
      employeeType: 'it_support_officer',
      status: 'active',
      archivedAt: null,
    });
    assert.deepEqual(notificationRecipients.map((item) => item.userId), ['it-support-id']);
    assert.match(notificationRecipients[0].title, /^IT Support feedback:/);
    assert.equal(response.body.message, 'Your message was sent to IT Support.');
  } finally {
    User.findOne = original.userFindOne;
    User.find = original.userFind;
    EmployeeMessage.create = original.messageCreate;
    Notification.insertMany = original.notificationInsertMany;
    AuditLog.create = original.auditCreate;
    mongoose.startSession = original.startSession;
  }
});

test('Security Guard cannot submit an IT Support message', async () => {
  const originalFindOne = User.findOne;
  User.findOne = () => ({
    select: async () => ({ _id: 'guard-id', name: 'Guard', employeeType: 'security_guard' }),
  });

  try {
    const response = makeResponse();
    await createEmployeeMessage({
      body: { type: 'feedback', recipientCategory: 'it_support', subject: 'Device issue', message: 'Please help with this device.' },
      user: { id: 'guard-id' },
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /Security Guard/);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('Admin inbox includes legacy messages and never exposes IT Support messages', async () => {
  const original = {
    messageFind: EmployeeMessage.find,
    messageCount: EmployeeMessage.countDocuments,
  };
  let findFilter;
  let countFilter;
  EmployeeMessage.find = () => {
    const query = {
      where(filter) { findFilter = filter; return this; },
      populate() { return this; },
      sort() { return this; },
      skip() { return this; },
      limit() { return this; },
      lean: async () => [],
    };
    return query;
  };
  EmployeeMessage.countDocuments = async (filter) => {
    countFilter = filter;
    return 0;
  };

  try {
    const response = makeResponse();
    await getAdminEmployeeMessages({
      query: { page: '1', limit: '25' },
    }, response, (error) => { throw error; });

    const expectedFilter = {
      adminArchivedAt: null,
      $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
    };
    assert.deepEqual(findFilter, expectedFilter);
    assert.deepEqual(countFilter, expectedFilter);
    assert.deepEqual(response.body.messages, []);
  } finally {
    EmployeeMessage.find = original.messageFind;
    EmployeeMessage.countDocuments = original.messageCount;
  }
});

test('IT Support officer inbox loads only messages addressed to IT Support', async () => {
  const original = {
    userFindOne: User.findOne,
    messageFind: EmployeeMessage.find,
    messageDistinct: EmployeeMessage.distinct,
    notificationCount: Notification.countDocuments,
  };
  let inboxFilter;
  let unreadFilter;
  User.findOne = () => ({ select: async () => ({ _id: 'support-id' }) });
  EmployeeMessage.find = (filter) => {
    inboxFilter = filter;
    return {
      populate() { return this; },
      sort() { return this; },
      limit() { return this; },
      lean: async () => [{ _id: 'message-id' }],
    };
  };
  EmployeeMessage.distinct = async (field, filter) => {
    assert.equal(field, '_id');
    assert.deepEqual(filter, inboxFilter);
    return ['message-id'];
  };
  Notification.countDocuments = async (filter) => {
    unreadFilter = filter;
    return 1;
  };

  try {
    const response = makeResponse();
    await getItSupportMessages({ user: { id: 'support-id' } }, response, (error) => { throw error; });
    assert.deepEqual(inboxFilter, { recipientCategory: 'it_support', adminArchivedAt: null, itSupportArchivedAt: null });
    assert.deepEqual(unreadFilter, {
      userId: 'support-id',
      userModel: 'User',
      type: 'employee_message',
      isRead: false,
      deletedAt: null,
      relatedId: { $in: ['message-id'] },
    });
    assert.deepEqual(response.body.messages, [{ _id: 'message-id' }]);
    assert.equal(response.body.unreadCount, 1);
  } finally {
    User.findOne = original.userFindOne;
    EmployeeMessage.find = original.messageFind;
    EmployeeMessage.distinct = original.messageDistinct;
    Notification.countDocuments = original.notificationCount;
  }
});

test('Opening IT Support inbox marks its messages read', async () => {
  const original = {
    userFindOne: User.findOne,
    messageDistinct: EmployeeMessage.distinct,
    notificationUpdate: Notification.updateMany,
  };
  let notificationFilter;
  let notificationUpdate;
  User.findOne = () => ({ select: async () => ({ _id: 'support-id' }) });
  EmployeeMessage.distinct = async () => ['message-id'];
  Notification.updateMany = async (filter, update) => {
    notificationFilter = filter;
    notificationUpdate = update;
  };

  try {
    const response = makeResponse();
    await markItSupportMessagesRead({ user: { id: 'support-id' } }, response, (error) => { throw error; });
    assert.deepEqual(notificationFilter.relatedId, { $in: ['message-id'] });
    assert.equal(notificationFilter.userId, 'support-id');
    assert.deepEqual(notificationUpdate, { $set: { isRead: true } });
    assert.deepEqual(response.body, { unreadCount: 0 });
  } finally {
    User.findOne = original.userFindOne;
    EmployeeMessage.distinct = original.messageDistinct;
    Notification.updateMany = original.notificationUpdate;
  }
});

test('IT Support officer replies notify the original sender', async () => {
  const original = {
    userFindOne: User.findOne,
    messageUpdate: EmployeeMessage.findOneAndUpdate,
    notificationCreate: Notification.create,
    auditCreate: AuditLog.create,
  };
  let messageFilter;
  let notification;
  const message = {
    _id: '507f1f77bcf86cd799439011',
    authorRole: 'employee',
    employeeId: 'sender-id',
    subject: 'Computer issue',
  };
  User.findOne = () => ({ select: async () => ({ _id: 'support-id' }) });
  EmployeeMessage.findOneAndUpdate = async (filter) => {
    messageFilter = filter;
    return message;
  };
  Notification.create = async (value) => { notification = value; };
  AuditLog.create = async () => ({});

  try {
    const response = makeResponse();
    await respondToItSupportMessage({
      params: { messageId: message._id },
      body: { response: 'Please restart the workstation.' },
      user: { id: 'support-id' },
    }, response, (error) => { throw error; });
    assert.deepEqual(messageFilter, {
      _id: message._id,
      recipientCategory: 'it_support',
      adminArchivedAt: null,
      itSupportArchivedAt: null,
    });
    assert.equal(notification.userId, 'sender-id');
    assert.match(notification.title, /^IT Support replied:/);
    assert.equal(response.statusCode, 200);
  } finally {
    User.findOne = original.userFindOne;
    EmployeeMessage.findOneAndUpdate = original.messageUpdate;
    Notification.create = original.notificationCreate;
    AuditLog.create = original.auditCreate;
  }
});

test('IT Support officer can archive an inbox message without deleting sender history', async () => {
  const original = {
    userFindOne: User.findOne,
    messageUpdate: EmployeeMessage.findOneAndUpdate,
    notificationUpdate: Notification.updateMany,
    auditCreate: AuditLog.create,
  };
  let messageFilter;
  let update;
  let notificationFilter;
  let auditEntry;
  const message = {
    _id: '507f1f77bcf86cd799439011',
    authorRole: 'employee',
    employeeId: 'sender-id',
  };
  User.findOne = () => ({ select: async () => ({ _id: 'support-id' }) });
  EmployeeMessage.findOneAndUpdate = async (filter, changes) => {
    messageFilter = filter;
    update = changes;
    return message;
  };
  Notification.updateMany = async (filter) => { notificationFilter = filter; };
  AuditLog.create = async (entry) => { auditEntry = entry; };

  try {
    const response = makeResponse();
    await archiveItSupportMessage({
      params: { messageId: message._id },
      user: { id: 'support-id' },
      ip: '127.0.0.1',
    }, response, (error) => { throw error; });

    assert.deepEqual(messageFilter, {
      _id: message._id,
      recipientCategory: 'it_support',
      adminArchivedAt: null,
      itSupportArchivedAt: null,
    });
    assert.ok(update.$set.itSupportArchivedAt instanceof Date);
    assert.equal(notificationFilter.userId, 'support-id');
    assert.equal(notificationFilter.relatedId, message._id);
    assert.equal(auditEntry.action, 'ARCHIVE_IT_SUPPORT_MESSAGE');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, 'Message removed from the IT Support inbox.');
  } finally {
    User.findOne = original.userFindOne;
    EmployeeMessage.findOneAndUpdate = original.messageUpdate;
    Notification.updateMany = original.notificationUpdate;
    AuditLog.create = original.auditCreate;
  }
});

test('Admin inbox rejects attempts to query IT Support messages', async () => {
  const response = makeResponse();
  await getAdminEmployeeMessages({
    query: { page: '1', limit: '25', recipientCategory: 'it_support' },
  }, response, (error) => { throw error; });
  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /IT Support inbox/);
});
