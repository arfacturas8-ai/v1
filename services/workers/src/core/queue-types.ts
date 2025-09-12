import { JobsOptions } from 'bullmq';

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2, 
  NORMAL = 3,
  LOW = 4
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STUCK = 'stuck'
}

export interface JobData {
  id: string;
  type: string;
  payload: any;
  attempts?: number;
  maxAttempts?: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

export interface QueueConfig {
  name: string;
  defaultJobOptions: JobsOptions;
  rateLimiter?: {
    max: number;
    duration: number;
  };
  concurrency: number;
  removeOnComplete: number;
  removeOnFail: number;
  maxStalledCount: number;
  stalledInterval: number;
  retryConfig: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
  };
}

export interface WorkerConfig {
  concurrency: number;
  removeOnComplete: { count: number; age?: number };
  removeOnFail: { count: number; age?: number };
  settings: {
    stalledInterval: number;
    maxStalledCount: number;
    retryProcessDelay: number;
  };
  limiter?: {
    max: number;
    duration: number;
  };
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface DeduplicationConfig {
  enabled: boolean;
  keyGenerator: (jobData: any) => string;
  ttl: number; // Time to live in seconds
}

export interface JobProgress {
  percentage: number;
  message?: string;
  data?: any;
  stage?: string;
  timestamp: string;
}

export interface JobMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  queueLength: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  throughputPerMinute: number;
}

export interface HealthStatus {
  queue: {
    connected: boolean;
    queueLength: number;
    processing: number;
    failed: number;
    delayed: number;
  };
  redis: {
    connected: boolean;
    latency?: number;
    memoryUsage?: number;
  };
  workers: {
    active: number;
    total: number;
    healthy: number;
  };
  circuitBreaker: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime?: string;
  };
}

export type QueueJobType = 
  | 'process-message'
  | 'send-notification'
  | 'process-media'
  | 'analyze-content'
  | 'moderate-content'
  | 'process-blockchain'
  | 'send-email'
  | 'cleanup-old-data'
  | 'generate-report'
  | 'backup-data'
  | 'sync-data';

export interface CronJobConfig {
  name: string;
  pattern: string;
  jobType: QueueJobType;
  data: any;
  options?: JobsOptions;
  timezone?: string;
  enabled: boolean;
}

export interface JobRecoveryConfig {
  enableAutoRecovery: boolean;
  stalledJobTimeout: number;
  abandonedJobTimeout: number;
  recoveryCheckInterval: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxJobs: number;
  skipSuccessfulJobs?: boolean;
  skipFailedJobs?: boolean;
  keyGenerator?: (jobData: any) => string;
}

export interface BatchProcessingConfig {
  enabled: boolean;
  batchSize: number;
  maxWaitTime: number;
  processor: (jobs: JobData[]) => Promise<any[]>;
}

export interface AlertConfig {
  enabled: boolean;
  channels: Array<'email' | 'slack' | 'webhook'>;
  thresholds: {
    queueLength: number;
    failureRate: number;
    processingTime: number;
    memoryUsage: number;
  };
  cooldownPeriod: number; // Minutes between alerts for same issue
}