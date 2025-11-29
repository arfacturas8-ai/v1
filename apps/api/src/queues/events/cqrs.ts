import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { DomainEvent, DomainEventManager } from './domain-events';
import { EventEmitter } from 'events';

export interface Command {
  id: string;
  type: string;
  aggregateId: string;
  data: Record<string, any>;
  metadata: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    timestamp: Date;
    source: string;
  };
}

export interface Query {
  id: string;
  type: string;
  parameters: Record<string, any>;
  metadata: {
    userId?: string;
    correlationId?: string;
    timestamp: Date;
  };
}

export interface CommandHandler {
  commandType: string;
  handle(command: Command): Promise<DomainEvent[]>;
}

export interface QueryHandler {
  queryType: string;
  handle(query: Query): Promise<any>;
}

export interface ReadModel {
  name: string;
  eventHandlers: Map<string, (event: DomainEvent) => Promise<void>>;
  initialize(): Promise<void>;
  reset?(): Promise<void>;
}

export interface CommandResult {
  commandId: string;
  success: boolean;
  events: DomainEvent[];
  errors?: string[];
  processingTime: number;
}

export interface QueryResult {
  queryId: string;
  success: boolean;
  data: any;
  errors?: string[];
  processingTime: number;
  cached?: boolean;
}

