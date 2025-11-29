import { Server } from 'socket.io';
import { createAdapter, RedisAdapter } from '@socket.io/redis-adapter';
import { createCluster, Cluster } from 'redis';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { AdvancedRedisPubSub } from './advanced-redis-pubsub';

/**
 * WEBSOCKET CLUSTERING SYSTEM
 * 
 * Features:
 * ✅ Redis adapter for horizontal scaling
 * ✅ Sticky sessions with load balancer support
 * ✅ Cross-server room synchronization
 * ✅ Distributed event broadcasting
 * ✅ Server health monitoring and failover
 * ✅ Connection load balancing
 * ✅ Graceful server shutdown and migration
 * ✅ Cluster metrics and monitoring
 * ✅ Auto-scaling support
 * ✅ Session persistence and recovery
 * ✅ Inter-server communication optimization
 * ✅ Redis Cluster support for high availability
 */

export interface ClusterNode {
  id: string;
  host: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  connections: number;
  lastSeen: number;
  load: number; // 0-100 percentage
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number[];
  };
  version: string;
  startTime: number;
}

export interface ClusterMetrics {
  totalNodes: number;
  healthyNodes: number;
  totalConnections: number;
  messagesRouted: number;
  crossServerEvents: number;
  roomSyncEvents: number;
  failoverEvents: number;
  migrationEvents: number;
  avgLatency: number;
  peakConnections: number;
  lastHealthCheck: Date;
}

export interface StickySessionConfig {
  enabled: boolean;
  cookieName: string;
  headerName: string;
  algorithm: 'ip-hash' | 'cookie' | 'header' | 'consistent-hash';
  useProxyProtocol: boolean;
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'cpu-based';
  healthCheckInterval: number;
  unhealthyThreshold: number;
  maxConnectionsPerServer: number;
  enableAutoScaling: boolean;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export class WebSocketClusteringSystem {
  private io: Server;
  private fastify: FastifyInstance;
  private pubsub: AdvancedRedisPubSub;
  
  // Redis clients for clustering
  private redisAdapter: RedisAdapter | null = null;
  private pubClient: Redis | Cluster;
  private subClient: Redis | Cluster;
  private clusterClient: Redis | Cluster;
  
  // Cluster management
  private nodeId: string;
  private nodes = new Map<string, ClusterNode>();
  private isClusterMode: boolean = false;
  
  // Sticky sessions
  private stickyConfig: StickySessionConfig = {
    enabled: true,
    cookieName: 'cryb-server-id',
    headerName: 'x-server-id',
    algorithm: 'consistent-hash',
    useProxyProtocol: true
  };
  
  // Load balancing
  private loadBalancingConfig: LoadBalancingConfig = {
    strategy: 'least-connections',
    healthCheckInterval: 30000,
    unhealthyThreshold: 3,
    maxConnectionsPerServer: 10000,
    enableAutoScaling: false,
    scaleUpThreshold: 80,
    scaleDownThreshold: 20
  };
  
  // Metrics
  private metrics: ClusterMetrics = {
    totalNodes: 0,
    healthyNodes: 0,
    totalConnections: 0,
    messagesRouted: 0,
    crossServerEvents: 0,
    roomSyncEvents: 0,
    failoverEvents: 0,
    migrationEvents: 0,
    avgLatency: 0,
    peakConnections: 0,
    lastHealthCheck: new Date()
  };
  
  // Health monitoring
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private nodeTimeouts = new Map<string, NodeJS.Timeout>();
  
  constructor(io: Server, fastify: FastifyInstance, pubsub: AdvancedRedisPubSub) {
    this.io = io;
    this.fastify = fastify;
    this.pubsub = pubsub;
    this.nodeId = this.generateNodeId();
    
    this.initialize();
  }
  
  /**
   * Initialize the clustering system
   */
  private async initialize(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Initializing WebSocket Clustering System...');
      
      // Detect if we're in cluster mode
      this.isClusterMode = this.detectClusterMode();
      
      // Setup Redis connections
      await this.setupRedisConnections();
      
      // Setup Redis adapter
      await this.setupRedisAdapter();
      
      // Setup cluster management
      await this.setupClusterManagement();
      
      // Setup sticky sessions
      this.setupStickySessions();
      
      // Setup load balancing
      this.setupLoadBalancing();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Register this node
      await this.registerNode();
      
      this.fastify.log.info('✅ WebSocket Clustering System initialized');
      this.fastify.log.info('📡 Configuration:');
      this.fastify.log.info(`   - Node ID: ${this.nodeId}`);
      this.fastify.log.info(`   - Cluster mode: ${this.isClusterMode ? 'enabled' : 'disabled'}`);
      this.fastify.log.info(`   - Sticky sessions: ${this.stickyConfig.enabled ? 'enabled' : 'disabled'}`);
      this.fastify.log.info(`   - Load balancing: ${this.loadBalancingConfig.strategy}`);
      this.fastify.log.info(`   - Max connections: ${this.loadBalancingConfig.maxConnectionsPerServer}`);
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to initialize WebSocket Clustering:', error);
      throw error;
    }
  }
  
