const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true
    },
    usedTokenHashes: {
      type: [String],
      default: []
    },
    deviceInfo: {
      type: String,
      default: 'Unknown Device'
    },
    ipAddress: {
      type: String
    },
    isValid: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index: MongoDB will automatically delete document when expiresAt is reached
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Session', sessionSchema);
