/**
 * CRYB Platform - Performance Monitoring API
 * Memory usage, performance stats, and optimization endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { elasticsearchClient } from '../elasticsearch/client';
import { timescaleClient } from '../analytics/timescale-client';
import { kafkaConsumer } from '../data-pipeline/kafka-consumer';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication to all performance endpoints
router.use(authMiddleware({ requireAdmin: true }));

// Schemas for request validation
const optimizeSchema = z.object({
  component: z.enum(['elasticsearch', 'timescale', 'kafka', 'all']).default('all'),
  force: z.boolean().default(false)
});

const thresholdSchema = z.object({
  elasticsearch_memory_threshold: z.number().min(0.5).max(1.0).optional(),
  kafka_memory_threshold: z.number().min(0.5).max(0.95).optional(),
  kafka_queue_limit: z.number().min(1000).max(50000).optional()
});

const cleanupSchema = z.object({
  retention_days: z.number().min(1).max(365).default(90),
  tables: z.array(z.string()).optional()
});

/**
 * @route GET /performance/stats
 * @desc Get comprehensive performance statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [elasticsearchStats, timescaleStats, kafkaStats] = await Promise.all([
      elasticsearchClient.getClusterPerformanceStats().catch(err => {
        logger.error('Failed to get Elasticsearch stats', { error: err });
        return { error: 'Elasticsearch unavailable' };
      }),
      timescaleClient.getDatabasePerformanceStats().catch(err => {
        logger.error('Failed to get TimescaleDB stats', { error: err });
        return { error: 'TimescaleDB unavailable' };
      }),
      kafkaConsumer.getConsumerMetrics().catch(err => {
        logger.error('Failed to get Kafka stats', { error: err });
        return { error: 'Kafka unavailable' };
      })
    ]);

    // Calculate overall system health score
    const healthScore = calculateSystemHealthScore(elasticsearchStats, timescaleStats, kafkaStats);

    res.json({
      success: true,
      data: {
        health_score: healthScore,
        elasticsearch: elasticsearchStats,
        timescale: timescaleStats,
        kafka: kafkaStats,
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cpu_usage: process.cpuUsage(),
          node_version: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Performance stats error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance statistics'
    });
  }
});

/**
 * @route GET /performance/memory
 * @desc Get detailed memory usage information
 */
