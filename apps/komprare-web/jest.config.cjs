module.exports = {
  displayName: '@ikea-compare/komprare-web',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 70,
      functions: 85,
      statements: 85,
    },
  },
};
