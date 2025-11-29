/**
 * ==============================================
 * CRYB BUSINESS METRICS PROMETHEUS EXPORTER
 * ==============================================
 * Monitors business KPIs and provides Prometheus metrics
 * for user engagement, revenue, content, and platform health
 * ==============================================
 */

const express = require('express');
const promClient = require('prom-client');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { Client: ElasticsearchClient } = require('@elastic/elasticsearch');
const winston = require('winston');
const cron = require('node-cron');

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
  port: process.env.PORT || 9465,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD || '',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  scrapeInterval: parseInt(process.env.SCRAPE_INTERVAL || '30000'),
  metricsPrefix: 'cryb_business_'
};

// Prometheus registry
const register = new promClient.Registry();

// Default Node.js metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'cryb_business_nodejs_'
});

// ==============================================
// PROMETHEUS METRICS DEFINITIONS
// ==============================================

// User metrics
const totalUsers = new promClient.Gauge({
  name: `${config.metricsPrefix}total_users`,
  help: 'Total number of registered users',
  registers: [register]
});

const dailyActiveUsers = new promClient.Gauge({
  name: `${config.metricsPrefix}daily_active_users`,
  help: 'Number of daily active users',
  labelNames: ['period'],
  registers: [register]
});

const userRegistrations = new promClient.Gauge({
  name: `${config.metricsPrefix}user_registrations`,
  help: 'User registrations in time period',
  labelNames: ['period'],
  registers: [register]
});

const userRetentionRate = new promClient.Gauge({
  name: `${config.metricsPrefix}user_retention_rate`,
  help: 'User retention rate percentage',
  labelNames: ['period', 'cohort'],
  registers: [register]
});

// Content metrics
const totalPosts = new promClient.Gauge({
  name: `${config.metricsPrefix}total_posts`,
  help: 'Total number of posts',
  registers: [register]
});

const totalComments = new promClient.Gauge({
  name: `${config.metricsPrefix}total_comments`,
  help: 'Total number of comments',
  registers: [register]
});

const dailyContentCreation = new promClient.Gauge({
  name: `${config.metricsPrefix}daily_content_creation`,
  help: 'Content created today',
  labelNames: ['type'],
  registers: [register]
});

const contentEngagementRate = new promClient.Gauge({
  name: `${config.metricsPrefix}content_engagement_rate`,
  help: 'Content engagement rate percentage',
  labelNames: ['type'],
  registers: [register]
});

// Community metrics
const totalCommunities = new promClient.Gauge({
  name: `${config.metricsPrefix}total_communities`,
  help: 'Total number of communities',
  registers: [register]
});

const activeCommunities = new promClient.Gauge({
  name: `${config.metricsPrefix}active_communities`,
  help: 'Number of communities with recent activity',
  labelNames: ['period'],
  registers: [register]
});

const averageCommunitySize = new promClient.Gauge({
  name: `${config.metricsPrefix}average_community_size`,
  help: 'Average number of members per community',
  registers: [register]
});

// Messaging metrics
const totalMessages = new promClient.Gauge({
  name: `${config.metricsPrefix}total_messages`,
  help: 'Total number of messages sent',
  registers: [register]
});

const dailyMessages = new promClient.Gauge({
  name: `${config.metricsPrefix}daily_messages`,
  help: 'Messages sent today',
  labelNames: ['type'],
  registers: [register]
});

const messageDeliveryRate = new promClient.Gauge({
  name: `${config.metricsPrefix}message_delivery_rate`,
  help: 'Message delivery success rate percentage',
  registers: [register]
});

// Voice/Video metrics
const totalVoiceCalls = new promClient.Gauge({
  name: `${config.metricsPrefix}total_voice_calls`,
  help: 'Total number of voice calls',
  registers: [register]
});

const dailyVoiceMinutes = new promClient.Gauge({
  name: `${config.metricsPrefix}daily_voice_minutes`,
  help: 'Total voice minutes today',
  registers: [register]
});

const voiceCallQuality = new promClient.Gauge({
  name: `${config.metricsPrefix}voice_call_quality_score`,
  help: 'Average voice call quality score',
  registers: [register]
});

// Revenue metrics (if applicable)
const totalRevenue = new promClient.Gauge({
  name: `${config.metricsPrefix}total_revenue`,
  help: 'Total revenue generated',
  labelNames: ['currency'],
  registers: [register]
});

const dailyRevenue = new promClient.Gauge({
  name: `${config.metricsPrefix}daily_revenue`,
  help: 'Revenue generated today',
  labelNames: ['currency', 'source'],
  registers: [register]
});

