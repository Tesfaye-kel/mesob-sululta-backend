const crypto = require('crypto');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const XLSX = require('xlsx');
const AppointmentBooking = require('../models/AppointmentBooking');
const AppointmentSlot = require('../models/AppointmentSlot');
const AuditLog = require('../models/AuditLog');
const FeedbackRequest = require('../models/FeedbackRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Receipt = require('../models/Receipt');
const ServiceDelivery = require('../models/ServiceDelivery');
const Window = require('../models/Window');
const { addCalendarDays, localDateKey } = require('../utils/appointmentCalendar');
const { isAppointmentVisible } = require('../utils/citizenVisibility');

function getListOptions(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 25);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error('Page must be positive and limit must be between 1 and 100.');
    error.status = 400;
    throw error;
  }
  const filter = buildAppointmentFilter(query);
  return { page, limit, filter };
}

function getPageOptions(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 25);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error('Page must be positive and limit must be between 1 and 100.');
    error.status = 400;
    throw error;
  }
  return { page, limit };
}

async function findCitizenAppointmentRows(filter, { activeOnly, skip, limit }) {
  const today = localDateKey();
  const attendanceFrom = new Date(`${addCalendarDays(today, -3)}T00:00:00+03:00`);
  const attendanceTo = new Date(`${today}T23:59:59.999+03:00`);
  const approvedDeliveries = activeOnly
    ? await ServiceDelivery.find({
      status: { $in: ['APPROVED', 'ATTENDANCE_APPROVED'] },
      $or: [
        { actualAttendanceAt: { $gte: attendanceFrom, $lte: attendanceTo } },
        { actualAttendanceAt: null, reviewedAt: { $gte: attendanceFrom, $lte: attendanceTo } },
      ],
    }).select('appointmentId').lean()
    : [];
  const upcomingStart = new Date(`${today}T00:00:00.000Z`);
  const upcomingEnd = new Date(`${addCalendarDays(today, 3)}T23:59:59.999Z`);
  const visibilityQuery = activeOnly ? {
    $or: [
      { slotDate: { $gte: upcomingStart, $lte: upcomingEnd } },
      { _id: { $in: approvedDeliveries.map(({ appointmentId }) => appointmentId) } },
    ],
  } : {};
  const appointmentFilter = { ...filter };
  const requestedStatus = appointmentFilter.status;
  delete appointmentFilter.status;
  const query = AppointmentBooking.find({
    ...appointmentFilter,
    ...visibilityQuery,
    ...(activeOnly ? { status: { ...(requestedStatus ? { $in: [requestedStatus] } : {}), $ne: 'CANCELLED' } } :
      (requestedStatus ? { status: requestedStatus } : {})),
  })
    .populate('serviceId', 'name')
    .populate('officeId', 'name')
    .populate('windowId', 'number floor')
    .populate('employeeId', 'name')
    .populate('deliveryId', 'status actualAttendanceAt reviewedAt updatedAt')
    .populate('citizenIdentityId', 'displayName')
    .sort({ slotDate: -1, createdAt: -1 });
  if (!activeOnly) query.skip(skip).limit(limit);
  return query.lean();
}

function toCitizenRows(bookings) {
  return bookings.map((booking) => ({
    ...booking,
    citizen: {
      reference: `CIT-${String(booking.citizenIdentityId?._id || booking.citizenIdentityId).slice(-6).toUpperCase()}`,
      displayName: booking.citizenIdentityId?.displayName || '',
    },
    citizenIdentityId: undefined,
  }));
}

