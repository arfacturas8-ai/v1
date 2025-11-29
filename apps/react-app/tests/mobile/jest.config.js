/**
 * Jest configuration for Detox mobile tests
 */

module.exports = {
  preset: '@detox/jest-circus',
  rootDir: '../..',
  testMatch: [
    '<rootDir>/tests/mobile/**/*.test.js',
    '<rootDir>/tests/mobile/**/*.spec.js'
  ],
  testTimeout: 120000,
  testEnvironment: './tests/mobile/environment.js',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/mobile',
      outputName: 'detox-junit.xml',
      suiteName: 'Detox Mobile Tests'
    }]
  ],
  verbose: true,
  bail: false,
  maxWorkers: 1, // Detox requires serial execution
  setupFilesAfterEnv: ['<rootDir>/tests/mobile/setup.js'],
  globalSetup: '<rootDir>/tests/mobile/global-setup.js',
  globalTeardown: '<rootDir>/tests/mobile/global-teardown.js'
};