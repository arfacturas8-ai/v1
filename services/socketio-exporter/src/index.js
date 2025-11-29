/**
 * ==============================================
 * CRYB SOCKET.IO PROMETHEUS EXPORTER
 * ==============================================
 * Monitors Socket.io connections and provides Prometheus metrics
 * for real-time communication health and performance
 * ==============================================
 */

const express = require('express');
const promClient = require('prom-client');
const Redis = require('ioredis');
const axios = require('axios');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Configuration
const config = {
  port: process.env.PORT || 9466,
  apiUrl: process.env.API_URL || 'http://localhost:3002',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD || '',
  scrapeInterval: parseInt(process.env.SCRAPE_INTERVAL || '15000'),
  metricsPrefix: 'cryb_socketio_'
};

// Prometheus registry
const register = new promClient.Registry();

// Default Node.js metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'cryb_socketio_nodejs_'
});

// ==============================================
// PROMETHEUS METRICS DEFINITIONS
// ==============================================

// Connection metrics
const connectedClients = new promClient.Gauge({
  name: `${config.metricsPrefix}connected_clients`,
  help: 'Number of currently connected Socket.io clients',
  labelNames: ['namespace', 'room'],
  registers: [register]
});

const connectionAttempts = new promClient.Counter({
  name: `${config.metricsPrefix}connection_attempts_total`,
  help: 'Total number of connection attempts',
  labelNames: ['namespace', 'transport'],
  registers: [register]
});

const connectionErrors = new promClient.Counter({
  name: `${config.metricsPrefix}connection_errors_total`,
  help: 'Total number of connection errors',
  labelNames: ['namespace', 'error_type'],
  registers: [register]
});

const connectionDuration = new promClient.Histogram({
  name: `${config.metricsPrefix}connection_duration_seconds`,
  help: 'Duration of Socket.io connections',
  labelNames: ['namespace'],
  buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
  registers: [register]
});

// Message metrics
const messagesTotal = new promClient.Counter({
  name: `${config.metricsPrefix}messages_total`,
  help: 'Total number of messages sent/received',
  labelNames: ['namespace', 'event', 'direction'],
  registers: [register]
});

const messageProcessingDuration = new promClient.Histogram({
  name: `${config.metricsPrefix}message_processing_duration_seconds`,
  help: 'Time taken to process messages',
  labelNames: ['namespace', 'event'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register]
});

const messageQueueSize = new promClient.Gauge({
  name: `${config.metricsPrefix}message_queue_size`,
  help: 'Number of messages in processing queue',
  labelNames: ['namespace', 'queue_type'],
  registers: [register]
});

