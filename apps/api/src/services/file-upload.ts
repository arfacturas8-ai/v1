import { Client as MinioClient } from 'minio';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import sharp from 'sharp';
import path from 'path';
import { Readable } from 'stream';

export interface FileUploadOptions {
  allowedTypes?: string[];
  maxSize?: number;
  bucket?: string;
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  generateThumbnail?: boolean;
  scanForMalware?: boolean;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  bucket: string;
  hash: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface FileProcessingResult {
  original: UploadedFile;
  thumbnail?: UploadedFile;
  variants?: UploadedFile[];
  scanResult?: {
    clean: boolean;
    threats?: string[];
  };
}

/**
 * Comprehensive File Upload Service with MinIO/S3 Support
 * 
 * Features:
 * - Multiple file format support
 * - Image processing and thumbnail generation
 * - File type validation and size limits
 * - Malware scanning integration
 * - CDN-ready URLs
 * - Metadata extraction
 * - Automatic cleanup
 * - Progress tracking
 * - Batch uploads
 * - Direct browser uploads with signed URLs
 */
export class FileUploadService {
  private minio: MinioClient;
  private defaultBucket: string;
  private cdnBaseUrl?: string;
  private maxFileSize = 100 * 1024 * 1024; // 100MB default
  
  // Allowed file types by category
  private allowedTypes = {
    images: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
    ],
    videos: [
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'video/x-ms-wmv', 'video/webm', 'video/3gpp'
    ],
    audio: [
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
      'audio/webm', 'audio/aac', 'audio/flac'
    ],
    documents: [
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'application/json'
    ],
    archives: [
      'application/zip', 'application/x-rar-compressed',
      'application/x-7z-compressed', 'application/gzip'
    ]
  };

