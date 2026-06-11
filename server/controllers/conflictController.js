const SyncConflict = require('../models/SyncConflict');
const MaintenanceRequest = require('../models/MaintenanceRequest');

exports.getConflicts = async (req, res) => {
  try {
    const conflicts = await SyncConflict.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConflictCount = async (req, res) => {
  try {
    const count = await SyncConflict.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolveConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionStrategy, mergedPayload } = req.body;

    const conflict = await SyncConflict.findById(id);
    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });
    if (conflict.status !== 'pending') return res.status(400).json({ error: 'Conflict already resolved' });

    let finalData;

    if (resolutionStrategy === 'accept_client') {
      finalData = conflict.offlinePayload;
    } else if (resolutionStrategy === 'accept_server') {
      // Do nothing to the main document
      finalData = null;
    } else if (resolutionStrategy === 'manual_merge') {
      finalData = mergedPayload;
    } else {
      return res.status(400).json({ error: 'Invalid resolution strategy' });
    }

    if (finalData && conflict.documentModel === 'MaintenanceRequest') {
      await MaintenanceRequest.findByIdAndUpdate(conflict.documentId, finalData, { new: true });
    }

    conflict.status = 'resolved';
    conflict.resolutionStrategy = resolutionStrategy;
    conflict.resolvedBy = req.user._id;
    await conflict.save();

    res.json({ success: true, message: 'Conflict resolved', conflict });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
