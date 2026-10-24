'use strict';

const jwt  = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendEmailNotification } = require('../services/notificationService');
const { getFanHash } = require('../services/citizenIdentityProvider');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  return res.status(410).json({ message: 'Password registration is disabled. Citizens must verify using FAN and their registered phone.' });
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Please contact your administrator.' });
    }
    if (user.role === 'employee' && user.status !== 'active') {
      return res.status(403).json({ message: 'Employee account must be approved and activated before sign-in.' });
    }

    if (user.requiresMfa()) {
      if (!mfaCode) {
        return res.status(401).json({ message: 'MFA code is required for this account.' });
      }
      if (!user.verifyMfaCode(mfaCode)) {
        return res.status(401).json({ message: 'Invalid MFA code.' });
      }
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin role required' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (err) { next(err); }
};

const portalLogin = async (req, res, next) => {
  try {
    const { email, password, role, mfaCode } = req.body;
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email or National ID and password are required' });
    }

    const identifier = email.trim();
    const user = (role === 'registrar' || role === 'employee_or_registrar') && /^\d{12}$/.test(identifier)
      ? await User.findOne({ role: 'registrar', 'profile.nationalIdHash': getFanHash(identifier) })
      : await User.findOne({ email: identifier.toLowerCase() });
    if (!user) {
      if (role === 'employee' || role === 'employee_or_registrar') {
        return res.status(404).json({ message: 'Your account is not registered. Please contact the administrator.' });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.archivedAt || user.status === 'suspended' || user.status === 'rejected') {
      return res.status(403).json({ message: 'This account is no longer active. Please contact your administrator.' });
    }
    if (user.role === 'employee' && user.status !== 'active') {
      return res.status(403).json({ message: 'Employee account must be approved and activated before sign-in.' });
    }
    if (user.role === 'registrar' && user.status !== 'active') {
      return res.status(403).json({ message: 'Registrar account must be active before sign-in.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const requestedRoles = role === 'employee_or_registrar'
      ? ['employee', 'registrar']
      : [role || user.role];
    if (!requestedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: role mismatch.' });
    }

    if (user.requiresMfa() && user.role !== 'employee') {
      if (!mfaCode) {
        return res.status(401).json({ message: 'MFA code is required for this account.' });
      }
      if (!user.verifyMfaCode(mfaCode)) {
        return res.status(401).json({ message: 'Invalid MFA code.' });
      }
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        ...(user.role === 'employee' ? {
          employeeType: user.employeeType || 'service_window_officer',
          jobTitle: user.profile?.jobTitle || '',
          maskedNationalId: `********${user.profile?.nationalIdLastFour || ''}`,
          schedule: user.profile?.schedule || [],
          officeAssigned: Boolean(user.profile?.officeId),
          scheduleAssigned: Boolean(user.profile?.schedule?.length),
        } : {}),
        ...(user.role === 'registrar' ? {
          officeId: user.profile?.officeId || null,
          officeAssignmentLabel: user.profile?.officeAssignmentLabel || '',
          maskedNationalId: `********${user.profile?.nationalIdLastFour || ''}`,
          schedule: user.profile?.schedule || [],
        } : {}),
      },
      token: generateToken(user),
    });
  } catch (err) { next(err); }
};

const setInitialPortalPassword = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const nationalId = typeof req.body.nationalId === 'string' ? req.body.nationalId.trim() : '';
    const { password, confirmation } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        !/^\d{12}$/.test(nationalId) ||
        typeof password !== 'string' || password.length < 8 || password.length > 128 || password !== confirmation) {
      return res.status(400).json({ message: 'Enter your work email, 12-digit National ID, and matching passwords of 8–128 characters.' });
    }

    const nationalIdHash = getFanHash(nationalId);
    const user = await User.findOne({
      email,
      role: { $in: ['employee', 'registrar'] },
      archivedAt: null,
      status: { $in: ['pending', 'approved', 'active'] },
    }).select('+profile.nationalIdHash');

    if (!user) {
      return res.status(400).json({ message: 'The account details could not be verified. Check the email and National ID, then contact your administrator.' });
    }

    const storedHash = user.profile?.nationalIdHash || '';
    if (storedHash && storedHash !== nationalIdHash) {
      return res.status(400).json({ message: 'The National ID does not match this staff account.' });
    }

    user.password = password;
    user.status = 'active';
    user.invitationToken = null;
    user.invitationExpiresAt = null;
    user.invitationUsedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    if (user.role === 'employee') {
      await AuditLog.create({
        actorId: user._id,
        actorRole: user.role,
        action: 'SET_EMPLOYEE_FIRST_PASSWORD',
        resourceType: 'User',
        resourceId: String(user._id),
        details: { via: 'portal' },
        ipAddress: req.ip || '',
      });
    } else {
      await AuditLog.create({
        actorId: user._id,
        actorRole: user.role,
        action: 'SET_REGISTRAR_FIRST_PASSWORD',
        resourceType: 'User',
        resourceId: String(user._id),
        details: { via: 'portal' },
        ipAddress: req.ip || '',
      });
    }

    res.json({ message: 'Password set successfully. You can sign in now.' });
  } catch (err) {
    next(err);
  }
};

