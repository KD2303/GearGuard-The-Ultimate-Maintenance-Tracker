const { body } = require('express-validator');

/**
 * Validation rules for equipment create and update operations.
 *
 * Serial numbers and asset codes are used in database lookups, exports, and
 * downstream integrations. Accepting them without validation allows injection
 * payloads and malformed identifiers to corrupt records. These rules enforce a
 * strict character set, length bounds, and type checks before the controller
 * touches the database.
 */

// Uppercase letters, digits and hyphens only, 3 to 50 characters.
const SERIAL_NUMBER_PATTERN = /^[A-Z0-9-]{3,50}$/;

// Two uppercase letters followed by 4 to 10 digits, for example "EQ123456".
const ASSET_CODE_PATTERN = /^[A-Z]{2}[0-9]{4,10}$/;

const EQUIPMENT_STATUSES = ['active', 'inactive', 'scrapped', 'under-maintenance'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];

const createEquipmentRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Equipment name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[\w\s.\-/()]+$/).withMessage('Name contains invalid characters'),

  body('serialNumber')
    .trim()
    .notEmpty().withMessage('Serial number is required')
    .matches(SERIAL_NUMBER_PATTERN)
    .withMessage('Serial number must be 3 to 50 characters using uppercase letters, digits and hyphens only'),

  body('assetCode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(ASSET_CODE_PATTERN)
    .withMessage('Asset code must be two uppercase letters followed by 4 to 10 digits, for example EQ123456'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 60 }).withMessage('Category must be 60 characters or fewer'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 120 }).withMessage('Location must be 120 characters or fewer'),

  body('status')
    .optional()
    .isIn(EQUIPMENT_STATUSES).withMessage(`Status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`),

  body('fuelType')
    .optional({ checkFalsy: true })
    .isIn(FUEL_TYPES).withMessage(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}`),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0, max: 1_000_000_000 }).withMessage('Purchase price must be a positive number'),

  body('manufacturer')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Manufacturer must be 100 characters or fewer'),

  body('model')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Model must be 100 characters or fewer'),
];

/**
 * Update rules mirror the create rules but make every field optional so that
 * partial updates are supported. When a field is supplied it must still satisfy
 * the same format constraints.
 */
const updateEquipmentRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[\w\s.\-/()]+$/).withMessage('Name contains invalid characters'),

  body('serialNumber')
    .optional()
    .trim()
    .matches(SERIAL_NUMBER_PATTERN)
    .withMessage('Serial number must be 3 to 50 characters using uppercase letters, digits and hyphens only'),

  body('assetCode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(ASSET_CODE_PATTERN)
    .withMessage('Asset code must be two uppercase letters followed by 4 to 10 digits, for example EQ123456'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Category must be 60 characters or fewer'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Location must be 120 characters or fewer'),

  body('status')
    .optional()
    .isIn(EQUIPMENT_STATUSES).withMessage(`Status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`),

  body('fuelType')
    .optional({ checkFalsy: true })
    .isIn(FUEL_TYPES).withMessage(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}`),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0, max: 1_000_000_000 }).withMessage('Purchase price must be a positive number'),
];

module.exports = {
  createEquipmentRules,
  updateEquipmentRules,
  SERIAL_NUMBER_PATTERN,
  ASSET_CODE_PATTERN,
};
