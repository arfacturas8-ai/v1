import { Server } from 'socket.io';
import { VoiceWebRTCHandler, VoiceConnection } from '../socket/voice-webrtc';
import { LiveKitService } from './livekit';
import Redis from 'ioredis';

export interface ConnectionRecoveryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Max delay in ms
  backoffMultiplier: number;
  healthCheckInterval: number; // Health check interval in ms
  staleConnectionThreshold: number; // Threshold for stale connections in ms
}

export interface RecoveryAttempt {
  attemptNumber: number;
  timestamp: Date;
  reason: string;
  success: boolean;
  errorMessage?: string;
}

export interface ConnectionHealth {
  userId: string;
  channelId?: string;
  sessionId: string;
  lastSeen: Date;
  connectionState: 'healthy' | 'degraded' | 'failed' | 'recovering';
  qualityScore: number; // 0-5 scale
  issues: string[];
  recoveryAttempts: RecoveryAttempt[];
}

export class VoiceRecoveryService {
  private io: Server;
  private redis: Redis;
  private liveKitService: LiveKitService;
  private voiceHandler: VoiceWebRTCHandler;
  private config: ConnectionRecoveryConfig;
  
  private healthMap: Map<string, ConnectionHealth> = new Map();
  private recoveryTimers: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(
    io: Server, 
    redis: Redis, 
    liveKitService: LiveKitService,
    voiceHandler: VoiceWebRTCHandler,
    config?: Partial<ConnectionRecoveryConfig>
  ) {
    this.io = io;
    this.redis = redis;
    this.liveKitService = liveKitService;
    this.voiceHandler = voiceHandler;
    
    this.config = {
      maxRetries: 5,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      healthCheckInterval: 30000, // 30 seconds
      staleConnectionThreshold: 60000, // 1 minute
      ...config
    };

    this.setupRecoveryHandlers();
    this.startHealthCheckLoop();
    this.setupGracefulShutdown();
  }

  /**
   * Setup recovery handlers for various failure scenarios
   */
  private setupRecoveryHandlers(): void {
    // Handle socket disconnections
    this.io.on('connection', (socket) => {
      socket.on('disconnect', (reason) => {
        this.handleSocketDisconnection(socket as any, reason);
      });

      socket.on('connect_error', (error) => {
        this.handleSocketError(socket as any, error);
      });

      // Handle voice-specific errors
      socket.on('voice:connection_failed', (data) => {
        this.handleVoiceConnectionFailure(socket as any, data);
      });

      socket.on('voice:quality_degraded', (data) => {
        this.handleQualityDegradation(socket as any, data);
      });

      socket.on('voice:livekit_error', (data) => {
        this.handleLiveKitError(socket as any, data);
      });
    });

    // Handle LiveKit service errors
    this.setupLiveKitErrorHandling();
  }

  /**
   * Handle socket disconnection with recovery logic
   */
  private async handleSocketDisconnection(socket: any, reason: string): Promise<void> {
    const userId = socket.userId;
    if (!userId) return;

    console.log(`🔌 Socket disconnected for user ${userId}: ${reason}`);

    const health = this.healthMap.get(userId);
    if (!health) return;

    // Update health status
    health.connectionState = 'failed';
    health.lastSeen = new Date();
    health.issues.push(`Socket disconnected: ${reason}`);

    // Determine if recovery is needed based on disconnect reason
    const shouldRecover = this.shouldAttemptRecovery(reason);
    
    if (shouldRecover) {
      await this.initiateRecovery(userId, 'socket_disconnect', reason);
    } else {
      console.log(`⚠️ No recovery attempted for user ${userId} - reason: ${reason}`);
      this.cleanupUserConnections(userId);
    }
  }

  /**
   * Handle socket connection errors
   */
  private async handleSocketError(socket: any, error: Error): Promise<void> {
    const userId = socket.userId;
    if (!userId) return;

    console.error(`🔌 Socket error for user ${userId}:`, error.message);

    const health = this.healthMap.get(userId);
    if (health) {
      health.issues.push(`Socket error: ${error.message}`);
      health.connectionState = 'degraded';
    }

    // Attempt recovery for certain types of errors
    if (this.isRecoverableSocketError(error)) {
      await this.initiateRecovery(userId, 'socket_error', error.message);
    }
  }

  /**
   * Handle voice connection failures
   */
  private async handleVoiceConnectionFailure(socket: any, data: any): Promise<void> {
    const userId = socket.userId;
    if (!userId) return;

    console.error(`🎙️ Voice connection failed for user ${userId}:`, data);

    const health = this.getOrCreateHealth(userId);
    health.connectionState = 'failed';
    health.issues.push(`Voice connection failed: ${data.reason || 'unknown'}`);
    health.qualityScore = 0;

    await this.initiateRecovery(userId, 'voice_connection_failure', data.reason);
  }

