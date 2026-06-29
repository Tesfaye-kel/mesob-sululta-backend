// Centralized error handler
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  // Basic Mongoose validation error handling
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: err.errors,
    });
  }

  // Cast errors (e.g., invalid ObjectId)
  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  return res.status(500).json({ message: 'Internal server error' });
};

module.exports = { errorMiddleware };

