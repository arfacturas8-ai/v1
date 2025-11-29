import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Import all production systems
import { ProductionSocketCluster, createProductionCluster } from './production-realtime-cluster';
import { AdvancedRoomManager, createAdvancedRoomManager } from './advanced-room-management';
import { ProductionPresenceSystem, createProductionPresenceSystem } from './production-presence-system';
import { AdvancedMessageQueue, createAdvancedMessageQueue } from './advanced-message-queue';
import { ConnectionLifecycleManager, createConnectionLifecycleManager } from './connection-lifecycle-manager';
import { RealtimeNotificationSystem, createRealtimeNotificationSystem } from './realtime-notifications';
import { AdvancedRedisPubSub, createAdvancedRedisPubSub } from './advanced-redis-pubsub';

/**
 * PRODUCTION REAL-TIME PLATFORM INTEGRATION
 * 
 * This is the main integration file that brings together all the production-ready
 * real-time systems into a cohesive, scalable platform for 100K+ concurrent users.
 * 
 * Complete System Features:
 * ✅ Horizontal scaling with Redis clustering
 * ✅ Advanced room management for communities and DMs
 * ✅ Production presence system with typing indicators
 * ✅ Message queue with delivery guarantees
 * ✅ Connection lifecycle management with reconnection
 * ✅ Real-time notifications with multi-channel delivery
 * ✅ Live reactions and read receipts
 * ✅ Message batching and performance optimization
 * ✅ Graceful degradation and circuit breakers
 * ✅ Comprehensive monitoring and alerting
 */

export interface PlatformConfig {
  server: {
    serverId: string;
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
  };
  redis: {
    url: string;
    cluster?: {
      enabled: boolean;
      nodes: Array<{ host: string; port: number }>;
    };
  };
  features: {
    clustering: boolean;
    roomManagement: boolean;
    presenceSystem: boolean;
    messageQueue: boolean;
    lifecycleManager: boolean;
    notifications: boolean;
    liveReactions: boolean;
    readReceipts: boolean;
    monitoring: boolean;
  };
  performance: {
    maxConnections: number;
    messageRateLimit: number;
    batchingEnabled: boolean;
    degradationEnabled: boolean;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    alertWebhook?: string;
  };
}

export interface PlatformMetrics {
  timestamp: Date;
  system: {
    uptime: number;
    environment: string;
    serverId: string;
    version: string;
  };
  connections: {
    total: number;
    active: number;
    peak: number;
    byDeviceType: Record<string, number>;
  };
  rooms: {
    total: number;
    activeMembers: number;
    communities: number;
    directMessages: number;
  };
  presence: {
    onlineUsers: number;
    typingUsers: number;
    byStatus: Record<string, number>;
  };
  messages: {
    totalProcessed: number;
    queuedMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    averageDeliveryTime: number;
  };
  notifications: {
    totalSent: number;
    deliveredCount: number;
    readCount: number;
    byChannel: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    redisConnected: boolean;
  };
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  };
}

export class ProductionRealtimePlatform extends EventEmitter {
  private fastify: FastifyInstance;
  private io: Server;
  private redis: Redis;
  private pubsub: AdvancedRedisPubSub;

  // System components
  private cluster: ProductionSocketCluster;
  private roomManager: AdvancedRoomManager;
  private presenceSystem: ProductionPresenceSystem;
  private messageQueue: AdvancedMessageQueue;
  private lifecycleManager: ConnectionLifecycleManager;
  private notificationSystem: RealtimeNotificationSystem;
  
  // Configuration and state
  private config: PlatformConfig;
  private isInitialized = false;
  private startTime = Date.now();
  
  // Metrics and monitoring
  private metrics: PlatformMetrics;
  private metricsTimer: NodeJS.Timeout | null = null;
  
  constructor(fastify: FastifyInstance, config: PlatformConfig) {
    super();
    this.fastify = fastify;
    this.config = config;
    
    this.initializeMetrics();
  }
  
