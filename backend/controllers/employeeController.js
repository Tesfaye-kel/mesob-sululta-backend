const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const AppointmentBooking = require('../models/AppointmentBooking');
const AuditLog = require('../models/AuditLog');
const AccountRemovalRequest = require('../models/AccountRemovalRequest');
const EmployeeProfile = require('../models/EmployeeProfile');
const Notification = require('../models/Notification');
const EmployeeMessage = require('../models/EmployeeMessage');
const Service = require('../models/Service');
const ServiceDelivery = require('../models/ServiceDelivery');
const User = require('../models/User');
const { getFanHash } = require('../services/citizenIdentityProvider');
const { addCalendarDays, localDateKey } = require('../utils/appointmentCalendar');
const { EMPLOYEE_TYPES } = require('../utils/employeeCategories');
const { validateEmployeeSchedule } = require('../utils/employeeSchedule');

const isValidEthiopianMobileNumber = (phone) => /^09\d{8}$/.test(phone);

async function officeScope(req) {
  if (req.user.role === 'registrar') {
    const actor = await User.findById(req.user.id).select('profile.officeId').lean();
    return actor?.profile?.officeId || false;
  }
  if (req.user.role !== 'office_admin') return null;
  const actor = await User.findById(req.user.id).select('profile.officeId').lean();
  return actor?.profile?.officeId || false;
}

async function createEmployeeInvitationIfAssigned(employee) {
  const profile = employee.profile || {};
  const hasAssignment = Boolean(profile.officeId);
  if (employee.status !== 'approved' || !hasAssignment || !profile.schedule?.length) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  employee.invitationToken = tokenHash;
  employee.invitationExpiresAt = expiresAt;
  employee.invitationUsedAt = null;
  await employee.save({ validateBeforeSave: false });
  await EmployeeProfile.findOneAndUpdate(
    { userId: employee._id },
    { invitationToken: tokenHash, invitationExpiresAt: expiresAt, invitationUsedAt: null, status: 'approved' }
  );
  return token;
}

