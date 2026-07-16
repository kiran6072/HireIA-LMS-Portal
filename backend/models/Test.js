const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [optionSchema],
    validate: [(v) => v.length >= 2 && v.length <= 6, 'A question needs 2-6 options'],
  },
  correctOptionIndex: { type: Number, required: true },
  marks: { type: Number, default: 1 },
  explanation: { type: String, default: '' },
});

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [questionSchema],
    durationMinutes: { type: Number, required: true, default: 30 },
    questionsPerAttempt: { type: Number, default: 0 }, // 0 = use all questions; else randomly sample N
    passingPercent: { type: Number, default: 40 },
    maxAttempts: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    availableFrom: { type: Date, default: Date.now },
    availableTo: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

testSchema.virtual('totalMarks').get(function () {
  return this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
});
testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Test', testSchema);
