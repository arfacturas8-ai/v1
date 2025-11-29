import Redis, { RedisOptions, Cluster, ClusterOptions } from 'ioredis';
import { Logger } from 'pino';
import { EventEmitter } from 'events';

export interface EnhancedRedisConfig {
  // Single Redis instance config
  standalone?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    username?: string;
  };
  
  // Redis Cluster config
  cluster?: {
    nodes: Array<{ host: string; port: number }>;
    options?: Partial<ClusterOptions>;
    password?: string;
    username?: string;
  };
  
  // Redis Sentinel config
  sentinel?: {
    sentinels: Array<{ host: string; port: number }>;
    name: string;
    password?: string;
    sentinelPassword?: string;
    username?: string;
  };
  
  // Connection pool configuration
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  
  // Advanced options
  options: {
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    connectTimeout: number;
    commandTimeout: number;
    enableAutoPipelining: boolean;
    maxLoadingTimeout: number;
    enableOfflineQueue: boolean;
  };
  
  // Monitoring and health check options
  monitoring: {
    healthCheckInterval: number;
    latencyThreshold: number;
    memoryThreshold: number;
    connectionThreshold: number;
    enableMetrics: boolean;
  };
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  reconnections: number;
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  memoryUsage: number;
  commandsProcessed: number;
  lastHealthCheck: Date;
  uptime: number;
  errorRate: number;
}

export interface PooledConnection {
  id: string;
  connection: Redis | Cluster;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  totalUses: number;
  errorCount: number;
  latency: number;
}

/**
 * Enterprise-grade Redis connection pool with cluster support
 * Features:
 * - Redis Cluster, Sentinel, and Standalone support
 * - Advanced connection pooling with load balancing
 * - Comprehensive health monitoring and metrics
 * - Automatic failover and recovery
 * - Circuit breaker pattern for reliability
 * - Connection multiplexing and pipeline optimization
 */
