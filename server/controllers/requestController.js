const {
  MaintenanceRequest,
  Equipment,
  MaintenanceTeam,
  TeamMember,
  SparePart,
} = require("../models");
const { logActivity } = require("../utils/logActivity");
const { auditLog } = require("../utils/auditLogger");
const NotificationService = require("../services/notificationService");
const { withTransactionFallback } = require("../utils/transaction");
const { calculateAndUpdateHealthScore } = require("../services/healthScoreService");
const escapeRegex = require("../utils/escapeRegex");
const generateRequestNumber = require("../utils/generateRequestNumber");
const fs = require('fs');
const path = require('path');
const { mongoose } = require('../config/database');

function getGridFSBucket() {
  if (!mongoose.connection.db) throw new Error("Database not connected");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
}

const decrementInventory = async (io, partsUsed) => {
  if (!partsUsed || !Array.isArray(partsUsed) || partsUsed.length === 0) return;
  for (const item of partsUsed) {
    const partId = item.partId?._id || item.partId;
    if (!partId) continue;
    try {
      // Atomic decrement prevents concurrency data loss
      const updatedPart = await SparePart.findByIdAndUpdate(
        partId,
        { $inc: { quantityInStock: -item.quantityUsed } },
        { new: true }
      );

      if (updatedPart) {
        if (updatedPart.quantityInStock <= updatedPart.minReorderThreshold) {
          if (updatedPart.reorderStatus === 'ok') {
            const finalPart = await SparePart.findByIdAndUpdate(
              partId, 
              { reorderStatus: 'low-stock' }, 
              { new: true }
            );
            await NotificationService.notifyLowStock(io, finalPart);
          }
        } else if (updatedPart.reorderStatus !== 'ok') {
           await SparePart.findByIdAndUpdate(partId, { reorderStatus: 'ok' });
        }
      }
    } catch (err) {
      console.error(`Failed to decrement inventory for part ${partId}:`, err);
    }
  }
};

const releaseReservations = async (requiredParts) => {
  if (!requiredParts || !Array.isArray(requiredParts) || requiredParts.length === 0) return;
  for (const item of requiredParts) {
    const partId = item.partId?._id || item.partId;
    if (!partId) continue;
    try {
      await SparePart.findByIdAndUpdate(
        partId,
        { $inc: { quantityReserved: -item.quantityNeeded } },
        { new: true }
      );
    } catch (err) {
      console.error(`Failed to release reservation for part ${partId}:`, err);
    }
  }
};

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
  if (!Array.isArray(cleaned.attachments)) {
  cleaned.attachments = [];
}
  return cleaned;
};

const getDisplayName = (doc, fallback = "") => {
  if (!doc) return fallback;
  return doc.name || doc.title || doc.requestNumber || fallback;
};

// Request number generation has been moved to utils/generateRequestNumber.js

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
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
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
      const safeSearch = escapeRegex(search);
      const matchingEquipment = await Equipment.find({
        name: { $regex: safeSearch, $options: 'i' },
      }).select('_id');

      const equipmentIds = matchingEquipment.map((e) => e._id);

      query.$or = [
        { subject: { $regex: safeSearch, $options: 'i' } },
        { requestNumber: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { equipmentId: { $in: equipmentIds } },
      ];
    }

    const sortObject = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skipNum = (pageNum - 1) * limitNum;

    const [requests, totalItems] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate("equipment")
        .populate("team")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("partsUsed.partId")
        .sort(sortObject)
        .skip(skipNum)
        .limit(limitNum),
      MaintenanceRequest.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      items: requests,
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
    });
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
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("partsUsed.partId");

    if (!request) return res.status(404).json({ error: "Request not found" });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateSLA = (priority) => {
  const now = Date.now();
  switch (priority) {
    case 'urgent': return new Date(now + 4 * 60 * 60 * 1000);
    case 'high': return new Date(now + 24 * 60 * 60 * 1000);
    case 'medium': return new Date(now + 72 * 60 * 60 * 1000);
    case 'low': return new Date(now + 168 * 60 * 60 * 1000);
    default: return new Date(now + 72 * 60 * 60 * 1000);
  }
};

