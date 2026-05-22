const { TeamMember, MaintenanceTeam } = require('../models');

// Get all team members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .populate('team')
      .sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single member
exports.getMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id).populate('team');
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create member
exports.createMember = async (req, res) => {
  try {
    const member = await TeamMember.create(req.body);
    const memberWithTeam = await TeamMember.findById(member._id).populate('team');
    res.status(201).json(memberWithTeam);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('team');
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await TeamMember.find({ points: { $gt: 0 } })
      .populate('team')
      .sort({ points: -1 })
      .limit(10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
