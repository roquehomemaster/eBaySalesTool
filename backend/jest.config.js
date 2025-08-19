module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/src/integration/ebay/__tests__/**/*.test.js'],
  // Use single worker for now because tests mutate shared DB state; can revisit with isolation
  maxWorkers: 1,
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  // Suppress verbose open handle warnings once we centrally manage connections
  detectOpenHandles: false,
  // Additional per-test environment hooks (afterAll cleanup etc.)
  setupFilesAfterEnv: ['<rootDir>/tests/jest.afterEnv.js']
};
