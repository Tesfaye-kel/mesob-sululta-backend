const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const EmployeeMessage = require('../models/EmployeeMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

const messageRecipientCategory = (value) => value === undefined ? 'admin' : value;

const createEmployeeMessage = async (req, res, next) => {
  try {
    const { type, subject, message } = req.body;
    const recipientCategory = messageRecipientCategory(req.body.recipientCategory);
    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!['excuse', 'feedback', 'compliment', 'other'].includes(type) ||
        !['admin', 'it_support'].includes(recipientCategory) ||
        cleanSubject.length < 3 || cleanSubject.length > 160 ||
        cleanMessage.length < 10 || cleanMessage.length > 2000) {
      return res.status(400).json({ message: 'Choose a message type, enter a subject (3–160 characters), and a message (10–2000 characters).' });
    }
    const employee = await User.findOne({ _id: req.user.id, role: 'employee', status: 'active' })
      .select('_id name employeeType profile.officeId');
    if (!employee) return res.status(403).json({ message: 'An active employee account is required.' });
    if (recipientCategory === 'it_support' && employee.employeeType === 'security_guard') {
      return res.status(403).json({ message: 'Security Guard accounts can only send messages to Admin.' });
    }
    const recipients = recipientCategory === 'it_support'
      ? await User.find({
          role: 'employee',
          employeeType: 'it_support_officer',
          status: 'active',
          archivedAt: null,
        }).select('_id').lean()
      : await User.find({ role: 'admin', status: 'active', archivedAt: null }).select('_id').lean();
    if (!recipients.length) {
      return res.status(503).json({
        message: recipientCategory === 'it_support'
          ? 'No active IT Support officer is available to receive your message. Please try again later.'
          : 'No active administrator is available to receive your message. Please try again later.',
      });
    }

    const session = await mongoose.startSession();
    let employeeMessage;
    try {
      await session.withTransaction(async () => {
        [employeeMessage] = await EmployeeMessage.create([{
          employeeId: employee._id,
          authorRole: 'employee',
          type,
          recipientCategory,
          subject: cleanSubject,
          message: cleanMessage,
        }], { session });
        await Notification.insertMany(recipients.map((recipient) => ({
          userId: recipient._id,
          userModel: 'User',
          type: 'employee_message',
          title: `${recipientCategory === 'it_support' ? 'IT Support' : 'Employee'} ${type}: ${cleanSubject}`,
          message: `${employee.name}: ${cleanMessage}`,
          relatedId: employeeMessage._id,
        })), { session });
        await AuditLog.create([{
          actorId: employee._id,
          actorRole: 'employee',
          action: 'SUBMIT_EMPLOYEE_MESSAGE',
          resourceType: 'EmployeeMessage',
          resourceId: String(employeeMessage._id),
          details: { type, recipientCategory, officeId: employee.profile?.officeId ? String(employee.profile.officeId) : '' },
          ipAddress: req.ip || '',
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({
      message: recipientCategory === 'it_support'
        ? 'Your message was sent to IT Support.'
        : 'Your message was sent to the administrators.',
      employeeMessage,
    });
  } catch (error) {
    next(error);
  }
};

const createRegistrarMessage = async (req, res, next) => {
  try {
    const { type, subject, message } = req.body;
    const recipientCategory = messageRecipientCategory(req.body.recipientCategory);
    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!['excuse', 'feedback', 'compliment', 'other'].includes(type) ||
        !['admin', 'it_support'].includes(recipientCategory) ||
        cleanSubject.length < 3 || cleanSubject.length > 160 ||
        cleanMessage.length < 10 || cleanMessage.length > 2000) {
      return res.status(400).json({ message: 'Choose a message type, enter a subject (3–160 characters), and a message (10–2000 characters).' });
    }
    const registrar = await User.findOne({
      _id: req.user.id,
      role: 'registrar',
      status: 'active',
      archivedAt: null,
    }).select('_id name profile.officeId');
    if (!registrar) return res.status(403).json({ message: 'An active registrar account is required.' });
    const recipients = recipientCategory === 'it_support'
      ? await User.find({
          role: 'employee',
          employeeType: 'it_support_officer',
          status: 'active',
          archivedAt: null,
        }).select('_id').lean()
      : await User.find({ role: 'admin', status: 'active', archivedAt: null }).select('_id').lean();
    if (!recipients.length) {
      return res.status(503).json({
        message: recipientCategory === 'it_support'
          ? 'No active IT Support officer is available to receive your message. Please try again later.'
          : 'No active administrator is available to receive your message. Please try again later.',
      });
    }

    const session = await mongoose.startSession();
    let registrarMessage;
    try {
      await session.withTransaction(async () => {
        [registrarMessage] = await EmployeeMessage.create([{
          registrarId: registrar._id,
          authorRole: 'registrar',
          type,
          recipientCategory,
          subject: cleanSubject,
          message: cleanMessage,
        }], { session });
        await Notification.insertMany(recipients.map((recipient) => ({
          userId: recipient._id,
          userModel: 'User',
          type: 'employee_message',
          title: `${recipientCategory === 'it_support' ? 'IT Support' : 'Registrar'} ${type}: ${cleanSubject}`,
          message: `${registrar.name}: ${cleanMessage}`,
          relatedId: registrarMessage._id,
        })), { session });
        await AuditLog.create([{
          actorId: registrar._id,
          actorRole: 'registrar',
          action: 'SUBMIT_REGISTRAR_MESSAGE',
          resourceType: 'EmployeeMessage',
          resourceId: String(registrarMessage._id),
          details: { type, recipientCategory, officeId: registrar.profile?.officeId ? String(registrar.profile.officeId) : '' },
          ipAddress: req.ip || '',
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({
      message: recipientCategory === 'it_support'
        ? 'Your message was sent to IT Support.'
        : 'Your message was sent to the administrators.',
      employeeMessage: registrarMessage,
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrarMessages = async (req, res, next) => {
  try {
    const messages = await EmployeeMessage.find({ registrarId: req.user.id, authorRole: 'registrar' })
      .select('type recipientCategory subject message status response respondedAt createdAt')
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const getItSupportMessages = async (req, res, next) => {
  try {
    const supportOfficer = await User.findOne({
      _id: req.user.id,
      role: 'employee',
      employeeType: 'it_support_officer',
      status: 'active',
      archivedAt: null,
    }).select('_id');
    if (!supportOfficer) return res.status(403).json({ message: 'Active IT Support officer access is required.' });

    const messageFilter = {
      recipientCategory: 'it_support',
      adminArchivedAt: null,
      itSupportArchivedAt: null,
    };
    const [messages, messageIds] = await Promise.all([
      EmployeeMessage.find(messageFilter)
        .populate('employeeId', 'name email employeeType')
        .populate('registrarId', 'name email')
        .populate('respondedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      EmployeeMessage.distinct('_id', messageFilter),
    ]);
    const unreadCount = messageIds.length ? await Notification.countDocuments({
        userId: supportOfficer._id,
        userModel: 'User',
        type: 'employee_message',
        isRead: false,
        deletedAt: null,
        relatedId: { $in: messageIds },
      }) : 0;
    res.json({ messages, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markItSupportMessagesRead = async (req, res, next) => {
  try {
    const supportOfficer = await User.findOne({
      _id: req.user.id,
      role: 'employee',
      employeeType: 'it_support_officer',
      status: 'active',
      archivedAt: null,
    }).select('_id');
    if (!supportOfficer) return res.status(403).json({ message: 'Active IT Support officer access is required.' });

    const messageIds = await EmployeeMessage.distinct('_id', {
      recipientCategory: 'it_support',
      adminArchivedAt: null,
      itSupportArchivedAt: null,
    });
    await Notification.updateMany({
      userId: supportOfficer._id,
      userModel: 'User',
      relatedId: { $in: messageIds },
      type: 'employee_message',
      isRead: false,
      deletedAt: null,
    }, { $set: { isRead: true } });
    res.json({ unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

const respondToItSupportMessage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid employee message identifier.' });
    }
    const supportOfficer = await User.findOne({
      _id: req.user.id,
      role: 'employee',
      employeeType: 'it_support_officer',
      status: 'active',
      archivedAt: null,
    }).select('_id');
    if (!supportOfficer) return res.status(403).json({ message: 'Active IT Support officer access is required.' });

    const response = typeof req.body.response === 'string' ? req.body.response.trim() : '';
    if (response.length < 3 || response.length > 2000) {
      return res.status(400).json({ message: 'Provide a response between 3 and 2000 characters.' });
    }
    const message = await EmployeeMessage.findOneAndUpdate({
      _id: req.params.messageId,
      recipientCategory: 'it_support',
      adminArchivedAt: null,
      itSupportArchivedAt: null,
    }, {
      status: 'responded',
      response,
      respondedBy: supportOfficer._id,
      respondedAt: new Date(),
      employeeReadAt: null,
      registrarReadAt: null,
    }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ message: 'IT Support message was not found.' });

    const senderId = message.authorRole === 'registrar' ? message.registrarId : message.employeeId;
    if (!senderId) return res.status(409).json({ message: 'The author of this message is no longer available.' });
    await Promise.all([
      Notification.create({
        userId: senderId,
        userModel: 'User',
        type: 'feedback_reply',
        title: `IT Support replied: ${message.subject}`,
        message: response,
        relatedId: message._id,
      }),
      AuditLog.create({
        actorId: supportOfficer._id,
        actorRole: 'employee',
        action: 'RESPOND_TO_IT_SUPPORT_MESSAGE',
        resourceType: 'EmployeeMessage',
        resourceId: String(message._id),
        details: { status: 'responded' },
        ipAddress: req.ip || '',
      }),
    ]);
    res.json({ message: 'IT Support response saved.', employeeMessage: message });
  } catch (error) {
    next(error);
  }
};

const archiveItSupportMessage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid employee message identifier.' });
    }
    const supportOfficer = await User.findOne({
      _id: req.user.id,
      role: 'employee',
      employeeType: 'it_support_officer',
      status: 'active',
      archivedAt: null,
    }).select('_id');
    if (!supportOfficer) return res.status(403).json({ message: 'Active IT Support officer access is required.' });

    const archivedAt = new Date();
    const message = await EmployeeMessage.findOneAndUpdate(
      {
        _id: req.params.messageId,
        recipientCategory: 'it_support',
        adminArchivedAt: null,
        itSupportArchivedAt: null,
      },
      { $set: { itSupportArchivedAt: archivedAt } },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'IT Support message was not found.' });

    await Promise.all([
      Notification.updateMany(
        {
          userId: supportOfficer._id,
          userModel: 'User',
          relatedId: message._id,
          type: 'employee_message',
          deletedAt: null,
        },
        { $set: { deletedAt: archivedAt, isRead: true } }
      ),
      AuditLog.create({
        actorId: supportOfficer._id,
        actorRole: 'employee',
        action: 'ARCHIVE_IT_SUPPORT_MESSAGE',
        resourceType: 'EmployeeMessage',
        resourceId: String(message._id),
        details: { authorRole: message.authorRole },
        ipAddress: req.ip || '',
      }),
    ]);
    res.json({ message: 'Message removed from the IT Support inbox.' });
  } catch (error) {
    next(error);
  }
};

const getAdminEmployeeMessages = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    const recipientCategory = req.query.recipientCategory;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100.' });
    }
    if (recipientCategory && recipientCategory !== 'admin') {
      return res.status(400).json({ message: 'IT Support messages are available only in the IT Support inbox.' });
    }
    const messageFilter = {
      adminArchivedAt: null,
      $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
    };
    const [messages, total] = await Promise.all([
      EmployeeMessage.find()
        .where(messageFilter)
        .populate('employeeId', 'name email employeeType profile.jobTitle profile.officeId')
        .populate('registrarId', 'name email profile.officeId')
        .populate('respondedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EmployeeMessage.countDocuments(messageFilter),
    ]);
    res.json({ messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getUnreadAdminInboxCount = async (req, res, next) => {
  try {
    const filter = {
      userId: req.user.id,
      userModel: 'User',
      isRead: false,
      deletedAt: null,
    };
    const [feedbackCount, staffMessageCount] = await Promise.all([
      Notification.countDocuments({ ...filter, type: 'feedback_request' }),
      Notification.countDocuments({ ...filter, type: 'employee_message' }),
    ]);
    res.json({ count: feedbackCount + staffMessageCount, feedbackCount, staffMessageCount });
  } catch (error) {
    next(error);
  }
};

const getUnreadAdminEmployeeMessageCounts = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      userModel: 'User',
      type: 'employee_message',
      isRead: false,
      deletedAt: null,
    }).select('relatedId').lean();
    const messageIds = [...new Set(notifications.map((item) => item.relatedId ? String(item.relatedId) : null).filter(Boolean))];
    if (!messageIds.length) return res.json({ total: 0, byEmployeeType: {}, unreadMessageIds: [] });

    const messages = await EmployeeMessage.find({
      _id: { $in: messageIds },
      authorRole: 'employee',
    }).select('_id employeeId').lean();
    const typeByEmployee = new Map();
    if (messages.length) {
      const employees = await User.find({
        _id: { $in: messages.map((item) => item.employeeId).filter(Boolean) },
        role: 'employee',
      }).select('_id employeeType').lean();
      employees.forEach((employee) => typeByEmployee.set(String(employee._id), employee.employeeType));
    }

    const messageTypeById = new Map(messages.map((item) => [
      String(item._id),
      typeByEmployee.get(String(item.employeeId)) || 'service_window_officer',
    ]));
    const byEmployeeType = {};
    notifications.forEach((notification) => {
      const employeeType = messageTypeById.get(String(notification.relatedId));
      if (employeeType) byEmployeeType[employeeType] = (byEmployeeType[employeeType] || 0) + 1;
    });
    res.json({
      total: Object.values(byEmployeeType).reduce((sum, count) => sum + count, 0),
      byEmployeeType,
      unreadMessageIds: [...messageTypeById.keys()],
    });
  } catch (error) {
    next(error);
  }
};

const markAdminInboxNotificationsRead = async (req, res, next) => {
  try {
    const type = req.body.scope === 'feedback'
      ? 'feedback_request'
      : req.body.scope === 'staff'
        ? 'employee_message'
        : null;
    const notificationTypes = req.body.scope === 'all'
      ? ['employee_message', 'feedback_request']
      : type ? [type] : null;
    if (!notificationTypes) return res.status(400).json({ message: 'Choose feedback, staff, or all as the notification scope.' });
    let relatedIds;
    if (type === 'employee_message' && req.body.messageId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.messageId)) {
        return res.status(400).json({ message: 'Choose a valid employee message.' });
      }
      const message = await EmployeeMessage.findOne({
        _id: req.body.messageId,
        authorRole: 'employee',
      }).select('_id');
      if (!message) return res.status(404).json({ message: 'Employee message was not found.' });
      relatedIds = [message._id];
    } else if (type === 'employee_message' && req.body.audience === 'employees') {
      const validEmployeeTypes = ['service_window_officer', 'security_guard', 'floor_window_manager', 'receptionist', 'it_support_officer', 'service_requirement_manager'];
      if (req.body.employeeType && !validEmployeeTypes.includes(req.body.employeeType)) {
        return res.status(400).json({ message: 'Choose a valid employee category.' });
      }
      const employeeFilter = { role: 'employee' };
      if (req.body.employeeType) employeeFilter.employeeType = req.body.employeeType;
      const employees = await User.find(employeeFilter).select('_id').lean();
      const messages = await EmployeeMessage.find({
        authorRole: 'employee',
        employeeId: { $in: employees.map((employee) => employee._id) },
      }).select('_id').lean();
      relatedIds = messages.map((message) => message._id);
    }
    const result = await Notification.updateMany(
      {
        userId: req.user.id,
        userModel: 'User',
        type: notificationTypes.length === 1 ? notificationTypes[0] : { $in: notificationTypes },
        isRead: false,
        deletedAt: null,
        ...(relatedIds ? { relatedId: { $in: relatedIds } } : {}),
      },
      { $set: { isRead: true } }
    );
    const count = await Notification.countDocuments({
      userId: req.user.id,
      userModel: 'User',
      type: { $in: ['employee_message', 'feedback_request'] },
      isRead: false,
      deletedAt: null,
    });
    res.json({ message: 'Inbox notifications marked as read.', updated: result.modifiedCount, count });
  } catch (error) {
    next(error);
  }
};

const respondToEmployeeMessage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid employee message identifier.' });
    }
    const response = typeof req.body.response === 'string' ? req.body.response.trim() : '';
    const status = req.body.status || 'responded';
    if (!['responded', 'resolved'].includes(status) || response.length < 3 || response.length > 2000) {
      return res.status(400).json({ message: 'Choose a valid status and provide a response between 3 and 2000 characters.' });
    }
    const session = await mongoose.startSession();
    let message;
    try {
      await session.withTransaction(async () => {
        message = await EmployeeMessage.findOneAndUpdate({
          _id: req.params.messageId,
          adminArchivedAt: null,
          $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
        }, {
          status,
          response,
          respondedBy: req.user.id,
          respondedAt: new Date(),
          employeeReadAt: null,
        }, { new: true, runValidators: true, session });
        if (!message) {
          const error = new Error('Employee message was not found.');
          error.status = 404;
          throw error;
        }
        const recipientId = message.authorRole === 'registrar' ? message.registrarId : message.employeeId;
        if (!recipientId) {
          const error = new Error('The author of this staff message is no longer available.');
          error.status = 409;
          throw error;
        }
        await Notification.create([{
          userId: recipientId,
          userModel: 'User',
          type: 'feedback_reply',
          title: `Administrator replied: ${message.subject}`,
          message: response,
          relatedId: message._id,
        }], { session });
        await AuditLog.create([{
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'RESPOND_TO_EMPLOYEE_MESSAGE',
          resourceType: 'EmployeeMessage',
          resourceId: String(message._id),
          details: { status },
          ipAddress: req.ip || '',
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.json({ message: 'Employee message response saved.', employeeMessage: message });
  } catch (error) {
    next(error);
  }
};

const archiveEmployeeMessageFromAdminInbox = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid employee message identifier.' });
    }
    const message = await EmployeeMessage.findOneAndUpdate(
      {
        _id: req.params.messageId,
        adminArchivedAt: null,
        $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
      },
      { $set: { adminArchivedAt: new Date() } },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Employee message was not found.' });

    await Promise.all([
      Notification.updateMany(
        { relatedId: message._id, type: 'employee_message', deletedAt: null },
        { $set: { deletedAt: new Date(), isRead: true } }
      ),
      AuditLog.create({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ARCHIVE_EMPLOYEE_MESSAGE_FROM_ADMIN_INBOX',
        resourceType: 'EmployeeMessage',
        resourceId: String(message._id),
        details: { authorRole: message.authorRole },
        ipAddress: req.ip || '',
      }),
    ]);
    const count = await Notification.countDocuments({
      userId: req.user.id,
      userModel: 'User',
      type: { $in: ['employee_message', 'feedback_request'] },
      isRead: false,
      deletedAt: null,
    });
    res.json({ message: 'Message removed from the admin inbox.', count });
  } catch (error) {
    next(error);
  }
};

const archiveAllEmployeeMessagesFromAdminInbox = async (req, res, next) => {
  try {
    const { audience, employeeType, type, recipientCategory } = req.body || {};
    if (!['employees', 'registrars'].includes(audience)) {
      return res.status(400).json({ message: 'Choose employee or registrar messages to remove.' });
    }
    const allowedEmployeeTypes = ['service_window_officer', 'security_guard', 'floor_window_manager', 'receptionist', 'it_support_officer', 'service_requirement_manager'];
    const allowedTypes = audience === 'employees'
      ? ['excuse', 'feedback', 'compliment', 'other']
      : ['excuse', 'feedback', 'compliment', 'other'];
    if ((employeeType && (audience !== 'employees' || !allowedEmployeeTypes.includes(employeeType))) ||
        (type && !allowedTypes.includes(type)) ||
        (recipientCategory && recipientCategory !== 'admin')) {
      return res.status(400).json({ message: 'The message category or type is invalid.' });
    }
    const filter = {
      authorRole: audience === 'employees' ? 'employee' : 'registrar',
      adminArchivedAt: null,
      ...(audience === 'employees'
        ? { employeeId: { $ne: null } }
        : { registrarId: { $ne: null } }),
      ...(type ? { type } : {}),
      $or: [{ recipientCategory: 'admin' }, { recipientCategory: { $exists: false } }],
    };
    if (employeeType) {
      const employees = await User.find({ role: 'employee', employeeType }).select('_id').lean();
      filter.employeeId = { $in: employees.map((employee) => employee._id) };
    }
    const messages = await EmployeeMessage.find(filter).select('_id').lean();
    const messageIds = messages.map((item) => item._id);
    if (!messageIds.length) {
      const count = await Notification.countDocuments({
        userId: req.user.id,
        userModel: 'User',
        type: { $in: ['employee_message', 'feedback_request'] },
        isRead: false,
        deletedAt: null,
      });
      return res.json({ message: 'No matching messages were found.', archived: 0, count });
    }

    const archivedAt = new Date();
    const [result] = await Promise.all([
      EmployeeMessage.updateMany(
        { _id: { $in: messageIds }, adminArchivedAt: null },
        { $set: { adminArchivedAt: archivedAt } }
      ),
      Notification.updateMany(
        { relatedId: { $in: messageIds }, type: 'employee_message', deletedAt: null },
        { $set: { deletedAt: archivedAt, isRead: true } }
      ),
      AuditLog.create({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ARCHIVE_ALL_EMPLOYEE_MESSAGES_FROM_ADMIN_INBOX',
        resourceType: 'EmployeeMessage',
        details: { audience, employeeType: employeeType || null, type: type || null, recipientCategory: recipientCategory || null, matched: messageIds.length },
        ipAddress: req.ip || '',
      }),
    ]);
    const count = await Notification.countDocuments({
      userId: req.user.id,
      userModel: 'User',
      type: { $in: ['employee_message', 'feedback_request'] },
      isRead: false,
      deletedAt: null,
    });
    res.json({
      message: 'Matching messages were removed from the admin inbox.',
      archived: result.modifiedCount,
      count,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployeeMessage,
  createRegistrarMessage,
  getRegistrarMessages,
  getItSupportMessages,
  markItSupportMessagesRead,
  respondToItSupportMessage,
  archiveItSupportMessage,
  getAdminEmployeeMessages,
  getUnreadAdminInboxCount,
  getUnreadAdminEmployeeMessageCounts,
  markAdminInboxNotificationsRead,
  respondToEmployeeMessage,
  archiveEmployeeMessageFromAdminInbox,
  archiveAllEmployeeMessagesFromAdminInbox,
};
