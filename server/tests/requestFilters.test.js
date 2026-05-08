const requestFilters = require('../utils/requestFilters');

describe('Request Filter Utility Functions', () => {
  describe('buildStageQuery', () => {
    test('should build valid stage query', () => {
      expect(requestFilters.buildStageQuery('in-progress')).toEqual({ stage: 'in-progress' });
      expect(requestFilters.buildStageQuery('new')).toEqual({ stage: 'new' });
    });

    test('should throw error for invalid stage', () => {
      expect(() => requestFilters.buildStageQuery('invalid')).toThrow('Invalid stage');
    });
  });

  describe('buildPriorityQuery', () => {
    test('should build valid priority query', () => {
      expect(requestFilters.buildPriorityQuery('high')).toEqual({ priority: 'high' });
      expect(requestFilters.buildPriorityQuery('urgent')).toEqual({ priority: 'urgent' });
    });

    test('should throw error for invalid priority', () => {
      expect(() => requestFilters.buildPriorityQuery('critical')).toThrow('Invalid priority');
    });
  });

  describe('buildTypeQuery', () => {
    test('should build valid type query', () => {
      expect(requestFilters.buildTypeQuery('corrective')).toEqual({ type: 'corrective' });
      expect(requestFilters.buildTypeQuery('preventive')).toEqual({ type: 'preventive' });
    });

    test('should throw error for invalid type', () => {
      expect(() => requestFilters.buildTypeQuery('emergency')).toThrow('Invalid type');
    });
  });

  describe('buildDateRangeQuery', () => {
    test('should build valid date range query', () => {
      const query = requestFilters.buildDateRangeQuery('2024-01-01', '2024-01-31');
      expect(query).toHaveProperty('scheduledDate');
      expect(query.scheduledDate).toHaveProperty('$gte');
      expect(query.scheduledDate).toHaveProperty('$lte');
    });

    test('should throw error when startDate is after endDate', () => {
      expect(() => requestFilters.buildDateRangeQuery('2024-02-01', '2024-01-01')).toThrow('startDate must be before endDate');
    });

    test('should throw error for missing dates', () => {
      expect(() => requestFilters.buildDateRangeQuery(null, '2024-01-31')).toThrow('Both startDate and endDate are required');
      expect(() => requestFilters.buildDateRangeQuery('2024-01-01', null)).toThrow('Both startDate and endDate are required');
    });

    test('should throw error for invalid date format', () => {
      expect(() => requestFilters.buildDateRangeQuery('invalid', '2024-01-31')).toThrow('Invalid date format');
    });
  });

  describe('buildSearchQuery', () => {
    test('should build search query with valid search term', () => {
      const query = requestFilters.buildSearchQuery('pump');
      expect(query).toHaveProperty('$or');
      expect(query.$or).toHaveLength(3);
    });

    test('should throw error for empty search term', () => {
      expect(() => requestFilters.buildSearchQuery('')).toThrow('Search term must be a non-empty string');
    });

    test('should throw error for null search term', () => {
      expect(() => requestFilters.buildSearchQuery(null)).toThrow('Search term must be a non-empty string');
    });

    test('should throw error for non-string search term', () => {
      expect(() => requestFilters.buildSearchQuery(123)).toThrow('Search term must be a non-empty string');
    });
  });

  describe('buildTeamQuery', () => {
    test('should build team query with valid team ID', () => {
      expect(requestFilters.buildTeamQuery('team123')).toEqual({ teamId: 'team123' });
    });

    test('should throw error for empty team ID', () => {
      expect(() => requestFilters.buildTeamQuery('')).toThrow('Team ID must be a non-empty string');
    });

    test('should throw error for null team ID', () => {
      expect(() => requestFilters.buildTeamQuery(null)).toThrow('Team ID must be a non-empty string');
    });
  });

  describe('buildAssigneeQuery', () => {
    test('should build assignee query with valid ID', () => {
      expect(requestFilters.buildAssigneeQuery('user123')).toEqual({ assignedToId: 'user123' });
    });

    test('should throw error for empty assignee ID', () => {
      expect(() => requestFilters.buildAssigneeQuery('')).toThrow('Assigned To ID must be a non-empty string');
    });

    test('should throw error for null assignee ID', () => {
      expect(() => requestFilters.buildAssigneeQuery(null)).toThrow('Assigned To ID must be a non-empty string');
    });
  });

  describe('combineFilters', () => {
    test('should combine multiple filters', () => {
      const filters = {
        stage: 'in-progress',
        priority: 'high'
      };
      const query = requestFilters.combineFilters(filters);
      expect(query).toHaveProperty('stage', 'in-progress');
      expect(query).toHaveProperty('priority', 'high');
    });

    test('should handle single filter', () => {
      const filters = { stage: 'new' };
      const query = requestFilters.combineFilters(filters);
      expect(query).toEqual({ stage: 'new' });
    });

    test('should handle empty filters object', () => {
      const query = requestFilters.combineFilters({});
      expect(query).toEqual({});
    });

    test('should throw error for null filters', () => {
      expect(() => requestFilters.combineFilters(null)).toThrow('Filters must be an object');
    });

    test('should skip invalid filter properties', () => {
      const filters = {
        stage: 'new',
        invalidProp: 'value'
      };
      const query = requestFilters.combineFilters(filters);
      expect(query).toHaveProperty('stage', 'new');
      expect(query).not.toHaveProperty('invalidProp');
    });
  });
});
