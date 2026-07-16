const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadVideo, uploadDocument } = require('../config/cloudinary');

router.use(protect);

const lessonUpload = (req, res, next) => {
  const type = req.body.type;
  if (type === 'video') return uploadVideo.single('video')(req, res, next);
  if (['pdf', 'docx', 'ppt', 'zip'].includes(type)) return uploadDocument.single('document')(req, res, next);
  return next();
};

router.get('/:id', lessonController.getLesson);
router.patch('/:id', restrictTo('admin'), lessonUpload, lessonController.updateLesson);
router.delete('/:id', restrictTo('admin'), lessonController.deleteLesson);
router.post('/:id/complete', restrictTo('student'), lessonController.markLessonComplete);

module.exports = router;
