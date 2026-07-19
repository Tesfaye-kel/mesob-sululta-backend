const Gallery = require('../models/Gallery');
const path = require('path');
const fs = require('fs');

const getGalleryItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    const items = await Gallery.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const createGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const uploadGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    res.json({ imageUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadGalleryImage,
};