const express = require('express');
const router = express.Router();
const conflictController = require('../controllers/conflictController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);
router.use(authorizeRoles('Admin', 'Manager'));

router.get('/', conflictController.getConflicts);
router.get('/count', conflictController.getConflictCount);
router.post('/:id/resolve', conflictController.resolveConflict);

module.exports = router;
