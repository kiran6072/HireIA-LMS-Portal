const crypto = require('crypto');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { signAuthToken, cookieOptions } = require('../utils/token');
const { sendEmail } = require('../utils/sendEmail');

const buildAuthResponse = (res, user, statusCode, message) => {
  const token = signAuthToken(user._id, user.role);
  res.cookie('jwt', token, cookieOptions());
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: user.toSafeObject(),
  });
};

// POST /api/auth/register  (public self-registration -> always role 'student')
exports.registerStudent = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, course, batch } = req.body;
  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email and password are required.'));
  }
  if (password.length < 8) {
    return next(new ApiError(400, 'Password must be at least 8 characters long.'));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new ApiError(400, 'An account with this email already exists.'));

  const user = await User.create({ name, email, password, phone, course, batch, role: 'student' });

  await sendEmail({
    to: user.email,
    subject: 'Welcome to HireIA LMS',
    html: `<h2 style="color:#0B2A5B;">Welcome, ${user.name}!</h2>
           <p>Your student account has been created successfully.</p>
           <p><b>Student ID:</b> ${user.studentId}</p>
           <p>You can now log in and start exploring your assigned courses.</p>`,
  });

  buildAuthResponse(res, user, 201, 'Registration successful.');
});

// POST /api/auth/admin/create-student (admin-only student creation)
exports.adminCreateStudent = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, course, batch } = req.body;
  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email and password are required.'));
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new ApiError(400, 'An account with this email already exists.'));

  const user = await User.create({ name, email, password, phone, course, batch, role: 'student' });

  await sendEmail({
    to: user.email,
    subject: 'Your HireIA LMS Account Has Been Created',
    html: `<h2 style="color:#0B2A5B;">Hello, ${user.name}!</h2>
           <p>An administrator has created a student account for you on HireIA LMS.</p>
           <p><b>Email:</b> ${user.email}<br/><b>Temporary Password:</b> ${password}</p>
           <p>Please log in and change your password as soon as possible.</p>`,
  });

  res.status(201).json({ success: true, message: 'Student created successfully.', user: user.toSafeObject() });
});

// POST /api/auth/admin/register (create a new admin - restricted to existing admins)
exports.registerAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email and password are required.'));
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new ApiError(400, 'An account with this email already exists.'));

  const user = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ success: true, message: 'Admin created successfully.', user: user.toSafeObject() });
});

// POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password.'));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError(401, 'Incorrect email or password.'));
  }
  if (role && user.role !== role) {
    return next(new ApiError(403, `This account is not registered as ${role}.`));
  }
  if (!user.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated. Contact the administrator.'));
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  buildAuthResponse(res, user, 200, 'Login successful.');
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// PATCH /api/auth/update-me
exports.updateMe = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'avatarUrl', 'batch', 'course'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.file) updates.avatarUrl = req.file.path;

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, message: 'Profile updated.', user: user.toSafeObject() });
});

// PATCH /api/auth/update-password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Current and new password are required.'));
  }
  if (newPassword.length < 8) {
    return next(new ApiError(400, 'New password must be at least 8 characters long.'));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new ApiError(401, 'Current password is incorrect.'));
  }
  user.password = newPassword;
  await user.save();

  buildAuthResponse(res, user, 200, 'Password updated successfully.');
});

// POST /api/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ApiError(400, 'Please provide your email address.'));

  const user = await User.findOne({ email: email.toLowerCase() });
  // Always respond success to avoid leaking which emails are registered
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'HireIA LMS - Password Reset (valid for 15 minutes)',
      html: `<h2 style="color:#0B2A5B;">Password Reset Request</h2>
             <p>Hi ${user.name}, we received a request to reset your password.</p>
             <p><a href="${resetUrl}" style="background:#F57C00;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
             <p>Or copy this link: ${resetUrl}</p>
             <p>This link expires in 15 minutes. If you did not request this, please ignore this email.</p>`,
    });
    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ApiError(500, 'There was an error sending the email. Please try again later.'));
  }
});

// PATCH /api/auth/reset-password/:token
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return next(new ApiError(400, 'Password must be at least 8 characters long.'));
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new ApiError(400, 'Token is invalid or has expired.'));

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'HireIA LMS - Your Password Was Changed',
    html: `<p>Hi ${user.name}, your password was just changed. If this wasn't you, contact support immediately.</p>`,
  });

  buildAuthResponse(res, user, 200, 'Password reset successful.');
});
