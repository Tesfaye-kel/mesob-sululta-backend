const News = require('../models/News');
const path = require('path');
const fs = require('fs');

// GET /api/news
const getNewsList = async (req, res, next) => {
  try {
    const { category, featured, search, published, tag, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (published === 'true') filter.isPublished = true;
    if (published === 'false') filter.isPublished = false;
    if (tag) filter.tags = { $in: [tag] };
    
    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.am': { $regex: search, $options: 'i' } },
        { 'title.or': { $regex: search, $options: 'i' } },
        { 'content.en': { $regex: search, $options: 'i' } },
        { 'content.am': { $regex: search, $options: 'i' } },
        { 'content.or': { $regex: search, $options: 'i' } },
        { 'excerpt.en': { $regex: search, $options: 'i' } },
        { 'tags': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await News.countDocuments(filter);
    const news = await News.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      news,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/related/:id
const getRelatedNews = async (req, res, next) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) return res.status(404).json({ message: 'News not found' });

    const related = await News.find({
      _id: { $ne: newsItem._id },
      isPublished: true,
      $or: [
        { category: newsItem.category },
        { tags: { $in: newsItem.tags } },
      ],
    })
      .sort({ publishedAt: -1 })
      .limit(4)
      .select('title excerpt coverImageUrl publishedAt category');

    res.json(related);
  } catch (err) {
    next(err);
  }
};

// GET /api/news/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await News.distinct('category', { isPublished: true });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// GET /api/news/tags
const getTags = async (req, res, next) => {
  try {
    const tags = await News.distinct('tags', { isPublished: true });
    res.json(tags.filter(t => t));
  } catch (err) {
    next(err);
  }
};

// GET /api/news/:id
const getNewsItem = async (req, res, next) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) return res.status(404).json({ message: 'News not found' });
    res.json(newsItem);
  } catch (err) {
    next(err);
  }
};

// POST /api/news
const createNews = async (req, res, next) => {
  try {
    const newsItem = await News.create(req.body);
    res.status(201).json(newsItem);
  } catch (err) {
    next(err);
  }
};

// PUT /api/news/:id
const updateNews = async (req, res, next) => {
  try {
    const newsItem = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!newsItem) return res.status(404).json({ message: 'News not found' });
    res.json(newsItem);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/news/:id
const deleteNews = async (req, res, next) => {
  try {
    const newsItem = await News.findByIdAndDelete(req.params.id);
    if (!newsItem) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/upload (media upload)
const uploadNewsMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const url = `/uploads/news/${req.file.filename}`;
    res.json({
      url,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/upload-multiple (multiple media upload)
const uploadMultipleMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }
    const files = req.files.map(file => ({
      url: `/uploads/news/${file.filename}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    }));
    res.json({ files });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/news/media/:filename
const deleteMedia = async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', 'news', req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/latest (for frontend notification badge)
const getLatestNews = async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const count = await News.countDocuments({
      isPublished: true,
      publishedAt: { $gte: since },
    });
    
    const latest = await News.findOne({ isPublished: true })
      .sort({ publishedAt: -1 })
      .select('title publishedAt');
    
    res.json({ count, latest });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNewsList,
  getNewsItem,
  getRelatedNews,
  getCategories,
  getTags,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsMedia,
  uploadMultipleMedia,
  deleteMedia,
  getLatestNews,
};
