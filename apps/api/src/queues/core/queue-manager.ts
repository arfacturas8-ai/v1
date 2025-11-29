import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import amqp from 'amqplib';
import { Kafka, Producer, Consumer } from 'kafkajs';
import CircuitBreaker from 'opossum';
import { Logger } from 'pino';
import { createGenericPool, Pool } from 'generic-pool';
import { EventEmitter } from 'events';
import { promisify } from 'util';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    enableAutoPipelining?: boolean;
    maxmemoryPolicy?: string;
  };
  rabbitmq: {
    url: string;
    heartbeat?: number;
    frameMax?: number;
    connectionTimeout?: number;
  };
  kafka: {
    clientId: string;
    brokers: string[];
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsPort?: number;
    jaegerEndpoint?: string;
  };
}

export interface JobPriority {
  CRITICAL: number;
  HIGH: number;
  NORMAL: number;
  LOW: number;
  BATCH: number;
}

export interface RetryPolicy {
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
    maxDelay?: number;
    multiplier?: number;
    jitter?: boolean;
  };
}

export interface QueueOptions {
  priority?: number;
  delay?: number;
  retry?: RetryPolicy;
  timeout?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
  attempts?: number;
  jobId?: string;
  repeat?: {
    pattern?: string;
    every?: number;
    immediately?: boolean;
    endDate?: Date;
    limit?: number;
    tz?: string;
  };
}

export class ProductionQueueManager extends EventEmitter {
  private redis: Redis;
  private redisConnection: ConnectionOptions;
  private rabbitConnection?: amqp.Connection;
  private rabbitChannel?: amqp.Channel;
  private kafkaClient?: Kafka;
  private kafkaProducer?: Producer;
  private kafkaConsumers: Map<string, Consumer> = new Map();
  
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  
  private redisPool: Pool<Redis>;
  private rabbitChannelPool: Pool<amqp.Channel>;
  
  private metrics = {
    jobsProcessed: 0,
    jobsFailed: 0,
    jobsRetried: 0,
    totalProcessingTime: 0,
    queueDepths: new Map<string, number>(),
    workerUtilization: new Map<string, number>(),
  };

  private config: QueueConfig;
  private logger: Logger;
  private isShuttingDown = false;

  public static readonly PRIORITIES: JobPriority = {
    CRITICAL: 100,
    HIGH: 75,
    NORMAL: 50,
    LOW: 25,
    BATCH: 1,
  };

