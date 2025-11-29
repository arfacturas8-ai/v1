import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import { pipeline } from 'stream/promises';

export interface LocalFileUploadOptions {
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

export interface LocalUploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  bucket: string;
  hash: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface LocalFileProcessingResult {
  original: LocalUploadedFile;
  thumbnail?: LocalUploadedFile;
  variants?: LocalUploadedFile[];
  scanResult?: {
    clean: boolean;
    threats?: string[];
  };
}

/**
 * Local File Storage Service
 * 
 * A fallback storage solution that stores files locally in /var/www/uploads
 * when MinIO or other cloud storage services are not available.
 */
export class LocalFileStorageService {
  private baseStoragePath: string;
  private baseUrl: string;
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
    baseStoragePath?: string;
    baseUrl?: string;
  } = {}) {
    this.baseStoragePath = config.baseStoragePath || '/var/www/uploads';
    this.baseUrl = config.baseUrl || `http://localhost:3002/api/v1/uploads/serve`;
    
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    const buckets = [
      'uploads',
      'avatars',
      'attachments',
      'media',
      'thumbnails',
      'temp'
    ];

    for (const bucket of buckets) {
      try {
        const bucketPath = path.join(this.baseStoragePath, bucket);
        await fs.mkdir(bucketPath, { recursive: true });
        console.log(`✅ Created local storage bucket: ${bucket}`);
      } catch (error) {
        console.error(`❌ Failed to initialize bucket ${bucket}:`, error);
      }
    }
  }

  /**
   * Upload a single file to local storage
   */
  async uploadFile(
    file: MultipartFile,
    userId: string,
    options: LocalFileUploadOptions = {}
  ): Promise<LocalFileProcessingResult> {
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
        userAgent: 'local-storage-service'
      };

      // Image processing
      if (this.isImage(file.mimetype)) {
        const imageInfo = await this.processImage(buffer, options);
        processedBuffer = imageInfo.buffer;
        metadata = { ...metadata, ...imageInfo.metadata };
      }

      // Create user-specific directory
      const userDir = path.join(this.baseStoragePath, bucket, userId);
      await fs.mkdir(userDir, { recursive: true });

      // Save main file
      const filePath = path.join(userDir, filename);
      await fs.writeFile(filePath, processedBuffer);

      const originalFile: LocalUploadedFile = {
        id: fileId,
        originalName: file.filename,
        filename,
        mimeType: file.mimetype,
        size: processedBuffer.length,
        url: `${this.baseUrl}/${bucket}/${userId}/${filename}`,
        path: filePath,
        bucket,
        hash,
        metadata,
        uploadedAt: new Date(),
        uploadedBy: userId
      };

      const result: LocalFileProcessingResult = { original: originalFile };

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

      // Store file metadata in a simple JSON file (you could use database instead)
      await this.storeFileMetadata(originalFile);

      return result;

    } catch (error) {
      console.error('Local file upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: MultipartFile[],
    userId: string,
    options: LocalFileUploadOptions = {}
  ): Promise<LocalFileProcessingResult[]> {
    const results: LocalFileProcessingResult[] = [];
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
   * Delete a file
   */
  async deleteFile(bucket: string, userId: string, filename: string): Promise<void> {
    try {
      const filePath = path.join(this.baseStoragePath, bucket, userId, filename);
      
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
      
      // Also try to delete thumbnail if it exists
      if (bucket !== 'thumbnails') {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(this.baseStoragePath, 'thumbnails', userId, thumbnailFilename);
        
        if (existsSync(thumbnailPath)) {
          await fs.unlink(thumbnailPath);
        }
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(bucket: string, userId: string, filename: string): Promise<any> {
    try {
      const filePath = path.join(this.baseStoragePath, bucket, userId, filename);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        path: filePath
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
    try {
      const bucketPath = path.join(this.baseStoragePath, bucket);
      
      if (!existsSync(bucketPath)) {
        return [];
      }

      const files: any[] = [];
      const entries = await fs.readdir(bucketPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Look in user directories
          const userDir = path.join(bucketPath, entry.name);
          const userFiles = await fs.readdir(userDir);
          
          for (const userFile of userFiles) {
            if (!prefix || userFile.startsWith(prefix)) {
              const filePath = path.join(userDir, userFile);
              const stats = await fs.stat(filePath);
              
              files.push({
                name: userFile,
                size: stats.size,
                lastModified: stats.mtime,
                userId: entry.name,
                path: filePath
              });
              
              if (files.length >= limit) {
                return files;
              }
            }
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Stream file content
   */
  getFileStream(bucket: string, userId: string, filename: string): NodeJS.ReadableStream {
    const filePath = path.join(this.baseStoragePath, bucket, userId, filename);
    
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }
    
    return createReadStream(filePath);
  }

  /**
   * Cleanup old temporary files
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const tempDir = path.join(this.baseStoragePath, 'temp');
    
    if (!existsSync(tempDir)) {
      return;
    }

    try {
      const entries = await fs.readdir(tempDir, { withFileTypes: true });
      let cleanedCount = 0;
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const userDir = path.join(tempDir, entry.name);
          const userFiles = await fs.readdir(userDir);
          
          for (const file of userFiles) {
            const filePath = path.join(userDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffTime) {
              await fs.unlink(filePath);
              cleanedCount++;
            }
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async validateFile(file: MultipartFile, options: LocalFileUploadOptions): Promise<void> {
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
      return 'media';
    } else if (this.allowedTypes.videos.includes(mimeType)) {
      return 'media';
    } else if (this.allowedTypes.audio.includes(mimeType)) {
      return 'media';
    } else if (this.allowedTypes.documents.includes(mimeType)) {
      return 'attachments';
    } else {
      return 'uploads';
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
    options: LocalFileUploadOptions
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
  ): Promise<LocalUploadedFile> {
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFilename = `thumb_${fileId}.jpg`;
    
    // Create thumbnails directory for user
    const thumbnailDir = path.join(this.baseStoragePath, 'thumbnails', userId);
    await fs.mkdir(thumbnailDir, { recursive: true });
    
    // Save thumbnail
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    await fs.writeFile(thumbnailPath, thumbnailBuffer);

    return {
      id: `${fileId}_thumb`,
      originalName: `thumbnail_${fileId}`,
      filename: thumbnailFilename,
      mimeType: 'image/jpeg',
      size: thumbnailBuffer.length,
      url: `${this.baseUrl}/thumbnails/${userId}/${thumbnailFilename}`,
      path: thumbnailPath,
      bucket: 'thumbnails',
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

  private async findDuplicateFile(hash: string): Promise<LocalUploadedFile | null> {
    // This would check your database for existing files with the same hash
    // Return null for now as placeholder
    return null;
  }

  private async storeFileMetadata(file: LocalUploadedFile): Promise<void> {
    // Store file metadata in a simple JSON file (you could use database instead)
    try {
      const metadataDir = path.join(this.baseStoragePath, '.metadata');
      await fs.mkdir(metadataDir, { recursive: true });
      
      const metadataFile = path.join(metadataDir, `${file.id}.json`);
      await fs.writeFile(metadataFile, JSON.stringify(file, null, 2));
      
      console.log(`📁 Stored metadata for file: ${file.filename}`);
    } catch (error) {
      console.error('Failed to store file metadata:', error);
    }
  }
}

/**
 * Local file upload route handler
 */
export async function handleLocalFileUpload(
  request: FastifyRequest,
  reply: FastifyReply,
  uploadService: LocalFileStorageService,
  options: LocalFileUploadOptions = {}
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
    console.error('Local upload handler error:', error);
    reply.code(400).send({
      success: false,
      error: error.message
    });
  }
}

/**
 * Create local file storage service instance
 */
export function createLocalFileStorageService(config: {
  baseStoragePath?: string;
  baseUrl?: string;
} = {}): LocalFileStorageService {
  return new LocalFileStorageService(config);
}