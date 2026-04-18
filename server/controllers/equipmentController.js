const { Equipment, MaintenanceTeam, TeamMember, MaintenanceRequest } = require('../models');


// Get all equipment
exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('maintenanceTeam')
      .populate('defaultTechnician')
      .sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single equipment with maintenance count
exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('maintenanceTeam')
      .populate('defaultTechnician');

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const openRequestsCount = await MaintenanceRequest.countDocuments({
      equipmentId: req.params.id,
      stage: { $ne: 'repaired' }
    });

    res.json({ ...equipment.toJSON(), openRequestsCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create equipment
exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    const equipmentWithRelations = await Equipment.findById(equipment._id)
      .populate('maintenanceTeam')
      .populate('defaultTechnician');
    res.status(201).json(equipmentWithRelations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update equipment
exports.updateEquipment = async (req, res) => {
  try {
    const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('maintenanceTeam')
      .populate('defaultTechnician');

    if (!updatedEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(updatedEquipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete equipment
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get equipment maintenance history
exports.getEquipmentMaintenanceHistory = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ equipmentId: req.params.id })
      .populate('assignedTo')
      .populate('team')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
