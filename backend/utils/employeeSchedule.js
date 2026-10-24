const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function validateEmployeeSchedule(schedule) {
  if (!Array.isArray(schedule) || schedule.length > 28) return false;
  return schedule.every((item) =>
    item && weekDays.includes(item.day) &&
    typeof item.shift === 'string' && item.shift.trim().length > 0 && item.shift.trim().length <= 40 &&
    typeof item.startTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) &&
    typeof item.endTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) &&
    item.startTime < item.endTime
  );
}

function hasOverlappingShifts(schedule) {
  return Array.isArray(schedule) && schedule.some((shift, index) => schedule.slice(index + 1).some((other) =>
    shift.day === other.day && shift.startTime < other.endTime && shift.endTime > other.startTime
  ));
}

function validateRegistrarSchedule(schedule) {
  return validateEmployeeSchedule(schedule) &&
    schedule.every((shift) => ['Morning', 'Afternoon'].includes(shift.shift));
}

module.exports = { validateEmployeeSchedule, hasOverlappingShifts, validateRegistrarSchedule };
