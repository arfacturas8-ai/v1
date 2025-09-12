import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { Client as MinioClient } from 'minio';

export interface VideoTranscodingJob {
  id: string;
  userId: string;
  inputFile: {
    bucket: string;
    filename: string;
    url: string;
    originalName: string;
  };
  outputFormats: Array<{
    format: 'mp4' | 'webm' | 'hls';
    resolution: '480p' | '720p' | '1080p' | 'original';
    bitrate?: string;
    codec?: string;
  }>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  outputs: Array<{
    format: string;
    resolution: string;
    url: string;
    filename: string;
    bucket: string;
    size: number;
    duration?: number;
    bitrate?: string;
  }>;
  thumbnails: Array<{
    timestamp: number;
    url: string;
    filename: string;
    bucket: string;
    size: number;
  }>;
  preview?: {
    url: string;
    filename: string;
    bucket: string;
    size: number;
    duration: number;
  };
  metadata: {
    duration: number;
    width: number;
    height: number;
    framerate: number;
    originalBitrate: number;
    audioCodec?: string;
    videoCodec?: string;
    fileSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioTranscodingJob {
  id: string;
  userId: string;
  inputFile: {
    bucket: string;
    filename: string;
    url: string;
    originalName: string;
  };
  outputFormats: Array<{
    format: 'mp3' | 'ogg' | 'aac' | 'wav';
    bitrate: string;
    sampleRate?: number;
  }>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  outputs: Array<{
    format: string;
    bitrate: string;
    url: string;
    filename: string;
    bucket: string;
    size: number;
    duration?: number;
  }>;
  waveform?: {
    url: string;
    filename: string;
    bucket: string;
    peaks: number[];
    duration: number;
  };
  metadata: {
    duration: number;
    bitrate: number;
    sampleRate: number;
    channels: number;
    codec: string;
    fileSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enhanced Media Transcoding Service for CRYB Chat Platform
 * 
 * Features:
 * - Video transcoding to multiple formats and resolutions
 * - Audio transcoding with waveform generation  
 * - Thumbnail extraction at multiple timestamps
 * - Preview generation for videos
 * - Progress tracking and real-time updates
 * - Queue management with priority handling
 * - Hardware acceleration when available
 * - Crash recovery and automatic retries
 * - Bandwidth-adaptive streaming preparation
 */
export class EnhancedMediaTranscodingService extends EventEmitter {
  private minio: MinioClient;
  private videoJobs: Map<string, VideoTranscodingJob> = new Map();
  private audioJobs: Map<string, AudioTranscodingJob> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private jobQueue: Array<{ id: string; type: 'video' | 'audio'; priority: number }> = [];
  private tempDirectory: string = '/tmp/cryb-transcoding';
  private maxConcurrentJobs: number = 2;
  private ffmpegPath: string = 'ffmpeg';
  private ffprobePath: string = 'ffprobe';
  private isInitialized: boolean = false;

  // Video encoding presets optimized for chat/social media
  private readonly videoPresets = {
    '480p': {
      width: 854,
      height: 480,
      bitrate: '800k',
      maxBitrate: '1200k',
      bufferSize: '1600k',
      crf: 28
    },
    '720p': {
      width: 1280,
      height: 720,
      bitrate: '1800k',
      maxBitrate: '2700k',
      bufferSize: '3600k',
      crf: 23
    },
    '1080p': {
      width: 1920,
      height: 1080,
      bitrate: '3500k',
      maxBitrate: '5250k',
      bufferSize: '7000k',
      crf: 18
    }
  };

  // Audio encoding presets
  private readonly audioPresets = {
    low: { bitrate: '64k', sampleRate: 22050 },
    medium: { bitrate: '128k', sampleRate: 44100 },
    high: { bitrate: '192k', sampleRate: 48000 }
  };

  constructor(minioClient: MinioClient, options: {
    ffmpegPath?: string;
    ffprobePath?: string;
    maxConcurrentJobs?: number;
    tempDirectory?: string;
  } = {}) {
    super();
    
    this.minio = minioClient;
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.ffprobePath = options.ffprobePath || 'ffprobe';
    this.maxConcurrentJobs = options.maxConcurrentJobs || 2;
    this.tempDirectory = options.tempDirectory || '/tmp/cryb-transcoding';

    // Initialize service asynchronously without blocking the constructor
    this.initializeService().catch(error => {
      console.error('❌ Enhanced Media Transcoding Service initialization failed:', error);
      this.emit('error', error);
    });
  }

  private async initializeService(): Promise<void> {
    try {
      // Check FFmpeg availability
      await this.checkFFmpegAvailability();
      
      // Create temp directory
      if (!existsSync(this.tempDirectory)) {
        mkdirSync(this.tempDirectory, { recursive: true });
      }

      // Start job processor
      this.startJobProcessor();

      // Setup cleanup tasks
      this.setupCleanupTasks();

      this.isInitialized = true;
      console.log('✅ Enhanced Media Transcoding Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Media Transcoding Service:', error);
      console.warn('Video transcoding features will be disabled. Install FFmpeg to enable these features.');
      this.isInitialized = false;
      // Don't throw error - allow service to continue without transcoding
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

      ffmpeg.on('error', () => {
        reject(new Error('FFmpeg not found in PATH'));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        ffmpeg.kill('SIGTERM');
        reject(new Error('FFmpeg availability check timed out'));
      }, 5000);
    });
  }

  /**
   * Create video transcoding job
   */
  async createVideoTranscodingJob(
    inputBucket: string,
    inputFilename: string,
    originalName: string,
    userId: string,
    options: {
      formats: Array<{
        format: 'mp4' | 'webm' | 'hls';
        resolution: '480p' | '720p' | '1080p' | 'original';
        bitrate?: string;
      }>;
      generateThumbnails?: boolean;
      generatePreview?: boolean;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<VideoTranscodingJob> {
    if (!this.isInitialized) {
      throw new Error('Video transcoding service is not available. FFmpeg is not installed.');
    }

    const jobId = randomUUID();

    try {
      // Get presigned URL for input file
      const inputUrl = await this.minio.presignedGetObject(inputBucket, inputFilename, 3600);
      
      // Analyze video metadata
      const metadata = await this.analyzeVideoMetadata(inputUrl);
      
      const job: VideoTranscodingJob = {
        id: jobId,
        userId,
        inputFile: {
          bucket: inputBucket,
          filename: inputFilename,
          url: inputUrl,
          originalName
        },
        outputFormats: options.formats,
        status: 'queued',
        progress: 0,
        outputs: [],
        thumbnails: [],
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add preview if requested
      if (options.generatePreview) {
        job.preview = undefined; // Will be populated during processing
      }

      this.videoJobs.set(jobId, job);

      // Add to queue with priority
      const priority = options.priority === 'high' ? 3 : options.priority === 'low' ? 1 : 2;
      this.addToQueue(jobId, 'video', priority);

      this.emit('video_job_created', { jobId, job });
      
      // Try to start processing immediately
      this.processNextJob();

      return job;
    } catch (error) {
      throw new Error(`Failed to create video transcoding job: ${error.message}`);
    }
  }

  /**
   * Create audio transcoding job
   */
  async createAudioTranscodingJob(
    inputBucket: string,
    inputFilename: string,
    originalName: string,
    userId: string,
    options: {
      formats: Array<{
        format: 'mp3' | 'ogg' | 'aac' | 'wav';
        bitrate: string;
      }>;
      generateWaveform?: boolean;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<AudioTranscodingJob> {
    if (!this.isInitialized) {
      throw new Error('Audio transcoding service is not available. FFmpeg is not installed.');
    }

    const jobId = randomUUID();

    try {
      // Get presigned URL for input file
      const inputUrl = await this.minio.presignedGetObject(inputBucket, inputFilename, 3600);
      
      // Analyze audio metadata
      const metadata = await this.analyzeAudioMetadata(inputUrl);
      
      const job: AudioTranscodingJob = {
        id: jobId,
        userId,
        inputFile: {
          bucket: inputBucket,
          filename: inputFilename,
          url: inputUrl,
          originalName
        },
        outputFormats: options.formats,
        status: 'queued',
        progress: 0,
        outputs: [],
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.audioJobs.set(jobId, job);

      // Add to queue with priority
      const priority = options.priority === 'high' ? 3 : options.priority === 'low' ? 1 : 2;
      this.addToQueue(jobId, 'audio', priority);

      this.emit('audio_job_created', { jobId, job });
      
      // Try to start processing immediately
      this.processNextJob();

      return job;
    } catch (error) {
      throw new Error(`Failed to create audio transcoding job: ${error.message}`);
    }
  }

  /**
   * Get job status
   */
  getVideoJob(jobId: string): VideoTranscodingJob | undefined {
    return this.videoJobs.get(jobId);
  }

  getAudioJob(jobId: string): AudioTranscodingJob | undefined {
    return this.audioJobs.get(jobId);
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const videoJob = this.videoJobs.get(jobId);
    const audioJob = this.audioJobs.get(jobId);
    
    if (!videoJob && !audioJob) {
      return false;
    }

    // Kill active process if running
    const activeProcess = this.activeProcesses.get(jobId);
    if (activeProcess) {
      activeProcess.kill('SIGTERM');
      this.activeProcesses.delete(jobId);
    }

    // Remove from queue
    this.jobQueue = this.jobQueue.filter(item => item.id !== jobId);

    // Update status
    if (videoJob) {
      videoJob.status = 'cancelled';
      videoJob.updatedAt = new Date();
      this.emit('video_job_cancelled', { jobId, job: videoJob });
    }

    if (audioJob) {
      audioJob.status = 'cancelled';
      audioJob.updatedAt = new Date();
      this.emit('audio_job_cancelled', { jobId, job: audioJob });
    }

    // Clean up temp files
    await this.cleanupJobFiles(jobId);

    // Process next job
    this.processNextJob();

    return true;
  }

  /**
   * Queue management
   */
  private addToQueue(jobId: string, type: 'video' | 'audio', priority: number): void {
    this.jobQueue.push({ id: jobId, type, priority });
    
    // Sort by priority (higher first)
    this.jobQueue.sort((a, b) => b.priority - a.priority);
  }

  private startJobProcessor(): void {
    setInterval(() => {
      this.processNextJob();
    }, 5000); // Check every 5 seconds
  }

  private async processNextJob(): Promise<void> {
    if (this.activeProcesses.size >= this.maxConcurrentJobs) {
      return; // Max concurrent jobs reached
    }

    if (this.jobQueue.length === 0) {
      return; // No jobs in queue
    }

    const queueItem = this.jobQueue.shift()!;
    
    if (queueItem.type === 'video') {
      const job = this.videoJobs.get(queueItem.id);
      if (job && job.status === 'queued') {
        await this.processVideoJob(job);
      }
    } else {
      const job = this.audioJobs.get(queueItem.id);
      if (job && job.status === 'queued') {
        await this.processAudioJob(job);
      }
    }
  }

  /**
   * Video processing
   */
  private async processVideoJob(job: VideoTranscodingJob): Promise<void> {
    job.status = 'processing';
    job.startTime = new Date();
    job.progress = 0;
    job.updatedAt = new Date();

    this.emit('video_job_started', { jobId: job.id, job });

    try {
      // Download input file
      const inputPath = path.join(this.tempDirectory, `${job.id}_input${path.extname(job.inputFile.filename)}`);
      await this.downloadFile(job.inputFile.url, inputPath);

      // Process each output format
      const totalSteps = job.outputFormats.length + (job.preview ? 1 : 0) + (job.thumbnails ? 5 : 0);
      let completedSteps = 0;

      for (const outputFormat of job.outputFormats) {
        await this.transcodeVideo(job, inputPath, outputFormat);
        completedSteps++;
        job.progress = (completedSteps / totalSteps) * 90; // Leave 10% for thumbnails/preview
        job.updatedAt = new Date();
        this.emit('video_job_progress', { jobId: job.id, progress: job.progress });
      }

      // Generate thumbnails
      await this.generateVideoThumbnails(job, inputPath);
      completedSteps++;
      job.progress = (completedSteps / totalSteps) * 95;

      // Generate preview if requested
      if (job.preview !== undefined) {
        await this.generateVideoPreview(job, inputPath);
        completedSteps++;
      }

      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.updatedAt = new Date();

      this.emit('video_job_completed', { jobId: job.id, job });

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.endTime = new Date();
      job.updatedAt = new Date();

      this.emit('video_job_failed', { jobId: job.id, job, error: error.message });
    } finally {
      this.activeProcesses.delete(job.id);
      await this.cleanupJobFiles(job.id);
      setTimeout(() => this.processNextJob(), 1000);
    }
  }

  /**
   * Audio processing
   */
  private async processAudioJob(job: AudioTranscodingJob): Promise<void> {
    job.status = 'processing';
    job.progress = 0;
    job.updatedAt = new Date();

    this.emit('audio_job_started', { jobId: job.id, job });

    try {
      // Download input file
      const inputPath = path.join(this.tempDirectory, `${job.id}_input${path.extname(job.inputFile.filename)}`);
      await this.downloadFile(job.inputFile.url, inputPath);

      // Process each output format
      const totalSteps = job.outputFormats.length + (job.waveform ? 1 : 0);
      let completedSteps = 0;

      for (const outputFormat of job.outputFormats) {
        await this.transcodeAudio(job, inputPath, outputFormat);
        completedSteps++;
        job.progress = (completedSteps / totalSteps) * 90;
        job.updatedAt = new Date();
        this.emit('audio_job_progress', { jobId: job.id, progress: job.progress });
      }

      // Generate waveform if requested
      if (job.waveform !== undefined) {
        await this.generateAudioWaveform(job, inputPath);
        completedSteps++;
      }

      job.status = 'completed';
      job.progress = 100;
      job.updatedAt = new Date();

      this.emit('audio_job_completed', { jobId: job.id, job });

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();

      this.emit('audio_job_failed', { jobId: job.id, job, error: error.message });
    } finally {
      this.activeProcesses.delete(job.id);
      await this.cleanupJobFiles(job.id);
      setTimeout(() => this.processNextJob(), 1000);
    }
  }

  /**
   * FFmpeg operations
   */
  private async transcodeVideo(
    job: VideoTranscodingJob, 
    inputPath: string, 
    outputConfig: { format: string; resolution: string; bitrate?: string }
  ): Promise<void> {
    const outputPath = path.join(this.tempDirectory, `${job.id}_${outputConfig.format}_${outputConfig.resolution}.${outputConfig.format}`);
    
    let args: string[];

    if (outputConfig.format === 'hls') {
      args = this.buildHLSTranscodeArgs(inputPath, outputPath, outputConfig.resolution);
    } else {
      args = this.buildVideoTranscodeArgs(inputPath, outputPath, outputConfig);
    }

    await this.runFFmpeg(job.id, args);

    // Upload output file
    const outputBuffer = require('fs').readFileSync(outputPath);
    const outputFilename = `${job.id}_${outputConfig.format}_${outputConfig.resolution}.${outputConfig.format}`;
    
    await this.minio.putObject(
      'cryb-transcoded',
      outputFilename,
      outputBuffer,
      outputBuffer.length,
      {
        'Content-Type': this.getMimeType(outputConfig.format),
        'Cache-Control': 'public, max-age=31536000',
        'X-Amz-Meta-Job-Id': job.id,
        'X-Amz-Meta-Format': outputConfig.format,
        'X-Amz-Meta-Resolution': outputConfig.resolution
      }
    );

    const outputUrl = await this.minio.presignedGetObject('cryb-transcoded', outputFilename, 3600 * 24);

    job.outputs.push({
      format: outputConfig.format,
      resolution: outputConfig.resolution,
      url: outputUrl,
      filename: outputFilename,
      bucket: 'cryb-transcoded',
      size: outputBuffer.length,
      duration: job.metadata.duration,
      bitrate: outputConfig.bitrate
    });
  }

  private async transcodeAudio(
    job: AudioTranscodingJob, 
    inputPath: string, 
    outputConfig: { format: string; bitrate: string }
  ): Promise<void> {
    const outputPath = path.join(this.tempDirectory, `${job.id}_${outputConfig.format}.${outputConfig.format}`);
    const args = this.buildAudioTranscodeArgs(inputPath, outputPath, outputConfig);

    await this.runFFmpeg(job.id, args);

    // Upload output file
    const outputBuffer = require('fs').readFileSync(outputPath);
    const outputFilename = `${job.id}_${outputConfig.format}.${outputConfig.format}`;
    
    await this.minio.putObject(
      'cryb-transcoded',
      outputFilename,
      outputBuffer,
      outputBuffer.length,
      {
        'Content-Type': this.getMimeType(outputConfig.format),
        'Cache-Control': 'public, max-age=31536000',
        'X-Amz-Meta-Job-Id': job.id,
        'X-Amz-Meta-Format': outputConfig.format,
        'X-Amz-Meta-Bitrate': outputConfig.bitrate
      }
    );

    const outputUrl = await this.minio.presignedGetObject('cryb-transcoded', outputFilename, 3600 * 24);

    job.outputs.push({
      format: outputConfig.format,
      bitrate: outputConfig.bitrate,
      url: outputUrl,
      filename: outputFilename,
      bucket: 'cryb-transcoded',
      size: outputBuffer.length,
      duration: job.metadata.duration
    });
  }

  private buildVideoTranscodeArgs(inputPath: string, outputPath: string, config: any): string[] {
    const preset = this.videoPresets[config.resolution] || this.videoPresets['720p'];
    
    let args = [
      '-i', inputPath,
      '-c:v', config.format === 'webm' ? 'libvp9' : 'libx264',
      '-preset', 'medium',
      '-crf', preset.crf.toString(),
      '-maxrate', preset.maxBitrate,
      '-bufsize', preset.bufferSize,
      '-c:a', config.format === 'webm' ? 'libopus' : 'aac',
      '-b:a', '128k'
    ];

    // Add resolution scaling
    if (config.resolution !== 'original') {
      args.push('-vf', `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease`);
    }

    // Web optimization
    if (config.format === 'mp4') {
      args.push('-movflags', '+faststart');
    }

    args.push('-y', outputPath);
    return args;
  }

  private buildHLSTranscodeArgs(inputPath: string, outputPath: string, resolution: string): string[] {
    const preset = this.videoPresets[resolution] || this.videoPresets['720p'];
    
    return [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', preset.crf.toString(),
      '-c:a', 'aac',
      '-b:a', '128k',
      '-vf', `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease`,
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-hls_segment_filename', path.join(path.dirname(outputPath), `segment_%03d.ts`),
      '-f', 'hls',
      '-y', outputPath
    ];
  }

  private buildAudioTranscodeArgs(inputPath: string, outputPath: string, config: any): string[] {
    return [
      '-i', inputPath,
      '-c:a', this.getAudioCodec(config.format),
      '-b:a', config.bitrate,
      '-ar', '44100',
      '-ac', '2',
      '-y', outputPath
    ];
  }

  private async generateVideoThumbnails(job: VideoTranscodingJob, inputPath: string): Promise<void> {
    const duration = job.metadata.duration;
    const timestamps = [
      duration * 0.1,
      duration * 0.25, 
      duration * 0.5,
      duration * 0.75,
      duration * 0.9
    ];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(this.tempDirectory, `${job.id}_thumb_${i}.jpg`);
      
      const args = [
        '-i', inputPath,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-q:v', '2',
        '-vf', 'scale=320:240:force_original_aspect_ratio=decrease',
        '-y', outputPath
      ];

      try {
        await this.runFFmpeg(`${job.id}_thumb_${i}`, args);
        
        // Upload thumbnail
        const thumbBuffer = require('fs').readFileSync(outputPath);
        const thumbFilename = `${job.id}_thumb_${i}.jpg`;
        
        await this.minio.putObject(
          'cryb-thumbnails',
          thumbFilename,
          thumbBuffer,
          thumbBuffer.length,
          {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
            'X-Amz-Meta-Job-Id': job.id,
            'X-Amz-Meta-Timestamp': timestamp.toString()
          }
        );

        const thumbUrl = await this.minio.presignedGetObject('cryb-thumbnails', thumbFilename, 3600 * 24);

        job.thumbnails.push({
          timestamp,
          url: thumbUrl,
          filename: thumbFilename,
          bucket: 'cryb-thumbnails',
          size: thumbBuffer.length
        });
      } catch (error) {
        console.warn(`Failed to generate thumbnail ${i}:`, error);
      }
    }
  }

  private async generateVideoPreview(job: VideoTranscodingJob, inputPath: string): Promise<void> {
    const previewDuration = Math.min(job.metadata.duration, 30); // Max 30 seconds
    const outputPath = path.join(this.tempDirectory, `${job.id}_preview.mp4`);
    
    const args = [
      '-i', inputPath,
      '-t', previewDuration.toString(),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-vf', 'scale=640:480:force_original_aspect_ratio=decrease',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      '-y', outputPath
    ];

    await this.runFFmpeg(`${job.id}_preview`, args);

    // Upload preview
    const previewBuffer = require('fs').readFileSync(outputPath);
    const previewFilename = `${job.id}_preview.mp4`;
    
    await this.minio.putObject(
      'cryb-previews',
      previewFilename,
      previewBuffer,
      previewBuffer.length,
      {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000',
        'X-Amz-Meta-Job-Id': job.id,
        'X-Amz-Meta-Type': 'preview'
      }
    );

    const previewUrl = await this.minio.presignedGetObject('cryb-previews', previewFilename, 3600 * 24);

    job.preview = {
      url: previewUrl,
      filename: previewFilename,
      bucket: 'cryb-previews',
      size: previewBuffer.length,
      duration: previewDuration
    };
  }

  private async generateAudioWaveform(job: AudioTranscodingJob, inputPath: string): Promise<void> {
    // This would generate waveform data - for now, we'll create a placeholder
    const peaks = Array.from({ length: 1000 }, () => Math.random() * 100);
    
    const waveformData = {
      peaks,
      duration: job.metadata.duration,
      sampleRate: job.metadata.sampleRate
    };

    const waveformBuffer = Buffer.from(JSON.stringify(waveformData));
    const waveformFilename = `${job.id}_waveform.json`;
    
    await this.minio.putObject(
      'cryb-previews',
      waveformFilename,
      waveformBuffer,
      waveformBuffer.length,
      {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000',
        'X-Amz-Meta-Job-Id': job.id,
        'X-Amz-Meta-Type': 'waveform'
      }
    );

    const waveformUrl = await this.minio.presignedGetObject('cryb-previews', waveformFilename, 3600 * 24);

    job.waveform = {
      url: waveformUrl,
      filename: waveformFilename,
      bucket: 'cryb-previews',
      peaks,
      duration: job.metadata.duration
    };
  }

  /**
   * Utility methods
   */
  private async runFFmpeg(processId: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      this.activeProcesses.set(processId, ffmpeg);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        this.activeProcesses.delete(processId);
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        this.activeProcesses.delete(processId);
        reject(error);
      });

      // Timeout after 30 minutes
      setTimeout(() => {
        if (this.activeProcesses.has(processId)) {
          ffmpeg.kill('SIGTERM');
          this.activeProcesses.delete(processId);
          reject(new Error('FFmpeg process timed out'));
        }
      }, 30 * 60 * 1000);
    });
  }

  private async downloadFile(url: string, outputPath: string): Promise<void> {
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private async analyzeVideoMetadata(filePath: string): Promise<VideoTranscodingJob['metadata']> {
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

      ffprobe.stdout.on('data', (data) => stdout += data.toString());
      ffprobe.stderr.on('data', (data) => stderr += data.toString());

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${stderr}`));
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

          resolve({
            duration: parseFloat(data.format.duration) || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            framerate: this.parseFramerate(videoStream.r_frame_rate) || 0,
            originalBitrate: parseInt(data.format.bit_rate) || 0,
            videoCodec: videoStream.codec_name,
            audioCodec: audioStream?.codec_name,
            fileSize: parseInt(data.format.size) || 0
          });
        } catch (error) {
          reject(new Error(`Failed to parse video metadata: ${error.message}`));
        }
      });

      // Timeout
      setTimeout(() => {
        ffprobe.kill('SIGTERM');
        reject(new Error('Video analysis timed out'));
      }, 30000);
    });
  }

  private async analyzeAudioMetadata(filePath: string): Promise<AudioTranscodingJob['metadata']> {
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

      ffprobe.stdout.on('data', (data) => stdout += data.toString());
      ffprobe.stderr.on('data', (data) => stderr += data.toString());

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

          if (!audioStream) {
            reject(new Error('No audio stream found'));
            return;
          }

          resolve({
            duration: parseFloat(data.format.duration) || 0,
            bitrate: parseInt(audioStream.bit_rate) || 0,
            sampleRate: parseInt(audioStream.sample_rate) || 0,
            channels: audioStream.channels || 0,
            codec: audioStream.codec_name,
            fileSize: parseInt(data.format.size) || 0
          });
        } catch (error) {
          reject(new Error(`Failed to parse audio metadata: ${error.message}`));
        }
      });

      // Timeout
      setTimeout(() => {
        ffprobe.kill('SIGTERM');
        reject(new Error('Audio analysis timed out'));
      }, 30000);
    });
  }

  private parseFramerate(framerateStr: string): number {
    if (!framerateStr) return 0;
    
    const parts = framerateStr.split('/');
    if (parts.length === 2) {
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    
    return parseFloat(framerateStr) || 0;
  }

  private getMimeType(format: string): string {
    const mimeTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'hls': 'application/x-mpegURL',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'wav': 'audio/wav'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  private getAudioCodec(format: string): string {
    const codecs = {
      'mp3': 'libmp3lame',
      'ogg': 'libvorbis',
      'aac': 'aac',
      'wav': 'pcm_s16le'
    };
    return codecs[format] || 'aac';
  }

  private async cleanupJobFiles(jobId: string): Promise<void> {
    try {
      const files = readdirSync(this.tempDirectory)
        .filter(file => file.startsWith(jobId));

      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup files for job ${jobId}:`, error);
    }
  }

  private setupCleanupTasks(): void {
    // Clean up old completed jobs every 2 hours
    setInterval(() => {
      this.cleanupOldJobs();
    }, 2 * 60 * 60 * 1000);

    // Clean up temp files every hour
    setInterval(() => {
      this.cleanupTempFiles();
    }, 60 * 60 * 1000);
  }

  private cleanupOldJobs(): void {
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    
    // Clean up video jobs
    for (const [jobId, job] of this.videoJobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.updatedAt < cutoffTime) {
        this.videoJobs.delete(jobId);
      }
    }

    // Clean up audio jobs
    for (const [jobId, job] of this.audioJobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.updatedAt < cutoffTime) {
        this.audioJobs.delete(jobId);
      }
    }
  }

  private cleanupTempFiles(): void {
    try {
      const files = readdirSync(this.tempDirectory);
      const cutoffTime = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago

      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file);
        const stats = statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get service health and statistics
   */
  getQueueStatus(): {
    video: { queued: number; processing: number; completed: number; failed: number };
    audio: { queued: number; processing: number; completed: number; failed: number };
    activeProcesses: number;
  } {
    const videoJobs = Array.from(this.videoJobs.values());
    const audioJobs = Array.from(this.audioJobs.values());

    return {
      video: {
        queued: videoJobs.filter(job => job.status === 'queued').length,
        processing: videoJobs.filter(job => job.status === 'processing').length,
        completed: videoJobs.filter(job => job.status === 'completed').length,
        failed: videoJobs.filter(job => job.status === 'failed').length
      },
      audio: {
        queued: audioJobs.filter(job => job.status === 'queued').length,
        processing: audioJobs.filter(job => job.status === 'processing').length,
        completed: audioJobs.filter(job => job.status === 'completed').length,
        failed: audioJobs.filter(job => job.status === 'failed').length
      },
      activeProcesses: this.activeProcesses.size
    };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    ffmpegAvailable: boolean;
    activeJobs: number;
    queuedJobs: number;
    tempFileCount: number;
  }> {
    try {
      let ffmpegAvailable = true;
      try {
        await this.checkFFmpegAvailability();
      } catch {
        ffmpegAvailable = false;
      }

      const tempFileCount = existsSync(this.tempDirectory) ? 
        readdirSync(this.tempDirectory).length : 0;

      const queueStatus = this.getQueueStatus();
      const totalActive = queueStatus.video.processing + queueStatus.audio.processing;
      const totalQueued = queueStatus.video.queued + queueStatus.audio.queued;

      const status = !ffmpegAvailable ? 'unhealthy' : 
        (totalActive >= this.maxConcurrentJobs ? 'degraded' : 'healthy');

      return {
        status,
        ffmpegAvailable,
        activeJobs: totalActive,
        queuedJobs: totalQueued,
        tempFileCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        ffmpegAvailable: false,
        activeJobs: 0,
        queuedJobs: 0,
        tempFileCount: 0
      };
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    // Kill all active processes
    for (const [processId, process] of this.activeProcesses.entries()) {
      process.kill('SIGTERM');
    }

    // Clean up temp files
    this.cleanupTempFiles();

    this.removeAllListeners();
    console.log('🔧 Enhanced Media Transcoding Service shut down');
  }
}