// Create request with auto-fill logic
exports.createRequest = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);
    const requestNumber = await generateRequestNumber();

    const requestWithRelations = await withTransactionFallback(async (session) => {
      let equipmentDoc = null;
      let oldEquipmentStatus = null;

      if (payload.equipmentId) {
        equipmentDoc = await Equipment.findById(payload.equipmentId)
          .session(session)
          .populate("maintenanceTeam")
          .populate("defaultTechnician");

        if (equipmentDoc) {
          oldEquipmentStatus = equipmentDoc.status;

          if (!payload.teamId && equipmentDoc.maintenanceTeamId)
            payload.teamId = equipmentDoc.maintenanceTeamId;
          if (!payload.assignedToId && equipmentDoc.defaultTechnicianId)
            payload.assignedToId = equipmentDoc.defaultTechnicianId;

          await Equipment.findByIdAndUpdate(
            equipmentDoc._id,
            {
              $set: { status: "under-maintenance" },
              $push: {
                history: {
                  eventType: 'STATUS_CHANGE',
                  description: `Status changed to under-maintenance due to new request ${requestNumber}`,
                  date: new Date(),
                  recordedBy: req.user?._id,
                  userId: req.user?._id,
                  userName: req.user?.name || "System",
                  notes: 'Status updated automatically on request creation'
                }
              }
            },
            { session }
          );
        }
      }

      let isBlocked = false;
      if (payload.requiredParts && payload.requiredParts.length > 0) {
        for (const reqPart of payload.requiredParts) {
          const partDoc = await SparePart.findById(reqPart.partId).session(session);
          if (partDoc) {
             const availableStock = partDoc.quantityInStock - partDoc.quantityReserved;
             if (availableStock < reqPart.quantityNeeded) {
               isBlocked = true;
             }
             await SparePart.findByIdAndUpdate(reqPart.partId, {
               $inc: { quantityReserved: reqPart.quantityNeeded }
             }, { session });
          }
        }
      }

      const request = await MaintenanceRequest.create([{
        ...payload,
        requestNumber,
        createdById: req.user?._id,
        slaDeadline: calculateSLA(payload.priority || 'medium'),
        attachments: req.body.attachments || [],
        isBlockedAwaitingParts: isBlocked
      }], { session });

      return await MaintenanceRequest.findById(request[0]._id)
        .session(session)
        .populate("equipment")
        .populate("team")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("partsUsed.partId")
        .populate("requiredParts.partId");
    });

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

    await auditLog({
      entityType: 'MaintenanceRequest',
      entityId: requestWithRelations._id,
      action: 'CREATE',
      userId: req.user?._id,
      userName: userName
    });

    // Notify: request created
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(io, "request_created", requestWithRelations);
    if (requestWithRelations.assignedTo?.email) {
      try {
        await NotificationService.sendEmail(
          requestWithRelations.assignedTo.email,
          NotificationService.EMAIL_SUBJECTS.ASSIGNED,
          NotificationService.assignmentTemplate(requestWithRelations)
        );
      } catch (error) {
        console.error("EMAIL ERROR:", error);
      }
    }

    // Notify assigned technician (Level 3 specific)
    if (requestWithRelations.assignedToId) {
      const assignedUserId = requestWithRelations.assignedToId;
      await NotificationService.createAndEmit({
        userId: assignedUserId,
        title: 'New Request Assigned',
        message: `You have been assigned a new maintenance request: "${requestWithRelations.subject || requestWithRelations.requestNumber}"`,
        type: 'request_assigned',
        link: '/kanban',
        relatedRequestId: requestWithRelations._id,
      });
    }

    // Activity: equipment status changed (if we changed it)
    // Note: equipmentDoc would need to be passed out of the transaction if needed here
    
    if (requestWithRelations.equipmentId) {
      calculateAndUpdateHealthScore(requestWithRelations.equipmentId).catch(err => 
        console.error('Background health score update failed:', err)
      );
    }

    res.status(201).json(requestWithRelations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- GAMIFICATION LOGIC ---
const processGamification = async (request, prevStage, newStage, shouldProcessCompletion) => {
  if (!request.assignedToId && !request.assignedTo) return;

  const memberId = request.assignedToId || request.assignedTo._id;
  if (!memberId) return;

  const member = await TeamMember.findById(memberId);
  if (!member) return;

  let pointsToAdd = 0;
  const newBadges = [];
  const userBadges = member.badges || [];

  // Check First Responder (moved from new -> in-progress)
  if (prevStage === 'new' && newStage === 'in-progress' && request.priority === 'urgent' && !userBadges.includes('First Responder')) {
    const diffMins = (new Date() - new Date(request.createdAt)) / 1000 / 60;
    if (diffMins <= 5) {
      newBadges.push('First Responder');
      pointsToAdd += 5; // Bonus
    }
  }

  // Check points for completion
  if (shouldProcessCompletion) {
    const basePoints = 10;
    let multiplier = 1;
    if (request.priority === 'medium') multiplier = 1.5;
    if (request.priority === 'high') multiplier = 2;
    if (request.priority === 'urgent') multiplier = 3;
    
    pointsToAdd += Math.floor(basePoints * multiplier);

    // Check Master Mechanic badge
    if (!userBadges.includes('Master Mechanic')) {
      const completedCount = await MaintenanceRequest.countDocuments({
        $or: [ { assignedToId: member._id }, { assignedTo: member._id } ],
        stage: { $in: ['repaired', 'scrap'] }
      });
      if (completedCount >= 50) { 
        newBadges.push('Master Mechanic');
        pointsToAdd += 50; // Big bonus
      }
    }
  }

  if (pointsToAdd > 0 || newBadges.length > 0) {
    const updates = { $inc: { points: pointsToAdd } };
    if (newBadges.length > 0) {
      updates.$push = { badges: { $each: newBadges } };
    }
    await TeamMember.findByIdAndUpdate(member._id, updates);
  }
};
// --- END GAMIFICATION LOGIC ---

// Update request
exports.updateRequest = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);
    const prevRequest = await MaintenanceRequest.findById(req.params.id);
    if (!prevRequest) return res.status(404).json({ error: "Request not found" });

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("createdBy", "name email");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const prevStage = request.stage;
    const prevPriority = request.priority;

    if (payload.stage === 'in-progress' && prevStage === 'new' && request.isBlockedAwaitingParts) {
       return res.status(400).json({ error: "Cannot start an in-progress ticket while blocked awaiting parts." });
    }

    // Handle stage side-effects (equipment status updates)
    if (payload.stage) {
      if (payload.stage === "repaired") {
        payload.completedDate = new Date();
        if (request.equipmentId) {
          await Equipment.findByIdAndUpdate(request.equipmentId, {
            $set: { status: "active" },
            $push: {
              history: {
                eventType: 'STATUS_CHANGE',
                description: `Status changed to active as request ${request.subject || request.requestNumber} was marked repaired`,
                date: new Date(),
                recordedBy: req.user?._id,
                notes: 'Status updated automatically on request repaired'
              }
            }
          });
        }
      }
      if (payload.stage === "scrap") {
        payload.completedDate = new Date();
        if (request.equipmentId) {
          await Equipment.findByIdAndUpdate(request.equipmentId, {
            $set: { status: "scrapped" },
            $push: {
              history: {
                eventType: 'STATUS_CHANGE',
                description: `Status changed to scrapped as request ${request.subject || request.requestNumber} was marked scrap`,
                date: new Date(),
                recordedBy: req.user?._id,
                notes: 'Status updated automatically on request scrapped'
              }
            }
          });
    const prevStage = prevRequest.stage;
    const prevPriority = prevRequest.priority;
    
    const request = await withTransactionFallback(async (session) => {
      // Handle stage side-effects (equipment status updates)
      if (payload.stage) {
        if (payload.stage === "repaired") {
          payload.completedDate = new Date();
          if (prevRequest.equipmentId) {
            await Equipment.findByIdAndUpdate(
              prevRequest.equipmentId,
              {
                $set: { status: "active" },
                $push: {
                  history: {
                    eventType: 'STATUS_CHANGE',
                    description: `Status changed to active as request ${prevRequest.subject || prevRequest.requestNumber} was marked repaired`,
                    date: new Date(),
                    recordedBy: req.user?._id,
                    userId: req.user?._id,
                    userName: req.user?.name || "System",
                    notes: 'Status updated automatically on request repaired'
                  }
                }
              },
              { session }
            );
          }
        }
        if (payload.stage === "scrap") {
          payload.completedDate = new Date();
          if (prevRequest.equipmentId) {
            await Equipment.findByIdAndUpdate(
              prevRequest.equipmentId,
              {
                $set: { status: "scrapped" },
                $push: {
                  history: {
                    eventType: 'STATUS_CHANGE',
                    description: `Status changed to scrapped as request ${prevRequest.subject || prevRequest.requestNumber} was marked scrap`,
                    date: new Date(),
                    recordedBy: req.user?._id,
                    userId: req.user?._id,
                    userName: req.user?.name || "System",
                    notes: 'Status updated automatically on request scrapped'
                  }
                }
              },
              { session }
            );
          }
        }
      }

      return await MaintenanceRequest.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true, session }
      ).populate("equipment").populate("createdBy", "name email");
    });

    // Notify requester if stage changed
    if (payload.stage && payload.stage !== prevStage) {
      if (request.createdBy) {
        await NotificationService.createAndEmit({
          userId: request.createdBy._id || request.createdBy,
          title: 'Request Status Updated',
          message: `Your request "${request.subject || request.requestNumber}" has been updated to: ${payload.stage}`,
          type: 'request_updated',
          link: '/kanban',
          relatedRequestId: request._id,
        });
      }
    }

    // Notify new assignee if assignedToId changed
    if (payload.assignedToId &&
        String(payload.assignedToId) !== String(request.assignedToId?._id || request.assignedToId)) {
      await NotificationService.createAndEmit({
        userId: payload.assignedToId,
        title: 'Request Assigned to You',
        message: `You have been assigned to: "${request.subject || request.requestNumber}"`,
        type: 'request_assigned',
        link: '/kanban',
        relatedRequestId: request._id,
      });
    }

    // Call auditLogger for diff tracking
    await auditLog({
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      action: 'UPDATE',
      oldDoc: prevRequest,
      newDoc: { ...request.toObject(), ...payload },
      userId: req.user?._id,
      userName: request.createdBy?.name || ""
    });

    if (payload.priority && payload.priority !== request.priority) {
      payload.slaDeadline = calculateSLA(payload.priority);
      payload.slaBreached = false;
      payload.slaNotified = false;
    }

    await MaintenanceRequest.findByIdAndUpdate(req.params.id, payload);

    const isCompleted = prevStage === "repaired" || prevStage === "scrap";
    const nowCompleted = request.stage === "repaired" || request.stage === "scrap";
    const shouldProcessCompletion = request.stage && nowCompleted && !isCompleted && !request.completionProcessed;
    if (shouldProcessCompletion) {
      const io = req.app.get("socketio");
      await decrementInventory(io, request.partsUsed);
      await releaseReservations(request.requiredParts);
      await MaintenanceRequest.findByIdAndUpdate(req.params.id, { completionProcessed: true });
    }

    const updatedRequest = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("partsUsed.partId");

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
    if (completed && updatedRequest.createdBy?.email) {
      try {
      await NotificationService.sendEmail(
        updatedRequest.createdBy.email,
        NotificationService.EMAIL_SUBJECTS.COMPLETED,
        NotificationService.completionTemplate(updatedRequest)
      );
    } catch (error) {
      console.error("EMAIL ERROR:", error);
    }
  }

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

    await processGamification(updatedRequest, prevStage, payload.stage || updatedRequest.stage, shouldProcessCompletion);

    if (updatedRequest.equipmentId) {
      calculateAndUpdateHealthScore(updatedRequest.equipmentId).catch(err => 
        console.error('Background health score update failed:', err)
      );
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update request stage (for Kanban drag-and-drop)
exports.updateRequestStage = async (req, res) => {
  try {
    const { stage, partsCost, laborCost } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("createdBy", "name email")
      .populate("partsUsed.partId");

    if (!request) return res.status(404).json({ error: "Request not found" });

    // Authorization Check
    const isAuthorized = 
      req.user.role === 'Admin' || 
      req.user.role === 'Manager' || 
      (req.user.role === 'Technician' && request.assignedToId?.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to change the stage of this request' });
    }

    const prevStage = request.stage;

    if (stage === 'in-progress' && prevStage === 'new' && request.isBlockedAwaitingParts) {
       return res.status(400).json({ error: "Cannot start an in-progress ticket while blocked awaiting parts." });
    }

    await auditLog({
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      action: 'UPDATE',
      oldDoc: request,
      newDoc: { ...request.toObject(), stage },
      userId: req.user?._id,
      userName: request.createdBy?.name || ""
    });

    const updateData = { stage };
    if (partsCost !== undefined) updateData.partsCost = partsCost;
    if (laborCost !== undefined) updateData.laborCost = laborCost;

    await MaintenanceRequest.findByIdAndUpdate(req.params.id, updateData);

    if (stage === "repaired" || stage === "scrap") {
      const completedDate = new Date();
      let downtimeDurationHours = 0;
      let totalDowntimeCost = 0;

      if (request.createdAt) {
        downtimeDurationHours = Math.max(0, (completedDate - request.createdAt) / (1000 * 60 * 60));
      }

      if (request.equipment && request.equipment.hourlyDowntimeCost) {
        totalDowntimeCost = downtimeDurationHours * request.equipment.hourlyDowntimeCost;
      }

      await MaintenanceRequest.findByIdAndUpdate(req.params.id, {
        completedDate,
        downtimeDurationHours,
        totalDowntimeCost
      });

      if (request.equipmentId) {
        const newStatus = stage === "scrap" ? "scrapped" : "active";
        await Equipment.findByIdAndUpdate(request.equipmentId, {
          $set: { status: newStatus },
          $push: { history: {
            eventType: stage === "scrap" ? 'SCRAPPED' : 'REPAIR_COMPLETED',
            description: `Request stage updated to ${stage}. Status changed to ${newStatus}.`,
            userId: req.user?._id,
            userName: req.user?.name || "System"
          }}
        });
      }
    }

    const isCompleted = prevStage === "repaired" || prevStage === "scrap";
    const nowCompleted = stage === "repaired" || stage === "scrap";
    const shouldProcessCompletion = nowCompleted && !isCompleted && !request.completionProcessed;
    if (shouldProcessCompletion) {
      const io = req.app.get("socketio");
      await decrementInventory(io, request.partsUsed);
      await releaseReservations(request.requiredParts);
      await MaintenanceRequest.findByIdAndUpdate(req.params.id, { completionProcessed: true });
    }

    const updatedRequest = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("team")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("partsUsed.partId");

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
    if (completed && updatedRequest.createdBy?.email) {
      try {
        await NotificationService.sendEmail(
          updatedRequest.createdBy.email,
          NotificationService.EMAIL_SUBJECTS.COMPLETED,
          NotificationService.completionTemplate(updatedRequest)
        );
      } catch (error) {
        console.error("EMAIL ERROR:", error);
      }
    }

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

    await processGamification(updatedRequest, prevStage, stage, shouldProcessCompletion);

    if (shouldProcessCompletion) {
      await MaintenanceRequest.findByIdAndUpdate(req.params.id, { completionProcessed: true });
    }

    if (updatedRequest.equipmentId) {
      calculateAndUpdateHealthScore(updatedRequest.equipmentId).catch(err => 
        console.error('Background health score update failed:', err)
      );
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete request
exports.deleteRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!isAuthorizedForRequest(request, req.user) && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Not authorized to delete this request" });
    }

    await withTransactionFallback(async (session) => {
      // Revert equipment status to active if deleting a non-completed request
      if (request.equipmentId && request.stage !== 'repaired' && request.stage !== 'scrap') {
        await Equipment.findByIdAndUpdate(
          request.equipmentId,
          {
            $set: { status: "active" },
            $push: {
              history: {
                eventType: 'STATUS_CHANGE',
                description: `Status reverted to active as request ${request.subject || request.requestNumber} was deleted`,
                date: new Date(),
                recordedBy: req.user?._id,
                userId: req.user?._id,
                userName: req.user?.name || "System",
                notes: 'Status reverted automatically on request deletion'
              }
            }
          },
          { session }
        );
      }
      await releaseReservations(request.requiredParts);
      await MaintenanceRequest.findByIdAndDelete(req.params.id, { session });
    });

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

    await auditLog({
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      action: 'DELETE',
      userId: req.user?._id,
      userName: userName
    });

    // Notify: request deleted
    const io = req.app.get("socketio");
    await NotificationService.notifyRequestChange(io, "request_deleted", request);

    if (request.equipmentId) {
      // Check if there are any remaining open requests for this equipment
      const openRequestsCount = await MaintenanceRequest.countDocuments({
        equipmentId: request.equipmentId,
        stage: { $nin: ['repaired', 'scrap'] }
      });

      // If no open tickets remain, reset the equipment status to active
      if (openRequestsCount === 0) {
        await Equipment.findByIdAndUpdate(request.equipmentId, { status: 'active' });
        
        await logActivity({
          type: 'equipment_updated',
          title: 'Equipment Status Restored',
          description: `${getDisplayName(request.equipment)} restored to active after ticket deletion.`,
          userName: 'System',
          entityType: 'equipment',
          entityId: String(request.equipmentId)
        });
      }

      calculateAndUpdateHealthScore(request.equipmentId).catch(err => 
        console.error('Background health score update failed:', err)
      );
    }

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
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

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
      financialLossResult,
      costByCategory
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
      MaintenanceRequest.aggregate([
        { $match: rangeMatch },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$totalDowntimeCost" },
          },
        },
      ]),
      MaintenanceRequest.aggregate([
        { $match: rangeMatch },
        {
          $lookup: {
            from: "equipments",
            localField: "equipmentId",
            foreignField: "_id",
            as: "equipmentDoc"
          }
        },
        { $unwind: "$equipmentDoc" },
        {
          $group: {
            _id: "$equipmentDoc.category",
            value: { $sum: "$totalDowntimeCost" }
          }
        },
        { $project: { _id: 0, category: "$_id", value: 1 } },
        { $sort: { value: -1 } }
      ])
    ]);

    const avgResolutionMs = mttrResult[0]?.avgResolutionMs || 0;
    const mttrHours = avgResolutionMs ? avgResolutionMs / (1000 * 60 * 60) : 0;
    const overdueRate = totalRequests ? (overdueRequests / totalRequests) * 100 : 0;
    const totalFinancialLoss = financialLossResult[0]?.totalCost || 0;

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
        totalFinancialLoss: Number(totalFinancialLoss.toFixed(2)),
      },
      charts: {
        stageBreakdown,
        typeBreakdown,
        trend: trendData,
        costByCategory
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const newComment = {
      authorId: req.user.id,
      authorName: req.user.name,
      content: req.body.content || "",
      audioUrl: req.body.audioUrl,
      audioDuration: req.body.audioDuration,
      timestamp: new Date()
    };

    request.comments.push(newComment);
    await request.save();

    const savedComment = request.comments[request.comments.length - 1];

    const io = req.app.get("socketio");
    if (io) {
      io.to(`ticket_${req.params.id}`).emit("new_comment", {
        ticketId: req.params.id,
        comment: savedComment
      });
    }

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const commentIndex = request.comments.findIndex(
      (c) => c._id && c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (request.comments[commentIndex].authorId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    request.comments.splice(commentIndex, 1);
    await request.save();

    const io = req.app.get("socketio");
    if (io) {
      io.to(`ticket_${req.params.id}`).emit("delete_comment", {
        ticketId: req.params.id,
        commentId: req.params.commentId
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.smartAssignRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    let targetSpecialization = null;
    let teamIds = [];

    // 1. Resolve Specialization & Teams
    if (request.teamId) {
      const team = await MaintenanceTeam.findById(request.teamId);
      if (team) {
        targetSpecialization = team.specialization;
        teamIds.push(team._id);
      }
    }

    if (!targetSpecialization && request.equipmentId) {
      const equipment = await Equipment.findById(request.equipmentId);
      if (equipment && equipment.maintenanceTeamId) {
        const team = await MaintenanceTeam.findById(equipment.maintenanceTeamId);
        if (team) {
          targetSpecialization = team.specialization;
          teamIds.push(team._id);
        }
      }
    }

    if (targetSpecialization) {
      const matchingTeams = await MaintenanceTeam.find({ specialization: targetSpecialization, isActive: true });
      const matchingTeamIds = matchingTeams.map(t => t._id);
      teamIds = Array.from(new Set([...teamIds, ...matchingTeamIds]));
    }

    if (teamIds.length === 0) {
      return res.status(400).json({ error: "Could not determine required specialization or team for this request. Please assign a team manually." });
    }

    // 2. Find All Active Technicians in these Teams
    const technicians = await TeamMember.find({ teamId: { $in: teamIds }, isActive: true });
    if (technicians.length === 0) {
      return res.status(404).json({ error: "No active technicians found for the required specialization. Please assign manually." });
    }

    // 3. Query workload counts for these technicians (new and in-progress requests)
    const activeRequests = await MaintenanceRequest.find({
      stage: { $in: ['new', 'in-progress'] },
      assignedToId: { $in: technicians.map(tech => tech._id) }
    });

    const workloadMap = {};
    technicians.forEach(tech => {
      workloadMap[tech._id.toString()] = 0;
    });
    activeRequests.forEach(r => {
      if (r.assignedToId) {
        const techIdStr = r.assignedToId.toString();
        if (workloadMap[techIdStr] !== undefined) {
          workloadMap[techIdStr]++;
        }
      }
    });

    // 4. Identify optimal technician with lowest workload
    let bestTechnician = null;
    let minWorkload = Infinity;

    for (const tech of technicians) {
      const workload = workloadMap[tech._id.toString()];
      if (workload < minWorkload) {
        minWorkload = workload;
        bestTechnician = tech;
      }
    }

    // 5. Apply capacity protection limit (MAX_WORKLOAD = 5)
    const MAX_WORKLOAD = 5;
    if (minWorkload >= MAX_WORKLOAD) {
      return res.status(400).json({ 
        error: `All qualified technicians for specialization "${targetSpecialization || 'this team'}" are at maximum workload capacity (${MAX_WORKLOAD}+ active tickets). Please assign manually.` 
      });
    }

    // Preserve old document for logging
    const oldRequest = await MaintenanceRequest.findById(request._id);

    // 6. Assign request
    request.assignedToId = bestTechnician._id;
    // If the request doesn't have a teamId, assign the best technician's teamId
    if (!request.teamId) {
      request.teamId = bestTechnician.teamId;
    }
    await request.save();

    // 7. Trigger Assignment Notifications
    await NotificationService.createAndEmit({
      userId: bestTechnician._id,
      title: 'Request Auto-Assigned to You',
      message: `You have been automatically assigned to: "${request.subject || request.requestNumber}" based on workload & specialization.`,
      type: 'request_assigned',
      link: '/kanban',
      relatedRequestId: request._id,
    });

    // 8. Log Audit Records
    await auditLog({
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      action: 'UPDATE',
      oldDoc: oldRequest,
      newDoc: request.toObject(),
      userId: req.user?._id,
      userName: "System Auto-Assigner"
    });

    // 9. Emit Socket.io update
    const io = req.app.get("socketio");
    const updatedRequest = await MaintenanceRequest.findById(request._id)
      .populate('equipment')
      .populate('team')
      .populate('assignedTo');

    await NotificationService.notifyRequestChange(
      io, 
      "request_updated", 
      updatedRequest, 
      `Automatically assigned to ${bestTechnician.name}`
    );

    if (request.equipmentId) {
      calculateAndUpdateHealthScore(request.equipmentId).catch(err => 
        console.error('Background health score update failed:', err)
      );
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.predictSpareParts = async (req, res) => {
  try {
    const targetReq = await MaintenanceRequest.findById(req.params.id);
    if (!targetReq || !targetReq.equipmentId) {
      return res.status(200).json([]);
    }

    const text = ((targetReq.subject || '') + ' ' + (targetReq.description || '')).toLowerCase();
    const keywords = text.split(/\W+/).filter(w => w.length > 3);

    const pastRequests = await MaintenanceRequest.find({
      equipmentId: targetReq.equipmentId,
      stage: 'repaired',
      _id: { $ne: targetReq._id }
    }).populate('partsUsed.partId');

    const partScores = {};

    pastRequests.forEach(pastReq => {
      const pastText = ((pastReq.subject || '') + ' ' + (pastReq.description || '')).toLowerCase();
      let matchScore = 0;
      keywords.forEach(kw => {
        if (pastText.includes(kw)) matchScore += 1;
      });

      if (matchScore > 0 && pastReq.partsUsed && pastReq.partsUsed.length > 0) {
        pastReq.partsUsed.forEach(used => {
          if (!used.partId) return;
          const pId = used.partId._id.toString();
          if (!partScores[pId]) {
            partScores[pId] = {
              part: used.partId,
              score: 0
            };
          }
          partScores[pId].score += matchScore;
        });
      }
    });

    const sortedParts = Object.values(partScores)
      .sort((a, b) => b.score - a.score)
      .map(p => p.part)
      .slice(0, 3);

    res.status(200).json(sortedParts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addPartToRequest = async (req, res) => {
  try {
    const { partId, quantityUsed } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const part = await SparePart.findById(partId);
    if (!part) return res.status(404).json({ error: "Part not found" });

    const qty = quantityUsed || 1;
    if (part.quantityInStock < qty) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const existingIndex = request.partsUsed.findIndex(p => p.partId.toString() === partId);
    if (existingIndex > -1) {
      request.partsUsed[existingIndex].quantityUsed += qty;
    } else {
      request.partsUsed.push({ partId, quantityUsed: qty });
    }

    await request.save();

    part.quantityInStock -= qty;
    if (part.quantityInStock <= part.minReorderThreshold && part.reorderStatus === 'ok') {
      part.reorderStatus = 'low-stock';
    }
    await part.save();

    const io = req.app.get("socketio");
    if (io) {
      const updatedReq = await MaintenanceRequest.findById(request._id)
        .populate('equipment')
        .populate('team')
        .populate('assignedTo');
        
      // Ensure partsUsed is populated for the frontend to re-render properly if needed
      await updatedReq.populate('partsUsed.partId');
        
      await NotificationService.notifyRequestChange(io, "request_updated", updatedReq, `Part ${part.name} added and checked out.`);
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const isAuthorizedForRequest = (request, user) => {
  if (user.role === 'Admin' || user.role === 'Manager') return true;
  if (request.assignedToId && request.assignedToId.toString() === user._id.toString()) return true;
  if (request.createdById && request.createdById.toString() === user._id.toString()) return true;
  if (request.createdBy && request.createdBy.toString() === user._id.toString()) return true; 
  return false;
};

exports.uploadAttachments = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!isAuthorizedForRequest(request, req.user)) {
      return res.status(403).json({ error: "Not authorized to upload attachments for this request" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const bucket = getGridFSBucket();
    const uploadedFiles = [];

    for (const file of req.files) {
      const safeOriginalName = path.basename(file.originalname);
      const uniqueName = Date.now() + "-" + safeOriginalName.replace(/\s+/g, "-");

      const uploadStream = bucket.openUploadStream(uniqueName, {
        contentType: file.mimetype,
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(file.buffer, (error) => {
          if (error) return reject(error);
          resolve();
        });
      });

      // We need an ObjectId for the subdocument before saving so we can construct the URL
      const attachmentId = new mongoose.Types.ObjectId();

      uploadedFiles.push({
        _id: attachmentId,
        filename: uniqueName, // The GridFS filename
        fileUrl: `/api/requests/${request._id}/attachments/${attachmentId}`,
        fileType: file.mimetype,
      });
    }

    request.attachments = [...(request.attachments || []), ...uploadedFiles];
    await request.save();

    res.status(200).json(uploadedFiles);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.listAttachments = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    res.status(200).json(request.attachments || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const attachment = request.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });

    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename: attachment.filename }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found in GridFS" });
    }

    res.set('Content-Type', attachment.fileType);
    // Use inline to allow browser to view images/pdfs directly
    res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
    
    const downloadStream = bucket.openDownloadStreamByName(attachment.filename);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!isAuthorizedForRequest(request, req.user)) {
      return res.status(403).json({ error: "Not authorized to delete attachments for this request" });
    }

    const attachment = request.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ error: "Attachment not found" });

    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename: attachment.filename }).toArray();

    if (files && files.length > 0) {
      for (const f of files) {
        await bucket.delete(f._id);
      }
    }

    request.attachments.pull(req.params.attachmentId);
    await request.save();

    res.status(200).json({ message: "Attachment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
