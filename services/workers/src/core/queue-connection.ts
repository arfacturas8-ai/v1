import Redis, { RedisOptions, Cluster } from 'ioredis';
import { Logger } from 'pino';

export interface QueueConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  username?: string;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  // Clustering support
  cluster?: {
    enabled: boolean;
    nodes: Array<{ host: string; port: number }>;
    options?: any;
  };
  // Connection pooling
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
  // Sentinel support
  sentinel?: {
    sentinels: Array<{ host: string; port: number }>;
    name: string;
    password?: string;
  };
}

export class CrashProofRedisConnection {
  private redis: Redis | Cluster | null = null;
  private connectionPool: Array<Redis | Cluster> = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private baseReconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    avgLatency: 0,
    lastHealthCheck: new Date()
  };

  constructor(
    private config: QueueConnectionConfig,
    private logger: Logger
  ) {
    this.startHealthChecking();
  }

  async connect(): Promise<Redis | Cluster> {
    if (this.redis && this.redis.status === 'ready') {
      return this.redis;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.redis && this.redis.status === 'ready') {
            resolve(this.redis);
          } else if (!this.isConnecting) {
            reject(new Error('Connection attempt failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    try {
      // Check if cluster mode is enabled
      if (this.config.cluster?.enabled) {
        this.redis = await this.createClusterConnection();
      } else if (this.config.sentinel) {
        this.redis = await this.createSentinelConnection();
      } else {
        this.redis = await this.createStandaloneConnection();
      }

      // Initialize connection pool if configured
      if (this.config.pool) {
        await this.initializeConnectionPool();
      }

      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.connectionMetrics.totalConnections++;
      this.connectionMetrics.activeConnections++;
      
      this.logger.info('Redis connection established successfully', {
        type: this.config.cluster?.enabled ? 'cluster' : 'standalone',
        host: this.config.host,
        port: this.config.port
      });
      this.notifyConnectionListeners(true);
      
      return this.redis;
    } catch (error) {
      this.isConnecting = false;
      this.connectionMetrics.failedConnections++;
      this.logger.error('Failed to connect to Redis:', error);
      
      // Attempt reconnection with exponential backoff
      await this.scheduleReconnection();
      
      throw error;
    }
  }

  private async createStandaloneConnection(): Promise<Redis> {
    const redisOptions: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      db: this.config.db || 0,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
      retryDelayOnFailover: this.config.retryDelayOnFailover || 100,
      enableReadyCheck: this.config.enableReadyCheck !== false,
      lazyConnect: true,
      keepAlive: this.config.keepAlive || 30000,
      family: this.config.family || 4,
      connectTimeout: this.config.connectTimeout || 10000,
      commandTimeout: this.config.commandTimeout || 5000,
      retryDelayOnClusterDown: 300,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'NOREPLICAS', 'LOADING'];
        return targetErrors.some(target => err.message.includes(target));
      },
      // Performance optimizations for queue workloads
      enableAutoPipelining: true,
      maxLoadingTimeout: 5000
    };

    const redis = new Redis(redisOptions);
    this.setupEventHandlers(redis);
    await redis.connect();
    return redis;
  }

  private async createClusterConnection(): Promise<Cluster> {
    if (!this.config.cluster?.nodes) {
      throw new Error('Cluster nodes not configured');
    }

    const clusterOptions = {
      enableAutoPipelining: true,
      redisOptions: {
        username: this.config.username,
        password: this.config.password,
        connectTimeout: this.config.connectTimeout || 10000,
        commandTimeout: this.config.commandTimeout || 5000,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
        retryDelayOnFailover: this.config.retryDelayOnFailover || 100,
        keepAlive: this.config.keepAlive || 30000,
        family: this.config.family || 4
      },
      ...this.config.cluster.options
    };

    const cluster = new Cluster(this.config.cluster.nodes, clusterOptions);
    this.setupEventHandlers(cluster);
    await new Promise<void>((resolve, reject) => {
      cluster.on('ready', resolve);
      cluster.on('error', reject);
    });
    return cluster;
  }

  private async createSentinelConnection(): Promise<Redis> {
    if (!this.config.sentinel) {
      throw new Error('Sentinel configuration not provided');
    }

    const redisOptions: RedisOptions = {
      sentinels: this.config.sentinel.sentinels,
      name: this.config.sentinel.name,
      username: this.config.username,
      password: this.config.password,
      sentinelPassword: this.config.sentinel.password,
      db: this.config.db || 0,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
      retryDelayOnFailover: this.config.retryDelayOnFailover || 100,
      enableReadyCheck: this.config.enableReadyCheck !== false,
      lazyConnect: true,
      keepAlive: this.config.keepAlive || 30000,
      family: this.config.family || 4,
      connectTimeout: this.config.connectTimeout || 10000,
      commandTimeout: this.config.commandTimeout || 5000,
      enableAutoPipelining: true
    };

    const redis = new Redis(redisOptions);
    this.setupEventHandlers(redis);
    await redis.connect();
    return redis;
  }

  private async initializeConnectionPool(): Promise<void> {
    if (!this.config.pool) return;

    const poolSize = this.config.pool.min || 2;
    this.logger.info(`Initializing connection pool with ${poolSize} connections`);

    for (let i = 0; i < poolSize; i++) {
      try {
        let connection: Redis | Cluster;
        if (this.config.cluster?.enabled) {
          connection = await this.createClusterConnection();
        } else if (this.config.sentinel) {
          connection = await this.createSentinelConnection();
        } else {
          connection = await this.createStandaloneConnection();
        }
        this.connectionPool.push(connection);
      } catch (error) {
        this.logger.error(`Failed to create pooled connection ${i + 1}:`, error);
      }
    }

    this.logger.info(`Connection pool initialized with ${this.connectionPool.length} connections`);
  }

  private setupEventHandlers(connection: Redis | Cluster): void {
    connection.on('connect', () => {
      this.logger.info('Redis connection initiated');
    });

    connection.on('ready', () => {
      this.logger.info('Redis connection ready');
      this.reconnectAttempts = 0;
      this.connectionMetrics.activeConnections++;
      this.notifyConnectionListeners(true);
    });

    connection.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
      this.connectionMetrics.failedConnections++;
      this.notifyConnectionListeners(false);
    });

    connection.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.connectionMetrics.activeConnections = Math.max(0, this.connectionMetrics.activeConnections - 1);
      this.notifyConnectionListeners(false);
    });

    connection.on('reconnecting', (ms) => {
      this.logger.info(`Redis reconnecting in ${ms}ms`);
    });

    connection.on('end', () => {
      this.logger.warn('Redis connection ended');
      this.connectionMetrics.activeConnections = Math.max(0, this.connectionMetrics.activeConnections - 1);
      this.notifyConnectionListeners(false);
      this.scheduleReconnection();
    });

    // Cluster-specific events
    if (connection instanceof Cluster) {
      connection.on('node error', (error, node) => {
        this.logger.error(`Redis cluster node error for ${node.options.host}:${node.options.port}:`, error);
      });

      connection.on('+node', (node) => {
        this.logger.info(`Redis cluster node added: ${node.options.host}:${node.options.port}`);
      });

      connection.on('-node', (node) => {
        this.logger.info(`Redis cluster node removed: ${node.options.host}:${node.options.port}`);
      });
    }
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Health check every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const start = Date.now();
      const isHealthy = await this.ping();
      const latency = Date.now() - start;

      this.connectionMetrics.avgLatency = (this.connectionMetrics.avgLatency + latency) / 2;
      this.connectionMetrics.lastHealthCheck = new Date();

      if (!isHealthy && this.redis?.status === 'ready') {
        this.logger.warn('Health check failed but connection appears ready');
        this.notifyConnectionListeners(false);
      }

      // Health check for connection pool
      if (this.connectionPool.length > 0) {
        const poolHealthPromises = this.connectionPool.map(async (conn, index) => {
          try {
            await conn.ping();
            return true;
          } catch (error) {
            this.logger.warn(`Pool connection ${index} health check failed:`, error);
            return false;
          }
        });

        const poolResults = await Promise.allSettled(poolHealthPromises);
        const healthyConnections = poolResults.filter(result => 
          result.status === 'fulfilled' && result.value === true
        ).length;

        this.logger.debug(`Pool health check: ${healthyConnections}/${this.connectionPool.length} connections healthy`);
      }

    } catch (error) {
      this.logger.error('Health check error:', error);
    }
  }

  private async scheduleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    const jitter = Math.random() * 0.1 * delay;
    const finalDelay = delay + jitter;

    this.logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${Math.round(finalDelay)}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      }
    }, finalDelay);
  }

  async disconnect(): Promise<void> {
    try {
      // Stop health checking
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Disconnect main connection
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
      }

      // Disconnect pool connections
      if (this.connectionPool.length > 0) {
        const disconnectPromises = this.connectionPool.map(async (conn, index) => {
          try {
            await conn.quit();
          } catch (error) {
            this.logger.warn(`Error disconnecting pool connection ${index}:`, error);
          }
        });

        await Promise.allSettled(disconnectPromises);
        this.connectionPool = [];
      }

      this.connectionMetrics.activeConnections = 0;
      this.logger.info('All Redis connections disconnected');
    } catch (error) {
      this.logger.error('Error during disconnect:', error);
      throw error;
    }
  }

  getConnection(): Redis | Cluster | null {
    return this.redis;
  }

  getConnectionFromPool(): Redis | Cluster | null {
    if (this.connectionPool.length === 0) {
      return this.redis;
    }

    // Simple round-robin selection
    const connection = this.connectionPool.find(conn => conn.status === 'ready');
    return connection || this.redis;
  }

  isConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  getConnectionMetrics() {
    return { ...this.connectionMetrics };
  }

  onConnectionChange(listener: (connected: boolean) => void): void {
    this.connectionListeners.add(listener);
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.delete(listener);
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        this.logger.error('Error in connection listener:', error);
      }
    });
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.redis || this.redis.status !== 'ready') {
        return false;
      }
      
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    try {
      if (!this.redis || this.redis.status !== 'ready') {
        return { connected: false, error: 'Redis not connected' };
      }

      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return { connected: true, latency };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}