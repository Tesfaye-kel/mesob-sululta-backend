const test = require('node:test');
const assert = require('node:assert/strict');
const Notification = require('../models/Notification');
const EmployeeMessage = require('../models/EmployeeMessage');
const User = require('../models/User');
const {
  getUnreadAdminInboxCount,
  getUnreadAdminEmployeeMessageCounts,
  markAdminInboxNotificationsRead,
} = require('../controllers/employeeMessageController');

test('admin unread inbox count sums feedback and staff notifications for the authenticated admin', async () => {
  const originalCountDocuments = Notification.countDocuments;
  const adminId = 'admin-user-id';
  const queries = [];
  Notification.countDocuments = async (filter) => {
    queries.push(filter);
    return filter.type === 'feedback_request' ? 2 : 3;
  };

  try {
    const response = {
      body: null,
      json(body) { this.body = body; },
    };
    await getUnreadAdminInboxCount({ user: { id: adminId } }, response, (error) => { throw error; });

    assert.deepEqual(queries, [
      { userId: adminId, userModel: 'User', isRead: false, deletedAt: null, type: 'feedback_request' },
      { userId: adminId, userModel: 'User', isRead: false, deletedAt: null, type: 'employee_message' },
    ]);
    assert.deepEqual(response.body, { count: 5, feedbackCount: 2, staffMessageCount: 3 });
  } finally {
    Notification.countDocuments = originalCountDocuments;
  }
});

test('opening the citizens tab marks only that admin feedback notifications read', async () => {
  const originalUpdateMany = Notification.updateMany;
  const originalCountDocuments = Notification.countDocuments;
  const adminId = 'admin-user-id';
  let query;
  let update;
  Notification.updateMany = async (filter, changes) => {
    query = filter;
    update = changes;
    return { modifiedCount: 1 };
  };
  Notification.countDocuments = async () => 4;

  try {
    const response = {
      body: null,
      json(body) { this.body = body; },
    };
    await markAdminInboxNotificationsRead({ user: { id: adminId }, body: { scope: 'feedback' } }, response, (error) => { throw error; });

    assert.deepEqual(query, {
      userId: adminId,
      userModel: 'User',
      type: 'feedback_request',
      isRead: false,
      deletedAt: null,
    });
    assert.deepEqual(update, { $set: { isRead: true } });
    assert.deepEqual(response.body, { message: 'Inbox notifications marked as read.', updated: 1, count: 4 });
  } finally {
    Notification.updateMany = originalUpdateMany;
    Notification.countDocuments = originalCountDocuments;
  }
});

test('opening the admin inbox marks all unread feedback and staff notifications read', async () => {
  const originalUpdateMany = Notification.updateMany;
  const originalCountDocuments = Notification.countDocuments;
  let query;
  Notification.updateMany = async (filter) => {
    query = filter;
    return { modifiedCount: 4 };
  };
  Notification.countDocuments = async () => 0;

  try {
    const response = {
      body: null,
      json(body) { this.body = body; },
    };
    await markAdminInboxNotificationsRead({
      user: { id: 'admin-user-id' },
      body: { scope: 'all' },
    }, response, (error) => { throw error; });

    assert.deepEqual(query, {
      userId: 'admin-user-id',
      userModel: 'User',
      type: { $in: ['employee_message', 'feedback_request'] },
      isRead: false,
      deletedAt: null,
    });
    assert.equal(response.body.updated, 4);
    assert.equal(response.body.count, 0);
  } finally {
    Notification.updateMany = originalUpdateMany;
    Notification.countDocuments = originalCountDocuments;
  }
});

