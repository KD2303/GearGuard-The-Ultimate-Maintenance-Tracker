/**
 * Equipment status utility functions
 */

const VALID_STATUSES = ['active', 'inactive', 'scrapped', 'under-maintenance'];

const VALID_TRANSITIONS = {
  'active': ['inactive', 'under-maintenance', 'scrapped'],
  'inactive': ['active', 'scrapped'],
  'under-maintenance': ['active', 'scrapped'],
  'scrapped': []
};

const STATUS_DESCRIPTIONS = {
  'active': 'Equipment is operational',
  'inactive': 'Equipment is not in use',
  'under-maintenance': 'Equipment is undergoing maintenance',
  'scrapped': 'Equipment is no longer usable'
};

const equipmentStatusHelpers = {
  // Check if status is valid
  isStatusValid: (status) => {
    return VALID_STATUSES.includes(status);
  },

  // Get status description
  getStatusDescription: (status) => {
    return STATUS_DESCRIPTIONS[status] || 'Unknown status';
  },

  // Check if equipment is operational
  isEquipmentOperational: (status) => {
    return status === 'active';
  },

  // Check if maintenance is required
  isMaintenanceRequired: (status) => {
    return status === 'under-maintenance';
  },

  // Check if status transition is valid
  canTransitionStatus: (currentStatus, newStatus) => {
    if (!VALID_STATUSES.includes(currentStatus) || !VALID_STATUSES.includes(newStatus)) {
      return false;
    }
    if (currentStatus === newStatus) return false; // Same status, no change needed
    return VALID_TRANSITIONS[currentStatus].includes(newStatus);
  },

  // Get all valid transitions from a status
  getValidTransitions: (status) => {
    if (!VALID_STATUSES.includes(status)) {
      return [];
    }
    return VALID_TRANSITIONS[status];
  }
};

module.exports = equipmentStatusHelpers;