const averageRevenuePerUser = new promClient.Gauge({
  name: `${config.metricsPrefix}average_revenue_per_user`,
  help: 'Average revenue per user',
  labelNames: ['period'],
  registers: [register]
});

// Platform health metrics
const platformHealthScore = new promClient.Gauge({
  name: `${config.metricsPrefix}platform_health_score`,
  help: 'Overall platform health score (0-100)',
  registers: [register]
});

const featureAdoptionRate = new promClient.Gauge({
  name: `${config.metricsPrefix}feature_adoption_rate`,
  help: 'Feature adoption rate percentage',
  labelNames: ['feature'],
  registers: [register]
});

const supportTickets = new promClient.Gauge({
  name: `${config.metricsPrefix}support_tickets`,
  help: 'Number of support tickets',
  labelNames: ['status', 'priority'],
  registers: [register]
});

// ==============================================
// BUSINESS METRICS COLLECTOR CLASS
// ==============================================

class BusinessMetricsCollector {
  constructor() {
    this.db = null;
    this.redis = null;
    this.elasticsearch = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Initialize database connection
      if (config.databaseUrl) {
        try {
          this.db = new Pool({
            connectionString: config.databaseUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
          });

          await this.db.query('SELECT NOW()');
          logger.info('Connected to PostgreSQL database');
        } catch (error) {
          logger.warn('Failed to connect to PostgreSQL, continuing without database', { error: error.message });
          this.db = null;
        }
      }

      // Initialize Redis connection
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
        logger.info('Connected to Redis');

        // Add error handler to prevent crashes
        this.redis.on('error', (err) => {
          logger.error('Redis connection error', { error: err.message });
        });
      } catch (error) {
        logger.warn('Failed to connect to Redis, continuing without Redis', { error: error.message });
        this.redis = null;
      }

      // Initialize Elasticsearch connection
      try {
        this.elasticsearch = new ElasticsearchClient({
          node: config.elasticsearchUrl,
          requestTimeout: 10000,
          maxRetries: 3
        });

        await this.elasticsearch.ping();
        logger.info('Connected to Elasticsearch');
      } catch (error) {
        logger.warn('Failed to connect to Elasticsearch, continuing without Elasticsearch', { error: error.message });
        this.elasticsearch = null;
      }

      this.isConnected = true;

      // Start metrics collection
      this.startMetricsCollection();

