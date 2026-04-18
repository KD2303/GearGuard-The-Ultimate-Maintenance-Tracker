const Activity = require("../models/Activity");

/**
 * Non-blocking activity logger:
 * If activity logging fails, it should NOT break the main API flow.
 */
async function logActivity({
  type,
  title,
  description,
  userName = "",
  metadata = {},
  entityType = null,
  entityId = null,
}) {
  try {
    await Activity.create({
      type,
      title,
      description,
      userName,
      metadata,
      entityType,
      entityId,
    });
  } catch (err) {
    // Don't throw: logging should never break the main operation
    console.error("Activity logging failed:", err.message);
  }
}

module.exports = { logActivity };
