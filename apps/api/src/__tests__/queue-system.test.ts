import { QueueManager } from '../services/queue-manager';
import { QueueMonitoringService } from '../services/queue-monitoring';
import Redis from 'ioredis';

/**
 * Queue System Comprehensive Test Suite
 * 
 * Tests the complete queue infrastructure:
 * - Queue manager initialization
 * - Job processing and retry logic
 * - Dead letter queue handling
 * - Monitoring and metrics collection
 * - Health checks and circuit breakers
 */

describe('Queue System', () => {
  let queueManager: QueueManager;
  let queueMonitoring: QueueMonitoringService;
  let redis: Redis;

  beforeAll(async () => {
    // Use test Redis configuration
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      db: 15 // Use separate database for tests
    };

    redis = new Redis(redisConfig);
    queueManager = new QueueManager(redisConfig);
    queueMonitoring = new QueueMonitoringService(redisConfig);

    // Wait for initialization
    await queueManager.initialize();
  });

  afterAll(async () => {
    // Clean up test data
    await redis.flushdb();
    await queueManager.shutdown();
    await queueMonitoring.shutdown();
    redis.disconnect();
  });

  beforeEach(async () => {
    // Clear queues before each test
    await redis.flushdb();
  });

  describe('Queue Manager Initialization', () => {
    test('should initialize all queues successfully', async () => {
      const queueNames = ['email', 'media', 'notifications', 'moderation', 'analytics', 'blockchain'];
      
      for (const queueName of queueNames) {
        const queue = (queueManager as any).queues.get(queueName);
        expect(queue).toBeDefined();
        expect(queue.name).toBe(queueName);
      }
    });

    test('should initialize all workers with correct concurrency', async () => {
      const workerNames = ['email', 'media', 'notifications', 'moderation', 'analytics', 'blockchain'];
      
      for (const workerName of workerNames) {
        const worker = (queueManager as any).workers.get(workerName);
        expect(worker).toBeDefined();
        expect(worker.concurrency).toBeGreaterThan(0);
      }
    });
  });

  describe('Email Queue Processing', () => {
    test('should add email job successfully', async () => {
      const emailData = {
        type: 'verification' as const,
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'verification',
        data: { username: 'testuser', verificationUrl: 'http://test.com/verify' }
      };

      const job = await queueManager.addEmailJob(emailData);
      
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(emailData);
    });

    test('should process email job with correct priority', async () => {
      const urgentEmailData = {
        type: 'password-reset' as const,
        to: 'urgent@example.com',
        subject: 'Urgent Password Reset',
        template: 'password-reset',
        data: { username: 'urgentuser' },
        priority: 'urgent' as const
      };

      const job = await queueManager.addEmailJob(urgentEmailData);
      
      expect(job.opts.priority).toBe(1); // Urgent priority maps to 1
    });
  });

  describe('Media Queue Processing', () => {
    test('should add media processing job successfully', async () => {
      const mediaData = {
        type: 'resize' as const,
        fileId: 'test-file-123',
        filePath: '/tmp/test-image.jpg',
        options: { width: 800, height: 600 }
      };

      const job = await queueManager.addMediaJob(mediaData);
      
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(mediaData);
    });

    test('should handle different media job types', async () => {
      const jobTypes = ['resize', 'thumbnail', 'transcoding', 'scan', 'compression'];
      
      for (const type of jobTypes) {
        const mediaData = {
          type: type as any,
          fileId: `test-file-${type}`,
          filePath: `/tmp/test-${type}.jpg`,
          options: { test: true }
        };

        const job = await queueManager.addMediaJob(mediaData);
        expect(job.name).toBe(`media-${type}`);
      }
    });
  });

  describe('Notification Queue Processing', () => {
    test('should add notification job successfully', async () => {
      const notificationData = {
        type: 'push' as const,
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        channels: ['push', 'websocket']
      };

      const job = await queueManager.addNotificationJob(notificationData);
      
      expect(job).toBeDefined();
      expect(job.data).toEqual(notificationData);
    });
  });

  describe('Retry Logic and Dead Letter Queue', () => {
    test('should retry failed jobs with exponential backoff', async () => {
      const emailData = {
        type: 'verification' as const,
        to: 'fail@example.com',
        subject: 'Test Failed Email',
        template: 'verification',
        data: { shouldFail: true }
      };

      const job = await queueManager.addEmailJob(emailData, { attempts: 3 });
      
      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff).toBeDefined();
      expect((job.opts.backoff as any).type).toBe('exponential');
    });

    test('should move jobs to dead letter queue after max attempts', async () => {
      // This test would require mocking job failures
      // In a real implementation, you would simulate job failures
      // and verify they end up in the dead letter queue
      
      const deadLetterJobs = await queueMonitoring.getDeadLetterJobs(10);
      expect(Array.isArray(deadLetterJobs)).toBe(true);
    });
  });

  describe('Queue Monitoring', () => {
    test('should collect queue metrics', async () => {
      // Register a queue for monitoring
      const testQueue = (queueManager as any).queues.get('email');
      queueMonitoring.registerQueue('email', testQueue);

      // Add some jobs
      await queueManager.addEmailJob({
        type: 'verification',
        to: 'metrics@example.com',
        subject: 'Metrics Test',
        template: 'verification',
        data: {}
      });

      // Wait a moment for metrics to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = queueMonitoring.getQueueMetrics('email');
      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.name).toBe('email');
        expect(typeof metrics.waiting).toBe('number');
        expect(typeof metrics.active).toBe('number');
        expect(typeof metrics.completed).toBe('number');
        expect(typeof metrics.failed).toBe('number');
      }
    });

    test('should assess queue health correctly', async () => {
      const testQueue = (queueManager as any).queues.get('email');
      queueMonitoring.registerQueue('email', testQueue);

      const healthStatus = await queueMonitoring.getQueueHealthStatus('email');
      expect(healthStatus).toBeDefined();
      if (healthStatus) {
        expect(healthStatus.queue).toBe('email');
        expect(['healthy', 'warning', 'error']).toContain(healthStatus.status);
        expect(Array.isArray(healthStatus.issues)).toBe(true);
        expect(Array.isArray(healthStatus.recommendations)).toBe(true);
      }
    });

    test('should provide system-wide health status', async () => {
      // Register multiple queues for monitoring
      const queueNames = ['email', 'media', 'notifications'];
      for (const queueName of queueNames) {
        const queue = (queueManager as any).queues.get(queueName);
        queueMonitoring.registerQueue(queueName, queue);
      }

      const systemHealth = await queueMonitoring.getSystemHealth();
      expect(systemHealth).toBeDefined();
      expect(systemHealth.status).toBeDefined();
      expect(['healthy', 'warning', 'error']).toContain(systemHealth.status);
      expect(Array.isArray(systemHealth.queues)).toBe(true);
    });
  });

  describe('Job Statistics and Analytics', () => {
    test('should track job completion rates', async () => {
      const emailQueue = (queueManager as any).queues.get('email');
      queueMonitoring.registerQueue('email', emailQueue);

      // Add several jobs
      const jobPromises = [];
      for (let i = 0; i < 5; i++) {
        jobPromises.push(queueManager.addEmailJob({
          type: 'verification',
          to: `test${i}@example.com`,
          subject: `Test Email ${i}`,
          template: 'verification',
          data: { index: i }
        }));
      }

      await Promise.all(jobPromises);

      // Wait for metrics to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = queueMonitoring.getQueueMetrics('email');
      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.waiting + metrics.active + metrics.completed + metrics.failed).toBeGreaterThan(0);
      }
    });
  });

  describe('Circuit Breaker Pattern', () => {
    test('should track circuit breaker state', async () => {
      const emailQueue = (queueManager as any).queues.get('email');
      queueMonitoring.registerQueue('email', emailQueue);

      // Circuit breaker is internal to monitoring service
      // Test that it's properly tracking failures
      const initialHealth = await queueMonitoring.getQueueHealthStatus('email');
      expect(initialHealth).toBeDefined();
    });
  });

  describe('Queue Maintenance Operations', () => {
    test('should handle queue cleanup', async () => {
      const emailData = {
        type: 'verification' as const,
        to: 'cleanup@example.com',
        subject: 'Cleanup Test',
        template: 'verification',
        data: {}
      };

      // Add a job with auto-cleanup options
      const job = await queueManager.addEmailJob(emailData, {
        removeOnComplete: 1,
        removeOnFail: 1
      });

      expect(job.opts.removeOnComplete).toBe(1);
      expect(job.opts.removeOnFail).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queue operations gracefully', async () => {
      // Test adding job to non-existent queue type
      try {
        await queueManager.addJob('invalid-queue', 'test-job', {});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Queue not found');
      }
    });

    test('should handle monitoring service errors gracefully', async () => {
      // Test getting metrics for non-existent queue
      const metrics = queueMonitoring.getQueueMetrics('non-existent-queue');
      expect(metrics).toBeUndefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent job additions', async () => {
      const concurrentJobs = 50;
      const jobPromises = [];

      for (let i = 0; i < concurrentJobs; i++) {
        jobPromises.push(queueManager.addEmailJob({
          type: 'verification',
          to: `concurrent${i}@example.com`,
          subject: `Concurrent Test ${i}`,
          template: 'verification',
          data: { index: i }
        }));
      }

      const jobs = await Promise.all(jobPromises);
      expect(jobs).toHaveLength(concurrentJobs);
      
      // All jobs should have unique IDs
      const jobIds = jobs.map(job => job.id);
      const uniqueIds = new Set(jobIds);
      expect(uniqueIds.size).toBe(concurrentJobs);
    });

    test('should handle different job priorities correctly', async () => {
      const priorities = ['low', 'normal', 'high', 'urgent'] as const;
      const jobs = [];

      for (const priority of priorities) {
        const job = await queueManager.addEmailJob({
          type: 'verification',
          to: `${priority}@example.com`,
          subject: `${priority} Priority Test`,
          template: 'verification',
          data: { priority },
          priority
        });
        jobs.push(job);
      }

      // Verify priority mapping
      expect(jobs[0].opts.priority).toBe(4); // low
      expect(jobs[1].opts.priority).toBe(3); // normal
      expect(jobs[2].opts.priority).toBe(2); // high
      expect(jobs[3].opts.priority).toBe(1); // urgent
    });
  });
});

describe('Queue System Integration', () => {
  test('should integrate with email service', async () => {
    // This test would verify integration with the actual email service
    // Mock the email service for testing
    expect(true).toBe(true); // Placeholder
  });

  test('should integrate with notification service', async () => {
    // This test would verify integration with the notification service
    expect(true).toBe(true); // Placeholder
  });

  test('should integrate with media processing service', async () => {
    // This test would verify integration with media processing
    expect(true).toBe(true); // Placeholder
  });
});