const getAdminCitizens = (activeOnly) => async (req, res, next) => {
  try {
    const { page, limit, filter } = getListOptions(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : '';
    if (search) filter.appointmentReference = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    let bookings;
    let total;
    if (activeOnly) {
      const rows = await findCitizenAppointmentRows(filter, { activeOnly, skip: 0, limit });
      const visible = rows.filter(isAppointmentVisible);
      total = visible.length;
      bookings = toCitizenRows(visible.slice((page - 1) * limit, page * limit));
    } else {
      const [rows, count] = await Promise.all([
        findCitizenAppointmentRows(filter, { activeOnly, skip: (page - 1) * limit, limit }),
        AppointmentBooking.countDocuments(filter),
      ]);
      bookings = toCitizenRows(rows);
      total = count;
    }
    res.json({ bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

function buildFeedbackInboxFilter(query) {
  const allowedStatuses = ['new', 'under_review', 'responded', 'resolved'];
  const allowedCategories = ['service_quality', 'waiting_time', 'staff_conduct', 'suggestion'];
  const filter = { adminArchivedAt: null };
  for (const key of ['officeId', 'windowId', 'serviceId']) {
    if (query[key]) {
      if (!mongoose.Types.ObjectId.isValid(String(query[key]))) {
        const error = new Error(`Invalid ${key} filter.`);
        error.status = 400;
        throw error;
      }
      filter[key] = query[key];
    }
  }
  if (query.status) {
    if (!allowedStatuses.includes(query.status)) {
      const error = new Error('Invalid feedback status filter.');
      error.status = 400;
      throw error;
    }
    filter.status = query.status;
  }
  if (query.category) {
    if (!allowedCategories.includes(query.category)) {
      const error = new Error('Invalid feedback category filter.');
      error.status = 400;
      throw error;
    }
    filter.category = query.category;
  }
  const from = query.from;
  const to = query.to;
  const validDate = (value) => !value || (
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
  if (!validDate(from) || !validDate(to) || (from && to && from > to)) {
    const error = new Error('Use valid date filters in YYYY-MM-DD format with start before end.');
    error.status = 400;
    throw error;
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00+03:00`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999+03:00`);
  }
  return filter;
}

const getFeedbackInbox = async (req, res, next) => {
  try {
    const filter = buildFeedbackInboxFilter(req.query);
    const { page, limit } = getPageOptions(req.query);
    const [feedback, total] = await Promise.all([
      FeedbackRequest.find(filter)
        .populate('appointmentId', 'appointmentReference slotDate')
        .populate('officeId', 'name')
        .populate('windowId', 'number floor')
        .populate('serviceId', 'name')
        .populate('employeeId', 'name')
        .populate('respondedBy', 'name')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      FeedbackRequest.countDocuments(filter),
    ]);
    res.json({ feedback, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const archiveAllFeedbackFromAdminInbox = async (req, res, next) => {
  try {
    const filter = buildFeedbackInboxFilter(req.body || {});
    const feedback = await FeedbackRequest.find(filter).select('_id type').lean();
    const feedbackIds = feedback.map((item) => item._id);
    if (!feedbackIds.length) return res.json({ message: 'No matching feedback was found.', archived: 0, count: await getAdminInboxUnreadCount(req.user.id) });

    const archivedAt = new Date();
    const [result] = await Promise.all([
      FeedbackRequest.updateMany(
        { _id: { $in: feedbackIds }, adminArchivedAt: null },
        { $set: { adminArchivedAt: archivedAt } }
      ),
      Notification.updateMany(
        { relatedId: { $in: feedbackIds }, type: 'feedback_request', deletedAt: null },
        { $set: { deletedAt: archivedAt, isRead: true } }
      ),
      AuditLog.create({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ARCHIVE_ALL_SERVICE_FEEDBACK_FROM_ADMIN_INBOX',
        resourceType: 'FeedbackRequest',
        details: { matched: feedbackIds.length },
        ipAddress: req.ip || '',
      }),
    ]);
    res.json({
      message: 'Matching feedback and compliments were removed from the admin inbox.',
      archived: result.modifiedCount,
      count: await getAdminInboxUnreadCount(req.user.id),
    });
  } catch (error) {
    next(error);
  }
};

async function getAdminInboxUnreadCount(adminId) {
  return Notification.countDocuments({
    userId: adminId,
    userModel: 'User',
    type: { $in: ['employee_message', 'feedback_request'] },
    isRead: false,
    deletedAt: null,
  });
}

const sendComplimentToEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.feedbackId)) {
      return res.status(400).json({ message: 'Invalid feedback identifier.' });
    }
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (message.length < 5 || message.length > 2000) {
      return res.status(400).json({ message: 'Enter an employee message between 5 and 2000 characters.' });
    }
    const feedback = await FeedbackRequest.findOne({
      _id: req.params.feedbackId,
      adminArchivedAt: null,
      type: 'compliment',
      employeeId: { $ne: null },
    });
    if (!feedback) return res.status(404).json({ message: 'A compliment with an assigned employee was not found.' });
    const employee = await require('../models/User').findOne({
      _id: feedback.employeeId,
      role: 'employee',
      status: 'active',
    }).select('_id');
    if (!employee) return res.status(409).json({ message: 'The assigned employee is no longer active.' });

    const now = new Date();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await FeedbackRequest.findOneAndUpdate({
          _id: feedback._id,
          type: 'compliment',
          employeeMessageAt: null,
        }, {
          employeeMessage: message,
          employeeMessageBy: req.user.id,
          employeeMessageAt: now,
        }, { new: true, session });
        if (!updated) {
          const conflict = new Error('An employee message has already been sent for this compliment.');
          conflict.status = 409;
          throw conflict;
        }
        await Notification.create([{
          userId: employee._id,
          userModel: 'User',
          type: 'employee_compliment',
          title: 'A citizen compliment was shared with you',
          message,
          relatedId: feedback._id,
        }], { session });
        await AuditLog.create([{
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'SEND_EMPLOYEE_COMPLIMENT',
          resourceType: 'FeedbackRequest',
          resourceId: String(feedback._id),
          details: { employeeId: String(employee._id) },
          ipAddress: req.ip || '',
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.json({ message: 'Compliment message sent to the employee.' });
  } catch (error) {
    next(error);
  }
};

const respondToFeedback = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['under_review', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Choose under review or resolved. Citizen messaging is not available in this inbox.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.feedbackId)) return res.status(400).json({ message: 'Invalid feedback identifier.' });
    const feedback = await FeedbackRequest.findOneAndUpdate(
      { _id: req.params.feedbackId, adminArchivedAt: null },
      { status, respondedBy: req.user.id },
      { new: true, runValidators: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback record not found.' });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_SERVICE_FEEDBACK',
      resourceType: 'FeedbackRequest',
      resourceId: String(feedback._id),
      details: { status, citizenContacted: false },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Feedback record updated.', feedback });
  } catch (error) {
    next(error);
  }
};

const archiveFeedbackFromAdminInbox = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.feedbackId)) {
      return res.status(400).json({ message: 'Invalid feedback identifier.' });
    }
    const feedback = await FeedbackRequest.findOneAndUpdate(
      { _id: req.params.feedbackId, adminArchivedAt: null },
      { $set: { adminArchivedAt: new Date() } },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback record was not found.' });

    await Promise.all([
      Notification.updateMany(
        { relatedId: feedback._id, type: 'feedback_request', deletedAt: null },
        { $set: { deletedAt: new Date(), isRead: true } }
      ),
      AuditLog.create({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ARCHIVE_SERVICE_FEEDBACK_FROM_ADMIN_INBOX',
        resourceType: 'FeedbackRequest',
        resourceId: String(feedback._id),
        details: { type: feedback.type },
        ipAddress: req.ip || '',
      }),
    ]);
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      userModel: 'User',
      type: { $in: ['employee_message', 'feedback_request'] },
      isRead: false,
      deletedAt: null,
    });
    res.json({ message: 'Feedback removed from the admin inbox.', count: unreadCount });
  } catch (error) {
    next(error);
  }
};

function buildAppointmentFilter(query) {
  const { from, to, status, officeId, windowId, serviceId } = query;
  const filter = {};
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if ((from && !validDate(from)) || (to && !validDate(to))) {
    const error = new Error('Date filters must use YYYY-MM-DD format.');
    error.status = 400;
    throw error;
  }
  if (from && to && from > to) {
    const error = new Error('The start date must not be after the end date.');
    error.status = 400;
    throw error;
  }
  const allowedStatuses = ['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'DELIVERED', 'CANCELLED', 'NO_SHOW'];
  if (status && !allowedStatuses.includes(status)) {
    const error = new Error('Invalid appointment status filter.');
    error.status = 400;
    throw error;
  }
  for (const id of [officeId, windowId, serviceId]) {
    if (id && !mongoose.Types.ObjectId.isValid(String(id))) {
      const error = new Error('Office, window, and service filters must be valid identifiers.');
      error.status = 400;
      throw error;
    }
  }
  if (from || to) {
    filter.slotDate = {};
    if (from) filter.slotDate.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.slotDate.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (status) filter.status = status;
  if (officeId) filter.officeId = officeId;
  if (windowId) filter.windowId = windowId;
  if (serviceId) filter.serviceId = serviceId;
  return filter;
}

const getAppointmentDashboard = async (req, res, next) => {
  try {
    const filter = buildAppointmentFilter(req.query);
    const [appointments, pendingApprovals, feedbackCount] = await Promise.all([
      AppointmentBooking.find(filter)
        .populate('serviceId', 'name')
        .populate('officeId', 'name')
        .populate('windowId', 'number floor')
        .populate('employeeId', 'name email')
        .sort({ slotDate: -1, session: 1 })
        .limit(500)
        .lean(),
      ServiceDelivery.countDocuments({ status: { $in: ['AWAITING_APPROVAL', 'PENDING_ADMIN_APPROVAL'] } }),
      FeedbackRequest.countDocuments(),
    ]);
    res.json({ appointments, totals: { appointments: appointments.length, pendingApprovals, feedback: feedbackCount } });
  } catch (error) {
    next(error);
  }
};

const getAppointmentCapacity = async (req, res, next) => {
  try {
    const { date } = req.query;
    const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ message: 'Provide a valid date in YYYY-MM-DD format.' });
    }
    const slotDate = parsedDate;
    const [windows, slots] = await Promise.all([
      Window.find({ isActive: { $ne: false } })
        .populate('organization', 'name')
        .populate('assignedOrganizations', 'name')
        .sort({ floor: 1, number: 1 })
        .lean(),
      AppointmentSlot.find({ slotDate }).lean(),
    ]);
    const byKey = new Map(slots.map((slot) => [`${slot.windowId}:${slot.session}`, slot]));
    res.json({
      date,
      windows: windows.map((window) => ({
        _id: window._id,
        number: window.number,
        floor: window.floor,
        organization: window.organization,
        assignedOrganizations: window.assignedOrganizations,
        sessions: ['session1', 'session2'].map((session) => {
          const slot = byKey.get(`${window._id}:${session}`);
          return {
            session,
            capacity: slot?.capacity ?? 100,
            booked: slot?.bookedCount ?? 0,
            remaining: slot ? Math.max(0, slot.capacity - slot.bookedCount) : 100,
            status: slot?.status ?? 'open',
          };
        }),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const exportAppointments = async (req, res, next) => {
  try {
    const format = req.params.format;
    if (!['xlsx', 'pdf'].includes(format)) return res.status(400).json({ message: 'Choose xlsx or pdf export format.' });
    const appointments = await AppointmentBooking.find(buildAppointmentFilter(req.query))
      .populate('serviceId', 'name')
      .populate('officeId', 'name')
      .populate('windowId', 'number floor')
      .populate('employeeId', 'name')
      .sort({ slotDate: -1, session: 1, queueNumber: 1 })
      .limit(5000)
      .lean();
    const rows = appointments.map((item) => ({
      Reference: item.appointmentReference,
      Date: item.slotDate ? new Date(item.slotDate).toISOString().slice(0, 10) : '',
      Session: item.session,
      Queue: item.queueNumber,
      Office: item.officeId?.name?.en || '',
      Window: item.windowId?.number ?? '',
      Service: item.serviceId?.name?.en || '',
      Employee: item.employeeId?.name || '',
      Status: item.status,
    }));
    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Appointments');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="appointment-report.xlsx"');
      return res.send(buffer);
    }

    const document = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('error', next);
    document.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="appointment-report.pdf"');
      res.send(Buffer.concat(chunks));
    });
    document.fontSize(16).text('Appointment report', { align: 'center' });
    document.moveDown();
    document.fontSize(8);
    rows.forEach((row, index) => {
      if (index > 0 && index % 24 === 0) document.addPage();
      document.text(
        `${row.Reference} | ${row.Date} | ${row.Session} | ${row.Office} | Window ${row.Window} | ${row.Service} | ${row.Status}`,
        { lineBreak: true }
      );
    });
    document.end();
  } catch (error) {
    next(error);
  }
};

const getDeliveryApprovals = async (req, res, next) => {
  try {
    const deliveries = await ServiceDelivery.find({ status: { $in: ['AWAITING_APPROVAL', 'PENDING_ADMIN_APPROVAL'] } })
      .populate({
        path: 'appointmentId',
        select: 'appointmentReference slotDate session queueNumber status officeId windowId serviceId',
        populate: { path: 'officeId', select: 'name' },
      })
      .populate('employeeId', 'name email')
      .populate('serviceId', 'name')
      .sort({ updatedAt: 1 })
      .lean();
    res.json({ deliveries });
  } catch (error) {
    next(error);
  }
};

const reviewDelivery = async (req, res, next) => {
  let session;
  let reviewedStatus;
  try {
    const { decision, reviewNotes = '' } = req.body;
    if (!['approve', 'reject'].includes(decision) || typeof reviewNotes !== 'string' || reviewNotes.length > 2000) {
      return res.status(400).json({ message: 'Provide an approve/reject decision and valid review notes.' });
    }
    if (decision === 'reject' && reviewNotes.trim().length < 3) {
      return res.status(400).json({ message: 'A rejection reason of at least 3 characters is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.deliveryId)) {
      return res.status(400).json({ message: 'Invalid service delivery identifier.' });
    }
    session = await mongoose.startSession();
    const delivery = await ServiceDelivery.findOne({
      _id: req.params.deliveryId,
      status: { $in: ['AWAITING_APPROVAL', 'PENDING_ADMIN_APPROVAL'] },
    }).session(session);
    if (!delivery) return res.status(404).json({ message: 'Pending service delivery was not found.' });
    if (String(delivery.employeeId) === String(req.user.id)) {
      return res.status(403).json({ message: 'An employee cannot approve their own service record.' });
    }
    const booking = await AppointmentBooking.findById(delivery.appointmentId).session(session);
    if (!booking || booking.status !== 'AWAITING_APPROVAL') {
      return res.status(409).json({ message: 'Appointment is not awaiting delivery approval.' });
    }

    const now = new Date();
    const feedbackDeadlineAt = delivery.feedbackDeadlineAt ||
      (decision === 'approve' ? new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) : null);
    await session.withTransaction(async () => {
      const updatedDelivery = await ServiceDelivery.findOneAndUpdate(
        { _id: delivery._id, status: { $in: ['AWAITING_APPROVAL', 'PENDING_ADMIN_APPROVAL'] } },
        {
          status: decision === 'approve' ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REJECTED',
          feedbackDeadlineAt,
          reviewedBy: req.user.id,
          reviewedAt: now,
          reviewNotes: reviewNotes.trim(),
          $push: {
            reviewHistory: {
              reviewerId: req.user.id,
              decision: decision === 'approve' ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REJECTED',
              reason: reviewNotes.trim(),
              decidedAt: now,
            },
          },
        },
        { new: true, session }
      );
      const updatedBooking = await AppointmentBooking.findOneAndUpdate(
        { _id: booking._id, status: 'AWAITING_APPROVAL' },
        { status: decision === 'approve' ? 'DELIVERED' : 'REJECTED', reviewedAt: now },
        { new: true, session }
      );
      if (!updatedDelivery || !updatedBooking) throw new Error('Delivery or appointment was reviewed concurrently.');
      reviewedStatus = updatedDelivery.status;

      if (decision === 'approve') {
        const service = await require('../models/Service').findById(delivery.serviceId).select('name').session(session);
        const window = await Window.findById(delivery.windowId).select('number floor').session(session);
        if (!service || !window) throw new Error('Service or window for this delivery no longer exists.');
        const receiptNumber = `MSB-R-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
        const verificationBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationUrl = `${verificationBase}/receipt/verify?number=${encodeURIComponent(receiptNumber)}`;
        const qrCode = await QRCode.toDataURL(verificationUrl);
        const [receipt] = await Receipt.create([{
          receiptNumber,
          citizenIdentityId: booking.citizenIdentityId,
          employeeId: delivery.employeeId,
          serviceId: delivery.serviceId,
          officeId: booking.officeId,
          floorId: booking.floorId,
          windowId: window._id,
          appointmentId: booking._id,
          serviceDeliveryId: delivery._id,
          deliveryStatus: 'DELIVERED',
          approvalStatus: 'APPROVED',
          qrCode,
          verificationUrl,
          issuedAt: now,
        }], { session });
      } else {
        await Notification.create([{
          userId: booking.citizenIdentityId,
          type: 'feedback_reply',
          title: 'Attendance confirmation was not approved',
          message: reviewNotes.trim(),
          relatedId: delivery._id,
        }], { session });
      }

      await AuditLog.create([{
        actorId: req.user.id,
        actorRole: req.user.role,
        action: decision === 'approve' ? 'APPROVE_ATTENDANCE_CONFIRMATION' : 'REJECT_ATTENDANCE_CONFIRMATION',
        resourceType: 'ServiceDelivery',
        resourceId: String(delivery._id),
        details: { appointmentId: String(booking._id), reviewNotes: reviewNotes.trim() },
        ipAddress: req.ip || '',
      }], { session });
    });
    res.json({ message: `Service delivery ${decision}d.`, delivery: { id: delivery._id, status: reviewedStatus } });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
};

const submitDeliveryFeedback = async (req, res, next) => {
  try {
    const { serviceDeliveryId, type, message, rating } = req.body;
    if (!mongoose.Types.ObjectId.isValid(String(serviceDeliveryId || '')) || !['compliment', 'complaint', 'suggestion'].includes(type) ||
        typeof message !== 'string' || message.trim().length < 20 || message.trim().length > 2000 ||
        (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5))) {
      return res.status(400).json({ message: 'Provide a valid delivered service, feedback type, message (20–2000 characters), and optional 1–5 rating.' });
    }
    const delivery = await ServiceDelivery.findOne({
      _id: serviceDeliveryId,
      citizenIdentityId: req.user.id,
      status: { $in: ['CHECKED_IN', 'PENDING_ADMIN_APPROVAL', 'AWAITING_APPROVAL', 'ATTENDANCE_APPROVED', 'ATTENDANCE_REJECTED'] },
    });
    if (!delivery) return res.status(403).json({ message: 'Feedback is available only for a service visit recorded by your employee.' });
    if (!delivery.feedbackDeadlineAt || delivery.feedbackDeadlineAt <= new Date()) {
      return res.status(403).json({ message: 'The two-day feedback period for this service visit has ended.' });
    }
    const booking = await AppointmentBooking.findOne({
      _id: delivery.appointmentId,
      citizenIdentityId: req.user.id,
      status: { $in: ['CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'DELIVERED', 'REJECTED'] },
      serviceId: delivery.serviceId,
    });
    if (!booking) return res.status(403).json({ message: 'The employee-recorded visit could not be verified against your appointment.' });
    const category = req.body.category || (type === 'suggestion' ? 'suggestion' : 'service_quality');
    if (!['service_quality', 'waiting_time', 'staff_conduct', 'suggestion'].includes(category)) {
      return res.status(400).json({ message: 'Choose a valid feedback category.' });
    }
    const existing = await FeedbackRequest.findOne({ appointmentId: booking._id });
    if (existing) return res.status(409).json({ message: 'Feedback has already been submitted for this appointment.' });

    const admins = await User.find({
      role: 'admin',
      status: 'active',
      archivedAt: null,
    }).select('_id').lean();
    const session = await mongoose.startSession();
    let feedback;
    try {
      await session.withTransaction(async () => {
        [feedback] = await FeedbackRequest.create([{
          citizenIdentityId: req.user.id,
          serviceDeliveryId: delivery._id,
          appointmentId: booking._id,
          officeId: booking.officeId,
          windowId: booking.windowId,
          serviceId: delivery.serviceId,
          employeeId: delivery.employeeId,
          feedbackDeadlineAt: delivery.feedbackDeadlineAt,
          type,
          category,
          message: message.trim(),
          rating: rating || null,
          serviceDeliveredAt: delivery.actualAttendanceAt || delivery.updatedAt,
          appointmentDate: booking.slotDate,
        }], { session });
        if (admins.length) {
          await Notification.insertMany(admins.map((admin) => ({
            userId: admin._id,
            userModel: 'User',
            type: 'feedback_request',
            title: `New citizen ${type}`,
            message: `A citizen submitted a ${type} about a service visit.`,
            relatedId: feedback._id,
          })), { session });
        }
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({ message: 'Feedback submitted.', feedback: { id: feedback._id, type: feedback.type, status: feedback.status } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Feedback has already been submitted for this appointment.' });
    next(error);
  }
};

const listCitizenReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ citizenIdentityId: req.user.id })
      .populate('serviceId', 'name')
      .populate('officeId', 'name')
      .populate('windowId', 'number floor')
      .populate('employeeId', 'name')
      .sort({ issuedAt: -1 })
      .lean();
    res.json({ receipts });
  } catch (error) {
    next(error);
  }
};

const verifyReceipt = async (req, res, next) => {
  try {
    if (!/^MSB-R-[A-F\d]{24}$/.test(req.params.receiptNumber)) {
      return res.status(400).json({ valid: false, message: 'Invalid receipt number.' });
    }
    const receipt = await Receipt.findOne({
      receiptNumber: req.params.receiptNumber,
      deliveryStatus: 'DELIVERED',
      approvalStatus: 'APPROVED',
    })
      .populate('serviceId', 'name')
      .populate('officeId', 'name')
      .populate('floorId', 'floorNumber name')
      .populate('windowId', 'number')
      .populate('employeeId', 'name')
      .select('receiptNumber serviceId officeId floorId windowId employeeId issuedAt deliveryStatus approvalStatus')
      .lean();
    if (!receipt) return res.status(404).json({ valid: false, message: 'Verified receipt not found.' });
    res.json({ valid: true, receipt });
  } catch (error) {
    next(error);
  }
};

const listCitizenFeedback = async (req, res, next) => {
  try {
    const feedback = await FeedbackRequest.find({ citizenIdentityId: req.user.id })
      .select('type message status response rating createdAt serviceId serviceDeliveryId')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointmentDashboard,
  getAppointmentCapacity,
  exportAppointments,
  getDeliveryApprovals,
  reviewDelivery,
  submitDeliveryFeedback,
  listCitizenFeedback,
  listCitizenReceipts,
  verifyReceipt,
  getActiveCitizens: getAdminCitizens(true),
  getCitizenHistory: getAdminCitizens(false),
  getFeedbackInbox,
  archiveFeedbackFromAdminInbox,
  archiveAllFeedbackFromAdminInbox,
  sendComplimentToEmployee,
  respondToFeedback,
};
