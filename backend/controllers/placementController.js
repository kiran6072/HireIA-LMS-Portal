const Placement = require('../models/Placement');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('./notificationController');

// GET /api/placements  (admin: all; student: own)
exports.getAllPlacements = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user.id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.company) filter.company = { $regex: req.query.company, $options: 'i' };

  const placements = await Placement.find(filter)
    .populate('student', 'name email studentId batch')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: placements.length, placements });
});

// GET /api/placements/stats  (admin - placement dashboard aggregate metrics)
exports.getPlacementStats = catchAsync(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const placements = await Placement.find();

  const placedStudentIds = new Set(
    placements.filter((p) => p.status === 'joined' || p.status === 'offered').map((p) => p.student.toString())
  );

  const byStatus = placements.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const joined = placements.filter((p) => p.status === 'joined');
  const avgSalary = joined.length ? joined.reduce((s, p) => s + p.salaryLPA, 0) / joined.length : 0;
  const highestSalary = joined.length ? Math.max(...joined.map((p) => p.salaryLPA)) : 0;

  const byCompany = {};
  placements.forEach((p) => {
    byCompany[p.company] = (byCompany[p.company] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      studentsPlaced: placedStudentIds.size,
      placementRate: totalStudents ? Math.round((placedStudentIds.size / totalStudents) * 100) : 0,
      totalDrives: placements.length,
      byStatus,
      avgSalaryLPA: Math.round(avgSalary * 100) / 100,
      highestSalaryLPA: highestSalary,
      topCompanies: Object.entries(byCompany)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([company, count]) => ({ company, count })),
    },
  });
});

// POST /api/placements  (admin)
exports.createPlacement = catchAsync(async (req, res, next) => {
  const { studentId, company, role, salaryLPA, location, status, driveDate, notes } = req.body;
  if (!studentId || !company || !role || salaryLPA === undefined) {
    return next(new ApiError(400, 'studentId, company, role and salaryLPA are required.'));
  }
  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') return next(new ApiError(404, 'Student not found.'));

  const placement = await Placement.create({
    student: studentId,
    company,
    role,
    salaryLPA,
    location,
    status: status || 'applied',
    driveDate,
    notes,
    offerLetterUrl: req.file ? req.file.path : '',
    offerLetterPublicId: req.file ? req.file.filename : '',
    postedBy: req.user.id,
  });

  notifyUser({
    recipientId: studentId,
    title: 'New Placement Opportunity',
    message: `You've been added to the placement drive for ${role} at ${company}.`,
    type: 'placement',
    link: `/student/placements`,
    createdBy: req.user.id,
  }).catch(() => {});

  res.status(201).json({ success: true, message: 'Placement record created.', placement });
});

// PATCH /api/placements/:id  (admin) - update status/details, optionally upload offer letter
exports.updatePlacement = catchAsync(async (req, res, next) => {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return next(new ApiError(404, 'Placement not found.'));

  const prevStatus = placement.status;
  ['company', 'role', 'salaryLPA', 'location', 'status', 'driveDate', 'notes'].forEach((f) => {
    if (req.body[f] !== undefined) placement[f] = req.body[f];
  });
  if (req.file) {
    placement.offerLetterUrl = req.file.path;
    placement.offerLetterPublicId = req.file.filename;
  }
  await placement.save();

  if (req.body.status && req.body.status !== prevStatus) {
    notifyUser({
      recipientId: placement.student,
      title: 'Placement Status Updated',
      message: `Your application status for ${placement.role} at ${placement.company} is now "${placement.status.replace(
        '_',
        ' '
      )}".`,
      type: 'placement',
      link: `/student/placements`,
      createdBy: req.user.id,
    }).catch(() => {});
  }

  res.status(200).json({ success: true, message: 'Placement updated.', placement });
});

// DELETE /api/placements/:id  (admin)
exports.deletePlacement = catchAsync(async (req, res, next) => {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return next(new ApiError(404, 'Placement not found.'));
  await placement.deleteOne();
  res.status(200).json({ success: true, message: 'Placement record deleted.' });
});
