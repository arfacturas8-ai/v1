#!/usr/bin/env tsx

import pino from 'pino';
import { performance } from 'perf_hooks';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss'
    }
  }
});

interface LoadTestConfig {
  totalJobs: number;
  concurrency: number;
  batchSize: number;
  testDuration: number; // seconds
  queueNames: string[];
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

interface LoadTestMetrics {
  jobsProduced: number;
  jobsProcessed: number;
  jobsFailed: number;
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  throughput: number; // jobs per second
  startTime: number;
  endTime?: number;
  errors: string[];
}

class QueueLoadTester {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private metrics: LoadTestMetrics;
  private jobTimes: Map<string, number> = new Map();
  private isRunning = false;

  constructor(private config: LoadTestConfig) {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });

    this.metrics = {
      jobsProduced: 0,
      jobsProcessed: 0,
      jobsFailed: 0,
      avgLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      throughput: 0,
      startTime: 0,
      errors: []
    };
  }

  async initialize(): Promise<void> {
    logger.info('Initializing load test environment...');

    // Initialize queues and workers
    for (const queueName of this.config.queueNames) {
      const queue = new Queue(queueName, { 
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      });

      const worker = new Worker(
        queueName,
        async (job) => {
          const startTime = this.jobTimes.get(job.id!);
          if (startTime) {
            const latency = performance.now() - startTime;
            this.updateLatencyMetrics(latency);
            this.jobTimes.delete(job.id!);
          }

          // Simulate different types of work
          const workType = job.data.type || 'default';
          await this.simulateWork(workType, job.data);

          this.metrics.jobsProcessed++;
          return { processed: true, timestamp: Date.now() };
        },
        { 
          connection: this.redis,
          concurrency: this.config.concurrency,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 }
        }
      );

      // Handle worker events
      worker.on('completed', (job) => {
        logger.debug(`Job ${job.id} completed`);
      });

      worker.on('failed', (job, err) => {
        this.metrics.jobsFailed++;
        this.metrics.errors.push(`Job ${job?.id} failed: ${err.message}`);
        logger.warn(`Job ${job?.id} failed: ${err.message}`);
      });

      worker.on('error', (err) => {
        this.metrics.errors.push(`Worker error: ${err.message}`);
        logger.error('Worker error:', err);
      });

      this.queues.set(queueName, queue);
      this.workers.set(queueName, worker);
    }

    logger.info(`Initialized ${this.config.queueNames.length} queues and workers`);
  }

  private async simulateWork(workType: string, data: any): Promise<void> {
    switch (workType) {
      case 'fast':
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
        break;
      case 'medium':
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        break;
      case 'slow':
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        break;
      case 'email':
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        break;
      case 'analytics':
        // Simulate analytics processing
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        break;
      case 'moderation':
        // Simulate content moderation
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
        break;
      case 'blockchain':
        // Simulate blockchain transaction
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        break;
      default:
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        break;
    }
  }

  private updateLatencyMetrics(latency: number): void {
    this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
    this.metrics.minLatency = Math.min(this.metrics.minLatency, latency);
    
    // Simple moving average
    const alpha = 0.1; // smoothing factor
    if (this.metrics.avgLatency === 0) {
      this.metrics.avgLatency = latency;
    } else {
      this.metrics.avgLatency = alpha * latency + (1 - alpha) * this.metrics.avgLatency;
    }
  }

  async runLoadTest(): Promise<LoadTestMetrics> {
    logger.info(`Starting load test with ${this.config.totalJobs} jobs...`);
    
    this.metrics.startTime = performance.now();
    this.isRunning = true;

    // Start metrics reporter
    const metricsInterval = setInterval(() => {
      this.reportMetrics();
    }, 5000);

    try {
      // Produce jobs in batches
      const batches = Math.ceil(this.config.totalJobs / this.config.batchSize);
      
      for (let batch = 0; batch < batches; batch++) {
        const jobsInBatch = Math.min(
          this.config.batchSize,
          this.config.totalJobs - batch * this.config.batchSize
        );

        const batchPromises = [];
        
        for (let i = 0; i < jobsInBatch; i++) {
          const jobId = `load-test-${batch}-${i}`;
          const queueName = this.config.queueNames[
            Math.floor(Math.random() * this.config.queueNames.length)
          ];
          
          const jobData = this.generateJobData();
          this.jobTimes.set(jobId, performance.now());

          const jobPromise = this.queues.get(queueName)!.add(
            'load-test-job',
            jobData,
            {
              jobId,
              priority: Math.floor(Math.random() * 10) + 1
            }
          );

          batchPromises.push(jobPromise);
        }

        await Promise.all(batchPromises);
        this.metrics.jobsProduced += jobsInBatch;

        logger.info(`Produced batch ${batch + 1}/${batches} (${jobsInBatch} jobs)`);

        // Small delay between batches to avoid overwhelming
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`All ${this.config.totalJobs} jobs produced. Waiting for processing...`);

      // Wait for all jobs to complete or timeout
      const maxWaitTime = this.config.testDuration * 1000;
      const startWait = performance.now();
      
      while (
        this.metrics.jobsProcessed + this.metrics.jobsFailed < this.config.totalJobs &&
        performance.now() - startWait < maxWaitTime
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.metrics.endTime = performance.now();
      const totalTime = (this.metrics.endTime - this.metrics.startTime) / 1000;
      this.metrics.throughput = this.metrics.jobsProcessed / totalTime;

      logger.info('Load test completed!');
      this.reportFinalMetrics();

    } catch (error) {
      logger.error('Load test failed:', error);
      this.metrics.errors.push(`Load test error: ${error}`);
    } finally {
      clearInterval(metricsInterval);
      this.isRunning = false;
    }

    return this.metrics;
  }

  private generateJobData(): any {
    const workTypes = ['fast', 'medium', 'slow', 'email', 'analytics', 'moderation', 'blockchain'];
    const type = workTypes[Math.floor(Math.random() * workTypes.length)];
    
    return {
      type,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      payload: {
        data: 'x'.repeat(Math.floor(Math.random() * 1000) + 100), // Variable payload size
        metadata: {
          source: 'load-test',
          priority: Math.floor(Math.random() * 5) + 1
        }
      }
    };
  }

  private reportMetrics(): void {
    const runtime = (performance.now() - this.metrics.startTime) / 1000;
    const currentThroughput = this.metrics.jobsProcessed / runtime;

    logger.info('📊 Load Test Metrics:', {
      runtime: `${runtime.toFixed(1)}s`,
      produced: this.metrics.jobsProduced,
      processed: this.metrics.jobsProcessed,
      failed: this.metrics.jobsFailed,
      pending: this.metrics.jobsProduced - this.metrics.jobsProcessed - this.metrics.jobsFailed,
      throughput: `${currentThroughput.toFixed(1)} jobs/s`,
      avgLatency: `${this.metrics.avgLatency.toFixed(1)}ms`,
      maxLatency: `${this.metrics.maxLatency.toFixed(1)}ms`,
      minLatency: this.metrics.minLatency === Infinity ? 'N/A' : `${this.metrics.minLatency.toFixed(1)}ms`,
      errorRate: `${((this.metrics.jobsFailed / Math.max(1, this.metrics.jobsProcessed + this.metrics.jobsFailed)) * 100).toFixed(2)}%`
    });
  }

  private reportFinalMetrics(): void {
    const totalTime = this.metrics.endTime! - this.metrics.startTime;
    const successRate = (this.metrics.jobsProcessed / this.config.totalJobs) * 100;
    const failureRate = (this.metrics.jobsFailed / this.config.totalJobs) * 100;

    logger.info('🏁 Final Load Test Results:', {
      totalTime: `${(totalTime / 1000).toFixed(2)}s`,
      totalJobs: this.config.totalJobs,
      jobsProcessed: this.metrics.jobsProcessed,
      jobsFailed: this.metrics.jobsFailed,
      successRate: `${successRate.toFixed(2)}%`,
      failureRate: `${failureRate.toFixed(2)}%`,
      avgThroughput: `${this.metrics.throughput.toFixed(2)} jobs/s`,
      avgLatency: `${this.metrics.avgLatency.toFixed(2)}ms`,
      maxLatency: `${this.metrics.maxLatency.toFixed(2)}ms`,
      minLatency: this.metrics.minLatency === Infinity ? 'N/A' : `${this.metrics.minLatency.toFixed(2)}ms`,
      totalErrors: this.metrics.errors.length
    });

    if (this.metrics.errors.length > 0) {
      logger.warn('Errors encountered:', this.metrics.errors.slice(0, 10)); // Show first 10 errors
    }
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up load test environment...');

    // Close workers
    const workerClosePromises = Array.from(this.workers.values()).map(worker => worker.close());
    await Promise.all(workerClosePromises);

    // Close queues
    const queueClosePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(queueClosePromises);

    // Close Redis connection
    await this.redis.quit();

    logger.info('Cleanup completed');
  }
}

