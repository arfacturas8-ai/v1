import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

/**
 * WebSocket Reliability Utilities
 * 
 * Provides enhanced WebSocket reliability with:
 * - Message acknowledgments and retry logic
 * - Connection state management
 * - Automatic reconnection handling
 * - Message queuing for offline clients
 * - Heartbeat/ping-pong monitoring
 * - Event deduplication
 */

// Message types for reliability system
interface ReliableMessage {
  id: string;
  event: string;
  data: any;
  timestamp: number;
  retryCount: number;
  expiresAt: number;
  requiresAck: boolean;
}

interface MessageAck {
  messageId: string;
  timestamp: number;
  received: boolean;
  processed: boolean;
}

interface ConnectionState {
  socketId: string;
  userId?: string;
  connectedAt: number;
  lastPing: number;
  lastPong: number;
  pendingMessages: ReliableMessage[];
  connectionCount: number;
  userAgent?: string;
  ip?: string;
}

// Configuration for reliability features
interface ReliabilityConfig {
  // Message acknowledgment timeout (ms)
  ackTimeout: number;
  // Maximum retry attempts for unacknowledged messages
  maxRetries: number;
  // Retry delay multiplier (exponential backoff)
  retryDelayMultiplier: number;
  // Maximum message queue size per client
  maxQueueSize: number;
  // Message expiration time (ms)
  messageExpiryTime: number;
  // Heartbeat interval (ms)
  heartbeatInterval: number;
  // Connection timeout (ms)
  connectionTimeout: number;
  // Enable message persistence in Redis
  persistMessages: boolean;
}

const DEFAULT_CONFIG: ReliabilityConfig = {
  ackTimeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelayMultiplier: 2,
  maxQueueSize: 100,
  messageExpiryTime: 300000, // 5 minutes
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 60000, // 1 minute
  persistMessages: true
};

