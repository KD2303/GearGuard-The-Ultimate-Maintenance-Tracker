const {
  Equipment,
  MaintenanceTeam,
  TeamMember,
  MaintenanceRequest,
} = require("../models");
const NotificationService = require("../services/notificationService");
const { ErrorHandler, ERROR_TYPES } = require("../utils/errorHandler");
const { asyncHandler } = require("../middleware/errorHandler");

// Remove empty-string fields so Mongoose type casting/enum validation doesn't fail
const sanitizeBody = (body) => {
  const cleaned = { ...body };

  // Clean ObjectIds
  const objectIdFields = ["maintenanceTeamId", "defaultTechnicianId"];
  objectIdFields.forEach((f) => {
    if (cleaned[f] === "" || cleaned[f] === null) delete cleaned[f];
  });

  // Clean Dates
  const dateFields = ["purchaseDate", "warrantyExpiry"];
  dateFields.forEach((f) => {
    if (cleaned[f] === "" || cleaned[f] === null) delete cleaned[f];
  });

  // Clean Enums
  if (cleaned.fuelType === "" || cleaned.fuelType === null)
    delete cleaned.fuelType;

  return cleaned;
};

// Get all equipment (with optional search filter)
exports.getAllEquipment = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { serialNumber: { $regex: req.query.search, $options: "i" } },
      { category: { $regex: req.query.search, $options: "i" } },
      { location: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const equipment = await Equipment.find(query)
    .populate("maintenanceTeam")
    .populate("defaultTechnician")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: equipment.length,
    data: equipment,
  });
});

// Get single equipment with maintenance count
exports.getEquipmentById = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id)
    .populate("maintenanceTeamId", "name specialization")
    .populate("defaultTechnicianId", "name email role")
    .populate("maintenanceTeam")
    .populate("defaultTechnician");

  if (!equipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  const openRequestsCount = await MaintenanceRequest.countDocuments({
    equipmentId: req.params.id,
    stage: { $ne: "repaired" },
  });

  res.status(200).json({
    success: true,
    data: { ...equipment.toJSON(), openRequestsCount },
  });
});

// Create equipment
exports.createEquipment = asyncHandler(async (req, res, next) => {
  const { name, serialNumber, category, location } = req.body;

  // Validate required fields explicitly
  if (!name || !serialNumber || !category || !location) {
    throw new ErrorHandler(
      "Name, serial number, category, and location are required fields.",
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  const payload = sanitizeBody(req.body);

  if (payload.name) payload.name = payload.name.trim();
  if (payload.serialNumber) payload.serialNumber = payload.serialNumber.trim();
  if (payload.location) payload.location = payload.location.trim();
  if (payload.department) payload.department = payload.department.trim();
  if (payload.notes) payload.notes = payload.notes.trim();

  const equipment = await Equipment.create(payload);

  const equipmentWithRelations = await Equipment.findById(equipment._id)
    .populate("maintenanceTeamId", "name specialization")
    .populate("defaultTechnicianId", "name email role")
    .populate("maintenanceTeam")
    .populate("defaultTechnician");

  // Notify: new equipment or vehicle added
  const io = req.app.get("socketio");
  if (io) {
    const typeLabel =
      equipment.category?.toLowerCase() === "vehicle" ? "vehicle" : "equipment";
    await NotificationService.sendNotification(io, {
      type: "system",
      message: `New ${typeLabel} registered: ${equipment.name} (${equipment.serialNumber || equipment.licensePlate || "No ID"})`,
      priority: "low",
    });
  }

  res.status(201).json({
    success: true,
    message: "Equipment created successfully",
    data: equipmentWithRelations,
  });
});

// Update equipment
exports.updateEquipment = asyncHandler(async (req, res, next) => {
  const payload = sanitizeBody(req.body);
  const updatedEquipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    payload,
    { new: true },
  )
    .populate("maintenanceTeam")
    .populate("defaultTechnician");

  if (!updatedEquipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  res.status(200).json({
    success: true,
    message: "Equipment updated successfully",
    data: updatedEquipment,
  });
});

// Delete equipment
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  if (!equipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }
  res.status(200).json({
    success: true,
    message: "Equipment deleted successfully",
  });
});

// Get equipment maintenance history
exports.getEquipmentMaintenanceHistory = asyncHandler(
  async (req, res, next) => {
    const requests = await MaintenanceRequest.find({
      equipmentId: req.params.id,
    })
      .populate("assignedTo")
      .populate("team")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  },
);
