const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { notifyManyUsers, notifyUser } = require('./notificationController');

// GET /api/assignments
exports.getAllAssignments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  if (req.user.role === 'student') {
    const courses = await Course.find({ enrolledStudents: req.user.id }).select('_id');
    filter.course = { $in: courses.map((c) => c._id) };
    filter.status = 'published';
  }

  const assignments = await Assignment.find(filter).populate('course', 'title').sort('-createdAt');

  let result = assignments;
  if (req.user.role === 'student') {
    const submissions = await Submission.find({
      student: req.user.id,
      assignment: { $in: assignments.map((a) => a._id) },
    });
    const subMap = new Map(submissions.map((s) => [s.assignment.toString(), s]));
    result = assignments.map((a) => ({
      ...a.toObject(),
      mySubmission: subMap.get(a._id.toString()) || null,
    }));
  }

  res.status(200).json({ success: true, count: result.length, assignments: result });
});

// GET /api/assignments/:id
exports.getAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'title enrolledStudents');
  if (!assignment) return next(new ApiError(404, 'Assignment not found.'));

  let mySubmission = null;
  if (req.user.role === 'student') {
    mySubmission = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
  }

  let submissions = null;
  if (req.user.role === 'admin') {
    submissions = await Submission.find({ assignment: assignment._id }).populate('student', 'name email studentId');
  }

  res.status(200).json({ success: true, assignment, mySubmission, submissions });
});

// POST /api/assignments  (admin) - upload question file
exports.createAssignment = catchAsync(async (req, res, next) => {
  const { title, description, course, maxMarks, dueDate } = req.body;
  if (!title || !description || !course || !dueDate) {
    return next(new ApiError(400, 'Title, description, course and dueDate are required.'));
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) return next(new ApiError(404, 'Course not found.'));

  const assignment = await Assignment.create({
    title,
    description,
    course,
    maxMarks: maxMarks || 100,
    dueDate,
    questionFileUrl: req.file ? req.file.path : '',
    questionFilePublicId: req.file ? req.file.filename : '',
    createdBy: req.user.id,
  });

  notifyManyUsers({
    recipientIds: courseDoc.enrolledStudents,
    title: 'New Assignment Posted',
    message: `A new assignment "${assignment.title}" has been posted for "${courseDoc.title}". Due ${new Date(
      dueDate
    ).toLocaleDateString()}.`,
    type: 'assignment',
    link: `/student/assignments/${assignment._id}`,
    createdBy: req.user.id,
  }).catch(() => {});

  res.status(201).json({ success: true, message: 'Assignment created.', assignment });
});

// PATCH /api/assignments/:id  (admin)
exports.updateAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ApiError(404, 'Assignment not found.'));

  ['title', 'description', 'maxMarks', 'dueDate', 'status'].forEach((f) => {
    if (req.body[f] !== undefined) assignment[f] = req.body[f];
  });
  if (req.file) {
    assignment.questionFileUrl = req.file.path;
    assignment.questionFilePublicId = req.file.filename;
  }
  await assignment.save();

  res.status(200).json({ success: true, message: 'Assignment updated.', assignment });
});

// DELETE /api/assignments/:id  (admin)
exports.deleteAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ApiError(404, 'Assignment not found.'));
  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();
  res.status(200).json({ success: true, message: 'Assignment deleted.' });
});

// POST /api/assignments/:id/submit  (student) - upload submission file
exports.submitAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ApiError(404, 'Assignment not found.'));
  if (!req.file) return next(new ApiError(400, 'A submission file is required.'));

  const isLate = new Date() > new Date(assignment.dueDate);

  let submission = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
  if (submission) {
    submission.submissionFileUrl = req.file.path;
    submission.submissionFilePublicId = req.file.filename;
    submission.submittedAt = new Date();
    submission.isLate = isLate;
    submission.status = 'submitted';
    submission.grade = null;
    submission.feedback = '';
    await submission.save();
  } else {
    submission = await Submission.create({
      assignment: assignment._id,
      student: req.user.id,
      submissionFileUrl: req.file.path,
      submissionFilePublicId: req.file.filename,
      isLate,
    });
  }

  res.status(201).json({ success: true, message: 'Assignment submitted successfully.', submission });
});

// PATCH /api/assignments/submissions/:submissionId/grade  (admin) - grade + feedback
exports.gradeSubmission = catchAsync(async (req, res, next) => {
  const { grade, feedback, requestResubmit } = req.body;
  const submission = await Submission.findById(req.params.submissionId).populate('assignment');
  if (!submission) return next(new ApiError(404, 'Submission not found.'));

  if (requestResubmit) {
    submission.status = 'resubmit_requested';
  } else {
    if (grade === undefined || grade === null) return next(new ApiError(400, 'Grade is required.'));
    submission.grade = grade;
    submission.status = 'graded';
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();
  }
  submission.feedback = feedback || submission.feedback;
  await submission.save();

  notifyUser({
    recipientId: submission.student,
    title: requestResubmit ? 'Resubmission Requested' : 'Assignment Graded',
    message: requestResubmit
      ? `Please resubmit your assignment "${submission.assignment.title}". Feedback: ${feedback || 'See details.'}`
      : `Your assignment "${submission.assignment.title}" was graded: ${grade}/${submission.assignment.maxMarks}.`,
    type: 'grade',
    link: `/student/assignments/${submission.assignment._id}`,
    createdBy: req.user.id,
  }).catch(() => {});

  res.status(200).json({ success: true, message: 'Submission updated.', submission });
});
