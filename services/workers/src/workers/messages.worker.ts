import { Worker, Job } from 'bullmq';
import { prisma } from '@cryb/database';
import { Logger } from 'pino';

export class MessagesWorker {
  private worker: Worker | null = null;

  constructor(
    private connection: any,
    private logger: Logger
  ) {}

  async start() {
    this.worker = new Worker(
      'messages',
      async (job: Job) => {
        this.logger.info(`Processing message job: ${job.name}`);

        switch (job.name) {
          case 'process-message':
            return await this.processMessage(job.data);
          case 'delete-old-messages':
            return await this.deleteOldMessages(job.data);
          case 'archive-channel':
            return await this.archiveChannel(job.data);
          case 'index-message':
            return await this.indexMessage(job.data);
          case 'generate-thread':
            return await this.generateThread(job.data);
          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      },
      {
        connection: this.connection,
        concurrency: 5,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 }
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.info(`Message job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Message job ${job?.id} failed:`, err);
    });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processMessage(data: any) {
    const { messageId, channelId, content, authorId } = data;

    // Extract mentions
    const mentions = this.extractMentions(content);
    
    // Extract URLs
    const urls = this.extractUrls(content);
    
    // Generate embeds for URLs
    const embeds = await this.generateEmbeds(urls);

    // Update message with processed data
    await prisma.message.update({
      where: { id: messageId },
      data: {
        mentions,
        embeds
      }
    });

    // Create notifications for mentions
    for (const userId of mentions) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'mention',
          title: 'You were mentioned',
          content: `You were mentioned in #${channelId}`,
          data: {
            messageId,
            channelId,
            authorId
          }
        }
      });
    }

    return { processed: true, mentions: mentions.length, embeds: embeds.length };
  }

  private async deleteOldMessages(data: any) {
    const { daysOld = 30 } = data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.message.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        },
        pinned: false
      }
    });

    return { deleted: result.count };
  }

  private async archiveChannel(data: any) {
    const { channelId } = data;

    // Get all messages from channel
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        author: true,
        attachments: true
      },
      orderBy: { timestamp: 'asc' }
    });

    // Archive to S3 or other storage
    // Implementation would go here

    return { archived: messages.length };
  }

  private async indexMessage(data: any) {
    const { messageId } = data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: true,
        channel: true
      }
    });

    if (!message) return { indexed: false };

    // Index in Elasticsearch
    // Implementation would connect to Elasticsearch and index the message

    return { indexed: true };
  }

  private async generateThread(data: any) {
    const { messageId, title } = data;

    // Create a thread from a message
    const thread = await prisma.channel.create({
      data: {
        name: title,
        type: 'PUBLIC_THREAD',
        parentId: messageId,
        threadMetadata: {
          messageCount: 0,
          memberCount: 0,
          archived: false,
          archiveTimestamp: null,
          locked: false
        }
      }
    });

    return { threadId: thread.id };
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /<@(\w+)>/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private extractUrls(content: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls: string[] = [];
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  }

  private async generateEmbeds(urls: string[]): Promise<any[]> {
    // Implementation would fetch URL metadata and generate embeds
    return [];
  }
}