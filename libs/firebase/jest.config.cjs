module.exports = {
  displayName: '@ikea-compare/firebase',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageDirectory: 'test-output/jest/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 67,
      branches: 57,
      functions: 64,
      statements: 65,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test-output/',
    '/__tests__/helpers/',
  ],
  // Performance settings
  testTimeout: 10000, // 10 seconds for unit tests
  maxWorkers: '50%',
  // Verbose output for better debugging
  verbose: true,
};
