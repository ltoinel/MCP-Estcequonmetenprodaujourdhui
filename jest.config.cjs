module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // Use explicit test patterns to avoid subtle glob/escaping issues
  testMatch: [
    '<rootDir>/tests/**/*.test.(js|ts)',
    '<rootDir>/tests/**/*.spec.(js|ts)'
  ]
};