const updateRegistrarProfile = async (req, res, next) => {
  try {
    const { currentPassword, name, email, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ message: 'Enter your current password to update your account.' });
    }
    if ((name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120)) ||
        (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254)) ||
        (newPassword !== undefined && (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128))) {
      return res.status(400).json({ message: 'Provide a valid name, email, or new password (8–128 characters).' });
    }
    if (name === undefined && email === undefined && newPassword === undefined) {
      return res.status(400).json({ message: 'Provide a name, email, or new password to update.' });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'registrar') return res.status(404).json({ message: 'Registrar account was not found.' });
    if (!await user.comparePassword(currentPassword)) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const changes = [];
    if (name !== undefined && name.trim() !== user.name) {
      user.name = name.trim();
      changes.push('name');
    }
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
          return res.status(409).json({ message: 'That email address is already in use.' });
        }
        user.email = normalizedEmail;
        changes.push('email');
      }
    }
    if (newPassword !== undefined) {
      user.password = newPassword;
      changes.push('password');
    }
    if (!changes.length) return res.status(400).json({ message: 'No account details changed.' });
    await user.save();
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'UPDATE_REGISTRAR_PROFILE',
      resourceType: 'User',
      resourceId: String(user._id),
      details: { fields: changes },
      ipAddress: req.ip || '',
    });
    res.json({
      message: 'Registrar account updated.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officeId: user.profile?.officeId || null,
        officeAssignmentLabel: user.profile?.officeAssignmentLabel || '',
        maskedNationalId: `********${user.profile?.nationalIdLastFour || ''}`,
        schedule: user.profile?.schedule || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { next(err); }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    // Build reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/Admin?resetToken=${token}`;

    // Send email
    const emailResult = await sendEmailNotification({
      to: user.email,
      subject: 'Password Reset — MESOB Sululta Admin',
      message: `You requested a password reset for your MESOB Sululta admin account.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <div style="background: #1A6B3C; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">MESOB Sululta</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Password Reset</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hello,</p>
            <p>You requested a password reset for your MESOB Sululta admin account.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #1A6B3C; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 13px;">This link expires in 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.warn('Password reset email could not be sent:', emailResult.reason || emailResult.error);
      return res.status(503).json({ message: 'We could not send the password reset email. Please try again later.' });
    }

    // Never return the reset token. Password resets must use the link delivered by email.
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: 'A valid reset token is required.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'Password must be 8–128 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: { $in: [tokenHash, token] },
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: user.role === 'employee' ? 'RESET_EMPLOYEE_PASSWORD' : 'RESET_PASSWORD',
      resourceType: 'User',
      resourceId: String(user._id),
      details: { via: 'email' },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, portalLogin, setInitialPortalPassword, getMe, updateRegistrarProfile, forgotPassword, resetPassword };
