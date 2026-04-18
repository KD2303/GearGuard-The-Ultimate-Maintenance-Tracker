const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");

// GET /api/activities/recent?limit=15
router.get("/recent", async (req, res) => {
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 15;

  const activities = await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Map _id/createdAt to frontend expected fields
  const payload = activities.map((a) => ({
    id: String(a._id),
    type: a.type,
    title: a.title,
    description: a.description,
    userName: a.userName || "",
    timestamp: a.createdAt
      ? new Date(a.createdAt).toISOString()
      : new Date().toISOString(),
    metadata: a.metadata || {},
  }));

  res.json(payload);
});

// (Optional for Activity page later)
// GET /api/activities?limit=50&skip=0&type=request_created
router.get("/", async (req, res) => {
  const limitRaw = parseInt(req.query.limit, 10);
  const skipRaw = parseInt(req.query.skip, 10);

  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 200)
    : 50;
  const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.entityType) filter.entityType = req.query.entityType;

  const items = await Activity.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Activity.countDocuments(filter);

  res.json({
    total,
    items: items.map((a) => ({
      id: String(a._id),
      type: a.type,
      title: a.title,
      description: a.description,
      userName: a.userName || "",
      timestamp: a.createdAt
        ? new Date(a.createdAt).toISOString()
        : new Date().toISOString(),
      metadata: a.metadata || {},
    })),
  });
});

module.exports = router;
