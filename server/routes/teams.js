const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(protect);

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', authorizeRoles('Admin', 'Manager'), teamController.createTeam);
router.put('/:id', authorizeRoles('Admin', 'Manager'), teamController.updateTeam);
router.delete('/:id', authorizeRoles('Admin'), teamController.deleteTeam);

module.exports = router;
