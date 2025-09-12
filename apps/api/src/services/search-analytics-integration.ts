import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { logger } from '../utils/logger';

// Import all our services
import { CrashProofElasticsearchService } from './crash-proof-elasticsearch';
import { HybridSearchService } from './hybrid-search';
import { SearchIndexingService } from './search-indexer';
import { CrashProofAnalyticsService } from './crash-proof-analytics';
import { RealTimeMetricsService } from './real-time-metrics';
import { PrivacyCompliantTracker } from './privacy-compliant-tracker';
import { FuzzySearchEngine } from './fuzzy-search-engine';
import { DataRetentionManager } from './data-retention-manager';

export interface SearchAnalyticsConfig {
  elasticsearch: {
    nodes: string[];
    username?: string;
    password?: string;
    ssl?: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  analytics: {
    dataRetentionDays: number;
    enableRealTimeMetrics: boolean;
    enablePrivacyTracking: boolean;
    enableFuzzySearch: boolean;
  };
  indexing: {
    batchSize: number;
    maxRetries: number;
    enableAutoReindexing: boolean;
  };
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
  lastChecked: Date;
}

/**
 * Centralized service that integrates all search and analytics functionality
 * with comprehensive error handling and graceful degradation
 */
export class SearchAnalyticsManager {
  private elasticsearch: CrashProofElasticsearchService;
  private hybridSearch: HybridSearchService;
  private indexingService: SearchIndexingService;
  private analyticsService: CrashProofAnalyticsService;
  private metricsService: RealTimeMetricsService;
  private privacyTracker: PrivacyCompliantTracker;
  private fuzzyEngine: FuzzySearchEngine;
  private retentionManager: DataRetentionManager;
  
  private redis: Redis;
  private io: SocketIOServer;
  private queues: Map<string, Queue> = new Map();
  
  private isInitialized = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private serviceHealth = new Map<string, ServiceHealth>();

  constructor(
    private config: SearchAnalyticsConfig,
    io: SocketIOServer,
    redisConnection: Redis
  ) {
    this.io = io;
    this.redis = redisConnection;
    
    logger.info('Search & Analytics Manager initializing...', {
      elasticsearchNodes: config.elasticsearch.nodes.length,
      enableRealTimeMetrics: config.analytics.enableRealTimeMetrics,
      enablePrivacyTracking: config.analytics.enablePrivacyTracking
    });
  }

  /**
   * Initialize all services with dependency injection and error handling
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing search and analytics services...');
      
      // Create queues
      await this.createQueues();
      
      // Initialize core services
      await this.initializeElasticsearch();
      await this.initializeSearchServices();
      await this.initializeAnalyticsServices();
      await this.initializeUtilityServices();
      
      // Setup service integrations
      this.setupServiceIntegrations();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      
      logger.info('✅ Search & Analytics Manager initialized successfully');
      this.emitHealthUpdate();
      
    } catch (error) {
      logger.error('❌ Failed to initialize Search & Analytics Manager:', error);
      throw error;
    }
  }

  /**
   * Create Redis queues for different services
   */
  private async createQueues(): Promise<void> {
    try {
      const queueConfigs = [
        { name: 'search-indexing', concurrency: 10 },
        { name: 'analytics-processing', concurrency: 5 },
        { name: 'privacy-tracking', concurrency: 3 },
        { name: 'data-cleanup', concurrency: 2 }
      ];

      for (const { name, concurrency } of queueConfigs) {
        const queue = new Queue(name, {
          connection: this.redis,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        });

        this.queues.set(name, queue);
        logger.debug(`Queue created: ${name} (concurrency: ${concurrency})`);
      }
    } catch (error) {
      logger.error('Failed to create queues:', error);
      throw error;
    }
  }

