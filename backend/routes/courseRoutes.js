const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

router.use(protect);

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

router.post('/', restrictTo('admin'), uploadImage.single('thumbnail'), courseController.createCourse);
router.patch('/:id', restrictTo('admin'), uploadImage.single('thumbnail'), courseController.updateCourse);
router.delete('/:id', restrictTo('admin'), courseController.deleteCourse);
router.patch('/:id/publish', restrictTo('admin'), courseController.publishCourse);
router.post('/:id/enroll', restrictTo('admin'), courseController.enrollStudents);
router.delete('/:id/enroll/:studentId', restrictTo('admin'), courseController.unenrollStudent);

router.post('/:courseId/modules', restrictTo('admin'), moduleController.createModule);

module.exports = router;
