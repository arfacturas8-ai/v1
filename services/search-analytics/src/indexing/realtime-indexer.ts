/**
 * CRYB Platform - Real-time Indexer
 * Handles real-time indexing with change streams and search result ranking
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import Bull from 'bull';
import { elasticsearchClient } from '../elasticsearch/client';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface IndexingJob {
  operation: 'index' | 'update' | 'delete';
  document_type: 'post' | 'comment' | 'user' | 'community';
  document_id: string;
  document?: any;
  priority?: number;
}

export class RealTimeIndexer extends EventEmitter {
  private dbPool: Pool;
  private indexingQueue: Bull.Queue;
  private bulkBuffer: any[] = [];
  private bulkTimeout: NodeJS.Timeout | null = null;
  private readonly bulkSize = 100;
  private readonly bulkTimeoutMs = 5000;

  constructor() {
    super();
    this.dbPool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.indexingQueue = new Bull('search-indexing', {
      redis: config.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.setupQueueProcessors();
    this.setupDatabaseListeners();
  }

  private setupQueueProcessors(): void {
    // High priority indexing (real-time updates)
    this.indexingQueue.process('high-priority', 10, async (job) => {
      return this.processIndexingJob(job.data);
    });

    // Normal priority indexing (bulk operations)
    this.indexingQueue.process('normal-priority', 5, async (job) => {
      return this.processIndexingJob(job.data);
    });

    // Bulk indexing processor
    this.indexingQueue.process('bulk-index', 2, async (job) => {
      return this.processBulkIndexing(job.data);
    });

    // Re-indexing processor (for maintenance)
    this.indexingQueue.process('reindex', 1, async (job) => {
      return this.processReindexing(job.data);
    });

    this.indexingQueue.on('error', (error) => {
      logger.error('Indexing queue error', { error });
    });

    this.indexingQueue.on('failed', (job, error) => {
      logger.error('Indexing job failed', { 
        jobId: job.id, 
        data: job.data, 
        error 
      });
    });
  }

  private setupDatabaseListeners(): void {
    // Listen for database changes using PostgreSQL NOTIFY/LISTEN
    this.dbPool.query('LISTEN posts_changed');
    this.dbPool.query('LISTEN comments_changed');
    this.dbPool.query('LISTEN users_changed');
    this.dbPool.query('LISTEN communities_changed');

    this.dbPool.on('notification', (msg) => {
      this.handleDatabaseNotification(msg);
    });

    // Setup triggers if they don't exist
    this.setupDatabaseTriggers();
  }

  private async setupDatabaseTriggers(): Promise<void> {
    const triggers = [
      {
        name: 'posts_search_trigger',
        table: 'posts',
        function: 'notify_search_change'
      },
      {
        name: 'comments_search_trigger',
        table: 'comments',
        function: 'notify_search_change'
      },
      {
        name: 'users_search_trigger',
        table: 'users',
        function: 'notify_search_change'
      },
      {
        name: 'communities_search_trigger',
        table: 'communities',
        function: 'notify_search_change'
      }
    ];

    try {
      // Create notification function
      await this.dbPool.query(`
        CREATE OR REPLACE FUNCTION notify_search_change()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            PERFORM pg_notify(TG_TABLE_NAME || '_changed', 
              json_build_object(
                'operation', 'delete',
                'id', OLD.id::text,
                'table', TG_TABLE_NAME
              )::text
            );
            RETURN OLD;
          ELSE
            PERFORM pg_notify(TG_TABLE_NAME || '_changed',
              json_build_object(
                'operation', CASE WHEN TG_OP = 'INSERT' THEN 'index' ELSE 'update' END,
                'id', NEW.id::text,
                'table', TG_TABLE_NAME
              )::text
            );
            RETURN NEW;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create triggers for each table
      for (const trigger of triggers) {
        await this.dbPool.query(`
          DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table};
          CREATE TRIGGER ${trigger.name}
            AFTER INSERT OR UPDATE OR DELETE ON ${trigger.table}
            FOR EACH ROW EXECUTE FUNCTION ${trigger.function}();
        `);
      }

      logger.info('Database triggers for search indexing created successfully');
    } catch (error) {
      logger.error('Failed to setup database triggers', { error });
    }
  }

  private handleDatabaseNotification(msg: any): void {
    try {
      const data = JSON.parse(msg.payload);
      const { operation, id, table } = data;

      const documentType = table.replace(/s$/, '') as 'post' | 'comment' | 'user' | 'community';
      
      // Determine priority based on document type and operation
      const priority = this.getPriority(documentType, operation);
      
      this.queueIndexingJob({
        operation,
        document_type: documentType,
        document_id: id,
        priority
      });

    } catch (error) {
      logger.error('Failed to handle database notification', { error, msg });
    }
  }

  private getPriority(documentType: string, operation: string): number {
    // Higher numbers = higher priority
    const priorities = {
      post: { index: 100, update: 80, delete: 90 },
      comment: { index: 70, update: 60, delete: 70 },
      user: { index: 50, update: 40, delete: 60 },
      community: { index: 60, update: 50, delete: 70 }
    };

    return priorities[documentType]?.[operation] || 30;
  }

  async queueIndexingJob(job: IndexingJob): Promise<void> {
    const priority = job.priority || 50;
    const queueName = priority >= 80 ? 'high-priority' : 'normal-priority';

    await this.indexingQueue.add(queueName, job, {
      priority,
      delay: priority >= 90 ? 0 : 1000, // High priority jobs process immediately
    });

    logger.debug('Queued indexing job', { job, queueName, priority });
  }

  private async processIndexingJob(job: IndexingJob): Promise<void> {
    const { operation, document_type, document_id } = job;

    try {
      switch (operation) {
        case 'index':
        case 'update':
          await this.indexDocument(document_type, document_id);
          break;
        case 'delete':
          await this.deleteDocument(document_type, document_id);
          break;
      }

      this.emit('document_processed', { job, success: true });
    } catch (error) {
      logger.error('Failed to process indexing job', { error, job });
      this.emit('document_processed', { job, success: false, error });
      throw error;
    }
  }

  private async indexDocument(documentType: string, documentId: string): Promise<void> {
    const document = await this.fetchDocument(documentType, documentId);
    if (!document) {
      logger.warn('Document not found for indexing', { documentType, documentId });
      return;
    }

    const indexName = this.getIndexName(documentType);
    const processedDocument = this.processDocumentForIndexing(documentType, document);

    // Add to bulk buffer for efficient indexing
    this.addToBulkBuffer({
      index: {
        _index: indexName,
        _id: documentId
      }
    }, processedDocument);
  }

  private async deleteDocument(documentType: string, documentId: string): Promise<void> {
    const indexName = this.getIndexName(documentType);
    
    this.addToBulkBuffer({
      delete: {
        _index: indexName,
        _id: documentId
      }
    });
  }

  private addToBulkBuffer(action: any, document?: any): void {
    this.bulkBuffer.push(action);
    if (document) {
      this.bulkBuffer.push(document);
    }

    // Flush buffer if it reaches the bulk size
    if (this.bulkBuffer.length >= this.bulkSize * 2) {
      this.flushBulkBuffer();
    } else if (!this.bulkTimeout) {
      // Set timeout to flush buffer
      this.bulkTimeout = setTimeout(() => {
        this.flushBulkBuffer();
      }, this.bulkTimeoutMs);
    }
  }

  private async flushBulkBuffer(): Promise<void> {
    if (this.bulkBuffer.length === 0) return;

    const operations = [...this.bulkBuffer];
    this.bulkBuffer = [];

    if (this.bulkTimeout) {
      clearTimeout(this.bulkTimeout);
      this.bulkTimeout = null;
    }

    try {
      await elasticsearchClient.bulkIndex(operations);
      logger.debug('Bulk indexing completed', { operationsCount: operations.length / 2 });
    } catch (error) {
      logger.error('Bulk indexing failed', { error, operationsCount: operations.length });
      // Re-queue failed operations
      this.bulkBuffer.unshift(...operations);
    }
  }

  private async fetchDocument(documentType: string, documentId: string): Promise<any> {
    const queries = {
      post: `
        SELECT p.*, 
               json_build_object(
                 'id', c.id,
                 'name', c.name,
                 'display_name', c.display_name
               ) as community,
               json_build_object(
                 'id', u.id,
                 'username', u.username,
                 'display_name', u.display_name,
                 'verified', u.is_verified
               ) as author
        FROM posts p
        JOIN communities c ON p.community_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `,
      comment: `
        SELECT c.*, 
               json_build_object(
                 'id', u.id,
                 'username', u.username,
                 'display_name', u.display_name
               ) as author
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `,
      user: `
        SELECT * FROM users WHERE id = $1
      `,
      community: `
        SELECT * FROM communities WHERE id = $1
      `
    };

    try {
      const result = await this.dbPool.query(queries[documentType], [documentId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to fetch document', { error, documentType, documentId });
      return null;
    }
  }

  private processDocumentForIndexing(documentType: string, document: any): any {
    switch (documentType) {
      case 'post':
        return this.processPostForIndexing(document);
      case 'comment':
        return this.processCommentForIndexing(document);
      case 'user':
        return this.processUserForIndexing(document);
      case 'community':
        return this.processCommunityForIndexing(document);
      default:
        return document;
    }
  }

  private processPostForIndexing(post: any): any {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      content_type: post.content_type,
      community: post.community,
      author: post.author,
      tags: post.tags || [],
      flair: {
        id: post.flair_id,
        text: post.flair_text
      },
      metrics: {
        upvotes: post.upvote_count || 0,
        downvotes: post.downvote_count || 0,
        score: (post.upvote_count || 0) - (post.downvote_count || 0),
        comments: post.comment_count || 0,
        views: post.view_count || 0,
        shares: post.share_count || 0,
        awards: post.award_count || 0,
        hot_score: post.hot_score || 0,
        engagement_rate: this.calculateEngagementRate(post)
      },
      status: {
        published: post.is_published,
        pinned: post.is_pinned,
        locked: post.is_locked,
        archived: post.is_archived,
        removed: post.is_removed,
        nsfw: post.is_nsfw,
        spoiler: post.is_spoiler,
        oc: post.is_oc
      },
      timestamps: {
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.published_at,
        last_activity: post.last_activity_at
      },
      media: {
        urls: post.media_urls || [],
        thumbnail: post.thumbnail_url,
        embed_data: post.embed_data,
        has_media: (post.media_urls && post.media_urls.length > 0) || !!post.thumbnail_url
      },
      search_boost: this.calculateSearchBoost(post),
      popularity_score: this.calculatePopularityScore(post)
    };
  }

  private processCommentForIndexing(comment: any): any {
    return {
      id: comment.id,
      content: comment.content,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      path: comment.path,
      depth: comment.depth,
      author: comment.author,
      metrics: {
        upvotes: comment.upvote_count || 0,
        downvotes: comment.downvote_count || 0,
        score: (comment.upvote_count || 0) - (comment.downvote_count || 0),
        replies: comment.reply_count || 0
      },
      status: {
        removed: comment.is_removed,
        spam: comment.is_spam
      },
      timestamps: {
        created_at: comment.created_at,
        updated_at: comment.updated_at
      }
    };
  }

  private processUserForIndexing(user: any): any {
    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      status: {
        active: user.is_active,
        verified: user.is_verified,
        premium: user.premium_type,
        banned: !!user.banned_until
      },
      stats: {
        followers: user.follower_count || 0,
        following: user.following_count || 0,
        posts: user.post_count || 0,
        comments: user.comment_count || 0,
        karma: user.karma_score || 0
      },
      timestamps: {
        created_at: user.created_at,
        last_active: user.last_active_at
      },
      location: {
        country: user.country_code,
        region: user.region_code,
        timezone: user.timezone
      }
    };
  }

  private processCommunityForIndexing(community: any): any {
    return {
      id: community.id,
      name: community.name,
      display_name: community.display_name,
      description: community.description,
      category: community.category,
      tags: community.tags || [],
      creator: {
        id: community.creator_id,
        username: community.creator_username
      },
      settings: {
        public: community.is_public,
        nsfw: community.is_nsfw,
        restricted: community.is_restricted
      },
      stats: {
        members: community.member_count || 0,
        active_members: community.active_member_count || 0,
        posts: community.post_count || 0,
        comments: community.comment_count || 0
      },
      timestamps: {
        created_at: community.created_at,
        updated_at: community.updated_at
      }
    };
  }

  private calculateEngagementRate(post: any): number {
    const views = post.view_count || 0;
    if (views === 0) return 0;
    
    const engagements = (post.upvote_count || 0) + 
                       (post.downvote_count || 0) + 
                       (post.comment_count || 0);
    
    return Number((engagements / views).toFixed(4));
  }

  private calculateSearchBoost(post: any): number {
    let boost = 1.0;
    
    // Boost verified authors
    if (post.author?.verified) boost += 0.2;
    
    // Boost based on engagement
    const engagementRate = this.calculateEngagementRate(post);
    boost += engagementRate * 2;
    
    // Boost pinned posts
    if (post.is_pinned) boost += 0.5;
    
    // Reduce boost for NSFW content
    if (post.is_nsfw) boost *= 0.8;
    
    return Math.min(boost, 3.0); // Cap at 3x boost
  }

  private calculatePopularityScore(post: any): number {
    const score = (post.upvote_count || 0) - (post.downvote_count || 0);
    const comments = post.comment_count || 0;
    const views = post.view_count || 0;
    
    // Reddit-style popularity calculation
    const ageInHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.pow(ageInHours + 1, -0.8);
    
    return (score + comments * 0.5 + views * 0.001) * timeDecay;
  }

  private getIndexName(documentType: string): string {
    const year = new Date().getFullYear();
    switch (documentType) {
      case 'post':
        return `cryb-posts-${year}`;
      case 'comment':
        return `cryb-comments-${year}`;
      case 'user':
        return 'cryb-users';
      case 'community':
        return 'cryb-communities';
      default:
        return `cryb-${documentType}`;
    }
  }

  private async processBulkIndexing(data: { documents: any[], documentType: string }): Promise<void> {
    const { documents, documentType } = data;
    const operations: any[] = [];

    for (const doc of documents) {
      const indexName = this.getIndexName(documentType);
      const processedDoc = this.processDocumentForIndexing(documentType, doc);

      operations.push(
        { index: { _index: indexName, _id: doc.id } },
        processedDoc
      );
    }

    await elasticsearchClient.bulkIndex(operations);
    logger.info('Bulk indexing completed', { documentType, count: documents.length });
  }

  private async processReindexing(data: { documentType: string, batchSize?: number }): Promise<void> {
    const { documentType, batchSize = 1000 } = data;
    let offset = 0;
    let processedCount = 0;

    logger.info('Starting reindexing process', { documentType });

    while (true) {
      const documents = await this.fetchDocumentsBatch(documentType, offset, batchSize);
      if (documents.length === 0) break;

      await this.processBulkIndexing({ documents, documentType });
      
      offset += batchSize;
      processedCount += documents.length;
      
      logger.info('Reindexing progress', { 
        documentType, 
        processedCount, 
        lastBatchSize: documents.length 
      });

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info('Reindexing completed', { documentType, totalProcessed: processedCount });
  }

  private async fetchDocumentsBatch(documentType: string, offset: number, limit: number): Promise<any[]> {
    const queries = {
      post: `
        SELECT p.*, c.name as community_name, c.display_name as community_display_name,
               u.username, u.display_name as user_display_name, u.is_verified
        FROM posts p
        JOIN communities c ON p.community_id = c.id
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      comment: `
        SELECT c.*, u.username, u.display_name as user_display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      user: `
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      community: `
        SELECT * FROM communities
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `
    };

    try {
      const result = await this.dbPool.query(queries[documentType], [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to fetch documents batch', { error, documentType, offset, limit });
      return [];
    }
  }

  // Public methods for manual operations

  async reindexAll(): Promise<void> {
    const documentTypes = ['post', 'comment', 'user', 'community'];
    
    for (const documentType of documentTypes) {
      await this.indexingQueue.add('reindex', { documentType }, {
        priority: 1, // Low priority for maintenance tasks
      });
    }
  }

  async reindexDocumentType(documentType: string): Promise<void> {
    await this.indexingQueue.add('reindex', { documentType }, {
      priority: 1,
    });
  }

  async getQueueStats(): Promise<any> {
    return {
      waiting: await this.indexingQueue.getWaiting(),
      active: await this.indexingQueue.getActive(),
      completed: await this.indexingQueue.getCompleted(),
      failed: await this.indexingQueue.getFailed(),
      delayed: await this.indexingQueue.getDelayed(),
    };
  }

  async pause(): Promise<void> {
    await this.indexingQueue.pause();
  }

  async resume(): Promise<void> {
    await this.indexingQueue.resume();
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down real-time indexer');
    
    // Flush any remaining bulk operations
    await this.flushBulkBuffer();
    
    // Close queue
    await this.indexingQueue.close();
    
    // Close database pool
    await this.dbPool.end();
  }
}

export const realTimeIndexer = new RealTimeIndexer();