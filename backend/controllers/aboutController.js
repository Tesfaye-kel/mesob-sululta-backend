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

// ─── Story sub-document CRUD ──────────────────────────────────────
const addStory = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.story.push(req.body);
    await about.save();
    res.status(201).json(about);
  } catch (err) {
    next(err);
  }
};

const updateStory = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    const story = about.story.id(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    Object.assign(story, req.body);
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

const deleteStory = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.story.pull({ _id: req.params.storyId });
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

// ─── Values sub-document CRUD ─────────────────────────────────────
const addValue = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.values.push(req.body);
    await about.save();
    res.status(201).json(about);
  } catch (err) {
    next(err);
  }
};

const updateValue = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    const value = about.values.id(req.params.valueId);
    if (!value) return res.status(404).json({ message: 'Value not found' });
    Object.assign(value, req.body);
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

const deleteValue = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.values.pull({ _id: req.params.valueId });
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

// ─── Stats sub-document CRUD ──────────────────────────────────────
const addStat = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.stats.push(req.body);
    await about.save();
    res.status(201).json(about);
  } catch (err) {
    next(err);
  }
};

const updateStat = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    const stat = about.stats.id(req.params.statId);
    if (!stat) return res.status(404).json({ message: 'Stat not found' });
    Object.assign(stat, req.body);
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

const deleteStat = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.stats.pull({ _id: req.params.statId });
    await about.save();
    res.json(about);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAbout,
  upsertAbout,
  addStory,
  updateStory,
  deleteStory,
  addValue,
  updateValue,
  deleteValue,
  addStat,
  updateStat,
  deleteStat,
};