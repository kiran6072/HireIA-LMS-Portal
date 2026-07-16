const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadVideo, uploadDocument } = require('../config/cloudinary');

router.use(protect);

router.patch('/:id', restrictTo('admin'), moduleController.updateModule);
router.delete('/:id', restrictTo('admin'), moduleController.deleteModule);

// Lesson creation: accepts either a 'video' or 'document' file field depending on lesson type.
// The frontend sends the file under the field name matching the lesson type category.
const lessonUpload = (req, res, next) => {
  const type = req.body.type;
  if (type === 'video') return uploadVideo.single('video')(req, res, next);
  if (['pdf', 'docx', 'ppt', 'zip'].includes(type)) return uploadDocument.single('document')(req, res, next);
  return next(); // 'notes' type has no file
};

router.post('/:moduleId/lessons', restrictTo('admin'), lessonUpload, lessonController.createLesson);

module.exports = router;
