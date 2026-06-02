const ShiftHandover = require('../models/ShiftHandover');

exports.getAllHandovers = async (req, res) => {
  try {
    const handovers = await ShiftHandover.find()
      .populate('submittedBy', 'name email')
      .populate('acknowledgedBy', 'name email')
      .populate({
        path: 'ongoingRepairs',
        select: 'requestNumber subject stage priority',
        populate: {
          path: 'equipment',
          select: 'name status'
        }
      })
      .sort({ shiftDate: -1, createdAt: -1 })
      .limit(50); // Get latest 50

    res.json(handovers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHandover = async (req, res) => {
  try {
    const { shiftType, notes, safetyWarnings, ongoingRepairs } = req.body;

    const newHandover = new ShiftHandover({
      shiftType,
      notes,
      safetyWarnings,
      ongoingRepairs,
      submittedBy: req.user._id
    });

    await newHandover.save();

    const populatedHandover = await ShiftHandover.findById(newHandover._id)
      .populate('submittedBy', 'name email')
      .populate('acknowledgedBy', 'name email')
      .populate({
        path: 'ongoingRepairs',
        select: 'requestNumber subject stage priority',
        populate: {
          path: 'equipment',
          select: 'name status'
        }
      });

    res.status(201).json(populatedHandover);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.acknowledgeHandover = async (req, res) => {
  try {
    const handover = await ShiftHandover.findById(req.params.id);
    if (!handover) {
      return res.status(404).json({ error: 'Handover not found' });
    }

    if (!handover.acknowledgedBy.includes(req.user._id)) {
      handover.acknowledgedBy.push(req.user._id);
      await handover.save();
    }

    const updatedHandover = await ShiftHandover.findById(handover._id)
      .populate('submittedBy', 'name email')
      .populate('acknowledgedBy', 'name email')
      .populate({
        path: 'ongoingRepairs',
        select: 'requestNumber subject stage priority',
        populate: {
          path: 'equipment',
          select: 'name status'
        }
      });

    res.json(updatedHandover);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
