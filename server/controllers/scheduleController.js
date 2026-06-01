const { PreventiveSchedule } = require('../models');

// @desc    Create a new preventive schedule
// @route   POST /api/v1/schedules
// @access  Private
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await PreventiveSchedule.create(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all schedules
// @route   GET /api/v1/schedules
// @access  Private
exports.getSchedules = async (req, res) => {
  try {
    const query = {};
    if (req.query.equipmentId) query.equipmentId = req.query.equipmentId;
    if (req.query.isActive) query.isActive = req.query.isActive === 'true';

    const schedules = await PreventiveSchedule.find(query)
      .populate('equipmentId', 'name status')
      .populate('teamId', 'name')
      .populate('assignedToId', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching schedules' });
  }
};

// @desc    Update a schedule
// @route   PATCH /api/v1/schedules/:id
// @access  Private
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await PreventiveSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/v1/schedules/:id
// @access  Private
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await PreventiveSchedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error deleting schedule' });
  }
};
