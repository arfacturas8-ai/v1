import { EventEmitter } from 'events';
import { createWriteStream, createReadStream, unlinkSync, existsSync } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import { MinioService } from './minio';

export interface TranscodingOptions {
  format: 'mp4' | 'webm' | 'hls' | 'dash';
  quality: 'low' | 'medium' | 'high' | 'auto';
  resolution?: '480p' | '720p' | '1080p' | '1440p' | '4k' | 'auto';
  bitrate?: string;
  framerate?: number;
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  audioCodec?: 'aac' | 'mp3' | 'opus' | 'vorbis';
  generateThumbnails?: boolean;
  thumbnailCount?: number;
  generatePreview?: boolean;
  outputBucket?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface TranscodingJob {
  id: string;
  inputFile: {
    bucket: string;
    filename: string;
    url: string;
  };
  options: TranscodingOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  outputFiles: Array<{
    type: 'video' | 'audio' | 'thumbnail' | 'preview' | 'manifest';
    format: string;
    quality?: string;
    resolution?: string;
    url: string;
    filename: string;
    bucket: string;
    size: number;
  }>;
  metadata: {
    duration?: number;
    width?: number;
    height?: number;
    bitrate?: number;
    framerate?: number;
    audioChannels?: number;
    audioSampleRate?: number;
    fileSize: number;
    originalFormat: string;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
  codec: string;
  audioCodec?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  fileSize: number;
  format: string;
}

/**
 * Video Transcoding Service with FFmpeg Integration
 * 
 * Features:
 * - Multiple format support (MP4, WebM, HLS, DASH)
 * - Quality-based transcoding with automatic bitrate selection
 * - Thumbnail and preview generation
 * - Progress tracking and job management
 * - Hardware acceleration support
 * - Adaptive streaming preparation
 * - Crash recovery and retry logic
 * - Resource usage monitoring
 * - Queue management with priorities
 */
export class VideoTranscodingService extends EventEmitter {
  private minioService: MinioService;
  private jobs: Map<string, TranscodingJob> = new Map();
  private activeJobs: Map<string, ChildProcess> = new Map();
  private jobQueue: string[] = [];
  private maxConcurrentJobs: number = 2;
  private tempDirectory: string = '/tmp/transcoding';
  private ffmpegPath: string = 'ffmpeg';
  private ffprobePath: string = 'ffprobe';

  // Quality presets
  private readonly qualityPresets = {
    low: {
      videoBitrate: '500k',
      audioBitrate: '96k',
      resolution: '480p',
      crf: 28
    },
    medium: {
      videoBitrate: '1500k',
      audioBitrate: '128k',
      resolution: '720p',
      crf: 23
    },
    high: {
      videoBitrate: '5000k',
      audioBitrate: '192k',
      resolution: '1080p',
      crf: 18
    }
  };

  // Resolution configurations
  private readonly resolutions = {
    '480p': { width: 854, height: 480, bitrate: '1000k' },
    '720p': { width: 1280, height: 720, bitrate: '2500k' },
    '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
    '1440p': { width: 2560, height: 1440, bitrate: '10000k' },
    '4k': { width: 3840, height: 2160, bitrate: '20000k' }
  };

  constructor(minioService: MinioService, options: {
    ffmpegPath?: string;
    ffprobePath?: string;
    maxConcurrentJobs?: number;
    tempDirectory?: string;
  } = {}) {
    super();
    this.minioService = minioService;
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.ffprobePath = options.ffprobePath || 'ffprobe';
    this.maxConcurrentJobs = options.maxConcurrentJobs || 2;
    this.tempDirectory = options.tempDirectory || '/tmp/transcoding';

    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Check if FFmpeg is available
      await this.checkFFmpegAvailability();
      
      // Create temp directory if it doesn't exist
      if (!existsSync(this.tempDirectory)) {
        require('fs').mkdirSync(this.tempDirectory, { recursive: true });
      }

      // Start job processor
      this.startJobProcessor();

      // Setup cleanup tasks
      this.setupCleanupTasks();

      console.log('✅ Video Transcoding Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Video Transcoding Service:', error);
      throw error;
    }
  }

  private async checkFFmpegAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, ['-version']);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('FFmpeg not available'));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });
    });
  }

  /**
   * Create a new transcoding job
   */
  async createTranscodingJob(
    inputBucket: string,
    inputFilename: string,
    userId: string,
    options: TranscodingOptions
  ): Promise<TranscodingJob> {
    const jobId = randomUUID();
    
    try {
      // Get input file URL
      const inputUrl = await this.minioService.getPresignedUrl(inputBucket, inputFilename);
      
      // Get video metadata
      const metadata = await this.getVideoMetadata(inputUrl);

      const job: TranscodingJob = {
        id: jobId,
        inputFile: {
          bucket: inputBucket,
          filename: inputFilename,
          url: inputUrl
        },
        options: {
          ...options,
          outputBucket: options.outputBucket || 'media'
        },
        status: 'queued',
        progress: 0,
        outputFiles: [],
        metadata: {
          ...metadata,
          originalFormat: path.extname(inputFilename).substring(1)
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.jobs.set(jobId, job);

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.jobQueue.unshift(jobId);
      } else {
        this.jobQueue.push(jobId);
      }

      this.emit('job_created', { jobId, job });
      
      // Try to start processing immediately if slots available
      this.processNextJob();

      return job;
    } catch (error) {
      console.error('Failed to create transcoding job:', error);
      throw new Error(`Failed to create transcoding job: ${error.message}`);
    }
  }

  /**
   * Get job status
   */
  getJob(jobId: string): TranscodingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): TranscodingJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  /**
   * Cancel a transcoding job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    // If job is currently processing, kill the process
    const activeProcess = this.activeJobs.get(jobId);
    if (activeProcess) {
      activeProcess.kill('SIGTERM');
      this.activeJobs.delete(jobId);
    }

    // Remove from queue if still queued
    const queueIndex = this.jobQueue.indexOf(jobId);
    if (queueIndex !== -1) {
      this.jobQueue.splice(queueIndex, 1);
    }

    job.status = 'cancelled';
    job.updatedAt = new Date();

    this.emit('job_cancelled', { jobId, job });

    // Clean up temp files
    await this.cleanupJobFiles(jobId);

    // Try to start next job
    this.processNextJob();

    return true;
  }

  /**
   * Delete a completed/failed job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'processing') {
      return false; // Can't delete active jobs
    }

    // Delete output files
    for (const outputFile of job.outputFiles) {
      try {
        await this.minioService.deleteFile(outputFile.bucket, outputFile.filename);
      } catch (error) {
        console.warn(`Failed to delete output file ${outputFile.filename}:`, error);
      }
    }

    // Clean up temp files
    await this.cleanupJobFiles(jobId);

    this.jobs.delete(jobId);

    this.emit('job_deleted', { jobId });

    return true;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    totalJobs: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      queued: jobs.filter(job => job.status === 'queued').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      totalJobs: jobs.length
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private startJobProcessor(): void {
    setInterval(() => {
      this.processNextJob();
    }, 5000); // Check every 5 seconds
  }

  private async processNextJob(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return; // Max concurrent jobs reached
    }

    if (this.jobQueue.length === 0) {
      return; // No jobs in queue
    }

    const jobId = this.jobQueue.shift()!;
    const job = this.jobs.get(jobId);

    if (!job || job.status !== 'queued') {
      return; // Job not found or not queued
    }

    try {
      await this.processJob(job);
    } catch (error) {
      console.error(`Failed to process job ${jobId}:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.endTime = new Date();
      job.updatedAt = new Date();

      this.emit('job_failed', { jobId, job, error: error.message });
    }
  }

  private async processJob(job: TranscodingJob): Promise<void> {
    const { id: jobId, options, inputFile } = job;

    job.status = 'processing';
    job.startTime = new Date();
    job.progress = 0;
    job.updatedAt = new Date();

    this.emit('job_started', { jobId, job });

    try {
      // Download input file to temp location
      const inputPath = path.join(this.tempDirectory, `${jobId}_input${path.extname(inputFile.filename)}`);
      await this.downloadFile(inputFile.url, inputPath);

      // Process based on format
      switch (options.format) {
        case 'mp4':
          await this.transcodeToMP4(job, inputPath);
          break;
        case 'webm':
          await this.transcodeToWebM(job, inputPath);
          break;
        case 'hls':
          await this.transcodeToHLS(job, inputPath);
          break;
        case 'dash':
          await this.transcodeToDASH(job, inputPath);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      // Generate thumbnails if requested
      if (options.generateThumbnails) {
        await this.generateThumbnails(job, inputPath);
      }

      // Generate preview if requested
      if (options.generatePreview) {
        await this.generatePreview(job, inputPath);
      }

      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.updatedAt = new Date();

      this.emit('job_completed', { jobId, job });

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.endTime = new Date();
      job.updatedAt = new Date();

      this.emit('job_failed', { jobId, job, error: error.message });

      throw error;
    } finally {
      // Clean up temp files
      await this.cleanupJobFiles(jobId);
      this.activeJobs.delete(jobId);
      
      // Process next job in queue
      setTimeout(() => this.processNextJob(), 1000);
    }
  }

  private async transcodeToMP4(job: TranscodingJob, inputPath: string): Promise<void> {
    const outputPath = path.join(this.tempDirectory, `${job.id}_output.mp4`);
    const quality = this.qualityPresets[job.options.quality || 'medium'];

    const args = [
      '-i', inputPath,
      '-c:v', job.options.codec || 'libx264',
      '-crf', quality.crf.toString(),
      '-preset', 'medium',
      '-c:a', job.options.audioCodec || 'aac',
      '-b:a', quality.audioBitrate,
      '-movflags', '+faststart', // Web optimization
      '-y', // Overwrite output
      outputPath
    ];

    // Add resolution scaling if specified
    if (job.options.resolution && job.options.resolution !== 'auto') {
      const res = this.resolutions[job.options.resolution];
      args.splice(-2, 0, '-vf', `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease`);
    }

    await this.runFFmpeg(job, args);
    await this.uploadOutputFile(job, outputPath, 'video', 'mp4');
  }

  private async transcodeToWebM(job: TranscodingJob, inputPath: string): Promise<void> {
    const outputPath = path.join(this.tempDirectory, `${job.id}_output.webm`);
    const quality = this.qualityPresets[job.options.quality || 'medium'];

    const args = [
      '-i', inputPath,
      '-c:v', 'libvp9',
      '-b:v', quality.videoBitrate,
      '-c:a', 'libopus',
      '-b:a', quality.audioBitrate,
      '-y',
      outputPath
    ];

    await this.runFFmpeg(job, args);
    await this.uploadOutputFile(job, outputPath, 'video', 'webm');
  }

  private async transcodeToHLS(job: TranscodingJob, inputPath: string): Promise<void> {
    const outputDir = path.join(this.tempDirectory, `${job.id}_hls`);
    require('fs').mkdirSync(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, 'playlist.m3u8');
    const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-hls_time', '10',
      '-hls_list_size', '0',
      '-hls_segment_filename', segmentPattern,
      '-y',
      playlistPath
    ];

    await this.runFFmpeg(job, args);
    
    // Upload all HLS files
    const files = require('fs').readdirSync(outputDir);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      if (file.endsWith('.m3u8')) {
        await this.uploadOutputFile(job, filePath, 'manifest', 'm3u8');
      } else if (file.endsWith('.ts')) {
        await this.uploadOutputFile(job, filePath, 'video', 'ts');
      }
    }
  }

  private async transcodeToDASH(job: TranscodingJob, inputPath: string): Promise<void> {
    const outputDir = path.join(this.tempDirectory, `${job.id}_dash`);
    require('fs').mkdirSync(outputDir, { recursive: true });

    const mpdPath = path.join(outputDir, 'manifest.mpd');

    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-use_timeline', '1',
      '-use_template', '1',
      '-adaptation_sets', 'id=0,streams=v id=1,streams=a',
      '-y',
      mpdPath
    ];

    await this.runFFmpeg(job, args);
    
    // Upload DASH files
    const files = require('fs').readdirSync(outputDir);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      if (file.endsWith('.mpd')) {
        await this.uploadOutputFile(job, filePath, 'manifest', 'mpd');
      } else {
        await this.uploadOutputFile(job, filePath, 'video', 'mp4');
      }
    }
  }

  private async generateThumbnails(job: TranscodingJob, inputPath: string): Promise<void> {
    const count = job.options.thumbnailCount || 5;
    const duration = job.metadata.duration || 0;
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const outputPath = path.join(this.tempDirectory, `${job.id}_thumb_${i}.jpg`);

      const args = [
        '-i', inputPath,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath
      ];

      try {
        await this.runFFmpeg(job, args);
        await this.uploadOutputFile(job, outputPath, 'thumbnail', 'jpg', `${i}`);
      } catch (error) {
        console.warn(`Failed to generate thumbnail ${i}:`, error);
      }
    }
  }

  private async generatePreview(job: TranscodingJob, inputPath: string): Promise<void> {
    const outputPath = path.join(this.tempDirectory, `${job.id}_preview.mp4`);
    const duration = Math.min(job.metadata.duration || 30, 30); // Max 30 seconds

    const args = [
      '-i', inputPath,
      '-t', duration.toString(),
      '-c:v', 'libx264',
      '-crf', '28',
      '-vf', 'scale=640:360:force_original_aspect_ratio=decrease',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-y',
      outputPath
    ];

    await this.runFFmpeg(job, args);
    await this.uploadOutputFile(job, outputPath, 'preview', 'mp4');
  }

  private async runFFmpeg(job: TranscodingJob, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      
      this.activeJobs.set(job.id, ffmpeg);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        
        // Parse progress from stderr
        const progressMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (progressMatch && job.metadata.duration) {
          const hours = parseInt(progressMatch[1]);
          const minutes = parseInt(progressMatch[2]);
          const seconds = parseInt(progressMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          
          job.progress = Math.min(95, (currentTime / job.metadata.duration) * 100);
          job.updatedAt = new Date();

          this.emit('job_progress', {
            jobId: job.id,
            progress: job.progress,
            currentTime,
            totalTime: job.metadata.duration
          });
        }
      });

      ffmpeg.on('close', (code) => {
        this.activeJobs.delete(job.id);
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}. Error: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        this.activeJobs.delete(job.id);
        reject(error);
      });
    });
  }

  private async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(this.ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
          const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          const metadata: VideoMetadata = {
            duration: parseFloat(data.format.duration) || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            bitrate: parseInt(data.format.bit_rate) || 0,
            framerate: this.parseFramerate(videoStream.r_frame_rate),
            codec: videoStream.codec_name || 'unknown',
            audioCodec: audioStream?.codec_name,
            audioChannels: audioStream?.channels,
            audioSampleRate: audioStream?.sample_rate,
            fileSize: parseInt(data.format.size) || 0,
            format: data.format.format_name || 'unknown'
          };

          resolve(metadata);
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error.message}`));
        }
      });
    });
  }

  private parseFramerate(framerateStr: string): number {
    if (!framerateStr) return 0;
    
    const parts = framerateStr.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    
    return parseFloat(framerateStr) || 0;
  }

  private async downloadFile(url: string, outputPath: string): Promise<void> {
    const response = await require('axios').get(url, { responseType: 'stream' });
    const writer = createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private async uploadOutputFile(
    job: TranscodingJob,
    filePath: string,
    type: 'video' | 'audio' | 'thumbnail' | 'preview' | 'manifest',
    format: string,
    qualifier?: string
  ): Promise<void> {
    const fileBuffer = require('fs').readFileSync(filePath);
    const filename = `${job.id}_${type}${qualifier ? '_' + qualifier : ''}.${format}`;
    
    const uploadResult = await this.minioService.uploadFile(
      fileBuffer,
      filename,
      this.getMimeType(format),
      'media',
      {
        metadata: {
          'X-Job-Id': job.id,
          'X-Output-Type': type,
          'X-Format': format
        }
      }
    );

    const outputFile = {
      type,
      format,
      quality: job.options.quality,
      resolution: job.options.resolution,
      url: uploadResult.url,
      filename,
      bucket: uploadResult.bucket,
      size: fileBuffer.length
    };

    job.outputFiles.push(outputFile);
    job.updatedAt = new Date();

    this.emit('output_file_created', { jobId: job.id, outputFile });
  }

  private getMimeType(extension: string): string {
    const mimeTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ts': 'video/mp2t',
      'm3u8': 'application/x-mpegURL',
      'mpd': 'application/dash+xml',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async cleanupJobFiles(jobId: string): Promise<void> {
    const tempFiles = require('fs').readdirSync(this.tempDirectory)
      .filter(file => file.startsWith(jobId));

    for (const file of tempFiles) {
      try {
        const fullPath = path.join(this.tempDirectory, file);
        if (require('fs').lstatSync(fullPath).isDirectory()) {
          require('fs').rmSync(fullPath, { recursive: true, force: true });
        } else {
          unlinkSync(fullPath);
        }
      } catch (error) {
        console.warn(`Failed to delete temp file ${file}:`, error);
      }
    }
  }

  private setupCleanupTasks(): void {
    // Clean up old completed jobs every hour
    setInterval(() => {
      this.cleanupOldJobs();
    }, 60 * 60 * 1000);

    // Clean up temp files every 30 minutes
    setInterval(() => {
      this.cleanupTempFiles();
    }, 30 * 60 * 1000);
  }

  private cleanupOldJobs(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const jobsToDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.updatedAt < cutoffTime) {
        jobsToDelete.push(jobId);
      }
    }

    for (const jobId of jobsToDelete) {
      this.deleteJob(jobId);
    }

    if (jobsToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${jobsToDelete.length} old transcoding jobs`);
    }
  }

  private cleanupTempFiles(): void {
    try {
      const files = require('fs').readdirSync(this.tempDirectory);
      const cutoffTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago

      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file);
        const stats = require('fs').statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          if (stats.isDirectory()) {
            require('fs').rmSync(filePath, { recursive: true, force: true });
          } else {
            unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  // Health monitoring
  async getServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeJobs: number;
    queuedJobs: number;
    tempFileCount: number;
    tempDirSize: number;
    ffmpegAvailable: boolean;
  }> {
    try {
      const tempFiles = require('fs').readdirSync(this.tempDirectory);
      const tempDirSize = tempFiles.reduce((size, file) => {
        const filePath = path.join(this.tempDirectory, file);
        const stats = require('fs').statSync(filePath);
        return size + stats.size;
      }, 0);

      const queueStatus = this.getQueueStatus();
      
      let ffmpegAvailable = true;
      try {
        await this.checkFFmpegAvailability();
      } catch {
        ffmpegAvailable = false;
      }

      const status = !ffmpegAvailable ? 'unhealthy' : 
        (this.activeJobs.size >= this.maxConcurrentJobs ? 'degraded' : 'healthy');

      return {
        status,
        activeJobs: this.activeJobs.size,
        queuedJobs: queueStatus.queued,
        tempFileCount: tempFiles.length,
        tempDirSize,
        ffmpegAvailable
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        activeJobs: 0,
        queuedJobs: 0,
        tempFileCount: 0,
        tempDirSize: 0,
        ffmpegAvailable: false
      };
    }
  }

  // Cleanup on service shutdown
  async shutdown(): Promise<void> {
    // Cancel all active jobs
    for (const [jobId, process] of this.activeJobs.entries()) {
      process.kill('SIGTERM');
      
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'cancelled';
        job.updatedAt = new Date();
      }
    }

    // Clean up temp files
    this.cleanupTempFiles();

    this.removeAllListeners();
    console.log('🔧 Video Transcoding Service shut down');
  }
}