const equipmentStatusHelpers = require('../utils/equipmentStatusHelpers');

describe('Equipment Status Helper Utility Functions', () => {
  describe('isStatusValid', () => {
    test('should return true for valid statuses', () => {
      expect(equipmentStatusHelpers.isStatusValid('active')).toBe(true);
      expect(equipmentStatusHelpers.isStatusValid('inactive')).toBe(true);
      expect(equipmentStatusHelpers.isStatusValid('scrapped')).toBe(true);
      expect(equipmentStatusHelpers.isStatusValid('under-maintenance')).toBe(true);
    });

    test('should return false for invalid status', () => {
      expect(equipmentStatusHelpers.isStatusValid('broken')).toBe(false);
      expect(equipmentStatusHelpers.isStatusValid('pending')).toBe(false);
    });
  });

  describe('getStatusDescription', () => {
    test('should return correct description for active status', () => {
      expect(equipmentStatusHelpers.getStatusDescription('active')).toBe('Equipment is operational');
    });

    test('should return correct description for inactive status', () => {
      expect(equipmentStatusHelpers.getStatusDescription('inactive')).toBe('Equipment is not in use');
    });

    test('should return correct description for under-maintenance status', () => {
      expect(equipmentStatusHelpers.getStatusDescription('under-maintenance')).toBe('Equipment is undergoing maintenance');
    });

    test('should return correct description for scrapped status', () => {
      expect(equipmentStatusHelpers.getStatusDescription('scrapped')).toBe('Equipment is no longer usable');
    });

    test('should return unknown for invalid status', () => {
      expect(equipmentStatusHelpers.getStatusDescription('invalid')).toBe('Unknown status');
    });
  });

  describe('isEquipmentOperational', () => {
    test('should return true only for active status', () => {
      expect(equipmentStatusHelpers.isEquipmentOperational('active')).toBe(true);
    });

    test('should return false for non-active statuses', () => {
      expect(equipmentStatusHelpers.isEquipmentOperational('inactive')).toBe(false);
      expect(equipmentStatusHelpers.isEquipmentOperational('scrapped')).toBe(false);
      expect(equipmentStatusHelpers.isEquipmentOperational('under-maintenance')).toBe(false);
    });
  });

  describe('isMaintenanceRequired', () => {
    test('should return true only for under-maintenance status', () => {
      expect(equipmentStatusHelpers.isMaintenanceRequired('under-maintenance')).toBe(true);
    });

    test('should return false for other statuses', () => {
      expect(equipmentStatusHelpers.isMaintenanceRequired('active')).toBe(false);
      expect(equipmentStatusHelpers.isMaintenanceRequired('inactive')).toBe(false);
      expect(equipmentStatusHelpers.isMaintenanceRequired('scrapped')).toBe(false);
    });
  });

  describe('canTransitionStatus', () => {
    test('should allow valid transitions from active', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('active', 'inactive')).toBe(true);
      expect(equipmentStatusHelpers.canTransitionStatus('active', 'under-maintenance')).toBe(true);
      expect(equipmentStatusHelpers.canTransitionStatus('active', 'scrapped')).toBe(true);
    });

    test('should allow valid transitions from inactive', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('inactive', 'active')).toBe(true);
      expect(equipmentStatusHelpers.canTransitionStatus('inactive', 'scrapped')).toBe(true);
    });

    test('should allow valid transitions from under-maintenance', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('under-maintenance', 'active')).toBe(true);
      expect(equipmentStatusHelpers.canTransitionStatus('under-maintenance', 'scrapped')).toBe(true);
    });

    test('should not allow transitions from scrapped', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('scrapped', 'active')).toBe(false);
      expect(equipmentStatusHelpers.canTransitionStatus('scrapped', 'inactive')).toBe(false);
    });

    test('should not allow same status transition', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('active', 'active')).toBe(false);
    });

    test('should return false for invalid statuses', () => {
      expect(equipmentStatusHelpers.canTransitionStatus('invalid', 'active')).toBe(false);
      expect(equipmentStatusHelpers.canTransitionStatus('active', 'invalid')).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    test('should return valid transitions for active', () => {
      const transitions = equipmentStatusHelpers.getValidTransitions('active');
      expect(transitions).toEqual(['inactive', 'under-maintenance', 'scrapped']);
    });

    test('should return valid transitions for inactive', () => {
      const transitions = equipmentStatusHelpers.getValidTransitions('inactive');
      expect(transitions).toEqual(['active', 'scrapped']);
    });

    test('should return empty array for scrapped', () => {
      const transitions = equipmentStatusHelpers.getValidTransitions('scrapped');
      expect(transitions).toEqual([]);
    });

    test('should return empty array for invalid status', () => {
      const transitions = equipmentStatusHelpers.getValidTransitions('invalid');
      expect(transitions).toEqual([]);
    });
  });
});
