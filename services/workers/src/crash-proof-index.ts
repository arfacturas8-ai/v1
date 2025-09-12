import pino from 'pino';
import { QueueManager, QueueManagerConfig } from './core/queue-manager';
import { CrashProofMessagesWorker } from './workers/crash-proof-messages.worker';
import { NotificationsWorker } from './workers/notifications.worker';
import { AnalyticsWorker } from './workers/analytics.worker';
import { ModerationWorker } from './workers/moderation.worker';
import { BlockchainWorker } from './workers/blockchain.worker';
import { JobPriority, AlertSeverity, AlertType, CronScheduler } from './core/queue-types';
import { HealthServer } from './health-server';
import { Job } from 'bullmq';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

// Create worker instances
const messagesWorker = new CrashProofMessagesWorker(logger.child({ worker: 'messages' }));

// Initialize other workers with configurations
const notificationsWorker = new NotificationsWorker(
  logger.child({ worker: 'notifications' }),
  {
    email: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      defaultFrom: process.env.FROM_EMAIL || 'noreply@cryb.ai'
    },
    push: {
      vapidKeys: {
        publicKey: process.env.VAPID_PUBLIC_KEY || '',
        privateKey: process.env.VAPID_PRIVATE_KEY || ''
      }
    },
    sms: {
      provider: 'twilio',
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || ''
      }
    },
    webhook: {
      defaultTimeout: 10000,
      defaultRetries: 3
    }
  }
);

const analyticsWorker = new AnalyticsWorker(
  logger.child({ worker: 'analytics' }),
  {
    database: {
      connectionString: process.env.DATABASE_URL || ''
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD
    },
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  }
);

const moderationWorker = new ModerationWorker(
  logger.child({ worker: 'moderation' }),
  {
    ai: {
      toxicityApi: process.env.PERSPECTIVE_API_URL,
      apiKey: process.env.PERSPECTIVE_API_KEY
    },
    rules: {
      autoModeration: process.env.AUTO_MODERATION === 'true',
      strictMode: process.env.STRICT_MODERATION === 'true',
      toxicityThreshold: parseFloat(process.env.TOXICITY_THRESHOLD || '0.7'),
      spamThreshold: parseFloat(process.env.SPAM_THRESHOLD || '0.7'),
      maxViolationsBeforeBan: parseInt(process.env.MAX_VIOLATIONS_BEFORE_BAN || '5')
    }
  }
);

const blockchainWorker = new BlockchainWorker(
  logger.child({ worker: 'blockchain' }),
  {
    networks: {
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
        chainId: 1
      },
      polygon: {
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137
      }
    },
    wallet: {
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || ''
    },
    settings: {
      defaultGasMultiplier: 1.2,
      maxGasPrice: '100000000000', // 100 gwei
      transactionTimeout: 300000, // 5 minutes
      confirmations: 2
    }
  }
);

