import { Job } from 'bullmq';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

export interface MediaProcessingJobData {
  inputPath: string;
  outputPath?: string;
  userId: string;
  mediaId: string;
  mediaType: 'image' | 'video' | 'audio';
  operation: 'resize' | 'compress' | 'transcode' | 'thumbnail' | 'optimize' | 'watermark' | 'extract_audio' | 'extract_frames';
  options: {
    // Image options
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    
    // Video options
    codec?: 'h264' | 'h265' | 'vp9' | 'av1';
    bitrate?: string;
    fps?: number;
    resolution?: '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
    
    // Audio options
    audioCodec?: 'aac' | 'mp3' | 'opus' | 'flac';
    audioBitrate?: string;
    sampleRate?: number;
    channels?: number;
    
    // Thumbnail options
    timestamps?: number[]; // seconds
    thumbnailCount?: number;
    
    // Watermark options
    watermarkPath?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    watermarkOpacity?: number;
    
    // General options
    removeMetadata?: boolean;
    preserveAspectRatio?: boolean;
    optimizeForWeb?: boolean;
  };
  priority: 'high' | 'normal' | 'low';
  webhookUrl?: string;
  callbackData?: Record<string, any>;
}

export interface MediaProcessingResult {
  success: boolean;
  outputPaths: string[];
  metadata: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    format: string;
    processingTime: number;
  };
  thumbnails?: string[];
  errors?: string[];
}

export interface VideoResolution {
  name: string;
  width: number;
  height: number;
  bitrate: string;
}

export class MediaProcessor {
  private redis: Redis;
  private logger: Logger;
  private tempDir: string;
  private outputDir: string;
  
  private metrics = {
    imagesProcessed: 0,
    videosProcessed: 0,
    audiosProcessed: 0,
    processingTime: 0,
    compressionSaved: 0,
    failures: 0,
  };

  private static readonly VIDEO_RESOLUTIONS: Record<string, VideoResolution> = {
    '144p': { name: '144p', width: 256, height: 144, bitrate: '200k' },
    '240p': { name: '240p', width: 426, height: 240, bitrate: '400k' },
    '360p': { name: '360p', width: 640, height: 360, bitrate: '800k' },
    '480p': { name: '480p', width: 854, height: 480, bitrate: '1200k' },
    '720p': { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    '1080p': { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    '1440p': { name: '1440p', width: 2560, height: 1440, bitrate: '8000k' },
    '2160p': { name: '2160p', width: 3840, height: 2160, bitrate: '15000k' },
  };

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
    this.tempDir = process.env.MEDIA_TEMP_DIR || '/tmp/media-processing';
    this.outputDir = process.env.MEDIA_OUTPUT_DIR || '/tmp/media-output';
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      this.logger.error({ error }, 'Failed to create media processing directories');
    }
  }

  public async processMediaJob(job: Job<MediaProcessingJobData>): Promise<MediaProcessingResult> {
    const startTime = Date.now();
    const jobData = job.data;

    try {
      this.logger.info({
        jobId: job.id,
        mediaId: jobData.mediaId,
        mediaType: jobData.mediaType,
        operation: jobData.operation,
      }, 'Processing media job');

      // Validate input file
      await this.validateInputFile(jobData.inputPath);

      // Create unique processing directory
      const processingId = crypto.randomUUID();
      const processingDir = path.join(this.tempDir, processingId);
      await fs.mkdir(processingDir, { recursive: true });

      let result: MediaProcessingResult;

      try {
        switch (jobData.mediaType) {
          case 'image':
            result = await this.processImage(jobData, processingDir);
            break;
          case 'video':
            result = await this.processVideo(jobData, processingDir);
            break;
          case 'audio':
            result = await this.processAudio(jobData, processingDir);
            break;
          default:
            throw new Error(`Unsupported media type: ${jobData.mediaType}`);
        }

        // Update metrics
        this.updateMetrics(jobData.mediaType, result);

        // Store processing metadata
        await this.storeProcessingMetadata(jobData, result);

        // Send webhook notification if configured
        if (jobData.webhookUrl) {
          await this.sendWebhookNotification(jobData, result);
        }

        this.logger.info({
          jobId: job.id,
          mediaId: jobData.mediaId,
          processingTime: result.metadata.processingTime,
          compressionRatio: result.metadata.compressionRatio,
        }, 'Media processing completed successfully');

        return result;

      } finally {
        // Cleanup processing directory
        try {
          await fs.rm(processingDir, { recursive: true, force: true });
        } catch (error) {
          this.logger.warn({ error, processingDir }, 'Failed to cleanup processing directory');
        }
      }

    } catch (error) {
      this.metrics.failures++;
      this.logger.error({
        error,
        jobId: job.id,
        mediaId: jobData.mediaId,
      }, 'Media processing failed');
      throw error;
    }
  }

