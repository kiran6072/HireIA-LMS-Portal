const cloudinary = require('cloudinary').v2;
const cloudinaryStorageModule = require('multer-storage-cloudinary');
const CloudinaryStorage = cloudinaryStorageModule.CloudinaryStorage || cloudinaryStorageModule;
const multer = require('multer');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
});

// Determine resource_type based on mimetype so PDFs/DOCX/ZIP/PPT store correctly as 'raw'
// and videos/images store as 'video'/'image'.
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
  };
  return map[fieldname] || 'hireia/misc';
};

const makeStorage = () =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      console.log('[DEBUG] Cloudinary params() called for:', file.fieldname, file.originalname, file.mimetype);
      return {
        folder: folderFor(file.fieldname),
        resource_type: resourceTypeFor(file.mimetype),
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')}`,
        use_filename: true,
      };
    },
  });

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

const uploadVideo = multer({
  storage: makeStorage(),
  fileFilter: fileFilterFor('video'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const uploadDocument = multer({
  storage: makeStorage(),
  fileFilter: fileFilterFor('document'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const uploadAny = multer({
  storage: makeStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const uploadImage = multer({
  storage: makeStorage(),
  fileFilter: fileFilterFor('image'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadLesson = multer({
  storage: makeStorage(),
  fileFilter: (req, file, cb) => {
    console.log('[DEBUG] uploadLesson fileFilter called for field:', file.fieldname, file.mimetype);
    if (file.fieldname === 'video') return fileFilterFor('video')(req, file, cb);
    if (file.fieldname === 'document') return fileFilterFor('document')(req, file, cb);
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  },
  limits: { fileSize: 500 * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);
module.exports = { cloudinary, uploadVideo, uploadDocument, uploadAny, uploadImage, uploadLesson };