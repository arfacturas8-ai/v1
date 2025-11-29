/**
 * Tests for retryWithBackoff utility
 */
import {
  retryWithBackoff,
  createRetryable,
  retryStrategies
} from './retryWithBackoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    it('returns result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });

      // Advance through retry delay
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('respects maxRetries limit', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fail'));

      const promise = retryWithBackoff(fn, { maxRetries: 2 });

      // Advance through all retry delays
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Always fail');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('uses exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        onRetry
      });

      // First retry: 1000ms delay
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Second retry: 2000ms delay (1000 * 2)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      await promise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 1000);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 2000);
    });

    it('respects maxDelay cap', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 5000,
        backoffMultiplier: 3,
        maxDelay: 10000,
        onRetry
      });

      // First retry: 5000ms
      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      // Second retry: would be 15000ms, but capped at 10000ms
      jest.advanceTimersByTime(10000);
      await Promise.resolve();

      await promise;

      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 10000);
    });

    it('uses shouldRetry to determine retry eligibility', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Do not retry'));

      const shouldRetry = jest.fn().mockReturnValue(false);

      await expect(
        retryWithBackoff(fn, { maxRetries: 3, shouldRetry })
      ).rejects.toThrow('Do not retry');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('passes error and attempt number to shouldRetry', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      const shouldRetry = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValue(false);

      const promise = retryWithBackoff(fn, { maxRetries: 3, shouldRetry });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Test error');

      expect(shouldRetry).toHaveBeenCalledWith(error, 1);
      expect(shouldRetry).toHaveBeenCalledWith(error, 2);
    });

    it('calls onRetry before each retry', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, { maxRetries: 2, onRetry });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1, // attempt number
        1000 // delay
      );
    });

    it('throws last error after all retries exhausted', async () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      const error3 = new Error('Last error');

      const fn = jest.fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(error3);

      const promise = retryWithBackoff(fn, { maxRetries: 2 });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      await expect(promise).rejects.toBe(error3);
    });

    it('handles async functions', async () => {
      const fn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'async result';
      });

      const promise = retryWithBackoff(fn);

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('async result');
    });

    it('uses default options when not provided', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn);

      jest.advanceTimersByTime(1000); // Default initial delay
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('createRetryable', () => {
    it('creates retryable version of function', async () => {
      const fn = jest.fn((x) => Promise.resolve(x * 2));

      const retryableFn = createRetryable(fn, { maxRetries: 2 });

      const result = await retryableFn(5);

      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledWith(5);
    });

    it('retries on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const retryableFn = createRetryable(fn, { maxRetries: 2 });

      const promise = retryableFn('arg1', 'arg2');

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('passes multiple arguments', async () => {
      const fn = jest.fn((a, b, c) => Promise.resolve(a + b + c));

      const retryableFn = createRetryable(fn);

      const result = await retryableFn(1, 2, 3);

      expect(result).toBe(6);
      expect(fn).toHaveBeenCalledWith(1, 2, 3);
    });
  });

  describe('retryStrategies', () => {
    describe('networkOnly', () => {
      it('retries on network errors', () => {
        const networkError = new Error('Network request failed');

        expect(retryStrategies.networkOnly(networkError)).toBe(true);
      });

      it('retries on fetch errors', () => {
        const fetchError = new Error('Fetch failed');

        expect(retryStrategies.networkOnly(fetchError)).toBe(true);
      });

      it('retries on timeout errors', () => {
        const timeoutError = new Error('Request timeout');

        expect(retryStrategies.networkOnly(timeoutError)).toBe(true);
      });

      it('retries on NETWORK_ERROR code', () => {
        const error = { code: 'NETWORK_ERROR', message: 'Network error' };

        expect(retryStrategies.networkOnly(error)).toBe(true);
      });

      it('does not retry on other errors', () => {
        const otherError = new Error('Some other error');

        expect(retryStrategies.networkOnly(otherError)).toBe(false);
      });
    });

    describe('serverErrorsOnly', () => {
      it('retries on 5xx server errors', () => {
        const error500 = { response: { status: 500 } };
        const error503 = { response: { status: 503 } };

        expect(retryStrategies.serverErrorsOnly(error500)).toBe(true);
        expect(retryStrategies.serverErrorsOnly(error503)).toBe(true);
      });

      it('does not retry on 4xx client errors', () => {
        const error400 = { response: { status: 400 } };
        const error404 = { response: { status: 404 } };

        expect(retryStrategies.serverErrorsOnly(error400)).toBe(false);
        expect(retryStrategies.serverErrorsOnly(error404)).toBe(false);
      });

      it('does not retry on 2xx success', () => {
        const success = { response: { status: 200 } };

        expect(retryStrategies.serverErrorsOnly(success)).toBe(false);
      });

      it('handles status directly on error', () => {
        const error = { status: 500 };

        expect(retryStrategies.serverErrorsOnly(error)).toBe(true);
      });
    });

    describe('statusCodes', () => {
      it('retries on specified status codes', () => {
        const strategy = retryStrategies.statusCodes([429, 503]);

        expect(strategy({ response: { status: 429 } })).toBe(true);
        expect(strategy({ response: { status: 503 } })).toBe(true);
      });

      it('does not retry on other status codes', () => {
        const strategy = retryStrategies.statusCodes([429, 503]);

        expect(strategy({ response: { status: 400 } })).toBe(false);
        expect(strategy({ response: { status: 500 } })).toBe(false);
      });
    });

    describe('excludeAuth', () => {
      it('does not retry on 401 Unauthorized', () => {
        const error = { response: { status: 401 } };

        expect(retryStrategies.excludeAuth(error)).toBe(false);
      });

      it('does not retry on 403 Forbidden', () => {
        const error = { response: { status: 403 } };

        expect(retryStrategies.excludeAuth(error)).toBe(false);
      });

      it('retries on other status codes', () => {
        expect(retryStrategies.excludeAuth({ response: { status: 500 } })).toBe(true);
        expect(retryStrategies.excludeAuth({ response: { status: 400 } })).toBe(true);
        expect(retryStrategies.excludeAuth({ response: { status: 404 } })).toBe(true);
      });
    });
  });

  describe('Integration with retry strategies', () => {
    it('uses networkOnly strategy', async () => {
      const networkError = new Error('Network failure');
      const fn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('recovered');

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        shouldRetry: retryStrategies.networkOnly
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('recovered');
    });

    it('uses serverErrorsOnly strategy', async () => {
      const serverError = { response: { status: 503 } };
      const fn = jest.fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue('recovered');

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        shouldRetry: retryStrategies.serverErrorsOnly
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('recovered');
    });

    it('does not retry auth errors with excludeAuth strategy', async () => {
      const authError = { response: { status: 401 } };
      const fn = jest.fn().mockRejectedValue(authError);

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          shouldRetry: retryStrategies.excludeAuth
        })
      ).rejects.toEqual(authError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('uses custom status codes strategy', async () => {
      const rateLimitError = { response: { status: 429 } };
      const fn = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        shouldRetry: retryStrategies.statusCodes([429, 503])
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      await expect(
        retryWithBackoff(fn, { maxRetries: 0 })
      ).rejects.toThrow('Fail');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('handles errors without message', async () => {
      const fn = jest.fn().mockRejectedValue(null);

      const promise = retryWithBackoff(fn, { maxRetries: 1 });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).rejects.toBe(null);
    });

    it('handles synchronous errors', async () => {
      const fn = jest.fn(() => {
        throw new Error('Sync error');
      });

      await expect(
        retryWithBackoff(fn, { maxRetries: 0 })
      ).rejects.toThrow('Sync error');
    });

    it('handles very large backoff multipliers', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 100,
        backoffMultiplier: 1000,
        maxDelay: 5000,
        onRetry
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await promise;

      // Should be capped at maxDelay
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 100);
    });

    it('preserves error properties', async () => {
      const customError = new Error('Custom error');
      customError.code = 'CUSTOM_CODE';
      customError.statusCode = 500;

      const fn = jest.fn().mockRejectedValue(customError);

      try {
        await retryWithBackoff(fn, { maxRetries: 0 });
      } catch (error) {
        expect(error.code).toBe('CUSTOM_CODE');
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('handles API rate limiting', async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount < 3) {
          const error = new Error('Too many requests');
          error.response = { status: 429 };
          throw error;
        }
        return 'success';
      });

      const promise = retryWithBackoff(fn, {
        maxRetries: 5,
        initialDelay: 500,
        shouldRetry: retryStrategies.statusCodes([429])
      });

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('handles intermittent network failures', async () => {
      let callCount = 0;
      const fn = jest.fn(async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Network timeout');
        }
        return { data: 'recovered' };
      });

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        shouldRetry: retryStrategies.networkOnly
      });

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toEqual({ data: 'recovered' });
    });
  });
});
