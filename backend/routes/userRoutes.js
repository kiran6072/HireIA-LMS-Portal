const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/students', userController.getAllStudents);
router.get('/students/:id', userController.getStudent);
router.patch('/students/:id', userController.updateStudent);
router.delete('/students/:id', userController.deleteStudent);
router.patch('/students/:id/toggle-active', userController.toggleStudentActive);

module.exports = router;
