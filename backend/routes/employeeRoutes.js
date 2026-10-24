const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireRole, requireAnyRole } = require('../middleware/rbacMiddleware');
const {
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
  updateEmployeeStatus,
  updateEmployeeWorkSchedule,
  requestEmployeePasswordReset,
  getEmployeeProfile,
  changeEmployeePassword,
} = require('../controllers/employeeController');
const { requestEmployeeRemoval } = require('../controllers/accountRemovalController');
const {
  createEmployeeMessage,
  getItSupportMessages,
  markItSupportMessagesRead,
  respondToItSupportMessage,
  archiveItSupportMessage,
} = require('../controllers/employeeMessageController');
const {
  getSetupData,
  submitSetupChange,
  reorderServiceRequirements,
} = require('../controllers/registrarSetupController');
const {
  requireEmployeeManager,
  requireAllowedManagementChange,
  requireServiceRequirementManager,
} = require('../middleware/employeeManagementAccess');

const router = express.Router();
const employeePasswordSetupLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password setup attempts. Please wait before trying again.' },
});
router.post('/activate', activateEmployee);
router.post('/first-password', employeePasswordSetupLimit, setInitialEmployeePassword);
router.get('/', authenticateJWT, requireAnyRole(['admin', 'super_admin', 'office_admin', 'registrar']), listEmployees);
router.post('/', authenticateJWT, requireRole('registrar'), createEmployee);
router.post('/:employeeId/password-reset', authenticateJWT, requireRole('registrar'), requestEmployeePasswordReset);
router.put('/password', authenticateJWT, requireRole('employee'), changeEmployeePassword);
router.get('/profile', authenticateJWT, requireRole('employee'), getEmployeeProfile);
router.get('/management/setup-data', authenticateJWT, requireRole('employee'), requireEmployeeManager, getSetupData);
router.post('/management/setup-changes', authenticateJWT, requireRole('employee'), requireEmployeeManager, requireAllowedManagementChange, submitSetupChange);
router.post('/management/requirements/reorder', authenticateJWT, requireRole('employee'), requireEmployeeManager, requireServiceRequirementManager, reorderServiceRequirements);
router.get('/messages', authenticateJWT, requireRole('employee'), getEmployeeMessages);
router.post('/messages', authenticateJWT, requireRole('employee'), createEmployeeMessage);
router.get('/messages/it-support', authenticateJWT, requireRole('employee'), getItSupportMessages);
router.patch('/messages/it-support/read', authenticateJWT, requireRole('employee'), markItSupportMessagesRead);
router.delete('/messages/it-support/:messageId', authenticateJWT, requireRole('employee'), archiveItSupportMessage);
router.patch('/messages/it-support/:messageId', authenticateJWT, requireRole('employee'), respondToItSupportMessage);
router.patch('/messages/read', authenticateJWT, requireRole('employee'), markEmployeeMessagesRead);
router.delete('/messages/:messageId', authenticateJWT, requireRole('employee'), deleteEmployeeMessage);
router.put('/:employeeId', authenticateJWT, requireAnyRole(['admin', 'super_admin']), updateEmployee);
router.post('/:employeeId/approve', authenticateJWT, requireAnyRole(['admin', 'super_admin']), approveEmployee);
router.post('/:employeeId/reject', authenticateJWT, requireAnyRole(['admin', 'super_admin']), rejectEmployee);
router.put('/:employeeId/assign', authenticateJWT, requireAnyRole(['admin', 'super_admin']), assignEmployee);
router.patch('/:employeeId/status', authenticateJWT, requireAnyRole(['admin', 'super_admin']), updateEmployeeStatus);
router.put('/:employeeId/work-schedule', authenticateJWT, requireAnyRole(['admin', 'super_admin']), updateEmployeeWorkSchedule);
router.post('/:employeeId/removal-request', authenticateJWT, requireRole('registrar'), requestEmployeeRemoval);
router.get('/appointments', authenticateJWT, requireRole('employee'), getAssignedBookings);
router.get('/compliments', authenticateJWT, requireRole('employee'), getEmployeeCompliments);
router.post('/appointments/:appointmentId/check-in', authenticateJWT, requireRole('employee'), checkIn);
router.post('/appointments/:appointmentId/start', authenticateJWT, requireRole('employee'), startService);
router.post('/appointments/:appointmentId/delivery', authenticateJWT, requireRole('employee'), submitDelivery);

module.exports = router;
