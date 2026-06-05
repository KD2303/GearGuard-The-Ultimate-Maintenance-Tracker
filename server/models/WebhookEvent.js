const { mongoose } = require('../config/database');
const { Schema } = mongoose;

const WebhookEventSchema = new Schema({
  webhookId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Webhook', 
    required: true 
  },
  provider: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  payload: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  errorLog: [{ 
    type: String 
  }]
}, { timestamps: true });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