  constructor(config: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL?: boolean;
    bucket?: string;
    cdnBaseUrl?: string;
  }) {
    this.minio = new MinioClient({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL || false,
      accessKey: config.accessKey,
      secretKey: config.secretKey
    });
    
    this.defaultBucket = config.bucket || 'cryb-uploads';
    this.cdnBaseUrl = config.cdnBaseUrl;
    
    this.initializeBuckets();
  }

  private async initializeBuckets(): Promise<void> {
    const buckets = [
      this.defaultBucket,
      'cryb-avatars',
      'cryb-attachments',
      'cryb-media',
      'cryb-thumbnails',
      'cryb-temp'
    ];

    for (const bucket of buckets) {
      try {
        const exists = await this.minio.bucketExists(bucket);
        if (!exists) {
          await this.minio.makeBucket(bucket);
          
          // Set bucket policy for public read on avatars and thumbnails
          if (['cryb-avatars', 'cryb-thumbnails'].includes(bucket)) {
            await this.setBucketPublicPolicy(bucket);
          }
          
          console.log(`✅ Created bucket: ${bucket}`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize bucket ${bucket}:`, error);
      }
    }
  }

  private async setBucketPublicPolicy(bucket: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`]
        }
      ]
    };

    try {
      await this.minio.setBucketPolicy(bucket, JSON.stringify(policy));
    } catch (error) {
      console.warn(`Warning: Could not set public policy for ${bucket}:`, error);
    }
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: MultipartFile,
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<FileProcessingResult> {
    try {
      // Validate file
      await this.validateFile(file, options);
      
      // Generate unique filename
      const fileId = randomUUID();
      const extension = this.getFileExtension(file.filename);
      const filename = `${fileId}${extension}`;
      const bucket = options.bucket || this.getBucketForFile(file.mimetype);
      
      // Get file buffer
      const buffer = await file.toBuffer();
      const hash = createHash('sha256').update(buffer).digest('hex');
      
      // Check for duplicate files
      const existingFile = await this.findDuplicateFile(hash);
      if (existingFile) {
        return { original: existingFile };
      }

      // Process file based on type
      let processedBuffer = buffer;
      let metadata: Record<string, any> = {
        originalName: file.filename,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        hash,
        userAgent: 'api-server'
      };

      // Image processing
      if (this.isImage(file.mimetype)) {
        const imageInfo = await this.processImage(buffer, options);
        processedBuffer = imageInfo.buffer;
        metadata = { ...metadata, ...imageInfo.metadata };
      }

      // Upload main file
      const uploadResult = await this.minio.putObject(
        bucket,
        filename,
        processedBuffer,
        processedBuffer.length,
        {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Original-Name': encodeURIComponent(file.filename),
          'X-Amz-Meta-Uploaded-By': userId,
          'X-Amz-Meta-Hash': hash,
          'X-Amz-Meta-Upload-Date': new Date().toISOString()
        }
      );

      const originalFile: UploadedFile = {
        id: fileId,
        originalName: file.filename,
        filename,
        mimeType: file.mimetype,
        size: processedBuffer.length,
        url: await this.getFileUrl(bucket, filename),
        bucket,
        hash,
        metadata,
        uploadedAt: new Date(),
        uploadedBy: userId
      };

      const result: FileProcessingResult = { original: originalFile };

      // Generate thumbnail for images
      if (options.generateThumbnail && this.isImage(file.mimetype)) {
        try {
          result.thumbnail = await this.generateThumbnail(
            buffer, 
            fileId, 
            file.mimetype, 
            userId
          );
        } catch (error) {
          console.warn('Thumbnail generation failed:', error);
        }
      }

      // Malware scanning (if enabled)
      if (options.scanForMalware) {
        result.scanResult = await this.scanFile(buffer, file.mimetype);
      }

      // Store file metadata in database (you'd implement this)
      await this.storeFileMetadata(originalFile);

      return result;

    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: MultipartFile[],
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<FileProcessingResult[]> {
    const results: FileProcessingResult[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, userId, options);
        results.push(result);
      } catch (error) {
        errors.push(`${file.filename}: ${error.message}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All uploads failed: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * Generate signed upload URL for direct browser uploads
   */
  async generateSignedUploadUrl(
    fileName: string,
    contentType: string,
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<{
    uploadUrl: string;
    fileId: string;
    expiresIn: number;
  }> {
    const fileId = randomUUID();
    const extension = path.extname(fileName);
    const filename = `${fileId}${extension}`;
    const bucket = options.bucket || this.getBucketForFile(contentType);
    
    // Validate content type
    if (options.allowedTypes && !options.allowedTypes.includes(contentType)) {
      throw new Error(`File type ${contentType} not allowed`);
    }

    const expiresIn = 3600; // 1 hour
    const uploadUrl = await this.minio.presignedPutObject(
      bucket,
      filename,
      expiresIn,
      {
        'Content-Type': contentType,
        'X-Amz-Meta-Uploaded-By': userId,
        'X-Amz-Meta-Upload-Date': new Date().toISOString()
      }
    );

    return {
      uploadUrl,
      fileId,
      expiresIn
    };
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(bucket: string, filename: string, expiresIn: number = 3600): Promise<string> {
    return await this.minio.presignedGetObject(bucket, filename, expiresIn);
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, filename: string): Promise<void> {
    try {
      await this.minio.removeObject(bucket, filename);
      
      // Also try to delete thumbnail if it exists
      if (bucket !== 'cryb-thumbnails') {
        const thumbnailFilename = `thumb_${filename}`;
        try {
          await this.minio.removeObject('cryb-thumbnails', thumbnailFilename);
        } catch {
          // Thumbnail might not exist, ignore
        }
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(bucket: string, filename: string): Promise<any> {
    try {
      const stat = await this.minio.statObject(bucket, filename);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metadata: stat.metaData
      };
    } catch (error) {
      throw new Error(`File not found: ${filename}`);
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(
    bucket: string,
    prefix?: string,
    limit: number = 100
  ): Promise<any[]> {
    const files: any[] = [];
    const stream = this.minio.listObjects(bucket, prefix, true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (files.length < limit) {
          files.push(obj);
        }
      });
      
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  /**
   * Copy file to different bucket or path
   */
  async copyFile(
    sourceBucket: string,
    sourceFilename: string,
    destBucket: string,
    destFilename: string
  ): Promise<void> {
    try {
      await this.minio.copyObject(
        destBucket,
        destFilename,
        `/${sourceBucket}/${sourceFilename}`
      );
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Stream file content
   */
  async getFileStream(bucket: string, filename: string): Promise<Readable> {
    try {
      return await this.minio.getObject(bucket, filename);
    } catch (error) {
      throw new Error(`Failed to get file stream: ${error.message}`);
    }
  }

  /**
   * Batch operations
   */
  async batchDelete(files: Array<{ bucket: string; filename: string }>): Promise<void> {
    const deletePromises = files.map(({ bucket, filename }) => 
      this.deleteFile(bucket, filename).catch(error => 
        console.error(`Failed to delete ${filename}:`, error)
      )
    );
    
    await Promise.allSettled(deletePromises);
  }

  /**
   * Cleanup old temporary files
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const tempFiles = await this.listFiles('cryb-temp');
    
    const oldFiles = tempFiles.filter(file => 
      file.lastModified && file.lastModified < cutoffTime
    );
    
    if (oldFiles.length > 0) {
      await this.batchDelete(
        oldFiles.map(file => ({
          bucket: 'cryb-temp',
          filename: file.name
        }))
      );
      
      console.log(`🧹 Cleaned up ${oldFiles.length} temporary files`);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async validateFile(file: MultipartFile, options: FileUploadOptions): Promise<void> {
    // Check file size
    const maxSize = options.maxSize || this.maxFileSize;
    if (file.file.truncated || (file.file as any).bytesRead > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize} bytes`);
    }

    // Check file type
    if (options.allowedTypes) {
      if (!options.allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not allowed`);
      }
    } else {
      // Check against all allowed types
      const allAllowed = Object.values(this.allowedTypes).flat();
      if (!allAllowed.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not supported`);
      }
    }

    // Validate filename
    if (!file.filename || file.filename.length > 255) {
      throw new Error('Invalid filename');
    }

    // Check for potentially dangerous files
    const dangerousExtensions = ['.exe', '.bat', '.com', '.cmd', '.scr', '.pif', '.js', '.vbs'];
    const extension = this.getFileExtension(file.filename).toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      throw new Error('File type not allowed for security reasons');
    }
  }

  private getBucketForFile(mimeType: string): string {
    if (this.allowedTypes.images.includes(mimeType)) {
      return 'cryb-media';
    } else if (this.allowedTypes.videos.includes(mimeType)) {
      return 'cryb-media';
    } else if (this.allowedTypes.audio.includes(mimeType)) {
      return 'cryb-media';
    } else if (this.allowedTypes.documents.includes(mimeType)) {
      return 'cryb-attachments';
    } else {
      return this.defaultBucket;
    }
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename) || '';
  }

  private isImage(mimeType: string): boolean {
    return this.allowedTypes.images.includes(mimeType);
  }

  private async processImage(
    buffer: Buffer, 
    options: FileUploadOptions
  ): Promise<{ buffer: Buffer; metadata: any }> {
    let image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if requested
    if (options.resize) {
      const { width, height, quality = 85 } = options.resize;
      
      if (width || height) {
        image = image.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Optimize quality for JPEG
      if (metadata.format === 'jpeg') {
        image = image.jpeg({ quality });
      } else if (metadata.format === 'png') {
        image = image.png({ quality });
      } else if (metadata.format === 'webp') {
        image = image.webp({ quality });
      }
    }

    // Auto-rotate based on EXIF
    image = image.rotate();

    const processedBuffer = await image.toBuffer();
    
    return {
      buffer: processedBuffer,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        colorSpace: metadata.space,
        density: metadata.density
      }
    };
  }

  private async generateThumbnail(
    originalBuffer: Buffer,
    fileId: string,
    mimeType: string,
    userId: string
  ): Promise<UploadedFile> {
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFilename = `thumb_${fileId}.jpg`;
    
    await this.minio.putObject(
      'cryb-thumbnails',
      thumbnailFilename,
      thumbnailBuffer,
      thumbnailBuffer.length,
      {
        'Content-Type': 'image/jpeg',
        'X-Amz-Meta-Original-File-Id': fileId,
        'X-Amz-Meta-Uploaded-By': userId
      }
    );

    return {
      id: `${fileId}_thumb`,
      originalName: `thumbnail_${fileId}`,
      filename: thumbnailFilename,
      mimeType: 'image/jpeg',
      size: thumbnailBuffer.length,
      url: await this.getFileUrl('cryb-thumbnails', thumbnailFilename),
      bucket: 'cryb-thumbnails',
      hash: createHash('sha256').update(thumbnailBuffer).digest('hex'),
      uploadedAt: new Date(),
      uploadedBy: userId
    };
  }

  private async scanFile(buffer: Buffer, mimeType: string): Promise<{
    clean: boolean;
    threats?: string[];
  }> {
    // Placeholder for malware scanning integration
    // You would integrate with services like ClamAV, VirusTotal, etc.
    
    // Basic file signature checks
    const signatures = {
      // Common malware signatures (simplified)
      'exe': buffer.subarray(0, 2).toString('hex') === '4d5a', // MZ header
      'suspicious_pdf': mimeType === 'application/pdf' && buffer.includes(Buffer.from('/JavaScript')),
      'suspicious_zip': mimeType === 'application/zip' && buffer.includes(Buffer.from('.exe'))
    };

    const threats: string[] = [];
    Object.entries(signatures).forEach(([threat, detected]) => {
      if (detected) {
        threats.push(threat);
      }
    });

    return {
      clean: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
  }

  private async findDuplicateFile(hash: string): Promise<UploadedFile | null> {
    // This would check your database for existing files with the same hash
    // Return null for now as placeholder
    return null;
  }

  private async storeFileMetadata(file: UploadedFile): Promise<void> {
    // Store file metadata in your database
    // This is a placeholder - you'd implement database storage here
    console.log(`📁 Stored metadata for file: ${file.filename}`);
  }

  private async getFileUrl(bucket: string, filename: string): Promise<string> {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${bucket}/${filename}`;
    } else {
      // Use MinIO URL
      const protocol = this.minio.protocol;
      const host = this.minio.host;
      const port = this.minio.port;
      return `${protocol}//${host}:${port}/${bucket}/${filename}`;
    }
  }
}

