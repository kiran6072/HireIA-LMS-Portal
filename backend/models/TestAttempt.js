const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true }, // question _id from Test.questions
    selectedOptionIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // snapshot of the (possibly randomized/subset) questions served for this attempt
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId }],
    answers: [answerSchema],
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    autoSubmitted: { type: Boolean, default: false },
    durationMinutes: { type: Number, required: true },
    totalMarks: { type: Number, default: 0 },
    scoredMarks: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

testAttemptSchema.index({ test: 1, student: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
