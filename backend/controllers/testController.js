const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { notifyManyUsers } = require('./notificationController');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// GET /api/tests
exports.getAllTests = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  if (req.user.role === 'student') {
    const courses = await Course.find({ enrolledStudents: req.user.id }).select('_id');
    filter.course = { $in: courses.map((c) => c._id) };
    filter.status = 'published';
  }

  const tests = await Test.find(filter).populate('course', 'title').sort('-createdAt');

  let result = tests;
  if (req.user.role === 'student') {
    const attempts = await TestAttempt.find({ student: req.user.id, test: { $in: tests.map((t) => t._id) } });
    result = tests.map((t) => {
      const testAttempts = attempts.filter((a) => a.test.toString() === t._id.toString());
      const obj = t.toObject();
      delete obj.questions; // hide answer key in list view
      return {
        ...obj,
        questionCount: t.questions.length,
        attemptsUsed: testAttempts.filter((a) => a.status === 'completed').length,
        attemptsRemaining: Math.max(0, t.maxAttempts - testAttempts.filter((a) => a.status === 'completed').length),
        bestScorePercent: testAttempts.length ? Math.max(...testAttempts.map((a) => a.percent)) : null,
      };
    });
  }

  res.status(200).json({ success: true, count: result.length, tests: result });
});

// GET /api/tests/:id  (admin: full detail with answer key; student: safe metadata only)
exports.getTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.id).populate('course', 'title');
  if (!test) return next(new ApiError(404, 'Test not found.'));

  if (req.user.role === 'admin') {
    return res.status(200).json({ success: true, test });
  }

  const obj = test.toObject();
  delete obj.questions;
  const attempts = await TestAttempt.find({ student: req.user.id, test: test._id });
  res.status(200).json({
    success: true,
    test: { ...obj, questionCount: test.questions.length },
    attempts,
  });
});

// POST /api/tests  (admin)
exports.createTest = catchAsync(async (req, res, next) => {
  const { title, description, course, questions, durationMinutes, questionsPerAttempt, passingPercent, maxAttempts, availableFrom, availableTo, status } =
    req.body;

  if (!title || !course || !Array.isArray(questions) || !questions.length) {
    return next(new ApiError(400, 'Title, course and at least one question are required.'));
  }
  for (const q of questions) {
    if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
      return next(new ApiError(400, 'Each question needs text and at least 2 options.'));
    }
    if (q.correctOptionIndex === undefined || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
      return next(new ApiError(400, 'Each question needs a valid correctOptionIndex.'));
    }
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) return next(new ApiError(404, 'Course not found.'));

  const test = await Test.create({
    title,
    description,
    course,
    questions,
    durationMinutes: durationMinutes || 30,
    questionsPerAttempt: questionsPerAttempt || 0,
    passingPercent: passingPercent ?? 40,
    maxAttempts: maxAttempts || 1,
    availableFrom,
    availableTo,
    status: status || 'published',
    createdBy: req.user.id,
  });

  if (test.status === 'published') {
    notifyManyUsers({
      recipientIds: courseDoc.enrolledStudents,
      title: 'New Test Available',
      message: `A new test "${test.title}" is now available for "${courseDoc.title}".`,
      type: 'test',
      link: `/student/tests/${test._id}`,
      createdBy: req.user.id,
    }).catch(() => {});
  }

  res.status(201).json({ success: true, message: 'Test created.', test });
});

// PATCH /api/tests/:id  (admin)
exports.updateTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.id);
  if (!test) return next(new ApiError(404, 'Test not found.'));

  const fields = [
    'title',
    'description',
    'questions',
    'durationMinutes',
    'questionsPerAttempt',
    'passingPercent',
    'maxAttempts',
    'availableFrom',
    'availableTo',
    'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) test[f] = req.body[f];
  });
  await test.save();

  res.status(200).json({ success: true, message: 'Test updated.', test });
});

// DELETE /api/tests/:id  (admin)
exports.deleteTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.id);
  if (!test) return next(new ApiError(404, 'Test not found.'));
  await TestAttempt.deleteMany({ test: test._id });
  await test.deleteOne();
  res.status(200).json({ success: true, message: 'Test deleted.' });
});