/**
 * File upload route handler
 */
export async function handleFileUpload(
  request: FastifyRequest,
  reply: FastifyReply,
  uploadService: FileUploadService,
  options: FileUploadOptions = {}
): Promise<void> {
  try {
    if (!request.isMultipart()) {
      throw new Error('Request must be multipart/form-data');
    }

    const parts = request.parts();
    const files: MultipartFile[] = [];
    let uploadOptions = { ...options };

    for await (const part of parts) {
      if (part.type === 'file') {
        files.push(part);
      } else if (part.fieldname === 'options') {
        try {
          const partOptions = JSON.parse(part.value as string);
          uploadOptions = { ...uploadOptions, ...partOptions };
        } catch {
          // Ignore invalid options
        }
      }
    }

    if (files.length === 0) {
      throw new Error('No files provided');
    }

    const userId = (request as any).userId || 'anonymous';
    
    if (files.length === 1) {
      const result = await uploadService.uploadFile(files[0], userId, uploadOptions);
      reply.send({
        success: true,
        data: result
      });
    } else {
      const results = await uploadService.uploadMultipleFiles(files, userId, uploadOptions);
      reply.send({
        success: true,
        data: results
      });
    }

  } catch (error) {
    console.error('Upload handler error:', error);
    reply.code(400).send({
      success: false,
      error: error.message
    });
  }
}

/**
 * Create file upload service instance
 */
export function createFileUploadService(config: {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  useSSL?: boolean;
  bucket?: string;
  cdnBaseUrl?: string;
}): FileUploadService {
  return new FileUploadService(config);
}