      logger.info('Business Metrics Collector initialized successfully', {
        database: !!this.db,
        redis: !!this.redis,
        elasticsearch: !!this.elasticsearch
      });

    } catch (error) {
      logger.error('Failed to initialize Business Metrics Collector', { error: error.message });
      // Don't throw - allow service to start even if connections fail
      this.isConnected = true;
    }
  }

  startMetricsCollection() {
    // Immediate collection
    this.collectAllMetrics();

    // Schedule regular collection
    setInterval(() => {
      this.collectAllMetrics();
    }, config.scrapeInterval);

    // Schedule daily metrics collection at midnight
    cron.schedule('0 0 * * *', () => {
      this.collectDailyMetrics();
    });

    logger.info(`Started metrics collection with ${config.scrapeInterval}ms interval`);
  }

  async collectAllMetrics() {
    try {
      await Promise.all([
        this.collectUserMetrics(),
        this.collectContentMetrics(),
        this.collectCommunityMetrics(),
        this.collectMessagingMetrics(),
        this.collectVoiceMetrics(),
        this.collectRevenueMetrics(),
        this.collectPlatformHealthMetrics()
      ]);
    } catch (error) {
      logger.error('Error collecting business metrics', { error: error.message });
    }
  }

  async collectUserMetrics() {
    try {
      if (!this.db) return;

      // Total users
      const totalUsersResult = await this.db.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
      totalUsers.set(parseInt(totalUsersResult.rows[0].count));

      // Daily active users (last 24 hours)
      const dauResult = await this.db.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_sessions 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);
      dailyActiveUsers.set({ period: '1d' }, parseInt(dauResult.rows[0].count));

      // Weekly active users
      const wauResult = await this.db.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_sessions 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);
      dailyActiveUsers.set({ period: '7d' }, parseInt(wauResult.rows[0].count));

      // Daily registrations
      const dailyRegResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL
      `);
      userRegistrations.set({ period: '1d' }, parseInt(dailyRegResult.rows[0].count));

      // Weekly registrations
      const weeklyRegResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL
      `);
      userRegistrations.set({ period: '7d' }, parseInt(weeklyRegResult.rows[0].count));

      // Calculate retention rates
      await this.calculateRetentionRates();

    } catch (error) {
      logger.error('Error collecting user metrics', { error: error.message });
    }
  }

  async calculateRetentionRates() {
    try {
      // 7-day retention for users who joined last week
      const retentionQuery = `
        WITH cohort AS (
          SELECT user_id
          FROM users 
          WHERE created_at >= NOW() - INTERVAL '14 days' 
            AND created_at < NOW() - INTERVAL '7 days'
            AND deleted_at IS NULL
        ),
        retained AS (
          SELECT COUNT(DISTINCT c.user_id) as count
          FROM cohort c
          INNER JOIN user_sessions us ON c.user_id = us.user_id
          WHERE us.created_at >= NOW() - INTERVAL '7 days'
        ),
        total AS (
          SELECT COUNT(*) as count FROM cohort
        )
        SELECT 
          CASE WHEN t.count > 0 THEN (r.count::float / t.count::float * 100) ELSE 0 END as retention_rate
        FROM retained r, total t
      `;
      
      const retentionResult = await this.db.query(retentionQuery);
      const retentionRate = parseFloat(retentionResult.rows[0].retention_rate) || 0;
      userRetentionRate.set({ period: '7d', cohort: 'weekly' }, retentionRate);

    } catch (error) {
      logger.error('Error calculating retention rates', { error: error.message });
    }
  }

  async collectContentMetrics() {
    try {
      if (!this.db) return;

      // Total posts
      const totalPostsResult = await this.db.query('SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL');
      totalPosts.set(parseInt(totalPostsResult.rows[0].count));

      // Total comments
      const totalCommentsResult = await this.db.query('SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL');
      totalComments.set(parseInt(totalCommentsResult.rows[0].count));

      // Daily content creation
      const dailyPostsResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM posts 
        WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL
      `);
      dailyContentCreation.set({ type: 'posts' }, parseInt(dailyPostsResult.rows[0].count));

      const dailyCommentsResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL
      `);
      dailyContentCreation.set({ type: 'comments' }, parseInt(dailyCommentsResult.rows[0].count));

      // Calculate engagement rates
      await this.calculateEngagementRates();

    } catch (error) {
      logger.error('Error collecting content metrics', { error: error.message });
    }
  }

  async calculateEngagementRates() {
    try {
      // Post engagement rate (likes + comments / posts)
      const postEngagementQuery = `
        SELECT 
          CASE WHEN p.count > 0 THEN ((r.count + c.count)::float / p.count::float * 100) ELSE 0 END as engagement_rate
        FROM 
          (SELECT COUNT(*) as count FROM posts WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) p,
          (SELECT COUNT(*) as count FROM reactions WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) r,
          (SELECT COUNT(*) as count FROM comments WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) c
      `;
      
      const engagementResult = await this.db.query(postEngagementQuery);
      const engagementRate = parseFloat(engagementResult.rows[0].engagement_rate) || 0;
      contentEngagementRate.set({ type: 'posts' }, engagementRate);

    } catch (error) {
      logger.error('Error calculating engagement rates', { error: error.message });
    }
  }

  async collectCommunityMetrics() {
    try {
      if (!this.db) return;

      // Total communities
      const totalCommunitiesResult = await this.db.query('SELECT COUNT(*) as count FROM communities WHERE deleted_at IS NULL');
      totalCommunities.set(parseInt(totalCommunitiesResult.rows[0].count));

      // Active communities (with activity in last 7 days)
      const activeCommunitiesResult = await this.db.query(`
        SELECT COUNT(DISTINCT c.id) as count
        FROM communities c
        INNER JOIN posts p ON c.id = p.community_id
        WHERE p.created_at >= NOW() - INTERVAL '7 days' 
          AND c.deleted_at IS NULL 
          AND p.deleted_at IS NULL
      `);
      activeCommunities.set({ period: '7d' }, parseInt(activeCommunitiesResult.rows[0].count));

      // Average community size
      const avgSizeResult = await this.db.query(`
        SELECT AVG(member_count)::int as avg_size
        FROM (
          SELECT community_id, COUNT(*) as member_count
          FROM community_memberships
          WHERE deleted_at IS NULL
          GROUP BY community_id
        ) cs
      `);
      averageCommunitySize.set(parseInt(avgSizeResult.rows[0].avg_size) || 0);

    } catch (error) {
      logger.error('Error collecting community metrics', { error: error.message });
    }
  }

  async collectMessagingMetrics() {
    try {
      if (!this.db) return;

      // Total messages
      const totalMessagesResult = await this.db.query('SELECT COUNT(*) as count FROM messages WHERE deleted_at IS NULL');
      totalMessages.set(parseInt(totalMessagesResult.rows[0].count));

      // Daily messages
      const dailyMessagesResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL
      `);
      dailyMessages.set({ type: 'all' }, parseInt(dailyMessagesResult.rows[0].count));

      // Daily direct messages
      const dailyDMResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE created_at >= CURRENT_DATE 
          AND channel_type = 'direct' 
          AND deleted_at IS NULL
      `);
      dailyMessages.set({ type: 'direct' }, parseInt(dailyDMResult.rows[0].count));

      // Message delivery rate (simulate - would come from actual delivery tracking)
      messageDeliveryRate.set(99.5); // Placeholder

    } catch (error) {
      logger.error('Error collecting messaging metrics', { error: error.message });
    }
  }

  async collectVoiceMetrics() {
    try {
      if (!this.db) return;

      // Total voice calls
      const totalCallsResult = await this.db.query('SELECT COUNT(*) as count FROM voice_calls WHERE deleted_at IS NULL');
      totalVoiceCalls.set(parseInt(totalCallsResult.rows[0].count));

      // Daily voice minutes
      const dailyMinutesResult = await this.db.query(`
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at))/60), 0) as minutes
        FROM voice_calls 
        WHERE started_at >= CURRENT_DATE 
          AND ended_at IS NOT NULL 
          AND deleted_at IS NULL
      `);
      dailyVoiceMinutes.set(parseFloat(dailyMinutesResult.rows[0].minutes) || 0);

      // Voice call quality score (simulate - would come from actual quality metrics)
      voiceCallQuality.set(8.5); // Placeholder out of 10

    } catch (error) {
      logger.error('Error collecting voice metrics', { error: error.message });
    }
  }

  async collectRevenueMetrics() {
    try {
      // Placeholder revenue metrics - implement based on your payment system
      totalRevenue.set({ currency: 'USD' }, 0);
      dailyRevenue.set({ currency: 'USD', source: 'subscriptions' }, 0);
      averageRevenuePerUser.set({ period: '30d' }, 0);
    } catch (error) {
      logger.error('Error collecting revenue metrics', { error: error.message });
    }
  }

  async collectPlatformHealthMetrics() {
    try {
      // Calculate overall platform health score based on various factors
      let healthScore = 100;
      
      // Reduce score based on error rates, downtime, etc.
      // This is a simplified calculation - customize based on your needs
      
      platformHealthScore.set(healthScore);

      // Feature adoption rates (placeholder)
      featureAdoptionRate.set({ feature: 'voice_chat' }, 75);
      featureAdoptionRate.set({ feature: 'communities' }, 85);
      featureAdoptionRate.set({ feature: 'messaging' }, 95);

      // Support tickets (placeholder)
      supportTickets.set({ status: 'open', priority: 'high' }, 5);
      supportTickets.set({ status: 'open', priority: 'medium' }, 15);
      supportTickets.set({ status: 'open', priority: 'low' }, 30);

    } catch (error) {
      logger.error('Error collecting platform health metrics', { error: error.message });
    }
  }

  async collectDailyMetrics() {
    logger.info('Running daily metrics collection...');
    await this.collectAllMetrics();
  }

  async getHealth() {
    return {
      status: this.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connections: {
        database: !!this.db,
        redis: this.redis?.status === 'ready',
        elasticsearch: !!this.elasticsearch
      },
      lastCollection: new Date().toISOString()
    };
  }

  async shutdown() {
    logger.info('Shutting down Business Metrics Collector...');
    
    try {
      if (this.db) {
        await this.db.end();
        logger.info('Closed database connection');
      }

      if (this.redis) {
        await this.redis.disconnect();
        logger.info('Disconnected from Redis');
      }

      this.isConnected = false;
      logger.info('Business Metrics Collector shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
    }
  }
}

// ==============================================
// EXPRESS SERVER SETUP
// ==============================================

const app = express();
const collector = new BusinessMetricsCollector();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await collector.getHealth();
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
    service: 'Cryb Business Metrics Exporter',
    version: '1.0.0',
    endpoints: {
      metrics: '/metrics',
      health: '/health'
    },
    configuration: {
      scrapeInterval: config.scrapeInterval,
      hasDatabase: !!config.databaseUrl,
      hasRedis: !!config.redisUrl,
      hasElasticsearch: !!config.elasticsearchUrl
    }
  });
});

// ==============================================
// SERVER STARTUP AND SHUTDOWN
// ==============================================

async function startup() {
  try {
    await collector.initialize();
    
    const server = app.listen(config.port, () => {
      logger.info(`Business Metrics Exporter listening on port ${config.port}`, {
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
        await collector.shutdown();
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
    logger.error('Failed to start Business Metrics Exporter', { error: error.message });
    process.exit(1);
  }
}

// Start the service
startup();