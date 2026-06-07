const MaintenanceRequest = require('../models/MaintenanceRequest');

// Middleware to authenticate via magic token
exports.authenticateVendorToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(401).json({ error: "No token provided" });

    // Find the request with this token, ensuring we select the hidden magicToken field to check
    const request = await MaintenanceRequest.findOne({ 'vendorEscalation.magicToken': token })
                                            .select('+vendorEscalation.magicToken')
                                            .populate('equipmentId');

    if (!request) {
      return res.status(404).json({ error: "Invalid token or ticket not found" });
    }

    // Check expiration
    if (request.vendorEscalation.tokenExpiresAt && new Date() > request.vendorEscalation.tokenExpiresAt) {
      return res.status(403).json({ error: "Link expired" });
    }

    req.vendorTicket = request;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVendorTicket = async (req, res) => {
  try {
    // Return sanitized ticket data
    const request = req.vendorTicket;
    res.status(200).json({
      _id: request._id,
      requestNumber: request.requestNumber,
      subject: request.subject,
      description: request.description,
      stage: request.stage,
      priority: request.priority,
      createdAt: request.createdAt,
      vendorEscalation: {
        vendorEmail: request.vendorEscalation.vendorEmail,
        vendorCompany: request.vendorEscalation.vendorCompany,
        message: request.vendorEscalation.message,
        tokenExpiresAt: request.vendorEscalation.tokenExpiresAt
      },
      equipment: request.equipmentId ? {
        name: request.equipmentId.name,
        serialNumber: request.equipmentId.serialNumber,
        location: request.equipmentId.location
      } : null,
      comments: request.comments,
      attachments: request.attachments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addVendorNote = async (req, res) => {
  try {
    const request = req.vendorTicket;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Content is required" });

    request.comments.push({
      authorId: request._id, // Assign to the request itself as a generic ID or leave undefined if schema allows
      authorName: `Vendor (${request.vendorEscalation.vendorCompany})`,
      content: content,
      timestamp: new Date()
    });

    await request.save();
    
    // Notify internals if socket is available
    const io = req.app.get("socketio");
    if (io) {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyRequestChange(io, "request_updated", request, `Vendor added a note.`);
    }

    res.status(201).json(request.comments[request.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVendorStage = async (req, res) => {
  try {
    const request = req.vendorTicket;
    const { stage } = req.body;

    const validStages = ['in-progress', 'repaired'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage. Allowed: in-progress, repaired" });
    }

    request.stage = stage;
    if (stage === 'repaired' && !request.completedDate) {
      request.completedDate = new Date();
    }

    await request.save();

    const io = req.app.get("socketio");
    if (io) {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyRequestChange(io, "request_updated", request, `Vendor marked ticket as ${stage}.`);
    }

    res.status(200).json({ message: "Stage updated successfully", stage: request.stage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
