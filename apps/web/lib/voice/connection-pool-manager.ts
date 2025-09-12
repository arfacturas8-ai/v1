import { VoiceConnectionManager, VoiceConnectionState, ConnectionOptions } from './voice-connection-manager';
import { MediaStreamManager } from './media-stream-manager';
import { NetworkRecoveryManager } from './network-recovery-manager';
import { ServerFallbackManager } from './server-fallback-manager';
import { MediaErrorHandler } from './media-error-handler';
import { BandwidthAdapter } from './bandwidth-adapter';

export interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  isolationMode: 'strict' | 'shared';
  resourceSharing: boolean;
  autoCleanup: boolean;
  cleanupInterval: number;
}

export interface ConnectionInstance {
  id: string;
  channelId: string;
  userId: string;
  manager: VoiceConnectionManager;
  streamManager: MediaStreamManager;
  recoveryManager: NetworkRecoveryManager;
  errorHandler: MediaErrorHandler;
  bandwidthAdapter: BandwidthAdapter;
  createdAt: number;
  lastUsed: number;
  state: VoiceConnectionState;
  isActive: boolean;
  resourcesShared: boolean;
}

export interface PoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  failedConnections: number;
  totalResourcesAllocated: number;
  memoryUsage: number;
  cpuUsage: number;
  networkBandwidth: number;
  lastCleanup: number;
  errors: Array<{ timestamp: number; error: string; connectionId: string }>;
}

export class ConnectionPoolManager {
  private connections: Map<string, ConnectionInstance> = new Map();
  private fallbackManager: ServerFallbackManager;
  private poolConfig: ConnectionPoolConfig = {
    maxConnections: 5,
    connectionTimeout: 30000,
    isolationMode: 'strict',
    resourceSharing: false,
    autoCleanup: true,
    cleanupInterval: 60000
  };
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private isDestroyed = false;
  private apiBaseUrl: string;
  private authToken: string | null = null;
  private currentUserId: string | null = null;
  
