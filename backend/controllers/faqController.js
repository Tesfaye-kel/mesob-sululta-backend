const FAQ = require('../models/FAQ');

const getFAQs = async (req, res, next) => {
  try {
    const { category, popular, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (popular === 'true') filter.isPopular = true;
    if (search) {
      filter.$or = [
        { 'question.en': { $regex: search, $options: 'i' } },
        { 'question.am': { $regex: search, $options: 'i' } },
        { 'question.or': { $regex: search, $options: 'i' } },
      ];
    }

    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(faqs);
  } catch (err) {
    next(err);
  }
};

const getFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    next(err);
  }
};

const createFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.create(req.body);
    res.status(201).json(faq);
  } catch (err) {
    next(err);
  }
};

const updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    next(err);
  }
};

const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ };