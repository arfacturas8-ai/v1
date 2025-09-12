import { Logger } from 'pino';
import { AlertConfig, HealthStatus, JobMetrics } from './queue-types';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: any;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  queueName?: string;
  jobId?: string;
}

export enum AlertType {
  QUEUE_LENGTH_HIGH = 'queue_length_high',
  FAILURE_RATE_HIGH = 'failure_rate_high',
  PROCESSING_TIME_HIGH = 'processing_time_high',
  MEMORY_USAGE_HIGH = 'memory_usage_high',
  REDIS_CONNECTION_LOST = 'redis_connection_lost',
  CIRCUIT_BREAKER_OPEN = 'circuit_breaker_open',
  WORKER_CRASHED = 'worker_crashed',
  DEAD_LETTER_QUEUE_FULL = 'dead_letter_queue_full',
  JOB_STUCK = 'job_stuck',
  CRON_JOB_FAILED = 'cron_job_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DISK_SPACE_LOW = 'disk_space_low'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

export class AlertingSystem {
  private alerts: Map<string, Alert> = new Map();
  private alertChannels: Map<string, AlertChannel> = new Map();
  private alertHistory: Alert[] = [];
  private suppressedAlerts: Map<string, number> = new Map(); // Alert type -> timestamp when suppression ends
  private alertCounters: Map<string, number> = new Map();
  private lastMetricsCheck = Date.now();

  constructor(
    private config: AlertConfig,
    private logger: Logger
  ) {
    this.setupDefaultChannels();
    this.startPeriodicChecks();
  }

  private setupDefaultChannels(): void {
    // Email channel
    this.addChannel({
      name: 'email',
      type: 'email',
      enabled: true,
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        from: process.env.ALERT_FROM_EMAIL || 'alerts@cryb.com',
        to: process.env.ALERT_TO_EMAIL?.split(',') || []
      }
    });

    // Webhook channel
    this.addChannel({
      name: 'webhook',
      type: 'webhook',
      enabled: !!process.env.ALERT_WEBHOOK_URL,
      config: {
        url: process.env.ALERT_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.ALERT_WEBHOOK_TOKEN ? `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` : undefined
        }
      }
    });

