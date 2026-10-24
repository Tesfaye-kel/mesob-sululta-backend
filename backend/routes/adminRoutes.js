const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  getDashboardStats,
  getProfile,
  updateProfile,
  changePassword,
  registerAdmin,
  createRegistrar,
  removeRegistrar,
  resetRegistrarPassword,
  getRegistrars,
  updateRegistrarWorkSchedule,
  updateRegistrar,
  getUsers,
  deleteUser,
} = require('../controllers/adminController');
const { getFeedbackDashboard, updateFeedbackPercentages } = require('../controllers/feedbackController');
const {
  getAppointmentDashboard,
  getAppointmentCapacity,
  exportAppointments,
  getDeliveryApprovals,
  reviewDelivery,
  getActiveCitizens,
  getCitizenHistory,
  getFeedbackInbox,
  archiveFeedbackFromAdminInbox,
  archiveAllFeedbackFromAdminInbox,
  sendComplimentToEmployee,
  respondToFeedback,
} = require('../controllers/appointmentManagementController');
const { listRemovalRequests, reviewRemovalRequest } = require('../controllers/accountRemovalController');
const {
  getAdminEmployeeMessages,
  getUnreadAdminInboxCount,
  getUnreadAdminEmployeeMessageCounts,
  markAdminInboxNotificationsRead,
  respondToEmployeeMessage,
  archiveEmployeeMessageFromAdminInbox,
  archiveAllEmployeeMessagesFromAdminInbox,
} = require('../controllers/employeeMessageController');

// All admin routes require authentication + admin role
router.use(authenticateJWT, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/feedback', getFeedbackDashboard);
router.put('/feedback/percentages', updateFeedbackPercentages);
router.get('/appointments', getAppointmentDashboard);
router.get('/appointments/capacity', getAppointmentCapacity);
router.get('/appointments/export.:format', exportAppointments);
router.get('/service-deliveries/approvals', getDeliveryApprovals);
router.post('/service-deliveries/:deliveryId/review', reviewDelivery);
router.get('/citizens', getActiveCitizens);
router.get('/citizens/history', getCitizenHistory);
router.get('/feedback-inbox', getFeedbackInbox);
router.post('/feedback-inbox/archive-all', archiveAllFeedbackFromAdminInbox);
router.patch('/feedback-inbox/:feedbackId', respondToFeedback);
router.delete('/feedback-inbox/:feedbackId', archiveFeedbackFromAdminInbox);
router.post('/feedback-inbox/:feedbackId/employee-message', sendComplimentToEmployee);
router.get('/feedback-inbox/unread-count', getUnreadAdminInboxCount);
router.get('/employee-messages/unread-counts', getUnreadAdminEmployeeMessageCounts);
router.patch('/feedback-inbox/read', markAdminInboxNotificationsRead);
router.get('/employee-messages', getAdminEmployeeMessages);
router.post('/employee-messages/archive-all', archiveAllEmployeeMessagesFromAdminInbox);
router.patch('/employee-messages/:messageId', respondToEmployeeMessage);
router.delete('/employee-messages/:messageId', archiveEmployeeMessageFromAdminInbox);
router.get('/account-removal-requests', listRemovalRequests);
router.post('/account-removal-requests/:requestId/review', reviewRemovalRequest);
// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/registrars', getRegistrars);
router.post('/registrars', createRegistrar);
router.post('/registrars/:registrarId/remove', removeRegistrar);
router.post('/registrars/:registrarId/reset-password', resetRegistrarPassword);
router.put('/registrars/:registrarId', updateRegistrar);
router.put('/registrars/:registrarId/work-schedule', updateRegistrarWorkSchedule);

// Register new admin (only existing admin can do this)
router.post('/register', registerAdmin);

module.exports = router;