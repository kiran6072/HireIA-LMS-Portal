const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    salaryLPA: { type: Number, required: true, min: 0 },
    location: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'joined'],
      default: 'applied',
    },
    driveDate: { type: Date },
    offerLetterUrl: { type: String, default: '' },
    offerLetterPublicId: { type: String, default: '' },
    notes: { type: String, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Placement', placementSchema);