const listEmployees = async (req, res, next) => {
  try {
    const scope = await officeScope(req);
    if (scope === false && req.user.role !== 'registrar') {
      return res.status(403).json({ message: 'This account must have an assigned office to manage employees.' });
    }
    const employeeFilter = { role: 'employee', archivedAt: null };
    const approvedUnassigned = {
      status: { $in: ['approved', 'active'] },
      'profile.officeId': null,
    };
    if (scope) {
      employeeFilter.$or = [
        { 'profile.officeId': scope },
        approvedUnassigned,
      ];
      if (req.user.role === 'registrar') employeeFilter.$or.push({ createdBy: req.user.id });
    } else if (scope === false) {
      employeeFilter.$or = [
        approvedUnassigned,
        { createdBy: req.user.id },
      ];
    }
    const employees = await User.find(employeeFilter)
      .select('name email phone status employeeType createdBy approvedBy approvedAt createdAt profile.officeId profile.officeAssignmentLabel profile.nationalIdLastFour profile.jobTitle profile.schedule')
      .populate('createdBy', 'name email')
      .populate('profile.officeId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const pendingRemovals = await AccountRemovalRequest.find({
      targetType: 'employee',
      status: 'pending',
      targetId: { $in: employees.map((employee) => employee._id) },
    }).select('targetId').lean();
    const pendingRemovalIds = new Set(pendingRemovals.map((item) => String(item.targetId)));
    res.json({
      employees: employees.map((employee) => ({
        ...employee,
        removalRequested: pendingRemovalIds.has(String(employee._id)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const requestEmployeePasswordReset = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const scope = await officeScope(req);
    if (scope === false && req.user.role !== 'registrar') {
      return res.status(403).json({ message: 'This account must have an assigned office to manage employees.' });
    }
    const employeeScope = scope
      ? {
          $or: [
            { 'profile.officeId': scope },
            { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
            { createdBy: req.user.id },
          ],
        }
      : scope === false
        ? {
            $or: [
              { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
              { createdBy: req.user.id },
            ],
          }
        : {};
    const employee = await User.findOne({
      _id: req.params.employeeId,
      role: 'employee',
      status: { $in: ['approved', 'active'] },
      archivedAt: null,
      ...employeeScope,
    });
    if (!employee) return res.status(404).json({ message: 'Approved employee not found in your office or submissions.' });

    employee.password = crypto.randomBytes(32).toString('hex');
    employee.status = 'approved';
    employee.invitationToken = null;
    employee.invitationExpiresAt = null;
    employee.invitationUsedAt = null;
    employee.resetPasswordToken = null;
    employee.resetPasswordExpires = null;
    await employee.save();
    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id },
      { status: 'approved', invitationToken: null, invitationExpiresAt: null, invitationUsedAt: null }
    );

    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'RESET_EMPLOYEE_PASSWORD',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: { requiresPasswordSetup: true },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Employee password reset. The employee must set a new password using their work email and National ID before signing in.' });
  } catch (error) {
    next(error);
  }
};

const getAssignedBookings = async (req, res, next) => {
  try {
    const employee = await User.findById(req.user.id).select('status employeeType profile');
    if (!employee || employee.status !== 'active' || employee.employeeType !== 'service_window_officer') {
      return res.status(403).json({ message: 'An active employee with an assigned office is required.' });
    }
    if (!employee.profile?.officeId || !employee.profile?.schedule?.length) {
      return res.json({ bookings: [], history: [] });
    }
    const today = localDateKey();
    const start = new Date(`${today}T00:00:00.000Z`);
    const end = new Date(`${addCalendarDays(today, 5)}T23:59:59.999Z`);
    const historyStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await AppointmentBooking.updateMany(
      { officeId: employee.profile.officeId, status: 'CONFIRMED', slotDate: { $lt: start } },
      { $set: { status: 'NO_SHOW' } }
    );
    const populateBooking = (query) => query
      .populate('serviceId', 'name requiredDocuments')
      .populate('officeId', 'name')
      .populate('windowId', 'number floor name')
      .populate('citizenIdentityId', 'displayName')
      .populate('deliveryId', 'status actualAttendanceAt reviewedAt updatedAt outcome deliveryDetails reviewNotes');
    const [appointments, checkInHistory] = await Promise.all([
      populateBooking(AppointmentBooking.find({
        officeId: employee.profile.officeId,
        slotDate: { $gte: start, $lte: end },
        status: 'CONFIRMED',
      }).sort({ slotDate: 1, session: 1, queueNumber: 1 }).lean()),
      populateBooking(AppointmentBooking.find({
        officeId: employee.profile.officeId,
        checkedInAt: { $gte: historyStart, $lte: new Date() },
      }).sort({ checkedInAt: -1 }).limit(100).lean()),
    ]);
    const services = await Service.find({
      organization: employee.profile.officeId,
      isActive: { $ne: false },
    }).select('name requiredDocuments organization window').lean();
    const withServices = (booking) => ({
      ...booking,
      availableServices: services.filter((service) =>
        String(service.organization) === String(booking.officeId?._id || booking.officeId) &&
        String(service.window) === String(booking.windowId?._id || booking.windowId)),
    });
    res.json({
      bookings: appointments.filter((booking) =>
        !booking.checkedInAt && booking.status === 'CONFIRMED'
      ).map(withServices),
      history: checkInHistory.map(withServices),
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeCompliments = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      userModel: 'User',
      type: 'employee_compliment',
      deletedAt: null,
    }).select('title message relatedId createdAt isRead').sort({ createdAt: -1 }).limit(100).lean();
    res.json({ compliments: notifications });
  } catch (error) {
    next(error);
  }
};

const getEmployeeMessages = async (req, res, next) => {
  try {
    const messages = await EmployeeMessage.find({ employeeId: req.user.id })
      .select('type recipientCategory subject message status response respondedAt employeeReadAt createdAt')
      .where({ employeeDeletedAt: null })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const markEmployeeMessagesRead = async (req, res, next) => {
  try {
    const result = await EmployeeMessage.updateMany(
      {
        employeeId: req.user.id,
        employeeDeletedAt: null,
        status: { $in: ['responded', 'resolved'] },
        employeeReadAt: null,
      },
      { $set: { employeeReadAt: new Date() } }
    );
    res.json({ message: 'Replies marked as read.', updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

const deleteEmployeeMessage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid employee message identifier.' });
    }
    const message = await EmployeeMessage.findOneAndUpdate(
      {
        _id: req.params.messageId,
        employeeId: req.user.id,
        employeeDeletedAt: null,
      },
      { $set: { employeeDeletedAt: new Date() } },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Your conversation was not found.' });
    await Notification.updateMany(
      {
        userId: req.user.id,
        userModel: 'User',
        relatedId: message._id,
        type: { $in: ['feedback_reply', 'employee_message'] },
        deletedAt: null,
      },
      { $set: { deletedAt: new Date(), isRead: true } }
    );
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'HIDE_EMPLOYEE_MESSAGE',
      resourceType: 'EmployeeMessage',
      resourceId: String(message._id),
      details: { hiddenFromEmployee: true },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Conversation removed from your messages.' });
  } catch (error) {
    next(error);
  }
};

async function getAssignedBooking(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.appointmentId)) {
    res.status(400).json({ message: 'Invalid appointment identifier.' });
    return null;
  }
  const employee = await User.findById(req.user.id).select('status employeeType profile');
  if (!employee || employee.status !== 'active' ||
      employee.employeeType !== 'service_window_officer' || !employee.profile?.officeId) {
    res.status(403).json({ message: 'An active service employee with an assigned office is required.' });
    return null;
  }
  const booking = await AppointmentBooking.findOne({
    _id: req.params.appointmentId,
    officeId: employee.profile.officeId,
  });
  if (!booking) {
    res.status(404).json({ message: 'Assigned appointment not found.' });
    return null;
  }
  return booking;
}

const checkIn = async (req, res, next) => {
  let session;
  try {
    const booking = await getAssignedBooking(req, res);
    if (!booking) return;
    if (booking.status !== 'CONFIRMED') return res.status(409).json({ message: 'Only confirmed appointments can be checked in.' });
    const now = new Date();
    const today = localDateKey(now);
    const appointmentDate = booking.slotDate.toISOString().slice(0, 10);
    if (appointmentDate !== today) {
      return res.status(409).json({
        message: appointmentDate < today
          ? 'This appointment has passed and can no longer be checked in.'
          : 'This appointment can only be checked in on its scheduled day.',
      });
    }
    const feedbackDeadlineAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    session = await mongoose.startSession();
    let checkedInBooking;
    await session.withTransaction(async () => {
      const currentBooking = await AppointmentBooking.findOneAndUpdate(
        { _id: booking._id, status: 'CONFIRMED', slotDate: booking.slotDate },
        {
          $set: {
            status: 'CHECKED_IN',
            checkedInAt: now,
            feedbackDeadlineAt,
          },
        },
        { new: true, session }
      );
      if (!currentBooking) {
        const conflict = new Error('This appointment has already changed and cannot be checked in.');
        conflict.status = 409;
        throw conflict;
      }
      const [delivery] = await ServiceDelivery.create([{
        appointmentId: currentBooking._id,
        citizenIdentityId: currentBooking.citizenIdentityId,
        employeeId: req.user.id,
        serviceId: booking.serviceId || null,
        windowId: currentBooking.windowId,
        actualAttendanceAt: now,
        feedbackDeadlineAt,
        status: 'CHECKED_IN',
      }], { session });
      currentBooking.deliveryId = delivery._id;
      checkedInBooking = await currentBooking.save({ session });
      await Notification.create([{
        userId: currentBooking.citizenIdentityId,
        type: 'feedback_request',
        title: 'Appointment accepted — share feedback',
        message: 'Your employee accepted your appointment. You can now share feedback or a compliment within two days.',
        relatedId: delivery._id,
      }], { session });
      await AuditLog.create([{
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'CHECK_IN_APPOINTMENT',
        resourceType: 'AppointmentBooking',
        resourceId: String(currentBooking._id),
        details: { serviceId: booking.serviceId ? String(booking.serviceId) : null, feedbackDeadlineAt },
        ipAddress: req.ip || '',
      }], { session });
    });
    res.json({ message: 'Appointment accepted and citizen notified.', booking: checkedInBooking });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
};

const startService = async (req, res, next) => {
  try {
    const booking = await getAssignedBooking(req, res);
    if (!booking) return;
    if (booking.status !== 'CHECKED_IN') return res.status(409).json({ message: 'Check in the citizen before starting service.' });
    booking.status = 'IN_SERVICE';
    booking.startedAt = new Date();
    await booking.save();
    res.json({ message: 'Service started.', booking });
  } catch (error) {
    next(error);
  }
};

const submitDelivery = async (req, res, next) => {
  try {
    const booking = await getAssignedBooking(req, res);
    if (!booking) return;
    if (!['IN_SERVICE', 'REJECTED'].includes(booking.status)) return res.status(409).json({ message: 'The appointment must be in service or have a rejected attendance record before resubmitting.' });
    const serviceId = req.body.serviceId || booking.serviceId;
    if (!mongoose.Types.ObjectId.isValid(String(serviceId || ''))) {
      return res.status(400).json({ message: 'Select the service delivered before submitting attendance.' });
    }
    const employee = await User.findById(req.user.id).select('profile.officeId');
    const service = await Service.findOne({
      _id: serviceId,
      organization: booking.officeId,
      window: booking.windowId,
      isActive: { $ne: false },
      ...(employee?.profile?.officeId ? { organization: employee.profile.officeId } : {}),
    });
    if (!service) return res.status(400).json({ message: 'The selected service is not assigned to this office window or employee.' });
    const outcome = typeof req.body.outcome === 'string' ? req.body.outcome.trim() : '';
    const details = typeof req.body.deliveryDetails === 'string' ? req.body.deliveryDetails.trim() : '';
    const actualAttendanceAt = typeof req.body.actualAttendanceAt === 'string' ? new Date(req.body.actualAttendanceAt) : null;
    if (outcome.length < 3 || outcome.length > 2000 || details.length > 4000 ||
        !actualAttendanceAt || Number.isNaN(actualAttendanceAt.getTime()) || actualAttendanceAt > new Date() ||
        localDateKey(actualAttendanceAt) < booking.slotDate.toISOString().slice(0, 10)) {
      return res.status(400).json({ message: 'Provide a service outcome, valid delivery details, and a past actual attendance date and time.' });
    }

    const submittedAt = new Date();
    let delivery;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const currentBooking = await AppointmentBooking.findOne({
          _id: booking._id,
          status: { $in: ['IN_SERVICE', 'REJECTED'] },
        }).session(session);
        if (!currentBooking) {
          const conflict = new Error('The appointment has already been submitted or changed.');
          conflict.status = 409;
          throw conflict;
        }
        currentBooking.serviceId = service._id;
        delivery = await ServiceDelivery.findOne({ appointmentId: booking._id }).session(session);
        if (delivery && !['CHECKED_IN', 'REJECTED', 'ATTENDANCE_REJECTED'].includes(delivery.status)) {
          const conflict = new Error('This appointment already has a pending or approved attendance record.');
          conflict.status = 409;
          throw conflict;
        }
        if (delivery) {
          if (delivery.status !== 'CHECKED_IN') {
            delivery.submissionHistory.push({
              employeeId: delivery.employeeId,
              actualAttendanceAt: delivery.actualAttendanceAt || delivery.createdAt,
              outcome: delivery.outcome,
              deliveryDetails: delivery.deliveryDetails,
              submittedAt: delivery.createdAt,
            });
          }
          delivery.employeeId = req.user.id;
          delivery.serviceId = service._id;
          delivery.actualAttendanceAt = actualAttendanceAt;
          delivery.outcome = outcome;
          delivery.deliveryDetails = details;
          delivery.status = 'PENDING_ADMIN_APPROVAL';
          delivery.reviewedBy = null;
          delivery.reviewedAt = null;
          delivery.reviewNotes = '';
          await delivery.save({ session });
        } else {
          [delivery] = await ServiceDelivery.create([{
            appointmentId: booking._id,
            citizenIdentityId: booking.citizenIdentityId,
            employeeId: req.user.id,
            serviceId: service._id,
            windowId: booking.windowId,
            actualAttendanceAt,
            feedbackDeadlineAt: null,
            outcome,
            deliveryDetails: details,
            status: 'PENDING_ADMIN_APPROVAL',
          }], { session });
        }
        currentBooking.status = 'AWAITING_APPROVAL';
        currentBooking.completedAt = submittedAt;
        currentBooking.deliveryId = delivery._id;
        await currentBooking.save({ session });
        await AuditLog.create([{
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'SUBMIT_ATTENDANCE_CONFIRMATION',
          resourceType: 'ServiceDelivery',
          resourceId: String(delivery._id),
          details: { appointmentId: String(booking._id) },
          ipAddress: req.ip || '',
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({ message: 'Attendance confirmation submitted for administrator approval.', delivery });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, employeeType, nationalId, jobTitle } = req.body;
    if (req.user.role === 'registrar') {
      const registrar = await User.findById(req.user.id)
        .select('profile.officeId profile.officeAssignmentLabel')
        .lean();
      if (!registrar?.profile?.officeId && !registrar?.profile?.officeAssignmentLabel?.trim()) {
        return res.status(403).json({
          message: 'A registrar must be assigned to an office or given a manual office name before submitting employee records.',
        });
      }
    }
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof name !== 'string' || name.trim().length < 2 ||
        name.trim().length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
        typeof nationalId !== 'string' || !/^\d{12}$/.test(nationalId.trim()) ||
        typeof jobTitle !== 'string' || jobTitle.trim().length < 2 || jobTitle.trim().length > 120 ||
        typeof phone !== 'string' || !isValidEthiopianMobileNumber(phone.trim())) {
      return res.status(400).json({ message: 'Enter a valid name, email, 12-digit National ID, job title, and a 10-digit phone number starting with 09.' });
    }
    if (!EMPLOYEE_TYPES.includes(employeeType)) {
      return res.status(400).json({ message: 'Choose an employee category before submitting the registration.' });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'That email is already in use.' });
    if (await User.exists({ role: 'employee', phone: phone.trim() })) {
      return res.status(409).json({ message: 'An employee with this phone number is already registered.' });
    }
    const nationalIdHash = getFanHash(nationalId.trim());
    if (await User.exists({ 'profile.nationalIdHash': nationalIdHash })) {
      return res.status(409).json({ message: 'An employee with this National ID is already registered.' });
    }
    const temporaryPassword = crypto.randomBytes(48).toString('hex');
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : '',
      password: temporaryPassword,
      role: 'employee',
      employeeType,
      status: 'pending',
      createdBy: req.user.id,
      profile: {
        officeId: null,
        services: [],
        nationalIdHash,
        nationalIdLastFour: nationalId.trim().slice(-4),
        jobTitle: jobTitle.trim(),
        schedule: [],
      },
    });
    await EmployeeProfile.create({
      userId: user._id,
      employeeType,
      nationalIdHash,
      nationalIdLastFour: nationalId.trim().slice(-4),
      jobTitle: jobTitle.trim(),
      schedule: [],
      officeId: null,
      createdBy: req.user.id,
      status: 'pending',
    });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'CREATE_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(user._id),
      details: { employeeType },
      ipAddress: req.ip || '',
    });
    res.status(201).json({
      message: 'Employee registration submitted for administrator review.',
      employee: { _id: user._id, name: user.name, email: user.email, employeeType: user.employeeType, status: user.status },
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.phone) {
      return res.status(409).json({ message: 'An employee with this phone number is already registered.' });
    }
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const { name, email, phone } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof name !== 'string' || name.trim().length < 2 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
        typeof phone !== 'string' || !isValidEthiopianMobileNumber(phone.trim())) {
      return res.status(400).json({ message: 'Provide a valid name, email, and a 10-digit phone number starting with 09.' });
    }
    const employee = await User.findOne({ _id: req.params.employeeId, role: 'employee' });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    const scope = await officeScope(req);
    if (scope === false || (scope && String(scope) !== String(employee.profile?.officeId))) {
      return res.status(403).json({ message: 'You can edit only employees in your assigned office.' });
    }
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: employee._id } }).select('_id').lean();
    if (existing) return res.status(409).json({ message: 'That email is already in use.' });
    const existingPhone = await User.exists({
      role: 'employee',
      phone: phone.trim(),
      _id: { $ne: employee._id },
    });
    if (existingPhone) return res.status(409).json({ message: 'An employee with this phone number is already registered.' });
    employee.name = name.trim();
    employee.email = normalizedEmail;
    employee.phone = phone.trim();
    await employee.save({ validateBeforeSave: false });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: { fields: ['name', 'email', ...(phone !== undefined ? ['phone'] : [])] },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Employee record updated.', employee: { id: employee._id, name: employee.name, email: employee.email, phone: employee.phone } });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.phone) {
      return res.status(409).json({ message: 'An employee with this phone number is already registered.' });
    }
    next(error);
  }
};

const approveEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const employee = await User.findOne({ _id: req.params.employeeId, role: 'employee', status: 'pending', archivedAt: null });
    if (!employee) return res.status(404).json({ message: 'Pending employee not found.' });
    if (!employee.createdBy || String(employee.createdBy) === String(req.user.id)) {
      return res.status(403).json({ message: 'The employee must be approved by a different authorized user.' });
    }
    const scope = await officeScope(req);
    if (scope === false || (scope && String(scope) !== String(employee.profile?.officeId))) {
      return res.status(403).json({ message: 'You can approve employees only for your assigned office.' });
    }
    employee.status = 'approved';
    employee.approvedBy = req.user.id;
    employee.approvedAt = new Date();
    await employee.save({ validateBeforeSave: false });
    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id },
      { status: 'approved', approvedBy: req.user.id }
    );
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'APPROVE_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: { createdBy: String(employee.createdBy) },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Employee approved. Assign an office and work schedule before sharing an activation link.' });
  } catch (error) {
    next(error);
  }
};

const rejectEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const employee = await User.findOne({
      _id: req.params.employeeId,
      role: 'employee',
      status: 'pending',
      archivedAt: null,
    });
    if (!employee) return res.status(404).json({ message: 'Pending employee not found.' });
    if (!employee.createdBy || String(employee.createdBy) === String(req.user.id)) {
      return res.status(403).json({ message: 'The employee must be reviewed by a different authorized user.' });
    }
    const scope = await officeScope(req);
    if (scope === false || (scope && String(scope) !== String(employee.profile?.officeId))) {
      return res.status(403).json({ message: 'You can reject employees only for your assigned office.' });
    }

    employee.status = 'rejected';
    employee.invitationToken = null;
    employee.invitationExpiresAt = null;
    await employee.save({ validateBeforeSave: false });
    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id },
      { status: 'rejected', invitationToken: null, invitationExpiresAt: null },
    );
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REJECT_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: { createdBy: String(employee.createdBy) },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Employee registration rejected.' });
  } catch (error) {
    next(error);
  }
};

