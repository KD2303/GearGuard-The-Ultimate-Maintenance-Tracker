const {
  MaintenanceRequest,
  Equipment,
  MaintenanceTeam,
  TeamMember,
  SparePart,
  Tool,
  ToolAuditLog,
  Notification,
  Webhook,
  PurchaseOrder,
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

const calculateDowntimeCost = async (requestCreatedAt, completedDate, equipmentId, session = null) => {
  let downtimeDurationHours = 0;
  let totalDowntimeCost = 0;

  if (requestCreatedAt) {
    downtimeDurationHours = Math.max(0, (completedDate - new Date(requestCreatedAt)) / (1000 * 60 * 60));
  }

  let hourlyDowntimeCost = 0;
  if (equipmentId) {
    const query = Equipment.findById(equipmentId);
    if (session) query.session(session);
    const eq = await query;
    if (eq && eq.hourlyDowntimeCost) {
      hourlyDowntimeCost = eq.hourlyDowntimeCost;
    }
  }

  totalDowntimeCost = downtimeDurationHours * hourlyDowntimeCost;

  return { downtimeDurationHours, totalDowntimeCost };
};
const checkCertifications = async (assignedToId, requiredSkills, session = null) => {
  if (!assignedToId || !requiredSkills || requiredSkills.length === 0) return true;
  const tech = await TeamMember.findById(assignedToId).session(session);
  if (!tech) return false;
  const techCerts = tech.certifications || [];
  return requiredSkills.every(skill => {
    const cert = techCerts.find(c => c.skill === skill);
    return cert && cert.isValid && new Date(cert.expiresAt) > new Date();
  });
};

const decrementInventory = async (io, partsUsed, session) => {
  if (!partsUsed || !Array.isArray(partsUsed) || partsUsed.length === 0) return;
  for (const item of partsUsed) {
    const partId = item.partId?._id || item.partId;
    if (!partId) continue;
    
    // Atomic decrement prevents concurrency data loss and prevents negative stock
    const updatedPart = await SparePart.findOneAndUpdate(
      { _id: partId, quantityInStock: { $gte: item.quantityUsed } },
      { $inc: { quantityInStock: -item.quantityUsed } },
      { new: true, session }
    );

    if (!updatedPart) {
      const err = new Error(`Concurrency Conflict: Insufficient stock for part allocation (ID: ${partId}). Please refresh and try again.`);
      err.statusCode = 409;
      err.code = "INSUFFICIENT_STOCK";
      throw err;
    }

    if (updatedPart.quantityInStock <= updatedPart.minReorderThreshold) {
      if (updatedPart.reorderStatus === 'ok') {
        const finalPart = await SparePart.findByIdAndUpdate(
          partId, 
          { reorderStatus: 'low-stock' }, 
          { new: true, session }
        );
        
        // Auto-generate Purchase Order
        const quantityNeeded = Math.max(1, (updatedPart.optimalStockLevel || (updatedPart.minReorderThreshold * 2)) - updatedPart.quantityInStock);
        const poNumber = 'PO-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);
        
        // Ensure a supplier is set for the part, fallback to generic missing
        let supplierId = updatedPart.supplierId;
        if (!supplierId) {
          // If no supplier, we can't create a valid PO, so just notify
          console.warn(`Cannot create auto PO for part ${partId}: No supplier attached.`);
        } else {
          try {
            const newPO = new PurchaseOrder({
              poNumber,
              supplierId,
              items: [{
                partId: finalPart._id,
                quantityNeeded,
                unitCost: finalPart.unitCost || 0
              }],
              totalCost: quantityNeeded * (finalPart.unitCost || 0),
              status: 'draft',
              orderDate: new Date()
            });
            await newPO.save({ session });
          } catch (poErr) {
            console.error('Error auto-generating PurchaseOrder:', poErr);
          }
        }

        if (io) {
          NotificationService.notifyLowStock(io, finalPart).catch(err => console.error(err));
        }
      }
    } else if (updatedPart.reorderStatus !== 'ok') {
       await SparePart.findByIdAndUpdate(partId, { reorderStatus: 'ok' }, { session });
    }
  }
};

const releaseReservations = async (requiredParts, session) => {
  if (!requiredParts || !Array.isArray(requiredParts) || requiredParts.length === 0) return;
  for (const item of requiredParts) {
    const partId = item.partId?._id || item.partId;
    if (!partId) continue;
    await SparePart.findByIdAndUpdate(
      partId,
      { $inc: { quantityReserved: -item.quantityNeeded } },
      { new: true, session }
    );
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
    "clonedFromId",
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
      ids,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (ids) {
      query._id = { $in: ids.split(',') };
    }

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
            
          if (!payload.requiredSkills || payload.requiredSkills.length === 0) {
            if (equipmentDoc.requiredSkills && equipmentDoc.requiredSkills.length > 0) {
              payload.requiredSkills = equipmentDoc.requiredSkills;
            }
          }

          if (!payload.assignedToId && equipmentDoc.defaultTechnicianId) {
            const hasSkills = await checkCertifications(equipmentDoc.defaultTechnicianId, payload.requiredSkills, session);
            if (hasSkills) {
              payload.assignedToId = equipmentDoc.defaultTechnicianId;
            }
          }

          // Geospatial Technician Dispatch Routing
          if (payload.priority === 'urgent' && equipmentDoc.geoLocation && equipmentDoc.geoLocation.coordinates) {
            const eqCoords = equipmentDoc.geoLocation.coordinates;
            // Only search if coordinates are not [0,0]
            if (eqCoords[0] !== 0 || eqCoords[1] !== 0) {
              const query = {
                isActive: true,
                geoLocation: {
                  $near: {
                    $geometry: { type: 'Point', coordinates: eqCoords }
                  }
                }
              };
              if (payload.requiredSkills && payload.requiredSkills.length > 0) {
                query.certifications = { 
                  $all: payload.requiredSkills.map(skill => ({
                    $elemMatch: { skill, isValid: true, expiresAt: { $gt: new Date() } }
                  }))
                };
              }
              const nearestTech = await TeamMember.findOne(query).session(session);

              if (nearestTech) {
                payload.assignedToId = nearestTech._id;
                payload.teamId = nearestTech.teamId || payload.teamId;
                
                // Add a note to the ticket that it was auto-routed
                payload.description = `[SYSTEM AUTO-ROUTED] Assigned to closest technician ${nearestTech.name}.\n\n` + (payload.description || '');
              }
            }
          }

          await Equipment.findByIdAndUpdate(
            equipmentDoc._id,
            {
              $set: { status: "under-maintenance" }
            },
            { session }
          );

          await auditLog({
            entityType: 'Equipment',
            entityId: equipmentDoc._id,
            action: 'STATUS_CHANGE',
            description: `Status changed to under-maintenance due to new request ${requestNumber}`,
            userId: req.user?._id,
            userName: req.user?.name || "System"
          });
        }
      }

      let isBlocked = false;
      let estimatedPartsCost = 0;
      if (payload.requiredParts && payload.requiredParts.length > 0) {
        for (const reqPart of payload.requiredParts) {
          const partDoc = await SparePart.findById(reqPart.partId).session(session);
          if (partDoc) {
             estimatedPartsCost += (partDoc.unitCost || 0) * (reqPart.quantityNeeded || 1);
             const updatedPart = await SparePart.findOneAndUpdate(
               { 
                 _id: reqPart.partId,
                 $expr: { $gte: [{ $subtract: ["$quantityInStock", "$quantityReserved"] }, reqPart.quantityNeeded] }
               },
               {
                 $inc: { quantityReserved: reqPart.quantityNeeded }
               },
               { session, new: true }
             );
             if (!updatedPart) {
               isBlocked = true;
             }
          }
        }
      }
      
      if (payload.assignedToId) {
        const isCertified = await checkCertifications(payload.assignedToId, payload.requiredSkills, session);
        if (!isCertified) {
          throw new Error("Safety Violation: The assigned technician lacks the required certifications for this task.");
        }
      }

      payload.estimatedCost = estimatedPartsCost + (payload.expectedVendorQuote || 0);

      if (payload.estimatedCost >= 5000) {
        payload.stage = 'awaiting-approval';
        payload.approvalStatus = 'pending';
      }

      // Certification Check
      if (payload.assignedToId && payload.requiredCertifications && payload.requiredCertifications.length > 0) {
        const technician = await TeamMember.findById(payload.assignedToId).session(session);
        if (technician) {
          const techCerts = technician.certifications || [];
          const missingCerts = payload.requiredCertifications.filter(cert => {
            const found = techCerts.find(c => c.skill === cert);
            return !(found && found.isValid && new Date(found.expiresAt) > new Date());
          });
          if (missingCerts.length > 0) {
            const error = new Error(`Safety Compliance Error: Technician is missing required certifications (${missingCerts.join(', ')})`);
            error.status = 403;
            throw error;
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
    const status = error.status || 400;
    res.status(status).json({ error: error.message });
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

    // Detect Financial Tampering post-completion
    const isCompletedOrApproved = prevRequest.stage === 'repaired' || prevRequest.stage === 'scrap' || prevRequest.approvalStatus === 'approved';
    if (isCompletedOrApproved) {
      let partsCostChanged = false;
      let laborCostChanged = false;

      if ('partsCost' in payload && Number(payload.partsCost) !== Number(prevRequest.partsCost || 0)) {
        partsCostChanged = true;
      }
      if ('laborCost' in payload && Number(payload.laborCost) !== Number(prevRequest.laborCost || 0)) {
        laborCostChanged = true;
      }

      if (partsCostChanged || laborCostChanged) {
        const { auditLog } = require('../utils/auditLogger');
        await auditLog({
          entityType: 'MaintenanceRequest',
          entityId: prevRequest._id,
          action: 'FINANCIAL_TAMPERING',
          oldDoc: prevRequest,
          newDoc: { ...prevRequest.toObject(), partsCost: payload.partsCost, laborCost: payload.laborCost },
          userId: req.user?._id,
          userName: req.user?.name || 'System'
        });
        return res.status(403).json({ error: 'Financial tampering detected. Costs cannot be changed after a ticket is completed or approved.' });
      }
    }

    if (payload.assignedToId) {
      const reqSkills = payload.requiredSkills || prevRequest.requiredSkills;
      const isCertified = await checkCertifications(payload.assignedToId, reqSkills);
      if (!isCertified) {
        return res.status(403).json({ error: "Safety Violation: The assigned technician lacks the required certifications for this task." });
      }
    }

    const prevStage = prevRequest.stage;
    const prevPriority = prevRequest.priority;

    if (payload.priority && payload.priority !== prevPriority) {
      payload.slaDeadline = calculateSLA(payload.priority);
      payload.slaBreached = false;
      payload.slaNotified = false;
    }

    if (payload.stage === 'in-progress' && prevStage === 'new' && prevRequest.isBlockedAwaitingParts) {
       return res.status(400).json({ error: "Cannot start an in-progress ticket while blocked awaiting parts." });
    }

    // Certification Check
    const requiredCerts = payload.requiredCertifications || prevRequest.requiredCertifications || [];
    if (payload.assignedToId && requiredCerts.length > 0) {
      // If assignment hasn't changed, we could theoretically skip this, but it's safe to always check
      // in case requirements were added in the same update.
      const technician = await TeamMember.findById(payload.assignedToId);
      if (technician) {
        const techCerts = technician.certifications || [];
        const missingCerts = requiredCerts.filter(cert => {
          const found = techCerts.find(c => c.skill === cert);
          return !(found && found.isValid && new Date(found.expiresAt) > new Date());
        });
        if (missingCerts.length > 0) {
          return res.status(403).json({ error: `Safety Compliance Error: Technician is missing required certifications (${missingCerts.join(', ')})` });
        }
      }
    }
    let currentApprovalStatus = prevRequest.approvalStatus;
    let currentEstimatedCost = prevRequest.estimatedCost || 0;

    // Recalculate cost if parts or vendor quote changes
    if (payload.requiredParts || payload.expectedVendorQuote !== undefined) {
      const partsToUse = payload.requiredParts || prevRequest.requiredParts || [];
      let newPartsCost = 0;
      for (const reqPart of partsToUse) {
        const partDoc = await SparePart.findById(reqPart.partId);
        if (partDoc) {
          newPartsCost += (partDoc.unitCost || 0) * (reqPart.quantityNeeded || 1);
        }
      }
      currentEstimatedCost = newPartsCost + (payload.expectedVendorQuote !== undefined ? payload.expectedVendorQuote : (prevRequest.expectedVendorQuote || 0));
      payload.estimatedCost = currentEstimatedCost;
      
      if (currentEstimatedCost >= 5000 && currentApprovalStatus !== 'approved') {
        payload.stage = 'awaiting-approval';
        payload.approvalStatus = 'pending';
        currentApprovalStatus = 'pending';
      } else if (currentEstimatedCost < 5000 && currentApprovalStatus === 'pending') {
        if (prevRequest.stage === 'awaiting-approval' && !payload.stage) {
          payload.stage = 'new';
        }
        payload.approvalStatus = 'not-required';
        currentApprovalStatus = 'not-required';
      }
    }

    if (payload.stage === 'in-progress' && currentApprovalStatus === 'pending') {
      return res.status(403).json({ error: "Financial approval is required before work can begin on this high-cost ticket." });
    }

    // Handle stage side-effects (equipment status updates)
    if (payload.stage) {
      if (payload.stage === "repaired") {
        payload.completedDate = new Date();
        if (prevRequest.equipmentId) {
          await Equipment.findByIdAndUpdate(prevRequest.equipmentId, {
            $set: { status: "active" }
          });
          
          await auditLog({
            entityType: 'Equipment',
            entityId: prevRequest.equipmentId,
            action: 'REPAIR_COMPLETED',
            description: `Request marked as repaired. Status changed to active.`,
            userId: req.user?._id,
            userName: req.user?.name || "System"
          });
        }
      }
      if (payload.stage === "scrap") {
        payload.completedDate = new Date();
        if (prevRequest.equipmentId) {
          await Equipment.findByIdAndUpdate(prevRequest.equipmentId, {
            $set: { status: "scrapped" }
          });
          
          await auditLog({
            entityType: 'Equipment',
            entityId: prevRequest.equipmentId,
            action: 'SCRAPPED',
            description: `Request marked as scrap. Status changed to scrapped.`,
            userId: req.user?._id,
            userName: req.user?.name || "System"
          });
        }
      }
    }
    // Non-transactional block removed
    
    // NEW LOTO CHECK
    if (payload.stage === "in-progress" && prevStage !== "in-progress") {
      const prevRequestWithEq = await MaintenanceRequest.findById(req.params.id).populate('equipment');
      
      // GEO-FENCING VALIDATION
      if (prevRequestWithEq && prevRequestWithEq.equipment?.riskLevel === 'High Risk') {
        const lat = req.body.latitude;
        const lng = req.body.longitude;
        if (lat === undefined || lng === undefined) {
          return res.status(403).json({ error: "Location coordinates required to start High Risk equipment work order." });
        }

        if (prevRequestWithEq.equipment.latitude && prevRequestWithEq.equipment.longitude) {
          const deg2rad = (deg) => deg * (Math.PI / 180);
          const R = 6371; // Radius of the earth in km
          const dLat = deg2rad(prevRequestWithEq.equipment.latitude - lat);
          const dLon = deg2rad(prevRequestWithEq.equipment.longitude - lng);
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat)) * Math.cos(deg2rad(prevRequestWithEq.equipment.latitude)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
          const distanceInMeters = R * c * 1000;

          if (distanceInMeters > 500) {
            await auditLog({
              entityType: 'SecurityAudit',
              entityId: prevRequestWithEq._id,
              action: 'CREATE',
              userId: req.user?._id,
              userName: req.user?.name || "Unknown",
              newDoc: { event: 'GEO_FENCE_VIOLATION', distance: distanceInMeters, technicianCoords: { latitude: lat, longitude: lng } }
            });
            return res.status(403).json({ error: `Security Violation: You are ${Math.round(distanceInMeters)} meters away. Must be within 500m of equipment.` });
          }
        }
      }

      if (prevRequestWithEq && prevRequestWithEq.equipment?.lotoRequired) {
        if (!prevRequestWithEq.lotoAudit || !prevRequestWithEq.lotoAudit.isCompleted) {
          return res.status(400).json({ error: "LOTO Safety Audit is required before starting work on this equipment." });
        }
        
        const Tool = require('../models/Tool');
        let lotoToolFound = false;
        if (prevRequestWithEq.checkedOutTools && prevRequestWithEq.checkedOutTools.length > 0) {
          for (const t of prevRequestWithEq.checkedOutTools) {
            const tool = await Tool.findById(t.toolId);
            if (tool && tool.isLoto) {
              lotoToolFound = true;
              break;
            }
          }
        }
        if (!lotoToolFound) {
          return res.status(403).json({ error: "Safety Violation: You must check out a LOTO lock from the Tool Crib before beginning work on this equipment." });
        }
      }
    }
    
    const request = await withTransactionFallback(async (session) => {
      // Handle stage side-effects (equipment status updates)
      if (payload.stage) {
        if (payload.stage === "repaired" || payload.stage === "scrap") {
          // Approval check
          const totalCost = (payload.partsCost !== undefined ? Number(payload.partsCost) : Number(prevRequest.partsCost || 0)) + 
                            (payload.laborCost !== undefined ? Number(payload.laborCost) : Number(prevRequest.laborCost || 0));
                            
          if (prevRequest.approvalStatus !== 'approved' && totalCost > 1000) {
            if (totalCost > 5000) {
              payload.approvalStatus = 'pending_tier2';
            } else {
              payload.approvalStatus = 'pending_tier1';
            }
            payload.stage = 'in-progress'; // Keep it in progress
            
            await MaintenanceRequest.findByIdAndUpdate(req.params.id, payload, { session });
            
            throw new Error(`High-cost repairs require management approval. The ticket has been flagged for approval and remains in-progress. Required Tier: ${payload.approvalStatus}`);
          }

          payload.completedDate = new Date();
          const { downtimeDurationHours, totalDowntimeCost } = await calculateDowntimeCost(
            prevRequest.createdAt, payload.completedDate, prevRequest.equipmentId, session
          );
          payload.downtimeDurationHours = downtimeDurationHours;
          payload.totalDowntimeCost = totalDowntimeCost;
        }

        if (payload.stage === "repaired") {
          if (prevRequest.equipmentId) {
            await Equipment.findByIdAndUpdate(
              prevRequest.equipmentId,
              {
                $set: { status: "active" }
              },
              { session }
            );
            await auditLog({
              entityType: 'Equipment',
              entityId: prevRequest.equipmentId,
              action: 'STATUS_CHANGE',
              description: `Status changed to active as request ${prevRequest.subject || prevRequest.requestNumber} was marked repaired`,
              userId: req.user?._id,
              userName: req.user?.name || "System"
            });
          }
        }
        if (payload.stage === "scrap") {
          if (prevRequest.equipmentId) {
            await Equipment.findByIdAndUpdate(
              prevRequest.equipmentId,
              {
                $set: { status: "scrapped" }
              },
              { session }
            );
            await auditLog({
              entityType: 'Equipment',
              entityId: prevRequest.equipmentId,
              action: 'STATUS_CHANGE',
              description: `Status changed to scrapped as request ${prevRequest.subject || prevRequest.requestNumber} was marked scrap`,
              userId: req.user?._id,
              userName: req.user?.name || "System"
            });
          }
        }
      }

      const isCompleted = prevStage === "repaired" || prevStage === "scrap";
      const nowCompleted = payload.stage === "repaired" || payload.stage === "scrap";
      const shouldProcessCompletion = payload.stage && nowCompleted && !isCompleted && !prevRequest.completionProcessed;
      
      if (shouldProcessCompletion) {
        payload.completionProcessed = true;
      }

      const reqDoc = await MaintenanceRequest.findById(req.params.id).session(session);
      if (!reqDoc) throw new Error("Request not found during update");
      
      if ('__v' in payload) {
        reqDoc.__v = payload.__v;
      }
      
      Object.assign(reqDoc, payload);
      await reqDoc.save({ session });

      const updatedReq = await MaintenanceRequest.findById(req.params.id)
        .session(session)
        .populate("equipment")
        .populate("createdBy", "name email");

      if (shouldProcessCompletion) {
        const io = req.app.get("socketio");
        await decrementInventory(io, updatedReq.partsUsed, session);
        await releaseReservations(updatedReq.requiredParts, session);
      }

      return updatedReq;
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

    // The final redundant findByIdAndUpdate and priority logic was moved/removed.

    const isCompleted = prevStage === "repaired" || prevStage === "scrap";
    const nowCompleted = request.stage === "repaired" || request.stage === "scrap";
    const shouldProcessCompletion = request.stage && nowCompleted && !isCompleted && !request.completionProcessed;

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
    if (error.name === 'VersionError') {
      // Find the current version of the document from the DB to send back for merging
      const currentDoc = await MaintenanceRequest.findById(req.params.id);
      return res.status(409).json({
        error: "Conflict: This ticket was modified by someone else while you were editing.",
        dbVersion: currentDoc,
        clientVersion: req.body
      });
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(400).json({ error: error.message });
  }
};

// Update request stage (for Kanban drag-and-drop)
exports.updateRequestStage = async (req, res) => {
  try {
    const { stage, partsCost, laborCost, latitude, longitude, __v, syncId } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("equipment")
      .populate("createdBy", "name email")
      .populate("partsUsed.partId");

    if (!request) return res.status(404).json({ error: "Request not found" });

    // Idempotency Check for Sync Retries
    if (syncId && request.syncId === syncId) {
      console.log(`[Idempotency] Request ${request._id} was already updated with syncId ${syncId}. Returning 200 OK.`);
      return res.status(200).json(request);
    }

    // Authorization Check
    const isAuthorized = 
      req.user.role === 'Admin' || 
      req.user.role === 'Manager' || 
      (req.user.role === 'Technician' && request.assignedToId?.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to change the stage of this request' });
    }

    const prevStage = request.stage;

    if (stage === 'in-progress' && request.approvalStatus === 'pending') {
      return res.status(403).json({ error: "Financial approval is required before work can begin on this high-cost ticket." });
    }

    if (stage === 'in-progress' && prevStage === 'new' && request.isBlockedAwaitingParts) {
       return res.status(400).json({ error: "Cannot start an in-progress ticket while blocked awaiting parts." });
    }

    // GEO-FENCING VALIDATION
    if (stage === 'in-progress' && request.equipment && request.equipment.riskLevel === 'High Risk') {
      if (latitude === undefined || longitude === undefined) {
        return res.status(403).json({ error: "Location coordinates required to start High Risk equipment work order." });
      }

      if (request.equipment.latitude && request.equipment.longitude) {
        const deg2rad = (deg) => deg * (Math.PI / 180);
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(request.equipment.latitude - latitude);
        const dLon = deg2rad(request.equipment.longitude - longitude);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(request.equipment.latitude)) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        const distanceInMeters = R * c * 1000;

        if (distanceInMeters > 500) {
          // Log security audit event
          await auditLog({
            entityType: 'SecurityAudit',
            entityId: request._id,
            action: 'CREATE',
            userId: req.user?._id,
            userName: req.user?.name || "Unknown",
            newDoc: { event: 'GEO_FENCE_VIOLATION', distance: distanceInMeters, technicianCoords: { latitude, longitude } }
          });
          return res.status(403).json({ error: `Security Violation: You are ${Math.round(distanceInMeters)} meters away. Must be within 500m of equipment.` });
        }
      }
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

    if (stage === "in-progress" && request.equipment?.lotoRequired) {
      if (!request.lotoAudit || !request.lotoAudit.isCompleted) {
        return res.status(400).json({ error: "LOTO Safety Audit is required before starting work on this equipment." });
      }
      
      const Tool = require('../models/Tool');
      let lotoToolFound = false;
      if (request.checkedOutTools && request.checkedOutTools.length > 0) {
        for (const t of request.checkedOutTools) {
          const tool = await Tool.findById(t.toolId);
          if (tool && tool.isLoto) {
            lotoToolFound = true;
            break;
          }
        }
      }
      if (!lotoToolFound) {
        return res.status(403).json({ error: "Safety Violation: You must check out a LOTO lock from the Tool Crib before beginning work on this equipment." });
      }
    }
    
    if (stage === "repaired" || stage === "scrap") {
      if (request.checkedOutTools && request.checkedOutTools.length > 0) {
        return res.status(400).json({ error: "Cannot close ticket. All tools must be returned first." });
      }
    }

    const isCompleted = prevStage === "repaired" || prevStage === "scrap";
    const nowCompleted = stage === "repaired" || stage === "scrap";
    const shouldProcessCompletion = nowCompleted && !isCompleted && !request.completionProcessed;

    const updateData = { stage };
    if (partsCost !== undefined) updateData.partsCost = partsCost;
    if (laborCost !== undefined) updateData.laborCost = laborCost;
    if (syncId) updateData.syncId = syncId;

    if (shouldProcessCompletion) {
      updateData.completionProcessed = true;
    }

    // Check Approval Thresholds if stage is being completed
    if (stage === "repaired" || stage === "scrap") {
      const totalCost = (partsCost !== undefined ? Number(partsCost) : Number(request.partsCost || 0)) + 
                        (laborCost !== undefined ? Number(laborCost) : Number(request.laborCost || 0));
                        
      if (request.approvalStatus !== 'approved' && totalCost > 1000) {
        if (totalCost > 5000) {
          updateData.approvalStatus = 'pending_tier2';
        } else {
          updateData.approvalStatus = 'pending_tier1';
        }
        updateData.stage = 'in-progress'; // Keep it in progress
        if (__v !== undefined) request.__v = __v;
        Object.assign(request, updateData);
        await request.save();
        return res.status(403).json({ 
          error: "High-cost repairs require management approval. The ticket has been flagged for approval and remains in-progress.",
          requiresApproval: true
        });
      }
    }

    if (stage === "repaired" || stage === "scrap") {
      updateData.completedDate = new Date();
      const { downtimeDurationHours, totalDowntimeCost } = await calculateDowntimeCost(
        request.createdAt, updateData.completedDate, request.equipmentId
      );
      updateData.downtimeDurationHours = downtimeDurationHours;
      updateData.totalDowntimeCost = totalDowntimeCost;
    }

    await withTransactionFallback(async (session) => {
      if (__v !== undefined) request.__v = __v;
      Object.assign(request, updateData);
      await request.save({ session });

      if (stage === "repaired" || stage === "scrap") {
        if (request.equipmentId) {
          const newStatus = stage === "scrap" ? "scrapped" : "active";
          await Equipment.findByIdAndUpdate(request.equipmentId, {
            $set: { status: newStatus }
          }, { session });

          await auditLog({
            entityType: 'Equipment',
            entityId: request.equipmentId,
            action: stage === "scrap" ? 'SCRAPPED' : 'REPAIR_COMPLETED',
            description: `Request stage updated to ${stage}. Status changed to ${newStatus}.`,
            userId: req.user?._id,
            userName: req.user?.name || "System"
          });
        }
      }

      if (shouldProcessCompletion) {
        const io = req.app.get("socketio");
        await decrementInventory(io, request.partsUsed, session);
        await releaseReservations(request.requiredParts, session);
      }
    });

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
    if (error.name === 'VersionError') {
      console.error("OCC VersionError:", error.message, error);
      const currentDoc = await MaintenanceRequest.findById(req.params.id);
      return res.status(409).json({
        error: "Conflict: This ticket was modified by someone else while you were offline.",
        dbVersion: currentDoc,
        clientVersion: req.body
      });
    }
    console.error("Other Error:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
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

    const bucket = getGridFSBucket();

    // 1. Delete standard attachments
    if (request.attachments && request.attachments.length > 0) {
      for (const attachment of request.attachments) {
        if (attachment.filename) {
          const files = await bucket.find({ filename: attachment.filename }).toArray();
          for (const f of files) {
            await bucket.delete(f._id);
          }
        }
      }
    }

    // 2. Delete audio logs attached to comments (if they exist as GridFS filenames)
    if (request.comments && request.comments.length > 0) {
      for (const comment of request.comments) {
        if (comment.audioUrl && comment.audioUrl.includes('audio-')) {
          const filename = comment.audioUrl.split('/').pop();
          if (filename) {
            const files = await bucket.find({ filename: filename }).toArray();
            for (const f of files) {
              await bucket.delete(f._id);
            }
          }
        }
      }
    }

    await withTransactionFallback(async (session) => {
      // Revert equipment status to active if deleting a non-completed request
      if (request.equipmentId && request.stage !== 'repaired' && request.stage !== 'scrap') {
        await Equipment.findByIdAndUpdate(
          request.equipmentId,
          {
            $set: { status: "active" }
          },
          { session }
        );
        
        await auditLog({
          entityType: 'Equipment',
          entityId: request.equipmentId,
          action: 'STATUS_CHANGE',
          description: `Status reverted to active as request ${request.subject || request.requestNumber} was deleted`,
          userId: req.user?._id,
          userName: req.user?.name || "System"
        });
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
      costByCategory,
      topExpensiveMachines,
      costByDepartment,
      moneySavedResult
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
      ]),
      // 10. Top Expensive Machines
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
            _id: "$equipmentDoc.name",
            value: { $sum: "$totalDowntimeCost" }
          }
        },
        { $project: { _id: 0, name: "$_id", value: 1 } },
        { $sort: { value: -1 } },
        { $limit: 5 }
      ]),
      // 11. Cost by Department
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
            _id: "$equipmentDoc.department",
            value: { $sum: "$totalDowntimeCost" }
          }
        },
        { $project: { _id: 0, department: { $ifNull: ["$_id", "Unassigned"] }, value: 1 } },
        { $sort: { value: -1 } }
      ]),
      // 12. Money Saved (Time saved * hourly cost)
      MaintenanceRequest.aggregate([
        {
          $match: {
            ...rangeMatch,
            stage: { $in: ["repaired", "scrap"] },
            completedDate: { $ne: null },
            scheduledDate: { $ne: null }
          }
        },
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
          $project: {
            timeSavedMs: { $subtract: ["$scheduledDate", "$completedDate"] },
            hourlyCost: "$equipmentDoc.hourlyDowntimeCost"
          }
        },
        {
          $match: {
            timeSavedMs: { $gt: 0 },
            hourlyCost: { $gt: 0 }
          }
        },
        {
          $project: {
            moneySaved: {
              $multiply: [
                { $divide: ["$timeSavedMs", 3600000] }, // ms to hours
                "$hourlyCost"
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalMoneySaved: { $sum: "$moneySaved" }
          }
        }
      ])
    ]);

    const avgResolutionMs = mttrResult[0]?.avgResolutionMs || 0;
    const mttrHours = avgResolutionMs ? avgResolutionMs / (1000 * 60 * 60) : 0;
    const overdueRate = totalRequests ? (overdueRequests / totalRequests) * 100 : 0;
    const totalFinancialLoss = financialLossResult[0]?.totalCost || 0;
    const moneySaved = moneySavedResult[0]?.totalMoneySaved || 0;

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
        moneySaved: Number(moneySaved.toFixed(2)),
      },
      charts: {
        stageBreakdown,
        typeBreakdown,
        trend: trendData,
        costByCategory,
        costByDepartment,
        topExpensiveMachines
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

    const TranslationService = require("../services/translationService");
    const { content, audioUrl, audioDuration, sourceLanguage } = req.body;
    
    let finalContent = content || "";
    if (finalContent && sourceLanguage && sourceLanguage !== 'en-US') {
      finalContent = await TranslationService.translateToEnglish(finalContent, sourceLanguage);
    }

    const newComment = {
      authorId: req.user.id,
      authorName: req.user.name,
      content: finalContent,
      audioUrl: audioUrl,
      audioDuration: audioDuration,
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

exports.smartAssignInternal = async (requestId, io) => {
  const request = await MaintenanceRequest.findById(requestId);
  if (!request) {
    throw new Error("Request not found");
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
    throw new Error("Could not determine required specialization or team for this request. Please assign a team manually.");
  }

  // 2. Find All Active Technicians in these Teams
  let technicians = await TeamMember.find({ teamId: { $in: teamIds }, isActive: true });

  if (request.requiredCertifications && request.requiredCertifications.length > 0) {
    technicians = technicians.filter(tech => {
      const techCerts = tech.certifications || [];
      return request.requiredCertifications.every(cert => {
        const found = techCerts.find(c => c.skill === cert);
        return found && found.isValid && new Date(found.expiresAt) > new Date();
      });
      return request.requiredCertifications.every(cert => techCerts.includes(cert));
    });
  }
  

  if (request.requiredSkills && request.requiredSkills.length > 0) {
    technicians = technicians.filter(tech => {
      const techCerts = tech.certifications || [];
      return request.requiredSkills.every(skill => {
        const found = techCerts.find(c => c.skill === skill);
        return found && found.isValid && new Date(found.expiresAt) > new Date();
      });
    });
  }

  // Extract skills from text
  const textToAnalyze = ((request.subject || '') + ' ' + (request.description || '')).toLowerCase();
  
  // Find all unique skills among these technicians
  const allAvailableSkills = new Set();
  technicians.forEach(tech => {
    (tech.skills || []).forEach(skill => allAvailableSkills.add(skill.toLowerCase()));
  });

  // Which of these skills are actually mentioned in the request?
  const requiredImplicitSkills = Array.from(allAvailableSkills).filter(skill => textToAnalyze.includes(skill));

  if (requiredImplicitSkills.length > 0) {
    // Filter technicians to those who have AT LEAST ONE of the required implicit skills
    technicians = technicians.filter(tech => {
      const techSkills = (tech.skills || []).map(s => s.toLowerCase());
      return requiredImplicitSkills.some(reqSkill => techSkills.includes(reqSkill));
    });
  }

  if (technicians.length === 0) {
    throw new Error("No active technicians found possessing the required safety certifications for this request. Please assign manually or update certifications.");
    // Assign to Fallback Queue / Manager
    request.assignedToId = null;
    request.stage = 'new';
    await request.save();
    throw new Error("No skilled worker is available for the specialized tasks identified in this request. It has been routed to the Fallback Queue.");
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
          let weight = 1;
          if (r.priority === 'urgent') weight = 3;
          else if (r.priority === 'high') weight = 2;
          else if (r.priority === 'low') weight = 0.5;
          
          workloadMap[techIdStr] += weight;
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
  // Urgent requests bypass the MAX_WORKLOAD hard cap to prevent critical breakdowns from blocking
  const MAX_WORKLOAD = 5;
  if (minWorkload >= MAX_WORKLOAD && request.priority !== 'urgent') {
    throw new Error(`All qualified technicians for specialization "${targetSpecialization || 'this team'}" are at maximum workload capacity (${MAX_WORKLOAD}+ active tickets). Please assign manually.`);
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
    userId: null,
    userName: "System Auto-Assigner"
  });

  // 9. Emit Socket.io update
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

  return updatedRequest;
};

exports.smartAssignRequest = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    const updatedRequest = await exports.smartAssignInternal(req.params.id, io);
    res.status(200).json(updatedRequest);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
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
    
    await withTransactionFallback(async (session) => {
      const request = await MaintenanceRequest.findById(req.params.id).session(session);
      if (!request) {
        const err = new Error("Request not found");
        err.statusCode = 404;
        throw err;
      }

      const qty = quantityUsed || 1;

      // Use findOneAndUpdate to atomically check and decrement stock to prevent race conditions
      const updatedPart = await SparePart.findOneAndUpdate(
        { _id: partId, quantityInStock: { $gte: qty } },
        { $inc: { quantityInStock: -qty } },
        { new: true, session }
      );

      if (!updatedPart) {
        // Check if the part exists to return an appropriate error
        const partExists = await SparePart.findById(partId).session(session);
        if (!partExists) {
          const err = new Error("Part not found");
          err.statusCode = 404;
          throw err;
        }
        const conflictErr = new Error("Concurrency Conflict: This spare part ran out of stock midway. Please refresh and try again.");
        conflictErr.statusCode = 409;
        throw conflictErr;
      }

      const existingIndex = request.partsUsed.findIndex(p => p.partId.toString() === partId);
      if (existingIndex > -1) {
        request.partsUsed[existingIndex].quantityUsed += qty;
      } else {
        request.partsUsed.push({ partId, quantityUsed: qty });
      }

      await request.save({ session });

      if (updatedPart.quantityInStock <= updatedPart.minReorderThreshold && updatedPart.reorderStatus === 'ok') {
        updatedPart.reorderStatus = 'low-stock';
        await updatedPart.save({ session });
      }
    });

    const request = await MaintenanceRequest.findById(req.params.id);

    const io = req.app.get("socketio");
    if (io) {
      const updatedReq = await MaintenanceRequest.findById(request._id)
        .populate('equipment')
        .populate('team')
        .populate('assignedTo');
        
      // Ensure partsUsed is populated for the frontend to re-render properly if needed
      await updatedReq.populate('partsUsed.partId');
        
      const addedPart = updatedReq.partsUsed.find(p => p.partId._id.toString() === partId)?.partId;
      await NotificationService.notifyRequestChange(io, "request_updated", updatedReq, `Part ${addedPart?.name || 'added'} added and checked out.`);
    }

    res.status(200).json(request);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.submitLOTO = async (req, res) => {
  try {
    const { checklistResponses, proofImageUrl } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id).populate('equipment');
    
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (!request.equipment?.lotoRequired) {
      return res.status(400).json({ error: "LOTO is not required for this equipment." });
    }

    request.lotoAudit = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: req.user?._id,
      proofImageUrl,
      checklistResponses
    };

    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeLOTO = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!request.lotoAudit || !request.lotoAudit.isCompleted) {
      return res.status(400).json({ error: "LOTO has not been applied yet." });
    }

    request.lotoAudit.lotoRemoved = true;
    request.lotoAudit.removedAt = new Date();

    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkoutTool = async (req, res) => {
  let lock;
  try {
    const { toolId } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const io = req.app.get("socketio");

    // Acquire lock for this specific tool for 5 seconds
    lock = await redlock.acquire([`tools:checkout:${toolId}`], 5000);

    // Alert UI instantly to disable checkout buttons for this tool
    if (io) {
      io.emit('tool_locked', { toolId });
    }

    // Atomic update
    const tool = await Tool.findOneAndUpdate(
      { _id: toolId, status: 'Available' },
      { status: 'Checked Out' },
      { new: true }
    );
    
    if (!tool) {
      if (io) io.emit('tool_unlocked', { toolId });
      return res.status(400).json({ error: "Tool is not available for checkout or does not exist" });
    }

    request.checkedOutTools.push({ toolId: tool._id, checkedOutAt: new Date() });
    await request.save();

    // Create Audit Log
    await ToolAuditLog.create({
      toolId: tool._id,
      action: 'Checkout',
      performedBy: req.user ? req.user._id : request.createdById, // fallback to createdById if user is not available
      associatedRequestId: request._id,
      metadata: { timestamp: new Date() }
    });

    if (io) {
      io.emit('tools_changed'); // Global update
      io.emit('tool_unlocked', { toolId });
    }

    const updatedReq = await MaintenanceRequest.findById(request._id)
      .populate('checkedOutTools.toolId');

    res.status(200).json(updatedReq);
  } catch (error) {
    if (error.name === 'ExecutionError') {
      // Redlock error
      return res.status(423).json({ error: "Tool is currently being processed by another user. Please try again." });
    }
    res.status(500).json({ error: error.message });
  } finally {
    if (lock) {
      try {
        await lock.release();
      } catch (e) {
        console.error('[Redlock] Failed to release lock', e);
      }
    }
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

exports.returnTool = async (req, res) => {
  let lock;
  try {
    const { toolId } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id).populate('equipment');
    if (!request) return res.status(404).json({ error: "Request not found" });

    const Tool = require('../models/Tool');
    const toolToCheck = await Tool.findById(toolId);
    if (toolToCheck && toolToCheck.isLoto) {
      if (request.stage === "in-progress" && request.equipment && request.equipment.lotoRequired) {
        return res.status(403).json({ error: "Safety Violation: You cannot return a LOTO lock while the high-risk ticket is still in-progress. Change the ticket stage first." });
      }
    }

    // Acquire lock for this specific tool for 5 seconds
    lock = await redlock.acquire([`tools:checkout:${toolId}`], 5000);

    request.checkedOutTools = request.checkedOutTools.filter(t => t.toolId.toString() !== toolId);
    await request.save();

    const tool = await Tool.findOneAndUpdate(
      { _id: toolId },
      { status: 'Available' },
      { new: true }
    );

    // Create Audit Log
    await ToolAuditLog.create({
      toolId: toolId,
      action: 'Return',
      performedBy: req.user ? req.user._id : request.createdById, // fallback
      associatedRequestId: request._id,
      metadata: { timestamp: new Date() }
    });

    const io = req.app.get("socketio");
    if (io) {
      io.emit('tools_changed');
    }

    const updatedReq = await MaintenanceRequest.findById(request._id)
      .populate('checkedOutTools.toolId');

    res.status(200).json(updatedReq);
  } catch (error) {
    if (error.name === 'ExecutionError') {
      return res.status(423).json({ error: "Tool is currently being processed by another user. Please try again." });
    }
    res.status(500).json({ error: error.message });
  } finally {
    if (lock) {
      try {
        await lock.release();
      } catch (e) {
        console.error('[Redlock] Failed to release lock', e);
      }
    }
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

exports.escalateToVendor = async (req, res) => {
  try {
    const { vendorEmail, vendorCompany, message } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Generate signed JWT token expiring in 72 hours
    const jwt = require('jsonwebtoken');
    const magicToken = jwt.sign(
      { requestId: request._id },
      process.env.JWT_SECRET || 'fallback_secret_for_vendor',
      { expiresIn: '72h' }
    );
    const tokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    request.vendorEscalation = {
      isEscalated: true,
      vendorEmail,
      vendorCompany,
      message,
      magicToken,
      tokenExpiresAt
    };

    await request.save();

    res.status(200).json({ 
      message: "Escalated to vendor successfully", 
      magicLink: `/vendor/portal/${magicToken}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cannibalize a part from another equipment
exports.cannibalizePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { donorEquipmentId, partId, quantity = 1 } = req.body;

    if (!donorEquipmentId || !partId) {
      return res.status(400).json({ error: "donorEquipmentId and partId are required" });
    }

    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (!request.isBlockedAwaitingParts) {
      return res.status(400).json({ error: "Request is not currently blocked awaiting parts" });
    }

    const partIndex = request.requiredParts.findIndex(p => p.partId.toString() === partId);
    if (partIndex === -1) {
      return res.status(400).json({ error: "Part is not required for this request" });
    }

    const donorEquipment = await Equipment.findById(donorEquipmentId).populate("maintenanceTeam");
    if (!donorEquipment) {
      return res.status(404).json({ error: "Donor equipment not found" });
    }

    const part = await SparePart.findById(partId);
    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }

    // 1. Remove from requiredParts and add to partsUsed with cannibalizedFrom
    const requiredQty = request.requiredParts[partIndex].quantityNeeded;
    if (quantity >= requiredQty) {
      request.requiredParts.splice(partIndex, 1);
    } else {
      request.requiredParts[partIndex].quantityNeeded -= quantity;
    }

    const usedPartIndex = request.partsUsed.findIndex(p => p.partId.toString() === partId && p.cannibalizedFrom?.toString() === donorEquipmentId);
    if (usedPartIndex > -1) {
      request.partsUsed[usedPartIndex].quantityUsed += quantity;
    } else {
      request.partsUsed.push({
        partId,
        quantityUsed: quantity,
        cannibalizedFrom: donorEquipmentId
      });
    }

    // If no more parts are required, unblock the ticket
    if (request.requiredParts.length === 0) {
      request.isBlockedAwaitingParts = false;
    }

    await request.save();

    // 2. Create a new sub-ticket for the donor equipment
    const newRequest = await MaintenanceRequest.create({
      requestNumber: `REQ-${Date.now()}`,
      subject: `Cannibalize: Remove ${part.name}`,
      description: `Remove ${part.name} (Qty: ${quantity}) from this equipment. This part was cannibalized to fulfill ${request.requestNumber}.`,
      type: 'corrective',
      stage: 'new',
      priority: 'high',
      equipmentId: donorEquipmentId,
      teamId: donorEquipment.maintenanceTeamId || request.teamId,
      assignedToId: request.assignedToId,
      createdById: req.user?._id,
      isBlockedAwaitingParts: true,
      requiredParts: [{
        partId: part._id,
        quantityNeeded: quantity
      }]
    });

    res.status(200).json({
      success: true,
      message: "Part cannibalized successfully",
      data: {
        originalRequest: request,
        donorRequest: newRequest
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Approve Request Costs
exports.approveRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: "Not authorized to approve financial requests." });
    }

    if (!request.approvalStatus || !request.approvalStatus.startsWith('pending')) {
      return res.status(400).json({ error: "Request is not pending approval." });
    }

    // Authorization: Manager can approve Tier 1. Admin can approve Tier 1 & Tier 2.
    if (request.approvalStatus === 'pending_tier1' && !['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ error: "Manager or Admin approval required for Tier 1." });
    }
    if (request.approvalStatus === 'pending_tier2' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Admin approval required for Tier 2." });
    }

    const previousTier = request.approvalStatus.replace('pending_', '');
    request.approvalStatus = 'approved';
    if (!request.approvalHistory) request.approvalHistory = [];
    request.approvalHistory.push({
      tier: previousTier === 'pending' ? 'standard' : previousTier,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comments: req.body.comments || "Approved",
      status: 'approved'
    });
    
    request.approvedBy = req.user._id;
    request.approvalDate = new Date();
    request.stage = 'in-progress'; 
    request.approvalStatus = 'approved';
    request.approvedBy = req.user._id;
    request.approvalDate = new Date();
    request.stage = 'new'; // unlock it back to 'new' so work can begin

    request.approvedBy = req.user._id;
    request.approvalDate = new Date();
    request.stage = 'new'; // unlock it back to 'new' so work can begin

    await request.save();

    const io = req.app.get("socketio");
    if (io) {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyRequestChange(io, "request_updated", request, `Financial approval granted by ${req.user.name}.`);
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Reject Request Costs
exports.rejectRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (!['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized to reject requests." });
    }

    if (!request.approvalStatus || !request.approvalStatus.startsWith('pending')) {
      return res.status(400).json({ error: "Request is not pending approval." });
    }

    const previousTier = request.approvalStatus.replace('pending_', '');
    request.approvalStatus = 'rejected';
    request.stage = 'new'; // unlock it back to 'new' but maybe they should just modify parts
    if (!request.approvalHistory) request.approvalHistory = [];
    request.approvalHistory.push({
      tier: previousTier === 'pending' ? 'standard' : previousTier,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comments: req.body.comments || "Rejected",
      status: 'rejected'
    });

    request.approvalStatus = 'rejected';
    request.stage = 'new';
    
    if (!request.approvalHistory) request.approvalHistory = [];
    request.approvalHistory.push({
      tier: previousTier === 'pending' ? 'standard' : previousTier,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comments: req.body.comments || "Rejected",
      status: 'rejected'
    });

    await request.save();

    const io = req.app.get("socketio");
    if (io) {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyRequestChange(io, "request_updated", request, `Financial approval rejected by ${req.user.name}.`);
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkload = async (req, res) => {
  try {
    const workload = await MaintenanceRequest.aggregate([
      {
        $match: {
          stage: { $in: ['new', 'in-progress'] },
          assignedToId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedToId',
          openTicketsCount: { $sum: 1 },
          highPriorityCount: {
            $sum: { $cond: [{ $in: ['$priority', ['high', 'urgent']] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'teammembers',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      {
        $unwind: '$technician'
      },
      {
        $project: {
          _id: 0,
          technicianId: '$_id',
          technicianName: '$technician.name',
          technicianEmail: '$technician.email',
          technicianAvatar: '$technician.avatar',
          openTicketsCount: 1,
          highPriorityCount: 1,
          isFatigued: { $gte: ['$openTicketsCount', 4] }
        }
      },
      {
        $sort: { openTicketsCount: -1 }
      }
    ]);
    
    res.json(workload);
  } catch (error) {
    console.error('Workload Aggregation Error:', error);
    res.status(500).json({ message: 'Failed to fetch technician workload' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const leaderboard = await MaintenanceRequest.aggregate([
      {
        $match: {
          stage: { $in: ['repaired', 'scrap'] },
          completedDate: { $gte: sevenDaysAgo },
          assignedToId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedToId',
          totalClosed: { $sum: 1 },
          avgResolutionTimeMs: {
            $avg: {
              $subtract: [
                { $ifNull: ['$completedDate', new Date()] },
                '$createdAt'
              ]
            }
          }
        }
      },
      {
        $sort: { totalClosed: -1, avgResolutionTimeMs: 1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error fetching leaderboard" });
  }
};

exports.getRootCauseAnalytics = async (req, res) => {
  try {
    const data = await MaintenanceRequest.aggregate([
      {
        $match: {
          rootCause: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $lookup: {
          from: 'teammembers',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      {
        $unwind: '$technician'
      },
      {
        $project: {
          _id: 0,
          technicianId: '$_id',
          technicianName: '$technician.name',
          technicianEmail: '$technician.email',
          technicianAvatar: '$technician.avatar',
          totalClosed: 1,
          avgResolutionTimeHours: { $divide: ['$avgResolutionTimeMs', 3600000] }
        }
      },
      {
        $sort: { totalClosed: -1, avgResolutionTimeHours: 1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard Aggregation Error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard data' });
  }
};

exports.escalateToVendor = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('equipmentId');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { vendorEmail, vendorCompany, message } = req.body;
    if (!vendorEmail || !vendorCompany) {
      return res.status(400).json({ error: 'Vendor email and company are required' });
    }

    // Update Request Schema
    request.vendorEscalation = {
      isEscalated: true,
      vendorEmail,
      vendorCompany,
      message,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    await request.save();

    // Send the email
    const NotificationService = require('../services/notificationService');
    const emailHtml = NotificationService.vendorEscalationTemplate(request, request.equipmentId, message);
    
    await NotificationService.sendEmail(
      vendorEmail, 
      `[ESCALATION] Maintenance Required: ${request.equipmentId?.name || 'Equipment'} (${request.requestNumber})`, 
      emailHtml
    );

    res.json({ message: 'Successfully escalated to vendor', request });
  } catch (error) {
    console.error('Vendor Escalation Error:', error);
    res.status(500).json({ error: error.message });
          from: 'equipments',
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      {
        $unwind: '$equipment'
      },
      {
        $group: {
          _id: {
            category: '$equipment.category',
            rootCause: '$rootCause'
          },
          count: { $sum: 1 },
          requestIds: { $push: '$_id' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          children: {
            $push: {
              name: '$_id.rootCause',
              value: '$count',
              requestIds: '$requestIds'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          children: 1
        }
      }
    ]);

    res.json({ name: 'Root Cause Analysis', children: data });
  } catch (error) {
    console.error('Root Cause Analytics Error:', error);
    res.status(500).json({ message: 'Failed to fetch root cause analytics' });
  }
};
