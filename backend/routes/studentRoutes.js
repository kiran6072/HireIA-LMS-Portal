const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboardController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('student'));
router.get('/dashboard', studentDashboardController.getDashboardSummary);

module.exports = router;
