const About = require('../models/About');

const getAbout = async (req, res, next) => {
  try {
    const about = await About.findOne().sort({ createdAt: -1 });
    if (!about) return res.status(404).json({ message: 'About content not found' });
    return res.json(about);
  } catch (err) {
    next(err);
  }
};

const upsertAbout = async (req, res, next) => {
  try {
    const about = await About.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    return res.json(about);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAbout, upsertAbout };
