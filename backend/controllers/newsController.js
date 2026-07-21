const News = require('../models/News');
const path = require('path');
const fs = require('fs');

// GET /api/news
const getNewsList = async (req, res, next) => {
  try {
    const { category, featured, search, published } = req.query;
    const filter = {};
    
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (published === 'true') filter.isPublished = true;
    if (published === 'false') filter.isPublished = false;
    
    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.am': { $regex: search, $options: 'i' } },
        { 'title.or': { $regex: search, $options: 'i' } },
        { 'content.en': { $regex: search, $options: 'i' } },
      ];
    }

    const news = await News.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 });
    res.json(news);
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
    res.json({ url, filename: req.file.filename });
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
  createNews,
  updateNews,
  deleteNews,
  uploadNewsMedia,
  getLatestNews,
};