const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

// Ingest telemetry data
// High throughput endpoint
router.post("/ingest", telemetryController.ingestTelemetry);

// Fetch historical telemetry playback
router.get("/playback/:equipmentId", telemetryController.getTelemetryPlayback);

module.exports = router;
