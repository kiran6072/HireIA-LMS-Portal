const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Certificate = require('../models/Certificate');
const Placement = require('../models/Placement');
const catchAsync = require('../utils/catchAsync');

// GET /api/student/dashboard
exports.getDashboardSummary = catchAsync(async (req, res) => {
  const studentId = req.user.id;

  const courses = await Course.find({ enrolledStudents: studentId }).select('title thumbnailUrl status modules');
  const progressRecords = await Progress.find({ student: studentId, course: { $in: courses.map((c) => c._id) } });
  const progressMap = new Map(progressRecords.map((p) => [p.course.toString(), p]));

  const coursesWithProgress = courses.map((c) => ({
    _id: c._id,
    title: c.title,
    thumbnailUrl: c.thumbnailUrl,
    percentComplete: progressMap.get(c._id.toString())?.percentComplete || 0,
  }));

  const avgProgress = coursesWithProgress.length
    ? Math.round(coursesWithProgress.reduce((s, c) => s + c.percentComplete, 0) / coursesWithProgress.length)
    : 0;

  const assignments = await Assignment.find({ course: { $in: courses.map((c) => c._id) }, status: 'published' });
  const submissions = await Submission.find({ student: studentId, assignment: { $in: assignments.map((a) => a._id) } });
  const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));
  const pendingAssignments = assignments.filter((a) => !submittedIds.has(a._id.toString()) && new Date(a.dueDate) >= new Date());

  const tests = await Test.find({ course: { $in: courses.map((c) => c._id) }, status: 'published' });
  const attempts = await TestAttempt.find({ student: studentId, test: { $in: tests.map((t) => t._id) }, status: 'completed' });
  const attemptedTestIds = new Set(attempts.map((a) => a.test.toString()));
  const upcomingTests = tests.filter((t) => !attemptedTestIds.has(t._id.toString()));

  const certificates = await Certificate.countDocuments({ student: studentId, revoked: false });
  const placements = await Placement.find({ student: studentId }).sort('-createdAt').limit(5);

  res.status(200).json({
    success: true,
    summary: {
      enrolledCourses: courses.length,
      avgProgress,
      pendingAssignments: pendingAssignments.length,
      upcomingTests: upcomingTests.length,
      certificatesEarned: certificates,
      activePlacements: placements.length,
    },
    coursesWithProgress,
    pendingAssignments: pendingAssignments.slice(0, 5),
    upcomingTests: upcomingTests.slice(0, 5),
    recentPlacements: placements,
  });
});
