import { Client } from 'minio';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface MinioConfig {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
}

export interface FileUploadResult {
  url: string;
  bucket: string;
  objectName: string;
  size: number;
  contentType: string;
  hash?: string;
  etag?: string;
}

export class MinioService extends EventEmitter {
  private client: Client;
  private buckets = {
    avatars: 'avatars',
    attachments: 'attachments',
    media: 'media',
    emojis: 'emojis',
    banners: 'banners'
  };
  private connectionPool: Map<string, Client> = new Map();
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;
  private connectionTimeout: number = 30000;
  private maxConnections: number = 10;

  constructor(config: MinioConfig) {
    super();
    this.client = this.createClient(config);
    this.initializeConnectionPool(config);
    this.initializeBuckets();
    this.setupHealthChecks();
  }

  private createClient(config: MinioConfig): Client {
    return new Client({
      ...config,
      transportAgent: {
        timeout: this.connectionTimeout
      }
    });
  }

  private initializeConnectionPool(config: MinioConfig): void {
    for (let i = 0; i < this.maxConnections; i++) {
      const poolId = `pool_${i}`;
      this.connectionPool.set(poolId, this.createClient(config));
    }
    console.log(`✅ Initialized MinIO connection pool with ${this.maxConnections} connections`);
  }

  private getAvailableClient(): Client {
    // Round-robin connection pool
    const poolIds = Array.from(this.connectionPool.keys());
    const randomId = poolIds[Math.floor(Math.random() * poolIds.length)];
    return this.connectionPool.get(randomId) || this.client;
  }

