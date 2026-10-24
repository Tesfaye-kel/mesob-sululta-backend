const mongoose = require('mongoose');

const employeeMessageSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    registrarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    authorRole: { type: String, enum: ['employee', 'registrar'], default: 'employee', index: true },
    type: { type: String, enum: ['excuse', 'feedback', 'compliment', 'other'], required: true, index: true },
    recipientCategory: { type: String, enum: ['admin', 'it_support'], default: 'admin', index: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['new', 'responded', 'resolved'], default: 'new', index: true },
    response: { type: String, default: '', trim: true, maxlength: 2000 },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null },
    employeeReadAt: { type: Date, default: null },
    registrarReadAt: { type: Date, default: null },
    employeeDeletedAt: { type: Date, default: null },
    adminArchivedAt: { type: Date, default: null, index: true },
    itSupportArchivedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

employeeMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmployeeMessage', employeeMessageSchema);
