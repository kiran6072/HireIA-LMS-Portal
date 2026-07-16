const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadDocument } = require('../config/cloudinary');

router.use(protect);

router.get('/', assignmentController.getAllAssignments);
router.get('/:id', assignmentController.getAssignment);

router.post('/', restrictTo('admin'), uploadDocument.single('questionFile'), assignmentController.createAssignment);
router.patch('/:id', restrictTo('admin'), uploadDocument.single('questionFile'), assignmentController.updateAssignment);
router.delete('/:id', restrictTo('admin'), assignmentController.deleteAssignment);

router.post(
  '/:id/submit',
  restrictTo('student'),
  uploadDocument.single('submissionFile'),
  assignmentController.submitAssignment
);

router.patch('/submissions/:submissionId/grade', restrictTo('admin'), assignmentController.gradeSubmission);

module.exports = router;
