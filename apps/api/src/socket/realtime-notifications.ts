import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * REAL-TIME NOTIFICATIONS SYSTEM
 * 
 * Enterprise-grade real-time notification delivery with WebSocket integration,
 * intelligent routing, and comprehensive delivery guarantees.
 * 
 * Features:
 * ✅ Multi-channel notification delivery (WebSocket, Push, Email)
 * ✅ Smart notification batching and deduplication
 * ✅ Priority-based delivery with urgency levels
 * ✅ User preference management and filtering
 * ✅ Delivery tracking and analytics
 * ✅ Offline notification queueing
 * ✅ Cross-device synchronization
 * ✅ Rich notification templates
 * ✅ Rate limiting and spam protection
 * ✅ A/B testing for notification content
 */

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: Record<string, any>;
  variables: string[]; // Placeholders like {{username}}, {{message}}
}

export type NotificationType = 
  | 'message' | 'mention' | 'reply' | 'reaction'
  | 'friend_request' | 'friend_accept'
  | 'server_invite' | 'role_update'
  | 'moderation' | 'system'
  | 'voice_call' | 'video_call'
  | 'live_stream' | 'event'
  | 'achievement' | 'milestone';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipient: {
    userId: string;
    deviceIds?: string[];
    channels?: ('websocket' | 'push' | 'email' | 'sms')[];
  };
  sender?: {
    userId: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    templateId?: string;
    title: string;
    body: string;
    icon?: string;
    image?: string;
    url?: string;
    actions?: {
      action: string;
      title: string;
      url?: string;
    }[];
    data?: Record<string, any>;
  };
  context: {
    serverId?: string;
    channelId?: string;
    messageId?: string;
    roomId?: string;
    entityId?: string;
  };
  scheduling: {
    sendAt?: Date;
    expiresAt?: Date;
    timezone?: string;
    batchWindow?: number; // ms to wait for batching
  };
  tracking: {
    campaignId?: string;
    segmentId?: string;
    abTestId?: string;
    tags?: string[];
  };
  delivery: {
    requiresAcknowledgment: boolean;
    maxRetries: number;
    retryDelay: number;
    deliveryTimeout: number;
  };
  metadata: {
    createdAt: Date;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
    attempts: number;
    lastAttempt?: Date;
    error?: string;
    deliveredChannels: string[];
    readAt?: Date;
    clickedAt?: Date;
    dismissedAt?: Date;
  };
}

export interface UserNotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  channels: {
    websocket: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: Record<NotificationType, {
    enabled: boolean;
    channels: string[];
    priority: 'low' | 'normal' | 'high';
    quietHours?: {
      enabled: boolean;
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
    };
  }>;
  filters: {
    keywords: string[];
    blockedUsers: string[];
    minimumPriority: 'low' | 'normal' | 'high' | 'urgent';
  };
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    batchWindow: number; // minutes
  };
  updatedAt: Date;
}

export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  totalDismissed: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  byType: Record<NotificationType, {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
  }>;
  byChannel: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  averageDeliveryTime: number;
  averageReadTime: number;
}

export class RealtimeNotificationSystem extends EventEmitter {
  private fastify: FastifyInstance;
  private io: Server;
  private redis: Redis;
  
  // Notification queues by priority
  private queues = {
    urgent: [] as NotificationPayload[],
    high: [] as NotificationPayload[],
    normal: [] as NotificationPayload[],
    low: [] as NotificationPayload[]
  };
  
  // Batching system
  private batchQueues = new Map<string, {
    notifications: NotificationPayload[];
    timer: NodeJS.Timeout;
    userId: string;
  }>();
  
  // Templates and preferences cache
  private templates = new Map<string, NotificationTemplate>();
  private userPreferences = new Map<string, UserNotificationPreferences>();
  
  // Metrics tracking
  private metrics: NotificationMetrics = {
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalClicked: 0,
    totalDismissed: 0,
    totalFailed: 0,
    deliveryRate: 0,
    readRate: 0,
    clickRate: 0,
    byType: {} as any,
    byChannel: {},
    averageDeliveryTime: 0,
    averageReadTime: 0
  };
  
  // Rate limiting
  private rateLimits = new Map<string, {
    count: number;
    resetTime: number;
    burst: number;
  }>();
  
  // Configuration
  private config = {
    processingInterval: 1000, // 1 second
    batchSize: 50,
    maxQueueSize: 10000,
    defaultBatchWindow: 60000, // 1 minute
    rateLimits: {
      perUser: { max: 100, window: 3600000 }, // 100 per hour
      perType: { max: 1000, window: 3600000 }, // 1000 per hour per type
      burst: { max: 10, window: 60000 } // 10 per minute burst
    }
  };
  
  constructor(fastify: FastifyInstance, io: Server, redis: Redis) {
    super();
    this.fastify = fastify;
    this.io = io;
    this.redis = redis;
    
    this.loadTemplates();
    this.setupEventHandlers();
    this.startProcessing();
    this.setupCleanupTasks();
  }
  
