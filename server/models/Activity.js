const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "request_created",
        "request_updated",
        "request_completed",
        "equipment_updated",
        "team_assigned",
        "member_added",
      ],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // No auth system in repo currently, so keep it optional
    userName: { type: String, default: "", trim: true },

    // flexible extra info like priority, ids, etc.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // optional: useful for filtering later
    entityType: {
      type: String,
      enum: ["request", "equipment", "team", "member"],
      default: null,
      index: true,
    },
    entityId: { type: String, default: null, index: true },
  },
  { timestamps: true }, // gives createdAt/updatedAt
);

module.exports = mongoose.model("Activity", ActivitySchema);
