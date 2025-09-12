import { Job } from 'bullmq';
import { prisma } from '@cryb/database';
import { Logger } from 'pino';
import { JobPriority } from '../core/queue-types';

export class CrashProofMessagesWorker {
  constructor(private logger: Logger) {}

  async processJob(job: Job): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Processing message job: ${job.name} (ID: ${job.id})`);

      // Update job progress
      await job.updateProgress({ percentage: 10, message: 'Starting message processing' });

      let result;
      switch (job.name) {
        case 'process-message':
          result = await this.processMessage(job);
          break;
        case 'delete-old-messages':
          result = await this.deleteOldMessages(job);
          break;
        case 'archive-channel':
          result = await this.archiveChannel(job);
          break;
        case 'index-message':
          result = await this.indexMessage(job);
          break;
        case 'generate-thread':
          result = await this.generateThread(job);
          break;
        case 'process-mentions':
          result = await this.processMentions(job);
          break;
        case 'generate-embeds':
          result = await this.generateEmbeds(job);
          break;
        case 'moderate-message':
          result = await this.moderateMessage(job);
          break;
        case 'update-search-index':
          result = await this.updateSearchIndex(job);
          break;
        case 'cleanup-attachments':
          result = await this.cleanupAttachments(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.info(`Message job ${job.id} completed in ${processingTime}ms`);

      // Final progress update
      await job.updateProgress({ percentage: 100, message: 'Job completed successfully' });

      return {
        ...result,
        processingTime,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Message job ${job.id} failed after ${processingTime}ms:`, error);

      // Update progress with error
      await job.updateProgress({ 
        percentage: 100, 
        message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });

      // Enhanced error information
      const enhancedError = new Error(`Job ${job.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      (enhancedError as any).originalError = error;
      (enhancedError as any).jobData = job.data;
      (enhancedError as any).processingTime = processingTime;
      (enhancedError as any).attemptsMade = job.attemptsMade;

      throw enhancedError;
    }
  }

  private async processMessage(job: Job): Promise<any> {
    const { messageId, channelId, content, authorId } = job.data;

    if (!messageId || !channelId || !content || !authorId) {
      throw new Error('Missing required fields: messageId, channelId, content, or authorId');
    }

    await job.updateProgress({ percentage: 20, message: 'Extracting mentions and URLs' });

    // Extract mentions with better error handling
    let mentions: string[] = [];
    let urls: string[] = [];
    try {
      mentions = this.extractMentions(content);
      urls = this.extractUrls(content);
    } catch (error) {
      this.logger.warn('Failed to extract mentions/URLs:', error);
    }

    await job.updateProgress({ percentage: 40, message: 'Generating embeds' });

    // Generate embeds for URLs with timeout
    let embeds: any[] = [];
    try {
      embeds = await Promise.race([
        this.generateEmbedsForUrls(urls),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Embed generation timeout')), 10000))
      ]) as any[];
    } catch (error) {
      this.logger.warn('Failed to generate embeds:', error);
      embeds = []; // Continue without embeds
    }

    await job.updateProgress({ percentage: 60, message: 'Updating message in database' });

    // Update message with processed data using transaction
    try {
      await prisma.$transaction(async (tx) => {
        await tx.message.update({
          where: { id: messageId },
          data: {
            mentions,
            embeds,
            processedAt: new Date()
          }
        });

        await job.updateProgress({ percentage: 80, message: 'Creating notifications for mentions' });

        // Create notifications for mentions
        if (mentions.length > 0) {
          const notificationData = mentions.map(userId => ({
            userId,
            type: 'mention',
            title: 'You were mentioned',
            content: `You were mentioned in #${channelId}`,
            data: JSON.stringify({
              messageId,
              channelId,
              authorId
            }),
            createdAt: new Date()
          }));

          await tx.notification.createMany({
            data: notificationData,
            skipDuplicates: true
          });
        }
      });

      this.logger.info(`Successfully processed message ${messageId}: ${mentions.length} mentions, ${embeds.length} embeds`);

      return { 
        processed: true, 
        mentions: mentions.length, 
        embeds: embeds.length,
        messageId,
        channelId
      };

    } catch (dbError) {
      this.logger.error('Database transaction failed:', dbError);
      throw new Error(`Failed to update message in database: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }
  }

  private async deleteOldMessages(job: Job): Promise<any> {
    const { daysOld = 30, channelId, preservePinned = true } = job.data;

    if (daysOld < 1) {
      throw new Error('daysOld must be at least 1');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await job.updateProgress({ percentage: 20, message: 'Calculating messages to delete' });

    const whereCondition: any = {
      timestamp: {
        lt: cutoffDate
      }
    };

    if (channelId) {
      whereCondition.channelId = channelId;
    }

    if (preservePinned) {
      whereCondition.pinned = false;
    }

    try {
      // First count messages to delete
      const countToDelete = await prisma.message.count({ where: whereCondition });
      
      if (countToDelete === 0) {
        return { deleted: 0, message: 'No messages found to delete' };
      }

      await job.updateProgress({ 
        percentage: 50, 
        message: `Deleting ${countToDelete} messages` 
      });

      // Delete in batches to avoid timeout
      let totalDeleted = 0;
      const batchSize = 1000;
      
      while (totalDeleted < countToDelete) {
        const batch = await prisma.message.deleteMany({
          where: {
            ...whereCondition,
            id: {
              in: (await prisma.message.findMany({
                where: whereCondition,
                select: { id: true },
                take: batchSize,
                skip: 0
              })).map(m => m.id)
            }
          }
        });

        totalDeleted += batch.count;
        
        const progress = Math.min(50 + (totalDeleted / countToDelete) * 40, 90);
        await job.updateProgress({ 
          percentage: progress, 
          message: `Deleted ${totalDeleted}/${countToDelete} messages` 
        });

        if (batch.count === 0) break; // No more messages to delete
      }

      this.logger.info(`Successfully deleted ${totalDeleted} old messages`);
      return { 
        deleted: totalDeleted, 
        cutoffDate: cutoffDate.toISOString(),
        channelId: channelId || 'all'
      };

    } catch (error) {
      this.logger.error('Failed to delete old messages:', error);
      throw new Error(`Failed to delete old messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async archiveChannel(job: Job): Promise<any> {
    const { channelId, archiveFormat = 'json' } = job.data;

    if (!channelId) {
      throw new Error('channelId is required');
    }

    await job.updateProgress({ percentage: 10, message: 'Fetching channel information' });

    try {
      // Get channel info
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { server: true }
      });

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      await job.updateProgress({ percentage: 20, message: 'Fetching messages' });

      // Get all messages with related data
      const messages = await prisma.message.findMany({
        where: { channelId },
        include: {
          author: {
            select: { id: true, username: true, displayName: true }
          },
          attachments: true,
          reactions: {
            include: {
              users: {
                select: { id: true, username: true }
              }
            }
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      await job.updateProgress({ percentage: 60, message: `Archiving ${messages.length} messages` });

      // Create archive data
      const archiveData = {
        channel: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          server: channel.server ? {
            id: channel.server.id,
            name: channel.server.name
          } : null
        },
        archivedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          author: msg.author,
          attachments: msg.attachments,
          reactions: msg.reactions,
          mentions: msg.mentions,
          embeds: msg.embeds,
          edited: msg.editedAt ? true : false,
          editedAt: msg.editedAt,
          pinned: msg.pinned
        }))
      };

      await job.updateProgress({ percentage: 80, message: 'Storing archive' });

      // Store archive (implementation would depend on your storage solution)
      const archiveKey = `channel-archive-${channelId}-${Date.now()}`;
      
      // Here you would save to S3, local storage, etc.
      this.logger.info(`Archive data prepared for channel ${channelId}:`, {
        messageCount: messages.length,
        archiveKey,
        size: JSON.stringify(archiveData).length
      });

      return { 
        archived: messages.length, 
        channelId,
        archiveKey,
        format: archiveFormat,
        size: JSON.stringify(archiveData).length
      };

    } catch (error) {
      this.logger.error(`Failed to archive channel ${channelId}:`, error);
      throw new Error(`Failed to archive channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async indexMessage(job: Job): Promise<any> {
    const { messageId } = job.data;

    if (!messageId) {
      throw new Error('messageId is required');
    }

    await job.updateProgress({ percentage: 20, message: 'Fetching message data' });

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          author: {
            select: { id: true, username: true, displayName: true }
          },
          channel: {
            select: { id: true, name: true, type: true }
          },
          attachments: true
        }
      });

      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      await job.updateProgress({ percentage: 50, message: 'Preparing search index data' });

      // Prepare search index document
      const indexDocument = {
        id: message.id,
        content: message.content,
        authorId: message.author.id,
        authorUsername: message.author.username,
        channelId: message.channel.id,
        channelName: message.channel.name,
        timestamp: message.timestamp,
        mentions: message.mentions || [],
        hasAttachments: message.attachments.length > 0,
        attachmentTypes: message.attachments.map(att => att.type),
        pinned: message.pinned,
        edited: !!message.editedAt,
        indexedAt: new Date()
      };

      await job.updateProgress({ percentage: 80, message: 'Updating search index' });

      // Here you would send to Elasticsearch, Algolia, etc.
      this.logger.info(`Search index document prepared for message ${messageId}`, indexDocument);

      return { 
        indexed: true, 
        messageId,
        indexDocument: {
          id: indexDocument.id,
          contentLength: indexDocument.content.length,
          hasAttachments: indexDocument.hasAttachments
        }
      };

    } catch (error) {
      this.logger.error(`Failed to index message ${messageId}:`, error);
      throw new Error(`Failed to index message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateThread(job: Job): Promise<any> {
    const { messageId, title, autoArchive = false } = job.data;

    if (!messageId || !title) {
      throw new Error('messageId and title are required');
    }

    await job.updateProgress({ percentage: 20, message: 'Fetching parent message' });

    try {
      const parentMessage = await prisma.message.findUnique({
        where: { id: messageId },
        include: { channel: true }
      });

      if (!parentMessage) {
        throw new Error(`Parent message ${messageId} not found`);
      }

      await job.updateProgress({ percentage: 40, message: 'Creating thread channel' });

      // Create thread channel
      const thread = await prisma.channel.create({
        data: {
          name: title.slice(0, 100), // Discord-style thread name limit
          type: 'PUBLIC_THREAD',
          parentId: parentMessage.channelId,
          serverId: parentMessage.channel.serverId,
          threadMetadata: {
            messageCount: 0,
            memberCount: 1, // Creator is automatically added
            archived: false,
            archiveTimestamp: autoArchive ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24h auto-archive
            locked: false,
            rateLimitPerUser: 0,
            slowModeSeconds: 0,
            parentMessageId: messageId
          },
          createdAt: new Date()
        }
      });

      await job.updateProgress({ percentage: 80, message: 'Setting up thread members' });

      // Add message author as thread member
      await prisma.channelMember.create({
        data: {
          channelId: thread.id,
          userId: parentMessage.authorId,
          joinedAt: new Date(),
          role: 'OWNER'
        }
      });

      this.logger.info(`Successfully created thread ${thread.id} from message ${messageId}`);

      return { 
        threadId: thread.id,
        threadName: title,
        parentMessageId: messageId,
        autoArchive
      };

    } catch (error) {
      this.logger.error(`Failed to generate thread from message ${messageId}:`, error);
      throw new Error(`Failed to generate thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processMentions(job: Job): Promise<any> {
    const { messageId, mentions } = job.data;

    if (!messageId || !Array.isArray(mentions)) {
      throw new Error('messageId and mentions array are required');
    }

    await job.updateProgress({ percentage: 20, message: 'Processing mentions' });

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { channel: true }
      });

      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      await job.updateProgress({ percentage: 40, message: 'Creating notifications' });

      // Create notifications for each mention
      const notificationPromises = mentions.map(async (userId: string) => {
        try {
          // Check if user exists and can receive notifications
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, notificationSettings: true }
          });

          if (!user) {
            this.logger.warn(`Mentioned user ${userId} not found`);
            return null;
          }

          // Create notification
          return await prisma.notification.create({
            data: {
              userId,
              type: 'mention',
              title: 'You were mentioned',
              content: `You were mentioned in #${message.channel.name}`,
              data: JSON.stringify({
                messageId,
                channelId: message.channelId,
                authorId: message.authorId,
                messageContent: message.content.slice(0, 100) // Preview
              }),
              createdAt: new Date()
            }
          });

        } catch (error) {
          this.logger.error(`Failed to create notification for user ${userId}:`, error);
          return null;
        }
      });

      const notifications = await Promise.all(notificationPromises);
      const successfulNotifications = notifications.filter(n => n !== null);

      await job.updateProgress({ percentage: 100, message: 'Mentions processed' });

      return {
        processed: true,
        mentionCount: mentions.length,
        notificationsCreated: successfulNotifications.length,
        messageId
      };

    } catch (error) {
      this.logger.error(`Failed to process mentions for message ${messageId}:`, error);
      throw new Error(`Failed to process mentions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateEmbeds(job: Job): Promise<any> {
    const { messageId, urls } = job.data;

    if (!messageId || !Array.isArray(urls)) {
      throw new Error('messageId and urls array are required');
    }

    await job.updateProgress({ percentage: 20, message: 'Generating embeds for URLs' });

    try {
      const embeds = await this.generateEmbedsForUrls(urls);

      await job.updateProgress({ percentage: 80, message: 'Updating message with embeds' });

      await prisma.message.update({
        where: { id: messageId },
        data: {
          embeds,
          embedsGeneratedAt: new Date()
        }
      });

      return {
        generated: true,
        embedCount: embeds.length,
        messageId,
        urls: urls.length
      };

    } catch (error) {
      this.logger.error(`Failed to generate embeds for message ${messageId}:`, error);
      throw new Error(`Failed to generate embeds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async moderateMessage(job: Job): Promise<any> {
    const { messageId } = job.data;

    if (!messageId) {
      throw new Error('messageId is required');
    }

    await job.updateProgress({ percentage: 20, message: 'Fetching message for moderation' });

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { 
          author: true,
          channel: { include: { server: true } }
        }
      });

      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      await job.updateProgress({ percentage: 40, message: 'Running content moderation' });

      // Simple profanity filter (in production, you'd use more sophisticated AI)
      const flaggedWords = ['spam', 'scam', 'fake']; // Simplified example
      const containsViolation = flaggedWords.some(word => 
        message.content.toLowerCase().includes(word.toLowerCase())
      );

      const moderationResult = {
        flagged: containsViolation,
        violations: containsViolation ? ['inappropriate_content'] : [],
        confidence: containsViolation ? 0.8 : 0.1,
        action: containsViolation ? 'flag' : 'approve'
      };

      await job.updateProgress({ percentage: 80, message: 'Recording moderation result' });

      // Record moderation result
      await prisma.message.update({
        where: { id: messageId },
        data: {
          moderationStatus: moderationResult.action,
          moderationFlags: moderationResult.violations,
          moderatedAt: new Date()
        }
      });

      // If flagged, create a moderation report
      if (moderationResult.flagged) {
        await prisma.moderationReport.create({
          data: {
            messageId,
            reportType: 'automated',
            reason: 'inappropriate_content',
            status: 'pending',
            data: JSON.stringify(moderationResult),
            createdAt: new Date()
          }
        });
      }

      return {
        moderated: true,
        messageId,
        flagged: moderationResult.flagged,
        violations: moderationResult.violations,
        action: moderationResult.action
      };

    } catch (error) {
      this.logger.error(`Failed to moderate message ${messageId}:`, error);
      throw new Error(`Failed to moderate message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateSearchIndex(job: Job): Promise<any> {
    const { messageId, operation = 'upsert' } = job.data;

    if (!messageId) {
      throw new Error('messageId is required');
    }

    try {
      if (operation === 'delete') {
        // Remove from search index
        this.logger.info(`Would remove message ${messageId} from search index`);
        return { updated: true, operation: 'delete', messageId };
      }

      // Update search index (same as indexMessage but for updates)
      return await this.indexMessage(job);

    } catch (error) {
      this.logger.error(`Failed to update search index for message ${messageId}:`, error);
      throw new Error(`Failed to update search index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanupAttachments(job: Job): Promise<any> {
    const { messageId } = job.data;

    if (!messageId) {
      throw new Error('messageId is required');
    }

    await job.updateProgress({ percentage: 20, message: 'Finding orphaned attachments' });

    try {
      // Find attachments without associated messages
      const orphanedAttachments = await prisma.attachment.findMany({
        where: {
          messageId: null,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        }
      });

      await job.updateProgress({ 
        percentage: 60, 
        message: `Cleaning up ${orphanedAttachments.length} orphaned attachments` 
      });

      let cleanedCount = 0;
      
      for (const attachment of orphanedAttachments) {
        try {
          // Delete from storage (S3, MinIO, etc.)
          // Implementation would depend on your storage solution
          this.logger.info(`Would delete attachment file: ${attachment.filename}`);
          
          // Delete from database
          await prisma.attachment.delete({
            where: { id: attachment.id }
          });
          
          cleanedCount++;
        } catch (error) {
          this.logger.warn(`Failed to cleanup attachment ${attachment.id}:`, error);
        }
      }

      return {
        cleaned: cleanedCount,
        total: orphanedAttachments.length,
        messageId
      };

    } catch (error) {
      this.logger.error(`Failed to cleanup attachments for message ${messageId}:`, error);
      throw new Error(`Failed to cleanup attachments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private extractMentions(content: string): string[] {
    const mentionRegex = /<@!?(\w+)>/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1] && !mentions.includes(match[1])) {
        mentions.push(match[1]);
      }
    }

    return mentions;
  }

  private extractUrls(content: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls: string[] = [];
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }

    return urls;
  }

  private async generateEmbedsForUrls(urls: string[]): Promise<any[]> {
    const embeds = [];

    for (const url of urls) {
      try {
        // In production, you'd fetch URL metadata, parse Open Graph tags, etc.
        const embed = {
          type: 'rich',
          url: url,
          title: `Link Preview`,
          description: `Preview for ${url}`,
          timestamp: new Date().toISOString(),
          provider: {
            name: new URL(url).hostname
          }
        };

        embeds.push(embed);
      } catch (error) {
        this.logger.warn(`Failed to generate embed for URL ${url}:`, error);
      }
    }

    return embeds;
  }
}