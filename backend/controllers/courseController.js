const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { notifyManyUsers } = require('./notificationController');

// GET /api/courses  (admin: all courses; student: published + enrolled)
exports.getAllCourses = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    filter.$or = [{ status: 'published' }, { enrolledStudents: req.user.id }];
  } else if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const courses = await Course.find(filter)
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: courses.length, courses });
});

// GET /api/courses/:id
exports.getCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate('createdBy', 'name email').populate({
    path: 'modules',
    options: { sort: 'order' },
    populate: { path: 'lessons', options: { sort: 'order' } },
  });
  if (!course) return next(new ApiError(404, 'Course not found.'));

  if (req.user.role === 'student') {
    const isEnrolled = course.enrolledStudents.some((id) => id.toString() === req.user.id);
    if (course.status !== 'published' && !isEnrolled) {
      return next(new ApiError(403, 'This course is not available.'));
    }
  }

  let progress = null;
  if (req.user.role === 'student') {
    progress = await Progress.findOne({ student: req.user.id, course: course._id });
  }

  res.status(200).json({ success: true, course, progress });
});

// POST /api/courses  (admin)
exports.createCourse = catchAsync(async (req, res, next) => {
  console.log('[DEBUG] createCourse hit. File:', req.file ? req.file.originalname : 'none');
  const { title, description, category, level, durationWeeks } = req.body;
  if (!title || !description) return next(new ApiError(400, 'Title and description are required.'));

  const course = await Course.create({
    title,
    description,
    category,
    level,
    durationWeeks,
    thumbnailUrl: req.file ? req.file.path : '',
    createdBy: req.user.id,
  });
  console.log('[DEBUG] Course.create() finished successfully.');

  res.status(201).json({ success: true, message: 'Course created successfully.', course });
});

// PATCH /api/courses/:id  (admin)
exports.updateCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const fields = ['title', 'description', 'category', 'level', 'durationWeeks'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) course[f] = req.body[f];
  });
  if (req.file) course.thumbnailUrl = req.file.path;

  await course.save();
  res.status(200).json({ success: true, message: 'Course updated successfully.', course });
});

// DELETE /api/courses/:id  (admin)
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const modules = await Module.find({ course: course._id });
  const moduleIds = modules.map((m) => m._id);
  await Lesson.deleteMany({ module: { $in: moduleIds } });
  await Module.deleteMany({ course: course._id });
  await Progress.deleteMany({ course: course._id });
  await course.deleteOne();

  res.status(200).json({ success: true, message: 'Course and all related content deleted.' });
});

// PATCH /api/courses/:id/publish  (admin)
exports.publishCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  course.status = req.body.status === 'draft' ? 'draft' : 'published';
  if (course.status === 'published') course.publishedAt = new Date();
  await course.save();

  if (course.status === 'published') {
    const students = await User.find({ role: 'student', isActive: true }).select('_id');
    notifyManyUsers({
      recipientIds: students.map((s) => s._id),
      title: 'New Course Published',
      message: `A new course "${course.title}" is now available.`,
      type: 'course',
      link: `/student/courses/${course._id}`,
      createdBy: req.user.id,
    }).catch(() => {});
  }

  res.status(200).json({ success: true, message: `Course ${course.status}.`, course });
});

// POST /api/courses/:id/enroll  (admin enrolls students)
exports.enrollStudents = catchAsync(async (req, res, next) => {
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || !studentIds.length) {
    return next(new ApiError(400, 'studentIds must be a non-empty array.'));
  }
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const newIds = studentIds.filter((id) => !course.enrolledStudents.some((e) => e.toString() === id));
  course.enrolledStudents.push(...newIds);
  await course.save();

  await Promise.all(
    newIds.map((sid) => Progress.findOneAndUpdate({ student: sid, course: course._id }, {}, { upsert: true }))
  );

  notifyManyUsers({
    recipientIds: newIds,
    title: 'Enrolled in a New Course',
    message: `You have been enrolled in "${course.title}".`,
    type: 'course',
    link: `/student/courses/${course._id}`,
    createdBy: req.user.id,
  }).catch(() => {});

  res.status(200).json({ success: true, message: `${newIds.length} student(s) enrolled.`, course });
});

// DELETE /api/courses/:id/enroll/:studentId  (admin unenrolls)
exports.unenrollStudent = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found.'));
  course.enrolledStudents = course.enrolledStudents.filter((id) => id.toString() !== req.params.studentId);
  await course.save();
  res.status(200).json({ success: true, message: 'Student unenrolled.', course });
});
