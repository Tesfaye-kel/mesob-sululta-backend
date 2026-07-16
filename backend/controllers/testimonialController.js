const Testimonial = require('../models/Testimonial');

const getTestimonials = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;

    const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    next(err);
  }
};

const getTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(testimonial);
  } catch (err) {
    next(err);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch (err) {
    next(err);
  }
};

const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json(testimonial);
  } catch (err) {
    next(err);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTestimonials, getTestimonial, createTestimonial, updateTestimonial, deleteTestimonial };