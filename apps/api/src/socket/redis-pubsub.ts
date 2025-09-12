import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

// Message types for pub/sub communication
export interface PubSubMessage {
  type: string;
  data: any;
  serverId: string;
  timestamp: Date;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number; // Time to live in seconds
}

// Broadcast message types
export interface PresenceBroadcast {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  serverId?: string;
}

export interface ModerationBroadcast {
  action: 'ban' | 'kick' | 'mute' | 'warn';
  targetUserId: string;
  moderatorId: string;
  serverId: string;
  reason?: string;
  expiresAt?: Date;
}

export interface MessageBroadcast {
  messageId: string;
  channelId: string;
  userId: string;
  content: string;
  serverId?: string;
}

export class RedisPubSub {
  private fastify: FastifyInstance;
  private pubClient: Redis;
  private subClient: Redis;
  private serverId: string;
  private isConnected = false;

  // Channel definitions
  private readonly CHANNELS = {
    PRESENCE: 'cryb:presence',
    MODERATION: 'cryb:moderation',
    MESSAGES: 'cryb:messages',
    NOTIFICATIONS: 'cryb:notifications',
    VOICE: 'cryb:voice',
    TYPING: 'cryb:typing',
    SYSTEM: 'cryb:system',
    ANALYTICS: 'cryb:analytics'
  };

  // Message subscribers
  private subscribers = new Map<string, Set<(message: PubSubMessage) => void>>();

  // Message queue for when Redis is disconnected
  private messageQueue = new Map<string, PubSubMessage[]>();

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.serverId = process.env.SERVER_ID || `server-${randomUUID()}`;