  private initializeMetrics() {
    this.metrics = {
      timestamp: new Date(),
      system: {
        uptime: 0,
        environment: this.config.server.environment,
        serverId: this.config.server.serverId,
        version: '1.0.0'
      },
      connections: {
        total: 0,
        active: 0,
        peak: 0,
        byDeviceType: {}
      },
      rooms: {
        total: 0,
        activeMembers: 0,
        communities: 0,
        directMessages: 0
      },
      presence: {
        onlineUsers: 0,
        typingUsers: 0,
        byStatus: {}
      },
      messages: {
        totalProcessed: 0,
        queuedMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        averageDeliveryTime: 0
      },
      notifications: {
        totalSent: 0,
        deliveredCount: 0,
        readCount: 0,
        byChannel: {}
      },
      performance: {
        avgResponseTime: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        redisConnected: false
      },
      health: {
        overall: 'healthy',
        components: {}
      }
    };
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Platform is already initialized');
    }
    
    this.fastify.log.info('🚀 Initializing Production Real-time Platform...');
    
    try {
      // 1. Initialize Redis connection
      await this.initializeRedis();
      
      // 2. Initialize Socket.IO cluster
      if (this.config.features.clustering) {
        this.cluster = await createProductionCluster(this.fastify, {
          server: this.config.server,
          redis: this.config.redis,
          socketio: {
            maxConnections: this.config.performance.maxConnections,
            pingTimeout: 60000,
            pingInterval: 25000,
            upgradeTimeout: 10000,
            maxHttpBufferSize: 1e6,
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            compression: true,
            cors: {
              origin: process.env.FRONTEND_URL || 'http://localhost:3000',
              credentials: true
            }
          },
          performance: {
            messageRateLimit: this.config.performance.messageRateLimit,
            heartbeatInterval: 30000,
            presenceUpdateBatch: 50,
            typingTimeoutMs: 3000,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
          },
          monitoring: this.config.monitoring
        });
        
        this.io = await this.cluster.initialize();
        this.fastify.log.info('✅ Socket.IO cluster initialized');
      } else {
        // Fallback to basic Socket.IO server
        this.io = new Server(this.fastify.server, {
          cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
          },
          transports: ['websocket', 'polling']
        });
      }
      
      // 3. Initialize core systems
      await this.initializeCoreComponents();
      
      // 4. Setup inter-component communication
      this.setupComponentIntegration();
      
      // 5. Setup live features
      this.setupLiveFeatures();
      
      // 6. Setup monitoring
      if (this.config.monitoring.enabled) {
        this.setupMonitoring();
      }
      
      // 7. Setup graceful shutdown
      this.setupGracefulShutdown();
      
      this.isInitialized = true;
      
      this.fastify.log.info('✅ Production Real-time Platform initialized successfully');
      this.fastify.log.info(`📈 Target capacity: ${this.config.performance.maxConnections} concurrent connections`);
      this.fastify.log.info(`🌐 Environment: ${this.config.server.environment}`);
      this.fastify.log.info(`🆔 Server ID: ${this.config.server.serverId}`);
      
