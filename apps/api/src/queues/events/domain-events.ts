import { EventEmitter } from 'events';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { Kafka, Producer, Consumer } from 'kafkajs';
import amqp from 'amqplib';

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
    source: string;
    traceId?: string;
  };
}

export interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion?: number): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, fromTimestamp?: Date): Promise<DomainEvent[]>;
  getSnapshot(aggregateId: string, aggregateType: string): Promise<any>;
  saveSnapshot(aggregateId: string, aggregateType: string, snapshot: any, version: number): Promise<void>;
}

export interface EventProjection {
  name: string;
  handles: string[];
  project(event: DomainEvent): Promise<void>;
  reset?(): Promise<void>;
}

export interface Saga {
  name: string;
  correlationProperty: string;
  handles: string[];
  handle(event: DomainEvent): Promise<DomainEvent[]>;
  compensate?(event: DomainEvent): Promise<DomainEvent[]>;
}

export class DomainEventManager extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private kafkaProducer?: Producer;
  private kafkaConsumers: Map<string, Consumer> = new Map();
  private rabbitChannel?: amqp.Channel;
  private eventStore: EventStore;
  
  private projections: Map<string, EventProjection> = new Map();
  private sagas: Map<string, Saga> = new Map();
  private eventHandlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
  
  private metrics = {
    eventsPublished: 0,
    eventsProcessed: 0,
    projectionUpdates: 0,
    sagasTriggered: 0,
    errors: 0,
    processingTime: 0,
  };

  constructor(
    redis: Redis,
    logger: Logger,
    eventStore: EventStore,
    kafkaProducer?: Producer,
    rabbitChannel?: amqp.Channel
  ) {
    super();
    this.redis = redis;
    this.logger = logger;
    this.eventStore = eventStore;
    this.kafkaProducer = kafkaProducer;
    this.rabbitChannel = rabbitChannel;
  }

  public async publishEvent(event: DomainEvent): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info({
        eventId: event.id,
        eventType: event.type,
        aggregateId: event.aggregateId,
        correlationId: event.metadata.correlationId,
      }, 'Publishing domain event');

      // Store event in event store
      await this.eventStore.append(
        `${event.aggregateType}-${event.aggregateId}`,
        [event],
        event.version - 1
      );

      // Publish to local event bus
      this.emit('event', event);

      // Publish to Kafka for external systems
      if (this.kafkaProducer) {
        await this.publishToKafka(event);
      }

      // Publish to RabbitMQ for routing
      if (this.rabbitChannel) {
        await this.publishToRabbitMQ(event);
      }

      // Store in Redis for real-time subscriptions
      await this.publishToRedis(event);

      // Update metrics
      this.metrics.eventsPublished++;
      this.metrics.processingTime += Date.now() - startTime;

      this.logger.debug({
        eventId: event.id,
        eventType: event.type,
        processingTime: Date.now() - startTime,
      }, 'Domain event published successfully');

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        error,
        eventId: event.id,
        eventType: event.type,
      }, 'Failed to publish domain event');
      throw error;
    }
  }

  public async publishEvents(events: DomainEvent[]): Promise<void> {
    const startTime = Date.now();

    try {
      // Group events by stream
      const eventsByStream = new Map<string, DomainEvent[]>();
      
      for (const event of events) {
        const streamId = `${event.aggregateType}-${event.aggregateId}`;
        if (!eventsByStream.has(streamId)) {
          eventsByStream.set(streamId, []);
        }
        eventsByStream.get(streamId)!.push(event);
      }

      // Append events to event store by stream
      for (const [streamId, streamEvents] of eventsByStream) {
        const sortedEvents = streamEvents.sort((a, b) => a.version - b.version);
        const expectedVersion = sortedEvents[0].version - 1;
        await this.eventStore.append(streamId, sortedEvents, expectedVersion);
      }

      // Publish all events
      const publishPromises = events.map(event => this.publishSingleEvent(event));
      await Promise.all(publishPromises);

      this.metrics.eventsPublished += events.length;
      this.metrics.processingTime += Date.now() - startTime;

      this.logger.info({
        eventCount: events.length,
        processingTime: Date.now() - startTime,
      }, 'Batch of domain events published successfully');

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        error,
        eventCount: events.length,
      }, 'Failed to publish domain events');
      throw error;
    }
  }

  private async publishSingleEvent(event: DomainEvent): Promise<void> {
    // Emit to local handlers
    this.emit('event', event);

    // Publish to external systems
    const promises: Promise<void>[] = [];

    if (this.kafkaProducer) {
      promises.push(this.publishToKafka(event));
    }

    if (this.rabbitChannel) {
      promises.push(this.publishToRabbitMQ(event));
    }

    promises.push(this.publishToRedis(event));

    await Promise.all(promises);
  }

  private async publishToKafka(event: DomainEvent): Promise<void> {
    if (!this.kafkaProducer) return;

    const topic = `domain-events-${event.aggregateType}`;
    const message = {
      key: event.aggregateId,
      value: JSON.stringify(event),
      headers: {
        eventType: event.type,
        aggregateType: event.aggregateType,
        correlationId: event.metadata.correlationId || '',
        timestamp: event.timestamp.toISOString(),
      },
    };

    await this.kafkaProducer.send({
      topic,
      messages: [message],
    });
  }

  private async publishToRabbitMQ(event: DomainEvent): Promise<void> {
    if (!this.rabbitChannel) return;

    const exchange = 'domain-events';
    const routingKey = `${event.aggregateType}.${event.type}`;
    const message = Buffer.from(JSON.stringify(event));

    await this.rabbitChannel.publish(exchange, routingKey, message, {
      persistent: true,
      timestamp: event.timestamp.getTime(),
      headers: {
        eventId: event.id,
        eventType: event.type,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        correlationId: event.metadata.correlationId,
      },
    });
  }

  private async publishToRedis(event: DomainEvent): Promise<void> {
    // Publish to Redis streams for real-time processing
    const streamKey = `events:${event.aggregateType}`;
    
    await this.redis.xadd(
      streamKey,
      '*',
      'eventId', event.id,
      'eventType', event.type,
      'aggregateId', event.aggregateId,
      'data', JSON.stringify(event.data),
      'metadata', JSON.stringify(event.metadata),
      'timestamp', event.timestamp.toISOString()
    );

    // Also publish to pub/sub for immediate notifications
    await this.redis.publish('domain-events', JSON.stringify(event));

    // Store event for replay capability
    await this.redis.set(
      `event:${event.id}`,
      JSON.stringify(event),
      'EX',
      86400 * 30 // Keep for 30 days
    );
  }

  public registerProjection(projection: EventProjection): void {
    this.projections.set(projection.name, projection);
    
    // Subscribe to events this projection handles
    for (const eventType of projection.handles) {
      this.on('event', async (event: DomainEvent) => {
        if (event.type === eventType) {
          await this.handleProjection(projection, event);
        }
      });
    }

    this.logger.info({
      projectionName: projection.name,
      handledEvents: projection.handles,
    }, 'Event projection registered');
  }

  public registerSaga(saga: Saga): void {
    this.sagas.set(saga.name, saga);
    
    // Subscribe to events this saga handles
    for (const eventType of saga.handles) {
      this.on('event', async (event: DomainEvent) => {
        if (event.type === eventType) {
          await this.handleSaga(saga, event);
        }
      });
    }

    this.logger.info({
      sagaName: saga.name,
      handledEvents: saga.handles,
      correlationProperty: saga.correlationProperty,
    }, 'Saga registered');
  }

  public registerEventHandler(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    this.on('event', async (event: DomainEvent) => {
      if (event.type === eventType) {
        try {
          await handler(event);
          this.metrics.eventsProcessed++;
        } catch (error) {
          this.metrics.errors++;
          this.logger.error({
            error,
            eventId: event.id,
            eventType: event.type,
            handlerName: handler.name,
          }, 'Event handler failed');
        }
      }
    });
  }

  private async handleProjection(projection: EventProjection, event: DomainEvent): Promise<void> {
    try {
      const startTime = Date.now();
      await projection.project(event);
      
      this.metrics.projectionUpdates++;
      this.metrics.processingTime += Date.now() - startTime;

      this.logger.debug({
        projectionName: projection.name,
        eventId: event.id,
        eventType: event.type,
        processingTime: Date.now() - startTime,
      }, 'Projection updated successfully');

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        error,
        projectionName: projection.name,
        eventId: event.id,
        eventType: event.type,
      }, 'Projection update failed');
      throw error;
    }
  }

  private async handleSaga(saga: Saga, event: DomainEvent): Promise<void> {
    try {
      const startTime = Date.now();
      const commandEvents = await saga.handle(event);
      
      // Publish any events generated by the saga
      if (commandEvents.length > 0) {
        await this.publishEvents(commandEvents);
      }

      this.metrics.sagasTriggered++;
      this.metrics.processingTime += Date.now() - startTime;

      this.logger.debug({
        sagaName: saga.name,
        eventId: event.id,
        eventType: event.type,
        generatedEvents: commandEvents.length,
        processingTime: Date.now() - startTime,
      }, 'Saga processed successfully');

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        error,
        sagaName: saga.name,
        eventId: event.id,
        eventType: event.type,
      }, 'Saga processing failed');

      // Attempt compensation if available
      if (saga.compensate) {
        try {
          const compensationEvents = await saga.compensate(event);
          if (compensationEvents.length > 0) {
            await this.publishEvents(compensationEvents);
            this.logger.info({
              sagaName: saga.name,
              eventId: event.id,
              compensationEvents: compensationEvents.length,
            }, 'Saga compensation executed');
          }
        } catch (compensationError) {
          this.logger.error({
            error: compensationError,
            sagaName: saga.name,
            eventId: event.id,
          }, 'Saga compensation failed');
        }
      }

      throw error;
    }
  }

  public async replayEvents(
    fromTimestamp: Date,
    toTimestamp?: Date,
    eventTypes?: string[]
  ): Promise<void> {
    this.logger.info({
      fromTimestamp,
      toTimestamp,
      eventTypes,
    }, 'Starting event replay');

    try {
      // Get events from event store
      let events: DomainEvent[] = [];

      if (eventTypes && eventTypes.length > 0) {
        for (const eventType of eventTypes) {
          const typeEvents = await this.eventStore.getEventsByType(eventType, fromTimestamp);
          events.push(...typeEvents);
        }
      } else {
        // Get all events (this would need to be implemented in the event store)
        // For now, we'll assume we have a method to get all events
        events = await this.eventStore.getEventsByType('*', fromTimestamp);
      }

      // Filter by end timestamp if provided
      if (toTimestamp) {
        events = events.filter(event => event.timestamp <= toTimestamp);
      }

      // Sort events by timestamp
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Replay events
      for (const event of events) {
        this.emit('event', event);
      }

      this.logger.info({
        eventsReplayed: events.length,
        fromTimestamp,
        toTimestamp,
      }, 'Event replay completed');

    } catch (error) {
      this.logger.error({
        error,
        fromTimestamp,
        toTimestamp,
        eventTypes,
      }, 'Event replay failed');
      throw error;
    }
  }

  public async rebuildProjection(projectionName: string): Promise<void> {
    const projection = this.projections.get(projectionName);
    if (!projection) {
      throw new Error(`Projection ${projectionName} not found`);
    }

    this.logger.info({ projectionName }, 'Starting projection rebuild');

    try {
      // Reset projection if supported
      if (projection.reset) {
        await projection.reset();
      }

      // Replay all events for this projection
      for (const eventType of projection.handles) {
        const events = await this.eventStore.getEventsByType(eventType);
        
        for (const event of events) {
          await projection.project(event);
        }
      }

      this.logger.info({ projectionName }, 'Projection rebuild completed');

    } catch (error) {
      this.logger.error({
        error,
        projectionName,
      }, 'Projection rebuild failed');
      throw error;
    }
  }

  public async getEventStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    const streamId = `${aggregateType}-${aggregateId}`;
    return await this.eventStore.getEvents(streamId, fromVersion);
  }

  public async saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    snapshot: any,
    version: number
  ): Promise<void> {
    await this.eventStore.saveSnapshot(aggregateId, aggregateType, snapshot, version);
    
    this.logger.debug({
      aggregateId,
      aggregateType,
      version,
    }, 'Snapshot saved');
  }

  public async loadSnapshot(
    aggregateId: string,
    aggregateType: string
  ): Promise<any> {
    return await this.eventStore.getSnapshot(aggregateId, aggregateType);
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.eventsPublished > 0 
        ? this.metrics.processingTime / this.metrics.eventsPublished 
        : 0,
      errorRate: this.metrics.eventsPublished > 0
        ? (this.metrics.errors / this.metrics.eventsPublished) * 100
        : 0,
      projectionsRegistered: this.projections.size,
      sagasRegistered: this.sagas.size,
      eventHandlersRegistered: Array.from(this.eventHandlers.values())
        .reduce((total, handlers) => total + handlers.length, 0),
    };
  }

  public listProjections(): string[] {
    return Array.from(this.projections.keys());
  }

  public listSagas(): string[] {
    return Array.from(this.sagas.keys());
  }

  public getProjectionStatus(projectionName: string): any {
    const projection = this.projections.get(projectionName);
    return projection ? {
      name: projection.name,
      handledEvents: projection.handles,
      supportsReset: !!projection.reset,
    } : null;
  }

  public getSagaStatus(sagaName: string): any {
    const saga = this.sagas.get(sagaName);
    return saga ? {
      name: saga.name,
      handledEvents: saga.handles,
      correlationProperty: saga.correlationProperty,
      supportsCompensation: !!saga.compensate,
    } : null;
  }
}

export default DomainEventManager;