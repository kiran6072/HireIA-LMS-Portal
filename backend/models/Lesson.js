const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['video', 'pdf', 'docx', 'ppt', 'zip', 'notes'],
      required: true,
    },
    order: { type: Number, default: 0 },
    notesContent: { type: String, default: '' }, // rich text for 'notes' type
    fileUrl: { type: String, default: '' },
    filePublicId: { type: String, default: '' },
    fileSizeBytes: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 }, // for video
    isPreview: { type: Boolean, default: false }, // viewable without enrollment
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
