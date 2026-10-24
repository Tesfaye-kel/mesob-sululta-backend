const crypto = require('crypto');
const mongoose = require('mongoose');
const AppointmentBooking = require('../models/AppointmentBooking');
const AppointmentSlot = require('../models/AppointmentSlot');
const AuditLog = require('../models/AuditLog');
const CitizenIdentity = require('../models/CitizenIdentity');
const Floor = require('../models/Floor');
const Holiday = require('../models/Holiday');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const Requirement = require('../models/Requirement');
const Service = require('../models/Service');
const Window = require('../models/Window');
const { ACTIVE_BOOKING_STATUSES } = require('../utils/appointmentBookingRules');
const { SESSIONS, addCalendarDays, dateKeyToUtcDate, getBookableDates, getCalendarDates, localDateKey } = require('../utils/appointmentCalendar');

const isCitizen = (req) => req.user?.role === 'citizen';
const citizenId = (req) => req.user.id;
const validId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

async function getDefaultOfficeWindow(officeId) {
  const windows = await Window.find({
    isActive: { $ne: false },
    $or: [{ organization: officeId }, { assignedOrganizations: officeId }],
  }).sort({ floor: 1, number: 1, _id: 1 }).lean();
  return windows.find((window) => window.assignedOrganizations?.length
    ? window.assignedOrganizations.some((assignedOfficeId) => String(assignedOfficeId) === String(officeId))
    : String(window.organization || '') === String(officeId)) || null;
}

