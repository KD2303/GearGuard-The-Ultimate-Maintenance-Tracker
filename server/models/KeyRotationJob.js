const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const KeyRotationJobSchema = new Schema({
  jobName: { 
    type: String, 
    required: true, 
    default: 'MaintenanceRequest_KeyRotation' 
  },
  targetVersion: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['idle', 'running', 'paused', 'completed', 'error'], 
    default: 'idle' 
  },
  totalDocuments: { 
    type: Number, 
    default: 0 
  },
  processedDocuments: { 
    type: Number, 
    default: 0 
  },
  migratedDocuments: { 
    type: Number, 
    default: 0 
  },
  lastProcessedId: { 
    type: Schema.Types.ObjectId,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('KeyRotationJob', KeyRotationJobSchema);
