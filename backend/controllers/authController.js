'use strict';

const jwt  = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmailNotification } = require('../services/notificationService');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'A user with this email already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (err) { next(err); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    // Only admin users can access the admin panel
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin role required' });
    }

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (err) { next(err); }
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
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
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
    }

    // Always return the reset link so the frontend can display it directly
    // (especially if email delivery fails — GitHub/office LAN often blocks Gmail SMTP)
    res.json({
      message: 'If that email is registered, a reset link has been sent.',
      resetLink,
    });
  } catch (err) { next(err); }
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) return res.status(400).json({ message: 'Reset token is required' });
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
