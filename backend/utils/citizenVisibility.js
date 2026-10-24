const { addCalendarDays, localDateKey } = require('./appointmentCalendar');

const dateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

function isAppointmentVisible(booking, { now = new Date() } = {}) {
  if (!booking || ['CANCELLED', 'NO_SHOW'].includes(booking.status)) return false;
  const today = localDateKey(now);
  const appointmentDate = dateKey(booking.slotDate);
  if (!appointmentDate) return false;

  const firstVisibleDate = addCalendarDays(appointmentDate, -3);
  if (today >= firstVisibleDate && today <= appointmentDate) return true;
  if (today <= appointmentDate) return false;

  const delivery = booking.deliveryId && typeof booking.deliveryId === 'object' ? booking.deliveryId : null;
  if (!delivery || !['ATTENDANCE_APPROVED', 'APPROVED'].includes(delivery.status)) return false;
  const attendanceValue = delivery.actualAttendanceAt || delivery.reviewedAt || delivery.updatedAt;
  const attendanceDate = attendanceValue ? localDateKey(new Date(attendanceValue)) : null;
  return !!attendanceDate && today <= addCalendarDays(attendanceDate, 3);
}

module.exports = { dateKey, isAppointmentVisible };
