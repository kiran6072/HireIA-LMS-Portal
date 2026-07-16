const Module = require('../models/Module');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// POST /api/courses/:courseId/modules  (admin)
exports.createModule = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const { title, description, order } = req.body;
  if (!title) return next(new ApiError(400, 'Module title is required.'));

  const module = await Module.create({
    course: course._id,
    title,
    description,
    order: order ?? course.modules.length,
  });

  course.modules.push(module._id);
  await course.save();

  res.status(201).json({ success: true, message: 'Module created.', module });
});

// PATCH /api/modules/:id  (admin)
exports.updateModule = catchAsync(async (req, res, next) => {
  const module = await Module.findById(req.params.id);
  if (!module) return next(new ApiError(404, 'Module not found.'));

  ['title', 'description', 'order'].forEach((f) => {
    if (req.body[f] !== undefined) module[f] = req.body[f];
  });
  await module.save();

  res.status(200).json({ success: true, message: 'Module updated.', module });
});

// DELETE /api/modules/:id  (admin)
exports.deleteModule = catchAsync(async (req, res, next) => {
  const module = await Module.findById(req.params.id);
  if (!module) return next(new ApiError(404, 'Module not found.'));

  await Lesson.deleteMany({ module: module._id });
  await Course.findByIdAndUpdate(module.course, { $pull: { modules: module._id } });
  await module.deleteOne();

  res.status(200).json({ success: true, message: 'Module and its lessons deleted.' });
});