      this.emit('platform:initialized');
      
    } catch (error) {
      this.fastify.log.error('❌ Failed to initialize platform:', error);
      throw error;
    }
  }
  
  private async initializeRedis(): Promise<void> {
    const redisUrl = this.config.redis.url;
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      this.fastify.log.info('✅ Redis connected');
      this.metrics.performance.redisConnected = true;
    });

    this.redis.on('error', (error) => {
      this.fastify.log.error('❌ Redis error:', error);
      this.metrics.performance.redisConnected = false;
    });

    // Test connection
    await this.redis.ping();

    // Initialize Redis PubSub
    this.pubsub = createAdvancedRedisPubSub(this.fastify);
    this.fastify.log.info('✅ Redis PubSub initialized');
  }
  
  private async initializeCoreComponents(): Promise<void> {
    const initPromises: Promise<void>[] = [];
    
    // Room Management System
    if (this.config.features.roomManagement) {
      this.roomManager = createAdvancedRoomManager(this.fastify, this.io, this.redis);
      this.fastify.log.info('✅ Advanced Room Manager initialized');
    }
    
    // Presence System
    if (this.config.features.presenceSystem) {
      this.presenceSystem = createProductionPresenceSystem(this.io, this.redis, this.pubsub, this.fastify);
      this.fastify.log.info('✅ Production Presence System initialized');
    }
    
    // Message Queue
    if (this.config.features.messageQueue) {
      this.messageQueue = createAdvancedMessageQueue(this.fastify, this.io, this.redis);
      this.fastify.log.info('✅ Advanced Message Queue initialized');
    }
    
    // Connection Lifecycle Manager
    if (this.config.features.lifecycleManager) {
      this.lifecycleManager = createConnectionLifecycleManager(this.fastify, this.io, this.redis);
      this.fastify.log.info('✅ Connection Lifecycle Manager initialized');
    }
    
    // Notification System
    if (this.config.features.notifications) {
      this.notificationSystem = createRealtimeNotificationSystem(this.fastify, this.io, this.redis);
      this.fastify.log.info('✅ Real-time Notification System initialized');
    }
    
    await Promise.all(initPromises);
  }
  
  private setupComponentIntegration(): void {
    // Cross-component event handling for seamless integration
    
    // Connection events -> Presence system
    if (this.lifecycleManager && this.presenceSystem) {
      this.lifecycleManager.on('connection:established', ({ session }) => {
        // Presence system handles this automatically via socket events
      });
      
      this.lifecycleManager.on('connection:disconnected', ({ session }) => {
        // Presence system handles this automatically
      });
    }
    
    // Room events -> Presence updates
    if (this.roomManager && this.presenceSystem) {
      this.roomManager.on('room:member-added', ({ roomId, member }) => {
        // Update user presence location
        this.io.emit('presence:location-updated', {
          userId: member.userId,
          location: { roomId }
        });
      });
    }
    
    // Message events -> Notifications
    if (this.messageQueue && this.notificationSystem) {
      this.messageQueue.on('message:processed', (message) => {
        // Generate notifications for mentions, replies, etc.
        if (message.payload.mentions) {
          for (const mentionedUserId of message.payload.mentions) {
            this.notificationSystem.sendNotification({
              type: 'mention',
              priority: 'high',
              recipient: { userId: mentionedUserId },
              sender: {
                userId: message.routing.from,
                displayName: 'User', // Get from user service
              },
              content: {
                title: 'You were mentioned',
                body: message.payload.content,
                data: {
                  messageId: message.id,
                  roomId: message.routing.to
                }
              },
              context: {
                messageId: message.id,
                roomId: message.routing.to as string
              },
              scheduling: {},
              tracking: {},
              delivery: {
                requiresAcknowledgment: false,
                maxRetries: 3,
                retryDelay: 1000,
                deliveryTimeout: 30000
              }
            });
          }
        }
      });
    }
    
    // Presence events -> Activity notifications
    if (this.presenceSystem && this.notificationSystem) {
      this.presenceSystem.on('presence:updated', (presence) => {
        // Could trigger activity notifications for friends
      });
    }
    
    this.fastify.log.info('✅ Component integration configured');
  }
  
  private setupLiveFeatures(): void {
    // Live Reactions
    if (this.config.features.liveReactions) {
      this.setupLiveReactions();
    }
    
    // Read Receipts
    if (this.config.features.readReceipts) {
      this.setupReadReceipts();
    }
    
    this.fastify.log.info('✅ Live features configured');
  }
  
  private setupLiveReactions(): void {
    this.io.on('connection', (socket) => {
      // Live reaction events
      socket.on('reaction:add', async (data: {
        messageId: string;
        emoji: string;
        roomId: string;
      }) => {
        try {
          const userId = (socket as any).userId;
          
          // Broadcast reaction immediately for real-time feel
          socket.to(data.roomId).emit('reaction:added', {
            messageId: data.messageId,
            emoji: data.emoji,
            userId,
            timestamp: new Date()
          });
          
          // Queue for persistence via message queue if available
          if (this.messageQueue) {
            await this.messageQueue.enqueueMessage({
              id: `reaction-${Date.now()}`,
              type: 'system',
              priority: 'low',
              payload: {
                action: 'add_reaction',
                messageId: data.messageId,
                emoji: data.emoji,
                userId
              },
              routing: {
                from: userId,
                to: data.roomId,
                targetType: 'room'
              },
              delivery: {
                guaranteeDelivery: true,
                requireAck: false,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 5000
              },
              metadata: {
                createdAt: new Date(),
                status: 'pending',
                attempts: 0,
                serverId: this.config.server.serverId,
                trace: []
              }
            });
          }
          
        } catch (error) {
          socket.emit('reaction:error', {
            action: 'add',
            error: (error as Error).message
          });
        }
      });
      
      socket.on('reaction:remove', async (data: {
        messageId: string;
        emoji: string;
        roomId: string;
      }) => {
        try {
          const userId = (socket as any).userId;
          
          // Broadcast removal immediately
          socket.to(data.roomId).emit('reaction:removed', {
            messageId: data.messageId,
            emoji: data.emoji,
            userId,
            timestamp: new Date()
          });
          
          // Queue for persistence
          if (this.messageQueue) {
            await this.messageQueue.enqueueMessage({
              id: `reaction-remove-${Date.now()}`,
              type: 'system',
              priority: 'low',
              payload: {
                action: 'remove_reaction',
                messageId: data.messageId,
                emoji: data.emoji,
                userId
              },
              routing: {
                from: userId,
                to: data.roomId,
                targetType: 'room'
              },
              delivery: {
                guaranteeDelivery: true,
                requireAck: false,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 5000
              },
              metadata: {
                createdAt: new Date(),
                status: 'pending',
                attempts: 0,
                serverId: this.config.server.serverId,
                trace: []
              }
            });
          }
          
        } catch (error) {
          socket.emit('reaction:error', {
            action: 'remove',
            error: (error as Error).message
          });
        }
      });
    });
  }
  
  private setupReadReceipts(): void {
    this.io.on('connection', (socket) => {
      // Read receipt events
      socket.on('message:read', async (data: {
        messageId: string;
        roomId: string;
        timestamp?: Date;
      }) => {
        try {
          const userId = (socket as any).userId;
          const readAt = data.timestamp || new Date();
          
          // Broadcast read receipt to message sender and room
          socket.to(data.roomId).emit('message:read-receipt', {
            messageId: data.messageId,
            userId,
            readAt,
            roomId: data.roomId
          });
          
          // Store read receipt
          if (this.redis) {
            await this.redis.sadd(
              `message_reads:${data.messageId}`,
              JSON.stringify({ userId, readAt })
            );
            
            // Set expiration for cleanup
            await this.redis.expire(`message_reads:${data.messageId}`, 86400 * 7); // 7 days
          }
          
        } catch (error) {
          socket.emit('read-receipt:error', {
            error: (error as Error).message
          });
        }
      });
      
      // Bulk read receipts for efficiency
      socket.on('messages:read-bulk', async (data: {
        messageIds: string[];
        roomId: string;
        timestamp?: Date;
      }) => {
        try {
          const userId = (socket as any).userId;
          const readAt = data.timestamp || new Date();
          
          // Process in batches to avoid overwhelming Redis
          const batchSize = 10;
          for (let i = 0; i < data.messageIds.length; i += batchSize) {
            const batch = data.messageIds.slice(i, i + batchSize);
            
            const pipeline = this.redis.pipeline();
            
            for (const messageId of batch) {
              pipeline.sadd(
                `message_reads:${messageId}`,
                JSON.stringify({ userId, readAt })
              );
              pipeline.expire(`message_reads:${messageId}`, 86400 * 7);
            }
            
            await pipeline.exec();
          }
          
          // Broadcast bulk read receipt
          socket.to(data.roomId).emit('messages:read-receipt-bulk', {
            messageIds: data.messageIds,
            userId,
            readAt,
            roomId: data.roomId
          });
          
        } catch (error) {
          socket.emit('read-receipt:error', {
            error: (error as Error).message
          });
        }
      });
    });
  }
  
  private setupMonitoring(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.emit('metrics:updated', this.metrics);
      
      // Check health and trigger alerts if needed
      this.checkHealthThresholds();
      
    }, this.config.monitoring.metricsInterval);
    
    this.fastify.log.info('✅ Monitoring system started');
  }
  
  private collectMetrics(): void {
    const now = new Date();
    
    // System metrics
    this.metrics.timestamp = now;
    this.metrics.system.uptime = Date.now() - this.startTime;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.performance.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
    
    // Connection metrics
    if (this.cluster) {
      const clusterMetrics = this.cluster.getMetrics();
      this.metrics.connections = {
        total: clusterMetrics.connections.total,
        active: clusterMetrics.connections.active,
        peak: clusterMetrics.connections.peak,
        byDeviceType: clusterMetrics.connections.byNamespace
      };
      
      this.metrics.performance.avgResponseTime = clusterMetrics.performance.avgResponseTime;
      this.metrics.performance.errorRate = clusterMetrics.performance.errorRate;
    }
    
    // Room metrics
    if (this.roomManager) {
      const roomMetrics = this.roomManager.getMetrics();
      this.metrics.rooms = {
        total: roomMetrics.activeRooms,
        activeMembers: roomMetrics.totalMembers,
        communities: roomMetrics.activeRooms, // Simplified
        directMessages: 0 // Would need actual counting
      };
    }
    
    // Presence metrics
    if (this.presenceSystem) {
      const presenceMetrics = this.presenceSystem.getMetrics();
      this.metrics.presence = {
        onlineUsers: presenceMetrics.onlineUsers,
        typingUsers: presenceMetrics.typingIndicators,
        byStatus: {
          online: presenceMetrics.onlineUsers,
          idle: presenceMetrics.idleUsers,
          dnd: presenceMetrics.dndUsers,
          offline: presenceMetrics.offlineUsers
        }
      };
    }
    
    // Message metrics
    if (this.messageQueue) {
      const queueMetrics = this.messageQueue.getMetrics();
      this.metrics.messages = {
        totalProcessed: queueMetrics.deliveredMessages + queueMetrics.failedMessages,
        queuedMessages: queueMetrics.pendingMessages,
        deliveredMessages: queueMetrics.deliveredMessages,
        failedMessages: queueMetrics.failedMessages,
        averageDeliveryTime: queueMetrics.averageDeliveryTime
      };
    }
    
    // Notification metrics
    if (this.notificationSystem) {
      const notifMetrics = this.notificationSystem.getMetrics();
      this.metrics.notifications = {
        totalSent: notifMetrics.totalSent,
        deliveredCount: notifMetrics.totalDelivered,
        readCount: notifMetrics.totalRead,
        byChannel: notifMetrics.byChannel
      };
    }
    
    // Health assessment
    this.assessOverallHealth();
  }
  
  private assessOverallHealth(): void {
    const components = this.metrics.health.components;
    
    // Assess individual components
    if (this.cluster) {
      const health = this.cluster.isHealthy();
      components.cluster = health ? 'healthy' : 'unhealthy';
    }
    
    if (this.redis) {
      components.redis = this.redis.status === 'ready' ? 'healthy' : 'unhealthy';
    }
    
    if (this.roomManager) {
      const health = this.roomManager.getHealth();
      components.roomManager = health.status === 'healthy' ? 'healthy' : 'degraded';
    }
    
    if (this.presenceSystem) {
      const health = this.presenceSystem.getHealth();
      components.presenceSystem = health.status === 'healthy' ? 'healthy' : 'degraded';
    }
    
    if (this.messageQueue) {
      const health = this.messageQueue.getHealth();
      components.messageQueue = health.status === 'healthy' ? 'healthy' : 'unhealthy';
    }
    
    if (this.notificationSystem) {
      const health = this.notificationSystem.getHealth();
      components.notificationSystem = health.status === 'healthy' ? 'healthy' : 'degraded';
    }
    
    // Assess overall health
    const healthValues = Object.values(components);
    const unhealthyCount = healthValues.filter(h => h === 'unhealthy').length;
    const degradedCount = healthValues.filter(h => h === 'degraded').length;
    
    if (unhealthyCount > 0) {
      this.metrics.health.overall = 'unhealthy';
    } else if (degradedCount > 0) {
      this.metrics.health.overall = 'degraded';
    } else {
      this.metrics.health.overall = 'healthy';
    }
  }
  
  private checkHealthThresholds(): void {
    // Check critical thresholds and trigger alerts
    
    // Memory usage
    if (this.metrics.performance.memoryUsage > 1024) { // 1GB
      this.triggerAlert('high_memory_usage', {
        current: this.metrics.performance.memoryUsage,
        threshold: 1024
      });
    }
    
    // Error rate
    if (this.metrics.performance.errorRate > 5) { // 5%
      this.triggerAlert('high_error_rate', {
        current: this.metrics.performance.errorRate,
        threshold: 5
      });
    }
    
    // Connection capacity
    const connectionRatio = this.metrics.connections.active / this.config.performance.maxConnections;
    if (connectionRatio > 0.8) { // 80% capacity
      this.triggerAlert('high_connection_usage', {
        current: this.metrics.connections.active,
        capacity: this.config.performance.maxConnections,
        ratio: connectionRatio
      });
    }
    
    // Overall health
    if (this.metrics.health.overall === 'unhealthy') {
      this.triggerAlert('system_unhealthy', {
        components: this.metrics.health.components
      });
    }
  }
  
  private triggerAlert(type: string, data: any): void {
    const alert = {
      type,
      severity: this.getAlertSeverity(type),
      timestamp: new Date(),
      serverId: this.config.server.serverId,
      data
    };
    
    this.fastify.log.warn(`🚨 Alert triggered: ${type}`, alert);
    this.emit('alert:triggered', alert);
    
    // Send to external webhook if configured
    if (this.config.monitoring.alertWebhook) {
      this.sendAlertWebhook(alert);
    }
  }
  
  private getAlertSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      high_memory_usage: 'medium',
      high_error_rate: 'high',
      high_connection_usage: 'medium',
      system_unhealthy: 'critical'
    };
    
    return severityMap[type] || 'low';
  }
  
  private async sendAlertWebhook(alert: any): Promise<void> {
    try {
      // This would send to external monitoring service
      // Implementation depends on the webhook service (Slack, PagerDuty, etc.)
      this.fastify.log.info('Alert webhook would be sent:', alert);
    } catch (error) {
      this.fastify.log.error('Failed to send alert webhook:', error);
    }
  }
  
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.fastify.log.info(`🔄 Received ${signal}, starting graceful shutdown...`);
      
      try {
        await this.gracefulShutdown();
        process.exit(0);
      } catch (error) {
        this.fastify.log.error('Graceful shutdown failed:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
  
  // Public API methods
  public getIO(): Server {
    if (!this.isInitialized) {
      throw new Error('Platform not initialized');
    }
    return this.io;
  }
  
  public getMetrics(): PlatformMetrics {
    this.collectMetrics();
    return { ...this.metrics };
  }
  
  public getHealth() {
    return {
      status: this.metrics.health.overall,
      uptime: this.metrics.system.uptime,
      components: this.metrics.health.components,
      connections: this.metrics.connections.active,
      capacity: this.config.performance.maxConnections,
      version: this.metrics.system.version
    };
  }
  
  public async sendNotification(
    type: any,
    recipients: string[],
    content: any,
    options: any = {}
  ): Promise<string[]> {
    if (!this.notificationSystem) {
      throw new Error('Notification system not initialized');
    }
    
    return this.notificationSystem.sendBatchNotification(
      type,
      recipients,
      content,
      options
    );
  }
  
  public async broadcastToRoom(
    roomId: string,
    event: string,
    data: any,
    options: any = {}
  ): Promise<void> {
    if (!this.cluster) {
      this.io.to(roomId).emit(event, data);
    } else {
      await this.cluster.broadcast(event, data, {
        room: roomId,
        ...options
      });
    }
  }
  
  public async gracefulShutdown(): Promise<void> {
    this.fastify.log.info('🔄 Starting graceful platform shutdown...');
    
    // Stop metrics collection
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    // Shutdown components in reverse order
    const shutdownPromises: Promise<void>[] = [];
    
    if (this.notificationSystem) {
      shutdownPromises.push(this.notificationSystem.gracefulShutdown());
    }
    
    if (this.lifecycleManager) {
      shutdownPromises.push(this.lifecycleManager.gracefulShutdown());
    }
    
    if (this.messageQueue) {
      shutdownPromises.push(this.messageQueue.gracefulShutdown());
    }
    
    if (this.presenceSystem) {
      shutdownPromises.push(this.presenceSystem.gracefulShutdown());
    }
    
    if (this.cluster) {
      shutdownPromises.push(this.cluster.gracefulShutdown());
    }
    
    await Promise.allSettled(shutdownPromises);
    
    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }
    
    this.emit('platform:shutdown');
    this.fastify.log.info('✅ Platform shutdown complete');
  }
}

