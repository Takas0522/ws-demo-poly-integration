module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test files pattern
  testMatch: [
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.spec.ts'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'tests/integration/**/*.ts',
    '!tests/integration/**/*.test.ts',
    '!tests/integration/**/*.spec.ts',
    '!tests/integration/setup.ts'
  ],
  
  coverageDirectory: 'coverage/integration',
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
};