  private stats: PoolStatistics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    failedConnections: 0,
    totalResourcesAllocated: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkBandwidth: 0,
    lastCleanup: Date.now(),
    errors: []
  };

  constructor(apiBaseUrl: string, config?: Partial<ConnectionPoolConfig>) {
    this.apiBaseUrl = apiBaseUrl;
    
    if (config) {
      this.poolConfig = { ...this.poolConfig, ...config };
    }
    
    this.fallbackManager = new ServerFallbackManager();
    
    this.setupPoolManagement();
    console.log('Connection Pool Manager initialized with config:', this.poolConfig);
  }

  private setupPoolManagement(): void {
    if (this.poolConfig.autoCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.performCleanup();
      }, this.poolConfig.cleanupInterval);
    }
    
    this.monitoringTimer = setInterval(() => {
      this.updateStatistics();
    }, 5000); // Update stats every 5 seconds
  }

  public setAuth(token: string, userId: string): void {
    this.authToken = token;
    this.currentUserId = userId;
    
    // Update auth for all existing connections
    this.connections.forEach(connection => {
      connection.manager.setAuth(token, userId);
    });
  }

  public async createConnection(
    channelId: string,
    options?: ConnectionOptions
  ): Promise<string> {
    if (this.isDestroyed) {
      throw new Error('Connection pool has been destroyed');
    }

    if (!this.authToken || !this.currentUserId) {
      throw new Error('Authentication not set');
    }

    // Check connection limits
    if (this.connections.size >= this.poolConfig.maxConnections) {
      // Try to clean up idle connections
      this.cleanupIdleConnections();
      
      if (this.connections.size >= this.poolConfig.maxConnections) {
        throw new Error(`Maximum connections reached (${this.poolConfig.maxConnections})`);
      }
    }

    // Check for existing connection to the same channel
    const existingConnection = this.findConnectionByChannel(channelId);
    if (existingConnection) {
      console.log(`Reusing existing connection for channel ${channelId}`);
      existingConnection.lastUsed = Date.now();
      existingConnection.isActive = true;
      return existingConnection.id;
    }

    try {
      const connectionId = this.generateConnectionId();
      const connection = await this.createConnectionInstance(connectionId, channelId, options);
      
      this.connections.set(connectionId, connection);
      this.stats.totalConnections++;
      
      console.log(`Created connection ${connectionId} for channel ${channelId}`);
      this.emit('connectionCreated', connection);
      
      return connectionId;
      
    } catch (error) {
      this.stats.failedConnections++;
      this.logError((error as Error).message, 'unknown');
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  private async createConnectionInstance(
    connectionId: string,
    channelId: string,
    options?: ConnectionOptions
  ): Promise<ConnectionInstance> {
    // Create isolated managers based on configuration
    const managers = this.createManagerInstances(connectionId);
    
    const connection: ConnectionInstance = {
      id: connectionId,
      channelId,
      userId: this.currentUserId!,
      ...managers,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      state: {
        channelId: null,
        status: 'disconnected' as any,
        participants: new Map(),
        localMuted: false,
        localDeafened: false,
        localVideoEnabled: false,
        localScreenSharing: false,
        error: null,
        connectionAttempts: 0,
        lastConnectedAt: null,
        bandwidthKbps: 0,
        latencyMs: 0,
        packetLoss: 0
      },
      isActive: true,
      resourcesShared: this.poolConfig.resourceSharing
    };

    // Set up cross-manager integrations
    this.setupManagerIntegrations(connection);
    
    // Connect to the channel
    await connection.manager.connectToChannel(channelId, options);
    
    return connection;
  }

  private createManagerInstances(connectionId: string): {
    manager: VoiceConnectionManager;
    streamManager: MediaStreamManager;
    recoveryManager: NetworkRecoveryManager;
    errorHandler: MediaErrorHandler;
    bandwidthAdapter: BandwidthAdapter;
  } {
    if (this.poolConfig.resourceSharing && this.connections.size > 0) {
      // Share resources with existing connection
      const existingConnection = Array.from(this.connections.values())[0];
      console.log(`Sharing resources from connection ${existingConnection.id} to ${connectionId}`);
      
      return {
        manager: new VoiceConnectionManager(this.apiBaseUrl),
        streamManager: existingConnection.streamManager, // Shared
        recoveryManager: new NetworkRecoveryManager(),
        errorHandler: existingConnection.errorHandler, // Shared
        bandwidthAdapter: existingConnection.bandwidthAdapter // Shared
      };
    }
    
    // Create isolated instances
    return {
      manager: new VoiceConnectionManager(this.apiBaseUrl),
      streamManager: new MediaStreamManager(),
      recoveryManager: new NetworkRecoveryManager(),
      errorHandler: new MediaErrorHandler(),
      bandwidthAdapter: new BandwidthAdapter()
    };
  }

  private setupManagerIntegrations(connection: ConnectionInstance): void {
    const { manager, streamManager, recoveryManager, errorHandler, bandwidthAdapter } = connection;
    
    // Set authentication
    manager.setAuth(this.authToken!, this.currentUserId!);
    
    // Set up recovery manager
    recoveryManager.setVoiceManager(manager);
    
    // Set up error handler integration
    manager.on('error', async (error: any) => {
      try {
        const recoveryAction = await errorHandler.analyzeError(error);
        console.log(`Error recovery action for ${connection.id}:`, recoveryAction);
        
        // Apply recovery action
        if (recoveryAction.callback) {
          await recoveryAction.callback();
        }
      } catch (recoveryError) {
        console.error(`Error recovery failed for ${connection.id}:`, recoveryError);
        this.logError((recoveryError as Error).message, connection.id);
      }
    });
    
    // Set up bandwidth adaptation
    bandwidthAdapter.onAdaptation((settings) => {
      console.log(`Bandwidth adaptation for ${connection.id}:`, settings);
      // Apply bandwidth settings to the connection
    });
    
    // State synchronization
    manager.on('stateChanged', (state: VoiceConnectionState) => {
      connection.state = state;
      connection.lastUsed = Date.now();
      
      if (state.channelId) {
        const connectionState = {
          channelId: state.channelId,
          userId: connection.userId,
          settings: {
            muted: state.localMuted,
            deafened: state.localDeafened,
            videoEnabled: state.localVideoEnabled,
            screenSharing: state.localScreenSharing
          },
          participants: state.participants,
          joinedAt: connection.createdAt,
          lastHeartbeat: Date.now()
        };
        
        recoveryManager.saveConnectionState(connectionState);
      }
      
      this.emit('connectionStateChanged', connection.id, state);
    });
  }

  public async getConnection(connectionId: string): Promise<ConnectionInstance | null> {
    return this.connections.get(connectionId) || null;
  }

  public async getConnectionByChannel(channelId: string): Promise<ConnectionInstance | null> {
    return this.findConnectionByChannel(channelId);
  }

  private findConnectionByChannel(channelId: string): ConnectionInstance | null {
    for (const connection of this.connections.values()) {
      if (connection.channelId === channelId && connection.isActive) {
        return connection;
      }
    }
    return null;
  }

  public async disconnectConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`Connection ${connectionId} not found`);
      return;
    }

    try {
      // Disconnect voice manager
      await connection.manager.disconnect();
      
      // Clear recovery state
      connection.recoveryManager.clearConnectionState();
      
      // Mark as inactive
      connection.isActive = false;
      
      console.log(`Disconnected connection ${connectionId}`);
      this.emit('connectionDisconnected', connection);
      
    } catch (error) {
      console.error(`Error disconnecting connection ${connectionId}:`, error);
      this.logError((error as Error).message, connectionId);
    }
  }

  public async destroyConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      // Disconnect first
      await this.disconnectConnection(connectionId);
      
      // Destroy managers (only if not shared)
      if (!connection.resourcesShared) {
        connection.manager.destroy();
        connection.streamManager.destroy();
        connection.recoveryManager.destroy();
        connection.errorHandler.destroy();
        connection.bandwidthAdapter.destroy();
      }
      
      // Remove from pool
      this.connections.delete(connectionId);
      
      console.log(`Destroyed connection ${connectionId}`);
      this.emit('connectionDestroyed', connectionId);
      
    } catch (error) {
      console.error(`Error destroying connection ${connectionId}:`, error);
      this.logError((error as Error).message, connectionId);
    }
  }

  private performCleanup(): void {
    const now = Date.now();
    const connectionsToCleanup: string[] = [];
    
    // Find idle connections
    this.connections.forEach((connection, id) => {
      const idleTime = now - connection.lastUsed;
      const isIdle = !connection.isActive || idleTime > this.poolConfig.connectionTimeout;
      
      if (isIdle) {
        connectionsToCleanup.push(id);
      }
    });
    
    // Clean up idle connections
    connectionsToCleanup.forEach(id => {
      this.destroyConnection(id);
    });
    
    this.stats.lastCleanup = now;
    
    if (connectionsToCleanup.length > 0) {
      console.log(`Cleaned up ${connectionsToCleanup.length} idle connections`);
      this.emit('cleanupCompleted', connectionsToCleanup.length);
    }
  }

  private cleanupIdleConnections(): void {
    const idleConnections = Array.from(this.connections.entries())
      .filter(([, connection]) => !connection.isActive)
      .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
    
    // Remove oldest idle connection
    if (idleConnections.length > 0) {
      const [connectionId] = idleConnections[0];
      this.destroyConnection(connectionId);
    }
  }

  private updateStatistics(): void {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive);
    
    const idleConnections = Array.from(this.connections.values())
      .filter(conn => !conn.isActive);
    
    this.stats.activeConnections = activeConnections.length;
    this.stats.idleConnections = idleConnections.length;
    
    // Estimate resource usage
    let totalMemory = 0;
    let totalBandwidth = 0;
    
    activeConnections.forEach(connection => {
      // Rough estimates
      totalMemory += 50000; // ~50MB per active connection
      totalBandwidth += connection.state.bandwidthKbps;
    });
    
    this.stats.memoryUsage = totalMemory;
    this.stats.networkBandwidth = totalBandwidth;
    this.stats.totalResourcesAllocated = this.connections.size;
  }

  public getStatistics(): PoolStatistics {
    this.updateStatistics();
    return { ...this.stats };
  }

  public getActiveConnections(): ConnectionInstance[] {
    return Array.from(this.connections.values()).filter(conn => conn.isActive);
  }

  public getAllConnections(): ConnectionInstance[] {
    return Array.from(this.connections.values());
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(message: string, connectionId: string): void {
    this.stats.errors.push({
      timestamp: Date.now(),
      error: message,
      connectionId
    });
    
    // Keep only last 100 errors
    if (this.stats.errors.length > 100) {
      this.stats.errors = this.stats.errors.slice(-100);
    }
  }

  public async forceCleanup(): Promise<void> {
    console.log('Forcing pool cleanup...');
    
    const promises = Array.from(this.connections.keys()).map(id => 
      this.destroyConnection(id)
    );
    
    await Promise.allSettled(promises);
    
    console.log('Force cleanup completed');
    this.emit('forceCleanupCompleted', promises.length);
  }

  public updateConfig(config: Partial<ConnectionPoolConfig>): void {
    const oldConfig = { ...this.poolConfig };
    this.poolConfig = { ...this.poolConfig, ...config };
    
    console.log('Pool configuration updated:', this.poolConfig);
    
    // Apply configuration changes
    if (oldConfig.autoCleanup !== this.poolConfig.autoCleanup) {
      if (this.poolConfig.autoCleanup && !this.cleanupTimer) {
        this.cleanupTimer = setInterval(() => {
          this.performCleanup();
        }, this.poolConfig.cleanupInterval);
      } else if (!this.poolConfig.autoCleanup && this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    }
    
    this.emit('configUpdated', this.poolConfig);
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in connection pool event handler for ${event}:`, error);
        }
      });
    }
  }

  public async destroy(): Promise<void> {
    this.isDestroyed = true;
    
    console.log('Destroying connection pool...');
    
    // Clean up timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    // Destroy all connections
    await this.forceCleanup();
    
    // Destroy fallback manager
    this.fallbackManager.destroy();
    
    // Clear collections
    this.connections.clear();
    this.eventHandlers.clear();
    this.stats.errors = [];
    
    console.log('Connection pool destroyed');
  }
}