const activateEmployee = async (req, res, next) => {
  try {
    const { token, name, nationalId, password } = req.body;
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/.test(token) ||
        typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120 ||
        typeof nationalId !== 'string' || !/^\d{12}$/.test(nationalId.trim()) ||
        typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Enter your registered full name, 12-digit National ID, and a password of 8–128 characters.' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const nationalIdHash = getFanHash(nationalId.trim());
    const now = new Date();
    const invitation = await User.findOne({
      invitationToken: tokenHash,
      invitationExpiresAt: { $gt: now },
      status: 'approved',
      role: 'employee',
      archivedAt: null,
    }).select('+profile.nationalIdHash').lean();
    if (!invitation) return res.status(400).json({ message: 'Invitation is invalid, expired, or already used.' });
    const expectedName = invitation.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const submittedName = name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const storedNationalIdHash = invitation.profile?.nationalIdHash || '';
    const matchesNationalId = storedNationalIdHash.length === nationalIdHash.length &&
      crypto.timingSafeEqual(Buffer.from(storedNationalIdHash), Buffer.from(nationalIdHash));
    if (expectedName !== submittedName || !matchesNationalId) {
      return res.status(400).json({ message: 'The name or National ID does not match the employee registration.' });
    }
    const assignmentQuery = {
      'profile.officeId': { $exists: true, $ne: null },
      'profile.schedule.0': { $exists: true },
    };
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
    const employee = await User.findOneAndUpdate(
      {
        _id: invitation._id,
        name: invitation.name,
        invitationToken: tokenHash,
        invitationExpiresAt: { $gt: now },
        status: 'approved',
        role: 'employee',
        archivedAt: null,
        'profile.nationalIdHash': nationalIdHash,
        ...assignmentQuery,
      },
      { $set: { password: passwordHash, status: 'active', invitationToken: null, invitationExpiresAt: null, invitationUsedAt: now } },
      { new: true }
    );
    if (!employee) {
      return res.status(409).json({ message: 'Ask your administrator to assign your office and weekly work schedule before activation, or request a new invitation link.' });
    }
    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id, invitationToken: tokenHash },
      { status: 'active', invitationToken: null, invitationExpiresAt: null, invitationUsedAt: now }
    );
    res.json({
      message: 'Employee account activated. You can sign in at /employe.',
      employeeType: employee.employeeType,
    });
  } catch (error) {
    next(error);
  }
};

