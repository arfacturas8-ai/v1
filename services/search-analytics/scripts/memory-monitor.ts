#!/usr/bin/env ts-node

/**
 * CRYB Platform - Memory Monitor Script
 * Monitors memory usage across all search infrastructure components
 * Sends alerts when thresholds are exceeded
 */

import { elasticsearchClient } from '../src/elasticsearch/client';
import { timescaleClient } from '../src/analytics/timescale-client';
import { kafkaConsumer } from '../src/data-pipeline/kafka-consumer';
import { logger } from '../src/utils/logger';

interface MemoryAlert {
  component: string;
  severity: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

class MemoryMonitor {
  private alertThresholds = {
    elasticsearch: {
      heap_usage_warning: 80,
      heap_usage_critical: 90,
      circuit_breaker_critical: true
    },
    nodejs: {
      heap_usage_warning: 75,
      heap_usage_critical: 85,
      external_memory_warning: 1024 // MB
    },
    timescale: {
      connection_usage_warning: 80,
      connection_usage_critical: 90,
      database_size_warning: 50 * 1024 * 1024 * 1024 // 50GB
    },
    kafka: {
      queue_usage_warning: 70,
      queue_usage_critical: 85,
      memory_usage_warning: 80,
      memory_usage_critical: 90
    }
  };

  private alerts: MemoryAlert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private alertCooldown = 5 * 60 * 1000; // 5 minutes

  async runHealthCheck(): Promise<void> {
    try {
      logger.info('Starting memory health check');
      
      // Clear previous alerts
      this.alerts = [];

      // Check all components
      await Promise.all([
        this.checkElasticsearchMemory(),
        this.checkNodeJSMemory(),
        this.checkTimescaleMemory(),
        this.checkKafkaMemory()
      ]);

      // Process alerts
      await this.processAlerts();

      logger.info('Memory health check completed', {
        alertsGenerated: this.alerts.length
      });

    } catch (error) {
      logger.error('Memory health check failed', { error });
    }
  }

  private async checkElasticsearchMemory(): Promise<void> {
    try {
      const stats = await elasticsearchClient.getClusterPerformanceStats();
      const memoryUsage = stats.memory?.heap_usage_percent || 0;

      // Check heap usage
      if (memoryUsage >= this.alertThresholds.elasticsearch.heap_usage_critical) {
        this.addAlert('elasticsearch', 'critical', 
          `Elasticsearch heap usage critical: ${memoryUsage}%`,
          'heap_usage_percent', memoryUsage, this.alertThresholds.elasticsearch.heap_usage_critical);
      } else if (memoryUsage >= this.alertThresholds.elasticsearch.heap_usage_warning) {
        this.addAlert('elasticsearch', 'warning',
          `Elasticsearch heap usage high: ${memoryUsage}%`,
          'heap_usage_percent', memoryUsage, this.alertThresholds.elasticsearch.heap_usage_warning);
      }

      // Check circuit breaker
      if (stats.memory?.circuit_breaker_status === 'open') {
        this.addAlert('elasticsearch', 'critical',
          'Elasticsearch circuit breaker is open - memory protection active',
          'circuit_breaker_status', 1, 0);
      }

      // Check cluster status
      if (stats.cluster?.status === 'red') {
        this.addAlert('elasticsearch', 'critical',
          'Elasticsearch cluster status is RED',
          'cluster_status', 0, 1);
      }

    } catch (error) {
      this.addAlert('elasticsearch', 'critical',
        'Failed to check Elasticsearch memory - service may be down',
        'availability', 0, 1);
    }
  }

  private async checkNodeJSMemory(): Promise<void> {
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const externalMB = memUsage.external / 1024 / 1024;

    // Check heap usage
    if (heapUsagePercent >= this.alertThresholds.nodejs.heap_usage_critical) {
      this.addAlert('nodejs', 'critical',
        `Node.js heap usage critical: ${heapUsagePercent.toFixed(2)}%`,
        'heap_usage_percent', heapUsagePercent, this.alertThresholds.nodejs.heap_usage_critical);
    } else if (heapUsagePercent >= this.alertThresholds.nodejs.heap_usage_warning) {
      this.addAlert('nodejs', 'warning',
        `Node.js heap usage high: ${heapUsagePercent.toFixed(2)}%`,
        'heap_usage_percent', heapUsagePercent, this.alertThresholds.nodejs.heap_usage_warning);
    }

    // Check external memory
    if (externalMB >= this.alertThresholds.nodejs.external_memory_warning) {
      this.addAlert('nodejs', 'warning',
        `Node.js external memory high: ${externalMB.toFixed(0)}MB`,
        'external_memory_mb', externalMB, this.alertThresholds.nodejs.external_memory_warning);
    }
  }