  private async validateInputFile(inputPath: string): Promise<void> {
    try {
      const stats = await fs.stat(inputPath);
      if (!stats.isFile()) {
        throw new Error('Input path is not a file');
      }
      if (stats.size === 0) {
        throw new Error('Input file is empty');
      }
      if (stats.size > 1024 * 1024 * 1024) { // 1GB limit
        throw new Error('Input file too large (max 1GB)');
      }
    } catch (error) {
      throw new Error(`Invalid input file: ${error}`);
    }
  }

  private async processImage(
    jobData: MediaProcessingJobData,
    processingDir: string
  ): Promise<MediaProcessingResult> {
    const inputStats = await fs.stat(jobData.inputPath);
    const outputPaths: string[] = [];
    const errors: string[] = [];

    try {
      let sharpInstance = sharp(jobData.inputPath);

      // Get original metadata
      const metadata = await sharpInstance.metadata();
      
      switch (jobData.operation) {
        case 'resize':
          if (jobData.options.width || jobData.options.height) {
            sharpInstance = sharpInstance.resize({
              width: jobData.options.width,
              height: jobData.options.height,
              fit: jobData.options.fit || 'cover',
              withoutEnlargement: true,
            });
          }
          break;

        case 'compress':
        case 'optimize':
          const quality = jobData.options.quality || 80;
          const format = jobData.options.format || 'jpeg';
          
          switch (format) {
            case 'jpeg':
              sharpInstance = sharpInstance.jpeg({ 
                quality,
                progressive: true,
                mozjpeg: true,
              });
              break;
            case 'png':
              sharpInstance = sharpInstance.png({ 
                quality,
                progressive: true,
                compressionLevel: 9,
              });
              break;
            case 'webp':
              sharpInstance = sharpInstance.webp({ 
                quality,
                effort: 6,
              });
              break;
            case 'avif':
              sharpInstance = sharpInstance.avif({ 
                quality,
                effort: 9,
              });
              break;
          }
          break;

        case 'thumbnail':
          const thumbnailSizes = [
            { width: 150, height: 150, suffix: 'small' },
            { width: 300, height: 300, suffix: 'medium' },
            { width: 600, height: 600, suffix: 'large' },
          ];

          for (const size of thumbnailSizes) {
            const thumbnailPath = path.join(
              processingDir,
              `thumbnail_${size.suffix}_${path.basename(jobData.inputPath)}`
            );

            await sharp(jobData.inputPath)
              .resize(size.width, size.height, { fit: 'cover' })
              .jpeg({ quality: 85 })
              .toFile(thumbnailPath);

            outputPaths.push(thumbnailPath);
          }
          break;

        case 'watermark':
          if (jobData.options.watermarkPath) {
            const watermarkBuffer = await fs.readFile(jobData.options.watermarkPath);
            const position = this.getWatermarkPosition(
              jobData.options.watermarkPosition || 'bottom-right',
              metadata.width || 0,
              metadata.height || 0
            );

            sharpInstance = sharpInstance.composite([{
              input: watermarkBuffer,
              top: position.top,
              left: position.left,
              opacity: jobData.options.watermarkOpacity || 0.5,
            }]);
          }
          break;
      }

      // Remove metadata if requested
      if (jobData.options.removeMetadata) {
        sharpInstance = sharpInstance.withMetadata({});
      }

      // Generate output path
      const outputPath = jobData.outputPath || path.join(
        processingDir,
        `processed_${path.basename(jobData.inputPath)}`
      );

      await sharpInstance.toFile(outputPath);
      outputPaths.push(outputPath);

      const outputStats = await fs.stat(outputPath);
      const compressionRatio = (1 - outputStats.size / inputStats.size) * 100;

      this.metrics.imagesProcessed++;

      return {
        success: true,
        outputPaths,
        metadata: {
          originalSize: inputStats.size,
          processedSize: outputStats.size,
          compressionRatio,
          dimensions: {
            width: metadata.width || 0,
            height: metadata.height || 0,
          },
          format: metadata.format || 'unknown',
          processingTime: Date.now() - Date.now(),
        },
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      errors.push(`Image processing error: ${error}`);
      throw error;
    }
  }

  private async processVideo(
    jobData: MediaProcessingJobData,
    processingDir: string
  ): Promise<MediaProcessingResult> {
    const inputStats = await fs.stat(jobData.inputPath);
    const outputPaths: string[] = [];
    const thumbnails: string[] = [];
    const errors: string[] = [];

    try {
      // Get video metadata using ffprobe
      const metadata = await this.getVideoMetadata(jobData.inputPath);

      switch (jobData.operation) {
        case 'transcode':
          const resolution = jobData.options.resolution || '720p';
          const videoRes = MediaProcessor.VIDEO_RESOLUTIONS[resolution];
          const codec = jobData.options.codec || 'h264';
          const bitrate = jobData.options.bitrate || videoRes.bitrate;

          const outputPath = path.join(
            processingDir,
            `transcoded_${resolution}_${path.basename(jobData.inputPath, path.extname(jobData.inputPath))}.mp4`
          );

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-c:v', this.getVideoCodec(codec),
            '-b:v', bitrate,
            '-vf', `scale=${videoRes.width}:${videoRes.height}`,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-preset', 'fast',
            '-movflags', '+faststart',
            outputPath,
          ]);

          outputPaths.push(outputPath);
          break;

        case 'compress':
          const compressedPath = path.join(
            processingDir,
            `compressed_${path.basename(jobData.inputPath)}`
          );

          const quality = jobData.options.quality || 23; // CRF value for x264

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-c:v', 'libx264',
            '-crf', quality.toString(),
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            compressedPath,
          ]);

