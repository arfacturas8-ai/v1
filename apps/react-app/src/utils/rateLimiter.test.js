/**
 * Tests for rateLimiter utility
 */
import rateLimiter from './rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    // Clear request log before each test
    rateLimiter.requestLog.clear();
  });

  describe('getLimitConfig', () => {
    it('returns search limit config for search endpoints', () => {
      const config = rateLimiter.getLimitConfig('/api/search');
      expect(config.maxRequests).toBe(10);
      expect(config.windowMs).toBe(10000);
    });

    it('returns auth limit config for auth endpoints', () => {
      const config = rateLimiter.getLimitConfig('/api/auth/login');
      expect(config.maxRequests).toBe(5);
      expect(config.windowMs).toBe(60000);
    });

    it('returns upload limit config for upload endpoints', () => {
      const config = rateLimiter.getLimitConfig('/api/upload/file');
      expect(config.maxRequests).toBe(3);
      expect(config.windowMs).toBe(60000);
    });

    it('returns messages limit config for message endpoints', () => {
      const config = rateLimiter.getLimitConfig('/api/messages/send');
      expect(config.maxRequests).toBe(30);
      expect(config.windowMs).toBe(10000);
    });

    it('returns default limit config for unknown endpoints', () => {
      const config = rateLimiter.getLimitConfig('/api/unknown');
      expect(config.maxRequests).toBe(20);
      expect(config.windowMs).toBe(10000);
    });
  });

  describe('isAllowed', () => {
    it('allows first request', () => {
      expect(rateLimiter.isAllowed('/api/test')).toBe(true);
    });

    it('allows requests under limit', () => {
      const endpoint = '/api/test';

      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.isAllowed(endpoint)).toBe(true);
        rateLimiter.recordRequest(endpoint);
      }
    });

    it('blocks requests over limit', () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      // Fill up to limit
      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      // Next request should be blocked
      expect(rateLimiter.isAllowed(endpoint)).toBe(false);
    });

    it('allows requests after time window expires', () => {
      jest.useFakeTimers();
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      // Fill up to limit
      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      expect(rateLimiter.isAllowed(endpoint)).toBe(false);

      // Fast forward past window
      jest.advanceTimersByTime(config.windowMs + 1000);

      expect(rateLimiter.isAllowed(endpoint)).toBe(true);

      jest.useRealTimers();
    });

    it('enforces global limit across endpoints', () => {
      const endpoints = ['/api/test1', '/api/test2', '/api/test3'];
      const globalLimit = rateLimiter.limits.global.maxRequests;

      // Distribute requests across endpoints
      let count = 0;
      while (count < globalLimit) {
        const endpoint = endpoints[count % endpoints.length];
        rateLimiter.recordRequest(endpoint);
        count++;
      }

      // All endpoints should be blocked due to global limit
      endpoints.forEach(endpoint => {
        expect(rateLimiter.isAllowed(endpoint)).toBe(false);
      });
    });

    it('creates request log for new endpoints', () => {
      const endpoint = '/api/new-endpoint';
      expect(rateLimiter.requestLog.has(endpoint)).toBe(false);

      rateLimiter.isAllowed(endpoint);

      expect(rateLimiter.requestLog.has(endpoint)).toBe(true);
    });

    it('filters old requests outside time window', () => {
      jest.useFakeTimers();
      const endpoint = '/api/test';

      // Record old request
      rateLimiter.recordRequest(endpoint);

      // Advance past window
      jest.advanceTimersByTime(11000);

      // Old request should be filtered out
      expect(rateLimiter.isAllowed(endpoint)).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('recordRequest', () => {
    it('records timestamp for endpoint', () => {
      const endpoint = '/api/test';
      const before = Date.now();

      rateLimiter.recordRequest(endpoint);

      const log = rateLimiter.requestLog.get(endpoint);
      expect(log).toBeDefined();
      expect(log.length).toBe(1);
      expect(log[0]).toBeGreaterThanOrEqual(before);
    });

    it('creates log array if not exists', () => {
      const endpoint = '/api/new';
      expect(rateLimiter.requestLog.has(endpoint)).toBe(false);

      rateLimiter.recordRequest(endpoint);

      expect(rateLimiter.requestLog.has(endpoint)).toBe(true);
      expect(Array.isArray(rateLimiter.requestLog.get(endpoint))).toBe(true);
    });

    it('appends to existing log', () => {
      const endpoint = '/api/test';

      rateLimiter.recordRequest(endpoint);
      rateLimiter.recordRequest(endpoint);
      rateLimiter.recordRequest(endpoint);

      const log = rateLimiter.requestLog.get(endpoint);
      expect(log.length).toBe(3);
    });
  });

  describe('waitUntilAllowed', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('resolves immediately if allowed', async () => {
      const endpoint = '/api/test';

      const promise = rateLimiter.waitUntilAllowed(endpoint);

      await expect(promise).resolves.toBe(true);
    });

    it('waits and retries with exponential backoff', async () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      // Fill up limit
      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      const promise = rateLimiter.waitUntilAllowed(endpoint);

      // Should wait 1 second on first retry
      jest.advanceTimersByTime(1000);

      // Still blocked, should wait 2 seconds
      jest.advanceTimersByTime(2000);

      // Clear the log to allow request
      rateLimiter.requestLog.clear();

      // Should wait 4 seconds
      jest.advanceTimersByTime(4000);

      await expect(promise).resolves.toBe(true);
    });

    it('throws after max retries', async () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      // Fill up limit permanently
      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      const promise = rateLimiter.waitUntilAllowed(endpoint);

      // Fast forward through all retries
      for (let i = 0; i < 6; i++) {
        jest.advanceTimersByTime(16000);
      }

      await expect(promise).rejects.toThrow('Rate limit exceeded');
    });

    it('uses exponential backoff delays', async () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      const promise = rateLimiter.waitUntilAllowed(endpoint);

      // Verify delays: 1s, 2s, 4s, 8s, 16s (capped)
      const delays = [1000, 2000, 4000, 8000, 16000];

      for (const delay of delays) {
        jest.advanceTimersByTime(delay);
      }
    });
  });

  describe('cleanup', () => {
    it('removes empty endpoint logs', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';
      rateLimiter.recordRequest(endpoint);

      // Advance past max window
      jest.advanceTimersByTime(70000);

      rateLimiter.cleanup();

      expect(rateLimiter.requestLog.has(endpoint)).toBe(false);

      jest.useRealTimers();
    });

    it('keeps recent requests', () => {
      const endpoint = '/api/test';
      rateLimiter.recordRequest(endpoint);

      rateLimiter.cleanup();

      expect(rateLimiter.requestLog.has(endpoint)).toBe(true);
    });

    it('filters old requests from logs', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';

      // Old request
      rateLimiter.recordRequest(endpoint);
      jest.advanceTimersByTime(70000);

      // Recent request
      rateLimiter.recordRequest(endpoint);

      rateLimiter.cleanup();

      const log = rateLimiter.requestLog.get(endpoint);
      expect(log.length).toBe(1);

      jest.useRealTimers();
    });

    it('handles multiple endpoints', () => {
      jest.useFakeTimers();

      rateLimiter.recordRequest('/api/old');
      jest.advanceTimersByTime(70000);

      rateLimiter.recordRequest('/api/recent');

      rateLimiter.cleanup();

      expect(rateLimiter.requestLog.has('/api/old')).toBe(false);
      expect(rateLimiter.requestLog.has('/api/recent')).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('getRemaining', () => {
    it('returns max requests for new endpoint', () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      expect(rateLimiter.getRemaining(endpoint)).toBe(config.maxRequests);
    });

    it('returns remaining count after requests', () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      rateLimiter.recordRequest(endpoint);
      rateLimiter.recordRequest(endpoint);

      expect(rateLimiter.getRemaining(endpoint)).toBe(config.maxRequests - 2);
    });

    it('returns 0 when limit reached', () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      expect(rateLimiter.getRemaining(endpoint)).toBe(0);
    });

    it('increases after time window expires', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      expect(rateLimiter.getRemaining(endpoint)).toBe(0);

      jest.advanceTimersByTime(config.windowMs + 1000);

      expect(rateLimiter.getRemaining(endpoint)).toBe(config.maxRequests);

      jest.useRealTimers();
    });

    it('filters expired requests', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';

      // Old requests
      rateLimiter.recordRequest(endpoint);
      rateLimiter.recordRequest(endpoint);

      jest.advanceTimersByTime(11000);

      // Recent request
      rateLimiter.recordRequest(endpoint);

      const remaining = rateLimiter.getRemaining(endpoint);
      const config = rateLimiter.getLimitConfig(endpoint);

      expect(remaining).toBe(config.maxRequests - 1);

      jest.useRealTimers();
    });
  });

  describe('getRetryAfter', () => {
    it('returns 0 for new endpoint', () => {
      expect(rateLimiter.getRetryAfter('/api/test')).toBe(0);
    });

    it('returns 0 when under limit', () => {
      const endpoint = '/api/test';
      rateLimiter.recordRequest(endpoint);

      expect(rateLimiter.getRetryAfter(endpoint)).toBe(0);
    });

    it('returns time until oldest request expires', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      // Fill to limit
      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      // Advance 5 seconds
      jest.advanceTimersByTime(5000);

      const retryAfter = rateLimiter.getRetryAfter(endpoint);

      // Should be roughly windowMs - 5000
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(config.windowMs);

      jest.useRealTimers();
    });

    it('decreases as time passes', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      const retryAfter1 = rateLimiter.getRetryAfter(endpoint);

      jest.advanceTimersByTime(3000);

      const retryAfter2 = rateLimiter.getRetryAfter(endpoint);

      expect(retryAfter2).toBeLessThan(retryAfter1);

      jest.useRealTimers();
    });

    it('returns 0 after window expires', () => {
      jest.useFakeTimers();

      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint);
      }

      jest.advanceTimersByTime(config.windowMs + 1000);

      expect(rateLimiter.getRetryAfter(endpoint)).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent requests to same endpoint', () => {
      const endpoint = '/api/test';

      const allowed1 = rateLimiter.isAllowed(endpoint);
      const allowed2 = rateLimiter.isAllowed(endpoint);
      const allowed3 = rateLimiter.isAllowed(endpoint);

      expect(allowed1).toBe(true);
      expect(allowed2).toBe(true);
      expect(allowed3).toBe(true);
    });

    it('handles different endpoints independently', () => {
      const endpoint1 = '/api/test1';
      const endpoint2 = '/api/test2';
      const config = rateLimiter.getLimitConfig(endpoint1);

      for (let i = 0; i < config.maxRequests; i++) {
        rateLimiter.recordRequest(endpoint1);
      }

      expect(rateLimiter.isAllowed(endpoint1)).toBe(false);
      expect(rateLimiter.isAllowed(endpoint2)).toBe(true);
    });

    it('handles rapid consecutive requests', () => {
      const endpoint = '/api/test';
      const config = rateLimiter.getLimitConfig(endpoint);

      for (let i = 0; i < config.maxRequests * 2; i++) {
        if (rateLimiter.isAllowed(endpoint)) {
          rateLimiter.recordRequest(endpoint);
        }
      }

      const log = rateLimiter.requestLog.get(endpoint);
      expect(log.length).toBe(config.maxRequests);
    });

    it('maintains separate limits for specific endpoints', () => {
      const searchEndpoint = '/api/search';
      const authEndpoint = '/api/auth/login';

      const searchConfig = rateLimiter.getLimitConfig(searchEndpoint);
      const authConfig = rateLimiter.getLimitConfig(authEndpoint);

      expect(searchConfig.maxRequests).not.toBe(authConfig.maxRequests);

      // Fill search limit
      for (let i = 0; i < searchConfig.maxRequests; i++) {
        rateLimiter.recordRequest(searchEndpoint);
      }

      // Auth should still be allowed
      expect(rateLimiter.isAllowed(authEndpoint)).toBe(true);
    });
  });
});