// POST /api/tests/:id/start  (student) - begins an attempt: serves randomized/subset questions WITHOUT answers
exports.startAttempt = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.id);
  if (!test) return next(new ApiError(404, 'Test not found.'));
  if (test.status !== 'published') return next(new ApiError(403, 'This test is not currently available.'));

  const now = new Date();
  if (test.availableFrom && now < test.availableFrom) return next(new ApiError(403, 'This test is not yet open.'));
  if (test.availableTo && now > test.availableTo) return next(new ApiError(403, 'This test has closed.'));

  const completedCount = await TestAttempt.countDocuments({
    test: test._id,
    student: req.user.id,
    status: 'completed',
  });
  if (completedCount >= test.maxAttempts) {
    return next(new ApiError(403, 'You have used all your attempts for this test.'));
  }

  // Resume an in-progress attempt if one exists
  const existing = await TestAttempt.findOne({ test: test._id, student: req.user.id, status: 'in_progress' });
  if (existing) {
    const elapsedMs = Date.now() - existing.startedAt.getTime();
    const remainingSeconds = Math.max(0, existing.durationMinutes * 60 - Math.floor(elapsedMs / 1000));
    const questions = existing.questionOrder.map((qid) => {
      const q = test.questions.id(qid);
      return { _id: q._id, questionText: q.questionText, options: q.options, marks: q.marks };
    });
    return res.status(200).json({
      success: true,
      resumed: true,
      attemptId: existing._id,
      remainingSeconds,
      questions,
    });
  }

  let pool = test.questions;
  if (test.questionsPerAttempt > 0 && test.questionsPerAttempt < test.questions.length) {
    pool = shuffle(test.questions).slice(0, test.questionsPerAttempt);
  } else {
    pool = shuffle(test.questions);
  }
  const questionOrder = pool.map((q) => q._id);

  const attempt = await TestAttempt.create({
    test: test._id,
    student: req.user.id,
    questionOrder,
    durationMinutes: test.durationMinutes,
    totalMarks: pool.reduce((s, q) => s + (q.marks || 1), 0),
    attemptNumber: completedCount + 1,
  });

  const questions = pool.map((q) => ({ _id: q._id, questionText: q.questionText, options: q.options, marks: q.marks }));

  res.status(201).json({
    success: true,
    resumed: false,
    attemptId: attempt._id,
    remainingSeconds: test.durationMinutes * 60,
    questions,
  });
});

// POST /api/tests/attempts/:attemptId/submit  (student) - grades instantly; also used for auto-submit on timer expiry
exports.submitAttempt = catchAsync(async (req, res, next) => {
  const { answers, autoSubmitted } = req.body; // answers: [{ questionId, selectedOptionIndex }]
  const attempt = await TestAttempt.findById(req.params.attemptId);
  if (!attempt) return next(new ApiError(404, 'Attempt not found.'));
  if (attempt.student.toString() !== req.user.id) return next(new ApiError(403, 'Not your attempt.'));
  if (attempt.status === 'completed') {
    return res.status(200).json({ success: true, message: 'Already submitted.', attempt });
  }

  const test = await Test.findById(attempt.test);
  const answerMap = new Map((answers || []).map((a) => [a.questionId, a.selectedOptionIndex]));

  let scoredMarks = 0;
  const gradedAnswers = attempt.questionOrder.map((qid) => {
    const question = test.questions.id(qid);
    const selectedOptionIndex = answerMap.has(qid.toString()) ? answerMap.get(qid.toString()) : null;
    const isCorrect = selectedOptionIndex !== null && selectedOptionIndex === question.correctOptionIndex;
    const marksAwarded = isCorrect ? question.marks || 1 : 0;
    scoredMarks += marksAwarded;
    return { question: qid, selectedOptionIndex, isCorrect, marksAwarded };
  });

  attempt.answers = gradedAnswers;
  attempt.scoredMarks = scoredMarks;
  attempt.percent = attempt.totalMarks ? Math.round((scoredMarks / attempt.totalMarks) * 10000) / 100 : 0;
  attempt.passed = attempt.percent >= test.passingPercent;
  attempt.status = 'completed';
  attempt.submittedAt = new Date();
  attempt.autoSubmitted = !!autoSubmitted;
  await attempt.save();

  // Instant results with per-question breakdown (correct answers revealed post-submit)
  const review = attempt.questionOrder.map((qid) => {
    const q = test.questions.id(qid);
    const ans = gradedAnswers.find((a) => a.question.toString() === qid.toString());
    return {
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      selectedOptionIndex: ans.selectedOptionIndex,
      isCorrect: ans.isCorrect,
      explanation: q.explanation,
      marks: q.marks,
    };
  });

  res.status(200).json({
    success: true,
    message: attempt.autoSubmitted ? 'Time is up — test auto-submitted.' : 'Test submitted successfully.',
    result: {
      totalMarks: attempt.totalMarks,
      scoredMarks: attempt.scoredMarks,
      percent: attempt.percent,
      passed: attempt.passed,
      passingPercent: test.passingPercent,
    },
    review,
  });
});

// GET /api/tests/:id/results  (admin - all student results for a test)
exports.getTestResults = catchAsync(async (req, res, next) => {
  const attempts = await TestAttempt.find({ test: req.params.id, status: 'completed' })
    .populate('student', 'name email studentId')
    .sort('-percent');
  res.status(200).json({ success: true, count: attempts.length, attempts });
});
