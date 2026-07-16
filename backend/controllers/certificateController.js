const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const {
  generateCertificateId,
  generateCertificatePdfBuffer,
  uploadPdfBufferToCloudinary,
} = require('../utils/generateCertificate');
const { notifyUser } = require('./notificationController');

// GET /api/certificates  (admin: all; student: own)
exports.getAllCertificates = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user.id;
  if (req.query.course) filter.course = req.query.course;

  const certificates = await Certificate.find(filter)
    .populate('student', 'name email studentId')
    .populate('course', 'title')
    .sort('-issueDate');

  res.status(200).json({ success: true, count: certificates.length, certificates });
});

// POST /api/certificates/generate  (admin) - generates PDF, QR, uploads, stores record
exports.generateCertificate = catchAsync(async (req, res, next) => {
  const { studentId, courseId, grade } = req.body;
  if (!studentId || !courseId) return next(new ApiError(400, 'studentId and courseId are required.'));

  const student = await User.findById(studentId);
  const course = await Course.findById(courseId);
  if (!student || student.role !== 'student') return next(new ApiError(404, 'Student not found.'));
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const existing = await Certificate.findOne({ student: studentId, course: courseId, revoked: false });
  if (existing) return next(new ApiError(400, 'A certificate for this student and course already exists.'));

  const certificateId = generateCertificateId();
  const verificationUrl = `${process.env.CLIENT_URL}/verify-certificate/${certificateId}`;

  const { buffer, qrDataUrl } = await generateCertificatePdfBuffer({
    studentName: student.name,
    courseTitle: course.title,
    certificateId,
    issueDate: new Date(),
    grade,
    verificationUrl,
  });

  const uploadResult = await uploadPdfBufferToCloudinary(buffer, `certificate-${certificateId}`);

  const certificate = await Certificate.create({
    certificateId,
    student: studentId,
    course: courseId,
    studentNameSnapshot: student.name,
    courseTitleSnapshot: course.title,
    grade: grade || '',
    pdfUrl: uploadResult.secure_url,
    pdfPublicId: uploadResult.public_id,
    qrCodeDataUrl: qrDataUrl,
    verificationUrl,
    issuedBy: req.user.id,
  });

  notifyUser({
    recipientId: studentId,
    title: 'Certificate Issued',
    message: `Your certificate for completing "${course.title}" is ready to download.`,
    type: 'certificate',
    link: `/student/certificates`,
    createdBy: req.user.id,
  }).catch(() => {});

  res.status(201).json({ success: true, message: 'Certificate generated successfully.', certificate });
});

// GET /api/certificates/verify/:certificateId  (PUBLIC - no auth) - QR scan target
exports.verifyCertificate = catchAsync(async (req, res, next) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('course', 'title category level')
    .populate('student', 'name studentId');

  if (!certificate || certificate.revoked) {
    return res.status(404).json({ success: false, valid: false, message: 'Certificate not found or has been revoked.' });
  }

  res.status(200).json({
    success: true,
    valid: true,
    certificate: {
      certificateId: certificate.certificateId,
      studentName: certificate.studentNameSnapshot,
      courseTitle: certificate.courseTitleSnapshot,
      issueDate: certificate.issueDate,
      grade: certificate.grade,
      pdfUrl: certificate.pdfUrl,
    },
  });
});

// DELETE /api/certificates/:id  (admin) - revoke
exports.revokeCertificate = catchAsync(async (req, res, next) => {
  const certificate = await Certificate.findById(req.params.id);
  if (!certificate) return next(new ApiError(404, 'Certificate not found.'));
  certificate.revoked = true;
  await certificate.save();
  res.status(200).json({ success: true, message: 'Certificate revoked.' });
});

// GET /api/certificates/eligible/:courseId  (admin) - students who completed the course but have no certificate yet
exports.getEligibleStudents = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError(404, 'Course not found.'));

  const completedProgress = await Progress.find({ course: course._id, percentComplete: 100 }).populate(
    'student',
    'name email studentId'
  );
  const existingCerts = await Certificate.find({ course: course._id, revoked: false }).select('student');
  const certifiedIds = new Set(existingCerts.map((c) => c.student.toString()));

  const eligible = completedProgress
    .filter((p) => p.student && !certifiedIds.has(p.student._id.toString()))
    .map((p) => p.student);

  res.status(200).json({ success: true, count: eligible.length, students: eligible });
});
