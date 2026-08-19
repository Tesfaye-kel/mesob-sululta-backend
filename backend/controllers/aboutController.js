const About = require('../models/About');

// ─── Sanitizer helpers ──────────────────────────────────────────
const localizedFields = [
  'mission', 'vision', 'objectives', 'branchIntroduction', 'history',
  'managerMessage', 'managerTitle',
  'storyBadge', 'storyTitle', 'highlightsTitle',
  'missionTitle', 'visionTitle',
  'valuesTitle', 'valuesSubtitle', 'managerMessageTitle',
];

const cleanLocalized = (value) => {
  if (!value || typeof value !== 'object') return undefined;
  const out = {};
  for (const lang of ['en', 'am', 'or']) {
    if (typeof value[lang] === 'string') out[lang] = value[lang].trim();
  }
  return Object.keys(out).length ? out : undefined;
};

// Whitelist + sanitize a payload for the About document.
const sanitizeAboutPayload = (body = {}) => {
  const clean = {};
  for (const field of localizedFields) {
    const v = cleanLocalized(body[field]);
    if (v) clean[field] = v;
  }
  if (typeof body.managerName === 'string') {
    clean.managerName = body.managerName.trim();
  }
  if (typeof body.managerPhoto === 'string') {
    clean.managerPhoto = body.managerPhoto.trim();
  }
  return clean;
};

const cleanSubDoc = (body = {}) => {
  const clean = {};
  if (body.paragraph && typeof body.paragraph === 'object') {
    const p = cleanLocalized(body.paragraph);
    if (p) clean.paragraph = p;
  }
  if (body.title && typeof body.title === 'object') {
    const t = cleanLocalized(body.title);
    if (t) clean.title = t;
  }
  if (body.description && typeof body.description === 'object') {
    const d = cleanLocalized(body.description);
    if (d) clean.description = d;
  }
  if (body.label && typeof body.label === 'object') {
    const l = cleanLocalized(body.label);
    if (l) clean.label = l;
  }
  if (body.icon && typeof body.icon === 'string') clean.icon = body.icon.trim();
  if (body.value && typeof body.value === 'string') clean.value = body.value.trim();
  if (body.order !== undefined) clean.order = Number(body.order) || 0;
  if (body.color && typeof body.color === 'string') clean.color = body.color.trim();
  if (body.isVisible !== undefined) clean.isVisible = Boolean(body.isVisible);
  return clean;
};

// ─── Main document ──────────────────────────────────────────────
const getAbout = async (req, res, next) => {
  try {
    const about = await About.findOne().sort({ createdAt: -1 });
    if (!about) return res.status(404).json({ message: 'About content not found' });
    const result = about.toObject();
    if (req.query.includeHidden !== 'true') {
      result.stats = result.stats.filter(stat => stat.isVisible !== false);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

const upsertAbout = async (req, res, next) => {
  try {
    const clean = sanitizeAboutPayload(req.body);
    const about = await About.findOneAndUpdate({}, clean, {
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

// ─── Manager photo upload ───────────────────────────────────────
const uploadManagerPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const imageUrl = `/uploads/manager/${req.file.filename}`;
    res.json({ imageUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
};

// ─── Story sub-document CRUD ──────────────────────────────────────
const addStory = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.story.push(cleanSubDoc(req.body));
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
    Object.assign(story, cleanSubDoc(req.body));
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
    about.values.push(cleanSubDoc(req.body));
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
    Object.assign(value, cleanSubDoc(req.body));
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
    about.stats.push(cleanSubDoc(req.body));
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
    Object.assign(stat, cleanSubDoc(req.body));
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

// ─── Highlights sub-document CRUD ───────────────────────────────
const addHighlight = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    const clean = {};
    if (req.body.text && typeof req.body.text === 'object') {
      const t = cleanLocalized(req.body.text);
      if (t) clean.text = t;
    }
    if (req.body.order !== undefined) clean.order = Number(req.body.order) || 0;
    about.highlights.push(clean);
    await about.save();
    res.status(201).json(about);
  } catch (err) { next(err); }
};

const updateHighlight = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    const highlight = about.highlights.id(req.params.highlightId);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    if (req.body.text) { const t = cleanLocalized(req.body.text); if (t) highlight.text = t; }
    if (req.body.order !== undefined) highlight.order = Number(req.body.order) || 0;
    await about.save();
    res.json(about);
  } catch (err) { next(err); }
};

const deleteHighlight = async (req, res, next) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About not found' });
    about.highlights.pull({ _id: req.params.highlightId });
    await about.save();
    res.json(about);
  } catch (err) { next(err); }
};

module.exports = {
  getAbout,
  upsertAbout,
  uploadManagerPhoto,
  addStory, updateStory, deleteStory,
  addHighlight, updateHighlight, deleteHighlight,
  addValue, updateValue, deleteValue,
  addStat, updateStat, deleteStat,
};

