const Contact = require('../models/Contact');

const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne().sort({ createdAt: -1 });
    if (!contact) return res.status(404).json({ message: 'Contact content not found' });
    return res.json(contact);
  } catch (err) {
    next(err);
  }
};

const upsertContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    return res.json(contact);
  } catch (err) {
    next(err);
  }
};

module.exports = { getContact, upsertContact };