    // Create Redis clients
    const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);

    this.initializeClients();
  }

  private async initializeClients() {
    try {
      // Setup pub client
      this.pubClient.on('connect', () => {
        this.fastify.log.info('📤 Redis Publisher connected');
        this.isConnected = true;
      });

      this.pubClient.on('error', (error) => {
        this.fastify.log.error('Redis Publisher error:', error);
        this.isConnected = false;
      });

      // Setup sub client
      this.subClient.on('connect', () => {
        this.fastify.log.info('📥 Redis Subscriber connected');
      });

      this.subClient.on('error', (error) => {
        this.fastify.log.error('Redis Subscriber error:', error);
      });

      // Subscribe to all channels
      await this.subscribeToChannels();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.fastify.log.info('✅ Redis Pub/Sub initialized successfully');

    } catch (error) {
      this.fastify.log.error('Failed to initialize Redis Pub/Sub:', error);
      throw error;
    }
  }

  private async subscribeToChannels() {
    const channels = Object.values(this.CHANNELS);
    await this.subClient.subscribe(...channels);

    this.subClient.on('message', async (channel: string, message: string) => {
      try {
        const parsedMessage: PubSubMessage = JSON.parse(message);

        // Skip messages from this server
        if (parsedMessage.serverId === this.serverId) {
          return;
        }

        // Check TTL
        if (parsedMessage.ttl) {
          const messageAge = (Date.now() - new Date(parsedMessage.timestamp).getTime()) / 1000;
          if (messageAge > parsedMessage.ttl) {
            this.fastify.log.debug(`Discarding expired message: ${parsedMessage.type}`);
            return;
          }
        }

        // Handle different message types
        await this.handleIncomingMessage(channel, parsedMessage);
        
        // Notify subscribers
        const handlers = this.subscribers.get(channel);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(parsedMessage);
            } catch (error) {
              this.fastify.log.error(`Error in message handler for ${channel}:`, error);
            }
          }
        }

      } catch (error) {
        this.fastify.log.error(`Error parsing pub/sub message from ${channel}:`, error);
      }
    });
  }

  private async handleIncomingMessage(channel: string, message: PubSubMessage) {
    switch (channel) {
      case this.CHANNELS.PRESENCE:
        await this.handlePresenceMessage(message.data as PresenceBroadcast);
        break;
        
      case this.CHANNELS.MODERATION:
        await this.handleModerationMessage(message.data as ModerationBroadcast);
        break;
        
      case this.CHANNELS.MESSAGES:
        await this.handleMessageBroadcast(message.data as MessageBroadcast);
        break;
        
      case this.CHANNELS.NOTIFICATIONS:
        await this.handleNotificationMessage(message.data);
        break;
        
      case this.CHANNELS.VOICE:
        await this.handleVoiceMessage(message.data);
        break;
        
      case this.CHANNELS.TYPING:
        await this.handleTypingMessage(message.data);
        break;
        
      case this.CHANNELS.SYSTEM:
        await this.handleSystemMessage(message.data);
        break;
        
      case this.CHANNELS.ANALYTICS:
        await this.handleAnalyticsMessage(message.data);
        break;
    }
  }

  // Message handlers
  private async handlePresenceMessage(data: PresenceBroadcast) {
    this.fastify.log.debug(`Received presence update for user ${data.userId}: ${data.status}`);
  }

  private async handleModerationMessage(data: ModerationBroadcast) {
    this.fastify.log.info(`Received moderation action: ${data.action} on user ${data.targetUserId}`);
  }

  private async handleMessageBroadcast(data: MessageBroadcast) {
    this.fastify.log.debug(`Received message broadcast for channel ${data.channelId}`);
  }

  private async handleNotificationMessage(data: any) {
    this.fastify.log.debug(`Received notification for user ${data.userId}`);
  }

  private async handleVoiceMessage(data: any) {
    this.fastify.log.debug(`Received voice state update for channel ${data.channelId}`);
  }

  private async handleTypingMessage(data: any) {
    this.fastify.log.debug(`Received typing indicator for channel ${data.channelId}`);
  }

  private async handleSystemMessage(data: any) {
    this.fastify.log.info(`Received system message: ${data.type}`);
  }

  private async handleAnalyticsMessage(data: any) {
    this.fastify.log.debug(`Received analytics data: ${data.event}`);
  }

  // Public broadcast methods
  async broadcastPresenceUpdate(presence: PresenceBroadcast) {
    await this.publish(this.CHANNELS.PRESENCE, {
      type: 'presence_update',
      data: { ...presence, serverId: this.serverId },
      priority: 'normal',
      ttl: 300
    });
  }

  async broadcastModerationAction(moderation: ModerationBroadcast) {
    await this.publish(this.CHANNELS.MODERATION, {
      type: 'moderation_action',
      data: { ...moderation, serverId: this.serverId },
      priority: 'high',
      ttl: 3600
    });
  }

  async broadcastMessage(message: MessageBroadcast) {
    await this.publish(this.CHANNELS.MESSAGES, {
      type: 'message_broadcast',
      data: { ...message, serverId: this.serverId },
      priority: 'normal',
      ttl: 60
    });
  }

  // Core publish method
  private async publish(channel: string, messageData: Omit<PubSubMessage, 'serverId' | 'timestamp'>) {
    if (!this.isConnected) {
      // Queue message for later delivery
      if (!this.messageQueue.has(channel)) {
        this.messageQueue.set(channel, []);
      }
      
      const fullMessage: PubSubMessage = {
        ...messageData,
        serverId: this.serverId,
        timestamp: new Date()
      };
      
      this.messageQueue.get(channel)!.push(fullMessage);
      this.fastify.log.warn(`Queued message for channel ${channel} (Redis not connected)`);
      return;
    }

    try {
      const message: PubSubMessage = {
        ...messageData,
        serverId: this.serverId,
        timestamp: new Date()
      };

      await this.pubClient.publish(channel, JSON.stringify(message));
      this.fastify.log.debug(`Published message to ${channel}: ${message.type}`);
      
    } catch (error) {
      this.fastify.log.error(`Error publishing to ${channel}:`, error);
      throw error;
    }
  }

  // Health monitoring
  private startHealthMonitoring() {
    // Send heartbeat every 30 seconds
    setInterval(async () => {
      if (this.isConnected) {
        await this.publish(this.CHANNELS.SYSTEM, {
          type: 'heartbeat',
          data: { timestamp: new Date(), serverId: this.serverId },
          priority: 'low'
        });
      }
    }, 30000);

    // Process queued messages every 10 seconds
    setInterval(async () => {
      if (this.isConnected && this.messageQueue.size > 0) {
        await this.processQueuedMessages();
      }
    }, 10000);
  }

  private async processQueuedMessages() {
    for (const [channel, messages] of this.messageQueue.entries()) {
      const messagesToProcess = [...messages];
      this.messageQueue.set(channel, []);
      
      for (const message of messagesToProcess) {
        try {
          await this.pubClient.publish(channel, JSON.stringify(message));
          this.fastify.log.info(`Sent queued message to ${channel}`);
        } catch (error) {
          this.fastify.log.error(`Error sending queued message to ${channel}:`, error);
          this.messageQueue.get(channel)!.push(message);
        }
      }
    }
  }

  // Utility methods
  getHealthStatus() {
    return {
      isConnected: this.isConnected,
      serverId: this.serverId,
      subscribedChannels: Object.keys(this.CHANNELS).length,
      activeHandlers: Array.from(this.subscribers.entries()).reduce(
        (total, [, handlers]) => total + handlers.size,
        0
      ),
      queuedMessages: Array.from(this.messageQueue.values()).reduce(
        (total, messages) => total + messages.length,
        0
      )
    };
  }

  async close() {
    this.fastify.log.info('Closing Redis Pub/Sub connections...');
    
    try {
      await Promise.all([
        this.pubClient.quit(),
        this.subClient.quit()
      ]);
      
      this.isConnected = false;
      this.fastify.log.info('Redis Pub/Sub connections closed');
      
    } catch (error) {
      this.fastify.log.error('Error closing Redis connections:', error);
    }
  }
}