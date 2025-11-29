import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { Queue, QueueEvents, Job } from 'bullmq';
import { EventEmitter } from 'events';
import * as promClient from 'prom-client';

export interface QueueHealthMetrics {
  queueName: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  metrics: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
    totalJobs: number;
    processingRate: number;
    averageProcessingTime: number;
    errorRate: number;
    throughput: number;
    lag: number;
  };
  workers: {
    total: number;
    active: number;
    idle: number;
    utilization: number;
  };
  lastUpdated: Date;
  alerts: QueueAlert[];
}

export interface QueueAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface MonitoringConfig {
  metricsInterval: number;
  alertingEnabled: boolean;
  thresholds: {
    queueDepth: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
    processingTime: {
      warning: number;
      critical: number;
    };
    lag: {
      warning: number;
      critical: number;
    };
    workerUtilization: {
      warning: number;
      critical: number;
    };
  };
  retention: {
    metrics: number; // days
    alerts: number; // days
  };
}

export class QueueMonitor extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private config: MonitoringConfig;
  
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private queueMetrics: Map<string, QueueHealthMetrics> = new Map();
  private alerts: Map<string, QueueAlert[]> = new Map();
  
  private metricsInterval?: NodeJS.Timeout;
  private prometheusMetrics: PrometheusMetrics;
  
  private globalMetrics = {
    totalQueues: 0,
    totalJobs: 0,
    totalWorkers: 0,
    globalThroughput: 0,
    globalErrorRate: 0,
    averageQueueDepth: 0,
    healthyQueues: 0,
    unhealthyQueues: 0,
  };

  constructor(redis: Redis, logger: Logger, config: Partial<MonitoringConfig> = {}) {
    super();
    this.redis = redis;
    this.logger = logger;
    
    this.config = {
      metricsInterval: 30000, // 30 seconds
      alertingEnabled: true,
      thresholds: {
        queueDepth: { warning: 1000, critical: 5000 },
        errorRate: { warning: 5, critical: 15 },
        processingTime: { warning: 30000, critical: 60000 },
        lag: { warning: 60000, critical: 300000 },
        workerUtilization: { warning: 90, critical: 95 },
      },
      retention: {
        metrics: 30,
        alerts: 7,
      },
      ...config,
    };

    this.prometheusMetrics = new PrometheusMetrics();
    this.startMonitoring();
  }

  public addQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
    
    // Create queue events listener
    const queueEvents = new QueueEvents(queueName, {
      connection: this.redis,
    });
    
    this.queueEvents.set(queueName, queueEvents);
    this.setupQueueEventHandlers(queueName, queueEvents);
    
    // Initialize metrics
    this.queueMetrics.set(queueName, {
      queueName,
      status: 'unknown',
      metrics: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: false,
        totalJobs: 0,
        processingRate: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        throughput: 0,
        lag: 0,
      },
      workers: {
        total: 0,
        active: 0,
        idle: 0,
        utilization: 0,
      },
      lastUpdated: new Date(),
      alerts: [],
    });

    this.alerts.set(queueName, []);
    
    this.logger.info({ queueName }, 'Queue added to monitoring');
  }

  public removeQueue(queueName: string): void {
    const queueEvents = this.queueEvents.get(queueName);
    if (queueEvents) {
      queueEvents.close();
      this.queueEvents.delete(queueName);
    }
    
    this.queues.delete(queueName);
    this.queueMetrics.delete(queueName);
    this.alerts.delete(queueName);
    
    this.logger.info({ queueName }, 'Queue removed from monitoring');
  }

  private setupQueueEventHandlers(queueName: string, queueEvents: QueueEvents): void {
    queueEvents.on('waiting', ({ jobId }) => {
      this.prometheusMetrics.jobStateCounter.labels(queueName, 'waiting').inc();
      this.emit('job:waiting', { queueName, jobId });
    });

    queueEvents.on('active', ({ jobId }) => {
      this.prometheusMetrics.jobStateCounter.labels(queueName, 'active').inc();
      this.emit('job:active', { queueName, jobId });
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.prometheusMetrics.jobStateCounter.labels(queueName, 'completed').inc();
      this.emit('job:completed', { queueName, jobId, returnvalue });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.prometheusMetrics.jobStateCounter.labels(queueName, 'failed').inc();
      this.prometheusMetrics.jobErrorCounter.labels(queueName, 'processing_error').inc();
      this.emit('job:failed', { queueName, jobId, failedReason });
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      this.emit('job:progress', { queueName, jobId, data });
    });

    queueEvents.on('stalled', ({ jobId }) => {
      this.prometheusMetrics.jobErrorCounter.labels(queueName, 'stalled').inc();
      this.emit('job:stalled', { queueName, jobId });
    });
  }

  private startMonitoring(): void {
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.metricsInterval);

    this.logger.info({
      interval: this.config.metricsInterval,
      alertingEnabled: this.config.alertingEnabled,
    }, 'Queue monitoring started');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Collect metrics for each queue
      const promises = Array.from(this.queues.entries()).map(async ([queueName, queue]) => {
        await this.collectQueueMetrics(queueName, queue);
      });

      await Promise.all(promises);

      // Update global metrics
      await this.updateGlobalMetrics();

      // Check for alerts
      if (this.config.alertingEnabled) {
        await this.checkAlerts();
      }

      // Clean up old data
      await this.cleanupOldData();

      const collectionTime = Date.now() - startTime;
      this.prometheusMetrics.metricsCollectionDuration.observe(collectionTime / 1000);

      this.emit('metrics:collected', {
        timestamp: new Date(),
        collectionTime,
        queueCount: this.queues.size,
      });

    } catch (error) {
      this.logger.error({ error }, 'Failed to collect queue metrics');
      this.prometheusMetrics.metricsCollectionErrors.inc();
    }
  }

  private async collectQueueMetrics(queueName: string, queue: Queue): Promise<void> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const isPaused = await queue.isPaused();
      const workerMetrics = await this.getWorkerMetrics(queueName);
      const processingMetrics = await this.getProcessingMetrics(queueName);

      const metrics: QueueHealthMetrics = {
        queueName,
        status: this.calculateQueueStatus(queueName, {
          waiting: waiting.length,
          active: active.length,
          failed: failed.length,
          paused: isPaused,
          ...processingMetrics,
          ...workerMetrics,
        }),
        metrics: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused: isPaused,
          totalJobs: waiting.length + active.length + completed.length + failed.length + delayed.length,
          ...processingMetrics,
        },
        workers: workerMetrics,
        lastUpdated: new Date(),
        alerts: this.alerts.get(queueName) || [],
      };

      this.queueMetrics.set(queueName, metrics);

      // Update Prometheus metrics
      this.updatePrometheusMetrics(queueName, metrics);

      // Store metrics in Redis for historical analysis
      await this.storeMetricsInRedis(queueName, metrics);

    } catch (error) {
      this.logger.error({ error, queueName }, 'Failed to collect metrics for queue');
    }
  }

  private async getProcessingMetrics(queueName: string): Promise<{
    processingRate: number;
    averageProcessingTime: number;
    errorRate: number;
    throughput: number;
    lag: number;
  }> {
    try {
      // Get historical data from Redis
      const metricsKey = `queue:metrics:${queueName}`;
      const historicalData = await this.redis.lrange(metricsKey, 0, 99); // Last 100 data points

      if (historicalData.length === 0) {
        return {
          processingRate: 0,
          averageProcessingTime: 0,
          errorRate: 0,
          throughput: 0,
          lag: 0,
        };
      }

      const metrics = historicalData.map(data => JSON.parse(data));
      const recent = metrics.slice(0, 10); // Last 10 data points for current calculations

      // Calculate processing rate (jobs per minute)
      const timeWindow = 10 * (this.config.metricsInterval / 1000); // 10 intervals in seconds
      const completedJobs = recent.reduce((sum, m) => sum + (m.completed || 0), 0);
      const processingRate = (completedJobs / timeWindow) * 60;

      // Calculate average processing time
      const totalProcessingTime = recent.reduce((sum, m) => sum + (m.averageProcessingTime || 0), 0);
      const averageProcessingTime = totalProcessingTime / recent.length;

      // Calculate error rate
      const totalJobs = recent.reduce((sum, m) => sum + (m.totalJobs || 0), 0);
      const failedJobs = recent.reduce((sum, m) => sum + (m.failed || 0), 0);
      const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

      // Calculate throughput (jobs processed per second)
      const throughput = completedJobs / timeWindow;

      // Calculate lag (time jobs spend waiting)
      const currentMetrics = this.queueMetrics.get(queueName);
      const waitingJobs = currentMetrics?.metrics.waiting || 0;
      const activeJobs = currentMetrics?.metrics.active || 0;
      const lag = activeJobs > 0 ? (waitingJobs / activeJobs) * averageProcessingTime : 0;

      return {
        processingRate,
        averageProcessingTime,
        errorRate,
        throughput,
        lag,
      };

    } catch (error) {
      this.logger.warn({ error, queueName }, 'Failed to calculate processing metrics');
      return {
        processingRate: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        throughput: 0,
        lag: 0,
      };
    }
  }

  private async getWorkerMetrics(queueName: string): Promise<{
    total: number;
    active: number;
    idle: number;
    utilization: number;
  }> {
    try {
      // Get worker information from Redis
      const workersKey = `queue:workers:${queueName}`;
      const workers = await this.redis.smembers(workersKey);
      
      let activeWorkers = 0;
      
      for (const workerId of workers) {
        const workerStatus = await this.redis.get(`worker:${workerId}:status`);
        if (workerStatus === 'active') {
          activeWorkers++;
        }
      }

      const totalWorkers = workers.length;
      const idleWorkers = totalWorkers - activeWorkers;
      const utilization = totalWorkers > 0 ? (activeWorkers / totalWorkers) * 100 : 0;

      return {
        total: totalWorkers,
        active: activeWorkers,
        idle: idleWorkers,
        utilization,
      };

    } catch (error) {
      this.logger.warn({ error, queueName }, 'Failed to get worker metrics');
      return {
        total: 0,
        active: 0,
        idle: 0,
        utilization: 0,
      };
    }
  }

  private calculateQueueStatus(
    queueName: string,
    metrics: any
  ): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (metrics.paused) {
      return 'warning';
    }

    const thresholds = this.config.thresholds;
    
    // Check critical conditions
    if (
      metrics.waiting >= thresholds.queueDepth.critical ||
      metrics.errorRate >= thresholds.errorRate.critical ||
      metrics.averageProcessingTime >= thresholds.processingTime.critical ||
      metrics.lag >= thresholds.lag.critical ||
      metrics.utilization >= thresholds.workerUtilization.critical
    ) {
      return 'critical';
    }

    // Check warning conditions
    if (
      metrics.waiting >= thresholds.queueDepth.warning ||
      metrics.errorRate >= thresholds.errorRate.warning ||
      metrics.averageProcessingTime >= thresholds.processingTime.warning ||
      metrics.lag >= thresholds.lag.warning ||
      metrics.utilization >= thresholds.workerUtilization.warning
    ) {
      return 'warning';
    }

    return 'healthy';
  }

  private updatePrometheusMetrics(queueName: string, metrics: QueueHealthMetrics): void {
    // Queue depth metrics
    this.prometheusMetrics.queueDepthGauge.labels(queueName, 'waiting').set(metrics.metrics.waiting);
    this.prometheusMetrics.queueDepthGauge.labels(queueName, 'active').set(metrics.metrics.active);
    this.prometheusMetrics.queueDepthGauge.labels(queueName, 'completed').set(metrics.metrics.completed);
    this.prometheusMetrics.queueDepthGauge.labels(queueName, 'failed').set(metrics.metrics.failed);
    this.prometheusMetrics.queueDepthGauge.labels(queueName, 'delayed').set(metrics.metrics.delayed);

    // Processing metrics
    this.prometheusMetrics.processingRateGauge.labels(queueName).set(metrics.metrics.processingRate);
    this.prometheusMetrics.processingTimeGauge.labels(queueName).set(metrics.metrics.averageProcessingTime);
    this.prometheusMetrics.errorRateGauge.labels(queueName).set(metrics.metrics.errorRate);
    this.prometheusMetrics.throughputGauge.labels(queueName).set(metrics.metrics.throughput);
    this.prometheusMetrics.lagGauge.labels(queueName).set(metrics.metrics.lag);

    // Worker metrics
    this.prometheusMetrics.workerCountGauge.labels(queueName, 'total').set(metrics.workers.total);
    this.prometheusMetrics.workerCountGauge.labels(queueName, 'active').set(metrics.workers.active);
    this.prometheusMetrics.workerCountGauge.labels(queueName, 'idle').set(metrics.workers.idle);
    this.prometheusMetrics.workerUtilizationGauge.labels(queueName).set(metrics.workers.utilization);

    // Health status
    const statusValue = { healthy: 1, warning: 2, critical: 3, unknown: 0 }[metrics.status];
    this.prometheusMetrics.queueHealthGauge.labels(queueName).set(statusValue);
  }

  private async storeMetricsInRedis(queueName: string, metrics: QueueHealthMetrics): Promise<void> {
    try {
      const metricsKey = `queue:metrics:${queueName}`;
      const metricsData = {
        timestamp: Date.now(),
        ...metrics.metrics,
        ...metrics.workers,
        status: metrics.status,
      };

      await this.redis.lpush(metricsKey, JSON.stringify(metricsData));
      await this.redis.ltrim(metricsKey, 0, 999); // Keep last 1000 entries
      await this.redis.expire(metricsKey, this.config.retention.metrics * 86400);

    } catch (error) {
      this.logger.warn({ error, queueName }, 'Failed to store metrics in Redis');
    }
  }

  private async updateGlobalMetrics(): Promise<void> {
    const allMetrics = Array.from(this.queueMetrics.values());
    
    this.globalMetrics = {
      totalQueues: allMetrics.length,
      totalJobs: allMetrics.reduce((sum, m) => sum + m.metrics.totalJobs, 0),
      totalWorkers: allMetrics.reduce((sum, m) => sum + m.workers.total, 0),
      globalThroughput: allMetrics.reduce((sum, m) => sum + m.metrics.throughput, 0),
      globalErrorRate: allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.metrics.errorRate, 0) / allMetrics.length 
        : 0,
      averageQueueDepth: allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.metrics.waiting, 0) / allMetrics.length 
        : 0,
      healthyQueues: allMetrics.filter(m => m.status === 'healthy').length,
      unhealthyQueues: allMetrics.filter(m => m.status !== 'healthy').length,
    };

    // Store global metrics
    await this.redis.set(
      'queue:global:metrics',
      JSON.stringify({
        ...this.globalMetrics,
        timestamp: Date.now(),
      }),
      'EX',
      300 // 5 minutes
    );
  }

  private async checkAlerts(): Promise<void> {
    for (const [queueName, metrics] of this.queueMetrics) {
      const newAlerts: QueueAlert[] = [];

      // Check queue depth alerts
      this.checkThresholdAlert(
        newAlerts,
        queueName,
        'queueDepth',
        metrics.metrics.waiting,
        this.config.thresholds.queueDepth,
        'Queue depth is high'
      );

      // Check error rate alerts
      this.checkThresholdAlert(
        newAlerts,
        queueName,
        'errorRate',
        metrics.metrics.errorRate,
        this.config.thresholds.errorRate,
        'Error rate is high'
      );

      // Check processing time alerts
      this.checkThresholdAlert(
        newAlerts,
        queueName,
        'processingTime',
        metrics.metrics.averageProcessingTime,
        this.config.thresholds.processingTime,
        'Processing time is high'
      );

      // Check lag alerts
      this.checkThresholdAlert(
        newAlerts,
        queueName,
        'lag',
        metrics.metrics.lag,
        this.config.thresholds.lag,
        'Queue lag is high'
      );

      // Check worker utilization alerts
      this.checkThresholdAlert(
        newAlerts,
        queueName,
        'workerUtilization',
        metrics.workers.utilization,
        this.config.thresholds.workerUtilization,
        'Worker utilization is high'
      );

      // Update alerts for this queue
      if (newAlerts.length > 0) {
        const existingAlerts = this.alerts.get(queueName) || [];
        const updatedAlerts = [...existingAlerts, ...newAlerts];
        this.alerts.set(queueName, updatedAlerts);

        // Emit alert events
        for (const alert of newAlerts) {
          this.emit('alert:triggered', { queueName, alert });
          this.prometheusMetrics.alertCounter.labels(queueName, alert.type, alert.metric).inc();
        }

        // Store alerts in Redis
        await this.storeAlertsInRedis(queueName, updatedAlerts);
      }
    }
  }

  private checkThresholdAlert(
    alerts: QueueAlert[],
    queueName: string,
    metric: string,
    currentValue: number,
    thresholds: { warning: number; critical: number },
    baseMessage: string
  ): void {
    if (currentValue >= thresholds.critical) {
      alerts.push({
        id: `${queueName}-${metric}-critical-${Date.now()}`,
        type: 'critical',
        message: `${baseMessage} (critical threshold exceeded)`,
        metric,
        threshold: thresholds.critical,
        currentValue,
        timestamp: new Date(),
        acknowledged: false,
      });
    } else if (currentValue >= thresholds.warning) {
      alerts.push({
        id: `${queueName}-${metric}-warning-${Date.now()}`,
        type: 'warning',
        message: `${baseMessage} (warning threshold exceeded)`,
        metric,
        threshold: thresholds.warning,
        currentValue,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  private async storeAlertsInRedis(queueName: string, alerts: QueueAlert[]): Promise<void> {
    try {
      const alertsKey = `queue:alerts:${queueName}`;
      await this.redis.set(
        alertsKey,
        JSON.stringify(alerts),
        'EX',
        this.config.retention.alerts * 86400
      );
    } catch (error) {
      this.logger.warn({ error, queueName }, 'Failed to store alerts in Redis');
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      const cutoffTime = Date.now() - (this.config.retention.metrics * 86400 * 1000);
      
      // Clean up old metrics
      for (const queueName of this.queues.keys()) {
        const metricsKey = `queue:metrics:${queueName}`;
        const metrics = await this.redis.lrange(metricsKey, 0, -1);
        
        const validMetrics = metrics.filter(metricStr => {
          const metric = JSON.parse(metricStr);
          return metric.timestamp > cutoffTime;
        });

        if (validMetrics.length !== metrics.length) {
          await this.redis.del(metricsKey);
          if (validMetrics.length > 0) {
            await this.redis.lpush(metricsKey, ...validMetrics);
          }
        }
      }

      // Clean up old alerts
      const alertCutoffTime = Date.now() - (this.config.retention.alerts * 86400 * 1000);
      
      for (const [queueName, queueAlerts] of this.alerts) {
        const validAlerts = queueAlerts.filter(alert => 
          alert.timestamp.getTime() > alertCutoffTime
        );
        
        if (validAlerts.length !== queueAlerts.length) {
          this.alerts.set(queueName, validAlerts);
          await this.storeAlertsInRedis(queueName, validAlerts);
        }
      }

    } catch (error) {
      this.logger.warn({ error }, 'Failed to cleanup old monitoring data');
    }
  }

  public getQueueMetrics(queueName: string): QueueHealthMetrics | undefined {
    return this.queueMetrics.get(queueName);
  }

  public getAllQueueMetrics(): QueueHealthMetrics[] {
    return Array.from(this.queueMetrics.values());
  }

  public getGlobalMetrics(): any {
    return this.globalMetrics;
  }

  public getQueueAlerts(queueName: string): QueueAlert[] {
    return this.alerts.get(queueName) || [];
  }

  public getAllAlerts(): Record<string, QueueAlert[]> {
    return Object.fromEntries(this.alerts);
  }

  public async acknowledgeAlert(queueName: string, alertId: string): Promise<boolean> {
    const queueAlerts = this.alerts.get(queueName);
    if (!queueAlerts) return false;

    const alert = queueAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    await this.storeAlertsInRedis(queueName, queueAlerts);

    this.emit('alert:acknowledged', { queueName, alertId });
    return true;
  }

  public getPrometheusMetrics(): string {
    return promClient.register.metrics();
  }

  public stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    // Close all queue events
    for (const queueEvents of this.queueEvents.values()) {
      queueEvents.close();
    }

    this.logger.info('Queue monitoring stopped');
  }
}

class PrometheusMetrics {
  public readonly queueDepthGauge: promClient.Gauge<string>;
  public readonly processingRateGauge: promClient.Gauge<string>;
  public readonly processingTimeGauge: promClient.Gauge<string>;
  public readonly errorRateGauge: promClient.Gauge<string>;
  public readonly throughputGauge: promClient.Gauge<string>;
  public readonly lagGauge: promClient.Gauge<string>;
  public readonly workerCountGauge: promClient.Gauge<string>;
  public readonly workerUtilizationGauge: promClient.Gauge<string>;
  public readonly queueHealthGauge: promClient.Gauge<string>;
  public readonly jobStateCounter: promClient.Counter<string>;
  public readonly jobErrorCounter: promClient.Counter<string>;
  public readonly alertCounter: promClient.Counter<string>;
  public readonly metricsCollectionDuration: promClient.Histogram<string>;
  public readonly metricsCollectionErrors: promClient.Counter<string>;

  constructor() {
    // Clear any existing metrics
    promClient.register.clear();

    this.queueDepthGauge = new promClient.Gauge({
      name: 'queue_depth',
      help: 'Number of jobs in queue by state',
      labelNames: ['queue', 'state'],
    });

    this.processingRateGauge = new promClient.Gauge({
      name: 'queue_processing_rate',
      help: 'Jobs processed per minute',
      labelNames: ['queue'],
    });

    this.processingTimeGauge = new promClient.Gauge({
      name: 'queue_processing_time_ms',
      help: 'Average job processing time in milliseconds',
      labelNames: ['queue'],
    });

    this.errorRateGauge = new promClient.Gauge({
      name: 'queue_error_rate_percent',
      help: 'Error rate percentage',
      labelNames: ['queue'],
    });

    this.throughputGauge = new promClient.Gauge({
      name: 'queue_throughput',
      help: 'Jobs processed per second',
      labelNames: ['queue'],
    });

    this.lagGauge = new promClient.Gauge({
      name: 'queue_lag_ms',
      help: 'Queue lag in milliseconds',
      labelNames: ['queue'],
    });

    this.workerCountGauge = new promClient.Gauge({
      name: 'queue_workers',
      help: 'Number of workers by status',
      labelNames: ['queue', 'status'],
    });

    this.workerUtilizationGauge = new promClient.Gauge({
      name: 'queue_worker_utilization_percent',
      help: 'Worker utilization percentage',
      labelNames: ['queue'],
    });

    this.queueHealthGauge = new promClient.Gauge({
      name: 'queue_health_status',
      help: 'Queue health status (0=unknown, 1=healthy, 2=warning, 3=critical)',
      labelNames: ['queue'],
    });

    this.jobStateCounter = new promClient.Counter({
      name: 'queue_jobs_total',
      help: 'Total number of jobs by state',
      labelNames: ['queue', 'state'],
    });

    this.jobErrorCounter = new promClient.Counter({
      name: 'queue_job_errors_total',
      help: 'Total number of job errors',
      labelNames: ['queue', 'error_type'],
    });

    this.alertCounter = new promClient.Counter({
      name: 'queue_alerts_total',
      help: 'Total number of alerts triggered',
      labelNames: ['queue', 'type', 'metric'],
    });

    this.metricsCollectionDuration = new promClient.Histogram({
      name: 'queue_metrics_collection_duration_seconds',
      help: 'Time spent collecting queue metrics',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.metricsCollectionErrors = new promClient.Counter({
      name: 'queue_metrics_collection_errors_total',
      help: 'Total number of metrics collection errors',
    });
  }
}

export default QueueMonitor;