  private async checkTimescaleMemory(): Promise<void> {
    try {
      const stats = await timescaleClient.getDatabasePerformanceStats();
      
      // Check connection usage
      const activeConnections = stats.connections?.active_connections || 0;
      const totalConnections = stats.connections?.total_connections || 1;
      const connectionUsagePercent = (activeConnections / totalConnections) * 100;

      if (connectionUsagePercent >= this.alertThresholds.timescale.connection_usage_critical) {
        this.addAlert('timescale', 'critical',
          `TimescaleDB connection usage critical: ${connectionUsagePercent.toFixed(2)}%`,
          'connection_usage_percent', connectionUsagePercent, this.alertThresholds.timescale.connection_usage_critical);
      } else if (connectionUsagePercent >= this.alertThresholds.timescale.connection_usage_warning) {
        this.addAlert('timescale', 'warning',
          `TimescaleDB connection usage high: ${connectionUsagePercent.toFixed(2)}%`,
          'connection_usage_percent', connectionUsagePercent, this.alertThresholds.timescale.connection_usage_warning);
      }

      // Check database size
      const databaseSizeBytes = stats.database?.database_size_bytes || 0;
      if (databaseSizeBytes >= this.alertThresholds.timescale.database_size_warning) {
        this.addAlert('timescale', 'warning',
          `TimescaleDB database size large: ${(databaseSizeBytes / 1024 / 1024 / 1024).toFixed(2)}GB`,
          'database_size_gb', databaseSizeBytes / 1024 / 1024 / 1024, this.alertThresholds.timescale.database_size_warning / 1024 / 1024 / 1024);
      }

    } catch (error) {
      this.addAlert('timescale', 'critical',
        'Failed to check TimescaleDB memory - service may be down',
        'availability', 0, 1);
    }
  }

  private async checkKafkaMemory(): Promise<void> {
    try {
      const stats = await kafkaConsumer.getConsumerMetrics();
      
      // Check system memory
      const memoryPercent = parseFloat(stats.system_memory?.heap_usage_percent || '0');
      if (memoryPercent >= this.alertThresholds.kafka.memory_usage_critical) {
        this.addAlert('kafka', 'critical',
          `Kafka consumer memory usage critical: ${memoryPercent}%`,
          'memory_usage_percent', memoryPercent, this.alertThresholds.kafka.memory_usage_critical);
      } else if (memoryPercent >= this.alertThresholds.kafka.memory_usage_warning) {
        this.addAlert('kafka', 'warning',
          `Kafka consumer memory usage high: ${memoryPercent}%`,
          'memory_usage_percent', memoryPercent, this.alertThresholds.kafka.memory_usage_warning);
      }

      // Check queue usage for each consumer
      for (const [consumerId, consumerStats] of Object.entries(stats.consumers || {})) {
        const queueUsage = parseFloat((consumerStats as any).queue_usage_percent || '0');
        
        if (queueUsage >= this.alertThresholds.kafka.queue_usage_critical) {
          this.addAlert('kafka', 'critical',
            `Kafka consumer ${consumerId} queue usage critical: ${queueUsage}%`,
            'queue_usage_percent', queueUsage, this.alertThresholds.kafka.queue_usage_critical);
        } else if (queueUsage >= this.alertThresholds.kafka.queue_usage_warning) {
          this.addAlert('kafka', 'warning',
            `Kafka consumer ${consumerId} queue usage high: ${queueUsage}%`,
            'queue_usage_percent', queueUsage, this.alertThresholds.kafka.queue_usage_warning);
        }
      }

    } catch (error) {
      this.addAlert('kafka', 'critical',
        'Failed to check Kafka memory - service may be down',
        'availability', 0, 1);
    }
  }

