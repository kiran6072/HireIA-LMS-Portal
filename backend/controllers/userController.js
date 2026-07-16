const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// GET /api/users/students  (admin)
exports.getAllStudents = catchAsync(async (req, res) => {
  const filter = { role: 'student' };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { studentId: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.batch) filter.batch = req.query.batch;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const students = await User.find(filter).sort('-createdAt');
  res.status(200).json({ success: true, count: students.length, students });
});

// GET /api/users/students/:id  (admin)
exports.getStudent = catchAsync(async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return next(new ApiError(404, 'Student not found.'));

  const courses = await Course.find({ enrolledStudents: student._id }).select('title status thumbnailUrl');
  const progress = await Progress.find({ student: student._id });

  res.status(200).json({ success: true, student, courses, progress });
});

// PATCH /api/users/students/:id  (admin)
exports.updateStudent = catchAsync(async (req, res, next) => {
  const fields = ['name', 'phone', 'batch', 'course', 'isActive'];
  const updates = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const student = await User.findOneAndUpdate({ _id: req.params.id, role: 'student' }, updates, {
    new: true,
    runValidators: true,
  });
  if (!student) return next(new ApiError(404, 'Student not found.'));

  res.status(200).json({ success: true, message: 'Student updated.', student });
});

// DELETE /api/users/students/:id  (admin)
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
  if (!student) return next(new ApiError(404, 'Student not found.'));

  await Course.updateMany({ enrolledStudents: student._id }, { $pull: { enrolledStudents: student._id } });
  await Progress.deleteMany({ student: student._id });

  res.status(200).json({ success: true, message: 'Student removed.' });
});

// PATCH /api/users/students/:id/toggle-active  (admin)
exports.toggleStudentActive = catchAsync(async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return next(new ApiError(404, 'Student not found.'));
  student.isActive = !student.isActive;
  await student.save();
  res.status(200).json({ success: true, message: `Student ${student.isActive ? 'activated' : 'deactivated'}.`, student });
});
