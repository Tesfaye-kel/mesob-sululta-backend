const test = require('node:test');
const assert = require('node:assert/strict');
const { SESSIONS, getBookableDates, getCalendarDates, localDateKey } = require('../utils/appointmentCalendar');

test('sessions use the correct Addis Ababa times for Ethiopian local-time display', () => {
  assert.deepEqual(
    { start: SESSIONS.session2.start, end: SESSIONS.session2.end },
    { start: '08:30', end: '12:30' }
  );
  assert.deepEqual(
    { start: SESSIONS.session1.start, end: SESSIONS.session1.end },
    { start: '13:30', end: '17:30' }
  );
});

test('calendar uses Africa/Addis_Ababa local date and the five-calendar-day horizon', () => {
  const now = new Date('2025-06-02T00:00:00.000Z');
  assert.equal(localDateKey(now), '2025-06-02');
  assert.deepEqual(
    getBookableDates({ now }).map((item) => item.date),
    ['2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05', '2025-06-06']
  );
});

test('calendar excludes configured holidays and closed weekdays', () => {
  const dates = getBookableDates({
    now: new Date('2025-06-02T00:00:00.000Z'),
    closedDates: ['2025-06-03'],
    closedWeekdays: [0, 6],
  });
  assert.deepEqual(dates.map((item) => item.date), ['2025-06-02', '2025-06-04', '2025-06-05', '2025-06-06']);
});

test('today only exposes sessions that have not ended in Addis Ababa time', () => {
  const dates = getBookableDates({ now: new Date('2025-06-02T10:00:00.000Z') });
  assert.deepEqual(dates[0], { date: '2025-06-02', openSessions: ['session1'] });

  const afterBothSessions = getBookableDates({ now: new Date('2025-06-02T15:30:00.000Z') });
  assert.equal(afterBothSessions.some((item) => item.date === '2025-06-02'), false);
});

test('calendar does not extend its horizon to replace closed weekend dates', () => {
  const dates = getBookableDates({ now: new Date('2025-06-06T00:00:00.000Z') });
  assert.deepEqual(dates.map((item) => item.date), ['2025-06-06', '2025-06-09', '2025-06-10']);
});

test('display calendar shows 30 dates but enables only open dates in the five-day booking horizon', () => {
  const dates = getCalendarDates({
    now: new Date('2025-06-02T00:00:00.000Z'),
    closedDates: ['2025-06-03'],
    closedWeekdays: [0, 6],
  });
  assert.equal(dates.length, 30);
  assert.deepEqual(dates.slice(0, 5).map((item) => item.bookable), [true, false, true, true, true]);
  assert.equal(dates[5].date, '2025-06-07');
  assert.equal(dates[5].bookable, false);
  assert.equal(dates[29].bookable, false);
  assert.deepEqual(dates[0].openSessions, ['session1', 'session2']);
});
