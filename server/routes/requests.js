const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', requestController.getAllRequests);
router.get('/calendar', requestController.getCalendarEvents);
router.get('/:id', requestController.getRequestById);
router.post('/', requestController.createRequest);
router.put('/:id', requestController.updateRequest);
router.patch('/:id/stage', requestController.updateRequestStage);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
