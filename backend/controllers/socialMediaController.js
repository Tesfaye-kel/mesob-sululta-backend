const SocialMedia = require('../models/SocialMedia');

const normalizePlatform = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'x' || normalized === 'x (twitter)') return 'twitter';
  return normalized;
};

// GET /api/social-media (public - only active)
const getActiveSocialMedia = async (req, res, next) => {
  try {
    const platforms = await SocialMedia.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json(platforms);
  } catch (err) {
    next(err);
  }
};

// GET /api/social-media/all (admin - all)
const getAllSocialMedia = async (req, res, next) => {
  try {
    const platforms = await SocialMedia.find()
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json(platforms);
  } catch (err) {
    next(err);
  }
};

// GET /api/social-media/:id
const getSocialMedia = async (req, res, next) => {
  try {
    const platform = await SocialMedia.findById(req.params.id);
    if (!platform) return res.status(404).json({ message: 'Social media platform not found' });
    res.json(platform);
  } catch (err) {
    next(err);
  }
};

// POST /api/social-media
const createSocialMedia = async (req, res, next) => {
  try {
    const platform = await SocialMedia.create({
      ...req.body,
      platform: normalizePlatform(req.body.platform),
    });
    res.status(201).json(platform);
  } catch (err) {
    next(err);
  }
};

// PUT /api/social-media/:id
const updateSocialMedia = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.platform !== undefined) update.platform = normalizePlatform(update.platform);
    const platform = await SocialMedia.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!platform) return res.status(404).json({ message: 'Social media platform not found' });
    res.json(platform);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/social-media/:id
const deleteSocialMedia = async (req, res, next) => {
  try {
    const platform = await SocialMedia.findByIdAndDelete(req.params.id);
    if (!platform) return res.status(404).json({ message: 'Social media platform not found' });
    res.json({ message: 'Social media platform deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActiveSocialMedia,
  getAllSocialMedia,
  getSocialMedia,
  createSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
};
