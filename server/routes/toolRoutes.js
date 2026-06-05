const express = require('express');
const router = express.Router();
const { getAllTools, createTool, updateTool, deleteTool } = require('../controllers/toolController');
const protect = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllTools)
  .post(createTool);

router.route('/:id')
  .put(updateTool)
  .delete(deleteTool);

module.exports = router;