const setInitialEmployeePassword = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const nationalId = typeof req.body.nationalId === 'string' ? req.body.nationalId.trim() : '';
    const { password, confirmation } = req.body;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        !/^\d{12}$/.test(nationalId) || typeof password !== 'string' ||
        password.length < 8 || password.length > 128 || password !== confirmation) {
      return res.status(400).json({ message: 'Enter your work email, 12-digit National ID, and matching passwords of 8–128 characters.' });
    }

    const now = new Date();
    const nationalIdHash = getFanHash(nationalId);
    const legacyProfile = await EmployeeProfile.findOne({ nationalIdHash }).select('userId').lean();
    const identityMatch = {
      $or: [
        { 'profile.nationalIdHash': nationalIdHash },
        ...(legacyProfile ? [{ _id: legacyProfile.userId }] : []),
      ],
    };
    const employee = await User.findOneAndUpdate(
      {
        email,
        role: 'employee',
        status: 'approved',
        archivedAt: null,
        invitationUsedAt: null,
        ...identityMatch,
      },
      {
        $set: {
          password: await bcrypt.hash(password, 12),
          status: 'active',
          invitationToken: null,
          invitationExpiresAt: null,
          invitationUsedAt: now,
        },
      },
      { new: true },
    );
    if (!employee) {
      return res.status(400).json({ message: 'The employee details could not be verified. Check the work email and National ID, confirm the registration is approved, and make sure a password has not already been set.' });
    }

    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id, status: 'approved' },
      { status: 'active', invitationToken: null, invitationExpiresAt: null, invitationUsedAt: now },
    );
    await AuditLog.create({
      actorId: employee._id,
      actorRole: 'employee',
      action: 'SET_EMPLOYEE_INITIAL_PASSWORD',
      resourceType: 'User',
      resourceId: String(employee._id),
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Password set. You can now sign in.', employeeType: employee.employeeType });
  } catch (error) {
    next(error);
  }
};

