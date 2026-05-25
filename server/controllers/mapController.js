const { Equipment, FloorPlan } = require('../models');
const { ErrorHandler, ERROR_TYPES } = require('../utils/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');

const clampPercent = (value) => Math.max(0, Math.min(100, value));

exports.getFloorPlan = asyncHandler(async (req, res) => {
  const activePlan = await FloorPlan.findOne({ isActive: true }).sort({ updatedAt: -1 });
  if (!activePlan) {
    const fallbackUrl = process.env.FLOOR_PLAN_URL || '/floor-plan.png';
    return res.status(200).json({
      success: true,
      data: {
        imageUrl: fallbackUrl,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: activePlan._id,
      name: activePlan.name,
      imageUrl: activePlan.imageUrl,
    },
  });
});

exports.bulkUpdateEquipmentCoordinates = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ErrorHandler(
      'updates must be a non-empty array',
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  const operations = updates
    .map((update) => {
      if (!update || !update.equipmentId) return null;

      const hasCoords =
        typeof update.x === 'number' &&
        typeof update.y === 'number' &&
        Number.isFinite(update.x) &&
        Number.isFinite(update.y);

      const setDoc = {
        mapCoordinates: hasCoords
          ? { x: clampPercent(update.x), y: clampPercent(update.y) }
          : null,
      };

      if (Object.prototype.hasOwnProperty.call(update, 'floorPlanId')) {
        setDoc.floorPlanId = update.floorPlanId || null;
      }

      return {
        updateOne: {
          filter: { _id: update.equipmentId },
          update: { $set: setDoc },
        },
      };
    })
    .filter(Boolean);

  if (operations.length === 0) {
    throw new ErrorHandler(
      'No valid coordinate updates provided',
      ERROR_TYPES.VALIDATION_ERROR,
    );
  }

  const result = await Equipment.bulkWrite(operations);

  return res.status(200).json({
    success: true,
    matchedCount: result.matchedCount ?? result.nMatched ?? 0,
    modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
  });
});
