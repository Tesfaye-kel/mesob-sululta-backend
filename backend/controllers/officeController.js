const Office = require('../models/Office');

// POST /api/offices
const createOffice = async (req, res, next) => {
  try {
    const { name, address, phone, email, location, workingHours, description, displayOrder } = req.body;

    const office = await Office.create({
      name,
      address,
      phone,
      email,
      location,
      workingHours,
      description,
      displayOrder: displayOrder ?? 0,
    });

    return res.status(201).json(office);
  } catch (err) {
    next(err);
  }
};

// GET /api/offices
const getAllOffices = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { 'name.en': new RegExp(search, 'i') },
        { 'name.am': new RegExp(search, 'i') },
        { 'name.or': new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const offices = await Office.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    return res.json(offices);
  } catch (err) {
    next(err);
  }
};

// GET /api/offices/:id
const getOfficeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const office = await Office.findById(id);
    if (!office) return res.status(404).json({ message: 'Office not found' });
    return res.json(office);
  } catch (err) {
    next(err);
  }
};

// PUT /api/offices/:id
const updateOffice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, location, workingHours, description, displayOrder } = req.body;

    const office = await Office.findByIdAndUpdate(
      id,
      { name, address, phone, email, location, workingHours, description, displayOrder },
      { new: true, runValidators: true }
    );

    if (!office) return res.status(404).json({ message: 'Office not found' });
    return res.json(office);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/offices/:id
const deleteOffice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const office = await Office.findByIdAndDelete(id);
    if (!office) return res.status(404).json({ message: 'Office not found' });
    return res.json({ message: 'Office deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
};
