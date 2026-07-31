const OrganizationContent = require('../models/OrganizationContent');

// GET /api/organization-content - public
const getOrganizationContent = async (req, res, next) => {
  try {
    let content = await OrganizationContent.findOne().sort({ createdAt: -1 });
    if (!content) {
      content = await OrganizationContent.create({
        leadership: [],
        futureExpansion: { en: '', am: '', or: '' },
        hierarchyTitle: { en: '', am: '', or: '' },
      });
    }
    return res.json(content);
  } catch (err) {
    next(err);
  }
};

// PUT /api/organization-content - admin upsert
const upsertOrganizationContent = async (req, res, next) => {
  try {
    const content = await OrganizationContent.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    return res.json(content);
  } catch (err) {
    next(err);
  }
};

// ─── Leadership sub-document CRUD ────────────────────────────────

const addLeadership = async (req, res, next) => {
  try {
    let content = await OrganizationContent.findOne();
    if (!content) {
      content = await OrganizationContent.create({
        leadership: [],
        futureExpansion: { en: '', am: '', or: '' },
        hierarchyTitle: { en: '', am: '', or: '' },
      });
    }
    content.leadership.push(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
};

const updateLeadership = async (req, res, next) => {
  try {
    const content = await OrganizationContent.findOne();
    if (!content) return res.status(404).json({ message: 'Content not found' });
    const member = content.leadership.id(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Leadership member not found' });
    Object.assign(member, req.body);
    await content.save();
    res.json(content);
  } catch (err) {
    next(err);
  }
};

const deleteLeadership = async (req, res, next) => {
  try {
    const content = await OrganizationContent.findOne();
    if (!content) return res.status(404).json({ message: 'Content not found' });
    content.leadership.pull({ _id: req.params.memberId });
    await content.save();
    res.json(content);
  } catch (err) {
    next(err);
  }
};

// POST /api/organization-content/leadership/upload - upload avatar image
const uploadLeadershipAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const imageUrl = `/uploads/leadership/${req.file.filename}`;
    res.json({ imageUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrganizationContent,
  upsertOrganizationContent,
  addLeadership,
  updateLeadership,
  deleteLeadership,
  uploadLeadershipAvatar,
};