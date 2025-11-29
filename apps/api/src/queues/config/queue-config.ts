import { QueueConfig } from '../core/queue-manager';

export const productionQueueConfig: QueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableAutoPipelining: true,
    maxmemoryPolicy: 'allkeys-lru',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    heartbeat: 60,
    frameMax: 0x1000,
    connectionTimeout: 60000,
  },
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'cryb-platform',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: process.env.KAFKA_USERNAME ? {
      mechanism: 'plain' as const,
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD || '',
    } : undefined,
  },
  monitoring: {
    enabled: process.env.QUEUE_MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.QUEUE_METRICS_PORT || '9464'),
    jaegerEndpoint: process.env.JAEGER_ENDPOINT,
  },
};

export const queueNames = {
  // Core application queues
  EMAIL: 'email-delivery',
  PUSH_NOTIFICATIONS: 'push-notifications',
  SMS: 'sms-delivery',
  
  // Media processing queues
  IMAGE_PROCESSING: 'image-processing',
  VIDEO_TRANSCODING: 'video-transcoding',
  AUDIO_PROCESSING: 'audio-processing',
  THUMBNAIL_GENERATION: 'thumbnail-generation',
  
  // Content moderation queues
  CONTENT_MODERATION: 'content-moderation',
  AI_MODERATION: 'ai-moderation',
  SPAM_DETECTION: 'spam-detection',
  TOXICITY_ANALYSIS: 'toxicity-analysis',
  
  // Analytics and metrics queues
  ANALYTICS_EVENTS: 'analytics-events',
  USER_ACTIVITY: 'user-activity',
  BUSINESS_METRICS: 'business-metrics',
  PERFORMANCE_METRICS: 'performance-metrics',
  
  // Blockchain and Web3 queues
  BLOCKCHAIN_EVENTS: 'blockchain-events',
  NFT_PROCESSING: 'nft-processing',
  CRYPTO_PAYMENTS: 'crypto-payments',
  TOKEN_TRANSFERS: 'token-transfers',
  
  // System maintenance queues
  DATABASE_CLEANUP: 'database-cleanup',
  CACHE_WARMING: 'cache-warming',
  INDEX_OPTIMIZATION: 'index-optimization',
  BACKUP_TASKS: 'backup-tasks',
  
  // Notification and communication queues
  REAL_TIME_NOTIFICATIONS: 'realtime-notifications',
  WEBHOOK_DELIVERY: 'webhook-delivery',
  API_RATE_LIMITING: 'api-rate-limiting',
  
  // Search and recommendation queues
  SEARCH_INDEXING: 'search-indexing',
  CONTENT_RECOMMENDATIONS: 'content-recommendations',
  USER_SUGGESTIONS: 'user-suggestions',
  
  // Dead letter and retry queues
  DEAD_LETTER: 'dead-letter-queue',
  FAILED_JOBS_RETRY: 'failed-jobs-retry',
  PRIORITY_RETRY: 'priority-retry',
} as const;

export type QueueName = typeof queueNames[keyof typeof queueNames];

export const queuePriorities = {
  CRITICAL: 100,
  HIGH: 75,
  NORMAL: 50,
  LOW: 25,
  BATCH: 1,
} as const;

export const defaultRetryPolicies = {
  email: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
      maxDelay: 300000, // 5 minutes
      multiplier: 2,
      jitter: true,
    },
  },
  pushNotifications: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
      maxDelay: 60000, // 1 minute
      multiplier: 1.5,
      jitter: true,
    },
  },
  mediaProcessing: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 5000,
    },
  },
  contentModeration: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: false,
    },
  },
  analytics: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 3000,
    },
  },
  blockchain: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
      maxDelay: 600000, // 10 minutes
      multiplier: 2,
      jitter: true,
    },
  },
  systemMaintenance: {
    attempts: 1,
    backoff: {
      type: 'fixed' as const,
      delay: 0,
    },
  },
} as const;

export const queueConcurrencyLimits = {
  [queueNames.EMAIL]: 10,
  [queueNames.PUSH_NOTIFICATIONS]: 20,
  [queueNames.SMS]: 5,
  [queueNames.IMAGE_PROCESSING]: 3,
  [queueNames.VIDEO_TRANSCODING]: 1,
  [queueNames.AUDIO_PROCESSING]: 2,
  [queueNames.CONTENT_MODERATION]: 5,
  [queueNames.AI_MODERATION]: 2,
  [queueNames.ANALYTICS_EVENTS]: 15,
  [queueNames.USER_ACTIVITY]: 20,
  [queueNames.BLOCKCHAIN_EVENTS]: 5,
  [queueNames.NFT_PROCESSING]: 3,
  [queueNames.DATABASE_CLEANUP]: 1,
  [queueNames.SEARCH_INDEXING]: 5,
  [queueNames.WEBHOOK_DELIVERY]: 10,
} as const;

export const rabbitMQExchanges = {
  EVENTS: 'cryb.events',
  NOTIFICATIONS: 'cryb.notifications',
  ANALYTICS: 'cryb.analytics',
  MEDIA: 'cryb.media',
  MODERATION: 'cryb.moderation',
  WEB3: 'cryb.web3',
} as const;

export const kafkaTopics = {
  USER_EVENTS: 'user-events',
  SYSTEM_EVENTS: 'system-events',
  ANALYTICS_STREAM: 'analytics-stream',
  REAL_TIME_UPDATES: 'realtime-updates',
  AUDIT_LOGS: 'audit-logs',
  METRICS_STREAM: 'metrics-stream',
} as const;

export const circuitBreakerConfig = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 60000,
  rollingCountTimeout: 60000,
  rollingCountBuckets: 10,
} as const;