import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Client } from 'minio';
import { addImageJob } from './queues';
import { EventEmitter } from 'events';

// MinIO client configuration
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

// Image processing buckets
const BUCKETS = {
  original: 'cryb-original',
  processed: 'cryb-processed',
  thumbnails: 'cryb-thumbnails',
  avatars: 'cryb-avatars',
  banners: 'cryb-banners',
  optimized: 'cryb-optimized'
};

// Image processing configurations
const IMAGE_CONFIGS = {
  avatar: {
    sizes: [32, 64, 128, 256, 512],
    formats: ['webp', 'jpeg'],
    quality: { webp: 85, jpeg: 85 },
    crop: 'square'
  },
  banner: {
    sizes: [400, 800, 1200, 1920],
    formats: ['webp', 'jpeg'],
    quality: { webp: 80, jpeg: 80 },
    crop: 'fit'
  },
  post: {
    sizes: [300, 600, 1200, 1920],
    formats: ['webp', 'jpeg', 'avif'],
    quality: { webp: 85, jpeg: 85, avif: 80 },
    crop: 'fit'
  },
  thumbnail: {
    sizes: [150, 300],
    formats: ['webp', 'jpeg'],
    quality: { webp: 80, jpeg: 80 },
    crop: 'cover'
  }
};

class ImageProcessorService extends EventEmitter {
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.createBuckets();
      this.isInitialized = true;
      console.log('✅ Image Processor Service initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Image Processor Service:', error);
      this.emit('error', error);
    }
  }

  private async createBuckets() {
    const bucketPromises = Object.values(BUCKETS).map(async (bucket) => {
      try {
        const exists = await minioClient.bucketExists(bucket);
        if (!exists) {
          await minioClient.makeBucket(bucket);
          console.log(`✅ Created bucket: ${bucket}`);

          // Set bucket policy for public read access to processed images
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
            await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
            console.log(`✅ Set public read policy for bucket: ${bucket}`);
          } catch (policyError) {
            console.warn(`⚠️ Could not set policy for bucket ${bucket}:`, policyError.message);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to create/check bucket ${bucket}:`, error);
        throw error;
      }
    });

    await Promise.all(bucketPromises);
  }

  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve, reject) => {
      this.once('initialized', resolve);
      this.once('error', reject);
    });
  }
}

// Initialize the service
const imageProcessor = new ImageProcessorService();

export interface ProcessImageOptions {
  type: 'avatar' | 'banner' | 'post' | 'thumbnail';
  userId?: string;
  generateWebP?: boolean;
  generateAVIF?: boolean;
  customSizes?: number[];
  quality?: number;
  preserveMetadata?: boolean;
}

export interface ProcessedImageResult {
  original: {
    url: string;
    size: number;
    format: string;
    width: number;
    height: number;
  };
  variants: Array<{
    url: string;
    size: number;
    width: number;
    height: number;
    format: string;
    quality: number;
  }>;
  thumbnail?: {
    url: string;
    size: number;
    width: number;
    height: number;
    format: string;
  };
  metadata?: {
    originalSize: number;
    compressionRatio: number;
    processingTime: number;
  };
}

export async function processImage(
  input: string | Buffer,
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  await imageProcessor.waitForInitialization();
  const startTime = Date.now();
  
  try {
    let imageBuffer: Buffer;
    
    // Handle input (URL or Buffer)
    if (typeof input === 'string') {
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      imageBuffer = input;
    }
    
    const originalSize = imageBuffer.length;
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width: originalWidth, height: originalHeight, format: originalFormat } = metadata;
    
    if (!originalWidth || !originalHeight) {
      throw new Error('Unable to get image dimensions');
    }
    
    // Get processing configuration
    const config = IMAGE_CONFIGS[options.type];
    const sizes = options.customSizes || config.sizes;
    const formats = config.formats;
    const qualities = config.quality;
    
    // Store original image
    const originalFilename = generateFilename(options.type, 'original', originalFormat || 'jpg', options.userId);
    await minioClient.putObject(
      BUCKETS.original,
      originalFilename,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': `image/${originalFormat}`,
        'X-Original-Width': originalWidth.toString(),
        'X-Original-Height': originalHeight.toString(),
        'X-Upload-Time': new Date().toISOString(),
        'X-User-Id': options.userId || 'anonymous'
      }
    );
    
    const variants: ProcessedImageResult['variants'] = [];
    let thumbnail: ProcessedImageResult['thumbnail'] | undefined;
    
    // Process each size and format combination
    for (const size of sizes) {
      for (const format of formats) {
        const quality = options.quality || qualities[format] || 85;
        
        let processedImage = sharp(imageBuffer);
        
        // Apply size constraints based on type
        if (config.crop === 'square') {
          processedImage = processedImage.resize(size, size, {
            fit: 'cover',
            position: 'center'
          });
        } else if (config.crop === 'fit') {
          processedImage = processedImage.resize(size, size, {
            fit: 'inside',
            withoutEnlargement: true
          });
        } else {
          processedImage = processedImage.resize(size, null, {
            withoutEnlargement: true
          });
        }
        
        // Apply format-specific optimizations
        switch (format) {
          case 'jpeg':
            processedImage = processedImage.jpeg({
              quality,
              progressive: true,
              mozjpeg: true
            });
            break;
          case 'webp':
            processedImage = processedImage.webp({
              quality,
              effort: 6,
              lossless: false
            });
            break;
          case 'avif':
            processedImage = processedImage.avif({
              quality,
              effort: 6,
              lossless: false
            });
            break;
          case 'png':
            processedImage = processedImage.png({
              quality,
              progressive: true,
              compressionLevel: 9
            });
            break;
        }
        
        // Remove metadata unless explicitly preserved
        if (!options.preserveMetadata) {
          processedImage = processedImage.removeProfile();
        }
        
        const { data: processedBuffer, info } = await processedImage.toBuffer({ resolveWithObject: true });
        
        // Upload processed image
        const filename = generateFilename(options.type, `${size}x${size}`, format, options.userId);
        await minioClient.putObject(
          BUCKETS.processed,
          filename,
          processedBuffer,
          processedBuffer.length,
          {
            'Content-Type': `image/${format}`,
            'X-Original-Size': originalSize.toString(),
            'X-Processed-Size': processedBuffer.length.toString(),
            'X-Width': info.width.toString(),
            'X-Height': info.height.toString(),
            'X-Quality': quality.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        );
        
        variants.push({
          url: `${process.env.CDN_BASE_URL || 'https://api.cryb.ai'}/cdn/${BUCKETS.processed}/${filename}`,
          size: processedBuffer.length,
          width: info.width,
          height: info.height,
          format,
          quality
        });
        
        // Generate thumbnail for the first small size
        if (!thumbnail && size === sizes[0] && format === 'webp') {
          const thumbBuffer = await sharp(imageBuffer)
            .resize(150, 150, {
              fit: 'cover',
              position: 'center'
            })
            .webp({ quality: 75 })
            .toBuffer();
          
          const thumbFilename = generateFilename(options.type, 'thumb', 'webp', options.userId);
          await minioClient.putObject(
            BUCKETS.thumbnails,
            thumbFilename,
            thumbBuffer,
            thumbBuffer.length,
            {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          );
          
          thumbnail = {
            url: `${process.env.CDN_BASE_URL || 'https://api.cryb.ai'}/cdn/${BUCKETS.thumbnails}/${thumbFilename}`,
            size: thumbBuffer.length,
            width: 150,
            height: 150,
            format: 'webp'
          };
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    const totalProcessedSize = variants.reduce((sum, v) => sum + v.size, 0);
    
    const result: ProcessedImageResult = {
      original: {
        url: `${process.env.CDN_BASE_URL || 'https://api.cryb.ai'}/cdn/${BUCKETS.original}/${originalFilename}`,
        size: originalSize,
        format: originalFormat || 'unknown',
        width: originalWidth,
        height: originalHeight
      },
      variants,
      thumbnail,
      metadata: {
        originalSize,
        compressionRatio: totalProcessedSize / originalSize,
        processingTime
      }
    };
    
    imageProcessor.emit('image_processed', {
      type: options.type,
      userId: options.userId,
      result,
      processingTime
    });
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    imageProcessor.emit('processing_error', {
      error: error.message,
      type: options.type,
      userId: options.userId
    });
    throw error;
  }
}

function generateFilename(type: string, variant: string, format: string, userId?: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const userPrefix = userId ? `${userId}/` : '';
  return `${userPrefix}${type}/${timestamp}-${randomId}-${variant}.${format}`;
}

export async function generateAvatar(username: string, options: {
  userId?: string;
  size?: number;
  colors?: { start: string; end: string };
} = {}): Promise<ProcessedImageResult> {
  await imageProcessor.waitForInitialization();
  
  const { size = 512, colors = { start: '#4e7abf', end: '#8467c5' } } = options;
  const initials = username.slice(0, 2).toUpperCase();
  
  // Generate SVG avatar
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#gradient)"/>
      <text x="50%" y="50%" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            font-size="${size * 0.4}" font-weight="600" fill="white" 
            text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `;
  
  // Convert SVG to PNG buffer
  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  
  // Process avatar with standard pipeline
  return await processImage(pngBuffer, {
    type: 'avatar',
    userId: options.userId,
    preserveMetadata: false
  });
}

export async function optimizeImageForWeb(buffer: Buffer, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  removeMetadata?: boolean;
  sharpen?: boolean;
} = {}): Promise<{ buffer: Buffer; metadata: any }> {
  const { 
    width, 
    height, 
    quality = 85, 
    format = 'webp',
    progressive = true,
    removeMetadata = true,
    sharpen = false
  } = options;
  
  let pipeline = sharp(buffer);
  
  // Resize if dimensions specified
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3
    });
  }
  
  // Apply sharpening if requested
  if (sharpen) {
    pipeline = pipeline.sharpen({ sigma: 1, m1: 0.5, m2: 2, x1: 2, y2: 10, y3: 20 });
  }
  
  // Remove metadata
  if (removeMetadata) {
    pipeline = pipeline.removeProfile();
  }
  
  // Apply format-specific optimizations
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality,
        progressive,
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true
      });
      break;
    case 'png':
      pipeline = pipeline.png({
        quality,
        progressive,
        compressionLevel: 9,
        palette: true
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({
        quality,
        effort: 6,
        lossless: false,
        smartSubsample: true
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({
        quality,
        effort: 6,
        lossless: false,
        chromaSubsampling: '4:2:0'
      });
      break;
  }
  
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  
  return {
    buffer: data,
    metadata: info
  };
}

// Batch processing for multiple images
export async function batchProcessImages(
  images: Array<{ buffer: Buffer; type: ProcessImageOptions['type']; userId?: string }>
): Promise<ProcessedImageResult[]> {
  const results = await Promise.allSettled(
    images.map(({ buffer, type, userId }) => 
      processImage(buffer, { type, userId })
    )
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<ProcessedImageResult> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

// Enhanced image analysis and processing functions
export async function analyzeImage(buffer: Buffer): Promise<{
  dimensions: { width: number; height: number };
  format: string;
  size: number;
  hasAlpha: boolean;
  colorspace: string;
  quality?: number;
  isAnimated?: boolean;
}> {
  const metadata = await sharp(buffer).metadata();
  const stats = await sharp(buffer).stats();
  
  return {
    dimensions: {
      width: metadata.width || 0,
      height: metadata.height || 0
    },
    format: metadata.format || 'unknown',
    size: buffer.length,
    hasAlpha: metadata.hasAlpha || false,
    colorspace: metadata.space || 'unknown',
    quality: metadata.quality,
    isAnimated: (metadata.pages || 0) > 1
  };
}

export async function createImageVariants(
  buffer: Buffer,
  variants: Array<{
    name: string;
    width?: number;
    height?: number;
    format: 'jpeg' | 'webp' | 'avif' | 'png';
    quality?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  }>
): Promise<Array<{ name: string; buffer: Buffer; size: number; metadata: any }>> {
  const results = await Promise.all(
    variants.map(async (variant) => {
      let pipeline = sharp(buffer);
      
      if (variant.width || variant.height) {
        pipeline = pipeline.resize(variant.width, variant.height, {
          fit: variant.fit || 'inside',
          withoutEnlargement: true
        });
      }
      
      const quality = variant.quality || 85;
      
      switch (variant.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality, effort: 6 });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality, effort: 6 });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, progressive: true });
          break;
      }
      
      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
      
      return {
        name: variant.name,
        buffer: data,
        size: data.length,
        metadata: info
      };
    })
  );
  
  return results;
}

// Image processing queue integration
export async function queueImageProcessing(
  imageUrl: string,
  options: ProcessImageOptions
): Promise<{ jobId: string }> {
  const job = await addImageJob({
    url: imageUrl,
    type: options.type,
    userId: options.userId,
    customSizes: options.customSizes,
    quality: options.quality,
    generateWebP: options.generateWebP,
    generateAVIF: options.generateAVIF
  });
  
  return { jobId: job.id || 'unknown' };
}

// Export the image processor instance for external use
export { imageProcessor };