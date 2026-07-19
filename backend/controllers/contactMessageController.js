const ContactMessage = require('../models/ContactMessage');

const getContactMessages = async (req, res, next) => {
  try {
    const { type, isRead } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (isRead === 'true') filter.isRead = true;
    if (isRead === 'false') filter.isRead = false;

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

const getContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
};

const createContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

const updateContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
};

const deleteContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContactMessages,
  getContactMessage,
  createContactMessage,
  updateContactMessage,
  deleteContactMessage,
  markAsRead,
};