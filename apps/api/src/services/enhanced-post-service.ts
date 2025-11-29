import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '@cryb/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { EnhancedMinioService } from './enhanced-minio';
import { FileUploadService } from './file-upload';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { createHash } from 'crypto';

export interface PostCreationData {
  title: string;
  content?: string;
  communityId: string;
  type: 'text' | 'link' | 'image' | 'video' | 'poll';
  url?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  tags?: string[];
  visibility?: 'public' | 'community' | 'private';
  allowComments?: boolean;
  sendNotifications?: boolean;
  scheduledFor?: Date;
  pollOptions?: string[];
  pollDuration?: number;
  attachments?: any[];
  flairId?: string;
  isDraft?: boolean;
}

export interface MediaProcessingResult {
  id: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  processed: boolean;
  variants?: Array<{
    type: string;
    url: string;
    size: number;
    quality?: string;
  }>;
}

export class EnhancedPostService {
  private minioService: EnhancedMinioService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.minioService = new EnhancedMinioService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });

    this.fileUploadService = new FileUploadService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      defaultBucket: 'cryb-posts'
    });
  }

  /**
   * Create a new post with comprehensive processing
   */
  async createPost(userId: string, data: PostCreationData): Promise<any> {
    try {
      // Validate community membership
      const membership = await this.validateCommunityMembership(userId, data.communityId);
      if (!membership && !data.isDraft) {
        throw new Error('You must be a member of this community to post');
      }

      // Process attachments if any
      let processedAttachments: MediaProcessingResult[] = [];
      if (data.attachments && data.attachments.length > 0) {
        processedAttachments = await this.processAttachments(data.attachments, userId);
      }

      // Create post data
      const postData: any = {
        id: randomUUID(),
        title: data.title,
        content: data.content || '',
        communityId: data.communityId,
        userId: userId,
        type: data.type || 'text',
        url: data.url,
        nsfw: data.nsfw || false,
        spoiler: data.spoiler || false,
        flair: data.flairId,
        isLocked: false,
        isPinned: false,
        isRemoved: false,
        visibility: data.visibility || 'public',
        allowComments: data.allowComments !== false,
        sendNotifications: data.sendNotifications !== false,
        scheduledFor: data.scheduledFor,
        isDraft: data.isDraft || false,
        score: 1, // Start with 1 point (author's implicit upvote)
        viewCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Handle different post types
      if (data.type === 'poll' && data.pollOptions) {
        postData.pollOptions = data.pollOptions.filter(opt => opt.trim());
        postData.pollDuration = data.pollDuration || 7;
        postData.pollEndsAt = new Date(Date.now() + (data.pollDuration || 7) * 24 * 60 * 60 * 1000);
      }

      // Create the post
      const post = await prisma.post.create({
        data: postData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true,
              awards: true
            }
          }
        }
      });

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        await this.addPostTags(post.id, data.tags);
      }

      // Add attachments to database
      if (processedAttachments.length > 0) {
        await this.saveAttachments(post.id, processedAttachments);
      }

      // Create initial upvote from author (if not draft)
      if (!data.isDraft) {
        await prisma.vote.create({
          data: {
            userId: userId,
            postId: post.id,
            value: 1
          }
        });
      }

      // Schedule notifications if enabled
      if (data.sendNotifications && !data.isDraft && !data.scheduledFor) {
        await this.scheduleNotifications(post.id, userId);
      }

      // Generate link preview if it's a link post
      if (data.type === 'link' && data.url) {
        // Async link preview generation
        this.generateLinkPreview(post.id, data.url).catch(console.error);
      }

      return {
        ...post,
        attachments: processedAttachments,
        tags: data.tags || []
      };

    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Process uploaded attachments (images, videos, etc.)
   */
  private async processAttachments(attachments: any[], userId: string): Promise<MediaProcessingResult[]> {
    const results: MediaProcessingResult[] = [];

    for (const attachment of attachments) {
      try {
        const result = await this.processMediaFile(attachment, userId);
        results.push(result);
      } catch (error) {
        console.error('Error processing attachment:', error);
        // Continue with other attachments even if one fails
      }
    }

    return results;
  }

  /**
   * Process individual media file
   */
  private async processMediaFile(file: any, userId: string): Promise<MediaProcessingResult> {
    const fileId = randomUUID();
    const bucket = 'cryb-posts';
    
    let result: MediaProcessingResult = {
      id: fileId,
      url: '',
      type: file.mimetype || 'application/octet-stream',
      size: file.size || 0,
      processed: false
    };

    try {
      if (file.mimetype?.startsWith('image/')) {
        result = await this.processImage(file, fileId, bucket, userId);
      } else if (file.mimetype?.startsWith('video/')) {
        result = await this.processVideo(file, fileId, bucket, userId);
      } else {
        // Handle other file types
        result = await this.processGenericFile(file, fileId, bucket, userId);
      }

      result.processed = true;
      return result;

    } catch (error) {
      console.error('Error processing media file:', error);
      throw error;
    }
  }

  /**
   * Process image files with optimization and variants
   */
  private async processImage(file: any, fileId: string, bucket: string, userId: string): Promise<MediaProcessingResult> {
    const originalFileName = `${fileId}_original.${file.mimetype.split('/')[1]}`;
    const thumbnailFileName = `${fileId}_thumb.webp`;
    const optimizedFileName = `${fileId}_optimized.webp`;

    // Process image with Sharp
    const imageBuffer = Buffer.from(file.buffer);
    const metadata = await sharp(imageBuffer).metadata();

    // Create optimized versions
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(400, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to MinIO
    const [originalUrl, optimizedUrl, thumbnailUrl] = await Promise.all([
      this.minioService.uploadFile(bucket, originalFileName, imageBuffer, file.mimetype),
      this.minioService.uploadFile(bucket, optimizedFileName, optimizedBuffer, 'image/webp'),
      this.minioService.uploadFile(bucket, thumbnailFileName, thumbnailBuffer, 'image/webp')
    ]);

    // Save to database
    await prisma.uploadedFile.create({
      data: {
        id: fileId,
        userId: userId,
        originalName: file.originalname || file.name,
        filename: originalFileName,
        mimeType: file.mimetype,
        size: file.size,
        hash: createHash('sha256').update(imageBuffer).digest('hex'),
        bucket: bucket,
        url: originalUrl,
        thumbnailUrl: thumbnailUrl,
        width: metadata.width,
        height: metadata.height,
        processed: true,
        scanPassed: true, // TODO: Implement virus scanning
        validated: true
      }
    });

    return {
      id: fileId,
      url: originalUrl,
      thumbnailUrl: thumbnailUrl,
      previewUrl: optimizedUrl,
      type: file.mimetype,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      processed: true,
      variants: [
        {
          type: 'thumbnail',
          url: thumbnailUrl,
          size: thumbnailBuffer.length,
          quality: '80'
        },
        {
          type: 'optimized',
          url: optimizedUrl,
          size: optimizedBuffer.length,
          quality: '85'
        }
      ]
    };
  }

  /**
   * Process video files with thumbnail generation
   */
  private async processVideo(file: any, fileId: string, bucket: string, userId: string): Promise<MediaProcessingResult> {
    const originalFileName = `${fileId}_original.${file.mimetype.split('/')[1]}`;
    const thumbnailFileName = `${fileId}_thumb.webp`;

    // Upload original video
    const videoBuffer = Buffer.from(file.buffer);
    const videoUrl = await this.minioService.uploadFile(bucket, originalFileName, videoBuffer, file.mimetype);

    // Generate thumbnail using ffmpeg (simplified - in production, use a queue)
    // For now, we'll create a placeholder thumbnail
    const placeholderThumbnail = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 100, g: 100, b: 100 }
      }
    })
      .webp()
      .toBuffer();

    const thumbnailUrl = await this.minioService.uploadFile(
      bucket, 
      thumbnailFileName, 
      placeholderThumbnail, 
      'image/webp'
    );

    // Save to database
    await prisma.uploadedFile.create({
      data: {
        id: fileId,
        userId: userId,
        originalName: file.originalname || file.name,
        filename: originalFileName,
        mimeType: file.mimetype,
        size: file.size,
        hash: createHash('sha256').update(videoBuffer).digest('hex'),
        bucket: bucket,
        url: videoUrl,
        thumbnailUrl: thumbnailUrl,
        processed: true,
        scanPassed: true,
        validated: true
      }
    });

    return {
      id: fileId,
      url: videoUrl,
      thumbnailUrl: thumbnailUrl,
      type: file.mimetype,
      size: file.size,
      processed: true
    };
  }

  /**
   * Process generic files
   */
  private async processGenericFile(file: any, fileId: string, bucket: string, userId: string): Promise<MediaProcessingResult> {
    const fileName = `${fileId}_${file.originalname || 'file'}`;
    const fileBuffer = Buffer.from(file.buffer);
    
    const fileUrl = await this.minioService.uploadFile(bucket, fileName, fileBuffer, file.mimetype);

    // Save to database
    await prisma.uploadedFile.create({
      data: {
        id: fileId,
        userId: userId,
        originalName: file.originalname || file.name,
        filename: fileName,
        mimeType: file.mimetype,
        size: file.size,
        hash: createHash('sha256').update(fileBuffer).digest('hex'),
        bucket: bucket,
        url: fileUrl,
        processed: true,
        scanPassed: true,
        validated: true
      }
    });

    return {
      id: fileId,
      url: fileUrl,
      type: file.mimetype,
      size: file.size,
      processed: true
    };
  }

  /**
   * Validate community membership
   */
  private async validateCommunityMembership(userId: string, communityId: string): Promise<boolean> {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: communityId,
          userId: userId
        }
      }
    });

    return !!membership;
  }

  /**
   * Add tags to post
   */
  private async addPostTags(postId: string, tags: string[]): Promise<void> {
    // In a real implementation, you might have a separate tags table
    // For now, we'll store them as metadata
    await prisma.post.update({
      where: { id: postId },
      data: {
        // Assuming we add a tags field to the Post model
        // tags: tags
      }
    });
  }

  /**
   * Save attachments to database
   */
  private async saveAttachments(postId: string, attachments: MediaProcessingResult[]): Promise<void> {
    // Link attachments to the post
    for (const attachment of attachments) {
      await prisma.uploadedFile.updateMany({
        where: { id: attachment.id },
        data: {
          // Assuming we have a postId field in UploadedFile
          // postId: postId
        }
      });
    }
  }

  /**
   * Schedule notifications for community members
   */
  private async scheduleNotifications(postId: string, authorId: string): Promise<void> {
    // Get community members who have notifications enabled
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        community: {
          include: {
            members: {
              where: {
                userId: { not: authorId }
              },
              include: {
                user: {
                  include: {
                    notificationPreferences: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!post) return;

    // Queue notifications for relevant members
    const notificationsToCreate = post.community.members
      .filter(member => 
        member.user.notificationPreferences?.communityEnabled !== false
      )
      .map(member => ({
        userId: member.userId,
        type: 'COMMUNITY_POST' as const,
        title: 'New post in your community',
        content: `New post: ${post.title}`,
        data: {
          postId: postId,
          communityId: post.communityId,
          authorId: authorId
        }
      }));

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate
      });
    }
  }

  /**
   * Generate link preview for link posts
   */
  private async generateLinkPreview(postId: string, url: string): Promise<void> {
    try {
      // In a real implementation, you'd fetch the URL and extract metadata
      // For now, we'll create a placeholder implementation
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CRYB-Bot/1.0'
        },
        timeout: 10000
      });

      if (response.ok) {
        const html = await response.text();
        
        // Extract title, description, and image
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);

        const linkMetadata = {
          title: titleMatch?.[1]?.trim(),
          description: descMatch?.[1]?.trim(),
          image: imageMatch?.[1]?.trim(),
          url: url
        };

        // Update post with link metadata
        await prisma.post.update({
          where: { id: postId },
          data: {
            // Assuming we have linkMetadata field
            // linkMetadata: linkMetadata
          }
        });
      }
    } catch (error) {
      console.error('Error generating link preview:', error);
      // Don't throw - link preview is optional
    }
  }

  /**
   * Get post with all related data
   */
  async getPostWithDetails(postId: string, userId?: string): Promise<any> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            awards: true
          }
        }
      }
    });

    if (!post) return null;

    // Get user's vote if authenticated
    let userVote = null;
    if (userId) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      });
      userVote = vote?.value || 0;
    }

    // Get attachments
    const attachments = await prisma.uploadedFile.findMany({
      where: {
        // Assuming we have postId field
        // postId: postId
      }
    });

    return {
      ...post,
      userVote,
      attachments
    };
  }

  /**
   * Update post
   */
  async updatePost(postId: string, userId: string, updateData: Partial<PostCreationData>): Promise<any> {
    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.userId !== userId) {
      throw new Error('Post not found or insufficient permissions');
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        editedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            awards: true
          }
        }
      }
    });

    return updatedPost;
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.userId !== userId) {
      throw new Error('Post not found or insufficient permissions');
    }

    // Delete associated data first
    await Promise.all([
      prisma.vote.deleteMany({ where: { postId } }),
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.savedPost.deleteMany({ where: { postId } }),
      prisma.report.deleteMany({ where: { postId } }),
      prisma.award.deleteMany({ where: { postId } })
    ]);

    // Delete attachments from storage
    const attachments = await prisma.uploadedFile.findMany({
      where: {
        // postId: postId
      }
    });

    for (const attachment of attachments) {
      try {
        await this.minioService.deleteFile(attachment.bucket, attachment.filename);
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postId }
    });
  }
}

export { EnhancedPostService };