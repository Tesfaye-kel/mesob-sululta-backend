const express = require('express');
const { requireVerifiedCitizen } = require('../middleware/citizenAuthMiddleware');
const {
  getOptions,
  getAvailability,
  createBooking,
  listMyBookings,
  cancelBooking,
  listCitizenNotifications,
} = require('../controllers/appointmentController');
const { submitDeliveryFeedback, listCitizenFeedback, listCitizenReceipts } = require('../controllers/appointmentManagementController');

const router = express.Router();
router.get('/options', ...requireVerifiedCitizen, getOptions);
router.get('/availability', ...requireVerifiedCitizen, getAvailability);
router.post('/', ...requireVerifiedCitizen, createBooking);
router.get('/mine', ...requireVerifiedCitizen, listMyBookings);
router.get('/notifications/mine', ...requireVerifiedCitizen, listCitizenNotifications);
router.delete('/:bookingId', ...requireVerifiedCitizen, cancelBooking);
router.get('/feedback/mine', ...requireVerifiedCitizen, listCitizenFeedback);
router.post('/feedback', ...requireVerifiedCitizen, submitDeliveryFeedback);
router.get('/receipts/mine', ...requireVerifiedCitizen, listCitizenReceipts);

module.exports = router;
