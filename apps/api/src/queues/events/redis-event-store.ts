import { Redis } from 'ioredis';
import { Logger } from 'pino';
import { DomainEvent, EventStore } from './domain-events';

export interface RedisEventStoreConfig {
  keyPrefix: string;
  snapshotFrequency: number; // Save snapshot every N events
  enableSnapshots: boolean;
  eventTTL?: number; // TTL for events in seconds
  snapshotTTL?: number; // TTL for snapshots in seconds
}

export class RedisEventStore implements EventStore {
  private redis: Redis;
  private logger: Logger;
  private config: RedisEventStoreConfig;

  constructor(redis: Redis, logger: Logger, config: Partial<RedisEventStoreConfig> = {}) {
    this.redis = redis;
    this.logger = logger;
    this.config = {
      keyPrefix: 'eventstore',
      snapshotFrequency: 10,
      enableSnapshots: true,
      eventTTL: 86400 * 365, // 1 year default
      snapshotTTL: 86400 * 90, // 90 days default
      ...config,
    };
  }

  public async append(streamId: string, events: DomainEvent[], expectedVersion?: number): Promise<void> {
    const key = this.getStreamKey(streamId);
    const versionKey = this.getVersionKey(streamId);

    try {
      await this.redis.watch(versionKey);
      
      // Get current version
      const currentVersionStr = await this.redis.get(versionKey);
      const currentVersion = currentVersionStr ? parseInt(currentVersionStr) : 0;

      // Check expected version for optimistic concurrency control
      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new Error(
          `Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`
        );
      }

      // Start transaction
      const multi = this.redis.multi();

      // Add events to stream
      for (const event of events) {
        const eventData = {
          id: event.id,
          type: event.type,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          version: event.version,
          timestamp: event.timestamp.toISOString(),
          data: JSON.stringify(event.data),
          metadata: JSON.stringify(event.metadata),
        };

        // Store event in stream
        multi.xadd(key, '*', ...this.flattenObject(eventData));

        // Store event by ID for direct access
        const eventKey = this.getEventKey(event.id);
        multi.set(eventKey, JSON.stringify(event));
        
        if (this.config.eventTTL) {
          multi.expire(eventKey, this.config.eventTTL);
        }

        // Index by event type for querying
        const typeIndexKey = this.getEventTypeIndexKey(event.type);
        multi.zadd(typeIndexKey, event.timestamp.getTime(), event.id);
        
        if (this.config.eventTTL) {
          multi.expire(typeIndexKey, this.config.eventTTL);
        }

        // Index by aggregate for querying
        const aggregateIndexKey = this.getAggregateIndexKey(event.aggregateType);
        multi.zadd(aggregateIndexKey, event.timestamp.getTime(), event.id);
        
        if (this.config.eventTTL) {
          multi.expire(aggregateIndexKey, this.config.eventTTL);
        }
      }

      // Update stream version
      const newVersion = currentVersion + events.length;
      multi.set(versionKey, newVersion.toString());

      // Execute transaction
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Transaction failed - likely due to concurrency conflict');
      }

      // Check if any command failed
      for (const [error] of results) {
        if (error) {
          throw new Error(`Transaction command failed: ${error.message}`);
        }
      }

      // Save snapshot if enabled and frequency reached
      if (this.config.enableSnapshots && newVersion % this.config.snapshotFrequency === 0) {
        await this.createSnapshotIfNeeded(streamId, newVersion);
      }

