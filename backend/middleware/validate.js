const ApiError = require('../utils/ApiError');

/**
 * Generic body-field validator middleware factory.
 * Usage: validate(['email', 'password'])
 */
const validate = (requiredFields = []) => (req, res, next) => {
  const missing = requiredFields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });
  if (missing.length) {
    return next(new ApiError(400, `Missing required field(s): ${missing.join(', ')}`));
  }
  next();
};

module.exports = validate;
