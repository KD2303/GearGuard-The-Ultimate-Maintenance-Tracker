const TelemetryService = require("../services/TelemetryService");
const ErrorHandler = require("../utils/errorHandler");
const { ERROR_TYPES } = require("../middleware/errorHandler");

exports.ingestTelemetry = async (req, res, next) => {
  try {
    const payloads = req.body;
    
    // In a real app, API Key verification would happen via middleware
    // We assume the payload is valid for this prototype
    if (!payloads) {
      throw new ErrorHandler("Telemetry payload required", 400, ERROR_TYPES.VALIDATION_ERROR);
    }

    // Pass to background service for processing
    TelemetryService.enqueuePayload(payloads);

    // Immediately respond to free up connection
    res.status(202).json({
      success: true,
      message: "Telemetry accepted for processing"
    });
  } catch (error) {
    next(error);
  }
};

exports.getTelemetryPlayback = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    const { startTime, endTime } = req.query;
    
    const Equipment = require("../models/Equipment");
    const TelemetryData = require("../models/TelemetryData");
    
    let queryEndTime = endTime ? new Date(endTime) : new Date();
    let queryStartTime = startTime ? new Date(startTime) : null;
    
    if (!startTime && !endTime) {
      const equipment = await Equipment.findById(equipmentId);
      if (equipment && equipment.lastFailureDate) {
        queryEndTime = new Date(equipment.lastFailureDate);
      }
      queryStartTime = new Date(queryEndTime.getTime() - 60 * 60 * 1000); // 1 hour prior
    }

    const data = await TelemetryData.find({
      "metadata.equipmentId": equipmentId,
      timestamp: { $gte: queryStartTime, $lte: queryEndTime }
    }).sort("timestamp").lean();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