    // Slack channel
    this.addChannel({
      name: 'slack',
      type: 'slack',
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts',
        username: 'CRYB Queue Alert',
        iconEmoji: ':warning:'
      }
    });
  }

  private startPeriodicChecks(): void {
    // Check metrics every minute
    setInterval(() => {
      this.checkMetricsThresholds();
    }, 60000);

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);

    // Clean up suppressions
    setInterval(() => {
      this.cleanupSuppressions();
    }, 300000); // Every 5 minutes
  }

  addChannel(channel: AlertChannel): void {
    this.alertChannels.set(channel.name, channel);
    this.logger.info(`Alert channel '${channel.name}' added`);
  }

  removeChannel(name: string): boolean {
    const removed = this.alertChannels.delete(name);
    if (removed) {
      this.logger.info(`Alert channel '${name}' removed`);
    }
    return removed;
  }

  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    data: any = {},
    queueName?: string,
    jobId?: string
  ): Promise<string> {
    const alertId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      resolved: false,
      queueName,
      jobId
    };

    // Check if this alert type is currently suppressed
    const suppressedUntil = this.suppressedAlerts.get(type);
    if (suppressedUntil && Date.now() < suppressedUntil) {
      this.logger.debug(`Alert ${type} suppressed until ${new Date(suppressedUntil).toISOString()}`);
      return alertId;
    }

    // Check cooldown period
    const lastAlertKey = `${type}-${queueName || 'global'}`;
    const lastAlertTime = this.alertCounters.get(lastAlertKey) || 0;
    const cooldownMs = this.config.cooldownPeriod * 60 * 1000;
    
    if (Date.now() - lastAlertTime < cooldownMs) {
      this.logger.debug(`Alert ${type} in cooldown period`);
      return alertId;
    }

    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);
    this.alertCounters.set(lastAlertKey, Date.now());

    // Trim alert history
    if (this.alertHistory.length > 10000) {
      this.alertHistory = this.alertHistory.slice(-5000);
    }

    this.logger.warn(`Alert created: ${type} - ${title}`, { 
      alertId, 
      severity, 
      queueName, 
      jobId,
      data 
    });

    // Send to configured channels
    if (this.config.enabled) {
      await this.sendToChannels(alert);
    }

    return alertId;
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    
    this.logger.info(`Alert resolved: ${alertId}`, { 
      type: alert.type, 
      resolvedBy 
    });

    // Send resolution notification to channels
    if (this.config.enabled) {
      await this.sendResolutionToChannels(alert, resolvedBy);
    }

    return true;
  }

  suppressAlertType(type: AlertType, durationMinutes: number): void {
    const suppressUntil = Date.now() + (durationMinutes * 60 * 1000);
    this.suppressedAlerts.set(type, suppressUntil);
    
    this.logger.info(`Alert type ${type} suppressed for ${durationMinutes} minutes`);
  }

  private async sendToChannels(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.alertChannels.values())
      .filter(channel => channel.enabled && this.config.channels.includes(channel.type));

    for (const channel of enabledChannels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(alert, channel);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, channel);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, channel);
            break;
          case 'sms':
            await this.sendSmsAlert(alert, channel);
            break;
          default:
            this.logger.warn(`Unknown alert channel type: ${channel.type}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send alert to ${channel.name}:`, error);
      }
    }
  }

  private async sendResolutionToChannels(alert: Alert, resolvedBy?: string): Promise<void> {
    const enabledChannels = Array.from(this.alertChannels.values())
      .filter(channel => channel.enabled && this.config.channels.includes(channel.type));

    for (const channel of enabledChannels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailResolution(alert, channel, resolvedBy);
            break;
          case 'slack':
            await this.sendSlackResolution(alert, channel, resolvedBy);
            break;
          case 'webhook':
            await this.sendWebhookResolution(alert, channel, resolvedBy);
            break;
          default:
            // Skip SMS for resolutions unless critical
            if (channel.type === 'sms' && alert.severity === AlertSeverity.CRITICAL) {
              await this.sendSmsResolution(alert, channel, resolvedBy);
            }
        }
      } catch (error) {
        this.logger.error(`Failed to send resolution to ${channel.name}:`, error);
      }
    }
  }

  private async sendEmailAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    if (!channel.config.to || channel.config.to.length === 0) {
      this.logger.warn('No email recipients configured');
      return;
    }

    const subject = `[${alert.severity.toUpperCase()}] CRYB Queue Alert: ${alert.title}`;
    const body = this.formatEmailBody(alert);

    // Here you would integrate with your email service (SendGrid, NodeMailer, etc.)
    this.logger.info(`Would send email alert to ${channel.config.to.join(', ')}`, {
      subject,
      body: body.substring(0, 200) + '...'
    });
  }

  private async sendSlackAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Queue',
              value: alert.queueName || 'Global',
              short: true
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true
            },
            {
              title: 'Alert ID',
              value: alert.id,
              short: true
            }
          ],
          footer: 'CRYB Queue Monitor',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
        }
      ]
    };

    // Here you would send to Slack webhook
    this.logger.info(`Would send Slack alert to ${channel.config.channel}`, payload);
  }

  private async sendWebhookAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    const payload = {
      type: 'alert',
      alert: {
        ...alert,
        environment: process.env.NODE_ENV || 'development',
        service: 'cryb-queue-worker'
      }
    };

    // Here you would make HTTP request to webhook
    this.logger.info(`Would send webhook alert to ${channel.config.url}`, payload);
  }

  private async sendSmsAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    if (alert.severity !== AlertSeverity.CRITICAL && alert.severity !== AlertSeverity.HIGH) {
      return; // Only send SMS for critical/high severity alerts
    }

    const message = `CRYB Alert [${alert.severity.toUpperCase()}]: ${alert.title}. Queue: ${alert.queueName || 'Global'}. Time: ${new Date(alert.timestamp).toLocaleString()}`;

    // Here you would integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.info(`Would send SMS alert`, { message });
  }

  private async sendEmailResolution(alert: Alert, channel: AlertChannel, resolvedBy?: string): Promise<void> {
    const subject = `[RESOLVED] CRYB Queue Alert: ${alert.title}`;
    const body = this.formatEmailResolutionBody(alert, resolvedBy);

    this.logger.info(`Would send email resolution to ${channel.config.to.join(', ')}`, {
      subject,
      body: body.substring(0, 200) + '...'
    });
  }

  private async sendSlackResolution(alert: Alert, channel: AlertChannel, resolvedBy?: string): Promise<void> {
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: ':white_check_mark:',
      attachments: [
        {
          color: 'good',
          title: `✅ RESOLVED: ${alert.title}`,
          fields: [
            {
              title: 'Resolution Time',
              value: new Date(alert.resolvedAt!).toLocaleString(),
              short: true
            },
            {
              title: 'Resolved By',
              value: resolvedBy || 'System',
              short: true
            },
            {
              title: 'Duration',
              value: this.formatDuration(new Date(alert.timestamp), new Date(alert.resolvedAt!)),
              short: true
            }
          ]
        }
      ]
    };

    this.logger.info(`Would send Slack resolution to ${channel.config.channel}`, payload);
  }

  private async sendWebhookResolution(alert: Alert, channel: AlertChannel, resolvedBy?: string): Promise<void> {
    const payload = {
      type: 'alert_resolution',
      alert: {
        ...alert,
        resolvedBy,
        duration: new Date(alert.resolvedAt!).getTime() - new Date(alert.timestamp).getTime()
      }
    };

    this.logger.info(`Would send webhook resolution to ${channel.config.url}`, payload);
  }

  private async sendSmsResolution(alert: Alert, channel: AlertChannel, resolvedBy?: string): Promise<void> {
    const message = `CRYB Alert RESOLVED: ${alert.title}. Duration: ${this.formatDuration(new Date(alert.timestamp), new Date(alert.resolvedAt!))}`;

    this.logger.info(`Would send SMS resolution`, { message });
  }

  checkMetricsThresholds(metrics?: JobMetrics, healthStatus?: HealthStatus): void {
    if (!this.config.enabled) return;

    const now = Date.now();
    
    // Only run checks every minute minimum
    if (now - this.lastMetricsCheck < 60000) return;
    this.lastMetricsCheck = now;

    if (metrics) {
      // Check queue length threshold
      if (metrics.queueLength > this.config.thresholds.queueLength) {
        this.createAlert(
          AlertType.QUEUE_LENGTH_HIGH,
          AlertSeverity.HIGH,
          'Queue Length Exceeded Threshold',
          `Queue length (${metrics.queueLength}) exceeded threshold (${this.config.thresholds.queueLength})`,
          { queueLength: metrics.queueLength, threshold: this.config.thresholds.queueLength }
        );
      }

      // Check failure rate threshold
      const failureRate = metrics.totalFailed / (metrics.totalProcessed + metrics.totalFailed) || 0;
      if (failureRate > this.config.thresholds.failureRate) {
        this.createAlert(
          AlertType.FAILURE_RATE_HIGH,
          AlertSeverity.HIGH,
          'Failure Rate Exceeded Threshold',
          `Failure rate (${(failureRate * 100).toFixed(2)}%) exceeded threshold (${(this.config.thresholds.failureRate * 100).toFixed(2)}%)`,
          { failureRate, threshold: this.config.thresholds.failureRate }
        );
      }

      // Check processing time threshold
      if (metrics.averageProcessingTime > this.config.thresholds.processingTime) {
        this.createAlert(
          AlertType.PROCESSING_TIME_HIGH,
          AlertSeverity.MEDIUM,
          'Processing Time Exceeded Threshold',
          `Average processing time (${metrics.averageProcessingTime}ms) exceeded threshold (${this.config.thresholds.processingTime}ms)`,
          { averageProcessingTime: metrics.averageProcessingTime, threshold: this.config.thresholds.processingTime }
        );
      }
    }

    if (healthStatus) {
      // Check Redis connection
      if (!healthStatus.redis.connected) {
        this.createAlert(
          AlertType.REDIS_CONNECTION_LOST,
          AlertSeverity.CRITICAL,
          'Redis Connection Lost',
          'Connection to Redis server has been lost',
          { redisStatus: healthStatus.redis }
        );
      }

      // Check circuit breaker state
      if (healthStatus.circuitBreaker.state === 'OPEN') {
        this.createAlert(
          AlertType.CIRCUIT_BREAKER_OPEN,
          AlertSeverity.HIGH,
          'Circuit Breaker Opened',
          `Circuit breaker opened after ${healthStatus.circuitBreaker.failureCount} failures`,
          { circuitBreaker: healthStatus.circuitBreaker }
        );
      }

      // Check worker health
      if (healthStatus.workers.healthy < healthStatus.workers.total) {
        this.createAlert(
          AlertType.WORKER_CRASHED,
          AlertSeverity.HIGH,
          'Worker Health Degraded',
          `${healthStatus.workers.total - healthStatus.workers.healthy} of ${healthStatus.workers.total} workers are unhealthy`,
          { workers: healthStatus.workers }
        );
      }
    }
  }

  private formatEmailBody(alert: Alert): string {
    return `
CRYB Queue Alert

Alert ID: ${alert.id}
Severity: ${alert.severity.toUpperCase()}
Type: ${alert.type}
Queue: ${alert.queueName || 'Global'}
Job ID: ${alert.jobId || 'N/A'}
Time: ${new Date(alert.timestamp).toLocaleString()}

Title: ${alert.title}

Message: ${alert.message}

Additional Data:
${JSON.stringify(alert.data, null, 2)}

---
This alert was generated by the CRYB Queue Monitoring System.
Environment: ${process.env.NODE_ENV || 'development'}
    `.trim();
  }

  private formatEmailResolutionBody(alert: Alert, resolvedBy?: string): string {
    const duration = this.formatDuration(new Date(alert.timestamp), new Date(alert.resolvedAt!));
    
    return `
CRYB Queue Alert Resolution

The following alert has been resolved:

Alert ID: ${alert.id}
Original Title: ${alert.title}
Severity: ${alert.severity.toUpperCase()}
Queue: ${alert.queueName || 'Global'}
Resolved By: ${resolvedBy || 'System'}
Resolution Time: ${new Date(alert.resolvedAt!).toLocaleString()}
Duration: ${duration}

---
This resolution was generated by the CRYB Queue Monitoring System.
    `.trim();
  }

  private formatDuration(start: Date, end: Date): string {
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'danger';
      case AlertSeverity.HIGH: return 'warning';
      case AlertSeverity.MEDIUM: return '#ffeb3b';
      case AlertSeverity.LOW: return 'good';
      case AlertSeverity.INFO: return '#2196f3';
      default: return 'warning';
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return ':rotating_light:';
      case AlertSeverity.HIGH: return ':warning:';
      case AlertSeverity.MEDIUM: return ':exclamation:';
      case AlertSeverity.LOW: return ':information_source:';
      case AlertSeverity.INFO: return ':bulb:';
      default: return ':question:';
    }
  }

  private cleanupOldAlerts(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Remove resolved alerts older than a week
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && new Date(alert.resolvedAt!).getTime() < oneWeekAgo) {
        this.alerts.delete(alertId);
      }
    }

    // Trim alert history
    this.alertHistory = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > oneWeekAgo
    );

    this.logger.debug('Cleaned up old alerts');
  }

  private cleanupSuppressions(): void {
    const now = Date.now();
    
    for (const [type, suppressUntil] of this.suppressedAlerts.entries()) {
      if (now >= suppressUntil) {
        this.suppressedAlerts.delete(type);
        this.logger.info(`Alert suppression removed for type: ${type}`);
      }
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getAlertStats(): {
    active: number;
    resolved: number;
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    const active = alerts.filter(a => !a.resolved).length;
    const resolved = alerts.filter(a => a.resolved).length;
    
    const bySeverity = {} as Record<AlertSeverity, number>;
    const byType = {} as Record<AlertType, number>;
    
    Object.values(AlertSeverity).forEach(severity => {
      bySeverity[severity] = 0;
    });
    
    Object.values(AlertType).forEach(type => {
      byType[type] = 0;
    });
    
    alerts.forEach(alert => {
      bySeverity[alert.severity]++;
      byType[alert.type]++;
    });

    return {
      active,
      resolved,
      total: alerts.length,
      bySeverity,
      byType
    };
  }

  async testChannel(channelName: string): Promise<boolean> {
    const channel = this.alertChannels.get(channelName);
    if (!channel) {
      this.logger.error(`Alert channel '${channelName}' not found`);
      return false;
    }

    try {
      const testAlert: Alert = {
        id: `test-${Date.now()}`,
        type: AlertType.WORKER_CRASHED,
        severity: AlertSeverity.INFO,
        title: 'Test Alert',
        message: `This is a test alert sent to channel '${channelName}'`,
        data: { test: true },
        timestamp: new Date().toISOString(),
        resolved: false
      };

      switch (channel.type) {
        case 'email':
          await this.sendEmailAlert(testAlert, channel);
          break;
        case 'slack':
          await this.sendSlackAlert(testAlert, channel);
          break;
        case 'webhook':
          await this.sendWebhookAlert(testAlert, channel);
          break;
        case 'sms':
          await this.sendSmsAlert(testAlert, channel);
          break;
      }

      this.logger.info(`Test alert sent successfully to channel '${channelName}'`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send test alert to channel '${channelName}':`, error);
      return false;
    }
  }

  getConfiguration(): AlertConfig {
    return { ...this.config };
  }

  updateConfiguration(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Alert configuration updated', newConfig);
  }
}