export class WebSocketReliabilityManager {
  private connections = new Map<string, ConnectionState>();
  private messageQueues = new Map<string, ReliableMessage[]>();
  private ackCallbacks = new Map<string, NodeJS.Timeout>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private io: Server,
    private redis: Redis,
    private config: ReliabilityConfig = DEFAULT_CONFIG
  ) {
    this.setupReliabilityHandlers();
    this.startCleanupInterval();
  }

  /**
   * Setup WebSocket event handlers for reliability
   */
  private setupReliabilityHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket) {
    const connectionState: ConnectionState = {
      socketId: socket.id,
      userId: (socket as any).userId,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      lastPong: Date.now(),
      pendingMessages: [],
      connectionCount: 1,
      userAgent: socket.handshake.headers['user-agent'],
      ip: socket.handshake.address
    };

    this.connections.set(socket.id, connectionState);
    this.setupHeartbeat(socket);
    this.setupReliabilityEvents(socket);
    this.deliverQueuedMessages(socket);

    console.log(`WebSocket connected: ${socket.id} (User: ${connectionState.userId})`);
  }

  /**
   * Setup reliability-specific event handlers
   */
  private setupReliabilityEvents(socket: Socket) {
    // Handle message acknowledgments
    socket.on('message_ack', (data: MessageAck) => {
      this.handleMessageAck(socket.id, data);
    });

    // Handle heartbeat pong responses
    socket.on('pong', () => {
      this.handlePong(socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket.id, reason);
    });

    // Handle reconnection
    socket.on('reconnect_request', (data: { lastMessageId?: string }) => {
      this.handleReconnection(socket, data);
    });

    // Handle manual message request (for missed messages)
    socket.on('request_missed_messages', (data: { since?: number }) => {
      this.handleMissedMessagesRequest(socket, data);
    });
  }

  /**
   * Send reliable message with acknowledgment tracking
   */
  public sendReliableMessage(
    socketId: string | string[],
    event: string,
    data: any,
    options: {
      requiresAck?: boolean;
      priority?: 'high' | 'normal' | 'low';
      expiresAt?: number;
      deduplicationId?: string;
    } = {}
  ): string {
    const messageId = randomUUID();
    const now = Date.now();
    
    const message: ReliableMessage = {
      id: messageId,
      event,
      data,
      timestamp: now,
      retryCount: 0,
      expiresAt: options.expiresAt || (now + this.config.messageExpiryTime),
      requiresAck: options.requiresAck ?? true
    };

    const socketIds = Array.isArray(socketId) ? socketId : [socketId];

    socketIds.forEach(id => {
      this.deliverMessage(id, message);
    });

    return messageId;
  }

  /**
   * Send reliable message to user (across all their connections)
   */
  public sendReliableMessageToUser(
    userId: string,
    event: string,
    data: any,
    options?: Parameters<WebSocketReliabilityManager['sendReliableMessage']>[3]
  ): string[] {
    const userSockets = this.getUserSockets(userId);
    
    if (userSockets.length === 0) {
      // Queue message for offline user
      this.queueMessageForOfflineUser(userId, event, data, options);
      return [];
    }

    return userSockets.map(socketId => 
      this.sendReliableMessage(socketId, event, data, options)
    );
  }

  /**
   * Deliver message to specific socket
   */
  private deliverMessage(socketId: string, message: ReliableMessage) {
    const socket = this.io.sockets.sockets.get(socketId);
    const connection = this.connections.get(socketId);

    if (!socket || !connection) {
      // Queue message if socket is not available
      this.queueMessage(socketId, message);
      return;
    }

    // Check if message has expired
    if (Date.now() > message.expiresAt) {
      return;
    }

    // Send the message
    socket.emit(message.event, {
      ...message.data,
      _messageId: message.id,
      _requiresAck: message.requiresAck,
      _timestamp: message.timestamp
    });

    // Setup acknowledgment timeout if required
    if (message.requiresAck) {
      this.setupAckTimeout(socketId, message);
    }

    // Add to pending messages
    connection.pendingMessages.push(message);

    // Store in Redis for persistence if enabled
    if (this.config.persistMessages) {
      this.persistMessage(socketId, message);
    }
  }

  /**
   * Setup acknowledgment timeout
   */
  private setupAckTimeout(socketId: string, message: ReliableMessage) {
    const timeoutId = setTimeout(() => {
      this.handleAckTimeout(socketId, message);
    }, this.config.ackTimeout);

    this.ackCallbacks.set(`${socketId}:${message.id}`, timeoutId);
  }

  /**
   * Handle acknowledgment timeout (retry logic)
   */
  private handleAckTimeout(socketId: string, message: ReliableMessage) {
    const connection = this.connections.get(socketId);
    
    if (!connection) return;

    // Remove from callbacks
    this.ackCallbacks.delete(`${socketId}:${message.id}`);

    // Check if we should retry
    if (message.retryCount < this.config.maxRetries && Date.now() < message.expiresAt) {
      message.retryCount++;
      
      // Calculate exponential backoff delay
      const delay = Math.min(
        1000 * Math.pow(this.config.retryDelayMultiplier, message.retryCount - 1),
        30000 // Max 30 seconds
      );

      setTimeout(() => {
        this.deliverMessage(socketId, message);
      }, delay);

      console.log(`Retrying message ${message.id} for socket ${socketId} (attempt ${message.retryCount})`);
    } else {
      console.warn(`Message ${message.id} failed delivery to socket ${socketId} after ${message.retryCount} retries`);
      
      // Remove from pending messages
      const index = connection.pendingMessages.findIndex(m => m.id === message.id);
      if (index >= 0) {
        connection.pendingMessages.splice(index, 1);
      }

      // Emit delivery failure event
      this.io.to(socketId).emit('message_delivery_failed', {
        messageId: message.id,
        reason: 'max_retries_exceeded'
      });
    }
  }

  /**
   * Handle message acknowledgment
   */
  private handleMessageAck(socketId: string, ack: MessageAck) {
    const connection = this.connections.get(socketId);
    
    if (!connection) return;

    // Clear timeout
    const callbackKey = `${socketId}:${ack.messageId}`;
    const timeout = this.ackCallbacks.get(callbackKey);
    if (timeout) {
      clearTimeout(timeout);
      this.ackCallbacks.delete(callbackKey);
    }

    // Remove from pending messages
    const index = connection.pendingMessages.findIndex(m => m.id === ack.messageId);
    if (index >= 0) {
      connection.pendingMessages.splice(index, 1);
    }

    // Remove from Redis persistence
    if (this.config.persistMessages) {
      this.removePersistentMessage(socketId, ack.messageId);
    }

    console.log(`Message ${ack.messageId} acknowledged by socket ${socketId}`);
  }

  /**
   * Setup heartbeat monitoring
   */
  private setupHeartbeat(socket: Socket) {
    const interval = setInterval(() => {
      const connection = this.connections.get(socket.id);
      if (!connection) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      const timeSinceLastPong = now - connection.lastPong;

      if (timeSinceLastPong > this.config.connectionTimeout) {
        console.log(`Heartbeat timeout for socket ${socket.id}, disconnecting`);
        socket.disconnect(true);
        clearInterval(interval);
        return;
      }

      // Send ping
      connection.lastPing = now;
      socket.emit('ping', { timestamp: now });
    }, this.config.heartbeatInterval);

    this.heartbeatIntervals.set(socket.id, interval);
  }

  /**
   * Handle pong response
   */
  private handlePong(socketId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastPong = Date.now();
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socketId: string, reason: string) {
    console.log(`WebSocket disconnected: ${socketId} (reason: ${reason})`);

    // Clear heartbeat interval
    const interval = this.heartbeatIntervals.get(socketId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socketId);
    }

    // Clear acknowledgment timeouts
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.pendingMessages.forEach(message => {
        const timeout = this.ackCallbacks.get(`${socketId}:${message.id}`);
        if (timeout) {
          clearTimeout(timeout);
          this.ackCallbacks.delete(`${socketId}:${message.id}`);
        }
      });

      // Queue pending messages for future delivery
      if (connection.userId) {
        this.queueMessagesForUser(connection.userId, connection.pendingMessages);
      }
    }

    this.connections.delete(socketId);
  }

  /**
   * Handle reconnection
   */
  private handleReconnection(socket: Socket, data: { lastMessageId?: string }) {
    const userId = (socket as any).userId;
    if (!userId) return;

    console.log(`WebSocket reconnected: ${socket.id} (User: ${userId})`);

    // Deliver any queued messages
    this.deliverQueuedMessages(socket);

    // If client provides last received message ID, send messages since then
    if (data.lastMessageId) {
      this.sendMessagesSince(socket, data.lastMessageId);
    }
  }

  /**
   * Handle missed messages request
   */
  private handleMissedMessagesRequest(socket: Socket, data: { since?: number }) {
    const userId = (socket as any).userId;
    if (!userId) return;

    const since = data.since || (Date.now() - 300000); // Default to 5 minutes ago
    
    // Get messages from Redis or local storage
    this.getMessagesSince(userId, since).then(messages => {
      messages.forEach(message => {
        this.deliverMessage(socket.id, message);
      });
    });
  }

  /**
   * Queue message for offline user
   */
  private queueMessageForOfflineUser(
    userId: string,
    event: string,
    data: any,
    options: any = {}
  ) {
    const message: ReliableMessage = {
      id: randomUUID(),
      event,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      expiresAt: options.expiresAt || (Date.now() + this.config.messageExpiryTime),
      requiresAck: options.requiresAck ?? true
    };

    this.queueMessage(userId, message);
  }

  /**
   * Queue message for delivery
   */
  private queueMessage(identifier: string, message: ReliableMessage) {
    let queue = this.messageQueues.get(identifier) || [];
    
    // Add message to queue
    queue.push(message);
    
    // Limit queue size
    if (queue.length > this.config.maxQueueSize) {
      queue = queue.slice(-this.config.maxQueueSize);
    }
    
    this.messageQueues.set(identifier, queue);

    // Persist to Redis if enabled
    if (this.config.persistMessages) {
      this.persistQueuedMessage(identifier, message);
    }
  }

  /**
   * Queue messages for user
   */
  private queueMessagesForUser(userId: string, messages: ReliableMessage[]) {
    messages.forEach(message => {
      this.queueMessage(userId, message);
    });
  }

  /**
   * Deliver queued messages to connected socket
   */
  private deliverQueuedMessages(socket: Socket) {
    const userId = (socket as any).userId;
    if (!userId) return;

    const queue = this.messageQueues.get(userId) || [];
    const validMessages = queue.filter(msg => Date.now() < msg.expiresAt);

    validMessages.forEach(message => {
      this.deliverMessage(socket.id, message);
    });

    // Clear delivered messages from queue
    this.messageQueues.set(userId, []);
  }

  /**
   * Get user's connected sockets
   */
  private getUserSockets(userId: string): string[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId)
      .map(conn => conn.socketId);
  }

  /**
   * Persist message to Redis
   */
  private async persistMessage(identifier: string, message: ReliableMessage) {
    try {
      await this.redis.lpush(`ws_messages:${identifier}`, JSON.stringify(message));
      await this.redis.expire(`ws_messages:${identifier}`, 3600); // 1 hour TTL
    } catch (error) {
      console.error('Failed to persist message to Redis:', error);
    }
  }

  /**
   * Persist queued message to Redis
   */
  private async persistQueuedMessage(identifier: string, message: ReliableMessage) {
    try {
      await this.redis.lpush(`ws_queue:${identifier}`, JSON.stringify(message));
      await this.redis.expire(`ws_queue:${identifier}`, 3600); // 1 hour TTL
    } catch (error) {
      console.error('Failed to persist queued message to Redis:', error);
    }
  }

  /**
   * Remove persistent message from Redis
   */
  private async removePersistentMessage(identifier: string, messageId: string) {
    try {
      const messages = await this.redis.lrange(`ws_messages:${identifier}`, 0, -1);
      const filtered = messages.filter(msgStr => {
        try {
          const msg = JSON.parse(msgStr);
          return msg.id !== messageId;
        } catch {
          return false;
        }
      });
      
      await this.redis.del(`ws_messages:${identifier}`);
      if (filtered.length > 0) {
        await this.redis.lpush(`ws_messages:${identifier}`, ...filtered);
      }
    } catch (error) {
      console.error('Failed to remove persistent message from Redis:', error);
    }
  }

  /**
   * Get messages since timestamp
   */
  private async getMessagesSince(userId: string, since: number): Promise<ReliableMessage[]> {
    try {
      const messages = await this.redis.lrange(`ws_queue:${userId}`, 0, -1);
      return messages
        .map(msgStr => {
          try {
            return JSON.parse(msgStr) as ReliableMessage;
          } catch {
            return null;
          }
        })
        .filter((msg): msg is ReliableMessage => 
          msg !== null && msg.timestamp >= since && Date.now() < msg.expiresAt
        );
    } catch (error) {
      console.error('Failed to get messages from Redis:', error);
      return [];
    }
  }

  /**
   * Send messages since last message ID
   */
  private sendMessagesSince(socket: Socket, lastMessageId: string) {
    // This would require implementing message ordering/sequencing
    // For now, just deliver any queued messages
    this.deliverQueuedMessages(socket);
  }

  /**
   * Cleanup expired messages and connections
   */
  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      
      // Clean expired messages from queues
      for (const [identifier, queue] of this.messageQueues.entries()) {
        const validMessages = queue.filter(msg => now < msg.expiresAt);
        if (validMessages.length !== queue.length) {
          this.messageQueues.set(identifier, validMessages);
        }
      }
      
      // Clean expired acknowledgment callbacks
      for (const [key, timeout] of this.ackCallbacks.entries()) {
        const connection = this.connections.get(key.split(':')[0]);
        if (!connection) {
          clearTimeout(timeout);
          this.ackCallbacks.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get reliability statistics
   */
  public getStats(): {
    totalConnections: number;
    pendingMessages: number;
    queuedMessages: number;
    ackTimeouts: number;
  } {
    const pendingMessages = Array.from(this.connections.values())
      .reduce((sum, conn) => sum + conn.pendingMessages.length, 0);
    
    const queuedMessages = Array.from(this.messageQueues.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    return {
      totalConnections: this.connections.size,
      pendingMessages,
      queuedMessages,
      ackTimeouts: this.ackCallbacks.size
    };
  }
}

/**
 * Export factory function to create reliability manager
 */
export function createWebSocketReliabilityManager(
  io: Server,
  redis: Redis,
  config?: Partial<ReliabilityConfig>
): WebSocketReliabilityManager {
  return new WebSocketReliabilityManager(io, redis, { ...DEFAULT_CONFIG, ...config });
}