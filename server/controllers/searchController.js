const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({ equipment: [], requests: [] });
    }

    const searchRegex = { $regex: q.trim(), $options: 'i' };

    const [equipment, requests] = await Promise.all([
      Equipment.find({
        $or: [
          { name: searchRegex },
          { serialNumber: searchRegex },
          { category: searchRegex },
          { location: searchRegex },
          { department: searchRegex },
        ],
      })
        .select('name serialNumber category location status')
        .limit(5),

      MaintenanceRequest.find({
        $or: [
          { subject: searchRegex },
          { requestNumber: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate('equipmentId', 'name')
        .populate('assignedToId', 'name')
        .select('requestNumber subject stage priority type scheduledDate equipmentId assignedToId')
        .limit(5),
    ]);

    res.status(200).json({ equipment, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { globalSearch };
