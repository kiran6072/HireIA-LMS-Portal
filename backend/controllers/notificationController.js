const Notification = require('../models/Notification');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/sendEmail');

/**
 * Internal helper (used by other controllers) to create a dashboard notification
 * and optionally fire an email. Not exposed directly as a route.
 */
const notifyUser = async ({ recipientId, title, message, type = 'system', link = '', createdBy, sendEmailToo = true }) => {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    link,
    createdBy,
  });

  if (sendEmailToo) {
    const user = await User.findById(recipientId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: `HireIA LMS - ${title}`,
        html: `<h3 style="color:#0B2A5B;">${title}</h3><p>${message}</p>`,
      })
        .then(() => Notification.findByIdAndUpdate(notification._id, { emailSent: true }))
        .catch(() => {});
    }
  }
  return notification;
};

const notifyManyUsers = async ({ recipientIds, title, message, type = 'system', link = '', createdBy, sendEmailToo = true }) => {
  await Promise.all(
    recipientIds.map((id) => notifyUser({ recipientId: id, title, message, type, link, createdBy, sendEmailToo }))
  );
};

// GET /api/notifications  (current user's notifications)
exports.getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id }).sort('-createdAt').limit(100);
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.status(200).json({ success: true, unreadCount, notifications });
});

// PATCH /api/notifications/:id/read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new ApiError(404, 'Notification not found.'));
  res.status(200).json({ success: true, notification });
});

// PATCH /api/notifications/read-all
exports.markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications/:id
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
  if (!notification) return next(new ApiError(404, 'Notification not found.'));
  res.status(200).json({ success: true, message: 'Notification deleted.' });
});

// POST /api/notifications/broadcast (admin only - send to all students or a list)
exports.broadcastNotification = catchAsync(async (req, res, next) => {
  const { title, message, type, link, studentIds } = req.body;
  if (!title || !message) return next(new ApiError(400, 'Title and message are required.'));

  let recipients = studentIds;
  if (!recipients || !recipients.length) {
    const students = await User.find({ role: 'student', isActive: true }).select('_id');
    recipients = students.map((s) => s._id);
  }

  await notifyManyUsers({
    recipientIds: recipients,
    title,
    message,
    type: type || 'system',
    link: link || '',
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, message: `Notification sent to ${recipients.length} student(s).` });
});

module.exports.notifyUser = notifyUser;
module.exports.notifyManyUsers = notifyManyUsers;
