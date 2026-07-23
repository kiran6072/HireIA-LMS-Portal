const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
});

const resourceTypeFor = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'raw';
};

const folderFor = (fieldname) => {
  const map = {
    video: 'hireia/lessons/videos',
    document: 'hireia/lessons/documents',
    avatar: 'hireia/avatars',
    assignmentQuestion: 'hireia/assignments/questions',
    assignmentSubmission: 'hireia/assignments/submissions',
    offerLetter: 'hireia/placements/offer-letters',
    resume: 'hireia/students/resumes',
    thumbnail: 'hireia/courses/thumbnails',
  };
  return map[fieldname] || 'hireia/misc';
};

const ALLOWED_MIME = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
  ],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  any: null,
};

const fileFilterFor = (kind) => (req, file, cb) => {
  const allowed = ALLOWED_MIME[kind];
  if (!allowed || allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error(`Unsupported file type for ${kind}: ${file.mimetype}`), false);
};

const publicIdFor = (file) => {
  const ext = file.originalname.match(/\.[^/.]+$/)?.[0] || '';
  const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
  return `${Date.now()}-${nameWithoutExt}${ext}`;
};

// Uploads a buffer directly to Cloudinary using the official SDK (no third-party glue package)
const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });

const uploadFileToCloudinary = async (file) => {
  const result = await uploadBufferToCloudinary(file.buffer, {
    folder: folderFor(file.fieldname),
    resource_type: resourceTypeFor(file.mimetype),
    public_id: publicIdFor(file),
    use_filename: true,
  });
  // Reshape the file object so existing controllers (which read file.path/.filename/.size) keep working unchanged
  file.path = result.secure_url;
  file.filename = result.public_id;
  file.size = result.bytes;
};

// Wraps a multer (memory storage) middleware so that after multer parses the request,
// any uploaded file(s) get pushed to Cloudinary before the route handler runs.
const withCloudinaryUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (req.file) {
        await uploadFileToCloudinary(req.file);
      }
      if (req.files) {
        const allFiles = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        await Promise.all(allFiles.map(uploadFileToCloudinary));
      }
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

const makeUploader = (kind, limits) => {
  const base = multer({ storage: multer.memoryStorage(), fileFilter: fileFilterFor(kind), limits });
  return {
    single: (fieldName) => withCloudinaryUpload(base.single(fieldName)),
    fields: (fieldsArr) => withCloudinaryUpload(base.fields(fieldsArr)),
  };
};

const uploadVideo = makeUploader('video', { fileSize: 500 * 1024 * 1024 });
const uploadDocument = makeUploader('document', { fileSize: 100 * 1024 * 1024 });
const uploadAny = makeUploader('any', { fileSize: 500 * 1024 * 1024 });
const uploadImage = makeUploader('image', { fileSize: 10 * 1024 * 1024 });

const lessonBaseMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') return fileFilterFor('video')(req, file, cb);
    if (file.fieldname === 'document') return fileFilterFor('document')(req, file, cb);
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  },
  limits: { fileSize: 500 * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

const uploadLesson = withCloudinaryUpload(lessonBaseMulter);

module.exports = { cloudinary, uploadVideo, uploadDocument, uploadAny, uploadImage, uploadLesson };