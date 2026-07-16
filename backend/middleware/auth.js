const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyAuthToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Protect route: verifies JWT (from Authorization header or cookie),
 * attaches the authenticated user to req.user.
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new ApiError(401, 'You are not logged in. Please log in to access this resource.'));
  }

  let decoded;
  try {
    decoded = verifyAuthToken(token);
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired session. Please log in again.'));
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
  }
  if (!currentUser.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated. Contact the administrator.'));
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new ApiError(401, 'Password was recently changed. Please log in again.'));
  }

  req.user = currentUser;
  next();
});

/**
 * Restrict route to given roles: restrictTo('admin'), restrictTo('admin','student'), etc.
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
