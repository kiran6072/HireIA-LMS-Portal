const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', testController.getAllTests);
router.get('/:id', testController.getTest);
router.get('/:id/results', restrictTo('admin'), testController.getTestResults);

router.post('/', restrictTo('admin'), testController.createTest);
router.patch('/:id', restrictTo('admin'), testController.updateTest);
router.delete('/:id', restrictTo('admin'), testController.deleteTest);

router.post('/:id/start', restrictTo('student'), testController.startAttempt);
router.post('/attempts/:attemptId/submit', restrictTo('student'), testController.submitAttempt);

module.exports = router;
