/**
 * Global centralized error handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
  // Log error stack to console in development
  console.error(err.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose Duplicate Key (Code 11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const keyName = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate entity conflict. This ${keyName} is already registered.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join('. ');
  }

  // Mongoose Cast Error (e.g., bad ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found. Invalid identifier format.`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized. Invalid authentication signature.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Unauthorized. Authentication token has expired.';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorHandler;