export class EnhancedRedisCluster extends EventEmitter {
  private connectionPool: Map<string, PooledConnection> = new Map();
  private activeConnections: Set<string> = new Set();
  private roundRobinIndex = 0;
  private isInitialized = false;
  private isShuttingDown = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private circuitBreakerOpen = false;
  private circuitBreakerFailures = 0;
  private lastCircuitBreakerReset = Date.now();
  
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    reconnections: 0,
    avgLatency: 0,
    maxLatency: 0,
    minLatency: Number.MAX_VALUE,
    memoryUsage: 0,
    commandsProcessed: 0,
    lastHealthCheck: new Date(),
    uptime: 0,
    errorRate: 0
  };
  
  private startTime = Date.now();
  
  constructor(
    private config: EnhancedRedisConfig,
    private logger: Logger
  ) {
    super();
    this.setupEventHandlers();
  }
  
  /**
   * Initialize the Redis cluster connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Redis cluster already initialized');
      return;
    }
    
    try {
      this.logger.info('Initializing enhanced Redis cluster...');
      
      // Create initial connection pool
      await this.createConnectionPool();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      this.isInitialized = true;
      this.logger.info(`Enhanced Redis cluster initialized with ${this.connectionPool.size} connections`);
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis cluster:', error);
      throw error;
    }
  }
  
  /**
   * Create and manage connection pool
   */
  private async createConnectionPool(): Promise<void> {
    const poolSize = this.config.pool.min;
    const promises: Promise<PooledConnection>[] = [];
    
    for (let i = 0; i < poolSize; i++) {
      promises.push(this.createConnection(`pool-${i}`));
    }
    
    const connections = await Promise.allSettled(promises);
    
    for (const result of connections) {
      if (result.status === 'fulfilled') {
        const connection = result.value;
        this.connectionPool.set(connection.id, connection);
        this.activeConnections.add(connection.id);
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;
      } else {
        this.metrics.failedConnections++;
        this.logger.error('Failed to create pooled connection:', result.reason);
      }
    }
    
    if (this.activeConnections.size === 0) {
      throw new Error('Failed to create any connections in the pool');
    }
  }
  
  /**
   * Create a single Redis connection
   */
  private async createConnection(id: string): Promise<PooledConnection> {
    const start = Date.now();
    
    try {
      let connection: Redis | Cluster;
      
      if (this.config.cluster) {
        // Create Redis Cluster connection
        const clusterOptions: ClusterOptions = {
          enableAutoPipelining: this.config.options.enableAutoPipelining,
          enableOfflineQueue: this.config.options.enableOfflineQueue,
          maxRetriesPerRequest: this.config.options.maxRetriesPerRequest,
          retryDelayOnFailover: this.config.options.retryDelayOnFailover,
          redisOptions: {
            password: this.config.cluster.password,
            username: this.config.cluster.username,
            connectTimeout: this.config.options.connectTimeout,
            commandTimeout: this.config.options.commandTimeout,
            keepAlive: this.config.options.keepAlive,
            family: this.config.options.family,
            lazyConnect: this.config.options.lazyConnect,
            enableReadyCheck: this.config.options.enableReadyCheck,
            maxLoadingTimeout: this.config.options.maxLoadingTimeout
          },
          ...this.config.cluster.options
        };
        
        connection = new Cluster(this.config.cluster.nodes, clusterOptions);
        
      } else if (this.config.sentinel) {
        // Create Redis Sentinel connection
        const sentinelOptions: RedisOptions = {
          sentinels: this.config.sentinel.sentinels,
          name: this.config.sentinel.name,
          password: this.config.sentinel.password,
          sentinelPassword: this.config.sentinel.sentinelPassword,
          username: this.config.sentinel.username,
          maxRetriesPerRequest: this.config.options.maxRetriesPerRequest,
          retryDelayOnFailover: this.config.options.retryDelayOnFailover,
          connectTimeout: this.config.options.connectTimeout,
          commandTimeout: this.config.options.commandTimeout,
          keepAlive: this.config.options.keepAlive,
          family: this.config.options.family,
          lazyConnect: this.config.options.lazyConnect,
          enableReadyCheck: this.config.options.enableReadyCheck,
          enableAutoPipelining: this.config.options.enableAutoPipelining,
          enableOfflineQueue: this.config.options.enableOfflineQueue,
          maxLoadingTimeout: this.config.options.maxLoadingTimeout
        };
        
        connection = new Redis(sentinelOptions);
        
      } else if (this.config.standalone) {
        // Create standalone Redis connection
        const standaloneOptions: RedisOptions = {
          host: this.config.standalone.host,
          port: this.config.standalone.port,
          password: this.config.standalone.password,
          username: this.config.standalone.username,
          db: this.config.standalone.db || 0,
          maxRetriesPerRequest: this.config.options.maxRetriesPerRequest,
          retryDelayOnFailover: this.config.options.retryDelayOnFailover,
          connectTimeout: this.config.options.connectTimeout,
          commandTimeout: this.config.options.commandTimeout,
          keepAlive: this.config.options.keepAlive,
          family: this.config.options.family,
          lazyConnect: this.config.options.lazyConnect,
          enableReadyCheck: this.config.options.enableReadyCheck,
          enableAutoPipelining: this.config.options.enableAutoPipelining,
          enableOfflineQueue: this.config.options.enableOfflineQueue,
          maxLoadingTimeout: this.config.options.maxLoadingTimeout
        };
        
        connection = new Redis(standaloneOptions);
        
      } else {
        throw new Error('No Redis configuration provided (standalone, cluster, or sentinel)');
      }
      
      // Setup connection event handlers
      this.setupConnectionEventHandlers(connection, id);
      
      // Connect if not lazy loading
      if (!this.config.options.lazyConnect) {
        await this.waitForConnection(connection);
      }
      
      const latency = Date.now() - start;
      
      const pooledConnection: PooledConnection = {
        id,
        connection,
        isActive: true,
        createdAt: new Date(),
        lastUsed: new Date(),
        totalUses: 0,
        errorCount: 0,
        latency
      };
      
      this.logger.info(`Created Redis connection ${id} in ${latency}ms`);
      return pooledConnection;
      
    } catch (error) {
      this.logger.error(`Failed to create Redis connection ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Wait for Redis connection to be ready
   */
  private async waitForConnection(connection: Redis | Cluster): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.options.connectTimeout);
      
      if (connection.status === 'ready') {
        clearTimeout(timeout);
        resolve();
        return;
      }
      
      connection.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      connection.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  /**
   * Setup event handlers for the cluster
   */
  private setupEventHandlers(): void {
    // Handle circuit breaker reset
    setInterval(() => {
      if (this.circuitBreakerOpen && 
          Date.now() - this.lastCircuitBreakerReset > 60000) { // 1 minute
        this.circuitBreakerOpen = false;
        this.circuitBreakerFailures = 0;
        this.logger.info('Circuit breaker reset');
        this.emit('circuitBreakerReset');
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Setup event handlers for individual connections
   */
  private setupConnectionEventHandlers(connection: Redis | Cluster, id: string): void {
    connection.on('connect', () => {
      this.logger.debug(`Connection ${id} initiated`);
    });
    
    connection.on('ready', () => {
      this.logger.debug(`Connection ${id} ready`);
      const pooledConnection = this.connectionPool.get(id);
      if (pooledConnection) {
        pooledConnection.isActive = true;
        this.activeConnections.add(id);
      }
      this.emit('connectionReady', id);
    });
    
    connection.on('error', (error) => {
      this.logger.error(`Connection ${id} error:`, error);
      const pooledConnection = this.connectionPool.get(id);
      if (pooledConnection) {
        pooledConnection.errorCount++;
        pooledConnection.isActive = false;
        this.activeConnections.delete(id);
      }
      
      this.circuitBreakerFailures++;
      if (this.circuitBreakerFailures >= 10) {
        this.circuitBreakerOpen = true;
        this.lastCircuitBreakerReset = Date.now();
        this.emit('circuitBreakerOpen');
      }
      
      this.emit('connectionError', id, error);
    });
    
    connection.on('close', () => {
      this.logger.warn(`Connection ${id} closed`);
      const pooledConnection = this.connectionPool.get(id);
      if (pooledConnection) {
        pooledConnection.isActive = false;
        this.activeConnections.delete(id);
      }
      this.emit('connectionClosed', id);
    });
    
    connection.on('reconnecting', (ms) => {
      this.logger.info(`Connection ${id} reconnecting in ${ms}ms`);
      this.metrics.reconnections++;
      this.emit('connectionReconnecting', id, ms);
    });
    
    // Cluster-specific events
    if (connection instanceof Cluster) {
      connection.on('node error', (error, node) => {
        this.logger.error(`Cluster node error for ${node.options.host}:${node.options.port}:`, error);
      });
      
      connection.on('+node', (node) => {
        this.logger.info(`Cluster node added: ${node.options.host}:${node.options.port}`);
      });
      
      connection.on('-node', (node) => {
        this.logger.info(`Cluster node removed: ${node.options.host}:${node.options.port}`);
      });
    }
  }
  
  /**
   * Get a connection from the pool using round-robin load balancing
   */
  async getConnection(): Promise<Redis | Cluster> {
    if (this.circuitBreakerOpen) {
      throw new Error('Circuit breaker is open - Redis connections unavailable');
    }
    
    const activeConnectionIds = Array.from(this.activeConnections);
    
    if (activeConnectionIds.length === 0) {
      throw new Error('No active Redis connections available');
    }
    
    // Round-robin selection
    const connectionId = activeConnectionIds[this.roundRobinIndex % activeConnectionIds.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % activeConnectionIds.length;
    
    const pooledConnection = this.connectionPool.get(connectionId);
    
    if (!pooledConnection || !pooledConnection.isActive) {
      // Try to get another connection
      this.activeConnections.delete(connectionId);
      return this.getConnection();
    }
    
    // Update usage statistics
    pooledConnection.lastUsed = new Date();
    pooledConnection.totalUses++;
    
    return pooledConnection.connection;
  }
  
  /**
   * Get connection with lowest latency for critical operations
   */
  async getFastestConnection(): Promise<Redis | Cluster> {
    if (this.circuitBreakerOpen) {
      throw new Error('Circuit breaker is open - Redis connections unavailable');
    }
    
    let fastestConnection: PooledConnection | null = null;
    let lowestLatency = Number.MAX_VALUE;
    
    for (const [id, connection] of this.connectionPool) {
      if (connection.isActive && connection.latency < lowestLatency) {
        lowestLatency = connection.latency;
        fastestConnection = connection;
      }
    }
    
    if (!fastestConnection) {
      throw new Error('No active Redis connections available');
    }
    
    // Update usage statistics
    fastestConnection.lastUsed = new Date();
    fastestConnection.totalUses++;
    
    return fastestConnection.connection;
  }
  
  /**
   * Execute command with automatic connection management
   */
  async executeCommand<T>(command: (connection: Redis | Cluster) => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const connection = await this.getConnection();
      const result = await command(connection);
      
      const latency = Date.now() - start;
      this.updateLatencyMetrics(latency);
      this.metrics.commandsProcessed++;
      
      return result;
    } catch (error) {
      this.metrics.failedConnections++;
      this.logger.error('Failed to execute Redis command:', error);
      throw error;
    }
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.monitoring.healthCheckInterval);
  }
  
  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthPromises = Array.from(this.connectionPool.entries()).map(
        async ([id, connection]) => {
          if (!connection.isActive) return { id, healthy: false, latency: -1 };
          
          try {
            const start = Date.now();
            await connection.connection.ping();
            const latency = Date.now() - start;
            
            connection.latency = latency;
            
            return {
              id,
              healthy: latency <= this.config.monitoring.latencyThreshold,
              latency
            };
          } catch (error) {
            connection.isActive = false;
            this.activeConnections.delete(id);
            return { id, healthy: false, latency: -1, error };
          }
        }
      );
      
      const healthResults = await Promise.allSettled(healthPromises);
      const healthyConnections = healthResults
        .filter(result => result.status === 'fulfilled' && result.value.healthy)
        .length;
      
      this.metrics.activeConnections = healthyConnections;
      this.metrics.lastHealthCheck = new Date();
      
      // Emit health check results
      this.emit('healthCheck', {
        totalConnections: this.connectionPool.size,
        activeConnections: healthyConnections,
        healthyPercentage: (healthyConnections / this.connectionPool.size) * 100
      });
      
      // Try to create new connections if needed
      if (healthyConnections < this.config.pool.min) {
        await this.replenishConnections();
      }
      
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }
  
  /**
   * Replenish connection pool if connections are lost
   */
  private async replenishConnections(): Promise<void> {
    const currentActive = this.activeConnections.size;
    const needed = this.config.pool.min - currentActive;
    
    if (needed <= 0) return;
    
    this.logger.info(`Replenishing ${needed} connections to maintain pool minimum`);
    
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < needed; i++) {
      promises.push((async () => {
        try {
          const id = `replenish-${Date.now()}-${i}`;
          const connection = await this.createConnection(id);
          this.connectionPool.set(connection.id, connection);
          this.activeConnections.add(connection.id);
          this.metrics.totalConnections++;
        } catch (error) {
          this.logger.error('Failed to create replacement connection:', error);
        }
      })());
    }
    
    await Promise.allSettled(promises);
  }
  
  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(() => {
      this.updateUptimeMetrics();
      this.calculateErrorRate();
      this.emit('metricsUpdated', this.getMetrics());
    }, 60000); // Every minute
  }
  
  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(latency: number): void {
    this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
    this.metrics.minLatency = Math.min(this.metrics.minLatency, latency);
    
    // Calculate rolling average
    const samples = 100; // Keep last 100 samples
    this.metrics.avgLatency = (this.metrics.avgLatency * (samples - 1) + latency) / samples;
  }
  
  /**
   * Update uptime metrics
   */
  private updateUptimeMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime;
  }
  
  /**
   * Calculate error rate
   */
  private calculateErrorRate(): void {
    const totalOperations = this.metrics.commandsProcessed + this.metrics.failedConnections;
    this.metrics.errorRate = totalOperations > 0 
      ? this.metrics.failedConnections / totalOperations 
      : 0;
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get pool status
   */
  getPoolStatus(): {
    total: number;
    active: number;
    inactive: number;
    connections: Array<{
      id: string;
      isActive: boolean;
      totalUses: number;
      errorCount: number;
      latency: number;
      lastUsed: Date;
    }>;
  } {
    const connections = Array.from(this.connectionPool.values()).map(conn => ({
      id: conn.id,
      isActive: conn.isActive,
      totalUses: conn.totalUses,
      errorCount: conn.errorCount,
      latency: conn.latency,
      lastUsed: conn.lastUsed
    }));
    
    return {
      total: this.connectionPool.size,
      active: this.activeConnections.size,
      inactive: this.connectionPool.size - this.activeConnections.size,
      connections
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.logger.info('Shutting down Redis cluster...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    // Close all connections
    const disconnectPromises = Array.from(this.connectionPool.values()).map(
      async (pooledConnection) => {
        try {
          await pooledConnection.connection.quit();
        } catch (error) {
          this.logger.warn(`Error disconnecting connection ${pooledConnection.id}:`, error);
        }
      }
    );
    
    await Promise.allSettled(disconnectPromises);
    
    this.connectionPool.clear();
    this.activeConnections.clear();
    
    this.logger.info('Redis cluster shutdown completed');
    this.emit('shutdown');
  }
  
  /**
   * Check if cluster is healthy
   */
  isHealthy(): boolean {
    const healthyThreshold = Math.ceil(this.config.pool.min * 0.5); // At least 50% of min connections
    return this.activeConnections.size >= healthyThreshold && !this.circuitBreakerOpen;
  }
  
  /**
   * Force refresh all connections (useful for credential rotation)
   */
  async refreshConnections(): Promise<void> {
    this.logger.info('Force refreshing all Redis connections...');
    
    // Close existing connections
    for (const [id, connection] of this.connectionPool) {
      try {
        await connection.connection.quit();
      } catch (error) {
        this.logger.warn(`Error closing connection ${id}:`, error);
      }
    }
    
    this.connectionPool.clear();
    this.activeConnections.clear();
    
    // Recreate connection pool
    await this.createConnectionPool();
    
    this.logger.info('All Redis connections refreshed');
  }
}
