const TIME_ZONE = 'Africa/Addis_Ababa';
const SESSIONS = {
  session1: { label: 'Afternoon', start: '13:30', end: '17:30', maxCapacity: 100 },
  session2: { label: 'Morning', start: '08:30', end: '12:30', maxCapacity: 100 },
};

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyToUtcDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Invalid calendar date.');
  const date = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== key) {
    throw new Error('Invalid calendar date.');
  }
  return date;
}

function addCalendarDays(key, days) {
  const date = dateKeyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { hour: Number(values.hour), minute: Number(values.minute) };
}

function minutesOfDay({ hour, minute }) {
  return hour * 60 + minute;
}

function getBookableDates({ now = new Date(), closedDates = [], closedWeekdays = [0, 6] } = {}) {
  const today = localDateKey(now);
  const currentMinutes = minutesOfDay(localTimeParts(now));
  const blockedDates = new Set(closedDates);
  const dates = [];

  for (let offset = 0; offset < 5; offset += 1) {
    const date = addCalendarDays(today, offset);
    const weekday = dateKeyToUtcDate(date).getUTCDay();
    if (blockedDates.has(date) || closedWeekdays.includes(weekday)) continue;
    const openSessions = Object.entries(SESSIONS).filter(([, session]) => {
      if (offset !== 0) return true;
      const [endHour, endMinute] = session.end.split(':').map(Number);
      return currentMinutes < endHour * 60 + endMinute;
    }).map(([id]) => id);
    if (openSessions.length) dates.push({ date, openSessions });
  }
  return dates;
}

function getCalendarDates({ now = new Date(), closedDates = [], closedWeekdays = [0, 6], days = 30 } = {}) {
  const today = localDateKey(now);
  const bookableDates = new Map(
    getBookableDates({ now, closedDates, closedWeekdays }).map((item) => [item.date, item.openSessions])
  );
  return Array.from({ length: days }, (_, offset) => {
    const date = addCalendarDays(today, offset);
    const openSessions = bookableDates.get(date) || [];
    return { date, bookable: openSessions.length > 0, openSessions };
  });
}

module.exports = { TIME_ZONE, SESSIONS, localDateKey, dateKeyToUtcDate, addCalendarDays, getBookableDates, getCalendarDates };
