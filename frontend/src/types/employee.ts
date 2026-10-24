export const employeeTypes = [
  'service_window_officer',
  'security_guard',
  'floor_window_manager',
  'receptionist',
  'it_support_officer',
  'service_requirement_manager',
] as const

export type EmployeeType = (typeof employeeTypes)[number]
