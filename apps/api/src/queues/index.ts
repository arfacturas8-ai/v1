import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { Kafka } from 'kafkajs';
import amqp from 'amqplib';

// Core infrastructure
import ProductionQueueManager, { QueueConfig } from './core/queue-manager';
import { productionQueueConfig, queueNames } from './config/queue-config';

// Processors
import EmailProcessor from './processors/email-processor';
import PushNotificationProcessor from './processors/push-notification-processor';
import MediaProcessor from './processors/media-processor';
import ModerationProcessor from './processors/moderation-processor';
import AnalyticsProcessor from './processors/analytics-processor';

// Event-driven architecture
import DomainEventManager from './events/domain-events';
import RedisEventStore from './events/redis-event-store';
import CQRSManager from './events/cqrs';
import SagaManager from './events/saga-manager';

// Reliability
import DeadLetterQueueManager from './reliability/dead-letter-queue';
import CircuitBreaker, { CircuitBreakerRegistry } from './reliability/circuit-breaker';

// Monitoring
import QueueMonitor from './monitoring/queue-monitor';

export interface CrybQueueSystemConfig {
  redis: {
    primary: Redis;
    replica?: Redis;
  };
  kafka?: {
    client: Kafka;
  };
  rabbitmq?: {
    connection: amqp.Connection;
  };
  elasticsearch?: any;
  monitoring: {
    enabled: boolean;
    metricsPort?: number;
    prometheuseEnabled?: boolean;
  };
  processors: {
    email: {
      enabled: boolean;
      concurrency?: number;
    };
    pushNotifications: {
      enabled: boolean;
      concurrency?: number;
    };
    media: {
      enabled: boolean;
      concurrency?: number;
    };
    moderation: {
      enabled: boolean;
      concurrency?: number;
    };
    analytics: {
      enabled: boolean;
      concurrency?: number;
    };
  };
  reliability: {
    deadLetterQueue: {
      enabled: boolean;
    };
    circuitBreaker: {
      enabled: boolean;
    };
  };
  eventSourcing: {
    enabled: boolean;
    snapshotFrequency?: number;
  };
}

export class CrybQueueSystem {
  private logger: Logger;
  private config: CrybQueueSystemConfig;
  
  // Core components
  private queueManager: ProductionQueueManager;
  private eventStore: RedisEventStore;
  private eventManager: DomainEventManager;
  private cqrsManager: CQRSManager;
  private sagaManager: SagaManager;
  
  // Processors
  private emailProcessor?: EmailProcessor;
  private pushNotificationProcessor?: PushNotificationProcessor;
  private mediaProcessor?: MediaProcessor;
  private moderationProcessor?: ModerationProcessor;
  private analyticsProcessor?: AnalyticsProcessor;
  
  // Reliability
  private deadLetterQueueManager?: DeadLetterQueueManager;
  private circuitBreakerRegistry?: CircuitBreakerRegistry;
  
  // Monitoring
  private queueMonitor?: QueueMonitor;
  
  private isInitialized = false;
  private isShuttingDown = false;

  constructor(config: CrybQueueSystemConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize core components
    this.queueManager = new ProductionQueueManager(productionQueueConfig, logger);
    
    this.eventStore = new RedisEventStore(config.redis.primary, logger, {
      enableSnapshots: config.eventSourcing.enabled,
      snapshotFrequency: config.eventSourcing.snapshotFrequency || 10,
    });

    this.eventManager = new DomainEventManager(
      config.redis.primary,
      logger,
      this.eventStore,
      config.kafka?.client.producer(),
      config.rabbitmq?.connection.createChannel ? 
        await config.rabbitmq.connection.createChannel() : undefined
    );

    this.cqrsManager = new CQRSManager(
      config.redis.primary,
      logger,
      this.eventManager
    );

    this.sagaManager = new SagaManager(
      config.redis.primary,
      logger,
      this.eventManager,
      this.cqrsManager
    );
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Queue system is already initialized');
    }

