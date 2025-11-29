/**
 * Global Jest Coverage Configuration
 * Enforces coverage thresholds across the entire platform
 */

module.exports = {
  // Coverage collection settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}',
    'stores/**/*.{ts,tsx,js,jsx}',
    'services/**/*.{ts,tsx,js,jsx}',
    'utils/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
    '!src/**/dist/**',
    '!src/**/build/**',
    '!src/**/coverage/**',
    '!**/migrations/**',
    '!**/fixtures/**',
    '!**/mocks/**'
  ],

  // Coverage output settings
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
    'clover'
  ],

  // Platform-wide coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    
    // Critical authentication and security modules
    './src/services/auth.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/middleware/auth.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/routes/auth.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/security.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/middleware/security-headers.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },

    // Socket communication (critical for real-time features)
    './src/socket/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },

    // Payment and crypto modules
    './src/services/crypto-payments.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/stripe.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },

    // File upload security
    './src/services/file-upload.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/middleware/media-security.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },

    // Core components (frontend)
    './components/auth/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './components/chat/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },

    // API routes
    './src/routes/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Coverage path mapping for different apps
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\\.d\\.ts$',
    '/migrations/',
    '/fixtures/',
    '/mocks/',
    '__tests__/.*\\.test\\.(ts|tsx|js|jsx)$',
    '__tests__/.*\\.spec\\.(ts|tsx|js|jsx)$'
  ]
};