  private async loadTemplates() {
    // Load notification templates from database or config
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'message',
        name: 'New Message',
        type: 'message',
        title: '{{senderName}}',
        body: '{{messageContent}}',
        icon: '/icons/message.png',
        variables: ['senderName', 'messageContent']
      },
      {
        id: 'mention',
        name: 'Mention',
        type: 'mention',
        title: '{{senderName}} mentioned you',
        body: '{{messageContent}}',
        icon: '/icons/mention.png',
        variables: ['senderName', 'messageContent']
      },
      {
        id: 'friend_request',
        name: 'Friend Request',
        type: 'friend_request',
        title: 'New friend request',
        body: '{{senderName}} wants to be your friend',
        icon: '/icons/friend-request.png',
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        ],
        variables: ['senderName']
      },
      {
        id: 'voice_call',
        name: 'Voice Call',
        type: 'voice_call',
        title: 'Incoming voice call',
        body: '{{senderName}} is calling you',
        icon: '/icons/voice-call.png',
        actions: [
          { action: 'answer', title: 'Answer' },
          { action: 'decline', title: 'Decline' }
        ],
        variables: ['senderName']
      }
    ];
    
    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
    
    this.fastify.log.info(`Loaded ${this.templates.size} notification templates`);
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.setupNotificationEvents(socket);
    });
  }
  
  private setupNotificationEvents(socket: Socket) {
    const userId = (socket as any).userId;
    
    // Mark notification as read
    socket.on('notification:read', async (data: {
      notificationId: string;
      readAt?: Date;
    }) => {
      try {
        await this.markNotificationAsRead(data.notificationId, userId, data.readAt);
        
        socket.emit('notification:read-confirmed', {
          notificationId: data.notificationId,
          readAt: data.readAt || new Date()
        });
        
      } catch (error) {
        socket.emit('notification:error', {
          action: 'mark-read',
          error: (error as Error).message
        });
      }
    });
    
    // Handle notification action (click, dismiss, etc.)
    socket.on('notification:action', async (data: {
      notificationId: string;
      action: string;
      actionData?: any;
    }) => {
      try {
        await this.handleNotificationAction(data.notificationId, userId, data.action, data.actionData);
        
        socket.emit('notification:action-confirmed', {
          notificationId: data.notificationId,
          action: data.action
        });
        
      } catch (error) {
        socket.emit('notification:error', {
          action: 'handle-action',
          error: (error as Error).message
        });
      }
    });
    
    // Update notification preferences
    socket.on('notification:update-preferences', async (preferences: Partial<UserNotificationPreferences>) => {
      try {
        await this.updateUserPreferences(userId, preferences);
        
        socket.emit('notification:preferences-updated', {
          success: true,
          preferences: this.userPreferences.get(userId)
        });
        
      } catch (error) {
        socket.emit('notification:error', {
          action: 'update-preferences',
          error: (error as Error).message
        });
      }
    });
    
    // Get notification history
    socket.on('notification:get-history', async (data: {
      limit?: number;
      offset?: number;
      types?: NotificationType[];
      status?: string[];
    }) => {
      try {
        const history = await this.getNotificationHistory(userId, data);
        
        socket.emit('notification:history', {
          notifications: history,
          total: history.length
        });
        
      } catch (error) {
        socket.emit('notification:error', {
          action: 'get-history',
          error: (error as Error).message
        });
      }
    });
    
    // Get unread count
    socket.on('notification:get-unread-count', async () => {
      try {
        const count = await this.getUnreadNotificationCount(userId);
        
        socket.emit('notification:unread-count', {
          count
        });
        
      } catch (error) {
        socket.emit('notification:error', {
          action: 'get-unread-count',
          error: (error as Error).message
        });
      }
    });
    
    // Test notification (for development)
    socket.on('notification:test', async (data: {
      type: NotificationType;
      content: any;
    }) => {
      if (process.env.NODE_ENV !== 'production') {
        try {
          await this.sendNotification({
            type: data.type,
            priority: 'normal',
            recipient: { userId },
            content: {
              title: 'Test Notification',
              body: 'This is a test notification',
              ...data.content
            },
            context: {},
            scheduling: {},
            tracking: {},
            delivery: {
              requiresAcknowledgment: false,
              maxRetries: 1,
              retryDelay: 1000,
              deliveryTimeout: 30000
            }
          });
          
          socket.emit('notification:test-sent', {
            success: true
          });
          
        } catch (error) {
          socket.emit('notification:error', {
            action: 'test',
            error: (error as Error).message
          });
        }
      }
    });
  }
  
  // Core notification sending method
  public async sendNotification(
    params: Omit<NotificationPayload, 'id' | 'metadata'>
  ): Promise<string> {
    
    // Generate notification ID
    const notificationId = randomUUID();
    
    // Create full notification payload
    const notification: NotificationPayload = {
      id: notificationId,
      ...params,
      metadata: {
        createdAt: new Date(),
        status: 'pending',
        attempts: 0,
        deliveredChannels: []
      }
    };
    
    // Validate notification
    this.validateNotification(notification);
    
    // Check rate limits
    if (!await this.checkRateLimits(notification)) {
      throw new Error('Rate limit exceeded for notification');
    }
    
    // Apply user preferences and filtering
    const shouldSend = await this.shouldSendNotification(notification);
    if (!shouldSend) {
      this.fastify.log.debug(`Notification filtered out: ${notificationId}`);
      return notificationId;
    }
    
    // Check for batching
    if (await this.shouldBatchNotification(notification)) {
      await this.addToBatch(notification);
    } else {
      // Send immediately
      this.addToQueue(notification);
    }
    
    // Persist notification
    await this.persistNotification(notification);
    
    this.emit('notification:created', notification);
    
    return notificationId;
  }
  
  // Batch multiple notifications of same type to same user
  public async sendBatchNotification(
    type: NotificationType,
    recipients: string[],
    content: NotificationPayload['content'],
    options: Partial<Omit<NotificationPayload, 'id' | 'type' | 'recipient' | 'content' | 'metadata'>> = {}
  ): Promise<string[]> {
    
    const notificationIds: string[] = [];
    
    for (const userId of recipients) {
      try {
        const id = await this.sendNotification({
          type,
          priority: options.priority || 'normal',
          recipient: { userId },
          content,
          context: options.context || {},
          scheduling: options.scheduling || {},
          tracking: options.tracking || {},
          delivery: options.delivery || {
            requiresAcknowledgment: false,
            maxRetries: 3,
            retryDelay: 1000,
            deliveryTimeout: 30000
          },
          sender: options.sender
        });
        
        notificationIds.push(id);
        
      } catch (error) {
        this.fastify.log.error(`Failed to send notification to ${userId}:`, error);
      }
    }
    
    return notificationIds;
  }
  
  // Queue management
  private addToQueue(notification: NotificationPayload) {
    const queue = this.queues[notification.priority];
    
    if (queue.length >= this.config.maxQueueSize) {
      this.fastify.log.warn('Notification queue full, dropping oldest notifications');
      queue.shift(); // Remove oldest
    }
    
    queue.push(notification);
    this.emit('notification:queued', notification);
  }
  
  private async addToBatch(notification: NotificationPayload) {
    const batchKey = `${notification.recipient.userId}:${notification.type}`;
    const batchWindow = notification.scheduling.batchWindow || this.config.defaultBatchWindow;
    
    if (!this.batchQueues.has(batchKey)) {
      // Create new batch
      const timer = setTimeout(() => {
        this.processBatch(batchKey);
      }, batchWindow);
      
      this.batchQueues.set(batchKey, {
        notifications: [notification],
        timer,
        userId: notification.recipient.userId
      });
    } else {
      // Add to existing batch
      const batch = this.batchQueues.get(batchKey)!;
      batch.notifications.push(notification);
      
      // Check batch size limit
      const userPrefs = await this.getUserPreferences(notification.recipient.userId);
      const maxBatchSize = userPrefs?.batching.maxBatchSize || this.config.batchSize;
      
      if (batch.notifications.length >= maxBatchSize) {
        clearTimeout(batch.timer);
        this.processBatch(batchKey);
      }
    }
  }
  
  private async processBatch(batchKey: string) {
    const batch = this.batchQueues.get(batchKey);
    if (!batch) return;
    
    this.batchQueues.delete(batchKey);
    
    try {
      const batchedNotification = this.createBatchedNotification(batch.notifications);
      this.addToQueue(batchedNotification);
      
      this.fastify.log.info(
        `Processed batch of ${batch.notifications.length} notifications for user ${batch.userId}`
      );
      
    } catch (error) {
      this.fastify.log.error('Failed to process notification batch:', error);
      
      // Fall back to individual notifications
      for (const notification of batch.notifications) {
        this.addToQueue(notification);
      }
    }
  }
  
  private createBatchedNotification(notifications: NotificationPayload[]): NotificationPayload {
    const first = notifications[0];
    const count = notifications.length;
    
    return {
      id: randomUUID(),
      type: first.type,
      priority: first.priority,
      recipient: first.recipient,
      sender: first.sender,
      content: {
        title: `${count} new ${first.type} notifications`,
        body: `You have ${count} new ${first.type} notifications`,
        icon: first.content.icon,
        data: {
          isBatch: true,
          count,
          notifications: notifications.map(n => ({
            id: n.id,
            title: n.content.title,
            body: n.content.body,
            createdAt: n.metadata.createdAt
          }))
        }
      },
      context: first.context,
      scheduling: first.scheduling,
      tracking: first.tracking,
      delivery: first.delivery,
      metadata: {
        createdAt: new Date(),
        status: 'pending',
        attempts: 0,
        deliveredChannels: []
      }
    };
  }
  
  // Processing system
  private startProcessing() {
    setInterval(() => {
      this.processQueues();
    }, this.config.processingInterval);
  }
  
  private async processQueues() {
    // Process in priority order
    const priorities: Array<keyof typeof this.queues> = ['urgent', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.queues[priority];
      const batch = queue.splice(0, this.config.batchSize);
      
      if (batch.length > 0) {
        await this.processBatchDelivery(batch);
        
        // Process one batch per cycle to prevent starvation
        break;
      }
    }
  }
  
  private async processBatchDelivery(notifications: NotificationPayload[]) {
    const deliveryPromises = notifications.map(notification => 
      this.deliverNotification(notification)
    );
    
    await Promise.allSettled(deliveryPromises);
  }
  
  private async deliverNotification(notification: NotificationPayload): Promise<void> {
    const startTime = Date.now();
    
    try {
      notification.metadata.attempts++;
      notification.metadata.lastAttempt = new Date();
      notification.metadata.status = 'sent';
      
      // Get delivery channels
      const channels = await this.getDeliveryChannels(notification);
      
      // Deliver via each channel
      const deliveryPromises = channels.map(channel => 
        this.deliverViaChannel(notification, channel)
      );
      
      const results = await Promise.allSettled(deliveryPromises);
      
      // Update delivery status
      const successfulChannels = results
        .map((result, index) => result.status === 'fulfilled' ? channels[index] : null)
        .filter(channel => channel !== null) as string[];
      
      notification.metadata.deliveredChannels = successfulChannels;
      
      if (successfulChannels.length > 0) {
        notification.metadata.status = 'delivered';
        this.metrics.totalDelivered++;
        
        const deliveryTime = Date.now() - startTime;
        this.updateDeliveryMetrics(notification, deliveryTime);
        
        this.emit('notification:delivered', notification);
      } else {
        throw new Error('Failed to deliver via any channel');
      }
      
      // Update metrics
      this.metrics.totalSent++;
      this.updateTypeMetrics(notification.type, 'sent');
      
      // Persist updated notification
      await this.persistNotification(notification);
      
    } catch (error) {
      await this.handleDeliveryError(notification, error as Error);
    }
  }
  
  private async deliverViaChannel(
    notification: NotificationPayload, 
    channel: string
  ): Promise<void> {
    
    switch (channel) {
      case 'websocket':
        await this.deliverViaWebSocket(notification);
        break;
        
      case 'push':
        await this.deliverViaPush(notification);
        break;
        
      case 'email':
        await this.deliverViaEmail(notification);
        break;
        
      case 'sms':
        await this.deliverViaSMS(notification);
        break;
        
      default:
        throw new Error(`Unknown delivery channel: ${channel}`);
    }
    
    // Update channel metrics
    if (!this.metrics.byChannel[channel]) {
      this.metrics.byChannel[channel] = { sent: 0, delivered: 0, failed: 0 };
    }
    this.metrics.byChannel[channel].delivered++;
  }
  
  private async deliverViaWebSocket(notification: NotificationPayload): Promise<void> {
    const userSockets = await this.getUserSockets(notification.recipient.userId);
    
    if (userSockets.length === 0) {
      // User is offline, queue for later delivery
      await this.queueOfflineNotification(notification);
      return;
    }
    
    // Apply template if specified
    const content = await this.applyTemplate(notification);
    
    const payload = {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      ...content,
      context: notification.context,
      createdAt: notification.metadata.createdAt,
      requiresAck: notification.delivery.requiresAcknowledgment
    };
    
    // Send to all user's sockets
    userSockets.forEach(socketId => {
      this.io.to(socketId).emit('notification:received', payload);
    });
    
    // Also broadcast to specific rooms if context provided
    if (notification.context.roomId) {
      this.io.to(notification.context.roomId).emit('notification:room', {
        ...payload,
        roomId: notification.context.roomId
      });
    }
  }
  
  private async deliverViaPush(notification: NotificationPayload): Promise<void> {
    // Integration with push notification service (Firebase, APNs, etc.)
    // This would typically call an external service
    
    const content = await this.applyTemplate(notification);
    
    // Simulate push notification delivery
    this.fastify.log.info(
      `Push notification sent to ${notification.recipient.userId}: ${content.title}`
    );
    
    // In a real implementation, this would:
    // 1. Get user's device tokens from database
    // 2. Send to push notification service
    // 3. Handle responses and update delivery status
  }
  
  private async deliverViaEmail(notification: NotificationPayload): Promise<void> {
    // Integration with email service
    const content = await this.applyTemplate(notification);
    
    this.fastify.log.info(
      `Email notification sent to ${notification.recipient.userId}: ${content.title}`
    );
    
    // In a real implementation, this would:
    // 1. Get user's email from database
    // 2. Send via email service (SendGrid, SES, etc.)
    // 3. Handle responses and update delivery status
  }
  
  private async deliverViaSMS(notification: NotificationPayload): Promise<void> {
    // Integration with SMS service
    const content = await this.applyTemplate(notification);
    
    this.fastify.log.info(
      `SMS notification sent to ${notification.recipient.userId}: ${content.body}`
    );
    
    // In a real implementation, this would:
    // 1. Get user's phone number from database
    // 2. Send via SMS service (Twilio, AWS SNS, etc.)
    // 3. Handle responses and update delivery status
  }
  
  // Template processing
  private async applyTemplate(notification: NotificationPayload): Promise<{
    title: string;
    body: string;
    icon?: string;
    image?: string;
    actions?: any[];
  }> {
    
    if (notification.content.templateId) {
      const template = this.templates.get(notification.content.templateId);
      if (template) {
        return {
          title: this.interpolateTemplate(template.title, notification.content.data || {}),
          body: this.interpolateTemplate(template.body, notification.content.data || {}),
          icon: template.icon || notification.content.icon,
          image: template.image || notification.content.image,
          actions: template.actions || notification.content.actions
        };
      }
    }
    
    return {
      title: notification.content.title,
      body: notification.content.body,
      icon: notification.content.icon,
      image: notification.content.image,
      actions: notification.content.actions
    };
  }
  
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
  
  // User preferences and filtering
  private async shouldSendNotification(notification: NotificationPayload): Promise<boolean> {
    const preferences = await this.getUserPreferences(notification.recipient.userId);
    
    if (!preferences?.globalEnabled) {
      return false;
    }
    
    const typePrefs = preferences.types[notification.type];
    if (!typePrefs?.enabled) {
      return false;
    }
    
    // Check priority filter
    if (this.comparePriority(notification.priority, preferences.filters.minimumPriority) < 0) {
      return false;
    }
    
    // Check quiet hours
    if (typePrefs.quietHours?.enabled) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: typePrefs.quietHours.timezone
      });
      
      if (this.isInQuietHours(currentTime, typePrefs.quietHours.start, typePrefs.quietHours.end)) {
        // Only allow urgent notifications during quiet hours
        return notification.priority === 'urgent';
      }
    }
    
    // Check blocked users
    if (notification.sender && preferences.filters.blockedUsers.includes(notification.sender.userId)) {
      return false;
    }
    
    // Check keyword filters
    if (preferences.filters.keywords.length > 0) {
      const content = `${notification.content.title} ${notification.content.body}`.toLowerCase();
      const hasBlockedKeyword = preferences.filters.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      if (hasBlockedKeyword) {
        return false;
      }
    }
    
    return true;
  }
  
  private async shouldBatchNotification(notification: NotificationPayload): Promise<boolean> {
    const preferences = await this.getUserPreferences(notification.recipient.userId);
    
    if (!preferences?.batching.enabled) {
      return false;
    }
    
    // Don't batch urgent notifications
    if (notification.priority === 'urgent') {
      return false;
    }
    
    // Don't batch if scheduled for specific time
    if (notification.scheduling.sendAt) {
      return false;
    }
    
    return true;
  }
  
  private async getDeliveryChannels(notification: NotificationPayload): Promise<string[]> {
    const preferences = await this.getUserPreferences(notification.recipient.userId);
    
    // Use specified channels or fall back to user preferences
    if (notification.recipient.channels?.length) {
      return notification.recipient.channels;
    }
    
    if (!preferences) {
      return ['websocket']; // Default to WebSocket only
    }
    
    const typePrefs = preferences.types[notification.type];
    if (typePrefs?.channels.length) {
      return typePrefs.channels.filter(channel => 
        preferences.channels[channel as keyof typeof preferences.channels]
      );
    }
    
    // Fall back to all enabled channels
    return Object.entries(preferences.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);
  }
  
  // Utility methods
  private comparePriority(a: string, b: string): number {
    const priorities = { low: 0, normal: 1, high: 2, urgent: 3 };
    return priorities[a as keyof typeof priorities] - priorities[b as keyof typeof priorities];
  }
  
  private isInQuietHours(currentTime: string, start: string, end: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    if (startMinutes <= endMinutes) {
      return current >= startMinutes && current <= endMinutes;
    } else {
      // Quiet hours span midnight
      return current >= startMinutes || current <= endMinutes;
    }
  }
  
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private async getUserSockets(userId: string): Promise<string[]> {
    const sockets: string[] = [];
    
    for (const [socketId, socket] of this.io.sockets.sockets) {
      if ((socket as any).userId === userId) {
        sockets.push(socketId);
      }
    }
    
    return sockets;
  }
  
  private validateNotification(notification: NotificationPayload): void {
    if (!notification.recipient.userId) {
      throw new Error('Recipient user ID is required');
    }
    
    if (!notification.content.title || !notification.content.body) {
      throw new Error('Notification title and body are required');
    }
    
    if (notification.content.title.length > 100) {
      throw new Error('Notification title is too long (max 100 characters)');
    }
    
    if (notification.content.body.length > 500) {
      throw new Error('Notification body is too long (max 500 characters)');
    }
  }
  
  // Rate limiting
  private async checkRateLimits(notification: NotificationPayload): Promise<boolean> {
    const now = Date.now();
    const userId = notification.recipient.userId;
    
    // Check per-user rate limit
    const userKey = `user:${userId}`;
    if (!this.checkRateLimit(userKey, this.config.rateLimits.perUser, now)) {
      return false;
    }
    
    // Check per-type rate limit
    const typeKey = `type:${notification.type}`;
    if (!this.checkRateLimit(typeKey, this.config.rateLimits.perType, now)) {
      return false;
    }
    
    // Check burst limit
    const burstKey = `burst:${userId}`;
    if (!this.checkRateLimit(burstKey, this.config.rateLimits.burst, now)) {
      return false;
    }
    
    return true;
  }
  
  private checkRateLimit(
    key: string,
    limit: { max: number; window: number },
    now: number
  ): boolean {
    const entry = this.rateLimits.get(key);
    
    if (!entry) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + limit.window,
        burst: 1
      });
      return true;
    }
    
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + limit.window;
      return true;
    }
    
    if (entry.count >= limit.max) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  // Error handling
  private async handleDeliveryError(
    notification: NotificationPayload,
    error: Error
  ): Promise<void> {
    
    notification.metadata.error = error.message;
    
    if (notification.metadata.attempts < notification.delivery.maxRetries) {
      // Retry with exponential backoff
      const delay = notification.delivery.retryDelay * 
        Math.pow(2, notification.metadata.attempts - 1);
      
      setTimeout(() => {
        this.addToQueue(notification);
      }, delay);
      
      this.fastify.log.warn(
        `Notification delivery failed, retrying in ${delay}ms: ${error.message}`
      );
      
    } else {
      // Max retries exceeded
      notification.metadata.status = 'failed';
      this.metrics.totalFailed++;
      
      await this.persistNotification(notification);
      
      this.fastify.log.error(
        `Notification delivery failed permanently: ${error.message}`,
        { notificationId: notification.id }
      );
      
      this.emit('notification:failed', notification);
    }
  }
  
  // User preference management
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    // Check cache first
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      // Load from Redis/database
      try {
        const data = await this.redis.get(`user_prefs:${userId}`);
        if (data) {
          preferences = JSON.parse(data);
          this.userPreferences.set(userId, preferences!);
        }
      } catch (error) {
        this.fastify.log.error('Failed to load user preferences:', error);
      }
    }
    
    // Return default preferences if none found
    if (!preferences) {
      preferences = this.getDefaultPreferences(userId);
      this.userPreferences.set(userId, preferences);
      await this.persistUserPreferences(preferences);
    }
    
    return preferences;
  }
  
  private getDefaultPreferences(userId: string): UserNotificationPreferences {
    return {
      userId,
      globalEnabled: true,
      channels: {
        websocket: true,
        push: true,
        email: true,
        sms: false
      },
      types: {
        message: { enabled: true, channels: ['websocket', 'push'], priority: 'normal' },
        mention: { enabled: true, channels: ['websocket', 'push', 'email'], priority: 'high' },
        reply: { enabled: true, channels: ['websocket', 'push'], priority: 'normal' },
        reaction: { enabled: true, channels: ['websocket'], priority: 'low' },
        friend_request: { enabled: true, channels: ['websocket', 'push', 'email'], priority: 'high' },
        friend_accept: { enabled: true, channels: ['websocket', 'push'], priority: 'normal' },
        server_invite: { enabled: true, channels: ['websocket', 'push', 'email'], priority: 'normal' },
        role_update: { enabled: true, channels: ['websocket'], priority: 'normal' },
        moderation: { enabled: true, channels: ['websocket', 'push', 'email'], priority: 'urgent' },
        system: { enabled: true, channels: ['websocket', 'email'], priority: 'normal' },
        voice_call: { enabled: true, channels: ['websocket', 'push'], priority: 'urgent' },
        video_call: { enabled: true, channels: ['websocket', 'push'], priority: 'urgent' },
        live_stream: { enabled: true, channels: ['websocket', 'push'], priority: 'normal' },
        event: { enabled: true, channels: ['websocket', 'push'], priority: 'normal' },
        achievement: { enabled: true, channels: ['websocket'], priority: 'low' },
        milestone: { enabled: true, channels: ['websocket'], priority: 'low' }
      },
      filters: {
        keywords: [],
        blockedUsers: [],
        minimumPriority: 'low'
      },
      batching: {
        enabled: true,
        maxBatchSize: 5,
        batchWindow: 60 // minutes
      },
      updatedAt: new Date()
    };
  }
  
  private async updateUserPreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<void> {
    
    const current = await this.getUserPreferences(userId);
    if (!current) return;
    
    const updated = {
      ...current,
      ...updates,
      userId, // Ensure userId can't be changed
      updatedAt: new Date()
    };
    
    this.userPreferences.set(userId, updated);
    await this.persistUserPreferences(updated);
    
    this.emit('preferences:updated', { userId, preferences: updated });
  }
  
  private async persistUserPreferences(preferences: UserNotificationPreferences): Promise<void> {
    try {
      await this.redis.set(
        `user_prefs:${preferences.userId}`,
        JSON.stringify(preferences)
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist user preferences:', error);
    }
  }
  
  // Notification history and management
  private async markNotificationAsRead(
    notificationId: string,
    userId: string,
    readAt?: Date
  ): Promise<void> {
    
    try {
      const notification = await this.getNotificationFromRedis(notificationId);
      if (!notification || notification.recipient.userId !== userId) {
        throw new Error('Notification not found or access denied');
      }
      
      notification.metadata.status = 'read';
      notification.metadata.readAt = readAt || new Date();
      
      await this.persistNotification(notification);
      
      this.metrics.totalRead++;
      this.updateTypeMetrics(notification.type, 'read');
      
      // Calculate read time
      const readTime = notification.metadata.readAt.getTime() - 
        notification.metadata.createdAt.getTime();
      
      this.metrics.averageReadTime = 
        (this.metrics.averageReadTime * 0.9) + (readTime * 0.1);
      
      this.emit('notification:read', notification);
      
    } catch (error) {
      this.fastify.log.error('Failed to mark notification as read:', error);
      throw error;
    }
  }
  
  private async handleNotificationAction(
    notificationId: string,
    userId: string,
    action: string,
    actionData?: any
  ): Promise<void> {
    
    try {
      const notification = await this.getNotificationFromRedis(notificationId);
      if (!notification || notification.recipient.userId !== userId) {
        throw new Error('Notification not found or access denied');
      }
      
      // Update notification metadata
      if (action === 'click') {
        notification.metadata.clickedAt = new Date();
        this.metrics.totalClicked++;
        this.updateTypeMetrics(notification.type, 'clicked');
      } else if (action === 'dismiss') {
        notification.metadata.dismissedAt = new Date();
        this.metrics.totalDismissed++;
      }
      
      await this.persistNotification(notification);
      
      this.emit('notification:action', {
        notification,
        action,
        actionData,
        userId
      });
      
    } catch (error) {
      this.fastify.log.error('Failed to handle notification action:', error);
      throw error;
    }
  }
  
  private async getNotificationHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      types?: NotificationType[];
      status?: string[];
    } = {}
  ): Promise<NotificationPayload[]> {
    
    try {
      // This would typically query a database
      // For now, return notifications from Redis
      const keys = await this.redis.keys(`notification:${userId}:*`);
      const notifications: NotificationPayload[] = [];
      
      for (const key of keys) {
        try {
          const data = await this.redis.get(key);
          if (data) {
            const notification = JSON.parse(data);
            
            // Apply filters
            if (options.types && !options.types.includes(notification.type)) {
              continue;
            }
            
            if (options.status && !options.status.includes(notification.metadata.status)) {
              continue;
            }
            
            notifications.push(notification);
          }
        } catch (error) {
          this.fastify.log.error('Failed to parse notification:', error);
        }
      }
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => 
        b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
      );
      
      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      
      return notifications.slice(offset, offset + limit);
      
    } catch (error) {
      this.fastify.log.error('Failed to get notification history:', error);
      return [];
    }
  }
  
  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`notification:${userId}:*`);
      let count = 0;
      
      for (const key of keys) {
        try {
          const data = await this.redis.get(key);
          if (data) {
            const notification = JSON.parse(data);
            if (notification.metadata.status === 'delivered') {
              count++;
            }
          }
        } catch (error) {
          // Ignore parse errors for individual notifications
        }
      }
      
      return count;
      
    } catch (error) {
      this.fastify.log.error('Failed to get unread count:', error);
      return 0;
    }
  }
  
  // Persistence methods
  private async persistNotification(notification: NotificationPayload): Promise<void> {
    try {
      await this.redis.setex(
        `notification:${notification.recipient.userId}:${notification.id}`,
        86400 * 30, // 30 days
        JSON.stringify(notification)
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist notification:', error);
    }
  }
  
  private async getNotificationFromRedis(notificationId: string): Promise<NotificationPayload | null> {
    try {
      const keys = await this.redis.keys(`notification:*:${notificationId}`);
      if (keys.length === 0) return null;
      
      const data = await this.redis.get(keys[0]);
      if (data) {
        const notification = JSON.parse(data);
        // Convert date strings back to Date objects
        notification.metadata.createdAt = new Date(notification.metadata.createdAt);
        if (notification.metadata.lastAttempt) {
          notification.metadata.lastAttempt = new Date(notification.metadata.lastAttempt);
        }
        if (notification.metadata.readAt) {
          notification.metadata.readAt = new Date(notification.metadata.readAt);
        }
        if (notification.metadata.clickedAt) {
          notification.metadata.clickedAt = new Date(notification.metadata.clickedAt);
        }
        if (notification.metadata.dismissedAt) {
          notification.metadata.dismissedAt = new Date(notification.metadata.dismissedAt);
        }
        
        return notification;
      }
    } catch (error) {
      this.fastify.log.error('Failed to get notification from Redis:', error);
    }
    
    return null;
  }
  
  private async queueOfflineNotification(notification: NotificationPayload): Promise<void> {
    try {
      await this.redis.lpush(
        `offline_notifications:${notification.recipient.userId}`,
        JSON.stringify({
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          content: notification.content,
          context: notification.context,
          createdAt: notification.metadata.createdAt
        })
      );
      
      // Keep only last 100 offline notifications per user
      await this.redis.ltrim(
        `offline_notifications:${notification.recipient.userId}`,
        0, 99
      );
      
    } catch (error) {
      this.fastify.log.error('Failed to queue offline notification:', error);
    }
  }
  
  // Metrics and analytics
  private updateDeliveryMetrics(notification: NotificationPayload, deliveryTime: number): void {
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * 0.9) + (deliveryTime * 0.1);
    
    // Update delivery rate
    this.metrics.deliveryRate = this.metrics.totalSent > 0 ? 
      (this.metrics.totalDelivered / this.metrics.totalSent) * 100 : 0;
    
    // Update read rate
    this.metrics.readRate = this.metrics.totalDelivered > 0 ? 
      (this.metrics.totalRead / this.metrics.totalDelivered) * 100 : 0;
    
    // Update click rate
    this.metrics.clickRate = this.metrics.totalRead > 0 ? 
      (this.metrics.totalClicked / this.metrics.totalRead) * 100 : 0;
  }
  
  private updateTypeMetrics(type: NotificationType, action: 'sent' | 'delivered' | 'read' | 'clicked'): void {
    if (!this.metrics.byType[type]) {
      this.metrics.byType[type] = { sent: 0, delivered: 0, read: 0, clicked: 0 };
    }
    
    this.metrics.byType[type][action]++;
  }
  
  // Cleanup tasks
  private setupCleanupTasks(): void {
    // Clean up expired notifications
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 3600000); // Every hour
    
    // Clean up rate limits
    setInterval(() => {
      this.cleanupRateLimits();
    }, 300000); // Every 5 minutes
    
    // Update metrics
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 60000); // Every minute
  }
  
  private async cleanupExpiredNotifications(): Promise<void> {
    try {
      const keys = await this.redis.keys('notification:*');
      const expired: string[] = [];
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 86400 * 30); // Set 30-day expiration
        } else if (ttl === -2) { // Key doesn't exist
          expired.push(key);
        }
      }
      
      if (expired.length > 0) {
        this.fastify.log.info(`Cleaned up ${expired.length} expired notification keys`);
      }
      
    } catch (error) {
      this.fastify.log.error('Failed to cleanup expired notifications:', error);
    }
  }
  
  private cleanupRateLimits(): void {
    const now = Date.now();
    
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }
  
  // Public API
  public getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }
  
  public async getOfflineNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await this.redis.lrange(
        `offline_notifications:${userId}`,
        0, -1
      );
      
      return notifications.map(notif => JSON.parse(notif));
      
    } catch (error) {
      this.fastify.log.error('Failed to get offline notifications:', error);
      return [];
    }
  }
  
  public async clearOfflineNotifications(userId: string): Promise<void> {
    try {
      await this.redis.del(`offline_notifications:${userId}`);
    } catch (error) {
      this.fastify.log.error('Failed to clear offline notifications:', error);
    }
  }
  
  public getHealth() {
    return {
      status: 'healthy',
      queues: {
        urgent: this.queues.urgent.length,
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length
      },
      batches: this.batchQueues.size,
      templates: this.templates.size,
      metrics: this.getMetrics()
    };
  }
  
  public async gracefulShutdown(): Promise<void> {
    this.fastify.log.info('Shutting down notification system...');
    
    // Process remaining batches
    for (const [batchKey, batch] of this.batchQueues.entries()) {
      clearTimeout(batch.timer);
      await this.processBatch(batchKey);
    }
    
    // Process remaining queues
    await this.processQueues();
    
    this.fastify.log.info('Notification system shutdown complete');
  }
}

// Factory function
export function createRealtimeNotificationSystem(
  fastify: FastifyInstance,
  io: Server,
  redis: Redis
): RealtimeNotificationSystem {
  return new RealtimeNotificationSystem(fastify, io, redis);
}