export class CQRSManager extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private eventManager: DomainEventManager;
  
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private queryHandlers: Map<string, QueryHandler> = new Map();
  private readModels: Map<string, ReadModel> = new Map();
  
  private metrics = {
    commandsProcessed: 0,
    queriesProcessed: 0,
    commandsSucceeded: 0,
    queriesSucceeded: 0,
    commandsFailed: 0,
    queriesFailed: 0,
    averageCommandTime: 0,
    averageQueryTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    readModelsUpdated: 0,
  };

  constructor(redis: Redis, logger: Logger, eventManager: DomainEventManager) {
    super();
    this.redis = redis;
    this.logger = logger;
    this.eventManager = eventManager;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventManager.on('event', async (event: DomainEvent) => {
      await this.updateReadModels(event);
    });
  }

  public registerCommandHandler(handler: CommandHandler): void {
    this.commandHandlers.set(handler.commandType, handler);
    this.logger.info({
      commandType: handler.commandType,
      handlerName: handler.constructor.name,
    }, 'Command handler registered');
  }

  public registerQueryHandler(handler: QueryHandler): void {
    this.queryHandlers.set(handler.queryType, handler);
    this.logger.info({
      queryType: handler.queryType,
      handlerName: handler.constructor.name,
    }, 'Query handler registered');
  }

  public registerReadModel(readModel: ReadModel): void {
    this.readModels.set(readModel.name, readModel);
    
    // Register event handlers for this read model
    for (const [eventType, handler] of readModel.eventHandlers) {
      this.eventManager.registerEventHandler(eventType, handler);
    }

    this.logger.info({
      readModelName: readModel.name,
      handledEvents: Array.from(readModel.eventHandlers.keys()),
    }, 'Read model registered');
  }

  public async executeCommand(command: Command): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info({
        commandId: command.id,
        commandType: command.type,
        aggregateId: command.aggregateId,
        userId: command.metadata.userId,
        correlationId: command.metadata.correlationId,
      }, 'Executing command');

      // Get command handler
      const handler = this.commandHandlers.get(command.type);
      if (!handler) {
        throw new Error(`No handler registered for command type: ${command.type}`);
      }

      // Validate command
      await this.validateCommand(command);

      // Execute command
      const events = await handler.handle(command);

      // Publish generated events
      if (events.length > 0) {
        await this.eventManager.publishEvents(events);
      }

      // Store command for audit
      await this.storeCommand(command, events);

      // Update metrics
      this.metrics.commandsProcessed++;
      this.metrics.commandsSucceeded++;
      const processingTime = Date.now() - startTime;
      this.metrics.averageCommandTime = 
        (this.metrics.averageCommandTime * (this.metrics.commandsProcessed - 1) + processingTime) / 
        this.metrics.commandsProcessed;

      const result: CommandResult = {
        commandId: command.id,
        success: true,
        events,
        processingTime,
      };

      this.logger.info({
        commandId: command.id,
        commandType: command.type,
        eventsGenerated: events.length,
        processingTime,
      }, 'Command executed successfully');

      this.emit('command:executed', { command, result });
      return result;

    } catch (error) {
      this.metrics.commandsProcessed++;
      this.metrics.commandsFailed++;

      const result: CommandResult = {
        commandId: command.id,
        success: false,
        events: [],
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: Date.now() - startTime,
      };

      this.logger.error({
        error,
        commandId: command.id,
        commandType: command.type,
        processingTime: result.processingTime,
      }, 'Command execution failed');

      this.emit('command:failed', { command, error });
      return result;
    }
  }

  public async executeQuery(query: Query): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug({
        queryId: query.id,
        queryType: query.type,
        userId: query.metadata.userId,
        correlationId: query.metadata.correlationId,
      }, 'Executing query');

      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = await this.getCachedQueryResult(cacheKey);
      
      if (cachedResult) {
        this.metrics.cacheHits++;
        this.metrics.queriesProcessed++;
        this.metrics.queriesSucceeded++;

        const result: QueryResult = {
          queryId: query.id,
          success: true,
          data: cachedResult,
          processingTime: Date.now() - startTime,
          cached: true,
        };

        this.logger.debug({
          queryId: query.id,
          queryType: query.type,
          cached: true,
          processingTime: result.processingTime,
        }, 'Query executed from cache');

        return result;
      }

      this.metrics.cacheMisses++;

      // Get query handler
      const handler = this.queryHandlers.get(query.type);
      if (!handler) {
        throw new Error(`No handler registered for query type: ${query.type}`);
      }

      // Validate query
      await this.validateQuery(query);

      // Execute query
      const data = await handler.handle(query);

      // Cache result if appropriate
      await this.cacheQueryResult(cacheKey, data, query);

      // Update metrics
      this.metrics.queriesProcessed++;
      this.metrics.queriesSucceeded++;
      const processingTime = Date.now() - startTime;
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * (this.metrics.queriesProcessed - 1) + processingTime) / 
        this.metrics.queriesProcessed;

      const result: QueryResult = {
        queryId: query.id,
        success: true,
        data,
        processingTime,
        cached: false,
      };

      this.logger.debug({
        queryId: query.id,
        queryType: query.type,
        processingTime,
        cached: false,
      }, 'Query executed successfully');

      this.emit('query:executed', { query, result });
      return result;

    } catch (error) {
      this.metrics.queriesProcessed++;
      this.metrics.queriesFailed++;

      const result: QueryResult = {
        queryId: query.id,
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: Date.now() - startTime,
      };

      this.logger.error({
        error,
        queryId: query.id,
        queryType: query.type,
        processingTime: result.processingTime,
      }, 'Query execution failed');

      this.emit('query:failed', { query, error });
      return result;
    }
  }

  private async validateCommand(command: Command): Promise<void> {
    // Basic validation
    if (!command.id || !command.type || !command.aggregateId) {
      throw new Error('Command must have id, type, and aggregateId');
    }

    // Check for duplicate command (idempotency)
    const existingCommand = await this.redis.get(`command:${command.id}`);
    if (existingCommand) {
      throw new Error(`Command ${command.id} has already been processed`);
    }

    // Additional validation can be added here
    // - Business rule validation
    // - Permission checks
    // - Schema validation
  }

  private async validateQuery(query: Query): Promise<void> {
    // Basic validation
    if (!query.id || !query.type) {
      throw new Error('Query must have id and type');
    }

    // Additional validation can be added here
    // - Parameter validation
    // - Permission checks
    // - Rate limiting
  }

  private async storeCommand(command: Command, events: DomainEvent[]): Promise<void> {
    const commandRecord = {
      ...command,
      events: events.map(e => e.id),
      executedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `command:${command.id}`,
      JSON.stringify(commandRecord),
      'EX',
      86400 * 30 // Keep for 30 days
    );
  }

  private generateCacheKey(query: Query): string {
    const paramsHash = Buffer.from(JSON.stringify(query.parameters)).toString('base64');
    return `query:cache:${query.type}:${paramsHash}`;
  }

  private async getCachedQueryResult(cacheKey: string): Promise<any> {
    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Failed to get cached query result');
      return null;
    }
  }

  private async cacheQueryResult(cacheKey: string, data: any, query: Query): Promise<void> {
    try {
      // Default cache TTL based on query type
      const ttl = this.getQueryCacheTTL(query.type);
      
      if (ttl > 0) {
        await this.redis.set(cacheKey, JSON.stringify(data), 'EX', ttl);
      }
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Failed to cache query result');
    }
  }

  private getQueryCacheTTL(queryType: string): number {
    // Configure cache TTL based on query type
    const cacheTTLMap: Record<string, number> = {
      'GetUser': 300, // 5 minutes
      'GetUserList': 60, // 1 minute
      'GetPost': 600, // 10 minutes
      'GetPostList': 120, // 2 minutes
      'GetAnalytics': 1800, // 30 minutes
      'GetStatistics': 3600, // 1 hour
    };

    return cacheTTLMap[queryType] || 300; // Default 5 minutes
  }

  private async updateReadModels(event: DomainEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [name, readModel] of this.readModels) {
      const handler = readModel.eventHandlers.get(event.type);
      if (handler) {
        promises.push(
          handler(event).then(() => {
            this.metrics.readModelsUpdated++;
            this.logger.debug({
              readModelName: name,
              eventType: event.type,
              eventId: event.id,
            }, 'Read model updated');
          }).catch(error => {
            this.logger.error({
              error,
              readModelName: name,
              eventType: event.type,
              eventId: event.id,
            }, 'Read model update failed');
          })
        );
      }
    }

    await Promise.all(promises);
  }

  public async initializeReadModels(): Promise<void> {
    this.logger.info('Initializing read models...');

    const promises: Promise<void>[] = [];
    
    for (const [name, readModel] of this.readModels) {
      promises.push(
        readModel.initialize().then(() => {
          this.logger.info({ readModelName: name }, 'Read model initialized');
        }).catch(error => {
          this.logger.error({
            error,
            readModelName: name,
          }, 'Read model initialization failed');
        })
      );
    }

    await Promise.all(promises);
    this.logger.info('All read models initialized');
  }

  public async resetReadModel(readModelName: string): Promise<void> {
    const readModel = this.readModels.get(readModelName);
    if (!readModel) {
      throw new Error(`Read model ${readModelName} not found`);
    }

    if (!readModel.reset) {
      throw new Error(`Read model ${readModelName} does not support reset`);
    }

    this.logger.info({ readModelName }, 'Resetting read model');

    try {
      await readModel.reset();
      
      // Replay events for this read model
      const handledEventTypes = Array.from(readModel.eventHandlers.keys());
      
      for (const eventType of handledEventTypes) {
        const events = await this.eventManager['eventStore'].getEventsByType(eventType);
        
        for (const event of events) {
          const handler = readModel.eventHandlers.get(event.type);
          if (handler) {
            await handler(event);
          }
        }
      }

      this.logger.info({ readModelName }, 'Read model reset and rebuilt successfully');

    } catch (error) {
      this.logger.error({
        error,
        readModelName,
      }, 'Read model reset failed');
      throw error;
    }
  }

  public async invalidateQueryCache(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern || 'query:cache:*';
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.info({
          keysDeleted: keys.length,
          pattern: searchPattern,
        }, 'Query cache invalidated');
      }

    } catch (error) {
      this.logger.error({
        error,
        pattern,
      }, 'Failed to invalidate query cache');
      throw error;
    }
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      commandSuccessRate: this.metrics.commandsProcessed > 0
        ? (this.metrics.commandsSucceeded / this.metrics.commandsProcessed) * 100
        : 100,
      querySuccessRate: this.metrics.queriesProcessed > 0
        ? (this.metrics.queriesSucceeded / this.metrics.queriesProcessed) * 100
        : 100,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
        : 0,
      commandHandlersRegistered: this.commandHandlers.size,
      queryHandlersRegistered: this.queryHandlers.size,
      readModelsRegistered: this.readModels.size,
    };
  }

  public listCommandHandlers(): string[] {
    return Array.from(this.commandHandlers.keys());
  }

  public listQueryHandlers(): string[] {
    return Array.from(this.queryHandlers.keys());
  }

  public listReadModels(): string[] {
    return Array.from(this.readModels.keys());
  }

  public getReadModelStatus(readModelName: string): any {
    const readModel = this.readModels.get(readModelName);
    if (!readModel) {
      return null;
    }

    return {
      name: readModel.name,
      handledEvents: Array.from(readModel.eventHandlers.keys()),
      supportsReset: !!readModel.reset,
    };
  }
}

export default CQRSManager;