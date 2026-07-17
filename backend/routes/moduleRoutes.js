const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadLesson } = require('../config/cloudinary');

router.use(protect);

router.patch('/:id', restrictTo('admin'), moduleController.updateModule);
router.delete('/:id', restrictTo('admin'), moduleController.deleteModule);

router.post('/:moduleId/lessons', restrictTo('admin'), uploadLesson, lessonController.createLesson);

module.exports = router;