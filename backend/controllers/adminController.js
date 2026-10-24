const crypto = require('crypto');
const User = require('../models/User');
const News = require('../models/News');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Window = require('../models/Window');
const About = require('../models/About');
const Contact = require('../models/Contact');
const ContactMessage = require('../models/ContactMessage');
const Requirement = require('../models/Requirement');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { getFeedbackSummary } = require('./feedbackController');
const { validateRegistrarSchedule, hasOverlappingShifts } = require('../utils/employeeSchedule');
const { getFanHash } = require('../services/citizenIdentityProvider');

// ─── Dashboard Stats ────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      userCount,
      employeeCount,
      orgCount,
      serviceCount,
      windowCount,
      newsCount,
      faqCount,
      testimonialCount,
      contactCount,
      unreadContactCount,
      feedback,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'employee', archivedAt: null }),
      Organization.countDocuments(),
      Service.countDocuments(),
      Window.countDocuments(),
      News.countDocuments(),
      FAQ.countDocuments(),
      Testimonial.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      getFeedbackSummary(),
    ]);

    const recentNews = await News.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category publishedAt isFeatured');

    const recentServices = await Service.find()
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name organization createdAt');

    const recentOrgs = await Organization.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt');

    res.json({
      stats: {
        users: userCount,
        employees: employeeCount,
        organizations: orgCount,
        services: serviceCount,
        windows: windowCount,
        news: newsCount,
        faqs: faqCount,
        testimonials: testimonialCount,
        contactSubmissions: contactCount,
        unreadMessages: unreadContactCount,
        total: userCount + orgCount + serviceCount + windowCount + newsCount + faqCount + testimonialCount,
      },
      feedback,
      recent: {
        news: recentNews,
        services: recentServices,
        organizations: recentOrgs,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Profile Management ─────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user.id },
      });
      if (existing) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }
      updates.email = normalizedEmail;
    }

    try {
      const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.email) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ─── Password Management ────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Auth: Register (admin only) ────────────────────────────────
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'admin' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

const createRegistrar = async (req, res, next) => {
  try {
    const { name, email, password, officeId, officeAssignmentLabel, nationalId, schedule } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanNationalId = typeof nationalId === 'string' ? nationalId.trim() : '';
    const cleanOfficeLabel = typeof officeAssignmentLabel === 'string' ? officeAssignmentLabel.trim() : '';
    const manualOffice = !officeId && cleanOfficeLabel.length >= 2 && cleanOfficeLabel.length <= 120;
    const providedPassword = typeof password === 'string' ? password.trim() : '';
    if (typeof name !== 'string' || name.trim().length < 2 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        !/^\d{12}$/.test(cleanNationalId) ||
        (!mongoose.Types.ObjectId.isValid(String(officeId || '')) && !manualOffice) ||
        (officeId && cleanOfficeLabel) ||
        !validateRegistrarSchedule(schedule) || !schedule.length || hasOverlappingShifts(schedule)) {
      return res.status(400).json({ message: 'Provide a name, valid email, 12-digit National ID, office selection or manual office name, and a non-overlapping weekly schedule.' });
    }
    if (providedPassword && providedPassword.length < 12) {
      return res.status(400).json({ message: 'If you set a password, it must be at least 12 characters.' });
    }
    const office = officeId ? await Organization.findById(officeId).select('_id name').lean() : null;
    if (officeId && !office) return res.status(404).json({ message: 'Office was not found.' });
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    const nationalIdHash = getFanHash(cleanNationalId);
    if (await User.exists({ 'profile.nationalIdHash': nationalIdHash })) {
      return res.status(409).json({ message: 'This National ID is already registered to another staff account.' });
    }
    const initialPassword = providedPassword || crypto.randomBytes(32).toString('hex');
    const registrar = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: initialPassword,
      role: 'registrar',
      status: providedPassword ? 'active' : 'pending',
      createdBy: req.user.id,
      profile: {
        officeId: office?._id || null,
        officeAssignmentLabel: office ? '' : cleanOfficeLabel,
        nationalIdHash,
        nationalIdLastFour: cleanNationalId.slice(-4),
        schedule,
      },
    });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'CREATE_REGISTRAR',
      resourceType: 'User',
      resourceId: String(registrar._id),
      details: {
        officeId: office?._id ? String(office._id) : null,
        officeAssignmentLabel: office ? '' : cleanOfficeLabel,
        shiftCount: schedule.length,
      },
      ipAddress: req.ip || '',
    });
    res.status(201).json({
      message: providedPassword ? 'Registrar account created and activated.' : 'Registrar account created. The registrar must set a new password from the employee login page.',
      registrar: {
        id: registrar._id,
        name: registrar.name,
        email: registrar.email,
        officeId: office?._id || null,
        officeAssignmentLabel: office ? '' : cleanOfficeLabel,
        maskedNationalId: `********${registrar.profile.nationalIdLastFour}`,
        schedule: registrar.profile.schedule,
      },
    });
  } catch (error) {
    next(error);
  }
};