test('unread employee notification counts are grouped by employee category', async () => {
  const original = {
    notificationFind: Notification.find,
    messageFind: EmployeeMessage.find,
    userFind: User.find,
  };
  Notification.find = () => ({
    select: () => ({
      lean: async () => [
        { relatedId: 'message-1' },
        { relatedId: 'message-2' },
        { relatedId: 'message-3' },
      ],
    }),
  });
  EmployeeMessage.find = () => ({
    select: () => ({
      lean: async () => [
        { _id: 'message-1', employeeId: 'employee-1' },
        { _id: 'message-2', employeeId: 'employee-1' },
        { _id: 'message-3', employeeId: 'employee-2' },
      ],
    }),
  });
  User.find = () => ({
    select: () => ({
      lean: async () => [
        { _id: 'employee-1', employeeType: 'security_guard' },
        { _id: 'employee-2', employeeType: 'receptionist' },
      ],
    }),
  });

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await getUnreadAdminEmployeeMessageCounts({ user: { id: 'admin-user-id' } }, response, (error) => { throw error; });
    assert.deepEqual(response.body, {
      total: 3,
      byEmployeeType: { security_guard: 2, receptionist: 1 },
      unreadMessageIds: ['message-1', 'message-2', 'message-3'],
    });
  } finally {
    Notification.find = original.notificationFind;
    EmployeeMessage.find = original.messageFind;
    User.find = original.userFind;
  }
});

test('marking an employee category read affects only notifications linked to that category', async () => {
  const original = {
    userFind: User.find,
    messageFind: EmployeeMessage.find,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
  };
  let userFilter;
  let messageFilter;
  let notificationFilter;
  User.find = (filter) => {
    userFilter = filter;
    return { select: () => ({ lean: async () => [{ _id: 'employee-1' }] }) };
  };
  EmployeeMessage.find = (filter) => {
    messageFilter = filter;
    return { select: () => ({ lean: async () => [{ _id: 'message-1' }] }) };
  };
  Notification.updateMany = async (filter) => {
    notificationFilter = filter;
    return { modifiedCount: 1 };
  };
  Notification.countDocuments = async () => 2;

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await markAdminInboxNotificationsRead({
      user: { id: 'admin-user-id' },
      body: { scope: 'staff', audience: 'employees', employeeType: 'security_guard' },
    }, response, (error) => { throw error; });

    assert.deepEqual(userFilter, { role: 'employee', employeeType: 'security_guard' });
    assert.deepEqual(messageFilter, { authorRole: 'employee', employeeId: { $in: ['employee-1'] } });
    assert.deepEqual(notificationFilter, {
      userId: 'admin-user-id',
      userModel: 'User',
      type: 'employee_message',
      isRead: false,
      deletedAt: null,
      relatedId: { $in: ['message-1'] },
    });
    assert.equal(response.body.count, 2);
  } finally {
    User.find = original.userFind;
    EmployeeMessage.find = original.messageFind;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
  }
});

test('marking one employee message read clears only that admins notification for that message', async () => {
  const original = {
    messageFindOne: EmployeeMessage.findOne,
    notificationUpdate: Notification.updateMany,
    notificationCount: Notification.countDocuments,
  };
  const messageId = '507f1f77bcf86cd799439011';
  let messageFilter;
  let notificationFilter;
  EmployeeMessage.findOne = (filter) => {
    messageFilter = filter;
    return { select: async () => ({ _id: messageId }) };
  };
  Notification.updateMany = async (filter) => {
    notificationFilter = filter;
    return { modifiedCount: 1 };
  };
  Notification.countDocuments = async () => 0;

  try {
    const response = { body: null, json(body) { this.body = body; } };
    await markAdminInboxNotificationsRead({
      user: { id: 'admin-user-id' },
      body: { scope: 'staff', messageId },
    }, response, (error) => { throw error; });

    assert.deepEqual(messageFilter, { _id: messageId, authorRole: 'employee' });
    assert.deepEqual(notificationFilter, {
      userId: 'admin-user-id',
      userModel: 'User',
      type: 'employee_message',
      isRead: false,
      deletedAt: null,
      relatedId: { $in: [messageId] },
    });
    assert.equal(response.body.updated, 1);
  } finally {
    EmployeeMessage.findOne = original.messageFindOne;
    Notification.updateMany = original.notificationUpdate;
    Notification.countDocuments = original.notificationCount;
  }
});

test('admin inbox read endpoint rejects missing notification scope', async () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await markAdminInboxNotificationsRead({ user: { id: 'admin-user-id' }, body: {} }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, 'Choose feedback, staff, or all as the notification scope.');
});