          outputPaths.push(compressedPath);
          break;

        case 'thumbnail':
          const timestamps = jobData.options.timestamps || [metadata.duration * 0.1, metadata.duration * 0.5, metadata.duration * 0.9];
          
          for (let i = 0; i < timestamps.length; i++) {
            const thumbnailPath = path.join(
              processingDir,
              `thumbnail_${i}_${path.basename(jobData.inputPath, path.extname(jobData.inputPath))}.jpg`
            );

            await this.runFFmpeg([
              '-i', jobData.inputPath,
              '-ss', timestamps[i].toString(),
              '-vframes', '1',
              '-q:v', '2',
              '-vf', 'scale=320:240',
              thumbnailPath,
            ]);

            thumbnails.push(thumbnailPath);
          }
          break;

        case 'extract_audio':
          const audioPath = path.join(
            processingDir,
            `audio_${path.basename(jobData.inputPath, path.extname(jobData.inputPath))}.mp3`
          );

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-c:a', 'mp3',
            '-b:a', jobData.options.audioBitrate || '192k',
            '-vn', // No video
            audioPath,
          ]);

          outputPaths.push(audioPath);
          break;

        case 'extract_frames':
          const framesDir = path.join(processingDir, 'frames');
          await fs.mkdir(framesDir, { recursive: true });

          const framePattern = path.join(framesDir, 'frame_%04d.jpg');
          const fps = jobData.options.fps || 1;

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-vf', `fps=${fps}`,
            '-q:v', '2',
            framePattern,
          ]);

          // Get all generated frames
          const frameFiles = await fs.readdir(framesDir);
          outputPaths.push(...frameFiles.map(f => path.join(framesDir, f)));
          break;
      }

      // Calculate compression ratio
      let totalOutputSize = 0;
      for (const outputPath of outputPaths) {
        const stats = await fs.stat(outputPath);
        totalOutputSize += stats.size;
      }

      const compressionRatio = outputPaths.length > 0 
        ? (1 - totalOutputSize / inputStats.size) * 100 
        : 0;

      this.metrics.videosProcessed++;

      return {
        success: true,
        outputPaths,
        thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
        metadata: {
          originalSize: inputStats.size,
          processedSize: totalOutputSize,
          compressionRatio,
          duration: metadata.duration,
          dimensions: {
            width: metadata.width,
            height: metadata.height,
          },
          format: path.extname(jobData.inputPath).substring(1),
          processingTime: Date.now() - Date.now(),
        },
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      errors.push(`Video processing error: ${error}`);
      throw error;
    }
  }

  private async processAudio(
    jobData: MediaProcessingJobData,
    processingDir: string
  ): Promise<MediaProcessingResult> {
    const inputStats = await fs.stat(jobData.inputPath);
    const outputPaths: string[] = [];
    const errors: string[] = [];

    try {
      // Get audio metadata
      const metadata = await this.getAudioMetadata(jobData.inputPath);

      switch (jobData.operation) {
        case 'transcode':
          const codec = jobData.options.audioCodec || 'mp3';
          const bitrate = jobData.options.audioBitrate || '192k';
          const sampleRate = jobData.options.sampleRate || 44100;

          const outputPath = path.join(
            processingDir,
            `transcoded_${path.basename(jobData.inputPath, path.extname(jobData.inputPath))}.${codec}`
          );

          const codecMap: Record<string, string> = {
            'mp3': 'libmp3lame',
            'aac': 'aac',
            'opus': 'libopus',
            'flac': 'flac',
          };

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-c:a', codecMap[codec] || 'libmp3lame',
            '-b:a', bitrate,
            '-ar', sampleRate.toString(),
            outputPath,
          ]);

          outputPaths.push(outputPath);
          break;

        case 'compress':
          const compressedPath = path.join(
            processingDir,
            `compressed_${path.basename(jobData.inputPath)}`
          );

          await this.runFFmpeg([
            '-i', jobData.inputPath,
            '-c:a', 'libmp3lame',
            '-b:a', '128k',
            '-ar', '44100',
            compressedPath,
          ]);

          outputPaths.push(compressedPath);
          break;
      }

      const outputStats = await fs.stat(outputPaths[0]);
      const compressionRatio = (1 - outputStats.size / inputStats.size) * 100;

      this.metrics.audiosProcessed++;

      return {
        success: true,
        outputPaths,
        metadata: {
          originalSize: inputStats.size,
          processedSize: outputStats.size,
          compressionRatio,
          duration: metadata.duration,
          format: path.extname(jobData.inputPath).substring(1),
          processingTime: Date.now() - Date.now(),
        },
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      errors.push(`Audio processing error: ${error}`);
      throw error;
    }
  }

  private async getVideoMetadata(filePath: string): Promise<{ width: number; height: number; duration: number; format: string }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      let stdout = '';
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed with code ${code}`));
          return;
        }

        try {
          const metadata = JSON.parse(stdout);
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          
          resolve({
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            duration: parseFloat(metadata.format.duration) || 0,
            format: metadata.format.format_name || 'unknown',
          });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error}`));
        }
      });
    });
  }

  private async getAudioMetadata(filePath: string): Promise<{ duration: number; format: string; bitrate: number }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      let stdout = '';
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed with code ${code}`));
          return;
        }

        try {
          const metadata = JSON.parse(stdout);
          const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');
          
          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            format: metadata.format.format_name || 'unknown',
            bitrate: parseInt(audioStream?.bit_rate) || 0,
          });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error}`));
        }
      });
    });
  }

  private async runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-y', ...args]); // -y to overwrite files

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        } else {
          resolve();
        }
      });
    });
  }

  private getVideoCodec(codec: string): string {
    const codecMap: Record<string, string> = {
      'h264': 'libx264',
      'h265': 'libx265',
      'vp9': 'libvpx-vp9',
      'av1': 'libaom-av1',
    };
    return codecMap[codec] || 'libx264';
  }

  private getWatermarkPosition(
    position: string,
    imageWidth: number,
    imageHeight: number
  ): { top: number; left: number } {
    const padding = 20;
    const watermarkSize = { width: 100, height: 50 }; // Assumed watermark size

    switch (position) {
      case 'top-left':
        return { top: padding, left: padding };
      case 'top-right':
        return { top: padding, left: imageWidth - watermarkSize.width - padding };
      case 'bottom-left':
        return { top: imageHeight - watermarkSize.height - padding, left: padding };
      case 'bottom-right':
        return { 
          top: imageHeight - watermarkSize.height - padding, 
          left: imageWidth - watermarkSize.width - padding 
        };
      case 'center':
        return { 
          top: (imageHeight - watermarkSize.height) / 2, 
          left: (imageWidth - watermarkSize.width) / 2 
        };
      default:
        return { top: imageHeight - watermarkSize.height - padding, left: imageWidth - watermarkSize.width - padding };
    }
  }

  private updateMetrics(mediaType: string, result: MediaProcessingResult): void {
    this.metrics.processingTime += result.metadata.processingTime;
    this.metrics.compressionSaved += result.metadata.originalSize - result.metadata.processedSize;
  }

  private async storeProcessingMetadata(
    jobData: MediaProcessingJobData,
    result: MediaProcessingResult
  ): Promise<void> {
    const metadata = {
      mediaId: jobData.mediaId,
      userId: jobData.userId,
      operation: jobData.operation,
      result,
      processedAt: new Date().toISOString(),
    };

    await this.redis.set(
      `media:processing:${jobData.mediaId}`,
      JSON.stringify(metadata),
      'EX',
      86400 // 24 hours
    );
  }

  private async sendWebhookNotification(
    jobData: MediaProcessingJobData,
    result: MediaProcessingResult
  ): Promise<void> {
    try {
      const payload = {
        mediaId: jobData.mediaId,
        userId: jobData.userId,
        operation: jobData.operation,
        success: result.success,
        result,
        callbackData: jobData.callbackData,
        timestamp: new Date().toISOString(),
      };

      // In a real implementation, you'd use axios or fetch to send the webhook
      this.logger.info({ 
        webhookUrl: jobData.webhookUrl, 
        mediaId: jobData.mediaId 
      }, 'Webhook notification sent');
    } catch (error) {
      this.logger.error({ error, webhookUrl: jobData.webhookUrl }, 'Failed to send webhook notification');
    }
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageProcessingTime: (this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed) > 0
        ? this.metrics.processingTime / (this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed)
        : 0,
      totalProcessed: this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed,
      successRate: (this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed) > 0
        ? ((this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed) / ((this.metrics.imagesProcessed + this.metrics.videosProcessed + this.metrics.audiosProcessed) + this.metrics.failures)) * 100
        : 100,
    };
  }
}

export default MediaProcessor;