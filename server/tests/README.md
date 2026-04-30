# Backend Unit Tests

This directory contains Jest unit tests for backend utility functions in GearGuard.

## Test Coverage

- **Validators** (8 tests): Email, phone, date, ObjectId, priority, type, status, stage validations
- **Date Helpers** (11 tests): Date formatting, duration calculation, date comparisons, date ranges
- **Equipment Status** (17 tests): Status validation, transitions, descriptions, operational checks
- **Request Filters** (16 tests): Query building, filter validation, search functionality

**Total: 52+ test cases**

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

This will run all tests and display coverage report.

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Auto-reruns tests whenever files change (useful during development).

## Coverage Requirements

- ✅ Minimum 80% line coverage
- ✅ Minimum 80% branch coverage
- ✅ Minimum 80% function coverage
- ✅ Minimum 80% statement coverage

## Test Structure

Each test file follows this pattern:

```javascript
const utils = require('../utils/moduleName');

describe('Module Name', () => {
  describe('Function Name', () => {
    test('should do something', () => {
      expect(utils.function()).toBe(expectedValue);
    });
  });
});
```

## Utility Modules

### 1. validators.js
- `isValidEmail()` - Validate email format
- `isValidPhone()` - Validate phone number (10-12 digits)
- `isValidObjectId()` - Validate MongoDB ObjectId
- `isValidDate()` - Validate date string
- `isValidPriority()` - Check if priority is valid enum
- `isValidRequestType()` - Check if request type is valid
- `isValidEquipmentStatus()` - Check if equipment status is valid
- `isValidRequestStage()` - Check if request stage is valid

### 2. dateHelpers.js
- `formatDate()` - Format date to readable string
- `calculateDuration()` - Calculate days between dates
- `isDateInPast()` - Check if date is in the past
- `isDateInFuture()` - Check if date is in the future
- `addDaysToDate()` - Add N days to a date
- `getMonthYearString()` - Get YYYYMM format from date
- `isWithinDateRange()` - Check if date is within range

### 3. equipmentStatusHelpers.js
- `isStatusValid()` - Validate status enum
- `getStatusDescription()` - Get human-readable status description
- `isEquipmentOperational()` - Check if equipment is active
- `isMaintenanceRequired()` - Check if under maintenance
- `canTransitionStatus()` - Validate status transition rules
- `getValidTransitions()` - Get allowed transitions from current status

### 4. requestFilters.js
- `buildStageQuery()` - Build MongoDB query for stage filter
- `buildPriorityQuery()` - Build query for priority filter
- `buildTypeQuery()` - Build query for type filter
- `buildDateRangeQuery()` - Build date range query
- `buildSearchQuery()` - Build search query
- `buildTeamQuery()` - Build team query
- `buildAssigneeQuery()` - Build assignee query
- `combineFilters()` - Merge multiple filters into one query

## Example Test Run Output

```
PASS  server/tests/validators.test.js
PASS  server/tests/dateHelpers.test.js
PASS  server/tests/equipmentStatusHelpers.test.js
PASS  server/tests/requestFilters.test.js

Test Suites: 4 passed, 4 total
Tests:       52 passed, 52 total
Coverage:
  Lines:       85%
  Statements:  85%
  Functions:   85%
  Branches:    82%
```

## Adding New Tests

1. Create test file: `filename.test.js`
2. Import the utility module
3. Write test cases with clear descriptions
4. Run `npm run test:watch` to verify
5. Ensure coverage remains above 80%

## Troubleshooting

### Tests not running?
- Ensure Node.js is installed
- Run `npm install` to install Jest
- Check that test files are in `server/tests/` directory

### Coverage below 80%?
- Add more test cases for uncovered branches
- Use `npm test` to see coverage details
- Check which lines/functions are missing tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