    try {
      this.logger.info('Initializing CRYB Queue System...');

      // Initialize core queue manager
      await this.queueManager.initialize();

      // Initialize processors
      await this.initializeProcessors();

      // Initialize reliability components
      await this.initializeReliabilityComponents();

      // Initialize monitoring
      await this.initializeMonitoring();

      // Setup queue workers
      await this.setupQueueWorkers();

      // Initialize event-driven components
      await this.initializeEventDrivenComponents();

      this.isInitialized = true;
      this.logger.info('CRYB Queue System initialized successfully');

    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize CRYB Queue System');
      throw error;
    }
  }

  private async initializeProcessors(): Promise<void> {
    this.logger.info('Initializing processors...');

    // Email processor
    if (this.config.processors.email.enabled) {
      this.emailProcessor = new EmailProcessor(this.config.redis.primary, this.logger);
      this.logger.info('Email processor initialized');
    }

    // Push notification processor
    if (this.config.processors.pushNotifications.enabled) {
      this.pushNotificationProcessor = new PushNotificationProcessor(
        this.config.redis.primary,
        this.logger
      );
      this.logger.info('Push notification processor initialized');
    }

    // Media processor
    if (this.config.processors.media.enabled) {
      this.mediaProcessor = new MediaProcessor(this.config.redis.primary, this.logger);
      this.logger.info('Media processor initialized');
    }

    // Moderation processor
    if (this.config.processors.moderation.enabled) {
      this.moderationProcessor = new ModerationProcessor(
        this.config.redis.primary,
        this.logger
      );
      this.logger.info('Moderation processor initialized');
    }

    // Analytics processor
    if (this.config.processors.analytics.enabled) {
      this.analyticsProcessor = new AnalyticsProcessor(
        this.config.redis.primary,
        this.logger,
        this.config.elasticsearch
      );
      this.logger.info('Analytics processor initialized');
    }
  }

  private async initializeReliabilityComponents(): Promise<void> {
    this.logger.info('Initializing reliability components...');

    // Dead letter queue
    if (this.config.reliability.deadLetterQueue.enabled) {
      this.deadLetterQueueManager = new DeadLetterQueueManager(
        this.config.redis.primary,
        this.logger,
        { connection: this.config.redis.primary }
      );
      this.logger.info('Dead letter queue manager initialized');
    }

    // Circuit breaker registry
    if (this.config.reliability.circuitBreaker.enabled) {
      this.circuitBreakerRegistry = CircuitBreakerRegistry.getInstance(
        this.logger,
        this.config.redis.primary
      );
      this.setupCircuitBreakers();
      this.logger.info('Circuit breaker registry initialized');
    }
  }

  private async initializeMonitoring(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      return;
    }

    this.logger.info('Initializing monitoring...');

    this.queueMonitor = new QueueMonitor(this.config.redis.primary, this.logger, {
      metricsInterval: 30000,
      alertingEnabled: true,
    });

    // Setup monitoring event handlers
    this.queueMonitor.on('alert:triggered', ({ queueName, alert }) => {
      this.logger.warn({
        queueName,
        alertType: alert.type,
        alertMessage: alert.message,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
      }, 'Queue alert triggered');
    });

    this.queueMonitor.on('job:failed', ({ queueName, jobId, failedReason }) => {
      this.logger.error({
        queueName,
        jobId,
        failedReason,
      }, 'Job failed');
    });

    this.logger.info('Monitoring initialized');
  }

  private async setupQueueWorkers(): Promise<void> {
    this.logger.info('Setting up queue workers...');

    // Email queue
    if (this.emailProcessor) {
      await this.queueManager.createQueue(
        queueNames.EMAIL,
        async (job) => await this.emailProcessor!.processEmailJob(job),
        {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
        }
      );
      this.queueMonitor?.addQueue(queueNames.EMAIL, this.queueManager['queues'].get(queueNames.EMAIL)!);
    }

    // Push notifications queue
    if (this.pushNotificationProcessor) {
      await this.queueManager.createQueue(
        queueNames.PUSH_NOTIFICATIONS,
        async (job) => await this.pushNotificationProcessor!.processPushNotificationJob(job),
        {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 2,
        }
      );
      this.queueMonitor?.addQueue(queueNames.PUSH_NOTIFICATIONS, this.queueManager['queues'].get(queueNames.PUSH_NOTIFICATIONS)!);
    }

    // Media processing queue
    if (this.mediaProcessor) {
      await this.queueManager.createQueue(
        queueNames.IMAGE_PROCESSING,
        async (job) => await this.mediaProcessor!.processMediaJob(job),
        {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          timeout: 300000, // 5 minutes
        }
      );
      this.queueMonitor?.addQueue(queueNames.IMAGE_PROCESSING, this.queueManager['queues'].get(queueNames.IMAGE_PROCESSING)!);

      await this.queueManager.createQueue(
        queueNames.VIDEO_TRANSCODING,
        async (job) => await this.mediaProcessor!.processMediaJob(job),
        {
          removeOnComplete: 20,
          removeOnFail: 10,
          attempts: 1,
          timeout: 1800000, // 30 minutes
        }
      );
      this.queueMonitor?.addQueue(queueNames.VIDEO_TRANSCODING, this.queueManager['queues'].get(queueNames.VIDEO_TRANSCODING)!);
    }

    // Content moderation queue
    if (this.moderationProcessor) {
      await this.queueManager.createQueue(
        queueNames.CONTENT_MODERATION,
        async (job) => await this.moderationProcessor!.processModerationJob(job),
        {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 2,
        }
      );
      this.queueMonitor?.addQueue(queueNames.CONTENT_MODERATION, this.queueManager['queues'].get(queueNames.CONTENT_MODERATION)!);

      await this.queueManager.createQueue(
        queueNames.AI_MODERATION,
        async (job) => await this.moderationProcessor!.processModerationJob(job),
        {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 3,
        }
      );
      this.queueMonitor?.addQueue(queueNames.AI_MODERATION, this.queueManager['queues'].get(queueNames.AI_MODERATION)!);
    }

    // Analytics queues
    if (this.analyticsProcessor) {
      await this.queueManager.createQueue(
        queueNames.ANALYTICS_EVENTS,
        async (job) => await this.analyticsProcessor!.processAnalyticsJob(job),
        {
          removeOnComplete: 500,
          removeOnFail: 100,
          attempts: 2,
        }
      );
      this.queueMonitor?.addQueue(queueNames.ANALYTICS_EVENTS, this.queueManager['queues'].get(queueNames.ANALYTICS_EVENTS)!);

      await this.queueManager.createQueue(
        queueNames.USER_ACTIVITY,
        async (job) => await this.analyticsProcessor!.processAnalyticsJob(job),
        {
          removeOnComplete: 1000,
          removeOnFail: 200,
          attempts: 2,
        }
      );
      this.queueMonitor?.addQueue(queueNames.USER_ACTIVITY, this.queueManager['queues'].get(queueNames.USER_ACTIVITY)!);
    }

    this.logger.info('Queue workers setup completed');
  }

  private setupCircuitBreakers(): void {
    if (!this.circuitBreakerRegistry) return;

    // Email service circuit breaker
    this.circuitBreakerRegistry.register(
      'email-service',
      async (emailData) => {
        // This would be the actual email sending logic
        return await this.emailProcessor?.processEmailJob(emailData);
      },
      {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        timeout: 30000,
        monitoringWindow: 60000,
      }
    );

    // External API circuit breaker
    this.circuitBreakerRegistry.register(
      'external-api',
      async (requestData) => {
        // External API call logic
        return {};
      },
      {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        timeout: 15000,
        monitoringWindow: 60000,
      }
    );

    // Database circuit breaker
    this.circuitBreakerRegistry.register(
      'database',
      async (query) => {
        // Database query logic
        return {};
      },
      {
        failureThreshold: 5,
        recoveryTimeout: 20000,
        timeout: 10000,
        monitoringWindow: 60000,
      }
    );

    this.logger.info('Circuit breakers configured');
  }

  private async initializeEventDrivenComponents(): Promise<void> {
    this.logger.info('Initializing event-driven components...');

    // Register CQRS read models
    await this.cqrsManager.initializeReadModels();

    // Setup domain event handlers
    this.setupDomainEventHandlers();

    // Setup example sagas
    this.setupExampleSagas();

    this.logger.info('Event-driven components initialized');
  }

  private setupDomainEventHandlers(): void {
    // User events
    this.eventManager.registerEventHandler('UserRegistered', async (event) => {
      this.logger.info({ userId: event.aggregateId }, 'User registered event handled');
      
      // Send welcome email
      if (this.emailProcessor) {
        await this.queueManager.addJob(queueNames.EMAIL, 'send-welcome-email', {
          to: event.data.email,
          template: 'welcome',
          templateData: {
            username: event.data.username,
            platformUrl: process.env.PLATFORM_URL || 'https://cryb.ai',
          },
          priority: 'high',
          userId: event.aggregateId,
        });
      }
    });

    // Content events
    this.eventManager.registerEventHandler('ContentCreated', async (event) => {
      this.logger.info({ contentId: event.aggregateId }, 'Content created event handled');
      
      // Queue for moderation
      if (this.moderationProcessor) {
        await this.queueManager.addJob(queueNames.CONTENT_MODERATION, 'moderate-content', {
          contentId: event.aggregateId,
          userId: event.data.userId,
          contentType: event.data.type,
          content: event.data.content,
          moderationRules: {
            checkToxicity: true,
            checkSpam: true,
            checkNSFW: true,
            checkProfanity: true,
          },
          priority: 'normal',
          autoAction: true,
        });
      }

      // Track analytics
      if (this.analyticsProcessor) {
        await this.queueManager.addJob(queueNames.ANALYTICS_EVENTS, 'track-content-creation', {
          eventType: 'user_action',
          eventName: 'content_created',
          userId: event.data.userId,
          data: {
            action: 'create',
            category: 'content',
            label: event.data.type,
            properties: {
              contentId: event.aggregateId,
              contentType: event.data.type,
            },
          },
          context: {
            timestamp: event.timestamp.toISOString(),
            platform: 'api',
            environment: process.env.NODE_ENV || 'development',
          },
          aggregations: {
            realTime: true,
            daily: true,
            weekly: true,
            monthly: true,
          },
        });
      }
    });

    // Payment events
    this.eventManager.registerEventHandler('PaymentProcessed', async (event) => {
      this.logger.info({ paymentId: event.aggregateId }, 'Payment processed event handled');
      
      // Send receipt email
      if (this.emailProcessor) {
        await this.queueManager.addJob(queueNames.EMAIL, 'send-receipt', {
          to: event.data.customerEmail,
          template: 'payment-receipt',
          templateData: {
            amount: event.data.amount,
            currency: event.data.currency,
            paymentId: event.aggregateId,
          },
          priority: 'high',
          userId: event.data.userId,
        });
      }
    });
  }

  private setupExampleSagas(): void {
    // User onboarding saga
    this.sagaManager.registerSaga({
      id: 'user-onboarding',
      name: 'User Onboarding Process',
      correlationProperty: 'userId',
      steps: [
        {
          id: 'send-welcome-email',
          name: 'Send Welcome Email',
          command: {
            id: '',
            type: 'SendEmail',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
        {
          id: 'create-default-profile',
          name: 'Create Default Profile',
          command: {
            id: '',
            type: 'CreateProfile',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
        {
          id: 'setup-preferences',
          name: 'Setup User Preferences',
          command: {
            id: '',
            type: 'SetupPreferences',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
      ],
      timeout: 3600000, // 1 hour
      compensationStrategy: 'backward',
    });

    // Content publication saga
    this.sagaManager.registerSaga({
      id: 'content-publication',
      name: 'Content Publication Process',
      correlationProperty: 'contentId',
      steps: [
        {
          id: 'moderate-content',
          name: 'Moderate Content',
          command: {
            id: '',
            type: 'ModerateContent',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
        {
          id: 'process-media',
          name: 'Process Media Assets',
          command: {
            id: '',
            type: 'ProcessMedia',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
        {
          id: 'publish-content',
          name: 'Publish Content',
          command: {
            id: '',
            type: 'PublishContent',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
        {
          id: 'notify-followers',
          name: 'Notify Followers',
          command: {
            id: '',
            type: 'NotifyFollowers',
            aggregateId: '',
            data: {},
            metadata: {
              timestamp: new Date(),
              source: 'saga',
            },
          },
        },
      ],
      timeout: 1800000, // 30 minutes
      compensationStrategy: 'backward',
    });
  }

  // Public API methods
  public async addEmailJob(emailData: any, options: any = {}): Promise<void> {
    await this.queueManager.addJob(queueNames.EMAIL, 'send-email', emailData, options);
  }

  public async addPushNotificationJob(notificationData: any, options: any = {}): Promise<void> {
    await this.queueManager.addJob(queueNames.PUSH_NOTIFICATIONS, 'send-notification', notificationData, options);
  }

  public async addMediaProcessingJob(mediaData: any, options: any = {}): Promise<void> {
    const queueName = mediaData.mediaType === 'video' ? queueNames.VIDEO_TRANSCODING : queueNames.IMAGE_PROCESSING;
    await this.queueManager.addJob(queueName, 'process-media', mediaData, options);
  }

  public async addModerationJob(moderationData: any, options: any = {}): Promise<void> {
    const queueName = moderationData.useAI ? queueNames.AI_MODERATION : queueNames.CONTENT_MODERATION;
    await this.queueManager.addJob(queueName, 'moderate-content', moderationData, options);
  }

  public async addAnalyticsJob(analyticsData: any, options: any = {}): Promise<void> {
    const queueName = analyticsData.eventType === 'user_action' ? queueNames.USER_ACTIVITY : queueNames.ANALYTICS_EVENTS;
    await this.queueManager.addJob(queueName, 'process-analytics', analyticsData, options);
  }

  public getQueueMetrics(): any {
    return this.queueManager.getGlobalMetrics();
  }

  public getMonitoringMetrics(): any {
    if (!this.queueMonitor) return null;
    return {
      global: this.queueMonitor.getGlobalMetrics(),
      queues: this.queueMonitor.getAllQueueMetrics(),
      alerts: this.queueMonitor.getAllAlerts(),
    };
  }

  public getPrometheusMetrics(): string | null {
    return this.queueMonitor?.getPrometheusMetrics() || null;
  }

  public getProcessorMetrics(): any {
    return {
      email: this.emailProcessor?.getMetrics(),
      pushNotifications: this.pushNotificationProcessor?.getMetrics(),
      media: this.mediaProcessor?.getMetrics(),
      moderation: this.moderationProcessor?.getMetrics(),
      analytics: this.analyticsProcessor?.getMetrics(),
    };
  }

  public getCircuitBreakerMetrics(): any {
    return this.circuitBreakerRegistry?.getAllMetrics() || {};
  }

  public async getDeadLetterStats(): Promise<any> {
    if (!this.deadLetterQueueManager) return null;
    return {
      metrics: this.deadLetterQueueManager.getMetrics(),
      manualReview: await this.deadLetterQueueManager.getManualReviewQueue(),
      escalation: await this.deadLetterQueueManager.getEscalationQueue(),
    };
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info('Shutting down CRYB Queue System...');

    try {
      // Stop monitoring
      this.queueMonitor?.stop();

      // Graceful shutdown is handled by the queue manager
      // The queue manager has its own graceful shutdown handlers

      this.logger.info('CRYB Queue System shutdown completed');
    } catch (error) {
      this.logger.error({ error }, 'Error during queue system shutdown');
      throw error;
    }
  }
}

// Export all components for direct usage if needed
export {
  ProductionQueueManager,
  EmailProcessor,
  PushNotificationProcessor,
  MediaProcessor,
  ModerationProcessor,
  AnalyticsProcessor,
  DomainEventManager,
  RedisEventStore,
  CQRSManager,
  SagaManager,
  DeadLetterQueueManager,
  CircuitBreaker,
  CircuitBreakerRegistry,
  QueueMonitor,
  queueNames,
  productionQueueConfig,
};

export default CrybQueueSystem;