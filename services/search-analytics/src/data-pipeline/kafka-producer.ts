/**
 * CRYB Platform - Kafka Producer
 * Real-time data streaming for analytics and search indexing
 */

import { Kafka, Producer, ProducerBatch, TopicMessages } from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafka-js/confluent-schema-registry';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface StreamEvent {
  event_type: string;
  entity_type: 'user' | 'post' | 'comment' | 'community' | 'vote' | 'message';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  metadata: {
    timestamp: Date;
    source: string;
    version: string;
    correlation_id?: string;
  };
}

export interface AnalyticsEvent {
  user_id?: string;
  session_id?: string;
  event_type: string;
  event_category: string;
  event_data: any;
  context: {
    ip_address?: string;
    user_agent?: string;
    page_url?: string;
    referrer?: string;
    device_info?: any;
  };
  timestamp: Date;
}

export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private schemaRegistry: SchemaRegistry;
  private isConnected: boolean = false;
  private eventBuffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  // Topic configurations
  private readonly topics = {
    USER_EVENTS: 'cryb.user.events',
    CONTENT_EVENTS: 'cryb.content.events',
    ANALYTICS_EVENTS: 'cryb.analytics.events',
    SEARCH_INDEXING: 'cryb.search.indexing',
    MODERATION_EVENTS: 'cryb.moderation.events',
    REVENUE_EVENTS: 'cryb.revenue.events',
    SYSTEM_METRICS: 'cryb.system.metrics'
  };

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 30000,
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 5
      }
    });

    this.schemaRegistry = new SchemaRegistry({
      host: config.kafka.schemaRegistryUrl,
    });

    this.setupEventBuffer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      
      // Create topics if they don't exist
      await this.createTopics();
      
      // Register schemas
      await this.registerSchemas();
      
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', { error });
      throw error;
    }
  }

  private async createTopics(): Promise<void> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      
      const topicsToCreate = Object.values(this.topics).map(topic => ({
        topic,
        numPartitions: 8,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'snappy' }
        ]
      }));

      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
        timeout: 30000
      });

      logger.info('Kafka topics created/verified');
    } catch (error) {
      logger.error('Failed to create topics', { error });
    } finally {
      await admin.disconnect();
    }
  }

  private async registerSchemas(): Promise<void> {
    try {
      // Stream Event Schema
      const streamEventSchema = {
        type: 'record',
        name: 'StreamEvent',
        namespace: 'cryb.events',
        fields: [
          { name: 'event_type', type: 'string' },
          { name: 'entity_type', type: { type: 'enum', name: 'EntityType', symbols: ['user', 'post', 'comment', 'community', 'vote', 'message'] } },
          { name: 'entity_id', type: 'string' },
          { name: 'operation', type: { type: 'enum', name: 'Operation', symbols: ['create', 'update', 'delete'] } },
          { name: 'data', type: 'string' }, // JSON string
          { name: 'metadata', type: {
            type: 'record',
            name: 'Metadata',
            fields: [
              { name: 'timestamp', type: { type: 'long', logicalType: 'timestamp-millis' } },
              { name: 'source', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'correlation_id', type: ['null', 'string'], default: null }
            ]
          }}
        ]
      };

      // Analytics Event Schema
      const analyticsEventSchema = {
        type: 'record',
        name: 'AnalyticsEvent',
        namespace: 'cryb.analytics',
        fields: [
          { name: 'user_id', type: ['null', 'string'], default: null },
          { name: 'session_id', type: ['null', 'string'], default: null },
          { name: 'event_type', type: 'string' },
          { name: 'event_category', type: 'string' },
          { name: 'event_data', type: 'string' }, // JSON string
          { name: 'context', type: 'string' }, // JSON string
          { name: 'timestamp', type: { type: 'long', logicalType: 'timestamp-millis' } }
        ]
      };

      await Promise.all([
        this.schemaRegistry.register({
          type: SchemaType.AVRO,
          schema: JSON.stringify(streamEventSchema)
        }, { subject: 'cryb.events-value' }),
        
        this.schemaRegistry.register({
          type: SchemaType.AVRO,
          schema: JSON.stringify(analyticsEventSchema)
        }, { subject: 'cryb.analytics-value' })
      ]);

      logger.info('Kafka schemas registered');
    } catch (error) {
      logger.error('Failed to register schemas', { error });
    }
  }

  private setupEventBuffer(): void {
    // Initialize buffers for each topic
    Object.values(this.topics).forEach(topic => {
      this.eventBuffer.set(topic, []);
    });

    // Flush buffer every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000);
  }

  private async flushBuffer(): Promise<void> {
    if (!this.isConnected) return;

    const batches: ProducerBatch[] = [];

    for (const [topic, events] of this.eventBuffer.entries()) {
      if (events.length === 0) continue;

      const topicMessages: TopicMessages = {
        topic,
        messages: events.splice(0, 1000) // Batch up to 1000 messages
      };

      batches.push({ topicMessages: [topicMessages] });
    }

    if (batches.length === 0) return;

    try {
      await Promise.all(batches.map(batch => this.producer.sendBatch(batch)));
      logger.debug('Flushed event buffer', { batchCount: batches.length });
    } catch (error) {
      logger.error('Failed to flush event buffer', { error });
    }
  }

  // Stream Events
  async publishStreamEvent(event: StreamEvent): Promise<void> {
    try {
      const topic = this.getTopicForEntity(event.entity_type);
      const encodedValue = await this.encodeStreamEvent(event);

      const message = {
        key: event.entity_id,
        value: encodedValue,
        partition: this.getPartition(event.entity_id),
        timestamp: event.metadata.timestamp.getTime().toString(),
        headers: {
          event_type: event.event_type,
          operation: event.operation,
          source: event.metadata.source
        }
      };

      // Add to buffer for batch processing
      this.eventBuffer.get(topic)?.push(message);

      // If buffer is full, flush immediately
      if (this.eventBuffer.get(topic)?.length >= 100) {
        await this.flushTopicBuffer(topic);
      }
    } catch (error) {
      logger.error('Failed to publish stream event', { error, event });
      throw error;
    }
  }

  // Analytics Events
  async publishAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const encodedValue = await this.encodeAnalyticsEvent(event);

      const message = {
        key: event.user_id || event.session_id || 'anonymous',
        value: encodedValue,
        partition: this.getPartition(event.user_id || event.session_id || 'anonymous'),
        timestamp: event.timestamp.getTime().toString(),
        headers: {
          event_type: event.event_type,
          event_category: event.event_category
        }
      };

      this.eventBuffer.get(this.topics.ANALYTICS_EVENTS)?.push(message);

      // Flush analytics events more frequently
      if (this.eventBuffer.get(this.topics.ANALYTICS_EVENTS)?.length >= 50) {
        await this.flushTopicBuffer(this.topics.ANALYTICS_EVENTS);
      }
    } catch (error) {
      logger.error('Failed to publish analytics event', { error, event });
      throw error;
    }
  }

  // Search Indexing Events
  async publishSearchIndexingEvent(entityType: string, entityId: string, operation: string, data: any): Promise<void> {
    const event: StreamEvent = {
      event_type: 'search_indexing',
      entity_type: entityType as any,
      entity_id: entityId,
      operation: operation as any,
      data,
      metadata: {
        timestamp: new Date(),
        source: 'search_service',
        version: '1.0.0'
      }
    };

    try {
      const encodedValue = await this.encodeStreamEvent(event);

      const message = {
        key: entityId,
        value: encodedValue,
        partition: this.getPartition(entityId),
        timestamp: Date.now().toString(),
        headers: {
          entity_type: entityType,
          operation
        }
      };

      this.eventBuffer.get(this.topics.SEARCH_INDEXING)?.push(message);
    } catch (error) {
      logger.error('Failed to publish search indexing event', { error, event });
      throw error;
    }
  }

  // Moderation Events
  async publishModerationEvent(contentId: string, action: string, moderatorId: string, data: any): Promise<void> {
    const event = {
      content_id: contentId,
      action,
      moderator_id: moderatorId,
      data: JSON.stringify(data),
      timestamp: new Date()
    };

    try {
      const message = {
        key: contentId,
        value: JSON.stringify(event),
        partition: this.getPartition(contentId),
        timestamp: Date.now().toString(),
        headers: {
          action,
          moderator_id: moderatorId
        }
      };

      this.eventBuffer.get(this.topics.MODERATION_EVENTS)?.push(message);
    } catch (error) {
      logger.error('Failed to publish moderation event', { error, event });
      throw error;
    }
  }

  // Revenue Events
  async publishRevenueEvent(transactionId: string, userId: string, amount: number, currency: string, data: any): Promise<void> {
    const event = {
      transaction_id: transactionId,
      user_id: userId,
      amount,
      currency,
      data: JSON.stringify(data),
      timestamp: new Date()
    };

    try {
      const message = {
        key: transactionId,
        value: JSON.stringify(event),
        partition: this.getPartition(userId),
        timestamp: Date.now().toString(),
        headers: {
          user_id: userId,
          currency
        }
      };

      this.eventBuffer.get(this.topics.REVENUE_EVENTS)?.push(message);
    } catch (error) {
      logger.error('Failed to publish revenue event', { error, event });
      throw error;
    }
  }

  // System Metrics
  async publishSystemMetrics(service: string, metrics: any): Promise<void> {
    const event = {
      service,
      metrics: JSON.stringify(metrics),
      timestamp: new Date()
    };

    try {
      const message = {
        key: service,
        value: JSON.stringify(event),
        partition: this.getPartition(service),
        timestamp: Date.now().toString(),
        headers: {
          service
        }
      };

      this.eventBuffer.get(this.topics.SYSTEM_METRICS)?.push(message);
    } catch (error) {
      logger.error('Failed to publish system metrics', { error, event });
      throw error;
    }
  }

  // Batch publishing for high-volume scenarios
  async publishEventsBatch(events: StreamEvent[]): Promise<void> {
    try {
      const groupedEvents = this.groupEventsByTopic(events);
      const batches: ProducerBatch[] = [];

      for (const [topic, topicEvents] of groupedEvents.entries()) {
        const messages = await Promise.all(
          topicEvents.map(async (event) => ({
            key: event.entity_id,
            value: await this.encodeStreamEvent(event),
            partition: this.getPartition(event.entity_id),
            timestamp: event.metadata.timestamp.getTime().toString(),
            headers: {
              event_type: event.event_type,
              operation: event.operation
            }
          }))
        );

        batches.push({
          topicMessages: [{ topic, messages }]
        });
      }

      await Promise.all(batches.map(batch => this.producer.sendBatch(batch)));
      logger.debug('Published events batch', { eventCount: events.length });
    } catch (error) {
      logger.error('Failed to publish events batch', { error, eventCount: events.length });
      throw error;
    }
  }

  // Helper methods
  private getTopicForEntity(entityType: string): string {
    switch (entityType) {
      case 'user':
        return this.topics.USER_EVENTS;
      case 'post':
      case 'comment':
        return this.topics.CONTENT_EVENTS;
      case 'community':
        return this.topics.CONTENT_EVENTS;
      case 'vote':
        return this.topics.USER_EVENTS;
      case 'message':
        return this.topics.CONTENT_EVENTS;
      default:
        return this.topics.USER_EVENTS;
    }
  }

  private getPartition(key: string): number {
    // Simple hash-based partitioning
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 8; // 8 partitions per topic
  }

  private async encodeStreamEvent(event: StreamEvent): Promise<Buffer> {
    try {
      const encodedData = {
        event_type: event.event_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        operation: event.operation,
        data: JSON.stringify(event.data),
        metadata: {
          timestamp: event.metadata.timestamp.getTime(),
          source: event.metadata.source,
          version: event.metadata.version,
          correlation_id: event.metadata.correlation_id || null
        }
      };

      return await this.schemaRegistry.encode(
        await this.schemaRegistry.getLatestSchemaId('cryb.events-value'),
        encodedData
      );
    } catch (error) {
      logger.error('Failed to encode stream event', { error });
      // Fallback to JSON if schema encoding fails
      return Buffer.from(JSON.stringify(event));
    }
  }

  private async encodeAnalyticsEvent(event: AnalyticsEvent): Promise<Buffer> {
    try {
      const encodedData = {
        user_id: event.user_id || null,
        session_id: event.session_id || null,
        event_type: event.event_type,
        event_category: event.event_category,
        event_data: JSON.stringify(event.event_data),
        context: JSON.stringify(event.context),
        timestamp: event.timestamp.getTime()
      };

      return await this.schemaRegistry.encode(
        await this.schemaRegistry.getLatestSchemaId('cryb.analytics-value'),
        encodedData
      );
    } catch (error) {
      logger.error('Failed to encode analytics event', { error });
      // Fallback to JSON if schema encoding fails
      return Buffer.from(JSON.stringify(event));
    }
  }

  private groupEventsByTopic(events: StreamEvent[]): Map<string, StreamEvent[]> {
    const grouped = new Map<string, StreamEvent[]>();

    events.forEach(event => {
      const topic = this.getTopicForEntity(event.entity_type);
      if (!grouped.has(topic)) {
        grouped.set(topic, []);
      }
      grouped.get(topic)?.push(event);
    });

    return grouped;
  }

  private async flushTopicBuffer(topic: string): Promise<void> {
    const events = this.eventBuffer.get(topic) || [];
    if (events.length === 0) return;

    try {
      await this.producer.send({
        topic,
        messages: events.splice(0, 1000) // Send up to 1000 messages
      });
    } catch (error) {
      logger.error('Failed to flush topic buffer', { error, topic });
    }
  }

  // Transaction support for critical events
  async publishTransactional(events: StreamEvent[]): Promise<void> {
    const transaction = await this.producer.transaction();

    try {
      const groupedEvents = this.groupEventsByTopic(events);

      for (const [topic, topicEvents] of groupedEvents.entries()) {
        const messages = await Promise.all(
          topicEvents.map(async (event) => ({
            key: event.entity_id,
            value: await this.encodeStreamEvent(event),
            partition: this.getPartition(event.entity_id),
            timestamp: event.metadata.timestamp.getTime().toString()
          }))
        );

        await transaction.send({
          topic,
          messages
        });
      }

      await transaction.commit();
      logger.debug('Committed transactional events', { eventCount: events.length });
    } catch (error) {
      await transaction.abort();
      logger.error('Failed to commit transactional events', { error });
      throw error;
    }
  }

  async getMetrics(): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const topics = Object.values(this.topics);
      const metadata = await admin.fetchTopicMetadata({ topics });

      await admin.disconnect();

      return {
        connected: this.isConnected,
        buffer_sizes: Object.fromEntries(
          Array.from(this.eventBuffer.entries()).map(([topic, events]) => [topic, events.length])
        ),
        topics: metadata.topics.map(topic => ({
          name: topic.name,
          partitions: topic.partitions.length
        }))
      };
    } catch (error) {
      logger.error('Failed to get Kafka metrics', { error });
      return { connected: this.isConnected, error: error.message };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
      }

      // Flush remaining events
      await this.flushBuffer();

      await this.producer.disconnect();
      this.isConnected = false;
      
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', { error });
    }
  }
}

export const kafkaProducer = new KafkaProducerService();