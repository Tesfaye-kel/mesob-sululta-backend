const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.am': { $regex: search, $options: 'i' } },
        { 'title.or': { $regex: search, $options: 'i' } },
      ];
    }

    const announcements = await Announcement.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

const getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create(req.body);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};