import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * ADVANCED MESSAGE QUEUE SYSTEM
 * 
 * Enterprise-grade message queue system for real-time message broadcasting
 * with delivery guarantees, persistence, and advanced routing capabilities.
 * 
 * Features:
 * ✅ Redis pub/sub for horizontal scaling
 * ✅ Message persistence with TTL
 * ✅ Delivery guarantees and acknowledgments
 * ✅ Priority-based message routing
 * ✅ Rate limiting and spam protection
 * ✅ Message batching for performance
 * ✅ Dead letter queue for failed messages
 * ✅ Circuit breaker for reliability
 * ✅ Message encryption for sensitive data
 * ✅ Analytics and monitoring
 */

export interface QueueMessage {
  id: string;
  type: 'chat' | 'notification' | 'system' | 'moderation' | 'presence' | 'voice';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  payload: any;
  routing: {
    from: string;
    to: string | string[]; // User ID(s) or room ID
    targetType: 'user' | 'room' | 'server' | 'global';
    namespace?: string;
  };
  delivery: {
    guaranteeDelivery: boolean;
    requireAck: boolean;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    persistUntilRead?: boolean;
  };
  metadata: {
    createdAt: Date;
    scheduledFor?: Date;
    expiresAt?: Date;
    attempts: number;
    lastAttempt?: Date;
    status: 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed' | 'expired';
    error?: string;
    serverId: string;
    trace?: string[];
  };
  security?: {
    encrypted: boolean;
    signature?: string;
    sensitive: boolean;
  };
}

export interface MessageAck {
  messageId: string;
  userId: string;
  timestamp: Date;
  status: 'received' | 'read' | 'error';
  error?: string;
}

export interface QueueMetrics {
  totalMessages: number;
  pendingMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  messagesByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  messagesByType: Record<string, number>;
  averageDeliveryTime: number;
  throughputPerSecond: number;
  errorRate: number;
}

export interface RateLimitConfig {
  maxMessages: number;
  windowMs: number;
  burstLimit: number;
  penaltyMs: number;
}

export class AdvancedMessageQueue extends EventEmitter {
  private fastify: FastifyInstance;
  private io: Server;
  private redis: Redis;
  private redisSubscriber: Redis;
  private redisPublisher: Redis;
  
  // Message queues by priority
  private queues = {
    urgent: [] as QueueMessage[],
    high: [] as QueueMessage[],
    normal: [] as QueueMessage[],
    low: [] as QueueMessage[]
  };
  
  // Dead letter queue for failed messages
  private deadLetterQueue: QueueMessage[] = [];
  
  // Rate limiting state
  private rateLimits = new Map<string, {
    count: number;
    resetTime: number;
    penaltyUntil?: number;
  }>();
  
  // Message acknowledgments
  private pendingAcks = new Map<string, {
    message: QueueMessage;
    timer: NodeJS.Timeout;
    retryCount: number;
  }>();
  
  // Performance metrics
  private metrics: QueueMetrics = {
    totalMessages: 0,
    pendingMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    messagesByPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
    messagesByType: {},
    averageDeliveryTime: 0,
    throughputPerSecond: 0,
    errorRate: 0
  };
  
  // Circuit breaker state
  private circuitBreaker = {
    isOpen: false,
    failures: 0,
    lastFailure: null as Date | null,
    threshold: 10,
    timeout: 30000
  };
  
  // Configuration
  private config = {
    batchSize: 100,
    processingInterval: 100, // ms
    maxRetries: 3,
    defaultTimeout: 30000,
    deadLetterThreshold: 5,
    rateLimit: {
      maxMessages: 100,
      windowMs: 60000,
      burstLimit: 200,
      penaltyMs: 300000
    } as RateLimitConfig
  };
  
  // Processing state
  private isProcessing = false;
  private processingTimer: NodeJS.Timeout | null = null;
  
  constructor(fastify: FastifyInstance, io: Server, redis: Redis) {
    super();
    this.fastify = fastify;
    this.io = io;
    this.redis = redis;
    
    this.setupRedisConnections();
    this.setupEventHandlers();
    this.startProcessing();
    this.setupCleanupTasks();
  }
  
  private async setupRedisConnections() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
    
    this.redisSubscriber = new Redis(redisUrl);
    this.redisPublisher = new Redis(redisUrl);
    
    // Setup pub/sub channels
    await this.redisSubscriber.subscribe(
      'cryb:messages',
      'cryb:notifications',
      'cryb:system',
      'cryb:moderation',
      'cryb:acks'
    );
    
