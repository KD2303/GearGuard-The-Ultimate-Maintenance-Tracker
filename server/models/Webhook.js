const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Webhook URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation ensuring HTTP/HTTPS
        return /^(https?:\/\/)/.test(v);
      },
      message: props => `${props.value} is not a valid webhook URL! Must start with http:// or https://`
    }
  },
  provider: {
    type: String,
    enum: ['Slack', 'Discord', 'Teams'],
    required: [true, 'Provider is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  events: {
    type: [String],
    default: ['urgent_request', 'health_critical']
  }
}, { timestamps: true });

module.exports = mongoose.model('Webhook', WebhookSchema);
