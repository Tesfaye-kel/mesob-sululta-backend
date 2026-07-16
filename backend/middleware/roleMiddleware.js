// Restricts a route to users with the 'admin' role.
// Must be used AFTER authenticateJWT, since it relies on req.user being set.
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }
  next();
};

module.exports = { requireAdmin };