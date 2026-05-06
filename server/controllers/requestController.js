const {
  MaintenanceRequest,
  Equipment,
  MaintenanceTeam,
  TeamMember,
} = require("../models");
const { logActivity } = require("../utils/logActivity");
const NotificationService = require("../services/notificationService");

// Remove empty-string ObjectId/date fields so Mongoose validation doesn't fail
const sanitizeBody = (body) => {
  const cleaned = { ...body };

  const objectIdFields = [
    "equipmentId",
    "teamId",
    "assignedToId",
    "createdById",
  ];
  objectIdFields.forEach((f) => {
    if (cleaned[f] === "" || cleaned[f] === null) delete cleaned[f];
  });

  if (cleaned.scheduledDate === "" || cleaned.scheduledDate === null)
    delete cleaned.scheduledDate;
  if (cleaned.completedDate === "" || cleaned.completedDate === null)
    delete cleaned.completedDate;

  return cleaned;
};

const getDisplayName = (doc, fallback = "") => {
  if (!doc) return fallback;
  return doc.name || doc.title || doc.requestNumber || fallback;
};

// Generate request number
const generateRequestNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const regex = new RegExp(`^REQ-${year}${month}-`);
  const lastRequest = await MaintenanceRequest.findOne({
    requestNumber: { $regex: regex },
  }).sort({ requestNumber: -1 });

  let sequence = 1;
  if (lastRequest && lastRequest.requestNumber) {
    const parts = lastRequest.requestNumber.split("-");
    const lastSequence = parseInt(parts[2] || "0", 10);
    if (!isNaN(lastSequence)) sequence = lastSequence + 1;
  }

  return `REQ-${year}${month}-${String(sequence).padStart(4, "0")}`;
};

