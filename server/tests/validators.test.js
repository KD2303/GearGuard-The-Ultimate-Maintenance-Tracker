const validators = require('../utils/validators');

describe('Validators Utility Functions', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
    });

    test('should return false for email without @', () => {
      expect(validators.isValidEmail('testexample.com')).toBe(false);
    });

    test('should return false for email without domain', () => {
      expect(validators.isValidEmail('test@')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(validators.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('should return true for valid 10 digit phone', () => {
      expect(validators.isValidPhone('9876543210')).toBe(true);
    });

    test('should return true for valid 12 digit phone', () => {
      expect(validators.isValidPhone('987654321098')).toBe(true);
    });

    test('should return false for phone with letters', () => {
      expect(validators.isValidPhone('98765432a0')).toBe(false);
    });

    test('should return false for short phone', () => {
      expect(validators.isValidPhone('123')).toBe(false);
    });
  });

  describe('isValidObjectId', () => {
    test('should return true for valid 24 character hex string', () => {
      expect(validators.isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    test('should return false for short string', () => {
      expect(validators.isValidObjectId('507f1f77')).toBe(false);
    });

    test('should return false for non-hex characters', () => {
      expect(validators.isValidObjectId('507f1f77bcf86cd799439z11')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('should return true for valid date string', () => {
      expect(validators.isValidDate('2024-01-15')).toBe(true);
    });

    test('should return true for valid Date object', () => {
      expect(validators.isValidDate(new Date().toString())).toBe(true);
    });

    test('should return false for invalid date string', () => {
      expect(validators.isValidDate('invalid-date')).toBe(false);
    });
  });

  describe('isValidPriority', () => {
    test('should return true for valid priorities', () => {
      expect(validators.isValidPriority('low')).toBe(true);
      expect(validators.isValidPriority('medium')).toBe(true);
      expect(validators.isValidPriority('high')).toBe(true);
      expect(validators.isValidPriority('urgent')).toBe(true);
    });

    test('should return false for invalid priority', () => {
      expect(validators.isValidPriority('critical')).toBe(false);
    });
  });

  describe('isValidRequestType', () => {
    test('should return true for valid request types', () => {
      expect(validators.isValidRequestType('corrective')).toBe(true);
      expect(validators.isValidRequestType('preventive')).toBe(true);
    });

    test('should return false for invalid type', () => {
      expect(validators.isValidRequestType('emergency')).toBe(false);
    });
  });

  describe('isValidEquipmentStatus', () => {
    test('should return true for valid statuses', () => {
      expect(validators.isValidEquipmentStatus('active')).toBe(true);
      expect(validators.isValidEquipmentStatus('inactive')).toBe(true);
      expect(validators.isValidEquipmentStatus('scrapped')).toBe(true);
      expect(validators.isValidEquipmentStatus('under-maintenance')).toBe(true);
    });

    test('should return false for invalid status', () => {
      expect(validators.isValidEquipmentStatus('broken')).toBe(false);
    });
  });

  describe('isValidRequestStage', () => {
    test('should return true for valid stages', () => {
      expect(validators.isValidRequestStage('new')).toBe(true);
      expect(validators.isValidRequestStage('in-progress')).toBe(true);
      expect(validators.isValidRequestStage('repaired')).toBe(true);
      expect(validators.isValidRequestStage('scrap')).toBe(true);
    });

    test('should return false for invalid stage', () => {
      expect(validators.isValidRequestStage('completed')).toBe(false);
    });
  });
});
