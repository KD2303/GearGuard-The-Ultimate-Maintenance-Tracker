const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);
router.get('/alerts', adminController.getAlerts);
router.get('/recent-activity', adminController.getRecentActivity);

module.exports = router;
