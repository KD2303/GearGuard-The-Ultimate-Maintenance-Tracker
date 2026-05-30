const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(createSchedule)
  .get(getSchedules);

router.route('/:id')
  .patch(updateSchedule)
  .delete(deleteSchedule);

module.exports = router;