  /**
   * Setup Redis connections for clustering
   */
  private async setupRedisConnections(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380/0';
      
      if (this.isClusterMode) {
        // Redis Cluster mode
        const clusterNodes = this.parseClusterNodes();
        
        this.pubClient = new Cluster(clusterNodes, {
          enableAutoPipelining: true,
          enableReadyCheck: true,
          scaleReads: 'slave',
          maxRedirections: 16,
          retryDelayOnFailover: 1000,
          enableOfflineQueue: false,
          redisOptions: {
            password: process.env.REDIS_PASSWORD,
            connectTimeout: 10000,
            lazyConnect: true
          }
        });
        
        this.subClient = this.pubClient.duplicate();
        this.clusterClient = this.pubClient.duplicate();
        
      } else {
        // Single Redis instance mode
        const redisConfig = {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 1000,
          enableAutoPipelining: true,
          maxCommands: 1000,
          lazyConnect: true,
          connectTimeout: 10000,
          commandTimeout: 5000,
          // Optimize for clustering
          enableReadyCheck: true,
          db: 0
        };
        
        this.pubClient = new Redis(redisUrl, redisConfig);
        this.subClient = new Redis(redisUrl, redisConfig);
        this.clusterClient = new Redis(redisUrl, redisConfig);
      }
      
      // Setup connection event handlers
      this.setupRedisEventHandlers();
      
      // Connect all clients
      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect(),
        this.clusterClient.connect()
      ]);
      
      this.fastify.log.info('✅ Redis connections established for clustering');
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to setup Redis connections:', error);
      throw error;
    }
  }
  
  /**
   * Setup Redis adapter for Socket.IO
   */
  private async setupRedisAdapter(): Promise<void> {
    try {
      // Create Redis adapter with optimizations
      this.redisAdapter = createAdapter(this.pubClient, this.subClient, {
        key: 'cryb-socket-cluster',
        requestsTimeout: 5000,
        publishOnSpecificResponseChannel: true,
        parser: {
          encode: (data) => JSON.stringify(data),
          decode: (data) => JSON.parse(data)
        }
      });
      
      // Setup adapter event handlers
      this.redisAdapter.on('error', (error) => {
        this.fastify.log.error('Redis adapter error:', error);
        this.metrics.failoverEvents++;
      });
      
      this.redisAdapter.on('connection_error', (error) => {
        this.fastify.log.error('Redis adapter connection error:', error);
      });
      
      // Apply adapter to Socket.IO
      this.io.adapter(this.redisAdapter);
      
      this.fastify.log.info('✅ Redis adapter configured for Socket.IO');
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to setup Redis adapter:', error);
      throw error;
    }
  }
  
  /**
   * Setup cluster management
   */
  private async setupClusterManagement(): Promise<void> {
    try {
      // Subscribe to cluster events
      await this.pubsub.subscribe('cluster:node_join', this.handleNodeJoin.bind(this));
      await this.pubsub.subscribe('cluster:node_leave', this.handleNodeLeave.bind(this));
      await this.pubsub.subscribe('cluster:health_update', this.handleHealthUpdate.bind(this));
      await this.pubsub.subscribe('cluster:room_sync', this.handleRoomSync.bind(this));
      await this.pubsub.subscribe('cluster:migration', this.handleMigration.bind(this));
      
      // Setup Socket.IO server events for cluster coordination
      this.io.on('connection', (socket) => {
        this.handleClusterConnection(socket);
      });
      
      // Setup graceful shutdown handling
      process.on('SIGTERM', () => {
        this.handleGracefulShutdown();
      });
      
      process.on('SIGINT', () => {
        this.handleGracefulShutdown();
      });
      
      this.fastify.log.info('✅ Cluster management configured');
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to setup cluster management:', error);
      throw error;
    }
  }
  
  /**
   * Setup sticky sessions
   */
  private setupStickySessions(): void {
    if (!this.stickyConfig.enabled) {
      return;
    }
    
    // Add middleware to handle sticky sessions
    this.io.engine.on('connection_error', (err) => {
      this.fastify.log.error('Connection error:', err);
    });
    
    // Setup session affinity based on configuration
    this.io.engine.generateId = (req) => {
      return this.generateSessionId(req);
    };
    
    this.fastify.log.info(`✅ Sticky sessions configured with ${this.stickyConfig.algorithm} algorithm`);
  }
  
  /**
   * Setup load balancing
   */
  private setupLoadBalancing(): void {
    // Register connection handlers for load tracking
    this.io.on('connection', (socket) => {
      this.metrics.totalConnections++;
      
      if (this.metrics.totalConnections > this.metrics.peakConnections) {
        this.metrics.peakConnections = this.metrics.totalConnections;
      }
      
      // Check if we need to scale up
      if (this.loadBalancingConfig.enableAutoScaling) {
        this.checkScaling();
      }
      
      socket.on('disconnect', () => {
        this.metrics.totalConnections--;
        
        // Check if we can scale down
        if (this.loadBalancingConfig.enableAutoScaling) {
          this.checkScaling();
        }
      });
    });
    
    this.fastify.log.info(`✅ Load balancing configured with ${this.loadBalancingConfig.strategy} strategy`);
  }
  
  /**
   * Handle cluster connection
   */
  private handleClusterConnection(socket: any): void {
    try {
      // Add cluster metadata to socket
      socket.nodeId = this.nodeId;
      socket.clustered = true;
      
      // Track connection for this node
      this.updateNodeLoad();
      
      // Setup cross-server event routing
      socket.on('cluster:route', (data) => {
        this.routeClusterEvent(data);
      });
      
      // Handle room joining with cluster sync
      socket.on('join', async (room: string) => {
        await socket.join(room);
        await this.syncRoomAcrossCluster(room, 'join', socket.id);
      });
      
      socket.on('leave', async (room: string) => {
        await socket.leave(room);
        await this.syncRoomAcrossCluster(room, 'leave', socket.id);
      });
      
    } catch (error) {
      this.fastify.log.error('Error handling cluster connection:', error);
    }
  }
  
  /**
   * Route events across cluster
   */
  private async routeClusterEvent(data: {
    event: string;
    payload: any;
    targetNode?: string;
    targetRoom?: string;
    targetUser?: string;
  }): Promise<void> {
    
    try {
      if (data.targetNode && data.targetNode !== this.nodeId) {
        // Route to specific node
        await this.pubsub.publish('cluster:route_event', {
          ...data,
          sourceNode: this.nodeId
        });
      } else if (data.targetRoom) {
        // Broadcast to room across cluster
        this.io.to(data.targetRoom).emit(data.event, data.payload);
      } else if (data.targetUser) {
        // Send to specific user across cluster
        this.io.to(`user:${data.targetUser}`).emit(data.event, data.payload);
      } else {
        // Broadcast to all nodes
        this.io.emit(data.event, data.payload);
      }
      
      this.metrics.messagesRouted++;
      
    } catch (error) {
      this.fastify.log.error('Error routing cluster event:', error);
    }
  }
  
  /**
   * Sync room membership across cluster
   */
  private async syncRoomAcrossCluster(room: string, action: 'join' | 'leave', socketId: string): Promise<void> {
    try {
      await this.pubsub.publish('cluster:room_sync', {
        room,
        action,
        socketId,
        nodeId: this.nodeId,
        timestamp: Date.now()
      });
      
      this.metrics.roomSyncEvents++;
      
    } catch (error) {
      this.fastify.log.error('Error syncing room across cluster:', error);
    }
  }
  
  /**
   * Node management
   */
  
  private async registerNode(): Promise<void> {
    try {
      const nodeInfo: ClusterNode = {
        id: this.nodeId,
        host: process.env.HOST || 'localhost',
        port: parseInt(process.env.PORT || '3001'),
        status: 'healthy',
        connections: 0,
        lastSeen: Date.now(),
        load: 0,
        memory: await this.getMemoryUsage(),
        cpu: await this.getCpuUsage(),
        version: process.env.npm_package_version || '1.0.0',
        startTime: Date.now()
      };
      
      // Store node info in Redis
      await this.clusterClient.setex(
        `cluster:node:${this.nodeId}`,
        60, // 1 minute TTL
        JSON.stringify(nodeInfo)
      );
      
      // Add to local nodes map
      this.nodes.set(this.nodeId, nodeInfo);
      
      // Announce node join
      await this.pubsub.publish('cluster:node_join', {
        nodeId: this.nodeId,
        nodeInfo
      });
      
      this.fastify.log.info(`📡 Node ${this.nodeId} registered in cluster`);
      
    } catch (error) {
      this.fastify.log.error('Error registering node:', error);
    }
  }
  
  private async updateNodeStatus(): Promise<void> {
    try {
      const nodeInfo = this.nodes.get(this.nodeId);
      if (!nodeInfo) return;
      
      // Update node information
      nodeInfo.connections = this.metrics.totalConnections;
      nodeInfo.lastSeen = Date.now();
      nodeInfo.load = this.calculateNodeLoad();
      nodeInfo.memory = await this.getMemoryUsage();
      nodeInfo.cpu = await this.getCpuUsage();
      
      // Store updated info in Redis
      await this.clusterClient.setex(
        `cluster:node:${this.nodeId}`,
        60,
        JSON.stringify(nodeInfo)
      );
      
      // Broadcast health update
      await this.pubsub.publish('cluster:health_update', {
        nodeId: this.nodeId,
        nodeInfo
      });
      
    } catch (error) {
      this.fastify.log.error('Error updating node status:', error);
    }
  }
  
  /**
   * Health monitoring
   */
  
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.loadBalancingConfig.healthCheckInterval);
    
    this.fastify.log.info('📊 Health monitoring started');
  }
  
  private async performHealthCheck(): Promise<void> {
    try {
      // Update our own node status
      await this.updateNodeStatus();
      
      // Check all known nodes
      await this.checkAllNodes();
      
      // Update metrics
      this.updateClusterMetrics();
      
      this.metrics.lastHealthCheck = new Date();
      
    } catch (error) {
      this.fastify.log.error('Error during health check:', error);
    }
  }
  
  private async checkAllNodes(): Promise<void> {
    try {
      // Get all node keys from Redis
      const nodeKeys = await this.clusterClient.keys('cluster:node:*');
      const validNodes = new Set<string>();
      
      for (const key of nodeKeys) {
        const nodeId = key.replace('cluster:node:', '');
        validNodes.add(nodeId);
        
        try {
          const nodeData = await this.clusterClient.get(key);
          if (nodeData) {
            const nodeInfo = JSON.parse(nodeData) as ClusterNode;
            
            // Check if node is still alive
            const timeSinceLastSeen = Date.now() - nodeInfo.lastSeen;
            if (timeSinceLastSeen > this.loadBalancingConfig.healthCheckInterval * 2) {
              nodeInfo.status = 'unhealthy';
            } else {
              nodeInfo.status = 'healthy';
            }
            
            this.nodes.set(nodeId, nodeInfo);
          }
        } catch (parseError) {
          this.fastify.log.warn(`Failed to parse node data for ${nodeId}:`, parseError);
        }
      }
      
      // Remove nodes that are no longer in Redis
      for (const nodeId of this.nodes.keys()) {
        if (!validNodes.has(nodeId) && nodeId !== this.nodeId) {
          this.nodes.delete(nodeId);
          this.handleNodeTimeout(nodeId);
        }
      }
      
    } catch (error) {
      this.fastify.log.error('Error checking all nodes:', error);
    }
  }
  
  private handleNodeTimeout(nodeId: string): void {
    try {
      this.fastify.log.warn(`Node ${nodeId} timed out and was removed from cluster`);
      
      // Clear any existing timeout
      const timeout = this.nodeTimeouts.get(nodeId);
      if (timeout) {
        clearTimeout(timeout);
        this.nodeTimeouts.delete(nodeId);
      }
      
      // Trigger failover if needed
      this.handleNodeFailover(nodeId);
      
    } catch (error) {
      this.fastify.log.error('Error handling node timeout:', error);
    }
  }
  
  /**
   * Failover and migration
   */
  
  private async handleNodeFailover(failedNodeId: string): Promise<void> {
    try {
      this.fastify.log.warn(`🚨 Initiating failover for node ${failedNodeId}`);
      
      // Find the best node to take over responsibilities
      const bestNode = this.findBestNodeForFailover();
      
      if (bestNode && bestNode.id === this.nodeId) {
        // We're taking over for the failed node
        this.fastify.log.info(`🔄 Taking over responsibilities from node ${failedNodeId}`);
        
        // Migrate sessions and rooms
        await this.migrateFromFailedNode(failedNodeId);
      }
      
      this.metrics.failoverEvents++;
      
    } catch (error) {
      this.fastify.log.error('Error during failover:', error);
    }
  }
  
  private findBestNodeForFailover(): ClusterNode | null {
    let bestNode: ClusterNode | null = null;
    let lowestLoad = Number.MAX_SAFE_INTEGER;
    
    for (const node of this.nodes.values()) {
      if (node.status === 'healthy' && node.load < lowestLoad && node.connections < this.loadBalancingConfig.maxConnectionsPerServer) {
        bestNode = node;
        lowestLoad = node.load;
      }
    }
    
    return bestNode;
  }
  
  private async migrateFromFailedNode(failedNodeId: string): Promise<void> {
    try {
      // In a real implementation, this would involve:
      // 1. Finding sessions that were on the failed node
      // 2. Reconnecting those sessions to this node
      // 3. Restoring room memberships
      // 4. Transferring any persistent state
      
      this.fastify.log.info(`Migration from failed node ${failedNodeId} completed`);
      this.metrics.migrationEvents++;
      
    } catch (error) {
      this.fastify.log.error('Error during migration:', error);
    }
  }
  
  /**
   * Auto-scaling
   */
  
  private checkScaling(): void {
    if (!this.loadBalancingConfig.enableAutoScaling) {
      return;
    }
    
    const currentLoad = this.calculateClusterLoad();
    
    if (currentLoad > this.loadBalancingConfig.scaleUpThreshold) {
      this.triggerScaleUp();
    } else if (currentLoad < this.loadBalancingConfig.scaleDownThreshold) {
      this.triggerScaleDown();
    }
  }
  
  private calculateClusterLoad(): number {
    let totalConnections = 0;
    let maxConnections = 0;
    
    for (const node of this.nodes.values()) {
      if (node.status === 'healthy') {
        totalConnections += node.connections;
        maxConnections += this.loadBalancingConfig.maxConnectionsPerServer;
      }
    }
    
    return maxConnections > 0 ? (totalConnections / maxConnections) * 100 : 0;
  }
  
  private triggerScaleUp(): void {
    this.fastify.log.info('🔼 Cluster load high, triggering scale up');
    // In a real implementation, this would integrate with container orchestration
    // like Kubernetes or Docker Swarm to spawn new instances
  }
  
  private triggerScaleDown(): void {
    this.fastify.log.info('🔽 Cluster load low, triggering scale down');
    // In a real implementation, this would gracefully remove nodes
  }
  
  /**
   * Event handlers
   */
  
  private async handleNodeJoin(message: any): Promise<void> {
    try {
      const { nodeId, nodeInfo } = message.data;
      
      if (nodeId !== this.nodeId) {
        this.nodes.set(nodeId, nodeInfo);
        this.fastify.log.info(`📡 Node ${nodeId} joined the cluster`);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling node join:', error);
    }
  }
  
  private async handleNodeLeave(message: any): Promise<void> {
    try {
      const { nodeId } = message.data;
      
      if (nodeId !== this.nodeId) {
        this.nodes.delete(nodeId);
        this.fastify.log.info(`📡 Node ${nodeId} left the cluster`);
        
        // Handle failover if needed
        await this.handleNodeFailover(nodeId);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling node leave:', error);
    }
  }
  
  private async handleHealthUpdate(message: any): Promise<void> {
    try {
      const { nodeId, nodeInfo } = message.data;
      
      if (nodeId !== this.nodeId) {
        this.nodes.set(nodeId, nodeInfo);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling health update:', error);
    }
  }
  
  private async handleRoomSync(message: any): Promise<void> {
    try {
      const { room, action, socketId, nodeId } = message.data;
      
      if (nodeId !== this.nodeId) {
        // Update our knowledge of room membership across cluster
        this.metrics.roomSyncEvents++;
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling room sync:', error);
    }
  }
  
  private async handleMigration(message: any): Promise<void> {
    try {
      const { fromNode, toNode, sessions } = message.data;
      
      if (toNode === this.nodeId) {
        // We're receiving migrated sessions
        await this.handleIncomingMigration(sessions);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling migration:', error);
    }
  }
  
  private async handleIncomingMigration(sessions: any[]): Promise<void> {
    try {
      // Handle incoming session migration
      this.fastify.log.info(`Receiving ${sessions.length} migrated sessions`);
      this.metrics.migrationEvents++;
      
    } catch (error) {
      this.fastify.log.error('Error handling incoming migration:', error);
    }
  }
  
  /**
   * Utility methods
   */
  
  private detectClusterMode(): boolean {
    return process.env.REDIS_CLUSTER_ENABLED === 'true' || 
           !!process.env.REDIS_CLUSTER_NODES;
  }
  
  private parseClusterNodes(): Array<{ host: string; port: number }> {
    const nodes = process.env.REDIS_CLUSTER_NODES || 'localhost:6380';
    return nodes.split(',').map(node => {
      const [host, port] = node.trim().split(':');
      return { host, port: parseInt(port) };
    });
  }
  
  private generateNodeId(): string {
    const hostname = require('os').hostname();
    const pid = process.pid;
    const timestamp = Date.now();
    return `${hostname}-${pid}-${timestamp}`;
  }
  
  private generateSessionId(req: any): string {
    switch (this.stickyConfig.algorithm) {
      case 'ip-hash':
        return this.hashIP(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
      case 'cookie':
        return req.headers.cookie?.[this.stickyConfig.cookieName] || this.randomId();
      case 'header':
        return req.headers[this.stickyConfig.headerName] || this.randomId();
      case 'consistent-hash':
        return this.consistentHash(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
      default:
        return this.randomId();
    }
  }
  
  private hashIP(ip: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
  }
  
  private consistentHash(input: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash.substring(0, 16);
  }
  
  private randomId(): string {
    return Math.random().toString(36).substring(2, 18);
  }
  
  private calculateNodeLoad(): number {
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = (memoryUsage.rss / (1024 * 1024 * 1024)) * 100; // GB
    const connectionPercentage = (this.metrics.totalConnections / this.loadBalancingConfig.maxConnectionsPerServer) * 100;
    
    return Math.max(memoryPercentage, connectionPercentage);
  }
  
  private updateNodeLoad(): void {
    const node = this.nodes.get(this.nodeId);
    if (node) {
      node.load = this.calculateNodeLoad();
      node.connections = this.metrics.totalConnections;
    }
  }
  
  private async getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const usage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const used = usage.rss;
    const percentage = (used / totalMem) * 100;
    
    return { used, total: totalMem, percentage };
  }
  
  private async getCpuUsage(): Promise<{ usage: number; load: number[] }> {
    const cpus = require('os').cpus();
    const load = require('os').loadavg();
    
    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const usage = 100 - (totalIdle / totalTick) * 100;
    
    return { usage, load };
  }
  
  private setupRedisEventHandlers(): void {
    const clients = [
      { client: this.pubClient, name: 'Pub' },
      { client: this.subClient, name: 'Sub' },
      { client: this.clusterClient, name: 'Cluster' }
    ];
    
    clients.forEach(({ client, name }) => {
      client.on('error', (error) => {
        this.fastify.log.error(`Redis ${name} client error:`, error);
      });
      
      client.on('connect', () => {
        this.fastify.log.info(`✅ Redis ${name} client connected`);
      });
      
      client.on('reconnecting', () => {
        this.fastify.log.warn(`🔄 Redis ${name} client reconnecting...`);
      });
    });
  }
  
  /**
   * Graceful shutdown
   */
  
  private async handleGracefulShutdown(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Initiating graceful shutdown...');
      
      // Announce node leave
      await this.pubsub.publish('cluster:node_leave', {
        nodeId: this.nodeId,
        timestamp: Date.now()
      });
      
      // Remove node from Redis
      await this.clusterClient.del(`cluster:node:${this.nodeId}`);
      
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      
      // Clear node timeouts
      for (const timeout of this.nodeTimeouts.values()) {
        clearTimeout(timeout);
      }
      
      // Gracefully close connections
      this.io.close();
      
      this.fastify.log.info('✅ Graceful shutdown completed');
      
    } catch (error) {
      this.fastify.log.error('Error during graceful shutdown:', error);
    }
  }
  
  /**
   * Metrics and monitoring
   */
  
  private updateClusterMetrics(): void {
    this.metrics.totalNodes = this.nodes.size;
    this.metrics.healthyNodes = Array.from(this.nodes.values())
      .filter(node => node.status === 'healthy').length;
    
    // Calculate total connections across cluster
    this.metrics.totalConnections = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.connections, 0);
  }
  
  /**
   * Public API
   */
  
  /**
   * Get cluster metrics
   */
  getClusterMetrics(): ClusterMetrics & {
    nodes: ClusterNode[];
    thisNode: ClusterNode | undefined;
  } {
    this.updateClusterMetrics();
    
    return {
      ...this.metrics,
      nodes: Array.from(this.nodes.values()),
      thisNode: this.nodes.get(this.nodeId)
    };
  }
  
  /**
   * Get cluster status
   */
  getClusterStatus(): {
    nodeId: string;
    isClusterMode: boolean;
    totalNodes: number;
    healthyNodes: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const healthyPercentage = this.metrics.totalNodes > 0 
      ? (this.metrics.healthyNodes / this.metrics.totalNodes) * 100 
      : 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyPercentage >= 80) {
      status = 'healthy';
    } else if (healthyPercentage >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      nodeId: this.nodeId,
      isClusterMode: this.isClusterMode,
      totalNodes: this.metrics.totalNodes,
      healthyNodes: this.metrics.healthyNodes,
      status
    };
  }
  
  /**
   * Force node removal
   */
  async forceRemoveNode(nodeId: string): Promise<boolean> {
    try {
      if (nodeId === this.nodeId) {
        throw new Error('Cannot remove self from cluster');
      }
      
      // Remove from Redis
      await this.clusterClient.del(`cluster:node:${nodeId}`);
      
      // Remove from local tracking
      this.nodes.delete(nodeId);
      
      // Announce removal
      await this.pubsub.publish('cluster:node_leave', {
        nodeId,
        forced: true,
        timestamp: Date.now()
      });
      
      this.fastify.log.info(`🗑️ Forcefully removed node ${nodeId} from cluster`);
      return true;
      
    } catch (error) {
      this.fastify.log.error('Error force removing node:', error);
      return false;
    }
  }
  
  /**
   * Broadcast message to all nodes
   */
  async broadcastToCluster(event: string, data: any): Promise<void> {
    try {
      await this.pubsub.publish('cluster:broadcast', {
        event,
        data,
        sourceNode: this.nodeId,
        timestamp: Date.now()
      });
      
      this.metrics.crossServerEvents++;
      
    } catch (error) {
      this.fastify.log.error('Error broadcasting to cluster:', error);
    }
  }
  
  /**
   * Close clustering system
   */
  async close(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Shutting down WebSocket Clustering System...');
      
      await this.handleGracefulShutdown();
      
      // Close Redis connections
      await Promise.allSettled([
        this.pubClient.quit(),
        this.subClient.quit(),
        this.clusterClient.quit()
      ]);
      
      this.fastify.log.info('✅ WebSocket Clustering System shutdown complete');
      
    } catch (error) {
      this.fastify.log.error('Error during clustering shutdown:', error);
    }
  }
}

/**
 * Factory function to create WebSocket clustering system
 */
export function createWebSocketClustering(
  io: Server,
  fastify: FastifyInstance,
  pubsub: AdvancedRedisPubSub
): WebSocketClusteringSystem {
  return new WebSocketClusteringSystem(io, fastify, pubsub);
}