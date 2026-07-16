const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, restrictTo } = require('../middleware/auth');

// Public route - anyone with the certificate ID / QR code can verify, no login required
router.get('/verify/:certificateId', certificateController.verifyCertificate);

router.use(protect);

router.get('/', certificateController.getAllCertificates);
router.get('/eligible/:courseId', restrictTo('admin'), certificateController.getEligibleStudents);
router.post('/generate', restrictTo('admin'), certificateController.generateCertificate);
router.delete('/:id', restrictTo('admin'), certificateController.revokeCertificate);

module.exports = router;
