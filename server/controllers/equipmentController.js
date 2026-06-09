const {
  Equipment,
  MaintenanceTeam,
  TeamMember,
  MaintenanceRequest,
} = require("../models");
const NotificationService = require("../services/notificationService");
const { auditLog } = require("../utils/auditLogger");
const { ErrorHandler, ERROR_TYPES } = require("../utils/errorHandler");
const { asyncHandler } = require("../middleware/errorHandler");
const escapeRegex = require("../utils/escapeRegex");

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
    const safeSearch = escapeRegex(req.query.search);
    query.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { serialNumber: { $regex: safeSearch, $options: "i" } },
      { category: { $regex: safeSearch, $options: "i" } },
      { location: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const equipment = await Equipment.find(query)
    .populate("maintenanceTeam")
    .populate("defaultTechnician")
    .sort({ createdAt: -1 });

  // Enterprise Aggregation to avoid N+1 query loop!
  const openCounts = await MaintenanceRequest.aggregate([
    { $match: { stage: { $nin: ['repaired', 'scrap'] } } },
    { $group: { _id: '$equipmentId', count: { $sum: 1 } } }
  ]);

  const countsMap = new Map(
    openCounts.map((c) => [c._id ? c._id.toString() : '', c.count])
  );

  const data = equipment.map((item) => {
    const openRequestsCount = countsMap.get(item._id.toString()) || 0;
    return {
      ...item.toJSON(),
      openRequestsCount
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    data: data,
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
    stage: { $nin: ["repaired", "scrap"] },
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

  payload.history = [{
    eventType: payload.purchaseDate ? 'PURCHASED' : 'CREATED',
    description: `Equipment registered${payload.purchaseDate ? ' with purchase date' : ''}.`,
    userId: req.user?._id,
    userName: req.user?.name || "System"
  }];

  const equipment = await Equipment.create(payload);

  const equipmentWithRelations = await Equipment.findById(equipment._id)
    .populate("maintenanceTeamId", "name specialization")
    .populate("defaultTechnicianId", "name email role")
    .populate("maintenanceTeam")
    .populate("defaultTechnician");

  await auditLog({
    entityType: 'Equipment',
    entityId: equipment._id,
    action: 'CREATE',
    userId: req.user?._id,
    userName: req.user?.name || ""
  });

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
  const oldDoc = await Equipment.findById(req.params.id);
  let pushHistoryQuery = {};
  if (payload.status && payload.status !== oldDoc.status) {
    pushHistoryQuery = {
      $push: {
        history: {
          eventType: 'STATUS_CHANGE',
          description: `Status manually changed from ${oldDoc.status} to ${payload.status}`,
          date: new Date(),
          recordedBy: req.user?._id,
          notes: 'Status updated manually via equipment edit'
        }
      }
    };
  }
  
  if (!oldDoc) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  const historyEvents = [];
  if (payload.status && payload.status !== oldDoc.status) {
    historyEvents.push({
      eventType: payload.status === 'scrapped' ? 'SCRAPPED' : 'STATUS_CHANGE',
      description: `Status changed from ${oldDoc.status} to ${payload.status}`,
      date: new Date(),
      recordedBy: req.user?._id,
      notes: 'Status updated manually via equipment edit'
    });
  }

  if ((payload.assignedTo !== undefined && payload.assignedTo !== String(oldDoc.assignedTo)) || 
      (payload.department !== undefined && payload.department !== oldDoc.department)) {
    const newAssigned = payload.assignedTo !== undefined ? payload.assignedTo : oldDoc.assignedTo;
    const newDept = payload.department !== undefined ? payload.department : oldDoc.department;
    historyEvents.push({
      eventType: 'ASSIGNED',
      description: `Assignment updated: ${newAssigned || 'Unassigned'} (${newDept || 'No Dept'})`,
      date: new Date(),
      recordedBy: req.user?._id
    });
  }

  const updateQuery = { $set: payload };
  if (historyEvents.length > 0) {
    updateQuery.$push = { history: { $each: historyEvents } };
  }

  const updatedEquipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    updateQuery,
    { new: true, runValidators: true }
  )
    .populate("maintenanceTeam")
    .populate("defaultTechnician");

  if (!updatedEquipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  await auditLog({
    entityType: 'Equipment',
    entityId: updatedEquipment._id,
    action: 'UPDATE',
    oldDoc,
    newDoc: updatedEquipment,
    userId: req.user?._id,
    userName: req.user?.name || ""
  });

  const openRequestsCount = await MaintenanceRequest.countDocuments({
    equipmentId: req.params.id,
    stage: { $nin: ["repaired", "scrap"] },
  });

  res.status(200).json({
    success: true,
    message: "Equipment updated successfully",
    data: { ...updatedEquipment.toJSON(), openRequestsCount },
  });
});

// Delete equipment
exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  // Check for active maintenance requests
  const activeRequests = await MaintenanceRequest.find({
    equipmentId: req.params.id,
    stage: { $nin: ['repaired', 'scrap'] }
  });

  if (activeRequests.length > 0) {
    throw new ErrorHandler(
      "Cannot delete equipment with active maintenance tickets. Please close or reassign them first.",
      ERROR_TYPES.VALIDATION_ERROR,
      400
    );
  }

  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  if (!equipment) {
    throw new ErrorHandler("Equipment not found", ERROR_TYPES.NOT_FOUND_ERROR);
  }

  await auditLog({
    entityType: 'Equipment',
    entityId: equipment._id,
    action: 'DELETE',
    userId: req.user?._id,
    userName: req.user?.name || ""
  });

  // Cascade delete all CLOSED/REPAIRED maintenance requests associated with this equipment
  await MaintenanceRequest.deleteMany({ equipmentId: req.params.id });

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

// Get financial data and depreciation for all equipment
exports.getEquipmentFinancials = asyncHandler(async (req, res, next) => {
  const equipmentList = await Equipment.find({}).lean();
  
  // Aggregate maintenance costs per equipment
  const maintenanceCosts = await MaintenanceRequest.aggregate([
    { $group: {
        _id: "$equipmentId",
        totalPartsCost: { $sum: "$partsCost" },
        totalLaborCost: { $sum: "$laborCost" },
        requestCount: { $sum: 1 }
    }}
  ]);

  const costsMap = new Map();
  maintenanceCosts.forEach(item => {
    if(item._id) {
      costsMap.set(item._id.toString(), {
        parts: item.totalPartsCost || 0,
        labor: item.totalLaborCost || 0,
        total: (item.totalPartsCost || 0) + (item.totalLaborCost || 0),
        count: item.requestCount || 0
      });
    }
  });

  const financials = equipmentList.map(eq => {
    const costData = costsMap.get(eq._id.toString()) || { parts: 0, labor: 0, total: 0, count: 0 };
    
    const purchasePrice = eq.purchasePrice || 0;
    const salvageValue = eq.salvageValue || 0;
    const lifespanYears = eq.expectedLifespanYears || 5;
    
    // Fallback: Use creation date if purchaseDate is missing
    const startDate = eq.purchaseDate ? new Date(eq.purchaseDate) : new Date(eq.createdAt);
    const now = new Date();
    
    let ageInYears = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 0) ageInYears = 0;
    
    // Straight line depreciation
    let depreciatedValue = purchasePrice;
    if (purchasePrice > 0 && lifespanYears > 0) {
      const yearlyDepreciation = (purchasePrice - salvageValue) / lifespanYears;
      depreciatedValue = purchasePrice - (yearlyDepreciation * ageInYears);
      if (depreciatedValue < salvageValue) depreciatedValue = salvageValue;
    }
    
    // A machine is a "money pit" if its cumulative maintenance costs > 75% of its current depreciated value
    // Only flag if depreciatedValue > 0 to avoid false positives on free/0-value equipment
    const isMoneyPit = depreciatedValue > 0 ? (costData.total > (depreciatedValue * 0.75)) : false;

    return {
      _id: eq._id,
      name: eq.name,
      serialNumber: eq.serialNumber,
      category: eq.category,
      purchasePrice,
      salvageValue,
      lifespanYears,
      ageInYears,
      depreciatedValue,
      maintenanceCosts: costData,
      isMoneyPit
    };
  });

  res.status(200).json({
    success: true,
    data: financials
  });
});