  /**
   * Initialize Elasticsearch service
   */
  private async initializeElasticsearch(): Promise<void> {
    try {
      this.elasticsearch = new CrashProofElasticsearchService(this.config.elasticsearch);
      
      // Connect with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await this.elasticsearch.connect();
          await this.elasticsearch.initializeDefaultIndexes();
          this.updateServiceHealth('elasticsearch', 'healthy', {
            nodes: this.config.elasticsearch.nodes,
            connectionStatus: this.elasticsearch.getConnectionStatus()
          });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            logger.warn('Elasticsearch connection failed, search will use database fallback');
            this.updateServiceHealth('elasticsearch', 'unhealthy', { error: error instanceof Error ? error.message : error });
          } else {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
    } catch (error) {
      logger.error('Elasticsearch initialization failed:', error);
      this.updateServiceHealth('elasticsearch', 'unhealthy', { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Initialize search-related services
   */
  private async initializeSearchServices(): Promise<void> {
    try {
      // Hybrid search service
      this.hybridSearch = new HybridSearchService(this.elasticsearch);
      this.updateServiceHealth('hybrid-search', 'healthy', {
        elasticsearchAvailable: !!this.elasticsearch
      });

      // Search indexing service
      const indexingQueue = this.queues.get('search-indexing')!;
      this.indexingService = new SearchIndexingService(this.elasticsearch, this.redis);
      this.updateServiceHealth('search-indexing', 'healthy', {
        queueSize: await indexingQueue.getWaiting().then(jobs => jobs.length)
      });

      // Fuzzy search engine
      if (this.config.analytics.enableFuzzySearch) {
        this.fuzzyEngine = new FuzzySearchEngine();
        this.updateServiceHealth('fuzzy-search', 'healthy', {
          enabled: true
        });
      }

      logger.info('Search services initialized successfully');
    } catch (error) {
      logger.error('Search services initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize analytics services
   */
  private async initializeAnalyticsServices(): Promise<void> {
    try {
      const analyticsQueue = this.queues.get('analytics-processing')!;
      
      // Analytics service
      this.analyticsService = new CrashProofAnalyticsService(analyticsQueue);
      this.updateServiceHealth('analytics', 'healthy', {
        queueSize: await analyticsQueue.getWaiting().then(jobs => jobs.length)
      });

      // Real-time metrics
      if (this.config.analytics.enableRealTimeMetrics) {
        this.metricsService = new RealTimeMetricsService(this.io, this.redis);
        this.updateServiceHealth('real-time-metrics', 'healthy', {
          connectedClients: this.io.engine.clientsCount
        });
      }

      // Privacy tracking
      if (this.config.analytics.enablePrivacyTracking) {
        const privacyQueue = this.queues.get('privacy-tracking')!;
        this.privacyTracker = new PrivacyCompliantTracker(privacyQueue);
        this.updateServiceHealth('privacy-tracker', 'healthy', {
          gdprCompliant: true
        });
      }

      logger.info('Analytics services initialized successfully');
    } catch (error) {
      logger.error('Analytics services initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize utility services
   */
  private async initializeUtilityServices(): Promise<void> {
    try {
      // Data retention manager
      const cleanupQueue = this.queues.get('data-cleanup')!;
      this.retentionManager = new DataRetentionManager(cleanupQueue, this.elasticsearch);
      this.updateServiceHealth('data-retention', 'healthy', {
        policiesCount: this.retentionManager.getPolicies().length
      });

      logger.info('Utility services initialized successfully');
    } catch (error) {
      logger.error('Utility services initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup integrations between services
   */
  private setupServiceIntegrations(): void {
    // Search events → Analytics tracking
    this.hybridSearch.on('elasticsearch_failed', (error) => {
      this.metricsService?.trackError('elasticsearch', error.message, 'high');
      this.updateServiceHealth('elasticsearch', 'degraded', { error: error.message });
    });

    this.hybridSearch.on('fallback_activated', (reason) => {
      this.metricsService?.trackError('search_fallback', reason, 'medium');
    });

    // Analytics events → Real-time metrics
    this.analyticsService?.on('tracking_error', (error) => {
      this.metricsService?.trackError('analytics', error.message);
    });

    // Privacy events → Compliance logging
    this.privacyTracker?.on('consent_recorded', (data) => {
      logger.info('Privacy consent updated', { userId: data.userId });
    });

    this.privacyTracker?.on('data_erased', (data) => {
      logger.info('User data erased per GDPR', { userId: data.userId });
    });

    // Data retention events
    this.retentionManager?.on('cleanup_completed', (result) => {
      logger.info('Data retention cleanup completed', result);
      this.metricsService?.incrementCounter('data_retention.cleanup_completed', 1);
    });

    logger.info('Service integrations configured');
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Every 30 seconds

    logger.info('Health monitoring started');
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    try {
      // Elasticsearch health
      if (this.elasticsearch) {
        const isHealthy = await this.elasticsearch.ping();
        const status = this.elasticsearch.getConnectionStatus();
        this.updateServiceHealth('elasticsearch', 
          isHealthy ? 'healthy' : 'unhealthy', 
          status
        );
      }

      // Queue health
      for (const [name, queue] of this.queues) {
        try {
          const waiting = await queue.getWaiting();
          const failed = await queue.getFailed();
          const status = failed.length > 10 ? 'degraded' : 'healthy';
          
          this.updateServiceHealth(`queue-${name}`, status, {
            waiting: waiting.length,
            failed: failed.length
          });
        } catch (error) {
          this.updateServiceHealth(`queue-${name}`, 'unhealthy', {
            error: error instanceof Error ? error.message : error
          });
        }
      }

      // Service-specific health checks
      if (this.metricsService) {
        const circuitBreakers = this.metricsService.getCircuitBreakerStatus();
        const openBreakers = Object.entries(circuitBreakers)
          .filter(([, state]) => state.state === 'OPEN')
          .map(([service]) => service);
        
        this.updateServiceHealth('real-time-metrics',
          openBreakers.length === 0 ? 'healthy' : 'degraded',
          { openCircuitBreakers: openBreakers }
        );
      }

      this.emitHealthUpdate();
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  /**
   * Public API methods for search functionality
   */
  async search(query: string, filters: any = {}, options: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Search & Analytics Manager not initialized');
    }

    try {
      const startTime = Date.now();
      const result = await this.hybridSearch.searchMessages(query, filters, options);
      const responseTime = Date.now() - startTime;

      // Track search metrics
      this.metricsService?.trackSearch(
        query,
        result.results.length,
        responseTime,
        result.source
      );

      return result;
    } catch (error) {
      this.metricsService?.trackError('search', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async indexMessage(messageId: string, content: string, metadata: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search & Analytics Manager not initialized');
    }

    try {
      await this.indexingService.indexMessage(messageId, 0, 0);
      this.metricsService?.incrementCounter('messages.indexed', 1);
    } catch (error) {
      this.metricsService?.trackError('indexing', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async trackEvent(event: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search & Analytics Manager not initialized');
    }

    try {
      await this.analyticsService.trackEvent(event);
      this.metricsService?.incrementCounter('events.tracked', 1);
    } catch (error) {
      this.metricsService?.trackError('event_tracking', error instanceof Error ? error.message : String(error));
    }
  }

  async getDashboard(timeRange: string = '24h'): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Search & Analytics Manager not initialized');
    }

    try {
      return await this.analyticsService.getDashboardData(timeRange as any);
    } catch (error) {
      this.metricsService?.trackError('dashboard', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get comprehensive system health
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<ServiceHealth>;
    timestamp: string;
  } {
    const services = Array.from(this.serviceHealth.values());
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('🔄 Shutting down Search & Analytics Manager...');

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Shutdown services in reverse order
      const shutdownPromises: Promise<void>[] = [];

      if (this.retentionManager) {
        shutdownPromises.push(this.retentionManager.cleanup());
      }

      if (this.privacyTracker) {
        shutdownPromises.push(this.privacyTracker.cleanup());
      }

      if (this.metricsService) {
        shutdownPromises.push(this.metricsService.cleanup());
      }

      if (this.analyticsService) {
        shutdownPromises.push(this.analyticsService.cleanup());
      }

      if (this.indexingService) {
        shutdownPromises.push(this.indexingService.cleanup());
      }

      if (this.elasticsearch) {
        shutdownPromises.push(this.elasticsearch.cleanup());
      }

      // Close all queues
      for (const [name, queue] of this.queues) {
        shutdownPromises.push(queue.close().catch(err => 
          logger.warn(`Failed to close queue ${name}:`, err)
        ));
      }

      await Promise.allSettled(shutdownPromises);

      this.isInitialized = false;
      logger.info('✅ Search & Analytics Manager shutdown completed');

    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private updateServiceHealth(service: string, status: ServiceHealth['status'], details: any): void {
    this.serviceHealth.set(service, {
      service,
      status,
      details,
      lastChecked: new Date()
    });
  }

  private emitHealthUpdate(): void {
    const health = this.getSystemHealth();
    this.io.emit('system:health', health);
  }
}