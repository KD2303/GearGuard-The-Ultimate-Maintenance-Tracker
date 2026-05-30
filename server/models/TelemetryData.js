const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  metadata: {
    equipmentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Equipment', 
      required: true 
    },
    metricType: { 
      type: String, 
      enum: ['temperature', 'vibration', 'pressure', 'humidity', 'voltage'], 
      required: true 
    },
    sensorId: {
      type: String
    }
  },
  value: { 
    type: Number, 
    required: true 
  }
}, {
  // Enable MongoDB native Time Series capabilities
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds'
  },
  expireAfterSeconds: 2592000 // Automatically delete raw data after 30 days
});

module.exports = mongoose.model("TelemetryData", telemetrySchema);
