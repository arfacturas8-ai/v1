#!/usr/bin/env tsx

import { Redis } from 'ioredis';
import { Logger } from 'pino';
import CrybQueueSystem, { CrybQueueSystemConfig } from '../index';
import { queueNames } from '../config/queue-config';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class QueueSystemValidator {
  private redis: Redis;
  private logger: Logger;
  private queueSystem?: CrybQueueSystem;
  private results: ValidationResult[] = [];

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.logger = require('pino')({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
      },
    });
  }

  public async runValidation(): Promise<void> {
    this.logger.info('🚀 Starting CRYB Queue System Validation...');
    
    try {
      await this.validateRedisConnection();
      await this.validateEnvironmentVariables();
      await this.initializeQueueSystem();
      await this.validateQueueSystemComponents();
      await this.runFunctionalTests();
      await this.validatePerformance();
      await this.validateReliability();
      await this.validateMonitoring();
      
      this.printResults();
      
    } catch (error) {
      this.logger.error({ error }, 'Validation failed with error');
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async validateRedisConnection(): Promise<void> {
    this.logger.info('📊 Validating Redis connection...');
    
    try {
      await this.redis.ping();
      this.addResult('Redis Connection', 'pass', 'Redis is accessible and responding');
      
      // Test Redis persistence
      await this.redis.set('test:validation', 'test-value', 'EX', 10);
      const value = await this.redis.get('test:validation');
      
      if (value === 'test-value') {
        this.addResult('Redis Persistence', 'pass', 'Redis read/write operations working');
      } else {
        this.addResult('Redis Persistence', 'fail', 'Redis read/write operations failed');
      }
      
      // Check Redis memory
      const info = await this.redis.info('memory');
      const usedMemory = info.match(/used_memory:(\d+)/)?.[1];
      if (usedMemory) {
        const usedMB = parseInt(usedMemory) / 1024 / 1024;
        this.addResult('Redis Memory', 'pass', `Redis using ${usedMB.toFixed(2)}MB memory`, { usedMB });
      }
      
    } catch (error) {
      this.addResult('Redis Connection', 'fail', `Redis connection failed: ${error}`);
      throw error;
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    this.logger.info('🔧 Validating environment variables...');
    
    const requiredVars = [
      'REDIS_HOST',
      'REDIS_PORT',
    ];
    
    const optionalVars = [
      'REDIS_PASSWORD',
      'RABBITMQ_URL',
      'KAFKA_BROKERS',
      'OPENAI_API_KEY',
      'PERSPECTIVE_API_KEY',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'FCM_SERVER_KEY',
    ];

    let missingRequired = 0;
    let missingOptional = 0;

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.addResult('Environment Variables', 'fail', `Required variable ${varName} is missing`);
        missingRequired++;
      }
    }

    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        missingOptional++;
      }
    }

    if (missingRequired === 0) {
      this.addResult('Required Environment Variables', 'pass', 'All required environment variables are set');
    }

    if (missingOptional > 0) {
      this.addResult('Optional Environment Variables', 'warning', 
        `${missingOptional} optional environment variables are missing (some features may not work)`);
    } else {
      this.addResult('Optional Environment Variables', 'pass', 'All optional environment variables are set');
    }
  }

  private async initializeQueueSystem(): Promise<void> {
    this.logger.info('🔄 Initializing queue system...');
    
    try {
      const config: CrybQueueSystemConfig = {
        redis: {
          primary: this.redis,
        },
        monitoring: {
          enabled: true,
          prometheuseEnabled: false,
        },
        processors: {
          email: { enabled: true, concurrency: 1 },
          pushNotifications: { enabled: true, concurrency: 1 },
          media: { enabled: true, concurrency: 1 },
          moderation: { enabled: true, concurrency: 1 },
          analytics: { enabled: true, concurrency: 1 },
        },
        reliability: {
          deadLetterQueue: { enabled: true },
          circuitBreaker: { enabled: true },
        },
        eventSourcing: {
          enabled: true,
          snapshotFrequency: 10,
        },
      };

      this.queueSystem = new CrybQueueSystem(config, this.logger);
      await this.queueSystem.initialize();
      
      this.addResult('Queue System Initialization', 'pass', 'Queue system initialized successfully');
      
    } catch (error) {
      this.addResult('Queue System Initialization', 'fail', `Initialization failed: ${error}`);
      throw error;
    }
  }

  private async validateQueueSystemComponents(): Promise<void> {
    this.logger.info('🧩 Validating queue system components...');
    
    if (!this.queueSystem) {
      this.addResult('Component Validation', 'fail', 'Queue system not initialized');
      return;
    }

    // Validate processors
    const processorMetrics = this.queueSystem.getProcessorMetrics();
    
    if (processorMetrics.email) {
      this.addResult('Email Processor', 'pass', 'Email processor is available');
    } else {
      this.addResult('Email Processor', 'fail', 'Email processor is not available');
    }

    if (processorMetrics.pushNotifications) {
      this.addResult('Push Notification Processor', 'pass', 'Push notification processor is available');
    } else {
      this.addResult('Push Notification Processor', 'fail', 'Push notification processor is not available');
    }

    if (processorMetrics.media) {
      this.addResult('Media Processor', 'pass', 'Media processor is available');
    } else {
      this.addResult('Media Processor', 'fail', 'Media processor is not available');
    }

    if (processorMetrics.moderation) {
      this.addResult('Moderation Processor', 'pass', 'Moderation processor is available');
    } else {
      this.addResult('Moderation Processor', 'fail', 'Moderation processor is not available');
    }

    if (processorMetrics.analytics) {
      this.addResult('Analytics Processor', 'pass', 'Analytics processor is available');
    } else {
      this.addResult('Analytics Processor', 'fail', 'Analytics processor is not available');
    }

    // Validate reliability components
    const circuitBreakerMetrics = this.queueSystem.getCircuitBreakerMetrics();
    if (Object.keys(circuitBreakerMetrics).length > 0) {
      this.addResult('Circuit Breakers', 'pass', 'Circuit breakers are configured');
    } else {
      this.addResult('Circuit Breakers', 'warning', 'No circuit breakers found');
    }

    const deadLetterStats = await this.queueSystem.getDeadLetterStats();
    if (deadLetterStats) {
      this.addResult('Dead Letter Queue', 'pass', 'Dead letter queue is available');
    } else {
      this.addResult('Dead Letter Queue', 'fail', 'Dead letter queue is not available');
    }

    // Validate monitoring
    const monitoringMetrics = this.queueSystem.getMonitoringMetrics();
    if (monitoringMetrics) {
      this.addResult('Queue Monitoring', 'pass', 'Queue monitoring is active');
    } else {
      this.addResult('Queue Monitoring', 'fail', 'Queue monitoring is not active');
    }
  }

  private async runFunctionalTests(): Promise<void> {
    this.logger.info('🧪 Running functional tests...');
    
    if (!this.queueSystem) {
      this.addResult('Functional Tests', 'fail', 'Queue system not available for testing');
      return;
    }

    try {
      // Test email job
      await this.queueSystem.addEmailJob({
        to: 'test@example.com',
        subject: 'Validation Test',
        html: '<p>This is a validation test email</p>',
        priority: 'normal',
        userId: 'validation-user',
      });
      
      this.addResult('Email Job Submission', 'pass', 'Email job submitted successfully');

      // Test analytics job
      await this.queueSystem.addAnalyticsJob({
        eventType: 'user_action',
        eventName: 'validation_test',
        userId: 'validation-user',
        data: {
          action: 'test',
          category: 'validation',
        },
        context: {
          timestamp: new Date().toISOString(),
          platform: 'validation',
        },
        aggregations: {
          realTime: true,
          daily: true,
        },
      });
      
      this.addResult('Analytics Job Submission', 'pass', 'Analytics job submitted successfully');

      // Test moderation job
      await this.queueSystem.addModerationJob({
        contentId: 'validation-content',
        userId: 'validation-user',
        contentType: 'text',
        content: {
          text: 'This is validation test content',
        },
        moderationRules: {
          checkToxicity: true,
          checkSpam: true,
        },
        priority: 'normal',
        autoAction: false,
      });
      
      this.addResult('Moderation Job Submission', 'pass', 'Moderation job submitted successfully');

      // Wait for some processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check queue metrics
      const queueMetrics = this.queueSystem.getQueueMetrics();
      if (queueMetrics && queueMetrics.eventsPublished > 0) {
        this.addResult('Job Processing', 'pass', 'Jobs are being processed', { 
          eventsPublished: queueMetrics.eventsPublished 
        });
      } else {
        this.addResult('Job Processing', 'warning', 'No job processing detected yet');
      }

    } catch (error) {
      this.addResult('Functional Tests', 'fail', `Functional tests failed: ${error}`);
    }
  }

  private async validatePerformance(): Promise<void> {
    this.logger.info('⚡ Validating performance...');
    
    if (!this.queueSystem) {
      this.addResult('Performance Tests', 'fail', 'Queue system not available for performance testing');
      return;
    }

    try {
      const startTime = Date.now();
      
      // Submit multiple jobs quickly
      const promises = Array.from({ length: 20 }, (_, i) => 
        this.queueSystem!.addAnalyticsJob({
          eventType: 'user_action',
          eventName: `performance_test_${i}`,
          userId: `perf-user-${i}`,
          data: {
            action: 'test',
            category: 'performance',
            value: i,
          },
          context: {
            timestamp: new Date().toISOString(),
            platform: 'validation',
          },
          aggregations: {
            realTime: true,
          },
        })
      );

      await Promise.all(promises);
      
      const submissionTime = Date.now() - startTime;
      
      if (submissionTime < 5000) { // Under 5 seconds
        this.addResult('Job Submission Performance', 'pass', 
          `Submitted 20 jobs in ${submissionTime}ms`, { submissionTime });
      } else {
        this.addResult('Job Submission Performance', 'warning', 
          `Job submission took ${submissionTime}ms (may be slow)`, { submissionTime });
      }

      // Wait and check processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const metrics = this.queueSystem.getQueueMetrics();
      if (metrics) {
        this.addResult('Queue Performance', 'pass', 'Queue metrics available', metrics);
      }

    } catch (error) {
      this.addResult('Performance Tests', 'fail', `Performance tests failed: ${error}`);
    }
  }

  private async validateReliability(): Promise<void> {
    this.logger.info('🛡️ Validating reliability features...');
    
    if (!this.queueSystem) {
      this.addResult('Reliability Tests', 'fail', 'Queue system not available for reliability testing');
      return;
    }

    try {
      // Test circuit breaker metrics
      const circuitBreakerMetrics = this.queueSystem.getCircuitBreakerMetrics();
      const circuitBreakerCount = Object.keys(circuitBreakerMetrics).length;
      
      if (circuitBreakerCount > 0) {
        this.addResult('Circuit Breaker Availability', 'pass', 
          `${circuitBreakerCount} circuit breakers configured`, { 
          circuitBreakerCount,
          circuitBreakers: Object.keys(circuitBreakerMetrics)
        });
      } else {
        this.addResult('Circuit Breaker Availability', 'warning', 'No circuit breakers found');
      }

      // Test dead letter queue
      const deadLetterStats = await this.queueSystem.getDeadLetterStats();
      if (deadLetterStats && deadLetterStats.metrics) {
        this.addResult('Dead Letter Queue Availability', 'pass', 
          'Dead letter queue is functioning', deadLetterStats.metrics);
      } else {
        this.addResult('Dead Letter Queue Availability', 'fail', 'Dead letter queue not available');
      }

      // Test error handling by submitting invalid job
      try {
        await this.queueSystem.addEmailJob({
          // Missing required fields to trigger validation error
          subject: 'Invalid Email Test',
        } as any);
        
        this.addResult('Error Handling', 'fail', 'Invalid job was accepted (should have been rejected)');
      } catch (error) {
        this.addResult('Error Handling', 'pass', 'Invalid job was properly rejected');
      }

    } catch (error) {
      this.addResult('Reliability Tests', 'fail', `Reliability tests failed: ${error}`);
    }
  }

  private async validateMonitoring(): Promise<void> {
    this.logger.info('📈 Validating monitoring and metrics...');
    
    if (!this.queueSystem) {
      this.addResult('Monitoring Tests', 'fail', 'Queue system not available for monitoring testing');
      return;
    }

    try {
      // Test queue metrics
      const queueMetrics = this.queueSystem.getQueueMetrics();
      if (queueMetrics) {
        this.addResult('Queue Metrics', 'pass', 'Queue metrics are available', {
          keys: Object.keys(queueMetrics)
        });
      } else {
        this.addResult('Queue Metrics', 'fail', 'Queue metrics not available');
      }

      // Test monitoring metrics
      const monitoringMetrics = this.queueSystem.getMonitoringMetrics();
      if (monitoringMetrics && monitoringMetrics.global) {
        this.addResult('Monitoring Metrics', 'pass', 'Monitoring metrics are available', {
          global: monitoringMetrics.global,
          queueCount: monitoringMetrics.queues?.length || 0
        });
      } else {
        this.addResult('Monitoring Metrics', 'fail', 'Monitoring metrics not available');
      }

      // Test Prometheus metrics
      const prometheusMetrics = this.queueSystem.getPrometheusMetrics();
      if (prometheusMetrics) {
        const metricLines = prometheusMetrics.split('\n').filter(line => 
          line.startsWith('# HELP') || line.startsWith('# TYPE')
        ).length;
        
        this.addResult('Prometheus Metrics', 'pass', 
          `Prometheus metrics available with ${metricLines} metric types`);
      } else {
        this.addResult('Prometheus Metrics', 'warning', 'Prometheus metrics not available');
      }

      // Test processor metrics
      const processorMetrics = this.queueSystem.getProcessorMetrics();
      const availableProcessors = Object.keys(processorMetrics).filter(key => 
        processorMetrics[key] !== null && processorMetrics[key] !== undefined
      );
      
      this.addResult('Processor Metrics', 'pass', 
        `Metrics available for ${availableProcessors.length} processors`, {
        availableProcessors
      });

    } catch (error) {
      this.addResult('Monitoring Tests', 'fail', `Monitoring tests failed: ${error}`);
    }
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({ component, status, message, details });
  }

  private printResults(): void {
    this.logger.info('📋 Validation Results:');
    this.logger.info('=' .repeat(80));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
      const reset = '\x1b[0m';
      
      console.log(`${icon} ${color}${result.component}${reset}: ${result.message}`);
      
      if (result.details && process.env.VERBOSE === 'true') {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    this.logger.info('=' .repeat(80));
    this.logger.info(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);

    if (failed > 0) {
      this.logger.error('❌ Validation failed! Please fix the issues above.');
      process.exit(1);
    } else if (warnings > 0) {
      this.logger.warn('⚠️ Validation completed with warnings. Some features may not work optimally.');
    } else {
      this.logger.info('✅ All validations passed! Queue system is ready for production.');
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.queueSystem) {
        await this.queueSystem.shutdown();
      }
      await this.redis.quit();
    } catch (error) {
      this.logger.warn({ error }, 'Error during cleanup');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new QueueSystemValidator();
  validator.runValidation().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export default QueueSystemValidator;