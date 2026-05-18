const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);

router.get('/', requestController.getAllRequests);
router.get('/calendar', requestController.getCalendarEvents);
router.get('/:id', requestController.getRequestById);
router.post('/', requestController.createRequest);
router.put('/:id', requestController.updateRequest);
router.patch('/:id/stage', requestController.updateRequestStage);
router.delete('/:id', authorizeRoles('Admin', 'Manager'), requestController.deleteRequest);

module.exports = router;