const getOptions = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    const services = await Service.find({ isActive: { $ne: false } })
      .populate('organization', 'name closedWeekdays floorId')
      .populate({
        path: 'window',
        match: { isActive: { $ne: false } },
        select: 'number name floor organization assignedOrganizations',
        populate: { path: 'organization', select: 'name closedWeekdays' },
      })
      .sort({ 'name.en': 1 })
      .lean();
    const availableServices = services.filter((service) => {
      if (!service.organization) return false;
      if (!service.window) return true;
      const assigned = service.window.assignedOrganizations || [];
      return assigned.length
        ? assigned.some((officeId) => String(officeId) === String(service.organization._id))
        : String(service.window.organization?._id || service.window.organization) === String(service.organization._id);
    });
    const offices = await Organization.find({ isActive: { $ne: false } })
      .select('name description logoUrl')
      .sort({ displayOrder: 1 })
      .lean();
    const windows = await Window.find({
      isActive: { $ne: false },
      $or: [
        { organization: { $in: offices.map((office) => office._id) } },
        { assignedOrganizations: { $in: offices.map((office) => office._id) } },
      ],
    }).sort({ floor: 1, number: 1, _id: 1 }).lean();
    const defaultWindowByOffice = new Map();
    for (const office of offices) {
      const defaultWindow = windows.find((window) => window.assignedOrganizations?.length
        ? window.assignedOrganizations.some((assignedOfficeId) => String(assignedOfficeId) === String(office._id))
        : String(window.organization || '') === String(office._id));
      if (defaultWindow) defaultWindowByOffice.set(String(office._id), defaultWindow);
    }
    const requirements = await Requirement.find({
      service: { $in: availableServices.map((service) => service._id) },
      isActive: { $ne: false },
    }).select('service requirementText notes isMandatory sequenceNo').sort({ sequenceNo: 1 }).lean();
    const requirementsByService = new Map();
    for (const requirement of requirements) {
      const serviceId = String(requirement.service);
      const serviceRequirements = requirementsByService.get(serviceId) || [];
      serviceRequirements.push(requirement);
      requirementsByService.set(serviceId, serviceRequirements);
    }
    res.json({
      offices: offices.map((office) => ({
        ...office,
        defaultWindow: defaultWindowByOffice.get(String(office._id)) || null,
      })),
      services: availableServices.map((service) => ({
        ...service,
        requirements: requirementsByService.get(String(service._id)) || [],
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    const { windowId, officeId } = req.query;
    if (!validId(windowId)) return res.status(400).json({ message: 'A valid service window is required.' });
    const window = await Window.findOne({ _id: windowId, isActive: { $ne: false } });
    if (!window) return res.status(404).json({ message: 'Active service window not found.' });
    const officeIds = window.assignedOrganizations?.length
      ? window.assignedOrganizations.map(String)
      : window.organization ? [String(window.organization)] : [];
    const selectedOfficeId = validId(officeId) && officeIds.includes(String(officeId))
      ? String(officeId)
      : !officeId && window.organization ? String(window.organization) : null;
    if (!selectedOfficeId) return res.status(400).json({ message: 'Choose an office assigned to this service window.' });
    const office = await Organization.findById(selectedOfficeId).select('closedWeekdays');
    if (!office) return res.status(404).json({ message: 'The selected office was not found.' });

    const today = localDateKey();
    const horizonEnd = dateKeyToUtcDate(today);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 30);
    const holidays = await Holiday.find({
      isClosed: true,
      date: { $gte: dateKeyToUtcDate(today), $lt: horizonEnd },
    }).select('date').lean();
    const closedDates = holidays.map((holiday) => holiday.date.toISOString().slice(0, 10));
    const dates = getCalendarDates({
      now: new Date(),
      closedDates,
      closedWeekdays: office.closedWeekdays || [0, 6],
    });

    const firstDate = dateKeyToUtcDate(dates[0].date);
    const lastDate = dateKeyToUtcDate(addCalendarDays(dates[dates.length - 1].date, 1));
    const [slots, citizenBookings] = await Promise.all([
      AppointmentSlot.find({ windowId, slotDate: { $gte: firstDate, $lt: lastDate } }).lean(),
      AppointmentBooking.find({
        citizenIdentityId: citizenId(req),
        officeId: selectedOfficeId,
        slotDate: { $gte: firstDate, $lt: lastDate },
        status: { $in: ACTIVE_BOOKING_STATUSES },
      }).select('slotDate').lean(),
    ]);
    const alreadyBookedDates = new Set(citizenBookings.map((booking) => booking.slotDate.toISOString().slice(0, 10)));
    const slotsByDateSession = new Map(
      slots.map((slot) => [`${slot.slotDate.toISOString().slice(0, 10)}:${slot.session}`, slot])
    );
    const availability = [];
    for (const item of dates) {
      const alreadyBooked = alreadyBookedDates.has(item.date);
      availability.push({
        date: item.date,
        bookable: item.bookable,
        alreadyBooked,
        sessions: Object.entries(SESSIONS).map(([session, config]) => {
          const slot = slotsByDateSession.get(`${item.date}:${session}`);
          const booked = slot?.bookedCount || 0;
          const openToday = item.openSessions.includes(session);
          const remaining = Math.max(0, config.maxCapacity - booked);
          return {
            id: session,
            label: config.label,
            start: config.start,
            end: config.end,
            capacity: config.maxCapacity,
            booked,
            remaining,
            available: openToday && remaining > 0 && !alreadyBooked,
            status: alreadyBooked ? 'Already booked' : !openToday ? 'Unavailable' : remaining === 0 ? 'Fully Booked' : remaining <= 10 ? 'Nearly full' : 'Available',
          };
        }),
      });
    }
    const nextAvailableDate = availability.find((item) => item.sessions.some((session) => session.available))?.date || null;
    res.json({ timeZone: 'Africa/Addis_Ababa', horizonDays: 5, calendarDays: 30, nextAvailableDate, dates: availability });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    const { serviceId, officeId, windowId, slotDate, session, idempotencyKey } = req.body;
    if (!validId(officeId) || !validId(windowId) || (serviceId && !validId(serviceId)) ||
        typeof slotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slotDate) ||
        !Object.hasOwn(SESSIONS, session) ||
        typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return res.status(400).json({ message: 'Choose a valid office, window, date, session, and booking request key.' });
    }

    const existing = await AppointmentBooking.findOne({ idempotencyKey }).lean();
    if (existing) {
      if (String(existing.citizenIdentityId) !== String(citizenId(req))) {
        return res.status(409).json({ message: 'This booking request key has already been used.' });
      }
      return res.json({ message: 'Booking already confirmed.', booking: existing });
    }

    const [office, window, service] = await Promise.all([
      Organization.findOne({ _id: officeId, isActive: { $ne: false } }).select('closedWeekdays floorId name'),
      Window.findOne({ _id: windowId, isActive: { $ne: false } }),
      validId(serviceId) ? Service.findOne({ _id: serviceId, isActive: { $ne: false } }) : null,
    ]);
    if (!office || !window) return res.status(404).json({ message: 'Active service window or office was not found.' });
    const defaultWindow = service ? null : await getDefaultOfficeWindow(officeId);
    if (!service && (!defaultWindow || String(defaultWindow._id) !== String(windowId))) {
      return res.status(400).json({ message: 'The selected window is not the default active window for this office.' });
    }
    if (service && (String(service.window) !== String(windowId) || String(service.organization) !== String(officeId))) {
      return res.status(400).json({ message: 'The selected active service is not offered at this office window.' });
    }
    const assignedOfficeIds = window.assignedOrganizations?.length
      ? window.assignedOrganizations.map(String)
      : window.organization ? [String(window.organization)] : [];
    if (!assignedOfficeIds.includes(String(office._id))) {
      return res.status(400).json({ message: 'This service office is not assigned to the selected window.' });
    }

    const today = localDateKey();
    const horizonEnd = dateKeyToUtcDate(today);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 5);
    const holidayRows = await Holiday.find({
      isClosed: true,
      date: { $gte: dateKeyToUtcDate(today), $lt: horizonEnd },
    }).select('date').lean();
    const permittedDates = getBookableDates({
      now: new Date(),
      closedDates: holidayRows.map((holiday) => holiday.date.toISOString().slice(0, 10)),
      closedWeekdays: office.closedWeekdays || [0, 6],
    });
    const permitted = permittedDates.find((item) => item.date === slotDate && item.openSessions.includes(session));
    if (!permitted) {
      return res.status(400).json({ message: 'That date or session is outside the five-day booking calendar or is closed.' });
    }

    const serviceFloor = office.floorId
      ? { _id: office.floorId }
      : await Floor.findOne({ floorNumber: window.floor }).select('_id').lean();
    const targetDate = dateKeyToUtcDate(slotDate);
    const existingOfficeDayBooking = await AppointmentBooking.findOne({
      citizenIdentityId: citizenId(req),
      officeId: office._id,
      slotDate: targetDate,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select('_id').lean();
    if (existingOfficeDayBooking) {
      return res.status(409).json({ message: 'You already have an appointment at this office on that date. You may book at a different office or choose another date.' });
    }
    const appointmentReference = `MSB-${crypto.randomBytes(7).toString('hex').toUpperCase()}`;
    let preparedSlot;
    try {
      preparedSlot = await AppointmentSlot.findOneAndUpdate(
        { windowId, slotDate: targetDate, session },
        { $setOnInsert: { capacity: 100, bookedCount: 0, status: 'open' } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      preparedSlot = await AppointmentSlot.findOne({ windowId, slotDate: targetDate, session });
      if (!preparedSlot) throw error;
    }
    const mongoSession = await mongoose.startSession();
    let created;
    try {
      await mongoSession.withTransaction(async () => {
        const sameDayBooking = await AppointmentBooking.findOne({
          citizenIdentityId: citizenId(req),
          officeId: office._id,
          slotDate: targetDate,
          status: { $in: ACTIVE_BOOKING_STATUSES },
        }).session(mongoSession).select('_id').lean();
        if (sameDayBooking) {
          const error = new Error('You already have an appointment at this office on that date. You may book at a different office or choose another date.');
          error.status = 409;
          throw error;
        }
        let slot = await AppointmentSlot.findOneAndUpdate(
          { _id: preparedSlot._id, bookedCount: { $lt: 100 } },
          { $inc: { bookedCount: 1 }, $set: { status: 'open' } },
          { new: true, session: mongoSession }
        );
        if (!slot) {
          const error = new Error('This session is fully booked. Choose another session or date.');
          error.status = 409;
          throw error;
        }
        if (slot.bookedCount >= 100) {
          slot.status = 'full';
          await slot.save({ session: mongoSession });
        }
        const [booking] = await AppointmentBooking.create([{
          citizenIdentityId: citizenId(req),
          serviceId: service?._id || null,
          windowId: window._id,
          officeId: office._id,
          floorId: serviceFloor?._id || null,
          slotId: slot._id,
          slotDate: targetDate,
          session,
          queueNumber: slot.bookedCount,
          dailyBookingActive: true,
          idempotencyKey,
          appointmentReference,
          status: 'CONFIRMED',
        }], { session: mongoSession });
        created = booking;
        await AuditLog.create([{
          actorId: citizenId(req),
          actorRole: 'citizen',
          action: 'BOOK_APPOINTMENT',
          resourceType: 'AppointmentBooking',
          resourceId: String(booking._id),
          details: { officeId: String(office._id), serviceId: service ? String(service._id) : null, windowId: String(window._id), slotDate, session },
          ipAddress: req.ip || '',
        }], { session: mongoSession });
      });
    } finally {
      await mongoSession.endSession();
    }

    res.status(201).json({ message: 'Appointment confirmed.', booking: created });
  } catch (error) {
    if (error?.code === 11000 && req.body?.idempotencyKey) {
      try {
        const existing = await AppointmentBooking.findOne({ idempotencyKey: req.body.idempotencyKey }).lean();
        if (existing && String(existing.citizenIdentityId) === String(citizenId(req))) {
          return res.json({ message: 'Booking already confirmed.', booking: existing });
        }
      } catch (lookupError) {
        return next(lookupError);
      }
      if (error.keyPattern?.citizenIdentityId && error.keyPattern?.officeId && error.keyPattern?.slotDate) {
        return res.status(409).json({ message: 'You already have an appointment at this office on that date. You may book at a different office or choose another date.' });
      }
    }
    next(error);
  }
};

const listMyBookings = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    const bookings = await AppointmentBooking.find({ citizenIdentityId: citizenId(req) })
      .populate('serviceId', 'name requiredDocuments description')
      .populate('officeId', 'name')
      .populate('windowId', 'number floor name')
      .populate('deliveryId', 'status outcome reviewNotes actualAttendanceAt feedbackDeadlineAt reviewedAt updatedAt')
      .sort({ slotDate: -1, createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    if (!validId(req.params.bookingId)) return res.status(400).json({ message: 'Invalid appointment identifier.' });
    const mongoSession = await mongoose.startSession();
    let cancelled = false;
    try {
      await mongoSession.withTransaction(async () => {
        const booking = await AppointmentBooking.findOneAndUpdate(
          { _id: req.params.bookingId, citizenIdentityId: citizenId(req), status: 'CONFIRMED' },
          { $set: { status: 'CANCELLED', cancelledAt: new Date(), dailyBookingActive: false } },
          { new: true, session: mongoSession }
        );
        if (!booking) return;
        const slot = await AppointmentSlot.findOneAndUpdate(
          { _id: booking.slotId, bookedCount: { $gt: 0 } },
          { $inc: { bookedCount: -1 }, $set: { status: 'open' } },
          { new: true, session: mongoSession }
        );
        if (!slot) throw new Error('Appointment capacity could not be released; cancellation was rolled back.');
        cancelled = true;
        await Notification.create([{
          userId: citizenId(req),
          type: 'cancellation',
          title: 'Appointment cancelled',
          message: `Appointment ${booking.appointmentReference} was cancelled.`,
          relatedId: booking._id,
        }], { session: mongoSession });
        await AuditLog.create([{
          actorId: citizenId(req),
          actorRole: 'citizen',
          action: 'CANCEL_APPOINTMENT',
          resourceType: 'AppointmentBooking',
          resourceId: String(booking._id),
          details: { slotId: String(slot._id) },
          ipAddress: req.ip || '',
        }], { session: mongoSession });
      });
    } finally {
      await mongoSession.endSession();
    }
    if (!cancelled) return res.status(409).json({ message: 'Appointment was not found or is no longer cancellable.' });
    res.json({ message: 'Appointment cancelled. Capacity has been released.' });
  } catch (error) {
    next(error);
  }
};

const listCitizenNotifications = async (req, res, next) => {
  try {
    if (!isCitizen(req)) return res.status(403).json({ message: 'Verified citizen session required.' });
    const notifications = await Notification.find({
      userId: citizenId(req),
      $or: [{ userModel: 'CitizenIdentity' }, { userModel: { $exists: false } }],
      type: { $in: ['feedback_request', 'feedback_reply'] },
      deletedAt: null,
    })
      .select('type title message relatedId isRead createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOptions, getAvailability, createBooking, listMyBookings, cancelBooking, listCitizenNotifications };
