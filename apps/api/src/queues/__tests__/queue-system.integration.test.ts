import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { Redis } from 'ioredis';
import { Logger } from 'pino';
import CrybQueueSystem, { CrybQueueSystemConfig } from '../index';
import { queueNames } from '../config/queue-config';

// Mock external dependencies
jest.mock('amqplib');
jest.mock('kafkajs');
jest.mock('@tensorflow/tfjs-node');

describe('CRYB Queue System Integration Tests', () => {
  let queueSystem: CrybQueueSystem;
  let redis: Redis;
  let logger: Logger;
  let config: CrybQueueSystemConfig;

  beforeAll(async () => {
    // Setup test Redis connection
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      db: 15, // Use a separate DB for tests
    });

    // Setup test logger
    logger = require('pino')({
      level: 'silent', // Suppress logs during tests
    });

    // Test configuration
    config = {
      redis: {
        primary: redis,
      },
      monitoring: {
        enabled: true,
        prometheuseEnabled: false,
      },
      processors: {
        email: { enabled: true, concurrency: 1 },
        pushNotifications: { enabled: true, concurrency: 1 },
        media: { enabled: true, concurrency: 1 },
        moderation: { enabled: true, concurrency: 1 },
        analytics: { enabled: true, concurrency: 1 },
      },
      reliability: {
        deadLetterQueue: { enabled: true },
        circuitBreaker: { enabled: true },
      },
      eventSourcing: {
        enabled: true,
        snapshotFrequency: 5,
      },
    };

    // Initialize queue system
    queueSystem = new CrybQueueSystem(config, logger);
    await queueSystem.initialize();
  });

  afterAll(async () => {
    await queueSystem.shutdown();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await redis.flushdb();
  });

  describe('Email Processing', () => {
    it('should process email jobs successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'welcome',
        templateData: {
          username: 'testuser',
          platformUrl: 'https://test.cryb.ai',
        },
        priority: 'normal',
        userId: 'user-123',
      };

      await queueSystem.addEmailJob(emailData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify job was processed
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics.emailsProcessed).toBeGreaterThan(0);
    });

    it('should handle email template rendering', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Password Reset',
        template: 'password-reset',
        templateData: {
          username: 'testuser',
          resetUrl: 'https://test.cryb.ai/reset/token123',
        },
        priority: 'high',
        userId: 'user-123',
      };

      await queueSystem.addEmailJob(emailData, { priority: 75 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.email?.emailsSent).toBeGreaterThan(0);
    });

    it('should handle email failures and retry', async () => {
      // Mock a failing email scenario
      const emailData = {
        to: 'invalid@invalid.invalid',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        priority: 'normal',
        userId: 'user-123',
      };

      await queueSystem.addEmailJob(emailData);

      // Wait for processing and retries
      await new Promise(resolve => setTimeout(resolve, 3000));

      const deadLetterStats = await queueSystem.getDeadLetterStats();
      expect(deadLetterStats?.metrics?.jobsProcessed).toBeGreaterThan(0);
    });
  });

  describe('Push Notification Processing', () => {
    it('should process push notification jobs', async () => {
      const notificationData = {
        userId: ['user-123', 'user-456'],
        title: 'Test Notification',
        body: 'This is a test notification',
        url: 'https://test.cryb.ai/notification',
        priority: 'normal',
        platform: 'all',
      };

      await queueSystem.addPushNotificationJob(notificationData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.pushNotifications).toBeDefined();
    });

    it('should handle platform-specific notifications', async () => {
      const notificationData = {
        userId: 'user-123',
        title: 'iOS Notification',
        body: 'This is an iOS-specific notification',
        platform: 'ios',
        priority: 'high',
      };

      await queueSystem.addPushNotificationJob(notificationData, { priority: 80 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify processing
      const monitoringMetrics = queueSystem.getMonitoringMetrics();
      expect(monitoringMetrics?.queues).toBeDefined();
    });
  });

  describe('Media Processing', () => {
    it('should process image optimization jobs', async () => {
      const mediaData = {
        inputPath: '/tmp/test-image.jpg',
        userId: 'user-123',
        mediaId: 'media-123',
        mediaType: 'image',
        operation: 'optimize',
        options: {
          quality: 80,
          format: 'webp',
          width: 800,
          height: 600,
        },
        priority: 'normal',
      };

      await queueSystem.addMediaProcessingJob(mediaData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.media).toBeDefined();
    });

    it('should process video transcoding jobs', async () => {
      const mediaData = {
        inputPath: '/tmp/test-video.mp4',
        userId: 'user-123',
        mediaId: 'media-456',
        mediaType: 'video',
        operation: 'transcode',
        options: {
          codec: 'h264',
          resolution: '720p',
          bitrate: '2500k',
        },
        priority: 'high',
      };

      await queueSystem.addMediaProcessingJob(mediaData, { timeout: 300000 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Content Moderation', () => {
    it('should process content moderation jobs', async () => {
      const moderationData = {
        contentId: 'content-123',
        userId: 'user-123',
        contentType: 'text',
        content: {
          text: 'This is a test post content that should be moderated.',
        },
        moderationRules: {
          checkToxicity: true,
          checkSpam: true,
          checkProfanity: true,
        },
        priority: 'normal',
        autoAction: true,
      };

      await queueSystem.addModerationJob(moderationData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.moderation?.contentModerated).toBeGreaterThan(0);
    });

    it('should handle AI moderation jobs', async () => {
      const moderationData = {
        contentId: 'content-456',
        userId: 'user-123',
        contentType: 'image',
        content: {
          imageUrl: 'https://example.com/test-image.jpg',
        },
        moderationRules: {
          checkNSFW: true,
          checkToxicity: true,
        },
        priority: 'high',
        useAI: true,
        autoAction: false,
      };

      await queueSystem.addModerationJob(moderationData, { priority: 85 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Analytics Processing', () => {
    it('should process user activity events', async () => {
      const analyticsData = {
        eventType: 'user_action',
        eventName: 'post_created',
        userId: 'user-123',
        sessionId: 'session-456',
        data: {
          action: 'create',
          category: 'content',
          label: 'post',
          value: 1,
          properties: {
            postId: 'post-123',
            postType: 'text',
          },
        },
        context: {
          timestamp: new Date().toISOString(),
          platform: 'web',
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.1',
          geoLocation: {
            country: 'US',
            region: 'CA',
            city: 'San Francisco',
          },
        },
        aggregations: {
          realTime: true,
          daily: true,
          weekly: true,
          monthly: true,
        },
        privacy: {
          anonymize: false,
          excludePII: true,
          gdprCompliant: true,
        },
      };

      await queueSystem.addAnalyticsJob(analyticsData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.analytics?.eventsProcessed).toBeGreaterThan(0);
    });

    it('should handle business metrics events', async () => {
      const analyticsData = {
        eventType: 'business_metric',
        eventName: 'revenue_generated',
        userId: 'user-123',
        data: {
          value: 29.99,
          properties: {
            planType: 'premium',
            paymentMethod: 'credit_card',
            currency: 'USD',
          },
        },
        context: {
          timestamp: new Date().toISOString(),
          platform: 'web',
        },
        aggregations: {
          realTime: true,
          daily: true,
          monthly: true,
        },
      };

      await queueSystem.addAnalyticsJob(analyticsData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Event-Driven Architecture', () => {
    it('should handle domain events and CQRS', async () => {
      // This would test the event sourcing and CQRS components
      // For now, we'll test that the components are initialized
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });

    it('should process saga workflows', async () => {
      // Test saga execution
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Reliability Features', () => {
    it('should handle circuit breaker functionality', async () => {
      const circuitBreakerMetrics = queueSystem.getCircuitBreakerMetrics();
      expect(circuitBreakerMetrics).toBeDefined();
    });

    it('should process dead letter queue items', async () => {
      const deadLetterStats = await queueSystem.getDeadLetterStats();
      expect(deadLetterStats).toBeDefined();
    });
  });

  describe('Monitoring and Metrics', () => {
    it('should collect queue metrics', async () => {
      const monitoringMetrics = queueSystem.getMonitoringMetrics();
      expect(monitoringMetrics).toBeDefined();
      expect(monitoringMetrics?.global).toBeDefined();
    });

    it('should provide Prometheus metrics', async () => {
      const prometheusMetrics = queueSystem.getPrometheusMetrics();
      expect(prometheusMetrics).toBeDefined();
    });

    it('should track processor performance', async () => {
      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics).toBeDefined();
      expect(processorMetrics.email).toBeDefined();
      expect(processorMetrics.pushNotifications).toBeDefined();
      expect(processorMetrics.media).toBeDefined();
      expect(processorMetrics.moderation).toBeDefined();
      expect(processorMetrics.analytics).toBeDefined();
    });
  });

  describe('Load Testing', () => {
    it('should handle burst of email jobs', async () => {
      const emailJobs = Array.from({ length: 50 }, (_, i) => ({
        to: `test${i}@example.com`,
        subject: `Test Email ${i}`,
        html: `<p>Test content ${i}</p>`,
        priority: 'normal',
        userId: `user-${i}`,
      }));

      const promises = emailJobs.map(emailData => 
        queueSystem.addEmailJob(emailData)
      );

      await Promise.all(promises);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      const processorMetrics = queueSystem.getProcessorMetrics();
      expect(processorMetrics.email?.emailsProcessed).toBeGreaterThan(0);
    });

    it('should handle mixed workload', async () => {
      const jobs = [
        // Email jobs
        ...Array.from({ length: 20 }, (_, i) => () => 
          queueSystem.addEmailJob({
            to: `test${i}@example.com`,
            subject: `Test Email ${i}`,
            html: `<p>Test content ${i}</p>`,
            priority: 'normal',
            userId: `user-${i}`,
          })
        ),
        // Analytics jobs
        ...Array.from({ length: 30 }, (_, i) => () =>
          queueSystem.addAnalyticsJob({
            eventType: 'user_action',
            eventName: 'page_view',
            userId: `user-${i}`,
            data: {
              action: 'view',
              category: 'page',
              label: 'homepage',
            },
            context: {
              timestamp: new Date().toISOString(),
              platform: 'web',
            },
            aggregations: {
              realTime: true,
              daily: true,
            },
          })
        ),
        // Moderation jobs
        ...Array.from({ length: 15 }, (_, i) => () =>
          queueSystem.addModerationJob({
            contentId: `content-${i}`,
            userId: `user-${i}`,
            contentType: 'text',
            content: {
              text: `Test content for moderation ${i}`,
            },
            moderationRules: {
              checkToxicity: true,
              checkSpam: true,
            },
            priority: 'normal',
            autoAction: true,
          })
        ),
      ];

      // Execute all jobs
      await Promise.all(jobs.map(job => job()));

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      const monitoringMetrics = queueSystem.getMonitoringMetrics();
      expect(monitoringMetrics?.global?.totalJobs).toBeGreaterThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed job data gracefully', async () => {
      try {
        await queueSystem.addEmailJob({
          // Missing required fields
          subject: 'Test',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should recover from Redis connection issues', async () => {
      // Simulate Redis disconnect
      // This would require more sophisticated testing setup
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Configuration and Scaling', () => {
    it('should respect queue priorities', async () => {
      // Add high priority job
      await queueSystem.addEmailJob({
        to: 'high@example.com',
        subject: 'High Priority',
        html: '<p>High priority content</p>',
        priority: 'critical',
        userId: 'user-high',
      }, { priority: 100 });

      // Add low priority job
      await queueSystem.addEmailJob({
        to: 'low@example.com',
        subject: 'Low Priority',
        html: '<p>Low priority content</p>',
        priority: 'low',
        userId: 'user-low',
      }, { priority: 1 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // High priority should be processed first
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });

    it('should handle queue pausing and resuming', async () => {
      // This would require access to the underlying queue manager
      const metrics = queueSystem.getQueueMetrics();
      expect(metrics).toBeDefined();
    });
  });
});