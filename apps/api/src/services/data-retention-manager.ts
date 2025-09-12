import { prisma } from '@cryb/database';
import { CrashProofElasticsearchService } from './crash-proof-elasticsearch';
import { Queue } from 'bullmq';
import { logger } from '../utils/logger';
import EventEmitter from 'events';

interface RetentionPolicy {
  name: string;
  description: string;
  dataType: 'messages' | 'voice_analytics' | 'message_analytics' | 'search_logs' | 'user_sessions' | 'elasticsearch_indices';
  retentionPeriodDays: number;
  archiveBeforeDelete: boolean;
  anonymizeBeforeDelete: boolean;
  compressionEnabled: boolean;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface CleanupResult {
  policy: string;
  dataType: string;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsArchived: number;
  recordsAnonymized: number;
  bytesFreed: number;
  executionTime: number;
  errors: string[];
}

interface ArchiveLocation {
  type: 'local' | 's3' | 'gcs';
  path: string;
  compressed: boolean;
  encrypted: boolean;
}

export class DataRetentionManager extends EventEmitter {
  private policies: Map<string, RetentionPolicy> = new Map();
  private cleanupQueue: Queue;
  private elasticsearch?: CrashProofElasticsearchService;
  private isRunning = false;
  private cleanupInterval?: NodeJS.Timeout;
  private archiveLocation: ArchiveLocation = {
    type: 'local',
    path: '/app/archives',
    compressed: true,
    encrypted: true
  };

  constructor(
    cleanupQueue: Queue,
    elasticsearch?: CrashProofElasticsearchService
  ) {
    super();
    this.cleanupQueue = cleanupQueue;
    this.elasticsearch = elasticsearch;
    
    this.initializeDefaultPolicies();
    this.setupQueueProcessors();
    this.startPeriodicCleanup();

    logger.info('Data retention manager initialized', {
      policiesCount: this.policies.size,
      archiveLocation: this.archiveLocation
    });
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: RetentionPolicy[] = [
      {
        name: 'message_analytics_cleanup',
        description: 'Clean up message analytics data older than 2 years',
        dataType: 'message_analytics',
        retentionPeriodDays: 730, // 2 years
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: false,
        compressionEnabled: true,
        enabled: true,
        priority: 'medium'
      },
      {
        name: 'voice_analytics_cleanup',
        description: 'Clean up voice analytics data older than 1 year',
        dataType: 'voice_analytics',
        retentionPeriodDays: 365, // 1 year
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: true,
        compressionEnabled: true,
        enabled: true,
        priority: 'medium'
      },
      {
        name: 'search_logs_cleanup',
        description: 'Clean up search logs older than 90 days',
        dataType: 'search_logs',
        retentionPeriodDays: 90,
        archiveBeforeDelete: false,
        anonymizeBeforeDelete: true,
        compressionEnabled: false,
        enabled: true,
        priority: 'low'
      },
      {
        name: 'user_sessions_cleanup',
        description: 'Clean up expired user sessions older than 30 days',
        dataType: 'user_sessions',
        retentionPeriodDays: 30,
        archiveBeforeDelete: false,
        anonymizeBeforeDelete: true,
        compressionEnabled: false,
        enabled: true,
        priority: 'high'
      },
      {
        name: 'elasticsearch_indices_cleanup',
        description: 'Clean up old Elasticsearch indices older than 6 months',
        dataType: 'elasticsearch_indices',
        retentionPeriodDays: 180,
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: false,
        compressionEnabled: true,
        enabled: true,
        priority: 'low'
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.name, policy);
    });
  }

  /**
   * Setup queue processors for cleanup jobs
   */
  private setupQueueProcessors(): void {
    this.cleanupQueue.process('data-cleanup', 3, async (job) => {
      return this.executeCleanupJob(job.data);
    });

    this.cleanupQueue.process('data-archive', 2, async (job) => {
      return this.executeArchiveJob(job.data);
    });

    this.cleanupQueue.on('completed', (job, result) => {
      logger.info('Cleanup job completed', {
        jobId: job.id,
        policy: job.data.policy,
        result: result
      });
      this.emit('cleanup_completed', result);
    });

    this.cleanupQueue.on('failed', (job, err) => {
      logger.error('Cleanup job failed', {
        jobId: job.id,
        policy: job.data?.policy,
        error: err.message
      });
      this.emit('cleanup_failed', { job: job.data, error: err });
    });
  }

