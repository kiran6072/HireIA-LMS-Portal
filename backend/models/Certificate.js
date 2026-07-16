const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true }, // e.g. HIA-CERT-2026-000123
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentNameSnapshot: { type: String, required: true },
    courseTitleSnapshot: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    grade: { type: String, default: '' }, // e.g. "A", "Distinction"
    pdfUrl: { type: String, required: true },
    pdfPublicId: { type: String, default: '' },
    qrCodeDataUrl: { type: String, default: '' },
    verificationUrl: { type: String, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