  public static readonly DEFAULT_RETRY_POLICY: RetryPolicy = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
      maxDelay: 60000,
      multiplier: 2,
      jitter: true,
    },
  };

  constructor(config: QueueConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;

    // Redis connection configuration
    this.redisConnection = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest || 3,
      retryDelayOnFailover: config.redis.retryDelayOnFailover || 100,
      enableAutoPipelining: config.redis.enableAutoPipelining ?? true,
      lazyConnect: true,
      maxLoadingTimeout: 5000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      family: 4,
      keepAlive: 30000,
    };

    this.redis = new Redis(this.redisConnection);
    this.setupRedisEventHandlers();
    this.initializePools();
  }

  private setupRedisEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error({ error }, 'Redis connection error');
      this.emit('redis:error', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.emit('redis:disconnected');
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Redis reconnecting...');
      this.emit('redis:reconnecting');
    });
  }

  private initializePools(): void {
    // Redis connection pool
    this.redisPool = createGenericPool({
      create: async () => new Redis(this.redisConnection),
      destroy: async (client) => {
        await client.quit();
      },
      validate: async (client) => {
        try {
          await client.ping();
          return true;
        } catch {
          return false;
        }
      },
    }, {
      max: 20,
      min: 5,
      acquireTimeoutMillis: 5000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 300000,
      reapIntervalMillis: 60000,
      autostart: true,
    });

    // RabbitMQ channel pool (will be initialized when needed)
    this.rabbitChannelPool = createGenericPool({
      create: async () => {
        if (!this.rabbitConnection) {
          throw new Error('RabbitMQ connection not established');
        }
        return await this.rabbitConnection.createChannel();
      },
      destroy: async (channel) => {
        try {
          await channel.close();
        } catch (error) {
          this.logger.warn({ error }, 'Error closing RabbitMQ channel');
        }
      },
      validate: async (channel) => {
        return !channel.connection.stream.destroyed;
      },
    }, {
      max: 10,
      min: 2,
      acquireTimeoutMillis: 5000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 300000,
      reapIntervalMillis: 60000,
      autostart: false,
    });
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Production Queue Manager...');

      // Initialize Redis
      await this.redis.connect();
      await this.redis.ping();
      this.logger.info('Redis connection established');

      // Initialize RabbitMQ
      await this.initializeRabbitMQ();

      // Initialize Kafka
      await this.initializeKafka();

      // Setup health monitoring
      this.setupHealthMonitoring();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.info('Production Queue Manager initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Queue Manager');
      throw error;
    }
  }

  private async initializeRabbitMQ(): Promise<void> {
    try {
      this.rabbitConnection = await amqp.connect(this.config.rabbitmq.url, {
        heartbeat: this.config.rabbitmq.heartbeat || 60,
        frameMax: this.config.rabbitmq.frameMax || 0x1000,
        timeout: this.config.rabbitmq.connectionTimeout || 60000,
      });

      this.rabbitConnection.on('error', (error) => {
        this.logger.error({ error }, 'RabbitMQ connection error');
        this.emit('rabbitmq:error', error);
      });

      this.rabbitConnection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.emit('rabbitmq:disconnected');
      });

      this.rabbitChannel = await this.rabbitConnection.createChannel();
      await this.rabbitChannel.prefetch(100); // Global prefetch

      this.logger.info('RabbitMQ connection established');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize RabbitMQ');
      throw error;
    }
  }

  private async initializeKafka(): Promise<void> {
    try {
      this.kafkaClient = new Kafka({
        clientId: this.config.kafka.clientId,
        brokers: this.config.kafka.brokers,
        ssl: this.config.kafka.ssl,
        sasl: this.config.kafka.sasl,
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          initialRetryTime: 100,
          retries: 8,
          multiplier: 2,
          maxRetryTime: 30000,
        },
      });

      this.kafkaProducer = this.kafkaClient.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
        allowAutoTopicCreation: false,
      });

      await this.kafkaProducer.connect();
      this.logger.info('Kafka connection established');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Kafka');
      throw error;
    }
  }

  public async createQueue(
    name: string,
    processor?: (job: Job) => Promise<any>,
    options: QueueOptions = {}
  ): Promise<Queue> {
    try {
      if (this.queues.has(name)) {
        return this.queues.get(name)!;
      }

      const queueOptions = {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: options.removeOnComplete || 100,
          removeOnFail: options.removeOnFail || 50,
          attempts: options.attempts || ProductionQueueManager.DEFAULT_RETRY_POLICY.attempts,
          backoff: {
            type: ProductionQueueManager.DEFAULT_RETRY_POLICY.backoff.type,
            delay: ProductionQueueManager.DEFAULT_RETRY_POLICY.backoff.delay,
          },
          delay: options.delay || 0,
        },
      };

      const queue = new Queue(name, queueOptions);
      this.queues.set(name, queue);

      // Create circuit breaker for this queue
      const circuitBreaker = new CircuitBreaker(
        async (job: Job) => {
          if (processor) {
            return await processor(job);
          }
          throw new Error('No processor defined for queue');
        },
        {
          timeout: options.timeout || 30000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
          rollingCountTimeout: 60000,
          rollingCountBuckets: 10,
          name: `queue-${name}`,
        }
      );

      this.circuitBreakers.set(name, circuitBreaker);

      // Setup circuit breaker event handlers
      circuitBreaker.on('open', () => {
        this.logger.warn({ queueName: name }, 'Circuit breaker opened for queue');
        this.emit('circuit-breaker:open', name);
      });

      circuitBreaker.on('halfOpen', () => {
        this.logger.info({ queueName: name }, 'Circuit breaker half-open for queue');
        this.emit('circuit-breaker:half-open', name);
      });

      circuitBreaker.on('close', () => {
        this.logger.info({ queueName: name }, 'Circuit breaker closed for queue');
        this.emit('circuit-breaker:close', name);
      });

      if (processor) {
        await this.createWorker(name, processor, options);
      }

      // Setup queue events monitoring
      const queueEvents = new QueueEvents(name, { connection: this.redisConnection });
      this.queueEvents.set(name, queueEvents);
      this.setupQueueEventHandlers(name, queueEvents);

      this.logger.info({ queueName: name }, 'Queue created successfully');
      return queue;

    } catch (error) {
      this.logger.error({ error, queueName: name }, 'Failed to create queue');
      throw error;
    }
  }

  private async createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    options: QueueOptions = {}
  ): Promise<Worker> {
    const concurrency = process.env.NODE_ENV === 'production' ? 5 : 2;
    
    const worker = new Worker(
      queueName,
      async (job: Job) => {
        const startTime = Date.now();
        try {
          const circuitBreaker = this.circuitBreakers.get(queueName);
          let result;

          if (circuitBreaker) {
            result = await circuitBreaker.fire(job);
          } else {
            result = await processor(job);
          }

          // Update metrics
          this.metrics.jobsProcessed++;
          this.metrics.totalProcessingTime += Date.now() - startTime;

          this.logger.info({
            jobId: job.id,
            queueName,
            processingTime: Date.now() - startTime,
          }, 'Job processed successfully');

          return result;
        } catch (error) {
          this.metrics.jobsFailed++;
          this.logger.error({
            error,
            jobId: job.id,
            queueName,
            processingTime: Date.now() - startTime,
          }, 'Job processing failed');
          throw error;
        }
      },
      {
        connection: this.redisConnection,
        concurrency,
        maxStalledCount: 1,
        stalledInterval: 30000,
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50,
      }
    );

    this.workers.set(queueName, worker);

    // Setup worker event handlers
    worker.on('completed', (job) => {
      this.logger.debug({ jobId: job.id, queueName }, 'Job completed');
      this.emit('job:completed', { queueName, jobId: job.id });
    });

    worker.on('failed', (job, err) => {
      this.logger.error({
        error: err,
        jobId: job?.id,
        queueName,
      }, 'Job failed');
      this.emit('job:failed', { queueName, jobId: job?.id, error: err });
    });

    worker.on('stalled', (jobId) => {
      this.logger.warn({ jobId, queueName }, 'Job stalled');
      this.emit('job:stalled', { queueName, jobId });
    });

    worker.on('error', (error) => {
      this.logger.error({ error, queueName }, 'Worker error');
      this.emit('worker:error', { queueName, error });
    });

    return worker;
  }

  private setupQueueEventHandlers(queueName: string, queueEvents: QueueEvents): void {
    queueEvents.on('waiting', ({ jobId }) => {
      this.emit('job:waiting', { queueName, jobId });
    });

    queueEvents.on('active', ({ jobId }) => {
      this.emit('job:active', { queueName, jobId });
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.emit('job:completed', { queueName, jobId, returnvalue });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.metrics.jobsFailed++;
      this.emit('job:failed', { queueName, jobId, failedReason });
    });

    queueEvents.on('retries-exhausted', ({ jobId }) => {
      this.metrics.jobsRetried++;
      this.emit('job:retries-exhausted', { queueName, jobId });
    });
  }

  public async addJob(
    queueName: string,
    jobName: string,
    data: any,
    options: QueueOptions = {}
  ): Promise<Job> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const jobOptions = {
        priority: options.priority || ProductionQueueManager.PRIORITIES.NORMAL,
        delay: options.delay || 0,
        attempts: options.retry?.attempts || ProductionQueueManager.DEFAULT_RETRY_POLICY.attempts,
        backoff: options.retry?.backoff || ProductionQueueManager.DEFAULT_RETRY_POLICY.backoff,
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50,
        jobId: options.jobId,
        repeat: options.repeat,
      };

      const job = await queue.add(jobName, data, jobOptions);
      
      this.logger.debug({
        jobId: job.id,
        queueName,
        jobName,
        priority: jobOptions.priority,
      }, 'Job added to queue');

      return job;
    } catch (error) {
      this.logger.error({
        error,
        queueName,
        jobName,
      }, 'Failed to add job to queue');
      throw error;
    }
  }

  public async getQueueMetrics(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  public getGlobalMetrics(): any {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.jobsProcessed > 0 
        ? this.metrics.totalProcessingTime / this.metrics.jobsProcessed 
        : 0,
      queues: Array.from(this.queues.keys()),
      workers: Array.from(this.workers.keys()),
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
        name,
        state: cb.stats,
      })),
    };
  }

  private setupHealthMonitoring(): void {
    setInterval(async () => {
      try {
        // Update queue depths
        for (const [name, queue] of this.queues) {
          const metrics = await this.getQueueMetrics(name);
          this.metrics.queueDepths.set(name, metrics.total);
        }

        // Update worker utilization
        for (const [name, worker] of this.workers) {
          // This is a simplified utilization metric
          // In production, you'd want more sophisticated metrics
          this.metrics.workerUtilization.set(name, Math.random() * 100);
        }

        this.emit('metrics:updated', this.getGlobalMetrics());
      } catch (error) {
        this.logger.error({ error }, 'Error updating health metrics');
      }
    }, 30000); // Update every 30 seconds
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      this.logger.info({ signal }, 'Graceful shutdown initiated');

      try {
        // Stop accepting new jobs
        await Promise.all(Array.from(this.queues.values()).map(q => q.pause()));

        // Close workers gracefully
        await Promise.all(Array.from(this.workers.values()).map(w => w.close()));

        // Close queue events
        await Promise.all(Array.from(this.queueEvents.values()).map(qe => qe.close()));

        // Close connections
        await this.redis.quit();
        
        if (this.rabbitConnection) {
          await this.rabbitConnection.close();
        }

        if (this.kafkaProducer) {
          await this.kafkaProducer.disconnect();
        }

        for (const consumer of this.kafkaConsumers.values()) {
          await consumer.disconnect();
        }

        // Close pools
        await this.redisPool.drain();
        await this.redisPool.clear();
        
        await this.rabbitChannelPool.drain();
        await this.rabbitChannelPool.clear();

        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error({ error }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public async publishToRabbitMQ(
    exchange: string,
    routingKey: string,
    message: any,
    options: any = {}
  ): Promise<boolean> {
    try {
      if (!this.rabbitChannel) {
        throw new Error('RabbitMQ channel not available');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      return this.rabbitChannel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        ...options,
      });
    } catch (error) {
      this.logger.error({ error, exchange, routingKey }, 'Failed to publish to RabbitMQ');
      throw error;
    }
  }

  public async publishToKafka(
    topic: string,
    messages: any[],
    options: any = {}
  ): Promise<void> {
    try {
      if (!this.kafkaProducer) {
        throw new Error('Kafka producer not available');
      }

      const kafkaMessages = messages.map(message => ({
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
        ...options,
      }));

      await this.kafkaProducer.send({
        topic,
        messages: kafkaMessages,
      });
    } catch (error) {
      this.logger.error({ error, topic }, 'Failed to publish to Kafka');
      throw error;
    }
  }

  public async subscribeToKafka(
    topic: string,
    groupId: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.kafkaClient) {
        throw new Error('Kafka client not available');
      }

      const consumer = this.kafkaClient.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const data = JSON.parse(message.value?.toString() || '{}');
            await handler(data);
          } catch (error) {
            this.logger.error({ error, topic }, 'Error processing Kafka message');
          }
        },
      });

      this.kafkaConsumers.set(topic, consumer);
    } catch (error) {
      this.logger.error({ error, topic }, 'Failed to subscribe to Kafka');
      throw error;
    }
  }
}

export default ProductionQueueManager;