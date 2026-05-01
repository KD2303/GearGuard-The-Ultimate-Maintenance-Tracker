/**
 * Date/Time helper utility functions
 */

const dateHelpers = {
  // Format date to DD-MM-YYYY format
  formatDate: (date, format = 'DD-MM-YYYY') => {
    if (!(date instanceof Date) || isNaN(date)) {
      return null;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    return null;
  },

  // Calculate duration in days between two dates
  calculateDuration: (startDate, endDate) => {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      return null;
    }
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Check if date is in the past
  isDateInPast: (date) => {
    if (!(date instanceof Date) || isNaN(date)) return false;
    return date < new Date();
  },

  // Check if date is in the future
  isDateInFuture: (date) => {
    if (!(date instanceof Date) || isNaN(date)) return false;
    return date > new Date();
  },

  // Add days to a date
  addDaysToDate: (date, days) => {
    if (!(date instanceof Date) || isNaN(date) || typeof days !== 'number') {
      return null;
    }
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Get YYYYMM format from date (for request number generation)
  getMonthYearString: (date) => {
    if (!(date instanceof Date) || isNaN(date)) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  },

  // Check if date falls between start and end dates
  isWithinDateRange: (date, startDate, endDate) => {
    if (!(date instanceof Date) || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      return false;
    }
    return date >= startDate && date <= endDate;
  }
};

module.exports = dateHelpers;
