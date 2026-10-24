const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Authorization header (****** and attaches req.user
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('status archivedAt role');

    if (!user || user.archivedAt || user.status === 'suspended' || user.status === 'rejected') {
      return res.status(403).json({ message: 'This account is no longer active. Please contact your administrator.' });
    }
    if (user.role === 'employee' && user.status !== 'active') {
      return res.status(403).json({ message: 'Employee account is not active.' });
    }
    if (user.role === 'registrar' && user.status !== 'active') {
      return res.status(403).json({ message: 'Registrar account is not active.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { authenticateJWT };