// Factory function for easy setup
export async function createProductionRealtimePlatform(
  fastify: FastifyInstance,
  config: Partial<PlatformConfig> = {}
): Promise<ProductionRealtimePlatform> {
  
  const defaultConfig: PlatformConfig = {
    server: {
      serverId: process.env.SERVER_ID || `cryb-realtime-${Date.now()}`,
      port: parseInt(process.env.PORT || '3002'),
      host: process.env.HOST || '0.0.0.0',
      environment: (process.env.NODE_ENV as any) || 'production'
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    },
    features: {
      clustering: true,
      roomManagement: true,
      presenceSystem: true,
      messageQueue: true,
      lifecycleManager: true,
      notifications: true,
      liveReactions: true,
      readReceipts: true,
      monitoring: true
    },
    performance: {
      maxConnections: parseInt(process.env.MAX_CONNECTIONS || '100000'),
      messageRateLimit: parseInt(process.env.MESSAGE_RATE_LIMIT || '100'),
      batchingEnabled: process.env.BATCHING_ENABLED !== 'false',
      degradationEnabled: process.env.DEGRADATION_ENABLED !== 'false'
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      metricsInterval: parseInt(process.env.METRICS_INTERVAL || '30000'),
      alertWebhook: process.env.ALERT_WEBHOOK_URL
    }
  };
  
  const finalConfig: PlatformConfig = {
    server: { ...defaultConfig.server, ...config.server },
    redis: { ...defaultConfig.redis, ...config.redis },
    features: { ...defaultConfig.features, ...config.features },
    performance: { ...defaultConfig.performance, ...config.performance },
    monitoring: { ...defaultConfig.monitoring, ...config.monitoring }
  };
  
  const platform = new ProductionRealtimePlatform(fastify, finalConfig);
  await platform.initialize();
  
  return platform;
}

// Export types for use by other modules
export * from './production-realtime-cluster';
export * from './advanced-room-management';
export * from './production-presence-system';
export * from './advanced-message-queue';
export * from './connection-lifecycle-manager';
export * from './realtime-notifications';
