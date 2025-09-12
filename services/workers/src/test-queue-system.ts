#!/usr/bin/env tsx

import pino from 'pino';
import { QueueManager, QueueManagerConfig } from './core/queue-manager';
import { CrashProofMessagesWorker } from './workers/crash-proof-messages.worker';
import { JobPriority } from './core/queue-types';
import { Job } from 'bullmq';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

// Test worker instance
const testWorker = new CrashProofMessagesWorker(logger.child({ worker: 'test' }));

// Minimal test configuration
const testConfig: QueueManagerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD || 'cryb_redis_password',
    db: 1 // Use different DB for testing
  },
  queues: {
    test_messages: {
      config: {
        name: 'test_messages',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 10,
          attempts: 2,
          backoff: { type: 'exponential', delay: 1000 }
        },
        concurrency: 2,
        removeOnComplete: 10,
        removeOnFail: 10,
        maxStalledCount: 2,
        stalledInterval: 10000,
        retryConfig: {
          attempts: 2,
          backoff: { type: 'exponential', delay: 1000 }
        }
      },
      workerConfig: {
        concurrency: 2,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 10 },
        settings: {
          stalledInterval: 10000,
          maxStalledCount: 2,
          retryProcessDelay: 2000
        }
      },
      processor: async (job: Job) => {
        logger.info(`Test processor handling job: ${job.name} (${job.id})`);
        
        // Simulate different job types for testing
        switch (job.name) {
          case 'test-success':
            await new Promise(resolve => setTimeout(resolve, 500));
            return { status: 'success', processed: true };
          
          case 'test-failure':
            throw new Error('Simulated failure for testing');
          
          case 'test-slow':
            await new Promise(resolve => setTimeout(resolve, 3000));
            return { status: 'success', processed: true, slow: true };
          
          default:
            return await testWorker.processJob(job);
        }
      },
      deduplication: {
        enabled: true,
        keyGenerator: (data: any) => `test-${data.id || 'unknown'}`,
        ttl: 60
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 10000,
        monitoringPeriod: 30000
      }
    }
  },
  cron: {
    enabled: false, // Disable cron for testing
    jobs: []
  },
  alerting: {
    enabled: false, // Disable alerting for testing
    channels: [],
    thresholds: {
      queueLength: 100,
      failureRate: 0.5,
      processingTime: 10000,
      memoryUsage: 0.9
    },
    cooldownPeriod: 1
  }
};

async function runTests() {
  logger.info('🧪 Starting CRYB Queue System Tests...');
  
  let queueManager: QueueManager;
  
  try {
    // Initialize queue manager
    queueManager = new QueueManager(testConfig, logger);
    await queueManager.initialize();
    logger.info('✅ Queue Manager initialized successfully');
    
    // Wait a moment for everything to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 1: Add successful job
    logger.info('📋 Test 1: Adding successful job');
    await queueManager.addJob('test_messages', 'test-success', {
      id: 'test-success-1',
      message: 'This should succeed'
    }, { priority: JobPriority.HIGH });
    
    // Test 2: Add failing job
    logger.info('📋 Test 2: Adding failing job');
    await queueManager.addJob('test_messages', 'test-failure', {
      id: 'test-failure-1',
      message: 'This should fail and retry'
    }, { priority: JobPriority.NORMAL });
    
    // Test 3: Add duplicate job (should be deduplicated)
    logger.info('📋 Test 3: Adding duplicate job');
    await queueManager.addJob('test_messages', 'test-success', {
      id: 'test-success-1', // Same ID as Test 1
      message: 'This should be deduplicated'
    }, { priority: JobPriority.NORMAL });
    
    // Test 4: Add slow job
    logger.info('📋 Test 4: Adding slow job');
    await queueManager.addJob('test_messages', 'test-slow', {
      id: 'test-slow-1',
      message: 'This will take 3 seconds'
    }, { priority: JobPriority.LOW });
    
    // Test 5: Add real message processing job
    logger.info('📋 Test 5: Adding real message processing job');
    await queueManager.addJob('test_messages', 'process-message', {
      messageId: 'test-msg-123',
      channelId: 'test-channel-456', 
      content: 'Hello <@user789>, check out https://example.com! This is a test message.',
      authorId: 'test-author-123'
    }, { priority: JobPriority.HIGH });
    
    // Wait for jobs to process
    logger.info('⏳ Waiting for jobs to process...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check metrics
    logger.info('📊 Getting queue metrics...');
    const metrics = await queueManager.getAllQueueMetrics();
    logger.info('Queue Metrics:', JSON.stringify(metrics, null, 2));
    
    // Check health status
    logger.info('🏥 Getting health status...');
    const health = await queueManager.getHealthStatus();
    logger.info('Health Status:', JSON.stringify(health, null, 2));
    
    // Get system stats
    logger.info('📈 Getting system stats...');
    const stats = await queueManager.getSystemStats();
    logger.info('System Stats:', JSON.stringify(stats, null, 2));
    
    logger.info('✅ All tests completed successfully!');
    
    // Test graceful shutdown
    logger.info('🔄 Testing graceful shutdown...');
    await queueManager.gracefulShutdown();
    logger.info('✅ Graceful shutdown completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
    
    // Attempt emergency shutdown
    if (queueManager) {
      try {
        await queueManager.emergencyShutdown();
      } catch (shutdownError) {
        logger.error('❌ Emergency shutdown failed:', shutdownError);
      }
    }
    
    process.exit(1);
  }
}

async function stressTest() {
  logger.info('🔥 Starting stress test...');
  
  const queueManager = new QueueManager(testConfig, logger);
  await queueManager.initialize();
  
  try {
    // Add 100 jobs rapidly
    const jobPromises = [];
    for (let i = 0; i < 100; i++) {
      const jobPromise = queueManager.addJob('test_messages', 'test-success', {
        id: `stress-test-${i}`,
        message: `Stress test job #${i}`
      }, { priority: JobPriority.NORMAL });
      
      jobPromises.push(jobPromise);
    }
    
    await Promise.all(jobPromises);
    logger.info('✅ Added 100 stress test jobs');
    
    // Monitor processing for 30 seconds
    let totalProcessed = 0;
    const startTime = Date.now();
    
    while (Date.now() - startTime < 30000) {
      const metrics = await queueManager.getAllQueueMetrics();
      const currentProcessed = metrics.test_messages?.totalProcessed || 0;
      
      if (currentProcessed > totalProcessed) {
        totalProcessed = currentProcessed;
        logger.info(`📊 Processed ${totalProcessed}/100 jobs`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const finalMetrics = await queueManager.getAllQueueMetrics();
    logger.info('🏁 Stress test completed:', finalMetrics);
    
    await queueManager.gracefulShutdown();
    
  } catch (error) {
    logger.error('❌ Stress test failed:', error);
    await queueManager.emergencyShutdown();
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'basic';

switch (testType) {
  case 'stress':
    stressTest();
    break;
  case 'basic':
  default:
    runTests();
    break;
}