/**
 * Validation utility functions
 */

const validators = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (10-12 digits)
  isValidPhone: (phone) => {
    const phoneRegex = /^\d{10,12}$/;
    return phoneRegex.test(phone);
  },

  // Check if valid MongoDB ObjectId
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Check if date string is valid
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Validate request priority enum
  isValidPriority: (priority) => {
    return ['low', 'medium', 'high', 'urgent'].includes(priority);
  },

  // Validate request type enum
  isValidRequestType: (type) => {
    return ['corrective', 'preventive'].includes(type);
  },

  // Validate equipment status enum
  isValidEquipmentStatus: (status) => {
    return ['active', 'inactive', 'scrapped', 'under-maintenance'].includes(status);
  },

  // Validate request stage enum
  isValidRequestStage: (stage) => {
    return ['new', 'in-progress', 'repaired', 'scrap'].includes(stage);
  }
};

module.exports = validators;
