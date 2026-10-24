const express = require('express');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/authMiddleware');
const {
  createRegistrarMessage,
  getRegistrarMessages,
} = require('../controllers/employeeMessageController');

const router = express.Router();

const requireRegistrar = async (req, res, next) => {
  try {
    if (req.user?.role !== 'registrar') {
      return res.status(403).json({ message: 'Registrar access required.' });
    }
    const user = await User.exists({
      _id: req.user.id,
      role: 'registrar',
      status: 'active',
      archivedAt: null,
    });
    if (!user) return res.status(403).json({ message: 'This registrar account is not active.' });
    next();
  } catch (error) {
    next(error);
  }
};

router.use(authenticateJWT, requireRegistrar);
router.get('/messages', getRegistrarMessages);
router.post('/messages', createRegistrarMessage);

module.exports = router;
