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
