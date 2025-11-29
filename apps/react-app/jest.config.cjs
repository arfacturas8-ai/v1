module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/services/api$': '<rootDir>/tests/mocks/apiService.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,ts}',
    '!src/**/types.{js,ts}',
    '!src/**/*.mock.{js,ts}',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@radix-ui|lucide-react|framer-motion|socket\\.io-client|@livekit|react-markdown|remark-.*|rehype-.*|unified|unist-.*|vfile.*|bail|is-plain-obj|trough|micromark.*|mdast.*|property-information|space-separated-tokens|comma-separated-tokens|hast-.*|html-void-elements|ccount|escape-string-regexp|markdown-table|decode-named-character-reference|character-entities|trim-lines))',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  testTimeout: 15000,
  verbose: true,
  bail: false,
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        'babel-plugin-transform-vite-meta-env',
      ],
    }],
  },
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3000/api/v1',
        VITE_WS_URL: 'http://localhost:3000',
        MODE: 'test',
        DEV: false,
        PROD: false,
      },
    },
  },
};
