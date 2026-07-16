const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Certificate = require('../models/Certificate');
const Placement = require('../models/Placement');
const catchAsync = require('../utils/catchAsync');

// GET /api/admin/dashboard
exports.getDashboardSummary = catchAsync(async (req, res) => {
  const [
    totalStudents,
    activeStudents,
    totalCourses,
    publishedCourses,
    totalAssignments,
    pendingGrading,
    totalTests,
    totalAttempts,
    totalCertificates,
    totalPlacements,
    studentsPlaced,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'published' }),
    Assignment.countDocuments(),
    Submission.countDocuments({ status: 'submitted' }),
    Test.countDocuments(),
    TestAttempt.countDocuments({ status: 'completed' }),
    Certificate.countDocuments({ revoked: false }),
    Placement.countDocuments(),
    Placement.distinct('student', { status: { $in: ['offered', 'joined'] } }),
  ]);

  const recentStudents = await User.find({ role: 'student' }).sort('-createdAt').limit(5).select('name email studentId createdAt avatarUrl');
  const recentCourses = await Course.find().sort('-createdAt').limit(5).select('title status createdAt thumbnailUrl');
  const recentPlacements = await Placement.find()
    .sort('-createdAt')
    .limit(5)
    .populate('student', 'name studentId')
    .select('company role salaryLPA status createdAt');

  const recentSubmissions = await Submission.find({ status: 'submitted' })
    .sort('-submittedAt')
    .limit(5)
    .populate('student', 'name studentId')
    .populate('assignment', 'title');

  res.status(200).json({
    success: true,
    summary: {
      totalStudents,
      activeStudents,
      totalCourses,
      publishedCourses,
      totalAssignments,
      pendingGrading,
      totalTests,
      totalAttempts,
      totalCertificates,
      totalPlacements,
      studentsPlacedCount: studentsPlaced.length,
    },
    recentStudents,
    recentCourses,
    recentPlacements,
    recentSubmissions,
  });
});