// Get all requests (with advanced filtering)
exports.getAllRequests = async (req, res) => {
  try {
    const {
      stage,
      type,
      priority,
      teamId,
      assignedToId,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (stage) query.stage = stage;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (teamId) query.teamId = teamId;
    if (assignedToId) query.assignedToId = assignedToId;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    if (search) {
      const matchingEquipment = await Equipment.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');

      const equipmentIds = matchingEquipment.map((e) => e._id);

      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { equipmentId: { $in: equipmentIds } },
      ];
    }

    const requests = await MaintenanceRequest.find(query)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single request
exports.getRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo")
      .populate("createdBy");

    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create request with auto-fill logic
exports.createRequest = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);
    const requestNumber = await generateRequestNumber();

    let equipmentDoc = null;
    let oldEquipmentStatus = null;

    if (payload.equipmentId) {
      equipmentDoc = await Equipment.findById(payload.equipmentId)
        .populate("maintenanceTeam")
        .populate("defaultTechnician");

      if (equipmentDoc) {
        oldEquipmentStatus = equipmentDoc.status;

        if (!payload.teamId && equipmentDoc.maintenanceTeamId)
          payload.teamId = equipmentDoc.maintenanceTeamId;
        if (!payload.assignedToId && equipmentDoc.defaultTechnicianId)
          payload.assignedToId = equipmentDoc.defaultTechnicianId;

        await Equipment.findByIdAndUpdate(equipmentDoc._id, {
          status: "under-maintenance",
        });
      }
    }

    const request = await MaintenanceRequest.create({
      ...payload,
      requestNumber,
    });

    const requestWithRelations = await MaintenanceRequest.findById(request._id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo")
      .populate("createdBy");

    const userName = requestWithRelations?.createdBy?.name || "";

    // Activity: request created
    await logActivity({
      type: "request_created",
      title: "New Maintenance Request",
      description: `${getDisplayName(requestWithRelations.equipment)} - ${requestWithRelations.subject || requestWithRelations.requestNumber}`,
      userName,
      metadata: {
        priority: requestWithRelations.priority,
        stage: requestWithRelations.stage,
        requestNumber: requestWithRelations.requestNumber,
      },
      entityType: "request",
      entityId: String(requestWithRelations._id),
    });

    // Notify: request created
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(io, "request_created", requestWithRelations);

    // Activity: equipment status changed (if we changed it)
    if (
      equipmentDoc &&
      oldEquipmentStatus &&
      oldEquipmentStatus !== "under-maintenance"
    ) {
      await logActivity({
        type: "equipment_updated",
        title: "Equipment Status Changed",
        description: `${equipmentDoc.name} - Status changed to under-maintenance`,
        userName,
        metadata: { from: oldEquipmentStatus, to: "under-maintenance" },
        entityType: "equipment",
        entityId: String(equipmentDoc._id),
      });
    }

    res.status(201).json(requestWithRelations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update request
exports.updateRequest = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("createdBy");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const prevStage = request.stage;
    const prevPriority = request.priority;

    // Handle stage side-effects (equipment status updates)
    if (payload.stage) {
      if (payload.stage === "repaired") {
        payload.completedDate = new Date();
        if (request.equipmentId)
          await Equipment.findByIdAndUpdate(request.equipmentId, {
            status: "active",
          });
      }
      if (payload.stage === "scrap") {
        payload.completedDate = new Date();
        if (request.equipmentId)
          await Equipment.findByIdAndUpdate(request.equipmentId, {
            status: "scrapped",
          });
      }
    }

    await MaintenanceRequest.findByIdAndUpdate(req.params.id, payload);

    const updatedRequest = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo")
      .populate("createdBy");

    const userName = updatedRequest?.createdBy?.name || "";
    const newStage = updatedRequest.stage;
    const completed = newStage === "repaired" || newStage === "scrap";

    await logActivity({
      type: completed ? "request_completed" : "request_updated",
      title: completed ? "Request Completed" : "Request Updated",
      description: `${getDisplayName(updatedRequest.equipment)} - ${updatedRequest.subject || updatedRequest.requestNumber}`,
      userName,
      metadata: {
        priority: updatedRequest.priority,
        prevPriority,
        prevStage,
        stage: newStage,
        requestNumber: updatedRequest.requestNumber,
      },
      entityType: "request",
      entityId: String(updatedRequest._id),
    });

    // Notify: request updated or completed
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(
      io, 
      completed ? "request_completed" : "request_updated", 
      updatedRequest, 
      completed ? "Completed" : `Stage changed to ${newStage}`
    );

    // If equipment status changed due to stage update, log it too
    if (
      request.equipment &&
      payload.stage &&
      (payload.stage === "repaired" || payload.stage === "scrap")
    ) {
      const toStatus = payload.stage === "scrap" ? "scrapped" : "active";
      await logActivity({
        type: "equipment_updated",
        title: "Equipment Status Changed",
        description: `${request.equipment.name} - Status changed to ${toStatus}`,
        userName,
        metadata: { to: toStatus },
        entityType: "equipment",
        entityId: String(request.equipment._id),
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update request stage (for Kanban drag-and-drop)
exports.updateRequestStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("createdBy");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const prevStage = request.stage;

    await MaintenanceRequest.findByIdAndUpdate(req.params.id, { stage });

    if (stage === "repaired" || stage === "scrap") {
      await MaintenanceRequest.findByIdAndUpdate(req.params.id, {
        completedDate: new Date(),
      });
      if (request.equipmentId) {
        const newStatus = stage === "scrap" ? "scrapped" : "active";
        await Equipment.findByIdAndUpdate(request.equipmentId, {
          status: newStatus,
        });
      }
    }

    const updatedRequest = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo")
      .populate("createdBy");

    const userName = updatedRequest?.createdBy?.name || "";
    const completed = stage === "repaired" || stage === "scrap";

    await logActivity({
      type: completed ? "request_completed" : "request_updated",
      title: completed ? "Request Completed" : "Request Updated",
      description: `${getDisplayName(updatedRequest.equipment)} - ${updatedRequest.subject || updatedRequest.requestNumber}`,
      userName,
      metadata: {
        priority: updatedRequest.priority,
        prevStage,
        stage,
        requestNumber: updatedRequest.requestNumber,
      },
      entityType: "request",
      entityId: String(updatedRequest._id),
    });

    // Notify: request updated (Kanban)
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(
      io, 
      completed ? "request_completed" : "request_updated", 
      updatedRequest, 
      completed ? "Completed via Kanban" : `Moved to ${stage}`
    );

    if (updatedRequest.equipment && completed) {
      const toStatus = stage === "scrap" ? "scrapped" : "active";
      await logActivity({
        type: "equipment_updated",
        title: "Equipment Status Changed",
        description: `${updatedRequest.equipment.name} - Status changed to ${toStatus}`,
        userName,
        metadata: { to: toStatus },
        entityType: "equipment",
        entityId: String(updatedRequest.equipment._id),
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete request
exports.deleteRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id)
      .populate("equipment")
      .populate("createdBy");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const userName = request?.createdBy?.name || "";

    await logActivity({
      type: "request_updated",
      title: "Request Deleted",
      description: `${getDisplayName(request.equipment)} - ${request.subject || request.requestNumber}`,
      userName,
      metadata: { requestNumber: request.requestNumber },
      entityType: "request",
      entityId: String(request._id),
    });

    // Notify: request deleted
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(io, "request_deleted", request);

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get calendar events (preventive maintenance)
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = { type: "preventive" };

    if (start && end) {
      where.scheduledDate = { $gte: new Date(start), $lte: new Date(end) };
    }

    const requests = await MaintenanceRequest.find(where)
      .populate("equipment")
      .populate("assignedTo");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get analytics summary and chart data
exports.getAnalytics = async (req, res) => {
  try {
    const { range = "30d", startDate, endDate } = req.query;

    const now = new Date();
    let start;
    let end;

    if (range === "custom") {
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required for custom range" });
      }
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (range === "90d") {
      end = now;
      start = new Date(now);
      start.setDate(start.getDate() - 90);
    } else {
      end = now;
      start = new Date(now);
      start.setDate(start.getDate() - 30);
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    if (start > end) {
      return res.status(400).json({ error: "startDate cannot be after endDate" });
    }

    const rangeMatch = { createdAt: { $gte: start, $lte: end } };
    const openStages = ["new", "in-progress"];

    const [
      totalRequests,
      completedRequests,
      overdueRequests,
      stageBreakdown,
      typeBreakdown,
      trendData,
      mttrResult,
    ] = await Promise.all([
      MaintenanceRequest.countDocuments(rangeMatch),
      MaintenanceRequest.countDocuments({
        ...rangeMatch,
        stage: { $in: ["repaired", "scrap"] },
      }),
      MaintenanceRequest.countDocuments({
        ...rangeMatch,
        scheduledDate: { $lt: now },
        stage: { $in: openStages },
      }),
      MaintenanceRequest.aggregate([
        { $match: rangeMatch },
        { $group: { _id: "$stage", value: { $sum: 1 } } },
        { $project: { _id: 0, stage: "$_id", value: 1 } },
        { $sort: { stage: 1 } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: rangeMatch },
        { $group: { _id: "$type", value: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", value: 1 } },
        { $sort: { type: 1 } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: rangeMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $in: ["$stage", ["repaired", "scrap"]] }, 1, 0],
              },
            },
          },
        },
        { $project: { _id: 0, date: "$_id", total: 1, completed: 1 } },
        { $sort: { date: 1 } },
      ]),
      MaintenanceRequest.aggregate([
        {
          $match: {
            ...rangeMatch,
            completedDate: { $ne: null },
            stage: { $in: ["repaired", "scrap"] },
          },
        },
        {
          $project: {
            resolutionMs: { $subtract: ["$completedDate", "$createdAt"] },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionMs: { $avg: "$resolutionMs" },
          },
        },
      ]),
    ]);

    const avgResolutionMs = mttrResult[0]?.avgResolutionMs || 0;
    const mttrHours = avgResolutionMs ? avgResolutionMs / (1000 * 60 * 60) : 0;
    const overdueRate = totalRequests ? (overdueRequests / totalRequests) * 100 : 0;

    res.json({
      range: {
        type: range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      metrics: {
        totalRequests,
        completedRequests,
        mttrHours: Number(mttrHours.toFixed(2)),
        overdueRate: Number(overdueRate.toFixed(2)),
      },
      charts: {
        stageBreakdown,
        typeBreakdown,
        trend: trendData,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
