/**
 * Request filtering utility functions
 */

const requestFilters = {
  // Build stage query with validation
  buildStageQuery: (stage) => {
    const validStages = ['new', 'in-progress', 'repaired', 'scrap'];
    if (!validStages.includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }
    return { stage };
  },

  // Build priority query with validation
  buildPriorityQuery: (priority) => {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }
    return { priority };
  },

  // Build type query with validation
  buildTypeQuery: (type) => {
    const validTypes = ['corrective', 'preventive'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}`);
    }
    return { type };
  },

  // Build date range query with validation
  buildDateRangeQuery: (startDate, endDate) => {
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      throw new Error('Invalid date format');
    }

    if (start > end) {
      throw new Error('startDate must be before endDate');
    }

    return {
      scheduledDate: {
        $gte: start,
        $lte: end
      }
    };
  },

  // Build search query
  buildSearchQuery: (searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error('Search term must be a non-empty string');
    }

    return {
      $or: [
        { subject: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { requestNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    };
  },

  // Build team query with validation
  buildTeamQuery: (teamId) => {
    if (!teamId || typeof teamId !== 'string') {
      throw new Error('Team ID must be a non-empty string');
    }
    return { teamId };
  },

  // Build assignee query with validation
  buildAssigneeQuery: (assignedToId) => {
    if (!assignedToId || typeof assignedToId !== 'string') {
      throw new Error('Assigned To ID must be a non-empty string');
    }
    return { assignedToId };
  },

  // Combine multiple filters into single query
  combineFilters: (filters) => {
    if (!filters || typeof filters !== 'object') {
      throw new Error('Filters must be an object');
    }

    const query = {};

    if (filters.stage) {
      Object.assign(query, requestFilters.buildStageQuery(filters.stage));
    }
    if (filters.priority) {
      Object.assign(query, requestFilters.buildPriorityQuery(filters.priority));
    }
    if (filters.type) {
      Object.assign(query, requestFilters.buildTypeQuery(filters.type));
    }
    if (filters.teamId) {
      Object.assign(query, requestFilters.buildTeamQuery(filters.teamId));
    }
    if (filters.assignedToId) {
      Object.assign(query, requestFilters.buildAssigneeQuery(filters.assignedToId));
    }

    return query;
  }
};

module.exports = requestFilters;
