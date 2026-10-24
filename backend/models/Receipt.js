const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    citizenIdentityId: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenIdentity', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null, index: true },
    windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentBooking', required: true, unique: true },
    serviceDeliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceDelivery', required: true, unique: true },
    deliveryStatus: { type: String, enum: ['DELIVERED'], default: 'DELIVERED' },
    approvalStatus: { type: String, enum: ['APPROVED'], default: 'APPROVED' },
    qrCode: { type: String, default: '' },
    verificationUrl: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