router.get('/memory', async (req: Request, res: Response) => {
  try {
    const [esMemory, dbMemory] = await Promise.all([
      elasticsearchClient.getMemoryUsage(),
      timescaleClient.getTableMemoryUsage().catch(() => [])
    ]);

    const nodeMemory = process.memoryUsage();
    const memoryUsagePercent = nodeMemory.heapUsed / nodeMemory.heapTotal;

    res.json({
      success: true,
      data: {
        node_js: {
          heap_used_mb: Math.round(nodeMemory.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(nodeMemory.heapTotal / 1024 / 1024),
          heap_usage_percent: (memoryUsagePercent * 100).toFixed(2),
          external_mb: Math.round(nodeMemory.external / 1024 / 1024),
          rss_mb: Math.round(nodeMemory.rss / 1024 / 1024),
          array_buffers_mb: Math.round(nodeMemory.arrayBuffers / 1024 / 1024)
        },
        elasticsearch: esMemory,
        timescale_tables: dbMemory,
        recommendations: generateMemoryRecommendations(nodeMemory, esMemory),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Memory stats error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get memory statistics'
    });
  }
});

/**
 * @route POST /performance/optimize
 * @desc Trigger system optimization
 */
router.post('/optimize',
  validateRequest(optimizeSchema),
  async (req: Request, res: Response) => {
    try {
      const { component, force } = req.validatedData;
      const results = {};

      if (component === 'elasticsearch' || component === 'all') {
        try {
          await elasticsearchClient.optimizeIndices();
          await elasticsearchClient.clearCache();
          results.elasticsearch = { status: 'optimized' };
        } catch (error) {
          results.elasticsearch = { status: 'failed', error: error.message };
        }
      }

      if (component === 'timescale' || component === 'all') {
        try {
          await timescaleClient.optimizeDatabase();
          results.timescale = { status: 'optimized' };
        } catch (error) {
          results.timescale = { status: 'failed', error: error.message };
        }
      }

      if (component === 'kafka' || component === 'all') {
        try {
          await kafkaConsumer.optimizeMemoryUsage();
          results.kafka = { status: 'optimized' };
        } catch (error) {
          results.kafka = { status: 'failed', error: error.message };
        }
      }

      // Force garbage collection if requested
      if (force && global.gc) {
        global.gc();
        results.garbage_collection = { status: 'executed' };
      }

      res.json({
        success: true,
        data: {
          optimization_results: results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('System optimization error', { error });
      res.status(500).json({
        success: false,
        error: 'System optimization failed'
      });
    }
  }
);

/**
 * @route PUT /performance/thresholds
 * @desc Update performance thresholds
 */
router.put('/thresholds',
  validateRequest(thresholdSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        elasticsearch_memory_threshold,
        kafka_memory_threshold,
        kafka_queue_limit
      } = req.validatedData;

      const results = {};

      if (elasticsearch_memory_threshold !== undefined) {
        elasticsearchClient.setCircuitBreakerThreshold(elasticsearch_memory_threshold);
        results.elasticsearch_threshold = elasticsearch_memory_threshold;
      }

      if (kafka_memory_threshold !== undefined) {
        kafkaConsumer.setMemoryThreshold(kafka_memory_threshold);
        results.kafka_memory_threshold = kafka_memory_threshold;
      }

      if (kafka_queue_limit !== undefined) {
        kafkaConsumer.setQueueSizeLimit(kafka_queue_limit);
        results.kafka_queue_limit = kafka_queue_limit;
      }

      res.json({
        success: true,
        data: {
          updated_thresholds: results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Threshold update error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update thresholds'
      });
    }
  }
);

/**
 * @route POST /performance/cleanup
 * @desc Clean up old data to free memory
 */
router.post('/cleanup',
  validateRequest(cleanupSchema),
  async (req: Request, res: Response) => {
    try {
      const { retention_days } = req.validatedData;

      await timescaleClient.cleanOldData(retention_days);

      res.json({
        success: true,
        data: {
          message: `Data cleanup completed for ${retention_days} days retention`,
          retention_days,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Data cleanup error', { error });
      res.status(500).json({
        success: false,
        error: 'Data cleanup failed'
      });
    }
  }
);

/**
 * @route POST /performance/gc
 * @desc Force garbage collection
 */
router.post('/gc', async (req: Request, res: Response) => {
  try {
    const beforeMemory = process.memoryUsage();

    if (global.gc) {
      global.gc();
      const afterMemory = process.memoryUsage();
      
      res.json({
        success: true,
        data: {
          message: 'Garbage collection executed',
          memory_before: {
            heap_used_mb: Math.round(beforeMemory.heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(beforeMemory.heapTotal / 1024 / 1024)
          },
          memory_after: {
            heap_used_mb: Math.round(afterMemory.heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(afterMemory.heapTotal / 1024 / 1024)
          },
          memory_freed_mb: Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024),
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: false,
        error: 'Garbage collection not available (use --expose-gc flag)'
      });
    }
  } catch (error) {
    logger.error('Garbage collection error', { error });
    res.status(500).json({
      success: false,
      error: 'Garbage collection failed'
    });
  }
});

// Helper functions

function calculateSystemHealthScore(esStats: any, dbStats: any, kafkaStats: any): number {
  let score = 100;

  // Elasticsearch health impact
  if (esStats.error) {
    score -= 30;
  } else {
    if (esStats.memory?.heap_usage_percent > 90) score -= 20;
    if (esStats.memory?.circuit_breaker_status === 'open') score -= 15;
    if (esStats.cluster?.status === 'red') score -= 25;
    if (esStats.cluster?.status === 'yellow') score -= 10;
  }

  // TimescaleDB health impact
  if (dbStats.error) {
    score -= 25;
  } else {
    const activeConnections = dbStats.connections?.active_connections || 0;
    const totalConnections = dbStats.connections?.total_connections || 1;
    if ((activeConnections / totalConnections) > 0.8) score -= 10;
  }

  // Kafka health impact
  if (kafkaStats.error) {
    score -= 20;
  } else {
    const memoryPercent = parseFloat(kafkaStats.system_memory?.heap_usage_percent || '0');
    if (memoryPercent > 85) score -= 15;
    
    // Check queue usage
    for (const consumer of Object.values(kafkaStats.consumers || {})) {
      const queueUsage = parseFloat((consumer as any).queue_usage_percent || '0');
      if (queueUsage > 80) score -= 5;
    }
  }

  return Math.max(0, Math.round(score));
}

function generateMemoryRecommendations(nodeMemory: any, esMemory: any): string[] {
  const recommendations = [];
  const heapUsagePercent = nodeMemory.heapUsed / nodeMemory.heapTotal;

  if (heapUsagePercent > 0.85) {
    recommendations.push('High Node.js memory usage detected - consider increasing heap size or optimizing code');
  }

  if (esMemory.circuit_breaker_open) {
    recommendations.push('Elasticsearch circuit breaker is open - reduce query complexity or increase cluster memory');
  }

  if (nodeMemory.external > nodeMemory.heapUsed) {
    recommendations.push('High external memory usage - check for memory leaks in native modules');
  }

  if (recommendations.length === 0) {
    recommendations.push('Memory usage is within normal parameters');
  }

  return recommendations;
}

export default router;