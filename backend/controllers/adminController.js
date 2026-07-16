const User = require('../models/User');
const Announcement = require('../models/Announcement');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Window = require('../models/Window');
const About = require('../models/About');
const Contact = require('../models/Contact');
const Requirement = require('../models/Requirement');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── Dashboard Stats ────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      userCount,
      orgCount,
      serviceCount,
      windowCount,
      announcementCount,
      faqCount,
      testimonialCount,
      contactCount,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Service.countDocuments(),
      Window.countDocuments(),
      Announcement.countDocuments(),
      FAQ.countDocuments(),
      Testimonial.countDocuments(),
      Contact.countDocuments(),
    ]);

    const recentAnnouncements = await Announcement.find()
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
        organizations: orgCount,
        services: serviceCount,
        windows: windowCount,
        announcements: announcementCount,
        faqs: faqCount,
        testimonials: testimonialCount,
        contactSubmissions: contactCount,
        total: userCount + orgCount + serviceCount + windowCount + announcementCount + faqCount + testimonialCount,
      },
      recent: {
        announcements: recentAnnouncements,
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
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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

// ─── User Management ────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
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
  getUsers,
  deleteUser,
};