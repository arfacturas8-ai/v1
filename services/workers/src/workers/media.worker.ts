import { Logger } from 'pino';
import { Job } from 'bullmq';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface MediaJobData {
  type: 'image' | 'video' | 'audio';
  operation: 'resize' | 'compress' | 'convert' | 'thumbnail' | 'transcode';
  inputUrl: string;
  outputKey: string;
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    bitrate?: string;
    fps?: number;
    resolution?: string;
    duration?: number;
    thumbnailAt?: number;
  };
  metadata?: Record<string, any>;
}

export interface MediaResult {
  success: boolean;
  outputUrl?: string;
  outputKey?: string;
  originalSize?: number;
  processedSize?: number;
  compressionRatio?: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  error?: string;
  processingTime: number;
}

export class MediaWorker {
  private s3Client: S3Client;
  private bucketName: string;
  private tempDir: string;
  
  constructor(private logger: Logger) {
    this.bucketName = process.env.S3_BUCKET_NAME || 'cryb-media';
    this.tempDir = process.env.TEMP_DIR || '/tmp/cryb-media';
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || 'minioadmin123'
      },
      forcePathStyle: !!process.env.S3_ENDPOINT // Use path-style for MinIO
    });
    
    // Ensure temp directory exists
    this.ensureTempDir();
    
    this.logger.info('🎨 Media Worker initialized');
  }
  
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error);
    }
  }
  
  async processJob(job: Job<MediaJobData>): Promise<MediaResult> {
    const startTime = Date.now();
    const { type, operation, inputUrl, outputKey, options, metadata } = job.data;
    
    this.logger.info(`Processing ${type} ${operation} job: ${job.id}`, {
      inputUrl,
      outputKey,
      options
    });
    
    try {
      let result: MediaResult;
      
      switch (type) {
        case 'image':
          result = await this.processImage(job, inputUrl, outputKey, operation, options);
          break;
          
        case 'video':
          result = await this.processVideo(job, inputUrl, outputKey, operation, options);
          break;
          
        case 'audio':
          result = await this.processAudio(job, inputUrl, outputKey, operation, options);
          break;
          
        default:
          throw new Error(`Unsupported media type: ${type}`);
      }
      
      result.processingTime = Date.now() - startTime;
      
      this.logger.info(`Media processing completed: ${job.id}`, result);
      
      await job.updateProgress(100);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Media processing failed: ${job.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        inputUrl,
        outputKey
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }
  
  private async processImage(
    job: Job,
    inputUrl: string,
    outputKey: string,
    operation: string,
    options: any = {}
  ): Promise<MediaResult> {
    const tempInputPath = path.join(this.tempDir, `input_${job.id}_${Date.now()}`);
    const tempOutputPath = path.join(this.tempDir, `output_${job.id}_${Date.now()}`);
    
    try {
      // Download input file
      await this.downloadFile(inputUrl, tempInputPath);
      const inputStats = await fs.stat(tempInputPath);
      
      await job.updateProgress(25);
      
      // Process image with Sharp
      let sharpInstance = sharp(tempInputPath);
      
      // Get original metadata
      const metadata = await sharpInstance.metadata();
      const originalDimensions = {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
      
      switch (operation) {
        case 'resize':
          if (options.width || options.height) {
            sharpInstance = sharpInstance.resize(options.width, options.height, {
              fit: 'inside',
              withoutEnlargement: true
            });
          }
          break;
          
        case 'compress':
          if (options.quality) {
            sharpInstance = sharpInstance.jpeg({ quality: options.quality });
          }
          break;
          
        case 'convert':
          if (options.format) {
            switch (options.format.toLowerCase()) {
              case 'jpg':
              case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality: options.quality || 80 });
                break;
              case 'png':
                sharpInstance = sharpInstance.png();
                break;
              case 'webp':
                sharpInstance = sharpInstance.webp({ quality: options.quality || 80 });
                break;
              case 'avif':
                sharpInstance = sharpInstance.avif({ quality: options.quality || 80 });
                break;
            }
          }
          break;
          
        case 'thumbnail':
          const thumbSize = options.width || options.height || 150;
          sharpInstance = sharpInstance
            .resize(thumbSize, thumbSize, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85 });
          break;
      }
      
      await job.updateProgress(60);
      
      // Process and save
      await sharpInstance.toFile(tempOutputPath);
      
      const outputStats = await fs.stat(tempOutputPath);
      
      await job.updateProgress(80);
      
      // Upload to S3
      const outputUrl = await this.uploadFile(tempOutputPath, outputKey);
      
      // Cleanup
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      
      return {
        success: true,
        outputUrl,
        outputKey,
        originalSize: inputStats.size,
        processedSize: outputStats.size,
        compressionRatio: inputStats.size / outputStats.size,
        dimensions: originalDimensions,
        processingTime: 0 // Will be set by caller
      };
      
    } catch (error) {
      // Cleanup on error
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      throw error;
    }
  }
  
  private async processVideo(
    job: Job,
    inputUrl: string,
    outputKey: string,
    operation: string,
    options: any = {}
  ): Promise<MediaResult> {
    const tempInputPath = path.join(this.tempDir, `input_${job.id}_${Date.now()}.mp4`);
    const tempOutputPath = path.join(this.tempDir, `output_${job.id}_${Date.now()}.mp4`);
    
    try {
      // Download input file
      await this.downloadFile(inputUrl, tempInputPath);
      const inputStats = await fs.stat(tempInputPath);
      
      await job.updateProgress(20);
      
      // Process video with FFmpeg
      await new Promise<void>((resolve, reject) => {
        let ffmpegCommand = ffmpeg(tempInputPath)
          .on('progress', (progress) => {
            const percent = Math.min(20 + (progress.percent || 0) * 0.6, 80);
            job.updateProgress(percent).catch(() => {});
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
          
        switch (operation) {
          case 'compress':
            ffmpegCommand = ffmpegCommand
              .videoCodec('libx264')
              .audioCodec('aac')
              .videoBitrate(options.bitrate || '1000k')
              .audioBitrate('128k')
              .format('mp4');
            break;
            
          case 'thumbnail':
            const thumbnailTime = options.thumbnailAt || 1; // 1 second
            ffmpegCommand = ffmpegCommand
              .seekInput(thumbnailTime)
              .frames(1)
              .format('image2');
            break;
            
          case 'transcode':
            ffmpegCommand = ffmpegCommand
              .videoCodec('libx264')
              .audioCodec('aac')
              .format(options.format || 'mp4');
              
            if (options.resolution) {
              ffmpegCommand = ffmpegCommand.size(options.resolution);
            }
            
            if (options.fps) {
              ffmpegCommand = ffmpegCommand.fps(options.fps);
            }
            break;
            
          case 'convert':
            ffmpegCommand = ffmpegCommand.format(options.format || 'mp4');
            break;
        }
        
        ffmpegCommand.save(tempOutputPath);
      });
      
      const outputStats = await fs.stat(tempOutputPath);
      
      await job.updateProgress(90);
      
      // Upload to S3
      const outputUrl = await this.uploadFile(tempOutputPath, outputKey);
      
      // Cleanup
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      
      return {
        success: true,
        outputUrl,
        outputKey,
        originalSize: inputStats.size,
        processedSize: outputStats.size,
        compressionRatio: inputStats.size / outputStats.size,
        processingTime: 0 // Will be set by caller
      };
      
    } catch (error) {
      // Cleanup on error
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      throw error;
    }
  }
  
  private async processAudio(
    job: Job,
    inputUrl: string,
    outputKey: string,
    operation: string,
    options: any = {}
  ): Promise<MediaResult> {
    const tempInputPath = path.join(this.tempDir, `input_${job.id}_${Date.now()}.mp3`);
    const tempOutputPath = path.join(this.tempDir, `output_${job.id}_${Date.now()}.mp3`);
    
    try {
      // Download input file
      await this.downloadFile(inputUrl, tempInputPath);
      const inputStats = await fs.stat(tempInputPath);
      
      await job.updateProgress(25);
      
      // Process audio with FFmpeg
      await new Promise<void>((resolve, reject) => {
        let ffmpegCommand = ffmpeg(tempInputPath)
          .on('progress', (progress) => {
            const percent = Math.min(25 + (progress.percent || 0) * 0.5, 75);
            job.updateProgress(percent).catch(() => {});
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
          
        switch (operation) {
          case 'compress':
            ffmpegCommand = ffmpegCommand
              .audioCodec('mp3')
              .audioBitrate(options.bitrate || '128k');
            break;
            
          case 'convert':
            ffmpegCommand = ffmpegCommand
              .format(options.format || 'mp3');
            break;
        }
        
        ffmpegCommand.save(tempOutputPath);
      });
      
      const outputStats = await fs.stat(tempOutputPath);
      
      await job.updateProgress(90);
      
      // Upload to S3
      const outputUrl = await this.uploadFile(tempOutputPath, outputKey);
      
      // Cleanup
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      
      return {
        success: true,
        outputUrl,
        outputKey,
        originalSize: inputStats.size,
        processedSize: outputStats.size,
        compressionRatio: inputStats.size / outputStats.size,
        processingTime: 0 // Will be set by caller
      };
      
    } catch (error) {
      // Cleanup on error
      await Promise.all([
        fs.unlink(tempInputPath).catch(() => {}),
        fs.unlink(tempOutputPath).catch(() => {})
      ]);
      throw error;
    }
  }
  
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    if (url.startsWith('http')) {
      // Download from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
    } else {
      // Assume S3 key
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: url
      });
      
      const response = await this.s3Client.send(command);
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const reader = (response.Body as any).getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(outputPath, buffer);
      }
    }
  }
  
  private async uploadFile(filePath: string, key: string): Promise<string> {
    const fileContent = await fs.readFile(filePath);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: this.getContentType(key)
    });
    
    await this.s3Client.send(command);
    
    // Return the URL (adjust based on your S3/MinIO setup)
    return `${process.env.CDN_BASE_URL || `http://localhost:9000/${this.bucketName}`}/${key}`;
  }
  
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
}