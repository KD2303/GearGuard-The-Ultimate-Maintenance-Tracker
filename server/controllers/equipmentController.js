const { Equipment, MaintenanceTeam, TeamMember, MaintenanceRequest } = require('../models');
const NotificationService = require('../services/notificationService');

// Remove empty-string fields so Mongoose type casting/enum validation doesn't fail
const sanitizeBody = (body) => {
  const cleaned = { ...body };
  
  // Clean ObjectIds
  const objectIdFields = ['maintenanceTeamId', 'defaultTechnicianId'];
  objectIdFields.forEach(f => {
    if (cleaned[f] === "" || cleaned[f] === null) delete cleaned[f];
  });

  // Clean Dates
  const dateFields = ['purchaseDate', 'warrantyExpiry'];
  dateFields.forEach(f => {
    if (cleaned[f] === "" || cleaned[f] === null) delete cleaned[f];
  });

  // Clean Enums
  if (cleaned.fuelType === "" || cleaned.fuelType === null) delete cleaned.fuelType;

  return cleaned;
};

// Get all equipment (with optional search filter)
exports.getAllEquipment = async (req, res) => {
  try {
    const query = {};

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { serialNumber: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const equipment = await Equipment.find(query)
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
      .populate('maintenanceTeamId', 'name specialization')
      .populate('defaultTechnicianId', 'name email role')
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
    const { name, serialNumber, category, location } = req.body;

    // Validate required fields explicitly
    if (!name || !serialNumber || !category || !location) {
      return res.status(400).json({
        error: 'Name, serial number, category and location are required fields.',
      });
    }

    const payload = sanitizeBody(req.body);
    
    if (payload.name) payload.name = payload.name.trim();
    if (payload.serialNumber) payload.serialNumber = payload.serialNumber.trim();
    if (payload.location) payload.location = payload.location.trim();
    if (payload.department) payload.department = payload.department.trim();
    if (payload.notes) payload.notes = payload.notes.trim();

    const equipment = await Equipment.create(payload);
    
    const equipmentWithRelations = await Equipment.findById(equipment._id)
      .populate('maintenanceTeamId', 'name specialization')
      .populate('defaultTechnicianId', 'name email role')
      .populate('maintenanceTeam')
      .populate('defaultTechnician');

    // Notify: new equipment or vehicle added
    const io = req.app.get("socketio");
    if (io) {
      const typeLabel = equipment.category?.toLowerCase() === 'vehicle' ? 'vehicle' : 'equipment';
      await NotificationService.sendNotification(io, {
        type: 'system',
        message: `New ${typeLabel} registered: ${equipment.name} (${equipment.serialNumber || equipment.licensePlate || 'No ID'})`,
        priority: 'low'
      });
    }

    res.status(201).json(equipmentWithRelations);
  } catch (error) {
    // Handle Mongoose validation errors with descriptive messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join('. ') });
    }

    // Handle duplicate key errors (e.g. duplicate serialNumber)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        error: `An equipment with this ${field} already exists.`,
      });
    }

    // Handle invalid ObjectId cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: `Invalid value for field: ${error.path}`,
      });
    }

    console.error('createEquipment error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Update equipment
exports.updateEquipment = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);
    const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, payload, { new: true })
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