const messageDeliveryLatency = new promClient.Histogram({
  name: `${config.metricsPrefix}message_delivery_latency_seconds`,
  help: 'Message delivery latency',
  labelNames: ['namespace', 'room'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

// Room metrics
const totalRooms = new promClient.Gauge({
  name: `${config.metricsPrefix}total_rooms`,
  help: 'Total number of Socket.io rooms',
  labelNames: ['namespace'],
  registers: [register]
});

const roomSize = new promClient.Histogram({
  name: `${config.metricsPrefix}room_size`,
  help: 'Number of clients in rooms',
  labelNames: ['namespace', 'room_type'],
  buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500],
  registers: [register]
});

const roomJoinEvents = new promClient.Counter({
  name: `${config.metricsPrefix}room_join_events_total`,
  help: 'Total number of room join events',
  labelNames: ['namespace', 'room_type'],
  registers: [register]
});

const roomLeaveEvents = new promClient.Counter({
  name: `${config.metricsPrefix}room_leave_events_total`,
  help: 'Total number of room leave events',
  labelNames: ['namespace', 'room_type'],
  registers: [register]
});

// Performance metrics
const eventLatency = new promClient.Histogram({
  name: `${config.metricsPrefix}event_latency_seconds`,
  help: 'Latency for specific Socket.io events',
  labelNames: ['namespace', 'event'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

const throughputRate = new promClient.Gauge({
  name: `${config.metricsPrefix}throughput_rate`,
  help: 'Messages per second throughput',
  labelNames: ['namespace', 'event'],
  registers: [register]
});

const errorRate = new promClient.Gauge({
  name: `${config.metricsPrefix}error_rate_percentage`,
  help: 'Error rate percentage',
  labelNames: ['namespace', 'error_type'],
  registers: [register]
});

// Transport metrics
const transportUpgrades = new promClient.Counter({
  name: `${config.metricsPrefix}transport_upgrades_total`,
  help: 'Total number of transport upgrades',
  labelNames: ['from_transport', 'to_transport'],
  registers: [register]
});

const transportErrors = new promClient.Counter({
  name: `${config.metricsPrefix}transport_errors_total`,
  help: 'Total number of transport errors',
  labelNames: ['transport', 'error_type'],
  registers: [register]
});

// Redis pub/sub metrics
const pubsubMessages = new promClient.Counter({
  name: `${config.metricsPrefix}pubsub_messages_total`,
  help: 'Total number of Redis pub/sub messages',
  labelNames: ['direction', 'channel'],
  registers: [register]
});

const pubsubLatency = new promClient.Histogram({
  name: `${config.metricsPrefix}pubsub_latency_seconds`,
  help: 'Redis pub/sub message latency',
  labelNames: ['channel'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
  registers: [register]
});

// ==============================================
// SOCKET.IO MONITOR CLASS
// ==============================================

class SocketIOMonitor {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.metrics = new Map();
  }

  async initialize() {
    try {
      // Initialize Redis connection for monitoring
      try {
        this.redis = new Redis(config.redisUrl, {
          password: config.redisPassword,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 100, 2000);
          }
        });

        await this.redis.connect();

        logger.info('Connected to Redis for Socket.io monitoring', {
          url: config.redisUrl.replace(/:[^:]*@/, ':***@')
        });

        // Add error handler to prevent crashes
        this.redis.on('error', (err) => {
          logger.error('Redis connection error', { error: err.message });
        });
      } catch (error) {
        logger.warn('Failed to connect to Redis, continuing without Redis', { error: error.message });
        this.redis = null;
      }

      this.isConnected = true;

      // Start metrics collection
      this.startMetricsCollection();

      logger.info('Socket.io Monitor initialized successfully', {
        redis: !!this.redis
      });

    } catch (error) {
      logger.error('Failed to initialize Socket.io Monitor', { error: error.message });
      // Don't throw - allow service to start even if Redis fails
      this.isConnected = true;
    }
  }

  startMetricsCollection() {
    const collectMetrics = async () => {
      try {
        await Promise.all([
          this.collectConnectionMetrics(),
          this.collectMessageMetrics(),
          this.collectRoomMetrics(),
          this.collectRedisMetrics(),
          this.collectPerformanceMetrics()
        ]);
      } catch (error) {
        logger.error('Error collecting Socket.io metrics', { error: error.message });
      }
    };

    // Initial collection
    collectMetrics();

    // Set interval for continuous collection
    setInterval(collectMetrics, config.scrapeInterval);
    logger.info(`Started Socket.io metrics collection with ${config.scrapeInterval}ms interval`);
  }

  async collectConnectionMetrics() {
    try {
      // Get connection data from API
      const response = await axios.get(`${config.apiUrl}/internal/socketio/stats`, {
        timeout: 5000,
        headers: { 'User-Agent': 'cryb-socketio-exporter/1.0.0' }
      });

      const stats = response.data;

      // Update connection metrics
      if (stats.connections) {
        Object.entries(stats.connections).forEach(([namespace, data]) => {
          connectedClients.set({ namespace, room: 'all' }, data.total || 0);
          
          if (data.rooms) {
            Object.entries(data.rooms).forEach(([room, count]) => {
              connectedClients.set({ namespace, room }, count);
            });
          }
        });
      }

      // Update connection attempts and errors
      if (stats.events) {
        Object.entries(stats.events).forEach(([namespace, events]) => {
          if (events.connectionAttempts) {
            connectionAttempts.inc({ namespace, transport: 'websocket' }, events.connectionAttempts);
          }
          if (events.connectionErrors) {
            connectionErrors.inc({ namespace, error_type: 'generic' }, events.connectionErrors);
          }
        });
      }

    } catch (error) {
      if (error.code !== 'ECONNREFUSED') {
        logger.error('Error collecting connection metrics', { error: error.message });
      }
    }
  }

  async collectMessageMetrics() {
    try {
      if (!this.redis) return;

      // Collect message statistics from Redis
      const messageStats = await this.redis.hgetall('socketio:message_stats');

      Object.entries(messageStats).forEach(([key, value]) => {
        const [namespace, event, metric] = key.split(':');
        const numValue = parseInt(value) || 0;

        switch (metric) {
          case 'sent':
            messagesTotal.inc({ namespace, event, direction: 'outbound' }, numValue);
            break;
          case 'received':
            messagesTotal.inc({ namespace, event, direction: 'inbound' }, numValue);
            break;
          case 'queue_size':
            messageQueueSize.set({ namespace, queue_type: event }, numValue);
            break;
        }
      });

      // Calculate throughput rates
      await this.calculateThroughputRates();

    } catch (error) {
      logger.error('Error collecting message metrics', { error: error.message });
    }
  }

  async collectRoomMetrics() {
    try {
      if (!this.redis) return;

      // Get room statistics from Redis
      const roomKeys = await this.redis.keys('socketio:rooms:*');
      const namespaces = new Map();

      for (const key of roomKeys) {
        const roomData = await this.redis.hgetall(key);
        const namespace = roomData.namespace || 'default';
        const roomType = roomData.type || 'general';
        const size = parseInt(roomData.size) || 0;

        if (!namespaces.has(namespace)) {
          namespaces.set(namespace, { rooms: 0, totalSize: 0 });
        }

        const nsData = namespaces.get(namespace);
        nsData.rooms++;
        nsData.totalSize += size;

        roomSize.observe({ namespace, room_type: roomType }, size);
      }

      // Update total rooms count
      namespaces.forEach((data, namespace) => {
        totalRooms.set({ namespace }, data.rooms);
      });

    } catch (error) {
      logger.error('Error collecting room metrics', { error: error.message });
    }
  }

  async collectRedisMetrics() {
    try {
      if (!this.redis) return;

      // Monitor Redis pub/sub performance
      const pubsubStats = await this.redis.hgetall('socketio:pubsub_stats');

      Object.entries(pubsubStats).forEach(([key, value]) => {
        const [channel, metric] = key.split(':');
        const numValue = parseInt(value) || 0;

        switch (metric) {
          case 'published':
            pubsubMessages.inc({ direction: 'outbound', channel }, numValue);
            break;
          case 'received':
            pubsubMessages.inc({ direction: 'inbound', channel }, numValue);
            break;
        }
      });

    } catch (error) {
      logger.error('Error collecting Redis metrics', { error: error.message });
    }
  }

  async collectPerformanceMetrics() {
    try {
      if (!this.redis) return;

      // Collect performance data from Redis
      const perfStats = await this.redis.hgetall('socketio:performance_stats');

      Object.entries(perfStats).forEach(([key, value]) => {
        const [namespace, event, metric] = key.split(':');
        const numValue = parseFloat(value) || 0;

        switch (metric) {
          case 'latency':
            eventLatency.observe({ namespace, event }, numValue / 1000); // Convert to seconds
            break;
          case 'error_rate':
            errorRate.set({ namespace, error_type: event }, numValue);
            break;
        }
      });

    } catch (error) {
      logger.error('Error collecting performance metrics', { error: error.message });
    }
  }

  async calculateThroughputRates() {
    try {
      if (!this.redis) return;

      const currentTime = Date.now();
      const timeWindow = 60000; // 1 minute window

      // Get message counts from the last minute
      const recentMessages = await this.redis.zrangebyscore(
        'socketio:message_timeline',
        currentTime - timeWindow,
        currentTime
      );

      // Calculate rates per namespace/event
      const rates = new Map();
      recentMessages.forEach(message => {
        const [namespace, event] = message.split(':');
        const key = `${namespace}:${event}`;
        rates.set(key, (rates.get(key) || 0) + 1);
      });

      // Update throughput metrics
      rates.forEach((count, key) => {
        const [namespace, event] = key.split(':');
        const rate = count / (timeWindow / 1000); // messages per second
        throughputRate.set({ namespace, event }, rate);
      });

    } catch (error) {
      logger.error('Error calculating throughput rates', { error: error.message });
    }
  }

  async getHealth() {
    const health = {
      status: this.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: {
        connected: this.isConnected,
        url: config.redisUrl.replace(/:[^:]*@/, ':***@')
      },
      api: {
        url: config.apiUrl,
        accessible: false
      }
    };

    try {
      // Test API connectivity
      await axios.get(`${config.apiUrl}/health`, { timeout: 3000 });
      health.api.accessible = true;
    } catch (error) {
      health.api.error = error.message;
    }

    return health;
  }

  async shutdown() {
    logger.info('Shutting down Socket.io Monitor...');
    
    try {
      if (this.redis) {
        await this.redis.disconnect();
        logger.info('Disconnected from Redis');
      }

      this.isConnected = false;
      logger.info('Socket.io Monitor shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
    }
  }
}

// ==============================================
// EXPRESS SERVER SETUP
// ==============================================

const app = express();
const monitor = new SocketIOMonitor();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await monitor.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error: error.message });
    res.status(500).send('Error generating metrics');
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Cryb Socket.io Exporter',
    version: '1.0.0',
    endpoints: {
      metrics: '/metrics',
      health: '/health'
    },
    configuration: {
      apiUrl: config.apiUrl,
      scrapeInterval: config.scrapeInterval,
      redisUrl: config.redisUrl.replace(/:[^:]*@/, ':***@')
    }
  });
});

// ==============================================
// SERVER STARTUP AND SHUTDOWN
// ==============================================

async function startup() {
  try {
    await monitor.initialize();
    
    const server = app.listen(config.port, () => {
      logger.info(`Socket.io Exporter listening on port ${config.port}`, {
        endpoints: {
          metrics: `http://localhost:${config.port}/metrics`,
          health: `http://localhost:${config.port}/health`
        }
      });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        await monitor.shutdown();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR1', () => shutdown('SIGUSR1'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));

  } catch (error) {
    logger.error('Failed to start Socket.io Exporter', { error: error.message });
    process.exit(1);
  }
}

// Start the service
startup();