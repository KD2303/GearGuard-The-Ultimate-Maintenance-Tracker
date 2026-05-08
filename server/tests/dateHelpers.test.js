const dateHelpers = require('../utils/dateHelpers');

describe('Date Helper Utility Functions', () => {
  describe('formatDate', () => {
    test('should format date to DD-MM-YYYY', () => {
      const date = new Date(2024, 0, 15);
      expect(dateHelpers.formatDate(date, 'DD-MM-YYYY')).toBe('15-01-2024');
    });

    test('should format date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15);
      expect(dateHelpers.formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    test('should return null for invalid date', () => {
      expect(dateHelpers.formatDate('invalid')).toBe(null);
    });

    test('should default to DD-MM-YYYY format', () => {
      const date = new Date(2024, 4, 20);
      expect(dateHelpers.formatDate(date)).toBe('20-05-2024');
    });
  });

  describe('calculateDuration', () => {
    test('should calculate duration in days between two dates', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 8);
      expect(dateHelpers.calculateDuration(start, end)).toBe(7);
    });

    test('should handle same date', () => {
      const date = new Date(2024, 0, 1);
      expect(dateHelpers.calculateDuration(date, date)).toBe(0);
    });

    test('should return null for invalid dates', () => {
      expect(dateHelpers.calculateDuration('invalid', 'invalid')).toBe(null);
    });
  });

  describe('isDateInPast', () => {
    test('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      expect(dateHelpers.isDateInPast(pastDate)).toBe(true);
    });

    test('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      expect(dateHelpers.isDateInPast(futureDate)).toBe(false);
    });

    test('should return false for invalid date', () => {
      expect(dateHelpers.isDateInPast('invalid')).toBe(false);
    });
  });

  describe('isDateInFuture', () => {
    test('should return true for future date', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      expect(dateHelpers.isDateInFuture(futureDate)).toBe(true);
    });

    test('should return false for past date', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      expect(dateHelpers.isDateInFuture(pastDate)).toBe(false);
    });

    test('should return false for invalid date', () => {
      expect(dateHelpers.isDateInFuture('invalid')).toBe(false);
    });
  });

  describe('addDaysToDate', () => {
    test('should add days to date', () => {
      const date = new Date(2024, 0, 1);
      const result = dateHelpers.addDaysToDate(date, 5);
      expect(result.getDate()).toBe(6);
    });

    test('should handle negative days', () => {
      const date = new Date(2024, 0, 10);
      const result = dateHelpers.addDaysToDate(date, -5);
      expect(result.getDate()).toBe(5);
    });

    test('should return null for invalid inputs', () => {
      expect(dateHelpers.addDaysToDate('invalid', 5)).toBe(null);
      expect(dateHelpers.addDaysToDate(new Date(), 'invalid')).toBe(null);
    });
  });

  describe('getMonthYearString', () => {
    test('should return YYYYMM format', () => {
      const date = new Date(2024, 4, 15);
      expect(dateHelpers.getMonthYearString(date)).toBe('202405');
    });

    test('should pad month with zero', () => {
      const date = new Date(2024, 0, 15);
      expect(dateHelpers.getMonthYearString(date)).toBe('202401');
    });

    test('should return null for invalid date', () => {
      expect(dateHelpers.getMonthYearString('invalid')).toBe(null);
    });
  });

  describe('isWithinDateRange', () => {
    test('should return true for date within range', () => {
      const start = new Date(2024, 0, 1);
      const date = new Date(2024, 0, 15);
      const end = new Date(2024, 0, 31);
      expect(dateHelpers.isWithinDateRange(date, start, end)).toBe(true);
    });

    test('should return true for date equal to start', () => {
      const start = new Date(2024, 0, 1);
      const date = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 31);
      expect(dateHelpers.isWithinDateRange(date, start, end)).toBe(true);
    });

    test('should return false for date outside range', () => {
      const start = new Date(2024, 0, 1);
      const date = new Date(2024, 1, 15);
      const end = new Date(2024, 0, 31);
      expect(dateHelpers.isWithinDateRange(date, start, end)).toBe(false);
    });

    test('should return false for invalid dates', () => {
      expect(dateHelpers.isWithinDateRange('invalid', 'invalid', 'invalid')).toBe(false);
    });
  });
});
