/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/Tests/**/*.test.ts'],
  globalSetup: './Tests/integration/globalSetup.ts',
  globalTeardown: './Tests/integration/globalTeardown.ts',
  setupFiles: ['./Tests/integration/setup.ts'],
  testTimeout: 30000,
  forceExit: true,
  maxWorkers: 1,
};
