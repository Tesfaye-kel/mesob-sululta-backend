const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
};

module.exports = { authenticateJWT };