  private setupHealthChecks(): void {
    setInterval(async () => {
      try {
        await this.ping();
        this.emit('health_check', { status: 'healthy', timestamp: new Date() });
      } catch (error) {
        this.emit('health_check', { status: 'unhealthy', error: error.message, timestamp: new Date() });
        console.warn('MinIO health check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
  }

  private async initializeBuckets(): Promise<void> {
    try {
      const bucketPromises = Object.values(this.buckets).map(async (bucketName) => {
        try {
          await this.createBucketIfNotExists(bucketName);
        } catch (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
          throw error;
        }
      });
      
      await Promise.all(bucketPromises);
      console.log('✅ All MinIO buckets initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MinIO buckets:', error);
      this.emit('initialization_failed', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      await this.client.listBuckets();
      return true;
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getAvailableClient();
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`MinIO operation attempt ${attempt + 1}/${maxRetries + 1} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.emit('operation_failed', { error: lastError, timestamp: new Date() });
    throw lastError;
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    bucketType: 'avatars' | 'attachments' | 'media' | 'emojis' | 'banners' = 'attachments',
    options: {
      metadata?: Record<string, string>;
      checksum?: boolean;
      compression?: boolean;
    } = {}
  ): Promise<FileUploadResult> {
    return this.executeWithRetry(async () => {
      const bucket = this.buckets[bucketType];
      const hash = options.checksum ? createHash('sha256').update(buffer).digest('hex') : undefined;
      const objectName = `${Date.now()}-${hash ? hash.substring(0, 8) + '-' : ''}${fileName}`;
      
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const metadata: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'X-Upload-Time': new Date().toISOString(),
        ...(options.metadata || {})
      };

      if (hash) {
        metadata['X-File-Hash'] = hash;
      }

      const client = this.getAvailableClient();
      const etag = await client.putObject(
        bucket,
        objectName,
        stream,
        buffer.length,
        metadata
      );

      const url = await this.getPresignedUrl(bucket, objectName);
      
      this.emit('file_uploaded', {
        bucket,
        objectName,
        size: buffer.length,
        contentType,
        hash,
        timestamp: new Date()
      });

      return {
        url,
        bucket,
        objectName,
        size: buffer.length,
        contentType,
        hash,
        etag
      };
    });
  }

  async getPresignedUrl(bucket: string, objectName: string, expiry: number = 24 * 60 * 60): Promise<string> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      return await client.presignedGetObject(bucket, objectName, expiry);
    });
  }

  async generateSecureUploadUrl(
    fileName: string,
    contentType: string,
    bucketType: 'avatars' | 'attachments' | 'media' | 'emojis' | 'banners' = 'attachments',
    expiry: number = 3600,
    conditions?: Record<string, any>
  ): Promise<{
    uploadUrl: string;
    formData: Record<string, string>;
    objectName: string;
    expiresAt: Date;
  }> {
    return this.executeWithRetry(async () => {
      const bucket = this.buckets[bucketType];
      const objectName = `${Date.now()}-${fileName}`;
      const client = this.getAvailableClient();
      
      const policy = {
        expiration: new Date(Date.now() + expiry * 1000).toISOString(),
        conditions: [
          { bucket },
          { key: objectName },
          { 'Content-Type': contentType },
          ['content-length-range', 1, 100 * 1024 * 1024], // 1 byte to 100MB
          ...(conditions ? Object.entries(conditions).map(([k, v]) => ({ [k]: v })) : [])
        ]
      };
      
      const uploadUrl = await client.presignedPutObject(bucket, objectName, expiry, {
        'Content-Type': contentType
      });
      
      return {
        uploadUrl,
        formData: {
          'Content-Type': contentType,
          key: objectName
        },
        objectName,
        expiresAt: new Date(Date.now() + expiry * 1000)
      };
    });
  }

  async deleteFile(bucket: string, objectName: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      await client.removeObject(bucket, objectName);
      
      this.emit('file_deleted', {
        bucket,
        objectName,
        timestamp: new Date()
      });
    });
  }

  async batchDeleteFiles(files: Array<{ bucket: string; objectName: string }>): Promise<{
    successful: string[];
    failed: Array<{ objectName: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ objectName: string; error: string }> = [];
    
    const deletePromises = files.map(async ({ bucket, objectName }) => {
      try {
        await this.deleteFile(bucket, objectName);
        successful.push(objectName);
      } catch (error) {
        failed.push({ objectName, error: error.message });
      }
    });
    
    await Promise.allSettled(deletePromises);
    
    return { successful, failed };
  }

  async getFileInfo(bucket: string, objectName: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      return await client.statObject(bucket, objectName);
    });
  }

  async copyFile(
    sourceBucket: string,
    sourceObjectName: string,
    destBucket: string,
    destObjectName: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      const copySource = `/${sourceBucket}/${sourceObjectName}`;
      
      await client.copyObject(
        destBucket,
        destObjectName,
        copySource,
        undefined,
        metadata
      );
      
      this.emit('file_copied', {
        sourceBucket,
        sourceObjectName,
        destBucket,
        destObjectName,
        timestamp: new Date()
      });
    });
  }

  async listFiles(bucket: string, prefix?: string, maxKeys: number = 1000): Promise<any[]> {
    return this.executeWithRetry(async () => {
      const objects: any[] = [];
      const client = this.getAvailableClient();
      const stream = client.listObjects(bucket, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (objects.length < maxKeys) {
            objects.push(obj);
          }
        });
        stream.on('end', () => resolve(objects));
        stream.on('error', reject);
      });
    });
  }

  async getStorageStats(): Promise<{
    buckets: Record<string, { fileCount: number; totalSize: number }>;
    totalFiles: number;
    totalSize: number;
  }> {
    const stats: Record<string, { fileCount: number; totalSize: number }> = {};
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const [bucketType, bucketName] of Object.entries(this.buckets)) {
      try {
        const files = await this.listFiles(bucketName);
        const bucketStats = {
          fileCount: files.length,
          totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0)
        };
        
        stats[bucketType] = bucketStats;
        totalFiles += bucketStats.fileCount;
        totalSize += bucketStats.totalSize;
      } catch (error) {
        console.error(`Failed to get stats for bucket ${bucketName}:`, error);
        stats[bucketType] = { fileCount: 0, totalSize: 0 };
      }
    }
    
    return { buckets: stats, totalFiles, totalSize };
  }

  async processImageVariants(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ original: FileUploadResult; thumbnail: FileUploadResult }> {
    // Upload original
    const original = await this.uploadFile(buffer, fileName, contentType, 'media');
    
    // For now, return same as thumbnail - in production, you'd use sharp to create thumbnail
    const thumbnail = await this.uploadFile(buffer, `thumb-${fileName}`, contentType, 'media');
    
    return { original, thumbnail };
  }

  getBuckets() {
    return this.buckets;
  }

  async checkBucketExists(bucket: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      return await client.bucketExists(bucket);
    });
  }

  async createBucketIfNotExists(bucket: string, region?: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      const exists = await client.bucketExists(bucket);
      
      if (!exists) {
        await client.makeBucket(bucket, region);
        console.log(`✅ Created MinIO bucket: ${bucket}`);
        
        this.emit('bucket_created', {
          bucket,
          region,
          timestamp: new Date()
        });
        
        return true;
      }
      
      return false;
    });
  }

  async setBucketPolicy(bucket: string, policy: any): Promise<void> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      await client.setBucketPolicy(bucket, JSON.stringify(policy));
      
      this.emit('bucket_policy_set', {
        bucket,
        policy,
        timestamp: new Date()
      });
    });
  }

  async getBucketPolicy(bucket: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      const policyStr = await client.getBucketPolicy(bucket);
      return JSON.parse(policyStr);
    });
  }

  async getFileStream(bucket: string, objectName: string): Promise<Readable> {
    return this.executeWithRetry(async () => {
      const client = this.getAvailableClient();
      return await client.getObject(bucket, objectName);
    });
  }

  // Health monitoring methods
  getConnectionPoolStatus(): {
    totalConnections: number;
    activeConnections: number;
    poolUtilization: number;
  } {
    return {
      totalConnections: this.connectionPool.size,
      activeConnections: this.connectionPool.size, // All connections are considered active
      poolUtilization: 1.0 // 100% utilization for simplicity
    };
  }

  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const start = Date.now();
      const isHealthy = await this.ping();
      const responseTime = Date.now() - start;
      
      const poolStatus = this.getConnectionPoolStatus();
      const storageStats = await this.getStorageStats();
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          responseTime,
          connectionPool: poolStatus,
          storage: storageStats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.connectionPool.clear();
  }
}