// Queue Manager Configuration
const queueConfig: QueueManagerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD || 'cryb_redis_password',
    db: 0
  },
  queues: {
    messages: {
      config: {
        name: 'messages',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        },
        rateLimiter: {
          max: 100,
          duration: 60000 // 100 jobs per minute
        },
        concurrency: 5,
        removeOnComplete: 100,
        removeOnFail: 50,
        maxStalledCount: 3,
        stalledInterval: 30000,
        retryConfig: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      workerConfig: {
        concurrency: 5,
        removeOnComplete: { count: 100, age: 24 * 60 * 60 },
        removeOnFail: { count: 50, age: 24 * 60 * 60 },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 3,
          retryProcessDelay: 5000
        },
        limiter: {
          max: 10,
          duration: 1000 // Max 10 concurrent jobs per second
        }
      },
      processor: async (job: Job) => {
        return await messagesWorker.processJob(job);
      },
      deduplication: {
        enabled: true,
        keyGenerator: (jobData: any) => `${jobData.messageId || 'unknown'}-${jobData.type || 'default'}`,
        ttl: 300 // 5 minutes
      },
      circuitBreaker: {
        failureThreshold: 10,
        resetTimeout: 60000,
        monitoringPeriod: 300000
      },
      jobRecovery: {
        enableAutoRecovery: true,
        stalledJobTimeout: 30000,
        abandonedJobTimeout: 300000,
        recoveryCheckInterval: 60000
      },
      rateLimit: {
        windowMs: 60000,
        maxJobs: 100,
        keyGenerator: (jobData: any) => jobData.channelId || 'global'
      },
      batchProcessing: {
        enabled: false, // Enable for high-volume scenarios
        batchSize: 10,
        maxWaitTime: 5000,
        processor: async (jobs: any[]) => {
          // Batch processing implementation would go here
          return jobs.map(job => ({ processed: true, jobId: job.id }));
        }
      }
    },
    notifications: {
      config: {
        name: 'notifications',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        },
        concurrency: 10,
        removeOnComplete: 50,
        removeOnFail: 25,
        maxStalledCount: 3,
        stalledInterval: 30000,
        retryConfig: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      },
      workerConfig: {
        concurrency: 10,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 25 },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 3,
          retryProcessDelay: 3000
        }
      },
      processor: async (job: Job) => {
        return await notificationsWorker.processJob(job);
      },
      circuitBreaker: {
        failureThreshold: 15,
        resetTimeout: 90000,
        monitoringPeriod: 300000
      }
    },
    media: {
      config: {
        name: 'media',
        defaultJobOptions: {
          removeOnComplete: 25,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        },
        concurrency: 3,
        removeOnComplete: 25,
        removeOnFail: 25,
        maxStalledCount: 2,
        stalledInterval: 60000,
        retryConfig: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      },
      workerConfig: {
        concurrency: 3,
        removeOnComplete: { count: 25 },
        removeOnFail: { count: 25 },
        settings: {
          stalledInterval: 60000,
          maxStalledCount: 2,
          retryProcessDelay: 10000
        }
      },
      processor: async (job: Job) => {
        // Media processing logic (implement MediaWorker if needed)
        logger.info(`Processing media job: ${job.name}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { processed: true, jobId: job.id };
      },
      batchProcessing: {
        enabled: true,
        batchSize: 5,
        maxWaitTime: 30000,
        processor: async (jobs: any[]) => {
          // Batch media processing
          return jobs.map(job => ({ processed: true, jobId: job.id }));
        }
      }
    },
    analytics: {
      config: {
        name: 'analytics',
        defaultJobOptions: {
          removeOnComplete: 25,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000
          }
        },
        concurrency: 3,
        removeOnComplete: 25,
        removeOnFail: 25,
        maxStalledCount: 2,
        stalledInterval: 60000,
        retryConfig: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000
          }
        }
      },
      workerConfig: {
        concurrency: 3,
        removeOnComplete: { count: 25 },
        removeOnFail: { count: 25 },
        settings: {
          stalledInterval: 60000,
          maxStalledCount: 2,
          retryProcessDelay: 10000
        }
      },
      processor: async (job: Job) => {
        return await analyticsWorker.processJob(job);
      }
    },
    moderation: {
      config: {
        name: 'moderation',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        },
        concurrency: 5,
        removeOnComplete: 50,
        removeOnFail: 50,
        maxStalledCount: 3,
        stalledInterval: 30000,
        retryConfig: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      workerConfig: {
        concurrency: 5,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 3,
          retryProcessDelay: 5000
        }
      },
      processor: async (job: Job) => {
        return await moderationWorker.processJob(job);
      }
    },
    blockchain: {
      config: {
        name: 'blockchain',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        },
        concurrency: 2,
        removeOnComplete: 100,
        removeOnFail: 50,
        maxStalledCount: 3,
        stalledInterval: 60000,
        retryConfig: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      },
      workerConfig: {
        concurrency: 2,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        settings: {
          stalledInterval: 60000,
          maxStalledCount: 3,
          retryProcessDelay: 15000
        }
      },
      processor: async (job: Job) => {
        return await blockchainWorker.processJob(job);
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 120000,
        monitoringPeriod: 300000
      }
    }
  },
  cron: {
    enabled: true,
    jobs: [
      {
        name: 'cleanup-old-messages',
        pattern: CronScheduler.PATTERNS.DAILY, // '0 0 * * *' - Daily at midnight
        jobType: 'cleanup-old-data',
        data: { daysOld: 30, preservePinned: true },
        enabled: true,
        timezone: 'UTC'
      },
      {
        name: 'generate-daily-analytics',
        pattern: '0 1 * * *', // Daily at 1 AM
        jobType: 'analyze-content',
        data: { type: 'daily_summary' },
        enabled: true,
        timezone: 'UTC'
      },
      {
        name: 'backup-critical-data',
        pattern: CronScheduler.PATTERNS.EVERY_6_HOURS, // '0 */6 * * *'
        jobType: 'backup-data',
        data: { type: 'incremental' },
        enabled: true,
        timezone: 'UTC'
      },
      {
        name: 'health-check',
        pattern: CronScheduler.PATTERNS.EVERY_5_MINUTES, // '*/5 * * * *'
        jobType: 'system-health-check',
        data: { comprehensive: false },
        enabled: true,
        timezone: 'UTC'
      }
    ]
  },
  alerting: {
    enabled: true,
    channels: ['email', 'webhook'],
    thresholds: {
      queueLength: 1000,
      failureRate: 0.1, // 10%
      processingTime: 30000, // 30 seconds
      memoryUsage: 0.8 // 80%
    },
    cooldownPeriod: 15 // 15 minutes between similar alerts
  }
};

let queueManager: QueueManager;
let healthServer: HealthServer;

async function startCrashProofWorkers() {
  try {
    logger.info('🚀 Starting CRYB Crash-Proof Queue System...');

    // Initialize Queue Manager
    queueManager = new QueueManager(queueConfig, logger);
    
    await queueManager.initialize();

    // Initialize Health Server
    healthServer = new HealthServer(queueManager, {
      port: parseInt(process.env.HEALTH_PORT || '3001'),
      path: '/health',
      enableMetrics: true,
      enableDetailedStatus: true
    });
    
    await healthServer.start();

    logger.info('✅ Crash-Proof Queue System started successfully');

    // Log system stats every 5 minutes
    setInterval(async () => {
      try {
        const stats = await queueManager.getSystemStats();
        logger.info('📊 System Statistics:', stats);
      } catch (error) {
        logger.error('Failed to get system stats:', error);
      }
    }, 5 * 60 * 1000);

    // Example: Add some test jobs
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        try {
          // Add a test message processing job
          await queueManager.addJob('messages', 'process-message', {
            messageId: 'test-message-123',
            channelId: 'test-channel-456',
            content: 'Hello <@user123>, check out https://example.com',
            authorId: 'test-author-789'
          }, {
            priority: JobPriority.NORMAL
          });

          logger.info('✅ Test job added successfully');
        } catch (error) {
          logger.error('Failed to add test job:', error);
        }
      }, 5000);
    }

  } catch (error) {
    logger.error('❌ Failed to start Crash-Proof Queue System:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  try {
    if (healthServer) {
      await healthServer.stop();
      logger.info('✅ Health server stopped');
    }
    if (queueManager) {
      await queueManager.gracefulShutdown();
      logger.info('✅ Graceful shutdown completed');
    }
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('🔥 Forcing shutdown due to timeout');
      process.exit(1);
    }, 30000);
  }
}

// Emergency shutdown for immediate termination
async function emergencyShutdown(signal: string) {
  logger.warn(`${signal} received, initiating emergency shutdown...`);
  
  try {
    if (queueManager) {
      await queueManager.emergencyShutdown();
    }
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during emergency shutdown:', error);
    process.exit(1);
  }
}

// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
process.on('SIGKILL', () => emergencyShutdown('SIGKILL'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('🔥 Uncaught Exception:', error);
  emergencyShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  emergencyShutdown('unhandledRejection');
});

// Start the system
startCrashProofWorkers();