const removeRegistrar = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.registrarId)) {
      return res.status(400).json({ message: 'Invalid registrar identifier.' });
    }
    const registrar = await User.findOne({
      _id: req.params.registrarId,
      role: 'registrar',
      archivedAt: null,
    });

    if (!registrar) {
      return res.status(404).json({ message: 'Registrar account was not found.' });
    }

    registrar.status = 'suspended';
    registrar.archivedAt = new Date();
    registrar.password = crypto.randomBytes(32).toString('hex');
    registrar.resetPasswordToken = null;
    registrar.resetPasswordExpires = null;
    await registrar.save({ validateBeforeSave: false });

    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REMOVE_REGISTRAR',
      resourceType: 'User',
      resourceId: String(registrar._id),
      details: { via: 'admin', archivedAt: registrar.archivedAt },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Registrar account removed and can no longer sign in.' });
  } catch (error) {
    next(error);
  }
};

const resetRegistrarPassword = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.registrarId)) {
      return res.status(400).json({ message: 'Invalid registrar identifier.' });
    }
    const registrar = await User.findOne({
      _id: req.params.registrarId,
      role: 'registrar',
      archivedAt: null,
    });

    if (!registrar) {
      return res.status(404).json({ message: 'Registrar account was not found.' });
    }

    registrar.status = 'pending';
    registrar.password = crypto.randomBytes(32).toString('hex');
    registrar.resetPasswordToken = null;
    registrar.resetPasswordExpires = null;
    registrar.invitationToken = null;
    registrar.invitationExpiresAt = null;
    registrar.invitationUsedAt = null;
    await registrar.save({ validateBeforeSave: false });

    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'RESET_REGISTRAR_PASSWORD',
      resourceType: 'User',
      resourceId: String(registrar._id),
      details: { via: 'admin-direct', status: 'pending' },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Registrar password was cleared. The account is pending a new password setup.' });
  } catch (error) {
    next(error);
  }
};

const getRegistrars = async (req, res, next) => {
  try {
    const registrars = await User.find({ role: 'registrar', archivedAt: null })
      .select('name email status createdAt profile.officeId profile.officeAssignmentLabel profile.nationalIdLastFour profile.schedule')
      .populate('profile.officeId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      registrars: registrars.map((registrar) => ({
        ...registrar,
        maskedNationalId: `********${registrar.profile?.nationalIdLastFour || ''}`,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const updateRegistrarWorkSchedule = async (req, res, next) => {
  try {
    const { schedule } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.registrarId)) {
      return res.status(400).json({ message: 'Invalid registrar identifier.' });
    }
    if (!validateRegistrarSchedule(schedule) || !schedule.length || hasOverlappingShifts(schedule)) {
      return res.status(400).json({ message: 'Provide a non-empty weekly schedule with Morning or Afternoon shifts that do not overlap.' });
    }
    const registrar = await User.findOne({
      _id: req.params.registrarId,
      role: 'registrar',
      archivedAt: null,
    });
    if (!registrar) return res.status(404).json({ message: 'Registrar not found.' });
    registrar.set('profile.schedule', schedule);
    await registrar.save({ validateBeforeSave: false });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_REGISTRAR_WORK_SCHEDULE',
      resourceType: 'User',
      resourceId: String(registrar._id),
      details: { shiftCount: schedule.length },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Registrar weekly work schedule updated.', schedule: registrar.profile.schedule });
  } catch (error) {
    next(error);
  }
};

const updateRegistrar = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.registrarId)) {
      return res.status(400).json({ message: 'Invalid registrar identifier.' });
    }
    const { name, email, officeId, officeAssignmentLabel, schedule } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanOfficeLabel = typeof officeAssignmentLabel === 'string' ? officeAssignmentLabel.trim() : '';
    const manualOffice = !officeId && cleanOfficeLabel.length >= 2 && cleanOfficeLabel.length <= 120;
    if (cleanName.length < 2 || cleanName.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
        (!mongoose.Types.ObjectId.isValid(String(officeId || '')) && !manualOffice) ||
        (officeId && cleanOfficeLabel) ||
        !validateRegistrarSchedule(schedule) || !schedule.length || hasOverlappingShifts(schedule)) {
      return res.status(400).json({ message: 'Provide a valid name, email, office selection or manual office name, and a non-overlapping weekly schedule.' });
    }
    const registrar = await User.findOne({
      _id: req.params.registrarId,
      role: 'registrar',
      archivedAt: null,
    });
    if (!registrar) return res.status(404).json({ message: 'Registrar not found.' });

    const duplicateEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: registrar._id },
    }).select('_id').lean();
    if (duplicateEmail) return res.status(409).json({ message: 'That email address is already in use.' });

    const office = officeId ? await Organization.findById(officeId).select('_id').lean() : null;
    if (officeId && !office) return res.status(404).json({ message: 'Office was not found.' });

    registrar.name = cleanName;
    registrar.email = normalizedEmail;
    registrar.set('profile.officeId', office?._id || null);
    registrar.set('profile.officeAssignmentLabel', office ? '' : cleanOfficeLabel);
    registrar.set('profile.schedule', schedule);
    await registrar.save({ validateBeforeSave: false });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_REGISTRAR',
      resourceType: 'User',
      resourceId: String(registrar._id),
      details: {
        fields: ['name', 'email', 'officeId', 'officeAssignmentLabel', 'schedule'],
        officeId: office?._id ? String(office._id) : null,
        officeAssignmentLabel: office ? '' : cleanOfficeLabel,
        shiftCount: schedule.length,
      },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Registrar details, office assignment, and work schedule updated.' });
  } catch (error) {
    next(error);
  }
};

// ─── User Management ────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ archivedAt: null }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'employee') {
      return res.status(409).json({ message: 'Employee records cannot be deleted. Use suspend or transfer instead.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};