const mongoose = require('mongoose');
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    category: { type: String, default: 'General' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    durationWeeks: { type: Number, default: 4 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

courseSchema.pre('validate', async function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    let base = slugify(this.title);
    let slug = base;
    let i = 1;
    while (await mongoose.models.Course.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${i++}`;
    }
    this.slug = slug;
  }
  next();
});

courseSchema.virtual('studentCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
