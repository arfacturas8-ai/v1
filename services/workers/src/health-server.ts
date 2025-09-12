import { createServer } from 'http';
import { URL } from 'url';
import pino from 'pino';
import { QueueManager } from './core/queue-manager';

export interface HealthCheckConfig {
  port: number;
  path: string;
  enableMetrics: boolean;
  enableDetailedStatus: boolean;
}

export class HealthServer {
  private server: any;
  private logger: pino.Logger;

  constructor(
    private queueManager: QueueManager,
    private config: HealthCheckConfig = {
      port: 3001,
      path: '/health',
      enableMetrics: true,
      enableDetailedStatus: true
    }
  ) {
    this.logger = pino({
      name: 'health-server',
      level: process.env.LOG_LEVEL || 'info'
    });
  }

  async start(): Promise<void> {
    this.server = createServer(this.handleRequest.bind(this));

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (error: any) => {
        if (error) {
          this.logger.error('Failed to start health server:', error);
          reject(error);
        } else {
          this.logger.info(`Health server started on port ${this.config.port}`);
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.logger.info('Health server stopped');
          resolve();
        });
      });
    }
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method?.toUpperCase();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    if (method !== 'GET') {
      this.sendResponse(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      switch (url.pathname) {
        case '/health':
        case '/health/':
          await this.handleHealthCheck(res);
          break;
        case '/health/detailed':
          await this.handleDetailedHealth(res);
          break;
        case '/metrics':
          await this.handleMetrics(res);
          break;
        case '/status':
          await this.handleStatus(res);
          break;
        case '/queues':
          await this.handleQueues(res);
          break;
        default:
          this.sendResponse(res, 404, { 
            error: 'Not found',
            availableEndpoints: [
              '/health',
              '/health/detailed',
              '/metrics',
              '/status',
              '/queues'
            ]
          });
      }
    } catch (error) {
      this.logger.error('Health check error:', error);
      this.sendResponse(res, 500, { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleHealthCheck(res: any): Promise<void> {
    try {
      const isManagerInitialized = this.queueManager.isInitialized();
      const isManagerShuttingDown = this.queueManager.isShuttingDown();
      
      if (!isManagerInitialized || isManagerShuttingDown) {
        this.sendResponse(res, 503, {
          status: 'unhealthy',
          reason: isManagerShuttingDown ? 'shutting down' : 'not initialized',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const healthStatus = await this.queueManager.getHealthStatus();
      
      // Determine overall health
      let overallStatus = 'healthy';
      let statusCode = 200;

      if (!healthStatus.redis.connected) {
        overallStatus = 'unhealthy';
        statusCode = 503;
      } else if (healthStatus.workers.healthy === 0 && healthStatus.workers.total > 0) {
        overallStatus = 'degraded';
        statusCode = 200; // Still returning 200 but indicating degraded state
      }

      this.sendResponse(res, statusCode, {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        redis: {
          connected: healthStatus.redis.connected,
          latency: healthStatus.redis.latency
        },
        queues: {
          total: healthStatus.workers.total,
          active: healthStatus.workers.active,
          healthy: healthStatus.workers.healthy
        },
        jobs: {
          processing: healthStatus.queue.processing,
          waiting: healthStatus.queue.queueLength,
          failed: healthStatus.queue.failed
        }
      });

    } catch (error) {
      this.logger.error('Health check failed:', error);
      this.sendResponse(res, 503, {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleDetailedHealth(res: any): Promise<void> {
    if (!this.config.enableDetailedStatus) {
      this.sendResponse(res, 403, { error: 'Detailed status disabled' });
      return;
    }

    try {
      const healthStatus = await this.queueManager.getHealthStatus();
      const systemStats = await this.queueManager.getSystemStats();
      const queueMetrics = await this.queueManager.getAllQueueMetrics();

      this.sendResponse(res, 200, {
        status: healthStatus.redis.connected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.version,
          platform: process.platform
        },
        overall: healthStatus,
        queues: healthStatus.queues,
        metrics: queueMetrics,
        stats: systemStats,
        alerts: {
          active: this.queueManager.getActiveAlerts(),
          recent: this.queueManager.getAlertHistory(10)
        },
        cron: {
          jobs: this.queueManager.getCronJobs()
        }
      });

    } catch (error) {
      this.logger.error('Detailed health check failed:', error);
      this.sendResponse(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleMetrics(res: any): Promise<void> {
    if (!this.config.enableMetrics) {
      this.sendResponse(res, 403, { error: 'Metrics disabled' });
      return;
    }

    try {
      const systemStats = await this.queueManager.getSystemStats();
      const queueMetrics = await this.queueManager.getAllQueueMetrics();

      // Generate Prometheus-style metrics
      const prometheusMetrics = this.generatePrometheusMetrics(systemStats, queueMetrics);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.statusCode = 200;
      res.end(prometheusMetrics);

    } catch (error) {
      this.logger.error('Metrics collection failed:', error);
      this.sendResponse(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleStatus(res: any): Promise<void> {
    try {
      const queueNames = this.queueManager.getQueueNames();
      const systemStats = await this.queueManager.getSystemStats();

      this.sendResponse(res, 200, {
        initialized: this.queueManager.isInitialized(),
        shuttingDown: this.queueManager.isShuttingDown(),
        queues: queueNames,
        stats: systemStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Status check failed:', error);
      this.sendResponse(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleQueues(res: any): Promise<void> {
    try {
      const queueMetrics = await this.queueManager.getAllQueueMetrics();
      const queueNames = this.queueManager.getQueueNames();

      const queuesInfo = queueNames.map(name => ({
        name,
        metrics: queueMetrics[name] || null
      }));

      this.sendResponse(res, 200, {
        queues: queuesInfo,
        totalQueues: queueNames.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Queue listing failed:', error);
      this.sendResponse(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generatePrometheusMetrics(systemStats: any, queueMetrics: any): string {
    const lines: string[] = [];

    // System metrics
    lines.push('# HELP cryb_queue_manager_uptime_seconds Total uptime of the queue manager');
    lines.push('# TYPE cryb_queue_manager_uptime_seconds counter');
    lines.push(`cryb_queue_manager_uptime_seconds ${systemStats.uptime}`);

    lines.push('# HELP cryb_total_queues Total number of queues');
    lines.push('# TYPE cryb_total_queues gauge');
    lines.push(`cryb_total_queues ${systemStats.totalQueues}`);

    // Job metrics
    lines.push('# HELP cryb_jobs_total Total jobs processed');
    lines.push('# TYPE cryb_jobs_total counter');
    lines.push(`cryb_jobs_total{status="processed"} ${systemStats.totalJobs.processed}`);
    lines.push(`cryb_jobs_total{status="failed"} ${systemStats.totalJobs.failed}`);
    lines.push(`cryb_jobs_total{status="active"} ${systemStats.totalJobs.active}`);
    lines.push(`cryb_jobs_total{status="waiting"} ${systemStats.totalJobs.waiting}`);

    // Redis metrics
    lines.push('# HELP cryb_redis_connected Redis connection status');
    lines.push('# TYPE cryb_redis_connected gauge');
    lines.push(`cryb_redis_connected ${systemStats.redis.connected ? 1 : 0}`);

    if (systemStats.redis.latency !== undefined) {
      lines.push('# HELP cryb_redis_latency_ms Redis response latency in milliseconds');
      lines.push('# TYPE cryb_redis_latency_ms gauge');
      lines.push(`cryb_redis_latency_ms ${systemStats.redis.latency}`);
    }

    // Queue-specific metrics
    Object.entries(queueMetrics).forEach(([queueName, metrics]: [string, any]) => {
      const queueLabel = `queue="${queueName}"`;
      
      lines.push(`cryb_queue_jobs_processed_total{${queueLabel}} ${metrics.totalProcessed}`);
      lines.push(`cryb_queue_jobs_failed_total{${queueLabel}} ${metrics.totalFailed}`);
      lines.push(`cryb_queue_jobs_active{${queueLabel}} ${metrics.activeJobs}`);
      lines.push(`cryb_queue_jobs_waiting{${queueLabel}} ${metrics.queueLength}`);
      lines.push(`cryb_queue_jobs_completed{${queueLabel}} ${metrics.completedJobs}`);
      lines.push(`cryb_queue_jobs_delayed{${queueLabel}} ${metrics.delayedJobs}`);
    });

    // Alert metrics
    lines.push('# HELP cryb_alerts_active Active alerts');
    lines.push('# TYPE cryb_alerts_active gauge');
    lines.push(`cryb_alerts_active ${systemStats.alerts.active}`);
    lines.push(`cryb_alerts_total ${systemStats.alerts.total}`);

    return lines.join('\n') + '\n';
  }

  private sendResponse(res: any, statusCode: number, data: any): void {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data, null, 2));
  }
}