// Configuration presets
const PRESETS = {
  light: {
    totalJobs: 100,
    concurrency: 2,
    batchSize: 10,
    testDuration: 60
  },
  medium: {
    totalJobs: 1000,
    concurrency: 5,
    batchSize: 50,
    testDuration: 300
  },
  heavy: {
    totalJobs: 10000,
    concurrency: 10,
    batchSize: 100,
    testDuration: 600
  },
  stress: {
    totalJobs: 50000,
    concurrency: 20,
    batchSize: 500,
    testDuration: 1800
  }
};

async function main() {
  const args = process.argv.slice(2);
  const preset = args[0] || 'light';
  const customQueues = args[1] ? args[1].split(',') : undefined;

  if (!PRESETS[preset as keyof typeof PRESETS]) {
    logger.error(`Unknown preset: ${preset}. Available presets: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  const config: LoadTestConfig = {
    ...PRESETS[preset as keyof typeof PRESETS],
    queueNames: customQueues || ['messages', 'notifications', 'analytics', 'moderation'],
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD || 'cryb_redis_password'
    }
  };

  logger.info(`Running ${preset} load test with config:`, config);

  const tester = new QueueLoadTester(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await tester.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await tester.cleanup();
    process.exit(0);
  });

  try {
    await tester.initialize();
    const results = await tester.runLoadTest();
    
    // Output results in JSON format for potential automation
    if (process.env.OUTPUT_JSON === 'true') {
      console.log(JSON.stringify(results, null, 2));
    }

  } catch (error) {
    logger.error('Load test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}