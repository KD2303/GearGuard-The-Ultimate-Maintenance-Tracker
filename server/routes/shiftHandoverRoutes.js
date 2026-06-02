const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shiftHandoverController = require('../controllers/shiftHandoverController');

// All routes require authentication
router.use(auth);

router.get('/', shiftHandoverController.getAllHandovers);
router.post('/', shiftHandoverController.createHandover);
router.post('/:id/acknowledge', shiftHandoverController.acknowledgeHandover);

module.exports = router;
