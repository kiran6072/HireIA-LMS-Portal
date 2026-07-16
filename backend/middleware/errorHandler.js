const ApiError = require('../utils/ApiError');

const handleCastErrorDB = (err) => new ApiError(400, `Invalid ${err.path}: ${err.value}`);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : '';
  return new ApiError(400, `${field} "${value}" already exists. Please use a different value.`);
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new ApiError(400, `Invalid input: ${messages.join('. ')}`);
};

const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again.');
const handleJWTExpired = () => new ApiError(401, 'Your session has expired. Please log in again.');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = err;
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();
  if (err instanceof require('multer').MulterError) {
    error = new ApiError(400, `Upload error: ${err.message}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status || 'error',
    message: error.isOperational ? error.message : 'Something went wrong on the server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
