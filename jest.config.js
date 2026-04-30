module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server/utils/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  rootDir: '.'
};
