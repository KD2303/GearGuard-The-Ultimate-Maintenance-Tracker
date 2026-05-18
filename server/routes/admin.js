const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);
router.use(authorizeRoles('Admin', 'Manager'));

router.get('/metrics', adminController.getMetrics);
router.get('/analytics', adminController.getAnalytics);
router.get('/alerts', adminController.getAlerts);
router.get('/recent-activity', adminController.getRecentActivity);

module.exports = router;