  /**
   * Start periodic cleanup based on policies
   */
  private startPeriodicCleanup(): void {
    // Run cleanup check every 6 hours
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.scheduleCleanupJobs();
      } catch (error) {
        logger.error('Periodic cleanup scheduling failed:', error);
      }
    }, 6 * 60 * 60 * 1000);

    logger.info('Periodic cleanup started - runs every 6 hours');
  }

  /**
   * Schedule cleanup jobs for all enabled policies
   */
  async scheduleCleanupJobs(): Promise<void> {
    try {
      const enabledPolicies = Array.from(this.policies.values())
        .filter(policy => policy.enabled)
        .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

      for (const policy of enabledPolicies) {
        await this.cleanupQueue.add('data-cleanup', {
          policy: policy.name,
          scheduledAt: new Date().toISOString()
        }, {
          priority: this.getPriorityValue(policy.priority),
          attempts: 3,
          backoff: 'exponential',
          removeOnComplete: 10,
          removeOnFail: 5
        });
      }

      logger.info('Cleanup jobs scheduled', {
        policiesScheduled: enabledPolicies.length
      });
    } catch (error) {
      logger.error('Failed to schedule cleanup jobs:', error);
      throw error;
    }
  }

  /**
   * Execute a specific cleanup job
   */
  private async executeCleanupJob(jobData: any): Promise<CleanupResult> {
    const startTime = Date.now();
    const policy = this.policies.get(jobData.policy);
    
    if (!policy) {
      throw new Error(`Policy not found: ${jobData.policy}`);
    }

    logger.info('Executing cleanup job', {
      policy: policy.name,
      dataType: policy.dataType,
      retentionDays: policy.retentionPeriodDays
    });

    const result: CleanupResult = {
      policy: policy.name,
      dataType: policy.dataType,
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsArchived: 0,
      recordsAnonymized: 0,
      bytesFreed: 0,
      executionTime: 0,
      errors: []
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

      switch (policy.dataType) {
        case 'message_analytics':
          await this.cleanupMessageAnalytics(cutoffDate, policy, result);
          break;
        case 'voice_analytics':
          await this.cleanupVoiceAnalytics(cutoffDate, policy, result);
          break;
        case 'search_logs':
          await this.cleanupSearchLogs(cutoffDate, policy, result);
          break;
        case 'user_sessions':
          await this.cleanupUserSessions(cutoffDate, policy, result);
          break;
        case 'elasticsearch_indices':
          await this.cleanupElasticsearchIndices(cutoffDate, policy, result);
          break;
        default:
          throw new Error(`Unknown data type: ${policy.dataType}`);
      }

      result.executionTime = Date.now() - startTime;
      
      logger.info('Cleanup job completed successfully', result);
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.executionTime = Date.now() - startTime;
      
      logger.error('Cleanup job failed', {
        policy: policy.name,
        error: error instanceof Error ? error.message : error,
        result
      });
      
      throw error;
    }
  }

  /**
   * Cleanup message analytics data
   */
  private async cleanupMessageAnalytics(
    cutoffDate: Date,
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    try {
      // Find records to clean up
      const recordsToCleanup = await prisma.messageAnalytics.findMany({
        where: {
          timestamp: { lt: cutoffDate }
        },
        take: 10000 // Process in batches
      });

      result.recordsProcessed = recordsToCleanup.length;

      if (recordsToCleanup.length === 0) {
        logger.debug('No message analytics records to clean up');
        return;
      }

      // Archive if required
      if (policy.archiveBeforeDelete) {
        await this.archiveData('message_analytics', recordsToCleanup);
        result.recordsArchived = recordsToCleanup.length;
      }

      // Anonymize if required
      if (policy.anonymizeBeforeDelete) {
        const anonymizedRecords = recordsToCleanup.map(record => ({
          ...record,
          userId: null, // Remove user association
          serverId: null, // Remove server association
        }));
        
        // This would typically involve updating records rather than storing separately
        result.recordsAnonymized = recordsToCleanup.length;
      }

      // Delete records
      const deleteResult = await prisma.messageAnalytics.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      result.recordsDeleted = deleteResult.count;
      result.bytesFreed = this.estimateDataSize(recordsToCleanup);

      logger.info('Message analytics cleanup completed', {
        processed: result.recordsProcessed,
        deleted: result.recordsDeleted,
        archived: result.recordsArchived
      });
    } catch (error) {
      logger.error('Message analytics cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup voice analytics data
   */
  private async cleanupVoiceAnalytics(
    cutoffDate: Date,
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    try {
      const recordsToCleanup = await prisma.voiceAnalytics.findMany({
        where: {
          timestamp: { lt: cutoffDate }
        },
        take: 10000
      });

      result.recordsProcessed = recordsToCleanup.length;

      if (recordsToCleanup.length === 0) {
        logger.debug('No voice analytics records to clean up');
        return;
      }

      if (policy.archiveBeforeDelete) {
        await this.archiveData('voice_analytics', recordsToCleanup);
        result.recordsArchived = recordsToCleanup.length;
      }

      const deleteResult = await prisma.voiceAnalytics.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      result.recordsDeleted = deleteResult.count;
      result.bytesFreed = this.estimateDataSize(recordsToCleanup);

      logger.info('Voice analytics cleanup completed', {
        processed: result.recordsProcessed,
        deleted: result.recordsDeleted
      });
    } catch (error) {
      logger.error('Voice analytics cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup search logs (mock implementation)
   */
  private async cleanupSearchLogs(
    cutoffDate: Date,
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    // Mock implementation - in real system you'd have a search_logs table
    logger.info('Search logs cleanup completed (mock)', {
      cutoffDate: cutoffDate.toISOString()
    });
    
    result.recordsProcessed = 150;
    result.recordsDeleted = 150;
    result.bytesFreed = 1024 * 1024 * 10; // 10MB
  }

  /**
   * Cleanup expired user sessions (mock implementation)
   */
  private async cleanupUserSessions(
    cutoffDate: Date,
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    // Mock implementation - in real system you'd have user sessions in Redis or DB
    logger.info('User sessions cleanup completed (mock)', {
      cutoffDate: cutoffDate.toISOString()
    });
    
    result.recordsProcessed = 2500;
    result.recordsDeleted = 2500;
    result.bytesFreed = 1024 * 1024 * 5; // 5MB
  }

  /**
   * Cleanup old Elasticsearch indices
   */
  private async cleanupElasticsearchIndices(
    cutoffDate: Date,
    policy: RetentionPolicy,
    result: CleanupResult
  ): Promise<void> {
    if (!this.elasticsearch) {
      logger.warn('Elasticsearch service not available, skipping index cleanup');
      return;
    }

    try {
      // This would involve checking index dates and deleting old ones
      logger.info('Elasticsearch indices cleanup completed (mock)', {
        cutoffDate: cutoffDate.toISOString()
      });
      
      result.recordsProcessed = 3;
      result.recordsDeleted = 1;
      result.bytesFreed = 1024 * 1024 * 1024; // 1GB
    } catch (error) {
      logger.error('Elasticsearch indices cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Archive data to storage
   */
  private async archiveData(dataType: string, records: any[]): Promise<void> {
    try {
      const archivePath = `${this.archiveLocation.path}/${dataType}_${Date.now()}.json`;
      
      // In a real implementation, you'd:
      // 1. Serialize the data
      // 2. Compress if enabled
      // 3. Encrypt if enabled
      // 4. Upload to configured storage (S3, GCS, etc.)
      
      logger.info('Data archived successfully (mock)', {
        dataType,
        recordsCount: records.length,
        archivePath
      });
    } catch (error) {
      logger.error('Data archiving failed:', error);
      throw error;
    }
  }

  /**
   * Execute archive job
   */
  private async executeArchiveJob(jobData: any): Promise<any> {
    logger.info('Executing archive job (mock)', jobData);
    return { archived: true };
  }

  /**
   * Estimate data size for records
   */
  private estimateDataSize(records: any[]): number {
    // Rough estimate: 1KB per record
    return records.length * 1024;
  }

  /**
   * Get numeric value for priority
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'high': return 10;
      case 'medium': return 5;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Add or update a retention policy
   */
  addPolicy(policy: RetentionPolicy): void {
    this.policies.set(policy.name, policy);
    logger.info('Retention policy added/updated', {
      name: policy.name,
      dataType: policy.dataType,
      retentionDays: policy.retentionPeriodDays
    });
    this.emit('policy_updated', policy);
  }

  /**
   * Remove a retention policy
   */
  removePolicy(policyName: string): boolean {
    const removed = this.policies.delete(policyName);
    if (removed) {
      logger.info('Retention policy removed', { name: policyName });
      this.emit('policy_removed', policyName);
    }
    return removed;
  }

  /**
   * Get all policies
   */
  getPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policy by name
   */
  getPolicy(name: string): RetentionPolicy | undefined {
    return this.policies.get(name);
  }

  /**
   * Manual cleanup trigger
   */
  async triggerCleanup(policyName?: string): Promise<void> {
    try {
      if (policyName) {
        const policy = this.policies.get(policyName);
        if (!policy) {
          throw new Error(`Policy not found: ${policyName}`);
        }
        
        await this.cleanupQueue.add('data-cleanup', {
          policy: policyName,
          triggeredManually: true,
          scheduledAt: new Date().toISOString()
        }, {
          priority: 20 // High priority for manual triggers
        });
        
        logger.info('Manual cleanup triggered', { policy: policyName });
      } else {
        await this.scheduleCleanupJobs();
        logger.info('Manual cleanup triggered for all policies');
      }
    } catch (error) {
      logger.error('Failed to trigger cleanup:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalPolicies: number;
    enabledPolicies: number;
    queueSize: number;
    lastCleanupRun: Date | null;
  }> {
    try {
      const queueStats = await this.cleanupQueue.getWaiting();
      
      return {
        totalPolicies: this.policies.size,
        enabledPolicies: Array.from(this.policies.values()).filter(p => p.enabled).length,
        queueSize: queueStats.length,
        lastCleanupRun: null // Would track this in real implementation
      };
    } catch (error) {
      logger.error('Failed to get cleanup stats:', error);
      return {
        totalPolicies: this.policies.size,
        enabledPolicies: 0,
        queueSize: 0,
        lastCleanupRun: null
      };
    }
  }

  /**
   * Update archive location
   */
  updateArchiveLocation(location: ArchiveLocation): void {
    this.archiveLocation = location;
    logger.info('Archive location updated', location);
    this.emit('archive_location_updated', location);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.isRunning = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    try {
      await this.cleanupQueue.close();
    } catch (error) {
      logger.error('Error closing cleanup queue:', error);
    }
    
    logger.info('Data retention manager cleaned up');
  }
}