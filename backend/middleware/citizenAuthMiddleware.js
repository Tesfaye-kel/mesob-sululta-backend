const mongoose = require('mongoose');
const CitizenIdentity = require('../models/CitizenIdentity');
const { authenticateJWT } = require('./authMiddleware');

const requireVerifiedCitizen = [
  authenticateJWT,
  async (req, res, next) => {
    if (req.user?.role !== 'citizen' || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(403).json({ message: 'Authenticated citizen account required.' });
    }
    try {
      const identity = await CitizenIdentity.exists({ _id: req.user.id, status: 'active', isActive: true });
      if (!identity) return res.status(401).json({ message: 'Citizen account is not active.' });
      req.citizenIdentityId = identity._id;
      next();
    } catch (error) {
      next(error);
    }
  },
];

module.exports = { requireVerifiedCitizen };
