const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

router.post('/register', authController.registerStudent);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.use(protect); // everything below requires authentication

router.get('/me', authController.getMe);
router.patch('/update-me', uploadImage.single('avatar'), authController.updateMe);
router.patch('/update-password', authController.updatePassword);

router.post('/admin/register', restrictTo('admin'), authController.registerAdmin);
router.post('/admin/create-student', restrictTo('admin'), authController.adminCreateStudent);

module.exports = router;
