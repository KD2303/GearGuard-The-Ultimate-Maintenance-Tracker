const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);

router.get('/', memberController.getAllMembers);
router.get('/leaderboard', memberController.getLeaderboard);
router.get('/:id', memberController.getMemberById);
router.post('/', authorizeRoles('Admin', 'Manager'), memberController.createMember);
router.put('/:id', authorizeRoles('Admin', 'Manager'), memberController.updateMember);
router.delete('/:id', authorizeRoles('Admin'), memberController.deleteMember);

module.exports = router;
