/**
 * Tests for errorHandling utilities
 */
import {
  parseError,
  formatErrorMessage,
  getErrorType,
  isNetworkError,
  isAuthError,
  isValidationError,
  retryWithBackoff,
  createErrorHandler,
  logError,
  ErrorTypes
} from './errorHandling';

describe('errorHandling', () => {
  describe('parseError', () => {
    it('parses Error objects', () => {
      const error = new Error('Test error');
      const result = parseError(error);

      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ErrorTypes.UNKNOWN);
    });

    it('parses error strings', () => {
      const result = parseError('String error');

      expect(result.message).toBe('String error');
      expect(result.type).toBe(ErrorTypes.UNKNOWN);
    });

    it('parses API error responses', () => {
      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            errors: { email: 'Invalid email' }
          },
          status: 400
        }
      };

      const result = parseError(apiError);

      expect(result.message).toBe('Validation failed');
      expect(result.status).toBe(400);
      expect(result.errors).toEqual({ email: 'Invalid email' });
    });

    it('parses network errors', () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK'
      };

      const result = parseError(networkError);

      expect(result.type).toBe(ErrorTypes.NETWORK);
      expect(result.message).toBe('Network Error');
    });

    it('handles errors without response', () => {
      const error = { message: 'Unknown error' };
      const result = parseError(error);

      expect(result.message).toBe('Unknown error');
      expect(result.type).toBe(ErrorTypes.UNKNOWN);
    });

    it('handles null or undefined', () => {
      const result1 = parseError(null);
      const result2 = parseError(undefined);

      expect(result1.message).toBe('An unknown error occurred');
      expect(result2.message).toBe('An unknown error occurred');
    });

    it('extracts error details from response', () => {
      const error = {
        response: {
          data: { message: 'Not found', code: 'NOT_FOUND' },
          status: 404,
          statusText: 'Not Found'
        }
      };

      const result = parseError(error);

      expect(result.message).toBe('Not found');
      expect(result.status).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });
  });

  describe('formatErrorMessage', () => {
    it('formats simple error messages', () => {
      const error = { message: 'Simple error' };
      const formatted = formatErrorMessage(error);

      expect(formatted).toBe('Simple error');
    });

    it('formats validation errors with field details', () => {
      const error = {
        message: 'Validation failed',
        errors: {
          email: 'Invalid email format',
          password: 'Password too short'
        }
      };

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('email: Invalid email format');
      expect(formatted).toContain('password: Password too short');
    });

    it('formats network errors', () => {
      const error = {
        type: ErrorTypes.NETWORK,
        message: 'Network Error'
      };

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Network Error');
    });

    it('formats authentication errors', () => {
      const error = {
        type: ErrorTypes.AUTH,
        message: 'Unauthorized',
        status: 401
      };

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Unauthorized');
    });

    it('formats errors with status codes', () => {
      const error = {
        message: 'Not found',
        status: 404
      };

      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Not found');
      expect(formatted).toContain('404');
    });

    it('handles errors without messages', () => {
      const error = {};
      const formatted = formatErrorMessage(error);

      expect(formatted).toBe('An error occurred');
    });
  });

  describe('getErrorType', () => {
    it('identifies network errors', () => {
      const error = { code: 'ERR_NETWORK' };
      expect(getErrorType(error)).toBe(ErrorTypes.NETWORK);
    });

    it('identifies authentication errors from status', () => {
      const error = { status: 401 };
      expect(getErrorType(error)).toBe(ErrorTypes.AUTH);

      const error2 = { status: 403 };
      expect(getErrorType(error2)).toBe(ErrorTypes.AUTH);
    });

    it('identifies validation errors', () => {
      const error = { status: 400 };
      expect(getErrorType(error)).toBe(ErrorTypes.VALIDATION);

      const error2 = { status: 422 };
      expect(getErrorType(error2)).toBe(ErrorTypes.VALIDATION);
    });

    it('identifies not found errors', () => {
      const error = { status: 404 };
      expect(getErrorType(error)).toBe(ErrorTypes.NOT_FOUND);
    });

    it('identifies server errors', () => {
      const error = { status: 500 };
      expect(getErrorType(error)).toBe(ErrorTypes.SERVER);

      const error2 = { status: 503 };
      expect(getErrorType(error2)).toBe(ErrorTypes.SERVER);
    });

    it('identifies timeout errors', () => {
      const error = { code: 'ECONNABORTED' };
      expect(getErrorType(error)).toBe(ErrorTypes.TIMEOUT);
    });

    it('returns unknown for unrecognized errors', () => {
      const error = { status: 999 };
      expect(getErrorType(error)).toBe(ErrorTypes.UNKNOWN);
    });
  });

  describe('isNetworkError', () => {
    it('detects network errors by code', () => {
      expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
      expect(isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
    });

    it('detects network errors by type', () => {
      expect(isNetworkError({ type: ErrorTypes.NETWORK })).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError({ status: 400 })).toBe(false);
      expect(isNetworkError({ message: 'Some error' })).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('detects 401 errors', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
    });

    it('detects 403 errors', () => {
      expect(isAuthError({ status: 403 })).toBe(true);
    });

    it('detects by error type', () => {
      expect(isAuthError({ type: ErrorTypes.AUTH })).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError({ status: 400 })).toBe(false);
      expect(isAuthError({ status: 500 })).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('detects 400 errors', () => {
      expect(isValidationError({ status: 400 })).toBe(true);
    });

    it('detects 422 errors', () => {
      expect(isValidationError({ status: 422 })).toBe(true);
    });

    it('detects by error type', () => {
      expect(isValidationError({ type: ErrorTypes.VALIDATION })).toBe(true);
    });

    it('returns false for non-validation errors', () => {
      expect(isValidationError({ status: 401 })).toBe(false);
      expect(isValidationError({ status: 500 })).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('succeeds on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      const result = await promise;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3, baseDelay: 100 });

      // Advance timers for retries
      setTimeout(async () => {
        jest.advanceTimersByTime(100);
        setTimeout(() => jest.advanceTimersByTime(200), 50);
      }, 50);

      const result = await promise;

      expect(fn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('throws after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      const promise = retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 });

      // Advance timers
      setTimeout(() => {
        jest.advanceTimersByTime(10);
        setTimeout(() => jest.advanceTimersByTime(20), 5);
      }, 5);

      await expect(promise).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('applies exponential backoff', async () => {
      const delays = [];
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      retryWithBackoff(fn, { maxRetries: 3, baseDelay: 100 }).catch(() => {});

      // Track delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((cb, delay) => {
        delays.push(delay);
        return originalSetTimeout(cb, 0);
      });

      jest.runAllTimers();

      expect(delays).toContain(100);   // First retry: 100ms
      expect(delays).toContain(200);   // Second retry: 200ms
      expect(delays).toContain(400);   // Third retry: 400ms
    });

    it('respects shouldRetry function', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 401 });

      const shouldRetry = (error) => error.status !== 401;

      const promise = retryWithBackoff(fn, { maxRetries: 3, shouldRetry });

      await expect(promise).rejects.toEqual({ status: 401 });
      expect(fn).toHaveBeenCalledTimes(1); // No retries for 401
    });

    it('calls onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10, onRetry });

      setTimeout(() => jest.advanceTimersByTime(10), 5);

      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });
  });

  describe('createErrorHandler', () => {
    it('creates a handler that catches errors', async () => {
      const onError = jest.fn();
      const handler = createErrorHandler({ onError });

      const fn = () => {
        throw new Error('Test error');
      };

      const wrappedFn = handler(fn);
      wrappedFn();

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }));
    });

    it('creates handler with custom error parsing', async () => {
      const customParser = (error) => ({ custom: true, message: error.message });
      const onError = jest.fn();
      const handler = createErrorHandler({ onError, parseError: customParser });

      const fn = () => {
        throw new Error('Test');
      };

      handler(fn)();

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        custom: true,
        message: 'Test'
      }));
    });

    it('creates handler with logging', () => {
      const logFn = jest.fn();
      const handler = createErrorHandler({ log: logFn });

      const fn = () => {
        throw new Error('Logged error');
      };

      handler(fn)();

      expect(logFn).toHaveBeenCalled();
    });

    it('creates handler that rethrows errors', () => {
      const handler = createErrorHandler({ rethrow: true });

      const fn = () => {
        throw new Error('Rethrow test');
      };

      expect(() => handler(fn)()).toThrow('Rethrow test');
    });
  });

  describe('logError', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs error to console', () => {
      const error = new Error('Log test');
      logError(error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logs error with context', () => {
      const error = new Error('Test');
      const context = { userId: '123', action: 'login' };

      logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test'),
        expect.objectContaining(context)
      );
    });

    it('logs parsed error details', () => {
      const error = {
        response: {
          data: { message: 'API error' },
          status: 400
        }
      };

      logError(error);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('includes stack trace', () => {
      const error = new Error('Stack test');
      logError(error, {}, { includeStack: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          stack: expect.any(String)
        })
      );
    });
  });

  describe('ErrorTypes', () => {
    it('exports all error types', () => {
      expect(ErrorTypes.NETWORK).toBe('NETWORK');
      expect(ErrorTypes.AUTH).toBe('AUTH');
      expect(ErrorTypes.VALIDATION).toBe('VALIDATION');
      expect(ErrorTypes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorTypes.SERVER).toBe('SERVER');
      expect(ErrorTypes.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorTypes.UNKNOWN).toBe('UNKNOWN');
    });
  });

  describe('Edge Cases', () => {
    it('handles circular reference errors', () => {
      const error = { message: 'Circular' };
      error.self = error;

      const result = parseError(error);
      expect(result.message).toBe('Circular');
    });

    it('handles errors with non-standard properties', () => {
      const error = {
        customProp: 'value',
        nestedError: { inner: 'error' }
      };

      const result = parseError(error);
      expect(result).toBeDefined();
    });

    it('handles very long error messages', () => {
      const longMessage = 'a'.repeat(10000);
      const error = new Error(longMessage);

      const result = parseError(error);
      expect(result.message).toBe(longMessage);
    });

    it('handles errors during error parsing', () => {
      const problematicError = {
        get message() {
          throw new Error('Cannot access message');
        }
      };

      const result = parseError(problematicError);
      expect(result).toBeDefined();
    });
  });
});
