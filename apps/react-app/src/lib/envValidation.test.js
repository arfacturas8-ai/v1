/**
 * Environment Variable Validation Tests
 * Comprehensive test coverage for envValidation.js
 */

import {
  validateEnvironment,
  logEnvironmentStatus,
  enforceEnvironment,
  getEnv,
  isProduction,
  isDevelopment
} from './envValidation';

describe('Environment Variable Validation', () => {
  // Helper to mock environment variables
  const mockEnv = (values) => {
    Object.defineProperty(global, 'import', {
      value: {
        meta: {
          env: values || {}
        }
      },
      configurable: true,
      writable: true
    });
  };

  beforeEach(() => {
    // Clear all env vars before each test
    mockEnv({});

    // Clear console mocks
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateEnvironment', () => {
    describe('Required Variables', () => {
      it('should return valid when all required variables are set', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.missing).toEqual([]);
        expect(result.warnings.length).toBeGreaterThan(0); // Optional vars are missing
      });

      it('should detect missing VITE_API_URL', () => {
        mockEnv({
          VITE_WS_URL: 'wss://ws.example.com'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(false);
        expect(result.missing).toContain('VITE_API_URL');
        expect(result.missing).not.toContain('VITE_WS_URL');
      });

      it('should detect missing VITE_WS_URL', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(false);
        expect(result.missing).toContain('VITE_WS_URL');
        expect(result.missing).not.toContain('VITE_API_URL');
      });

      it('should detect when all required variables are missing', () => {
        const result = validateEnvironment();

        expect(result.isValid).toBe(false);
        expect(result.missing).toContain('VITE_API_URL');
        expect(result.missing).toContain('VITE_WS_URL');
        expect(result.missing.length).toBe(2);
      });

      it('should treat empty string as missing', () => {
        mockEnv({
          VITE_API_URL: '',
          VITE_WS_URL: ''
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(false);
        expect(result.missing).toContain('VITE_API_URL');
        expect(result.missing).toContain('VITE_WS_URL');
      });

      it('should treat "undefined" string as missing', () => {
        mockEnv({
          VITE_API_URL: 'undefined',
          VITE_WS_URL: 'undefined'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(false);
        expect(result.missing).toContain('VITE_API_URL');
        expect(result.missing).toContain('VITE_WS_URL');
      });

      it('should accept whitespace as valid value', () => {
        // Note: This might be a bug in the source code
        mockEnv({
          VITE_API_URL: '   ',
          VITE_WS_URL: ' \t\n '
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.missing).toEqual([]);
      });
    });

    describe('Optional Variables', () => {
      beforeEach(() => {
        // Set required vars for these tests
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com'
        });
      });

      it('should warn about missing optional variables', () => {
        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('VITE_SENTRY_DSN');
        expect(result.warnings).toContain('VITE_GA_MEASUREMENT_ID');
        expect(result.warnings).toContain('VITE_ENVIRONMENT');
        expect(result.warnings).toContain('VITE_APP_VERSION');
        expect(result.warnings).toContain('VITE_STRIPE_PUBLISHABLE_KEY');
        expect(result.warnings).toContain('VITE_INFURA_PROJECT_ID');
      });

      it('should not warn when optional variables are set', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com',
          VITE_SENTRY_DSN: 'https://sentry.example.com',
          VITE_GA_MEASUREMENT_ID: 'GA-12345',
          VITE_ENVIRONMENT: 'production',
          VITE_APP_VERSION: '1.0.0',
          VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
          VITE_INFURA_PROJECT_ID: 'infura-123'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.warnings).toEqual([]);
      });

      it('should warn about empty string optional variables', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com',
          VITE_SENTRY_DSN: ''
        });

        const result = validateEnvironment();

        expect(result.warnings).toContain('VITE_SENTRY_DSN');
      });

      it('should warn about "undefined" string optional variables', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com',
          VITE_ENVIRONMENT: 'undefined'
        });

        const result = validateEnvironment();

        expect(result.warnings).toContain('VITE_ENVIRONMENT');
      });

      it('should not affect validity when optional variables are missing', () => {
        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBe(6);
      });
    });

    describe('Return Value Structure', () => {
      it('should return object with correct structure', () => {
        const result = validateEnvironment();

        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('missing');
        expect(result).toHaveProperty('warnings');
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.missing)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      });

      it('should return empty arrays when all variables are set', () => {
        mockEnv({
          VITE_API_URL: 'https://api.example.com',
          VITE_WS_URL: 'wss://ws.example.com',
          VITE_SENTRY_DSN: 'https://sentry.example.com',
          VITE_GA_MEASUREMENT_ID: 'GA-12345',
          VITE_ENVIRONMENT: 'production',
          VITE_APP_VERSION: '1.0.0',
          VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
          VITE_INFURA_PROJECT_ID: 'infura-123'
        });

        const result = validateEnvironment();

        expect(result.isValid).toBe(true);
        expect(result.missing).toEqual([]);
        expect(result.warnings).toEqual([]);
      });
    });
  });

  describe('logEnvironmentStatus', () => {
    beforeEach(() => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com'
      });
    });

    it('should call console.group with environment name', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com',
        VITE_ENVIRONMENT: 'production'
      });

      logEnvironmentStatus();

      expect(console.group).toHaveBeenCalledWith(
        expect.stringContaining('PRODUCTION')
      );
    });

    it('should default to development environment', () => {
      logEnvironmentStatus();

      expect(console.group).toHaveBeenCalledWith(
        expect.stringContaining('DEVELOPMENT')
      );
    });

    it('should call console.group for required variables section', () => {
      logEnvironmentStatus();

      expect(console.group).toHaveBeenCalledWith(
        expect.stringContaining('Required Variables')
      );
    });

    it('should call console.group for optional variables section', () => {
      logEnvironmentStatus();

      expect(console.group).toHaveBeenCalledWith(
        expect.stringContaining('Optional Variables')
      );
    });

    it('should call console.groupEnd appropriate number of times', () => {
      logEnvironmentStatus();

      // Should be called 3 times: Required section, Optional section, and main section
      expect(console.groupEnd).toHaveBeenCalledTimes(3);
    });

    it('should log error when validation fails', () => {
      mockEnv({
        VITE_API_URL: ''
      });

      logEnvironmentStatus();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables'),
        expect.any(Array)
      );
    });

    it('should not log error when validation succeeds', () => {
      logEnvironmentStatus();

      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables'),
        expect.any(Array)
      );
    });

    it('should return validation result', () => {
      const result = logEnvironmentStatus();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('warnings');
    });

    it('should uppercase environment name in log', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com',
        VITE_ENVIRONMENT: 'staging'
      });

      logEnvironmentStatus();

      expect(console.group).toHaveBeenCalledWith(
        expect.stringContaining('STAGING')
      );
    });
  });

  describe('enforceEnvironment', () => {
    it('should not throw when all required variables are set', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com'
      });

      expect(() => enforceEnvironment()).not.toThrow();
    });

    it('should throw when required variables are missing', () => {
      expect(() => enforceEnvironment()).toThrow('Missing required environment variables');
    });

    it('should log detailed error message when throwing', () => {
      try {
        enforceEnvironment();
      } catch (error) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('MISSING REQUIRED ENVIRONMENT VARIABLES')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('VITE_API_URL')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('VITE_WS_URL')
      );
    });

    it('should include variable descriptions in error message', () => {
      try {
        enforceEnvironment();
      } catch (error) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Backend API base URL')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket server URL')
      );
    });

    it('should mention .env.example in error message', () => {
      try {
        enforceEnvironment();
      } catch (error) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('.env.example')
      );
    });

    it('should return validation result when successful', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com'
      });

      const result = enforceEnvironment();

      expect(result).toHaveProperty('isValid');
      expect(result.isValid).toBe(true);
    });

    it('should throw only once when multiple variables are missing', () => {
      let errorCount = 0;

      try {
        enforceEnvironment();
      } catch (error) {
        errorCount++;
      }

      expect(errorCount).toBe(1);
    });
  });

  describe('getEnv', () => {
    it('should return value when environment variable exists', () => {
      mockEnv({
        TEST_VAR: 'test-value'
      });

      const result = getEnv('TEST_VAR');

      expect(result).toBe('test-value');
    });

    it('should return null when variable is missing and no fallback provided', () => {
      const result = getEnv('MISSING_VAR');

      expect(result).toBeNull();
    });

    it('should return fallback when variable is missing', () => {
      const result = getEnv('MISSING_VAR', 'fallback-value');

      expect(result).toBe('fallback-value');
    });

    it('should return fallback when variable is empty string', () => {
      mockEnv({
        EMPTY_VAR: ''
      });

      const result = getEnv('EMPTY_VAR', 'fallback-value');

      expect(result).toBe('fallback-value');
    });

    it('should return fallback when variable is "undefined" string', () => {
      mockEnv({
        UNDEFINED_VAR: 'undefined'
      });

      const result = getEnv('UNDEFINED_VAR', 'fallback-value');

      expect(result).toBe('fallback-value');
    });

    it('should support number fallback values', () => {
      const result = getEnv('MISSING_VAR', 42);

      expect(result).toBe(42);
    });

    it('should support boolean fallback values', () => {
      const result = getEnv('MISSING_VAR', true);

      expect(result).toBe(true);
    });

    it('should support object fallback values', () => {
      const fallback = { key: 'value' };
      const result = getEnv('MISSING_VAR', fallback);

      expect(result).toBe(fallback);
    });

    it('should support array fallback values', () => {
      const fallback = ['a', 'b', 'c'];
      const result = getEnv('MISSING_VAR', fallback);

      expect(result).toBe(fallback);
    });

    it('should return actual value even if fallback is provided', () => {
      mockEnv({
        EXISTING_VAR: 'actual-value'
      });

      const result = getEnv('EXISTING_VAR', 'fallback-value');

      expect(result).toBe('actual-value');
    });

    it('should accept whitespace as valid value', () => {
      // Note: This might be a bug in the source code
      mockEnv({
        WHITESPACE_VAR: '   '
      });

      const result = getEnv('WHITESPACE_VAR', 'fallback');

      expect(result).toBe('   ');
    });

    it('should support zero as fallback value', () => {
      const result = getEnv('MISSING_VAR', 0);

      expect(result).toBe(0);
    });

    it('should support false as fallback value', () => {
      const result = getEnv('MISSING_VAR', false);

      expect(result).toBe(false);
    });

    it('should support empty string as fallback value', () => {
      const result = getEnv('MISSING_VAR', '');

      expect(result).toBe('');
    });
  });

  describe('isProduction', () => {
    it('should return true when VITE_ENVIRONMENT is "production"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'production'
      });

      expect(isProduction()).toBe(true);
    });

    it('should return true when PROD is true', () => {
      mockEnv({
        PROD: true
      });

      expect(isProduction()).toBe(true);
    });

    it('should return true when both VITE_ENVIRONMENT and PROD are set', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'production',
        PROD: true
      });

      expect(isProduction()).toBe(true);
    });

    it('should return false when VITE_ENVIRONMENT is "development"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'development'
      });

      expect(isProduction()).toBe(false);
    });

    it('should return false when VITE_ENVIRONMENT is "staging"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'staging'
      });

      expect(isProduction()).toBe(false);
    });

    it('should return false when no environment variables are set', () => {
      expect(isProduction()).toBe(false);
    });

    it('should return false when PROD is false', () => {
      mockEnv({
        PROD: false
      });

      expect(isProduction()).toBe(false);
    });

    it('should return false when VITE_ENVIRONMENT is empty string', () => {
      mockEnv({
        VITE_ENVIRONMENT: ''
      });

      expect(isProduction()).toBe(false);
    });

    it('should be case-sensitive for environment value', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'Production'
      });

      expect(isProduction()).toBe(false);
    });

    it('should be case-sensitive for environment value uppercase', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'PRODUCTION'
      });

      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when VITE_ENVIRONMENT is "development"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'development'
      });

      expect(isDevelopment()).toBe(true);
    });

    it('should return true when DEV is true', () => {
      mockEnv({
        DEV: true
      });

      expect(isDevelopment()).toBe(true);
    });

    it('should return true when both VITE_ENVIRONMENT and DEV are set', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'development',
        DEV: true
      });

      expect(isDevelopment()).toBe(true);
    });

    it('should return false when VITE_ENVIRONMENT is "production"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'production'
      });

      expect(isDevelopment()).toBe(false);
    });

    it('should return false when VITE_ENVIRONMENT is "staging"', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'staging'
      });

      expect(isDevelopment()).toBe(false);
    });

    it('should return false when no environment variables are set', () => {
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when DEV is false', () => {
      mockEnv({
        DEV: false
      });

      expect(isDevelopment()).toBe(false);
    });

    it('should return false when VITE_ENVIRONMENT is empty string', () => {
      mockEnv({
        VITE_ENVIRONMENT: ''
      });

      expect(isDevelopment()).toBe(false);
    });

    it('should be case-sensitive for environment value', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'Development'
      });

      expect(isDevelopment()).toBe(false);
    });

    it('should be case-sensitive for environment value uppercase', () => {
      mockEnv({
        VITE_ENVIRONMENT: 'DEVELOPMENT'
      });

      expect(isDevelopment()).toBe(false);
    });
  });

  describe('Environment Checks Edge Cases', () => {
    it('isProduction and isDevelopment should not both return true in normal cases', () => {
      // Test various scenarios to ensure mutual exclusivity
      mockEnv({
        VITE_ENVIRONMENT: 'production'
      });
      expect(isProduction() && isDevelopment()).toBe(false);

      mockEnv({
        VITE_ENVIRONMENT: 'development'
      });
      expect(isProduction() && isDevelopment()).toBe(false);

      mockEnv({
        PROD: true,
        DEV: false
      });
      expect(isProduction() && isDevelopment()).toBe(false);

      mockEnv({
        PROD: false,
        DEV: true
      });
      expect(isProduction() && isDevelopment()).toBe(false);
    });

    it('should handle conflicting environment flags correctly', () => {
      // When both DEV and PROD are true, both functions could return true
      // This tests the actual behavior (which might be a bug)
      mockEnv({
        PROD: true,
        DEV: true
      });

      // Both will return true due to OR logic - this might be unintended
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete valid configuration', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com',
        VITE_SENTRY_DSN: 'https://sentry.example.com',
        VITE_GA_MEASUREMENT_ID: 'GA-12345',
        VITE_ENVIRONMENT: 'production',
        VITE_APP_VERSION: '1.0.0',
        VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_123',
        VITE_INFURA_PROJECT_ID: 'infura-123'
      });

      const validation = validateEnvironment();
      expect(validation.isValid).toBe(true);
      expect(validation.missing).toEqual([]);
      expect(validation.warnings).toEqual([]);

      expect(() => enforceEnvironment()).not.toThrow();
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('should handle partial configuration correctly', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com',
        VITE_WS_URL: 'wss://ws.example.com',
        VITE_ENVIRONMENT: 'development'
      });

      const validation = validateEnvironment();
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBe(5); // 5 optional vars missing

      expect(() => enforceEnvironment()).not.toThrow();
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });

    it('should handle completely empty configuration', () => {
      const validation = validateEnvironment();
      expect(validation.isValid).toBe(false);
      expect(validation.missing.length).toBe(2);
      expect(validation.warnings.length).toBe(6);

      expect(() => enforceEnvironment()).toThrow();
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long environment variable values', () => {
      const longValue = 'a'.repeat(10000);
      mockEnv({
        VITE_API_URL: longValue,
        VITE_WS_URL: 'wss://ws.example.com'
      });

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(getEnv('VITE_API_URL')).toBe(longValue);
    });

    it('should handle special characters in environment values', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com?key=123&value=!@#$%^&*()',
        VITE_WS_URL: 'wss://ws.example.com'
      });

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
    });

    it('should handle unicode characters in environment values', () => {
      mockEnv({
        VITE_API_URL: 'https://api.example.com/测试/🚀',
        VITE_WS_URL: 'wss://ws.example.com'
      });

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(getEnv('VITE_API_URL')).toContain('测试');
    });

    it('should handle numeric string values', () => {
      mockEnv({
        VITE_API_URL: '12345',
        VITE_WS_URL: '67890'
      });

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(typeof getEnv('VITE_API_URL')).toBe('string');
    });

    it('should handle boolean string values', () => {
      mockEnv({
        VITE_API_URL: 'true',
        VITE_WS_URL: 'false'
      });

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(getEnv('VITE_API_URL')).toBe('true');
      expect(typeof getEnv('VITE_API_URL')).toBe('string');
    });
  });
});