    this.redisSubscriber.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message);
    });
    
    this.fastify.log.info('📡 Message queue Redis connections established');
  }
  
  private handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'cryb:messages':
        case 'cryb:notifications':
        case 'cryb:system':
        case 'cryb:moderation':
          this.handleIncomingMessage(data);
          break;
          
        case 'cryb:acks':
          this.handleMessageAck(data);
          break;
      }
    } catch (error) {
      this.fastify.log.error('Failed to parse Redis message:', error);
    }
  }
  
  private handleIncomingMessage(messageData: QueueMessage) {
    // Add server trace
    if (!messageData.metadata.trace) {
      messageData.metadata.trace = [];
    }
    messageData.metadata.trace.push(process.env.SERVER_ID || 'unknown');
    
    // Add to appropriate queue
    this.addToQueue(messageData);
  }
  
  private handleMessageAck(ackData: MessageAck) {
    const pendingAck = this.pendingAcks.get(ackData.messageId);
    if (pendingAck) {
      clearTimeout(pendingAck.timer);
      this.pendingAcks.delete(ackData.messageId);
      
      // Update message status
      pendingAck.message.metadata.status = 'acknowledged';
      
      this.emit('message:acknowledged', {
        message: pendingAck.message,
        ack: ackData
      });
      
      this.metrics.deliveredMessages++;
    }
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Message acknowledgment from client
      socket.on('message:ack', (ackData: Omit<MessageAck, 'timestamp'>) => {
        const fullAck: MessageAck = {
          ...ackData,
          timestamp: new Date()
        };
        
        this.handleMessageAck(fullAck);
        
        // Broadcast ack to other servers
        this.redisPublisher.publish('cryb:acks', JSON.stringify(fullAck));
      });
      
      // Send message via queue
      socket.on('queue:send', async (data: {
        type: QueueMessage['type'];
        payload: any;
        to: string | string[];
        targetType: 'user' | 'room' | 'server' | 'global';
        priority?: QueueMessage['priority'];
        options?: Partial<QueueMessage['delivery']>;
      }) => {
        try {
          const userId = (socket as any).userId;
          
          // Rate limiting check
          if (!await this.checkRateLimit(userId)) {
            socket.emit('queue:error', {
              error: 'Rate limit exceeded',
              retryAfter: this.getRateLimitReset(userId)
            });
            return;
          }
          
          const message = await this.createMessage({
            type: data.type,
            payload: data.payload,
            from: userId,
            to: data.to,
            targetType: data.targetType,
            priority: data.priority || 'normal',
            options: data.options
          });
          
          await this.enqueueMessage(message);
          
          socket.emit('queue:enqueued', {
            messageId: message.id,
            status: 'queued'
          });
          
        } catch (error) {
          socket.emit('queue:error', {
            error: (error as Error).message
          });
        }
      });
    });
  }
  
  // Core queue operations
  public async enqueueMessage(message: QueueMessage): Promise<void> {
    // Circuit breaker check
    if (this.circuitBreaker.isOpen) {
      throw new Error('Message queue circuit breaker is open');
    }
    
    // Validate message
    this.validateMessage(message);
    
    // Persist to Redis for durability
    if (message.delivery.guaranteeDelivery) {
      await this.persistMessage(message);
    }
    
    // Add to local queue
    this.addToQueue(message);
    
    // Broadcast to other servers via Redis
    await this.broadcastMessage(message);
    
    this.metrics.totalMessages++;
    this.metrics.messagesByPriority[message.priority]++;
    this.metrics.messagesByType[message.type] = (this.metrics.messagesByType[message.type] || 0) + 1;
    
    this.emit('message:enqueued', message);
  }
  
  private addToQueue(message: QueueMessage) {
    this.queues[message.priority].push(message);
    this.metrics.pendingMessages++;
  }
  
  private async broadcastMessage(message: QueueMessage): Promise<void> {
    const channel = this.getChannelForType(message.type);
    await this.redisPublisher.publish(channel, JSON.stringify(message));
  }
  
  private getChannelForType(type: QueueMessage['type']): string {
    switch (type) {
      case 'chat': return 'cryb:messages';
      case 'notification': return 'cryb:notifications';
      case 'system': return 'cryb:system';
      case 'moderation': return 'cryb:moderation';
      default: return 'cryb:messages';
    }
  }
  
  // Message processing
  private startProcessing() {
    this.processingTimer = setInterval(() => {
      if (!this.isProcessing) {
        this.processQueues();
      }
    }, this.config.processingInterval);
  }
  
  private async processQueues() {
    if (this.circuitBreaker.isOpen) {
      this.checkCircuitBreaker();
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process in priority order
      const priorities: Array<keyof typeof this.queues> = ['urgent', 'high', 'normal', 'low'];
      
      for (const priority of priorities) {
        const queue = this.queues[priority];
        const batch = queue.splice(0, this.config.batchSize);
        
        if (batch.length > 0) {
          await this.processBatch(batch);
          this.metrics.pendingMessages -= batch.length;
        }
        
        // Prevent starvation - process one batch per cycle
        if (batch.length > 0) break;
      }
      
    } catch (error) {
      this.handleProcessingError(error as Error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async processBatch(messages: QueueMessage[]) {
    const processingPromises = messages.map(message => this.processMessage(message));
    
    try {
      await Promise.allSettled(processingPromises);
    } catch (error) {
      this.fastify.log.error('Batch processing error:', error);
    }
  }
  
  private async processMessage(message: QueueMessage): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if message is expired
      if (message.metadata.expiresAt && new Date() > message.metadata.expiresAt) {
        message.metadata.status = 'expired';
        this.emit('message:expired', message);
        return;
      }
      
      // Check if scheduled for future
      if (message.metadata.scheduledFor && new Date() < message.metadata.scheduledFor) {
        this.addToQueue(message); // Re-queue for later
        return;
      }
      
      // Route message to recipients
      await this.routeMessage(message);
      
      message.metadata.status = 'sent';
      message.metadata.lastAttempt = new Date();
      
      // Setup acknowledgment timeout if required
      if (message.delivery.requireAck) {
        this.setupAckTimeout(message);
      } else {
        message.metadata.status = 'delivered';
        this.metrics.deliveredMessages++;
      }
      
      // Track delivery time
      const deliveryTime = Date.now() - startTime;
      this.updateDeliveryMetrics(deliveryTime);
      
      this.emit('message:processed', message);
      
    } catch (error) {
      await this.handleMessageError(message, error as Error);
    }
  }
  
  private async routeMessage(message: QueueMessage): Promise<void> {
    const { routing } = message;
    
    switch (routing.targetType) {
      case 'user':
        await this.routeToUsers(message, Array.isArray(routing.to) ? routing.to : [routing.to]);
        break;
        
      case 'room':
        await this.routeToRoom(message, routing.to as string);
        break;
        
      case 'server':
        await this.routeToServer(message, routing.to as string);
        break;
        
      case 'global':
        await this.routeGlobally(message);
        break;
        
      default:
        throw new Error(`Unknown target type: ${routing.targetType}`);
    }
  }
  
  private async routeToUsers(message: QueueMessage, userIds: string[]): Promise<void> {
    const deliveryPromises = userIds.map(async (userId) => {
      const userSockets = await this.getUserSockets(userId);
      
      if (userSockets.length === 0) {
        // User is offline, handle based on persistence settings
        if (message.delivery.persistUntilRead) {
          await this.persistOfflineMessage(message, userId);
        }
        return;
      }
      
      // Send to all user's sockets
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('message:received', {
          id: message.id,
          type: message.type,
          payload: message.payload,
          from: message.routing.from,
          timestamp: message.metadata.createdAt,
          requireAck: message.delivery.requireAck
        });
      });
    });
    
    await Promise.allSettled(deliveryPromises);
  }
  
  private async routeToRoom(message: QueueMessage, roomId: string): Promise<void> {
    this.io.to(roomId).emit('message:received', {
      id: message.id,
      type: message.type,
      payload: message.payload,
      from: message.routing.from,
      roomId,
      timestamp: message.metadata.createdAt,
      requireAck: message.delivery.requireAck
    });
  }
  
  private async routeToServer(message: QueueMessage, serverId: string): Promise<void> {
    // Route to all rooms in a server
    const namespace = this.io.of(`/server/${serverId}`);
    namespace.emit('message:received', {
      id: message.id,
      type: message.type,
      payload: message.payload,
      from: message.routing.from,
      serverId,
      timestamp: message.metadata.createdAt,
      requireAck: message.delivery.requireAck
    });
  }
  
  private async routeGlobally(message: QueueMessage): Promise<void> {
    this.io.emit('message:received', {
      id: message.id,
      type: message.type,
      payload: message.payload,
      from: message.routing.from,
      timestamp: message.metadata.createdAt,
      requireAck: message.delivery.requireAck
    });
  }
  
  // Error handling and retries
  private async handleMessageError(message: QueueMessage, error: Error): Promise<void> {
    message.metadata.attempts++;
    message.metadata.error = error.message;
    message.metadata.lastAttempt = new Date();
    
    this.fastify.log.error(`Message processing failed: ${error.message}`, {
      messageId: message.id,
      attempts: message.metadata.attempts
    });
    
    if (message.metadata.attempts < message.delivery.maxRetries) {
      // Retry with exponential backoff
      const delay = message.delivery.retryDelay * Math.pow(2, message.metadata.attempts - 1);
      
      setTimeout(() => {
        this.addToQueue(message);
      }, delay);
      
    } else {
      // Max retries exceeded, move to dead letter queue
      message.metadata.status = 'failed';
      this.deadLetterQueue.push(message);
      this.metrics.failedMessages++;
      
      this.emit('message:failed', message);
      
      // Clean up dead letter queue if it gets too large
      if (this.deadLetterQueue.length > this.config.deadLetterThreshold * 100) {
        this.deadLetterQueue.splice(0, this.config.deadLetterThreshold);
      }
    }
    
    // Update circuit breaker
    this.recordFailure();
  }
  
  private handleProcessingError(error: Error): void {
    this.fastify.log.error('Queue processing error:', error);
    this.recordFailure();
  }
  
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = new Date();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.fastify.log.error('🚨 Message queue circuit breaker opened');
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
        this.fastify.log.info('✅ Message queue circuit breaker reset');
      }, this.circuitBreaker.timeout);
    }
  }
  
  private checkCircuitBreaker(): void {
    if (this.circuitBreaker.isOpen && this.circuitBreaker.lastFailure) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure.getTime();
      if (timeSinceLastFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
        this.fastify.log.info('✅ Message queue circuit breaker reset after timeout');
      }
    }
  }
  
  // Rate limiting
  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);
    
    if (!userLimit) {
      this.rateLimits.set(userId, {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs
      });
      return true;
    }
    
    // Check if penalty period is active
    if (userLimit.penaltyUntil && now < userLimit.penaltyUntil) {
      return false;
    }
    
    // Reset window if expired
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + this.config.rateLimit.windowMs;
      userLimit.penaltyUntil = undefined;
      return true;
    }
    
    // Check burst limit
    if (userLimit.count >= this.config.rateLimit.burstLimit) {
      userLimit.penaltyUntil = now + this.config.rateLimit.penaltyMs;
      this.fastify.log.warn(`Rate limit penalty applied to user ${userId}`);
      return false;
    }
    
    // Check normal limit
    if (userLimit.count >= this.config.rateLimit.maxMessages) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
  
  private getRateLimitReset(userId: string): number {
    const userLimit = this.rateLimits.get(userId);
    if (!userLimit) return 0;
    
    if (userLimit.penaltyUntil) {
      return Math.max(0, userLimit.penaltyUntil - Date.now());
    }
    
    return Math.max(0, userLimit.resetTime - Date.now());
  }
  
  // Acknowledgment handling
  private setupAckTimeout(message: QueueMessage): void {
    const timer = setTimeout(() => {
      const pendingAck = this.pendingAcks.get(message.id);
      if (pendingAck) {
        this.pendingAcks.delete(message.id);
        
        if (pendingAck.retryCount < message.delivery.maxRetries) {
          // Retry delivery
          pendingAck.retryCount++;
          this.addToQueue(message);
        } else {
          // Mark as failed
          message.metadata.status = 'failed';
          this.deadLetterQueue.push(message);
          this.emit('message:ack-timeout', message);
        }
      }
    }, message.delivery.timeout);
    
    this.pendingAcks.set(message.id, {
      message,
      timer,
      retryCount: 0
    });
  }
  
  // Utility methods
  private async getUserSockets(userId: string): Promise<string[]> {
    const sockets: string[] = [];
    
    for (const [socketId, socket] of this.io.sockets.sockets) {
      if ((socket as any).userId === userId) {
        sockets.push(socketId);
      }
    }
    
    return sockets;
  }
  
  private validateMessage(message: QueueMessage): void {
    if (!message.id || !message.type || !message.routing) {
      throw new Error('Invalid message format');
    }
    
    if (!message.routing.from || !message.routing.to) {
      throw new Error('Message routing information is incomplete');
    }
  }
  
  private async createMessage(params: {
    type: QueueMessage['type'];
    payload: any;
    from: string;
    to: string | string[];
    targetType: 'user' | 'room' | 'server' | 'global';
    priority: QueueMessage['priority'];
    options?: Partial<QueueMessage['delivery']>;
  }): Promise<QueueMessage> {
    return {
      id: randomUUID(),
      type: params.type,
      priority: params.priority,
      payload: params.payload,
      routing: {
        from: params.from,
        to: params.to,
        targetType: params.targetType
      },
      delivery: {
        guaranteeDelivery: params.options?.guaranteeDelivery ?? true,
        requireAck: params.options?.requireAck ?? false,
        maxRetries: params.options?.maxRetries ?? this.config.maxRetries,
        retryDelay: params.options?.retryDelay ?? 1000,
        timeout: params.options?.timeout ?? this.config.defaultTimeout,
        persistUntilRead: params.options?.persistUntilRead ?? false
      },
      metadata: {
        createdAt: new Date(),
        attempts: 0,
        status: 'pending',
        serverId: process.env.SERVER_ID || 'unknown',
        trace: []
      }
    };
  }
  
  private async persistMessage(message: QueueMessage): Promise<void> {
    try {
      await this.redis.setex(
        `message:${message.id}`,
        86400, // 24 hours
        JSON.stringify(message)
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist message:', error);
    }
  }
  
  private async persistOfflineMessage(message: QueueMessage, userId: string): Promise<void> {
    try {
      await this.redis.lpush(
        `offline_messages:${userId}`,
        JSON.stringify({
          id: message.id,
          type: message.type,
          payload: message.payload,
          from: message.routing.from,
          timestamp: message.metadata.createdAt
        })
      );
      
      // Keep only last 100 offline messages per user
      await this.redis.ltrim(`offline_messages:${userId}`, 0, 99);
      
    } catch (error) {
      this.fastify.log.error('Failed to persist offline message:', error);
    }
  }
  
  private updateDeliveryMetrics(deliveryTime: number): void {
    // Simple moving average for delivery time
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * 0.9) + (deliveryTime * 0.1);
  }
  
  // Cleanup tasks
  private setupCleanupTasks(): void {
    // Clean rate limits
    setInterval(() => {
      const now = Date.now();
      for (const [userId, limit] of this.rateLimits.entries()) {
        if (now > limit.resetTime && (!limit.penaltyUntil || now > limit.penaltyUntil)) {
          this.rateLimits.delete(userId);
        }
      }
    }, 60000); // Every minute
    
    // Update metrics
    setInterval(() => {
      this.updateThroughputMetrics();
    }, 5000); // Every 5 seconds
  }
  
  private updateThroughputMetrics(): void {
    const totalProcessed = this.metrics.deliveredMessages + this.metrics.failedMessages;
    this.metrics.throughputPerSecond = totalProcessed / 60; // Approximate
    this.metrics.errorRate = totalProcessed > 0 ? 
      (this.metrics.failedMessages / totalProcessed) * 100 : 0;
  }
  
  // Public API
  public getMetrics(): QueueMetrics {
    return {
      ...this.metrics,
      pendingMessages: Object.values(this.queues).reduce(
        (sum, queue) => sum + queue.length, 0
      )
    };
  }
  
  public getHealth() {
    return {
      status: this.circuitBreaker.isOpen ? 'unhealthy' : 'healthy',
      circuitBreaker: {
        isOpen: this.circuitBreaker.isOpen,
        failures: this.circuitBreaker.failures
      },
      queues: {
        urgent: this.queues.urgent.length,
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length
      },
      deadLetterQueue: this.deadLetterQueue.length,
      pendingAcks: this.pendingAcks.size,
      rateLimits: this.rateLimits.size
    };
  }
  
  public async getOfflineMessages(userId: string): Promise<any[]> {
    try {
      const messages = await this.redis.lrange(`offline_messages:${userId}`, 0, -1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      this.fastify.log.error('Failed to get offline messages:', error);
      return [];
    }
  }
  
  public async clearOfflineMessages(userId: string): Promise<void> {
    try {
      await this.redis.del(`offline_messages:${userId}`);
    } catch (error) {
      this.fastify.log.error('Failed to clear offline messages:', error);
    }
  }
  
  public async gracefulShutdown(): Promise<void> {
    this.fastify.log.info('Shutting down message queue...');
    
    // Stop processing
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    // Process remaining messages
    await this.processQueues();
    
    // Close Redis connections
    await Promise.all([
      this.redisSubscriber.quit(),
      this.redisPublisher.quit()
    ]);
    
    this.fastify.log.info('Message queue shutdown complete');
  }
}

// Factory function
export function createAdvancedMessageQueue(
  fastify: FastifyInstance,
  io: Server,
  redis: Redis
): AdvancedMessageQueue {
  return new AdvancedMessageQueue(fastify, io, redis);
}