      this.logger.debug({
        streamId,
        eventCount: events.length,
        newVersion,
        expectedVersion,
      }, 'Events appended to stream successfully');

    } catch (error) {
      await this.redis.unwatch();
      this.logger.error({
        error,
        streamId,
        eventCount: events.length,
        expectedVersion,
      }, 'Failed to append events to stream');
      throw error;
    }
  }

  public async getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]> {
    try {
      const key = this.getStreamKey(streamId);

      // Get events from Redis stream
      let start = '-';
      if (fromVersion !== undefined && fromVersion > 0) {
        // Find the stream entry ID for the given version
        start = await this.findStreamIdForVersion(streamId, fromVersion);
      }

      const result = await this.redis.xrange(key, start, '+');
      const events: DomainEvent[] = [];

      for (const [entryId, fields] of result) {
        const eventData = this.unflattenObject(fields);
        
        const event: DomainEvent = {
          id: eventData.id,
          type: eventData.type,
          aggregateId: eventData.aggregateId,
          aggregateType: eventData.aggregateType,
          version: parseInt(eventData.version),
          timestamp: new Date(eventData.timestamp),
          data: JSON.parse(eventData.data),
          metadata: JSON.parse(eventData.metadata),
        };

        // Filter by version if specified
        if (fromVersion === undefined || event.version >= fromVersion) {
          events.push(event);
        }
      }

      this.logger.debug({
        streamId,
        fromVersion,
        eventCount: events.length,
      }, 'Events retrieved from stream');

      return events.sort((a, b) => a.version - b.version);

    } catch (error) {
      this.logger.error({
        error,
        streamId,
        fromVersion,
      }, 'Failed to get events from stream');
      throw error;
    }
  }

  public async getEventsByType(eventType: string, fromTimestamp?: Date): Promise<DomainEvent[]> {
    try {
      const indexKey = this.getEventTypeIndexKey(eventType);
      const minScore = fromTimestamp ? fromTimestamp.getTime() : '-inf';
      
      // Get event IDs from sorted set
      const eventIds = await this.redis.zrangebyscore(indexKey, minScore, '+inf');
      
      // Retrieve events
      const events: DomainEvent[] = [];
      const pipeline = this.redis.pipeline();
      
      for (const eventId of eventIds) {
        const eventKey = this.getEventKey(eventId);
        pipeline.get(eventKey);
      }

      const results = await pipeline.exec();
      
      if (results) {
        for (const [error, eventData] of results) {
          if (!error && eventData) {
            const event = JSON.parse(eventData as string) as DomainEvent;
            events.push(event);
          }
        }
      }

      this.logger.debug({
        eventType,
        fromTimestamp,
        eventCount: events.length,
      }, 'Events retrieved by type');

      return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (error) {
      this.logger.error({
        error,
        eventType,
        fromTimestamp,
      }, 'Failed to get events by type');
      throw error;
    }
  }

  public async getSnapshot(aggregateId: string, aggregateType: string): Promise<any> {
    if (!this.config.enableSnapshots) {
      return null;
    }

    try {
      const snapshotKey = this.getSnapshotKey(aggregateId, aggregateType);
      const snapshotData = await this.redis.get(snapshotKey);
      
      if (!snapshotData) {
        return null;
      }

      const snapshot = JSON.parse(snapshotData);
      
      this.logger.debug({
        aggregateId,
        aggregateType,
        version: snapshot.version,
      }, 'Snapshot retrieved');

      return snapshot;

    } catch (error) {
      this.logger.error({
        error,
        aggregateId,
        aggregateType,
      }, 'Failed to get snapshot');
      return null; // Don't throw, just return null if snapshot can't be loaded
    }
  }

  public async saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    snapshot: any,
    version: number
  ): Promise<void> {
    if (!this.config.enableSnapshots) {
      return;
    }

    try {
      const snapshotKey = this.getSnapshotKey(aggregateId, aggregateType);
      const snapshotData = {
        aggregateId,
        aggregateType,
        version,
        data: snapshot,
        timestamp: new Date().toISOString(),
      };

      await this.redis.set(snapshotKey, JSON.stringify(snapshotData));
      
      if (this.config.snapshotTTL) {
        await this.redis.expire(snapshotKey, this.config.snapshotTTL);
      }

      this.logger.debug({
        aggregateId,
        aggregateType,
        version,
      }, 'Snapshot saved');

    } catch (error) {
      this.logger.error({
        error,
        aggregateId,
        aggregateType,
        version,
      }, 'Failed to save snapshot');
      throw error;
    }
  }

  public async getStreamVersion(streamId: string): Promise<number> {
    try {
      const versionKey = this.getVersionKey(streamId);
      const versionStr = await this.redis.get(versionKey);
      return versionStr ? parseInt(versionStr) : 0;
    } catch (error) {
      this.logger.error({ error, streamId }, 'Failed to get stream version');
      return 0;
    }
  }

  public async streamExists(streamId: string): Promise<boolean> {
    try {
      const key = this.getStreamKey(streamId);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error({ error, streamId }, 'Failed to check stream existence');
      return false;
    }
  }

  public async deleteStream(streamId: string): Promise<void> {
    try {
      const key = this.getStreamKey(streamId);
      const versionKey = this.getVersionKey(streamId);
      
      // Get all events first to clean up indexes
      const events = await this.getEvents(streamId);
      
      const pipeline = this.redis.pipeline();
      
      // Delete stream and version
      pipeline.del(key);
      pipeline.del(versionKey);
      
      // Clean up event indexes
      for (const event of events) {
        const eventKey = this.getEventKey(event.id);
        const typeIndexKey = this.getEventTypeIndexKey(event.type);
        const aggregateIndexKey = this.getAggregateIndexKey(event.aggregateType);
        
        pipeline.del(eventKey);
        pipeline.zrem(typeIndexKey, event.id);
        pipeline.zrem(aggregateIndexKey, event.id);
      }
      
      // Delete snapshot if exists
      if (this.config.enableSnapshots) {
        const [aggregateType, aggregateId] = streamId.split('-', 2);
        const snapshotKey = this.getSnapshotKey(aggregateId, aggregateType);
        pipeline.del(snapshotKey);
      }

      await pipeline.exec();

      this.logger.info({
        streamId,
        eventsDeleted: events.length,
      }, 'Stream deleted successfully');

    } catch (error) {
      this.logger.error({
        error,
        streamId,
      }, 'Failed to delete stream');
      throw error;
    }
  }

  public async getAllStreams(): Promise<string[]> {
    try {
      const pattern = `${this.config.keyPrefix}:stream:*`;
      const keys = await this.redis.keys(pattern);
      
      return keys.map(key => key.replace(`${this.config.keyPrefix}:stream:`, ''));
    } catch (error) {
      this.logger.error({ error }, 'Failed to get all streams');
      throw error;
    }
  }

  public async getStreamStats(streamId: string): Promise<any> {
    try {
      const key = this.getStreamKey(streamId);
      const versionKey = this.getVersionKey(streamId);
      
      const [streamInfo, version] = await Promise.all([
        this.redis.xinfo('STREAM', key),
        this.redis.get(versionKey),
      ]);

      return {
        streamId,
        version: version ? parseInt(version) : 0,
        length: streamInfo[1] || 0,
        firstEntryId: streamInfo[5]?.[0] || null,
        lastEntryId: streamInfo[7]?.[0] || null,
      };
    } catch (error) {
      this.logger.error({ error, streamId }, 'Failed to get stream stats');
      throw error;
    }
  }

  private async findStreamIdForVersion(streamId: string, version: number): Promise<string> {
    const events = await this.getEvents(streamId);
    const targetEvent = events.find(e => e.version === version);
    
    if (!targetEvent) {
      return '-'; // Start from beginning if version not found
    }

    // In a real implementation, you'd store the mapping between version and stream entry ID
    // For now, we'll just return '-' to get all events and filter in getEvents
    return '-';
  }

  private async createSnapshotIfNeeded(streamId: string, version: number): Promise<void> {
    // This would typically involve loading the aggregate and saving its current state
    // For now, we'll just log that a snapshot should be created
    this.logger.debug({
      streamId,
      version,
    }, 'Snapshot creation triggered');
  }

  private getStreamKey(streamId: string): string {
    return `${this.config.keyPrefix}:stream:${streamId}`;
  }

  private getVersionKey(streamId: string): string {
    return `${this.config.keyPrefix}:version:${streamId}`;
  }

  private getEventKey(eventId: string): string {
    return `${this.config.keyPrefix}:event:${eventId}`;
  }

  private getSnapshotKey(aggregateId: string, aggregateType: string): string {
    return `${this.config.keyPrefix}:snapshot:${aggregateType}:${aggregateId}`;
  }

  private getEventTypeIndexKey(eventType: string): string {
    return `${this.config.keyPrefix}:index:type:${eventType}`;
  }

  private getAggregateIndexKey(aggregateType: string): string {
    return `${this.config.keyPrefix}:index:aggregate:${aggregateType}`;
  }

  private flattenObject(obj: Record<string, any>): string[] {
    const result: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      result.push(key, String(value));
    }
    return result;
  }

  private unflattenObject(fields: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (let i = 0; i < fields.length; i += 2) {
      result[fields[i]] = fields[i + 1];
    }
    return result;
  }

  public async cleanup(olderThanDays: number): Promise<void> {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      let cleanedEvents = 0;
      let cleanedSnapshots = 0;

      // Clean up event type indexes
      const typeIndexKeys = await this.redis.keys(`${this.config.keyPrefix}:index:type:*`);
      
      for (const indexKey of typeIndexKeys) {
        const removedCount = await this.redis.zremrangebyscore(indexKey, '-inf', cutoffTime);
        cleanedEvents += removedCount;
      }

      // Clean up aggregate indexes
      const aggregateIndexKeys = await this.redis.keys(`${this.config.keyPrefix}:index:aggregate:*`);
      
      for (const indexKey of aggregateIndexKeys) {
        const removedCount = await this.redis.zremrangebyscore(indexKey, '-inf', cutoffTime);
        cleanedEvents += removedCount;
      }

      // Clean up old snapshots
      const snapshotKeys = await this.redis.keys(`${this.config.keyPrefix}:snapshot:*`);
      
      for (const snapshotKey of snapshotKeys) {
        const snapshotData = await this.redis.get(snapshotKey);
        if (snapshotData) {
          const snapshot = JSON.parse(snapshotData);
          const snapshotTime = new Date(snapshot.timestamp).getTime();
          
          if (snapshotTime < cutoffTime) {
            await this.redis.del(snapshotKey);
            cleanedSnapshots++;
          }
        }
      }

      this.logger.info({
        olderThanDays,
        cleanedEvents,
        cleanedSnapshots,
      }, 'Event store cleanup completed');

    } catch (error) {
      this.logger.error({
        error,
        olderThanDays,
      }, 'Event store cleanup failed');
      throw error;
    }
  }
}

export default RedisEventStore;