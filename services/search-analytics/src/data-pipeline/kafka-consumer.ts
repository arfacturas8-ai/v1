/**
 * CRYB Platform - Kafka Consumer
 * Processes streaming data for analytics and search indexing
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { SchemaRegistry } from '@kafka-js/confluent-schema-registry';
import { timescaleClient } from '../analytics/timescale-client';
import { elasticsearchClient } from '../elasticsearch/client';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface ProcessorConfig {
  groupId: string;
  topics: string[];
  processorType: 'analytics' | 'search' | 'moderation' | 'revenue';
  batchSize: number;
  processingInterval: number;
}

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private schemaRegistry: SchemaRegistry;
  private processingQueues: Map<string, any[]> = new Map();
  private processors: Map<string, NodeJS.Timeout> = new Map();
  private queueSizeLimit = 10000; // Maximum queue size to prevent memory overflow
  private memoryUsageThreshold = 0.85; // 85% memory threshold

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.schemaRegistry = new SchemaRegistry({
      host: config.kafka.schemaRegistryUrl,
    });
  }

  async startProcessor(processorConfig: ProcessorConfig): Promise<void> {
    const { groupId, topics, processorType } = processorConfig;

    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 1000,
        retry: {
          initialRetryTime: 100,
          retries: 5
        }
      });

      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });

      // Initialize processing queue
      this.processingQueues.set(groupId, []);

      // Start batch processor
      this.startBatchProcessor(processorConfig);

      // Start consuming messages
      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload, processorConfig);
        }
      });

      this.consumers.set(groupId, consumer);
      logger.info('Kafka consumer started', { groupId, topics, processorType });
    } catch (error) {
      logger.error('Failed to start Kafka consumer', { error, processorConfig });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload, config: ProcessorConfig): Promise<void> {
    const { topic, partition, message, heartbeat } = payload;

    try {
      // Check memory usage and queue size before processing
      const queue = this.processingQueues.get(config.groupId);
      if (queue && queue.length >= this.queueSizeLimit) {
        logger.warn('Processing queue full, dropping message', {
          groupId: config.groupId,
          queueSize: queue.length,
          topic,
          partition
        });
        await heartbeat(); // Still call heartbeat to prevent session timeout
        return;
      }

      // Check system memory usage
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      
      if (memoryUsagePercent > this.memoryUsageThreshold) {
        logger.warn('High memory usage, pausing message processing', {
          memoryUsagePercent: (memoryUsagePercent * 100).toFixed(2) + '%',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
        });
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        await heartbeat();
        return;
      }

      // Decode message based on schema
      const decodedMessage = await this.decodeMessage(message.value, topic);
      
      // Add to processing queue with memory-efficient structure
      const queueItem = {
        topic,
        partition,
        offset: message.offset,
        timestamp: message.timestamp,
        key: message.key?.toString(),
        value: decodedMessage,
        headers: message.headers ? Object.fromEntries(
          Object.entries(message.headers).map(([k, v]) => [k, v?.toString()])
        ) : undefined
      };

      queue?.push(queueItem);

      // Call heartbeat to keep session alive
      await heartbeat();
    } catch (error) {
      logger.error('Failed to handle Kafka message', {
        error,
        topic,
        partition,
        offset: message.offset
      });
    }
  }

  private startBatchProcessor(config: ProcessorConfig): void {
    const { groupId, batchSize, processingInterval, processorType } = config;

    const processor = setInterval(async () => {
      const queue = this.processingQueues.get(groupId);
      if (!queue || queue.length === 0) return;

      const batch = queue.splice(0, batchSize);
      
      try {
        await this.processBatch(batch, processorType);
        logger.debug('Processed batch', { 
          processorType, 
          batchSize: batch.length,
          remainingInQueue: queue.length 
        });
      } catch (error) {
        logger.error('Failed to process batch', { 
          error, 
          processorType, 
          batchSize: batch.length 
        });
        
        // Re-add failed items to queue for retry
        queue.unshift(...batch);
      }
    }, processingInterval);

    this.processors.set(groupId, processor);
  }

  private async processBatch(batch: any[], processorType: string): Promise<void> {
    switch (processorType) {
      case 'analytics':
        await this.processAnalyticsBatch(batch);
        break;
      case 'search':
        await this.processSearchBatch(batch);
        break;
      case 'moderation':
        await this.processModerationBatch(batch);
        break;
      case 'revenue':
        await this.processRevenueBatch(batch);
        break;
      default:
        logger.warn('Unknown processor type', { processorType });
    }
  }

  private async processAnalyticsBatch(batch: any[]): Promise<void> {
    const analyticsEvents = [];
    const userActivityEvents = [];
    const platformMetrics = [];

    for (const item of batch) {
      try {
        if (item.topic === 'cryb.analytics.events') {
          const event = item.value;
          userActivityEvents.push({
            user_id: event.user_id,
            session_id: event.session_id,
            event_type: event.event_type,
            event_category: event.event_category,
            event_data: JSON.parse(event.event_data || '{}'),
            ip_address: JSON.parse(event.context || '{}').ip_address,
            user_agent: JSON.parse(event.context || '{}').user_agent,
            device_type: this.extractDeviceType(JSON.parse(event.context || '{}')),
            browser: this.extractBrowser(JSON.parse(event.context || '{}')),
            os: this.extractOS(JSON.parse(event.context || '{}'))
          });
        } else if (item.topic === 'cryb.system.metrics') {
          const metrics = JSON.parse(item.value.metrics || '{}');
          Object.entries(metrics).forEach(([metricName, metricValue]) => {
            platformMetrics.push({
              metric_name: metricName,
              metric_value: metricValue as number,
              service_name: item.value.service,
              instance_id: item.key,
              environment: 'production'
            });
          });
        }
      } catch (error) {
        logger.error('Failed to process analytics item', { error, item: item.topic });
      }
    }

    // Batch insert into TimescaleDB
    try {
      if (userActivityEvents.length > 0) {
        await timescaleClient.trackUserActivityBatch(userActivityEvents);
      }

      if (platformMetrics.length > 0) {
        await Promise.all(
          platformMetrics.map(metric => timescaleClient.recordPlatformMetric(metric))
        );
      }

      logger.debug('Processed analytics batch', {
        userActivityEvents: userActivityEvents.length,
        platformMetrics: platformMetrics.length
      });
    } catch (error) {
      logger.error('Failed to store analytics batch', { error });
      throw error;
    }
  }

  private async processSearchBatch(batch: any[]): Promise<void> {
    const indexingOperations = [];

    for (const item of batch) {
      try {
        if (item.topic === 'cryb.search.indexing') {
          const event = item.value;
          
          const operation = {
            index: this.getIndexName(event.entity_type),
            id: event.entity_id,
            operation: event.operation,
            data: JSON.parse(event.data || '{}')
          };

          indexingOperations.push(operation);
        } else if (item.topic.includes('.events')) {
          // Process entity change events for search indexing
          const event = item.value;
          
          const operation = {
            index: this.getIndexName(event.entity_type),
            id: event.entity_id,
            operation: event.operation,
            data: JSON.parse(event.data || '{}')
          };

          indexingOperations.push(operation);
        }
      } catch (error) {
        logger.error('Failed to process search item', { error, item: item.topic });
      }
    }

    // Batch index operations
    if (indexingOperations.length > 0) {
      try {
        const bulkOperations = [];

        for (const op of indexingOperations) {
          if (op.operation === 'delete') {
            bulkOperations.push({ delete: { _index: op.index, _id: op.id } });
          } else {
            bulkOperations.push({ index: { _index: op.index, _id: op.id } });
            bulkOperations.push(this.transformDataForIndex(op.data, op.index));
          }
        }

        await elasticsearchClient.bulkIndex(bulkOperations);
        logger.debug('Processed search batch', { operationsCount: indexingOperations.length });
      } catch (error) {
        logger.error('Failed to process search batch', { error });
        throw error;
      }
    }
  }

  private async processModerationBatch(batch: any[]): Promise<void> {
    const moderationEvents = [];

    for (const item of batch) {
      try {
        if (item.topic === 'cryb.moderation.events') {
          const event = item.value;
          moderationEvents.push({
            content_id: event.content_id,
            content_type: this.inferContentType(event.content_id),
            action_type: event.action,
            moderator_id: event.moderator_id,
            moderator_type: 'human', // Could be inferred from moderator_id
            violation_type: JSON.parse(event.data || '{}').violation_type,
            severity_level: JSON.parse(event.data || '{}').severity_level,
            confidence_score: JSON.parse(event.data || '{}').confidence_score
          });
        }
      } catch (error) {
        logger.error('Failed to process moderation item', { error, item: item.topic });
      }
    }

    if (moderationEvents.length > 0) {
      try {
        await Promise.all(
          moderationEvents.map(event => timescaleClient.recordModerationAnalytics(event))
        );
        logger.debug('Processed moderation batch', { eventsCount: moderationEvents.length });
      } catch (error) {
        logger.error('Failed to store moderation batch', { error });
        throw error;
      }
    }
  }

  private async processRevenueBatch(batch: any[]): Promise<void> {
    const revenueEvents = [];

    for (const item of batch) {
      try {
        if (item.topic === 'cryb.revenue.events') {
          const event = item.value;
          const eventData = JSON.parse(event.data || '{}');
          
          revenueEvents.push({
            transaction_id: event.transaction_id,
            user_id: event.user_id,
            transaction_type: eventData.transaction_type || 'unknown',
            amount_usd: event.amount,
            currency_type: event.currency,
            platform_fee_usd: eventData.platform_fee || 0,
            net_revenue_usd: event.amount - (eventData.platform_fee || 0),
            country_code: eventData.country_code,
            user_segment: eventData.user_segment,
            referral_source: eventData.referral_source
          });
        }
      } catch (error) {
        logger.error('Failed to process revenue item', { error, item: item.topic });
      }
    }

    if (revenueEvents.length > 0) {
      try {
        await Promise.all(
          revenueEvents.map(event => timescaleClient.recordRevenueAnalytics(event))
        );
        logger.debug('Processed revenue batch', { eventsCount: revenueEvents.length });
      } catch (error) {
        logger.error('Failed to store revenue batch', { error });
        throw error;
      }
    }
  }

  private async decodeMessage(value: Buffer | null, topic: string): Promise<any> {
    if (!value) return null;

    try {
      // Try to decode using schema registry first
      if (topic.includes('events') && !topic.includes('system')) {
        const schemaId = await this.schemaRegistry.getLatestSchemaId(`${topic}-value`);
        return await this.schemaRegistry.decode(schemaId, value);
      } else {
        // Fallback to JSON parsing
        return JSON.parse(value.toString());
      }
    } catch (error) {
      // Final fallback to raw JSON
      try {
        return JSON.parse(value.toString());
      } catch (jsonError) {
        logger.error('Failed to decode message', { error, jsonError, topic });
        return { raw: value.toString() };
      }
    }
  }

  private getIndexName(entityType: string): string {
    const year = new Date().getFullYear();
    switch (entityType) {
      case 'post':
        return `cryb-posts-${year}`;
      case 'comment':
        return `cryb-comments-${year}`;
      case 'user':
        return 'cryb-users';
      case 'community':
        return 'cryb-communities';
      default:
        return `cryb-${entityType}`;
    }
  }

  private transformDataForIndex(data: any, index: string): any {
    // Transform data based on index mapping requirements
    if (index.includes('posts')) {
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        content_type: data.content_type,
        community: {
          id: data.community_id,
          name: data.community_name
        },
        author: {
          id: data.user_id,
          username: data.username,
          verified: data.is_verified || false
        },
        metrics: {
          upvotes: data.upvote_count || 0,
          downvotes: data.downvote_count || 0,
          score: (data.upvote_count || 0) - (data.downvote_count || 0),
          comments: data.comment_count || 0,
          views: data.view_count || 0
        },
        status: {
          published: data.is_published || false,
          removed: data.is_removed || false,
          nsfw: data.is_nsfw || false
        },
        timestamps: {
          created_at: data.created_at,
          updated_at: data.updated_at
        },
        tags: data.tags || []
      };
    }

    // Add other entity transformations as needed
    return data;
  }

  private extractDeviceType(context: any): string {
    const userAgent = context.user_agent || '';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private extractBrowser(context: any): string {
    const userAgent = context.user_agent || '';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private extractOS(context: any): string {
    const userAgent = context.user_agent || '';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private inferContentType(contentId: string): string {
    // Simple heuristic - in real implementation, you'd query the database
    if (contentId.startsWith('post_')) return 'post';
    if (contentId.startsWith('comment_')) return 'comment';
    if (contentId.startsWith('message_')) return 'message';
    return 'unknown';
  }

  async getConsumerMetrics(): Promise<any> {
    const metrics = {};
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

    for (const [groupId, consumer] of this.consumers.entries()) {
      try {
        const queueSize = this.processingQueues.get(groupId)?.length || 0;
        metrics[groupId] = {
          queue_size: queueSize,
          queue_limit: this.queueSizeLimit,
          queue_usage_percent: (queueSize / this.queueSizeLimit * 100).toFixed(2),
          connected: true,
          memory_threshold_reached: memoryUsagePercent > this.memoryUsageThreshold
        };
      } catch (error) {
        metrics[groupId] = {
          queue_size: 0,
          connected: false,
          error: error.message
        };
      }
    }

    return {
      consumers: metrics,
      system_memory: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        heap_usage_percent: (memoryUsagePercent * 100).toFixed(2),
        external_mb: Math.round(memUsage.external / 1024 / 1024),
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        memory_threshold_percent: (this.memoryUsageThreshold * 100).toFixed(2)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Memory management methods
  async optimizeMemoryUsage(): Promise<void> {
    try {
      // Clear oversized queues
      for (const [groupId, queue] of this.processingQueues.entries()) {
        if (queue.length > this.queueSizeLimit * 0.8) {
          const excess = queue.length - Math.floor(this.queueSizeLimit * 0.7);
          queue.splice(0, excess);
          logger.warn('Cleared excess queue items to prevent memory overflow', {
            groupId,
            itemsRemoved: excess,
            newQueueSize: queue.length
          });
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Forced garbage collection completed');
      }

      // Log memory usage after optimization
      const memUsage = process.memoryUsage();
      logger.info('Memory optimization completed', {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2) + '%'
      });
    } catch (error) {
      logger.error('Memory optimization failed', { error });
    }
  }

  // Adjust memory thresholds dynamically
  setMemoryThreshold(threshold: number): void {
    if (threshold >= 0.5 && threshold <= 0.95) {
      this.memoryUsageThreshold = threshold;
      logger.info('Memory threshold updated', { threshold });
    } else {
      logger.warn('Invalid memory threshold', { threshold });
    }
  }

  setQueueSizeLimit(limit: number): void {
    if (limit >= 1000 && limit <= 50000) {
      this.queueSizeLimit = limit;
      logger.info('Queue size limit updated', { limit });
    } else {
      logger.warn('Invalid queue size limit', { limit });
    }
  }

  async pauseConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.pause([{ topic: /.*/}]);
      logger.info('Paused consumer', { groupId });
    }
  }

  async resumeConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.resume([{ topic: /.*/}]);
      logger.info('Resumed consumer', { groupId });
    }
  }

  async stopProcessor(groupId: string): Promise<void> {
    try {
      // Stop batch processor
      const processor = this.processors.get(groupId);
      if (processor) {
        clearInterval(processor);
        this.processors.delete(groupId);
      }

      // Disconnect consumer
      const consumer = this.consumers.get(groupId);
      if (consumer) {
        await consumer.disconnect();
        this.consumers.delete(groupId);
      }

      // Clear processing queue
      this.processingQueues.delete(groupId);

      logger.info('Stopped Kafka processor', { groupId });
    } catch (error) {
      logger.error('Failed to stop Kafka processor', { error, groupId });
      throw error;
    }
  }

  async stopAllProcessors(): Promise<void> {
    const groupIds = Array.from(this.consumers.keys());
    await Promise.all(groupIds.map(groupId => this.stopProcessor(groupId)));
    logger.info('Stopped all Kafka processors');
  }
}

export const kafkaConsumer = new KafkaConsumerService();