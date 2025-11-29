import { FastifyInstance } from 'fastify';
import pino from 'pino';
import { hostname } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Monitoring and Logging Service
 * Provides comprehensive logging, metrics, and health monitoring
 */
export class MonitoringService {
  private app: FastifyInstance;
  private logger: pino.Logger;
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private logDir: string;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.logDir = process.env.LOG_DIR || '/var/log/cryb';
    
    // Initialize production logger with file rotation
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        targets: [
          {
            target: 'pino/file',
            options: {
              destination: path.join(this.logDir, 'api.log'),
              mkdir: true
            }
          },
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l'
            }
          }
        ]
      }
    });
  }

  async initialize() {
    // Ensure log directory exists
    await fs.mkdir(this.logDir, { recursive: true });
    
    // Set up error logging
    this.setupErrorLogging();
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    // Set up health checks
    this.setupHealthChecks();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    this.logger.info('🔍 Monitoring service initialized');
  }

  private setupErrorLogging() {
    // Log uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.fatal({ error }, 'Uncaught Exception');
      // Give time to flush logs before exit
      setTimeout(() => process.exit(1), 1000);
    });

    // Log unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error({ reason, promise }, 'Unhandled Rejection');
    });

    // Log app errors
    this.app.setErrorHandler((error, request, reply) => {
      this.logger.error({
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body
        }
      }, 'Request Error');
      
      reply.status(error.statusCode || 500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Log slow queries
    this.app.addHook('onRequest', async (request, reply) => {
      request.startTime = Date.now();
    });

    this.app.addHook('onResponse', async (request, reply) => {
      const responseTime = Date.now() - (request as any).startTime;
      
      // Log slow requests (> 1 second)
      if (responseTime > 1000) {
        this.logger.warn({
          method: request.method,
          url: request.url,
          responseTime,
          statusCode: reply.statusCode
        }, 'Slow Request Detected');
      }
      
      // Track metrics
      this.recordMetric('http_request_duration_ms', responseTime, {
        method: request.method,
        route: request.routerPath || request.url,
        statusCode: reply.statusCode
      });
    });
  }

  private setupHealthChecks() {
    // Database health check
    this.healthChecks.set('database', async () => {
      try {
        const { prisma } = (this.app as any).services.database;
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    });

    // Redis health check
    this.healthChecks.set('redis', async () => {
      try {
        const redis = (this.app as any).services.redis;
        await redis.ping();
        return true;
      } catch {
        return false;
      }
    });

    // Disk space check
    this.healthChecks.set('diskSpace', async () => {
      try {
        const { stdout } = await execAsync('df -h / | tail -1');
        const usage = parseInt(stdout.split(/\s+/)[4]);
        return usage < 90; // Alert if > 90% disk usage
      } catch {
        return false;
      }
    });

    // Memory check
    this.healthChecks.set('memory', async () => {
      const used = process.memoryUsage();
      const limit = 2 * 1024 * 1024 * 1024; // 2GB limit
      return used.heapUsed < limit;
    });
  }

  private startMetricsCollection() {
    // Collect metrics every minute
    this.metricsInterval = setInterval(async () => {
      const metrics = await this.collectSystemMetrics();
      
      // Log metrics
      this.logger.info({ metrics }, 'System Metrics');
      
      // Check for issues
      if (metrics.cpuUsage > 80) {
        this.logger.warn({ cpuUsage: metrics.cpuUsage }, 'High CPU Usage');
      }
      
      if (metrics.memoryUsage > 80) {
        this.logger.warn({ memoryUsage: metrics.memoryUsage }, 'High Memory Usage');
      }
      
      // Write metrics to file for analysis
      const metricsFile = path.join(this.logDir, 'metrics.jsonl');
      await fs.appendFile(metricsFile, JSON.stringify({ 
        timestamp: new Date().toISOString(), 
        ...metrics 
      }) + '\n');
    }, 60000);
  }

  private async collectSystemMetrics() {
    const metrics: any = {
      hostname: hostname(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    // CPU usage
    try {
      const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      metrics.cpuUsage = parseFloat(stdout.trim());
    } catch {
      metrics.cpuUsage = 0;
    }

    // Memory usage
    try {
      const { stdout } = await execAsync("free -m | grep Mem | awk '{print ($3/$2) * 100}'");
      metrics.memoryUsage = parseFloat(stdout.trim());
    } catch {
      metrics.memoryUsage = 0;
    }

    // Active connections
    try {
      const { stdout } = await execAsync("netstat -an | grep ESTABLISHED | wc -l");
      metrics.activeConnections = parseInt(stdout.trim());
    } catch {
      metrics.activeConnections = 0;
    }

    // Process info
    metrics.processMemory = process.memoryUsage();
    metrics.processId = process.pid;

    // Health checks
    metrics.health = {};
    for (const [name, check] of this.healthChecks) {
      metrics.health[name] = await check();
    }

    return metrics;
  }

  private recordMetric(name: string, value: number, labels: Record<string, any> = {}) {
    // In production, this would send to Prometheus/DataDog/CloudWatch
    // For now, just log it
    if (process.env.LOG_LEVEL === 'debug') {
      this.logger.debug({ metric: name, value, labels }, 'Metric Recorded');
    }
  }

  async getStatus() {
    const metrics = await this.collectSystemMetrics();
    const logs = await this.getRecentLogs();
    
    return {
      status: 'operational',
      metrics,
      logs,
      alerts: await this.getActiveAlerts()
    };
  }

  private async getRecentLogs() {
    try {
      const logFile = path.join(this.logDir, 'api.log');
      const { stdout } = await execAsync(`tail -n 50 ${logFile} 2>/dev/null || echo "No logs available"`);
      return stdout.split('\n');
    } catch {
      return ['No logs available'];
    }
  }

  private async getActiveAlerts() {
    const alerts = [];
    
    // Check health
    for (const [name, check] of this.healthChecks) {
      const isHealthy = await check();
      if (!isHealthy) {
        alerts.push({
          type: 'error',
          service: name,
          message: `${name} health check failed`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return alerts;
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

export function setupMonitoring(app: FastifyInstance): MonitoringService {
  const monitoring = new MonitoringService(app);
  
  // Add monitoring endpoints
  app.get('/monitoring/status', async (request, reply) => {
    const status = await monitoring.getStatus();
    reply.send(status);
  });
  
  app.get('/monitoring/health', async (request, reply) => {
    const metrics = await monitoring.collectSystemMetrics();
    const isHealthy = Object.values(metrics.health).every(h => h === true);
    
    reply
      .code(isHealthy ? 200 : 503)
      .send({
        status: isHealthy ? 'healthy' : 'degraded',
        checks: metrics.health,
        timestamp: new Date().toISOString()
      });
  });
  
  return monitoring;
}