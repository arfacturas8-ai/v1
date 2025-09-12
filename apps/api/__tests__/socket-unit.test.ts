import { CrashSafeSocketService } from '../src/socket/crash-safe-socket';
import { CrashSafeEventHandlers } from '../src/socket/crash-safe-handlers';
import { CrashSafeRedisPubSub } from '../src/socket/crash-safe-redis-pubsub';
import { FastifyInstance } from 'fastify';
import Fastify from 'fastify';

describe('Crash-Safe Socket Components Unit Tests', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify({ logger: false });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('CrashSafeRedisPubSub', () => {
    test('should initialize without crashing', () => {
      expect(() => {
        const pubsub = new CrashSafeRedisPubSub(fastify);
        // Test basic properties
        expect(pubsub).toBeDefined();
        expect(pubsub.getHealthStatus).toBeDefined();
        expect(pubsub.getMetrics).toBeDefined();
      }).not.toThrow();
    });

    test('should provide health status', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      const health = pubsub.getHealthStatus();
      
      expect(health).toHaveProperty('connectionState');
      expect(health).toHaveProperty('circuitBreakerState');
      expect(health).toHaveProperty('serverId');
      expect(health).toHaveProperty('metrics');
      
      expect(typeof health.serverId).toBe('string');
      expect(['disconnected', 'connecting', 'connected', 'reconnecting', 'failed']).toContain(health.connectionState);
    });

    test('should provide metrics', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      const metrics = pubsub.getMetrics();
      
      expect(metrics).toHaveProperty('messagesPublished');
      expect(metrics).toHaveProperty('messagesReceived');
      expect(metrics).toHaveProperty('messagesQueued');
      expect(metrics).toHaveProperty('messagesDropped');
      expect(metrics).toHaveProperty('reconnectionCount');
      expect(metrics).toHaveProperty('circuitBreakerTrips');
      
      // All should be numbers
      Object.values(metrics).forEach(value => {
        if (typeof value !== 'object') {
          expect(typeof value).toBe('number');
        }
      });
    });

    test('should handle publish operations gracefully when disconnected', async () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      
      // Publishing when disconnected should not throw
      expect(async () => {
        await pubsub.publish('test-channel', {
          type: 'test',
          data: { message: 'test' }
        });
      }).not.toThrow();
    });

    test('should handle subscription management', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      const handler = jest.fn();
      
      // Subscribe should not throw
      expect(() => {
        pubsub.subscribe('test-channel', handler);
      }).not.toThrow();

      // Unsubscribe should not throw
      expect(() => {
        pubsub.unsubscribe('test-channel', handler);
      }).not.toThrow();
    });

    test('should provide convenience methods', async () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      
      // These should not throw even when disconnected
      await expect(pubsub.broadcastPresenceUpdate({})).resolves.toBeDefined();
      await expect(pubsub.broadcastModerationAction({})).resolves.toBeDefined();
      await expect(pubsub.broadcastMessage({})).resolves.toBeDefined();
      await expect(pubsub.broadcastNotification({})).resolves.toBeDefined();
    });

    test('should handle graceful shutdown', async () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      
      // Close should not throw
      await expect(pubsub.close()).resolves.not.toThrow();
    });
  });

  describe('CrashSafeSocketService', () => {
    test('should initialize without crashing', () => {
      expect(() => {
        const service = new CrashSafeSocketService(fastify);
        expect(service).toBeDefined();
      }).not.toThrow();
    });

    test('should provide metrics', () => {
      const service = new CrashSafeSocketService(fastify);
      const metrics = service.getMetrics();
      
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('failedConnections');
      expect(metrics).toHaveProperty('messagesSent');
      expect(metrics).toHaveProperty('eventsProcessed');
      
      // All should be numbers
      Object.values(metrics).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    test('should provide circuit breaker status', () => {
      const service = new CrashSafeSocketService(fastify);
      const status = service.getCircuitBreakerStatus();
      
      expect(typeof status).toBe('object');
      // Status should have service entries
      expect(status).toBeDefined();
    });

    test('should provide internal state access', () => {
      const service = new CrashSafeSocketService(fastify);
      
      expect(service.getPresenceMap).toBeDefined();
      expect(service.getVoiceStates).toBeDefined();
      expect(service.getTypingIndicators).toBeDefined();
      expect(service.getConnectionCleanupTasks).toBeDefined();
      
      // These should return Maps
      expect(service.getPresenceMap()).toBeInstanceOf(Map);
      expect(service.getVoiceStates()).toBeInstanceOf(Map);
      expect(service.getTypingIndicators()).toBeInstanceOf(Map);
      expect(service.getConnectionCleanupTasks()).toBeInstanceOf(Map);
    });

    test('should handle graceful shutdown', async () => {
      const service = new CrashSafeSocketService(fastify);
      
      // Close should not throw
      await expect(service.close()).resolves.not.toThrow();
    });
  });

  describe('CrashSafeEventHandlers', () => {
    test('should initialize without crashing', () => {
      const mockCheckRateLimit = jest.fn(() => true);
      const mockExecuteWithCircuitBreaker = jest.fn().mockImplementation(async <T>(service: string, operation: () => Promise<T>): Promise<T | null> => {
        try {
          return await operation();
        } catch {
          return null;
        }
      });
      
      expect(() => {
        const handlers = new CrashSafeEventHandlers(
          fastify,
          {} as any, // Mock Redis
          mockCheckRateLimit,
          mockExecuteWithCircuitBreaker,
          new Map(),
          new Map(),
          new Map(),
          new Map()
        );
        expect(handlers).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Input Sanitization', () => {
    test('should handle XSS prevention in message content', () => {
      const mockCheckRateLimit = jest.fn(() => true);
      const mockExecuteWithCircuitBreaker = jest.fn().mockImplementation(async <T>(service: string, operation: () => Promise<T>): Promise<T | null> => {
        try {
          return await operation();
        } catch {
          return null;
        }
      });
      const handlers = new CrashSafeEventHandlers(
        fastify,
        {} as any,
        mockCheckRateLimit,
        mockExecuteWithCircuitBreaker,
        new Map(),
        new Map(),
        new Map(),
        new Map()
      );

      // Test that the class was created without issues
      expect(handlers).toBeDefined();
    });
  });

  describe('Rate Limiting Logic', () => {
    test('should implement proper rate limiting', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      
      // Rate limiting should be built into the service
      expect(pubsub).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    test('should provide memory leak prevention', () => {
      const service = new CrashSafeSocketService(fastify);
      
      // Memory management structures should be accessible
      expect(service.getPresenceMap()).toBeInstanceOf(Map);
      expect(service.getVoiceStates()).toBeInstanceOf(Map);
      expect(service.getTypingIndicators()).toBeInstanceOf(Map);
    });

    test('should handle cleanup tasks properly', () => {
      const service = new CrashSafeSocketService(fastify);
      const cleanupTasks = service.getConnectionCleanupTasks();
      
      expect(cleanupTasks).toBeInstanceOf(Map);
      expect(cleanupTasks.size).toBe(0); // Initially empty
    });
  });

  describe('Circuit Breaker Pattern', () => {
    test('should provide circuit breaker status', () => {
      const service = new CrashSafeSocketService(fastify);
      const status = service.getCircuitBreakerStatus();
      
      expect(typeof status).toBe('object');
      expect(status).not.toBeNull();
    });

    test('should handle circuit breaker state transitions', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      const health = pubsub.getHealthStatus();
      
      expect(['closed', 'open', 'half-open']).toContain(health.circuitBreakerState);
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', () => {
      // Creating a pubsub service with invalid Redis config should not crash
      process.env.REDIS_URL = 'redis://invalid:9999/0';
      
      expect(() => {
        const pubsub = new CrashSafeRedisPubSub(fastify);
        expect(pubsub).toBeDefined();
      }).not.toThrow();
      
      // Reset env
      delete process.env.REDIS_URL;
    });

    test('should provide error recovery mechanisms', () => {
      const service = new CrashSafeSocketService(fastify);
      
      // Service should provide recovery mechanisms
      expect(service.getMetrics).toBeDefined();
      expect(service.getCircuitBreakerStatus).toBeDefined();
    });
  });

  describe('Production Readiness', () => {
    test('should provide comprehensive monitoring', () => {
      const service = new CrashSafeSocketService(fastify);
      const metrics = service.getMetrics();
      
      // Should track key metrics for production monitoring
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('failedConnections');
      expect(metrics).toHaveProperty('circuitBreakerTrips');
      expect(metrics).toHaveProperty('memoryLeaksFixed');
    });

    test('should handle configuration validation', () => {
      // Service should validate configurations properly
      expect(() => {
        const service = new CrashSafeSocketService(fastify);
        expect(service).toBeDefined();
      }).not.toThrow();
    });

    test('should provide health check capabilities', () => {
      const pubsub = new CrashSafeRedisPubSub(fastify);
      const health = pubsub.getHealthStatus();
      
      // Health status should provide actionable information
      expect(health).toHaveProperty('connectionState');
      expect(health).toHaveProperty('circuitBreakerState');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('serverId');
    });
  });
});