const assignEmployee = async (req, res, next) => {
  try {
    const { officeId } = req.body;
    const officeAssignmentLabel = typeof req.body.officeAssignmentLabel === 'string'
      ? req.body.officeAssignmentLabel.trim()
      : '';
    const manualOffice = !officeId && officeAssignmentLabel.length >= 2 && officeAssignmentLabel.length <= 120;
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const scope = await officeScope(req);
    if (scope === false || (scope && (!officeId || String(scope) !== String(officeId)))) {
      return res.status(403).json({ message: 'You can assign employees only within your assigned office.' });
    }
    if (officeId && officeAssignmentLabel) {
      return res.status(400).json({ message: 'Choose a registered office or enter a manual office name, not both.' });
    }
    if (!manualOffice && !mongoose.Types.ObjectId.isValid(String(officeId || ''))) {
      return res.status(400).json({ message: 'Choose a valid office.' });
    }
    const employee = await User.findOne({ _id: req.params.employeeId, role: 'employee', status: { $in: ['approved', 'active'] } });
    if (!employee) return res.status(404).json({ message: 'Approved or active employee not found.' });
    const Organization = require('../models/Organization');
    if (!manualOffice && !(await Organization.exists({ _id: officeId }))) return res.status(404).json({ message: 'Office was not found.' });
    employee.profile = {
      ...employee.profile,
      officeId: manualOffice ? null : officeId,
      officeAssignmentLabel: manualOffice ? officeAssignmentLabel : '',
      windowId: null,
      floorId: null,
      services: [],
    };
    employee.invitationToken = null;
    employee.invitationExpiresAt = null;
    employee.invitationUsedAt = null;
    await employee.save({ validateBeforeSave: false });
    const employeeProfile = await EmployeeProfile.findOne({ userId: employee._id });
    if (employeeProfile) {
      employeeProfile.employeeType = employee.employeeType || 'service_window_officer';
      employeeProfile.officeId = manualOffice ? null : officeId;
      employeeProfile.floorId = null;
      employeeProfile.windowId = null;
      employeeProfile.services = [];
      employeeProfile.status = employee.status;
      employeeProfile.invitationToken = null;
      employeeProfile.invitationExpiresAt = null;
      employeeProfile.invitationUsedAt = null;
      await employeeProfile.save();
    } else {
      await EmployeeProfile.create({
        userId: employee._id,
        employeeType: employee.employeeType || 'service_window_officer',
        officeId: manualOffice ? null : officeId,
        windowId: null,
        services: [],
        status: employee.status,
        createdBy: employee.createdBy,
        approvedBy: employee.approvedBy,
        invitationToken: null,
        invitationExpiresAt: null,
        invitationUsedAt: null,
      });
    }
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ASSIGN_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: {
        officeId: manualOffice ? null : String(officeId),
        officeAssignmentLabel: manualOffice ? officeAssignmentLabel : '',
        employeeType: employee.employeeType,
      },
      ipAddress: req.ip || '',
    });
    const invitationToken = manualOffice ? null : await createEmployeeInvitationIfAssigned(employee);
    res.json({
      message: manualOffice ? 'Manual office label saved. A registered office is required to enable office-based services and activation links.' : 'Employee office assignment saved.',
      ...(invitationToken ? { invitationToken, invitationExpiresAt: employee.invitationExpiresAt } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Employee status must be active or suspended.' });
    }
    const employee = await User.findOne({ _id: req.params.employeeId, role: 'employee' });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (employee.archivedAt) return res.status(409).json({ message: 'This employee is archived and cannot be reactivated.' });
    const scope = await officeScope(req);
    if (scope === false || (scope && String(scope) !== String(employee.profile?.officeId))) {
      return res.status(403).json({ message: 'You can manage only employees in your assigned office.' });
    }
    if (!['active', 'suspended'].includes(employee.status)) {
      return res.status(409).json({ message: 'Only activated employees can be suspended or reactivated.' });
    }
    employee.status = status;
    await employee.save({ validateBeforeSave: false });
    await EmployeeProfile.findOneAndUpdate({ userId: employee._id }, { status });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: status === 'suspended' ? 'SUSPEND_EMPLOYEE' : 'REACTIVATE_EMPLOYEE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: {},
      ipAddress: req.ip || '',
    });
    res.json({ message: `Employee ${status === 'suspended' ? 'suspended' : 'reactivated'}.`, status });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeWorkSchedule = async (req, res, next) => {
  try {
    const { jobTitle, schedule } = req.body;
    if (typeof jobTitle !== 'string' || jobTitle.trim().length < 2 || jobTitle.trim().length > 120 ||
        !validateEmployeeSchedule(schedule) || !schedule.length) {
      return res.status(400).json({ message: 'Enter a valid job title and weekly schedule.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee identifier.' });
    }
    const employee = await User.findOne({ _id: req.params.employeeId, role: 'employee' });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (!['approved', 'active'].includes(employee.status)) {
      return res.status(409).json({ message: 'Approve the employee before assigning a work schedule.' });
    }
    const scope = await officeScope(req);
    if (scope === false || (scope && String(scope) !== String(employee.profile?.officeId))) {
      return res.status(403).json({ message: 'You can manage only employees in your assigned office.' });
    }
    employee.profile = { ...employee.profile, jobTitle: jobTitle.trim(), schedule };
    await employee.save({ validateBeforeSave: false });
    await EmployeeProfile.findOneAndUpdate(
      { userId: employee._id },
      { jobTitle: jobTitle.trim(), schedule, status: employee.status },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_EMPLOYEE_WORK_SCHEDULE',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: { shiftCount: schedule.length },
      ipAddress: req.ip || '',
    });
    const invitationToken = await createEmployeeInvitationIfAssigned(employee);
    res.json({
      message: 'Employee job title and weekly schedule updated.',
      ...(invitationToken ? { invitationToken, invitationExpiresAt: employee.invitationExpiresAt } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await User.findOne({ _id: req.user.id, role: 'employee', status: 'active' })
      .select('name email status employeeType profile.officeId profile.officeAssignmentLabel profile.nationalIdLastFour profile.jobTitle profile.schedule')
      .populate('profile.officeId', 'name');
    if (!employee) return res.status(404).json({ message: 'Active employee account was not found.' });
    res.json({
      profile: {
        name: employee.name,
        email: employee.email,
        jobTitle: employee.profile?.jobTitle || employee.employeeType.replace('_', ' '),
        office: employee.profile?.officeId?.name || null,
        officeAssignmentLabel: employee.profile?.officeAssignmentLabel || '',
        maskedNationalId: `********${employee.profile?.nationalIdLastFour || ''}`,
        schedule: employee.profile?.schedule || [],
        officeAssigned: Boolean(employee.profile?.officeId),
        scheduleAssigned: Boolean(employee.profile?.schedule?.length),
        status: employee.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changeEmployeePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'Enter your current password and a new password of 8–128 characters.' });
    }
    const employee = await User.findOne({ _id: req.user.id, role: 'employee', status: 'active' });
    if (!employee || !await employee.comparePassword(currentPassword)) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    employee.password = newPassword;
    await employee.save();
    await AuditLog.create({
      actorId: employee._id,
      actorRole: 'employee',
      action: 'CHANGE_EMPLOYEE_PASSWORD',
      resourceType: 'User',
      resourceId: String(employee._id),
      details: {},
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignedBookings,
  getEmployeeCompliments,
  getEmployeeMessages,
  markEmployeeMessagesRead,
  deleteEmployeeMessage,
  checkIn,
  startService,
  submitDelivery,
  createEmployee,
  updateEmployee,
  approveEmployee,
  rejectEmployee,
  activateEmployee,
  setInitialEmployeePassword,
  assignEmployee,
  listEmployees,
  requestEmployeePasswordReset,
  updateEmployeeStatus,
  updateEmployeeWorkSchedule,
  getEmployeeProfile,
  changeEmployeePassword,
};
