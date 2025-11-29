/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*simple.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup-simple.ts'],
  testTimeout: 5000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  maxWorkers: 1,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        skipLibCheck: true,
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@cryb/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  passWithNoTests: true,
};