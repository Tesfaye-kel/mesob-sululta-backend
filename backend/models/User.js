const crypto = require('crypto');
const mongoose = require('mongoose');
const { EMPLOYEE_TYPES } = require('../utils/employeeCategories');
const bcrypt = require('bcryptjs');

function base32ToBuffer(base32) {
  const cleaned = (base32 || '').replace(/\s+/g, '').toUpperCase();
  let bits = '';
  const bytes = [];
  for (const char of cleaned) {
    const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, '0');
  }
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(secret, epoch = Date.now(), digits = 6, step = 30) {
  const key = base32ToBuffer(secret);
  let counter = Math.floor(epoch / 1000 / step);
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i -= 1) {
    buffer[i] = counter & 0xff;
    counter = counter >> 8;
  }
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % (10 ** digits);
  return String(otp).padStart(digits, '0');
}

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'staff', 'citizen', 'employee', 'registrar', 'office_admin', 'feedback_officer', 'super_admin'],
      default: 'citizen',
    },
    employeeType: {
      type: String,
      enum: EMPLOYEE_TYPES,
      default: 'service_window_officer',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'active',
    },
    archivedAt: { type: Date, default: null, index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    invitationToken: { type: String, default: null },
    invitationExpiresAt: { type: Date, default: null },
    invitationUsedAt: { type: Date, default: null },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    profile: {
      gender: { type: String, default: '' },
      nationalId: { type: String, default: '' },
      nationalIdHash: { type: String, select: false },
      nationalIdLastFour: { type: String, default: '' },
      officeAssignmentLabel: { type: String, default: '', trim: true, maxlength: 120 },
      address: { type: String, default: '' },
      jobTitle: { type: String, default: '' },
      schedule: [{
        day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        shift: { type: String, trim: true, maxlength: 40 },
        startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
        endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      }],
      officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
      floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null },
      windowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Window', default: null },
      services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ 'profile.nationalIdHash': 1 }, { unique: true, sparse: true });
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    name: 'unique_employee_phone',
    partialFilterExpression: { role: 'employee', phone: { $type: 'string', $gt: '' } },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.requiresMfa = function () {
  return ['staff', 'admin', 'employee', 'registrar', 'office_admin', 'feedback_officer', 'super_admin'].includes(this.role) && !!this.mfaEnabled;
};

userSchema.methods.verifyMfaCode = function (code) {
  if (!this.mfaEnabled || !this.mfaSecret) return true;
  if (!code || !/^\d{6}$/.test(String(code))) return false;
  const expected = generateTotp(this.mfaSecret);
  return expected === String(code).trim();
};

userSchema.statics.generateMfaSecret = function () {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let secret = '';
  for (let i = 0; i < bits.length; i += 5) {
    secret += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  }
  return secret;
};

userSchema.statics.generateTotp = function (secret) {
  return generateTotp(secret);
};

module.exports = mongoose.model('User', userSchema);
