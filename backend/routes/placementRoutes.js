const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadDocument } = require('../config/cloudinary');

router.use(protect);

router.get('/', placementController.getAllPlacements);
router.get('/stats', restrictTo('admin'), placementController.getPlacementStats);

router.post('/', restrictTo('admin'), uploadDocument.single('offerLetter'), placementController.createPlacement);
router.patch('/:id', restrictTo('admin'), uploadDocument.single('offerLetter'), placementController.updatePlacement);
router.delete('/:id', restrictTo('admin'), placementController.deletePlacement);

module.exports = router;
