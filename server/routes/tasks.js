const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleTaskCompletion);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
