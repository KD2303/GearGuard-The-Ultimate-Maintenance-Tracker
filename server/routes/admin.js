const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const keyRotationController = require('../controllers/keyRotationController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);
router.use(authorizeRoles('Admin', 'Manager'));

router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);
router.get('/alerts', adminController.getAlerts);
router.get('/recent-activity', adminController.getRecentActivity);

router.get('/key-rotation/status', keyRotationController.getStatus);
router.post('/key-rotation/start', keyRotationController.startRotation);
router.post('/key-rotation/pause', keyRotationController.pauseRotation);
router.post('/key-rotation/resume', keyRotationController.resumeRotation);

module.exports = router;
