const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { cloudinary } = require('../config/cloudinary');

const FILE_TYPES = ['pdf', 'docx', 'ppt', 'zip'];

// POST /api/modules/:moduleId/lessons  (admin) - handles video, document, or notes
exports.createLesson = catchAsync(async (req, res, next) => {
  const module = await Module.findById(req.params.moduleId);
  if (!module) return next(new ApiError(404, 'Module not found.'));

  const { title, type, order, notesContent } = req.body;
  if (!title || !type) return next(new ApiError(400, 'Lesson title and type are required.'));

  const file = req.files?.video?.[0] || req.files?.document?.[0];

  const lessonData = {
    module: module._id,
    course: module.course,
    title,
    type,
    order: order ?? module.lessons.length,
    isPreview: req.body.isPreview === 'true' || req.body.isPreview === true,
  };

  if (type === 'notes') {
    if (!notesContent) return next(new ApiError(400, 'Notes content is required for type "notes".'));
    lessonData.notesContent = notesContent;
  } else if (type === 'video' || FILE_TYPES.includes(type)) {
    if (!file) return next(new ApiError(400, `A file upload is required for lesson type "${type}".`));
    lessonData.fileUrl = file.path;
    lessonData.filePublicId = file.filename;
    lessonData.fileSizeBytes = file.size;
    if (type === 'video' && req.body.durationSeconds) {
      lessonData.durationSeconds = Number(req.body.durationSeconds);
    }
  } else {
    return next(new ApiError(400, 'Invalid lesson type.'));
  }

  const lesson = await Lesson.create(lessonData);
  module.lessons.push(lesson._id);
  await module.save();

  res.status(201).json({ success: true, message: 'Lesson created.', lesson });
});

// PATCH /api/lessons/:id  (admin)
exports.updateLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new ApiError(404, 'Lesson not found.'));

  ['title', 'order', 'isPreview', 'notesContent'].forEach((f) => {
    if (req.body[f] !== undefined) lesson[f] = req.body[f];
  });

  if (req.file) {
    // Replace file: remove old asset from Cloudinary if present
    if (lesson.filePublicId) {
      const resourceType = lesson.type === 'video' ? 'video' : 'raw';
      cloudinary.uploader.destroy(lesson.filePublicId, { resource_type: resourceType }).catch(() => {});
    }
    lesson.fileUrl = req.file.path;
    lesson.filePublicId = req.file.filename;
    lesson.fileSizeBytes = req.file.size;
  }

  await lesson.save();
  res.status(200).json({ success: true, message: 'Lesson updated.', lesson });
});

// DELETE /api/lessons/:id  (admin)
exports.deleteLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new ApiError(404, 'Lesson not found.'));

  if (lesson.filePublicId) {
    const resourceType = lesson.type === 'video' ? 'video' : 'raw';
    cloudinary.uploader.destroy(lesson.filePublicId, { resource_type: resourceType }).catch(() => {});
  }

  await Module.findByIdAndUpdate(lesson.module, { $pull: { lessons: lesson._id } });
  await Progress.updateMany({ course: lesson.course }, { $pull: { completedLessons: lesson._id } });
  await lesson.deleteOne();

  res.status(200).json({ success: true, message: 'Lesson deleted.' });
});

// GET /api/lessons/:id  (student/admin - view a lesson)
exports.getLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new ApiError(404, 'Lesson not found.'));

  if (req.user.role === 'student' && !lesson.isPreview) {
    const course = await Course.findById(lesson.course);
    const isEnrolled = course.enrolledStudents.some((id) => id.toString() === req.user.id);
    if (!isEnrolled) return next(new ApiError(403, 'Enroll in this course to access this lesson.'));
  }

  res.status(200).json({ success: true, lesson });
});

// POST /api/lessons/:id/complete  (student marks a lesson as completed -> updates progress %)
exports.markLessonComplete = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new ApiError(404, 'Lesson not found.'));

  const course = await Course.findById(lesson.course).populate({
    path: 'modules',
    populate: { path: 'lessons', select: '_id' },
  });
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  let progress = await Progress.findOne({ student: req.user.id, course: course._id });
  if (!progress) {
    progress = await Progress.create({ student: req.user.id, course: course._id });
  }

  if (!progress.completedLessons.some((id) => id.toString() === lesson._id.toString())) {
    progress.completedLessons.push(lesson._id);
  }
  progress.percentComplete = totalLessons
    ? Math.round((progress.completedLessons.length / totalLessons) * 100)
    : 0;
  progress.lastAccessedAt = new Date();
  if (progress.percentComplete >= 100 && !progress.completedAt) progress.completedAt = new Date();

  await progress.save();

  res.status(200).json({ success: true, message: 'Progress updated.', progress });
});