  /**
   * Handle quality degradation
   */
  private async handleQualityDegradation(socket: any, data: any): Promise<void> {
    const userId = socket.userId;
    if (!userId) return;

    console.warn(`📊 Quality degraded for user ${userId}:`, data);

    const health = this.getOrCreateHealth(userId);
    health.connectionState = 'degraded';
    health.qualityScore = data.qualityScore || 1;
    health.issues.push(`Quality degraded: ${data.reason || 'unknown'}`);

    // Attempt quality recovery
    await this.attemptQualityRecovery(userId, data);
  }

  /**
   * Handle LiveKit-specific errors
   */
  private async handleLiveKitError(socket: any, data: any): Promise<void> {
    const userId = socket.userId;
    if (!userId) return;

    console.error(`🎬 LiveKit error for user ${userId}:`, data);

    const health = this.getOrCreateHealth(userId);
    health.issues.push(`LiveKit error: ${data.error || 'unknown'}`);
    health.connectionState = 'failed';

    await this.initiateRecovery(userId, 'livekit_error', data.error);
  }

  /**
   * Setup LiveKit service error handling
   */
  private setupLiveKitErrorHandling(): void {
    // Monitor LiveKit service health
    setInterval(async () => {
      try {
        await this.liveKitService.listRooms();
      } catch (error) {
        console.error('🎬 LiveKit service health check failed:', error);
        await this.handleLiveKitServiceFailure(error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle LiveKit service-wide failures
   */
  private async handleLiveKitServiceFailure(error: any): Promise<void> {
    console.error('🚨 LiveKit service failure detected, initiating recovery...');

    // Get all active connections
    const activeConnections = this.voiceHandler.getActiveConnections();
    
    for (const [userId, connection] of activeConnections.entries()) {
      const health = this.getOrCreateHealth(userId);
      health.connectionState = 'failed';
      health.issues.push('LiveKit service failure');

      // Notify user of service issue
      this.io.to(`user:${userId}`).emit('voice:service_error', {
        message: 'Voice service temporarily unavailable',
        canRetry: true,
        estimatedRecoveryTime: 30000 // 30 seconds
      });

      // Schedule recovery attempt
      setTimeout(() => {
        this.initiateRecovery(userId, 'service_failure', 'LiveKit service recovered');
      }, 30000);
    }
  }

  /**
   * Initiate recovery process for a user
   */
  private async initiateRecovery(userId: string, reason: string, details: string): Promise<void> {
    const health = this.getOrCreateHealth(userId);
    
    // Check if already recovering
    if (health.connectionState === 'recovering') {
      console.log(`⏳ User ${userId} already recovering, skipping`);
      return;
    }

    // Check retry limit
    const recentAttempts = health.recoveryAttempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < 300000 // 5 minutes
    );

    if (recentAttempts.length >= this.config.maxRetries) {
      console.log(`🛑 Max recovery attempts reached for user ${userId}`);
      this.notifyRecoveryFailure(userId, 'Max retry attempts exceeded');
      return;
    }

    health.connectionState = 'recovering';
    
    const attemptNumber = recentAttempts.length + 1;
    const delay = this.calculateBackoffDelay(attemptNumber);

    console.log(`🔄 Initiating recovery for user ${userId} (attempt ${attemptNumber}), delay: ${delay}ms`);

    // Schedule recovery attempt
    const timer = setTimeout(async () => {
      await this.performRecovery(userId, reason, details, attemptNumber);
      this.recoveryTimers.delete(userId);
    }, delay);

    this.recoveryTimers.set(userId, timer);

    // Notify user of recovery attempt
    this.io.to(`user:${userId}`).emit('voice:recovery_started', {
      attempt: attemptNumber,
      maxAttempts: this.config.maxRetries,
      estimatedDelay: delay
    });
  }

  /**
   * Perform the actual recovery process
   */
  private async performRecovery(userId: string, reason: string, details: string, attemptNumber: number): Promise<void> {
    const health = this.healthMap.get(userId);
    if (!health) return;

    const attempt: RecoveryAttempt = {
      attemptNumber,
      timestamp: new Date(),
      reason: `${reason}: ${details}`,
      success: false
    };

    try {
      console.log(`🔧 Performing recovery for user ${userId} (attempt ${attemptNumber})`);

      // Get current voice connection if any
      const connections = this.voiceHandler.getActiveConnections();
      const connection = connections.get(userId);

      if (connection) {
        // Attempt to recover existing connection
        await this.recoverExistingConnection(userId, connection);
      } else {
        // Try to restore from stored state
        await this.restoreConnectionFromState(userId);
      }

      // Test connection quality
      const isHealthy = await this.testConnectionHealth(userId);
      
      if (isHealthy) {
        attempt.success = true;
        health.connectionState = 'healthy';
        health.issues = []; // Clear issues on successful recovery
        health.qualityScore = 4; // Assume good quality on recovery

        console.log(`✅ Recovery successful for user ${userId}`);
        
        // Notify user of successful recovery
        this.io.to(`user:${userId}`).emit('voice:recovery_success', {
          attempt: attemptNumber,
          reason: attempt.reason
        });

      } else {
        throw new Error('Connection health test failed after recovery');
      }

    } catch (error) {
      console.error(`❌ Recovery failed for user ${userId} (attempt ${attemptNumber}):`, error);
      
      attempt.success = false;
      attempt.errorMessage = error.message;
      health.connectionState = 'failed';
      health.issues.push(`Recovery attempt ${attemptNumber} failed: ${error.message}`);

      // Schedule next attempt if within retry limit
      if (attemptNumber < this.config.maxRetries) {
        setTimeout(() => {
          this.initiateRecovery(userId, reason, `Retry after failure: ${error.message}`);
        }, this.calculateBackoffDelay(attemptNumber + 1));
      } else {
        this.notifyRecoveryFailure(userId, 'All recovery attempts failed');
      }
    } finally {
      health.recoveryAttempts.push(attempt);
    }
  }

  /**
   * Recover an existing connection
   */
  private async recoverExistingConnection(userId: string, connection: VoiceConnection): Promise<void> {
    // Try to refresh LiveKit token
    if (connection.roomName) {
      const newToken = this.liveKitService.generateAccessToken(
        connection.roomName,
        {
          identity: `user_${userId}`,
          name: 'Recovered User',
          permissions: {
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: false,
            recorder: false
          }
        }
      );

      connection.liveKitToken = newToken;
      connection.connectionState = 'connecting';
      connection.updatedAt = new Date();

      // Send new token to user
      this.io.to(`user:${userId}`).emit('voice:token_refresh', {
        liveKitToken: newToken,
        roomName: connection.roomName
      });
    }
  }

  /**
   * Restore connection from stored state
   */
  private async restoreConnectionFromState(userId: string): Promise<void> {
    // Try to get last known voice state from database
    const storedState = await this.redis.hget('voice_recovery_state', userId);
    
    if (storedState) {
      const state = JSON.parse(storedState);
      console.log(`🔄 Attempting to restore connection for user ${userId} to channel ${state.channelId}`);
      
      // Notify user to rejoin their last voice channel
      this.io.to(`user:${userId}`).emit('voice:restore_suggestion', {
        channelId: state.channelId,
        serverName: state.serverName,
        channelName: state.channelName,
        lastConnected: state.timestamp
      });
    }
  }

  /**
   * Test connection health after recovery
   */
  private async testConnectionHealth(userId: string): Promise<boolean> {
    try {
      // Ping the user's socket
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      
      if (sockets.length === 0) {
        return false; // No active socket
      }

      // Test if user can receive events
      return new Promise((resolve) => {
        const socket = sockets[0];
        const timeout = setTimeout(() => resolve(false), 5000);
        
        socket.once('voice:health_check_response', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        
        socket.emit('voice:health_check');
      });

    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }

  /**
   * Attempt quality recovery without full reconnection
   */
  private async attemptQualityRecovery(userId: string, qualityData: any): Promise<void> {
    console.log(`📊 Attempting quality recovery for user ${userId}`);
    
    // Suggest network optimization
    this.io.to(`user:${userId}`).emit('voice:quality_recovery', {
      suggestions: [
        'Check your network connection',
        'Close bandwidth-heavy applications',
        'Switch to a wired connection if possible',
        'Try moving closer to your router'
      ],
      autoOptimize: true,
      qualityData
    });

    // Store recovery state
    const health = this.getOrCreateHealth(userId);
    health.issues.push('Quality recovery initiated');
    
    // Monitor for improvement
    setTimeout(() => {
      // Quality should improve within 30 seconds
      if (health.qualityScore < 2.5) {
        this.initiateRecovery(userId, 'quality_recovery_failed', 'Quality did not improve');
      }
    }, 30000);
  }

  /**
   * Start the health check loop
   */
  private startHealthCheckLoop(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    console.log(`🏥 Health check loop started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    if (this.isShuttingDown) return;

    const now = Date.now();
    const activeConnections = this.voiceHandler.getActiveConnections();

    for (const [userId, connection] of activeConnections.entries()) {
      const health = this.getOrCreateHealth(userId);
      const timeSinceUpdate = now - connection.updatedAt.getTime();

      // Check for stale connections
      if (timeSinceUpdate > this.config.staleConnectionThreshold) {
        console.warn(`⚠️ Stale connection detected for user ${userId} (${timeSinceUpdate}ms since update)`);
        
        health.connectionState = 'degraded';
        health.issues.push('Connection appears stale');
        
        // Try to ping the connection
        this.io.to(`user:${userId}`).emit('voice:ping');
      }

      // Update health timestamp
      health.lastSeen = new Date();
    }

    // Clean up old health records
    this.cleanupOldHealthRecords();
  }

  /**
   * Clean up old health records
   */
  private cleanupOldHealthRecords(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [userId, health] of this.healthMap.entries()) {
      if (health.lastSeen.getTime() < cutoffTime) {
        this.healthMap.delete(userId);
        console.log(`🧹 Cleaned up old health record for user ${userId}`);
      }
    }
  }

  /**
   * Get or create health record for user
   */
  private getOrCreateHealth(userId: string): ConnectionHealth {
    let health = this.healthMap.get(userId);
    
    if (!health) {
      health = {
        userId,
        sessionId: `recovery_${Date.now()}`,
        lastSeen: new Date(),
        connectionState: 'healthy',
        qualityScore: 4,
        issues: [],
        recoveryAttempts: []
      };
      
      this.healthMap.set(userId, health);
    }
    
    return health;
  }

  /**
   * Calculate backoff delay for retry attempts
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Determine if recovery should be attempted based on disconnect reason
   */
  private shouldAttemptRecovery(reason: string): boolean {
    const nonRecoverableReasons = [
      'client namespace disconnect',
      'server shutting down',
      'ping timeout',
      'transport close'
    ];
    
    return !nonRecoverableReasons.some(r => reason.includes(r));
  }

  /**
   * Check if a socket error is recoverable
   */
  private isRecoverableSocketError(error: Error): boolean {
    const recoverableErrors = [
      'timeout',
      'network error',
      'connection lost',
      'websocket error'
    ];
    
    return recoverableErrors.some(e => error.message.toLowerCase().includes(e));
  }

  /**
   * Notify user of recovery failure
   */
  private notifyRecoveryFailure(userId: string, reason: string): void {
    console.error(`🚨 Recovery failed for user ${userId}: ${reason}`);
    
    this.io.to(`user:${userId}`).emit('voice:recovery_failed', {
      reason,
      suggestion: 'Please manually reconnect to the voice channel',
      supportContact: 'Contact support if the issue persists'
    });
    
    this.cleanupUserConnections(userId);
  }

  /**
   * Clean up all user connections and state
   */
  private cleanupUserConnections(userId: string): void {
    // Cancel any pending recovery timers
    const timer = this.recoveryTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.recoveryTimers.delete(userId);
    }

    // Remove health record
    this.healthMap.delete(userId);

    // Clear recovery state from Redis
    this.redis.hdel('voice_recovery_state', userId);

    console.log(`🧹 Cleaned up connections for user ${userId}`);
  }

  /**
   * Store voice state for recovery purposes
   */
  async storeVoiceStateForRecovery(userId: string, connection: VoiceConnection): Promise<void> {
    const state = {
      channelId: connection.channelId,
      serverId: connection.serverId,
      timestamp: Date.now(),
      roomName: connection.roomName
    };

    await this.redis.hset('voice_recovery_state', userId, JSON.stringify(state));
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    totalHealthRecords: number;
    activeRecoveries: number;
    healthyConnections: number;
    degradedConnections: number;
    failedConnections: number;
    recoveringConnections: number;
  } {
    const stats = {
      totalHealthRecords: this.healthMap.size,
      activeRecoveries: this.recoveryTimers.size,
      healthyConnections: 0,
      degradedConnections: 0,
      failedConnections: 0,
      recoveringConnections: 0
    };

    for (const health of this.healthMap.values()) {
      switch (health.connectionState) {
        case 'healthy':
          stats.healthyConnections++;
          break;
        case 'degraded':
          stats.degradedConnections++;
          break;
        case 'failed':
          stats.failedConnections++;
          break;
        case 'recovering':
          stats.recoveringConnections++;
          break;
      }
    }

    return stats;
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  /**
   * Graceful shutdown cleanup
   */
  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Voice recovery service shutting down...');
    
    this.isShuttingDown = true;

    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Clear all recovery timers
    for (const timer of this.recoveryTimers.values()) {
      clearTimeout(timer);
    }
    this.recoveryTimers.clear();

    // Notify all users of shutdown
    for (const userId of this.healthMap.keys()) {
      this.io.to(`user:${userId}`).emit('voice:service_shutdown', {
        message: 'Voice service is shutting down',
        reconnectAfter: 30000
      });
    }

    console.log('✅ Voice recovery service shutdown complete');
  }
}