  private addAlert(component: string, severity: 'warning' | 'critical', message: string, 
                  metric: string, value: number, threshold: number): void {
    const alertKey = `${component}-${metric}-${severity}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertKey);

    // Check cooldown period
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return;
    }

    this.alerts.push({
      component,
      severity,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString()
    });

    this.lastAlertTime.set(alertKey, now);
  }

  private async processAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      logger.info('No memory alerts detected - all systems healthy');
      return;
    }

    // Group alerts by severity
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning');

    if (criticalAlerts.length > 0) {
      logger.error('CRITICAL memory alerts detected', { 
        criticalCount: criticalAlerts.length,
        alerts: criticalAlerts 
      });
      await this.triggerCriticalResponse(criticalAlerts);
    }

    if (warningAlerts.length > 0) {
      logger.warn('WARNING memory alerts detected', { 
        warningCount: warningAlerts.length,
        alerts: warningAlerts 
      });
      await this.triggerWarningResponse(warningAlerts);
    }

    // Send notifications (webhook, email, etc.)
    await this.sendAlertNotifications(this.alerts);
  }

  private async triggerCriticalResponse(alerts: MemoryAlert[]): Promise<void> {
    logger.info('Triggering critical response actions');

    for (const alert of alerts) {
      try {
        switch (alert.component) {
          case 'elasticsearch':
            if (alert.metric === 'heap_usage_percent') {
              await elasticsearchClient.clearCache();
              logger.info('Cleared Elasticsearch cache due to critical memory usage');
            }
            break;

          case 'nodejs':
            if (global.gc) {
              global.gc();
              logger.info('Forced garbage collection due to critical memory usage');
            }
            break;

          case 'kafka':
            await kafkaConsumer.optimizeMemoryUsage();
            logger.info('Optimized Kafka memory usage due to critical alert');
            break;

          case 'timescale':
            // Could implement connection pool reduction or query cancellation
            logger.info('TimescaleDB critical alert - manual intervention may be required');
            break;
        }
      } catch (error) {
        logger.error('Failed to execute critical response action', { 
          component: alert.component, 
          error 
        });
      }
    }
  }

  private async triggerWarningResponse(alerts: MemoryAlert[]): Promise<void> {
    logger.info('Triggering warning response actions');

    // Implement lighter response actions for warnings
    for (const alert of alerts) {
      if (alert.component === 'kafka' && alert.metric === 'queue_usage_percent') {
        // Could reduce batch sizes or processing intervals
        logger.info('Consider reducing Kafka batch sizes');
      }
    }
  }

  private async sendAlertNotifications(alerts: MemoryAlert[]): Promise<void> {
    // Implement notification logic (webhook, email, Slack, etc.)
    // This is a placeholder - integrate with your notification system
    
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    logger.info('Alert notifications prepared', {
      criticalAlerts: criticalCount,
      warningAlerts: warningCount,
      totalAlerts: alerts.length
    });

    // Example webhook notification (uncomment and configure as needed)
    /*
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `CRYB Memory Alert: ${criticalCount} critical, ${warningCount} warning`,
            alerts: alerts
          })
        });
      } catch (error) {
        logger.error('Failed to send webhook notification', { error });
      }
    }
    */
  }

  // Generate performance report
  async generatePerformanceReport(): Promise<any> {
    try {
      const [esStats, dbStats, kafkaStats] = await Promise.all([
        elasticsearchClient.getClusterPerformanceStats().catch(() => null),
        timescaleClient.getDatabasePerformanceStats().catch(() => null),
        kafkaConsumer.getConsumerMetrics().catch(() => null)
      ]);

      const nodeMemory = process.memoryUsage();

      return {
        timestamp: new Date().toISOString(),
        overall_health: this.calculateOverallHealth(esStats, dbStats, kafkaStats),
        components: {
          elasticsearch: esStats,
          timescale: dbStats,
          kafka: kafkaStats,
          nodejs: {
            memory: nodeMemory,
            uptime: process.uptime(),
            cpu_usage: process.cpuUsage()
          }
        },
        alerts: this.alerts,
        recommendations: this.generateRecommendations(esStats, dbStats, kafkaStats, nodeMemory)
      };
    } catch (error) {
      logger.error('Failed to generate performance report', { error });
      return { error: 'Failed to generate report' };
    }
  }

  private calculateOverallHealth(esStats: any, dbStats: any, kafkaStats: any): string {
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning').length;

    if (criticalAlerts > 0) return 'critical';
    if (warningAlerts > 2) return 'degraded';
    if (warningAlerts > 0) return 'warning';
    return 'healthy';
  }

  private generateRecommendations(esStats: any, dbStats: any, kafkaStats: any, nodeMemory: any): string[] {
    const recommendations = [];

    // Elasticsearch recommendations
    if (esStats?.memory?.heap_usage_percent > 80) {
      recommendations.push('Consider increasing Elasticsearch heap size or reducing query complexity');
    }

    // Node.js recommendations
    const heapUsage = (nodeMemory.heapUsed / nodeMemory.heapTotal) * 100;
    if (heapUsage > 75) {
      recommendations.push('Consider increasing Node.js heap size with --max-old-space-size flag');
    }

    // TimescaleDB recommendations
    if (dbStats?.connections?.active_connections > 200) {
      recommendations.push('Consider optimizing database queries or increasing connection pool size');
    }

    // Kafka recommendations
    const memoryPercent = parseFloat(kafkaStats?.system_memory?.heap_usage_percent || '0');
    if (memoryPercent > 80) {
      recommendations.push('Consider reducing Kafka batch sizes or processing intervals');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating within normal parameters');
    }

    return recommendations;
  }
}

// CLI execution
async function main() {
  const monitor = new MemoryMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await monitor.runHealthCheck();
      break;
      
    case 'report':
      const report = await monitor.generatePerformanceReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'monitor':
      // Continuous monitoring mode
      console.log('Starting continuous memory monitoring...');
      setInterval(async () => {
        await monitor.runHealthCheck();
      }, 60000); // Check every minute
      break;
      
    default:
      console.log('Usage: memory-monitor.ts [check|report|monitor]');
      console.log('  check   - Run one-time health check');
      console.log('  report  - Generate performance report');
      console.log('  monitor - Start continuous monitoring');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Memory monitor failed:', error);
    process.exit(1);
  });
}

export { MemoryMonitor };