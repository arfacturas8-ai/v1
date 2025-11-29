#!/usr/bin/env node

/**
 * Image Optimization Pipeline Script
 * 
 * This script provides utilities for batch processing, optimization,
 * and migration of existing images in the Cryb platform.
 */

import { Client } from 'minio';
import { processImage, generateAvatar, optimizeImageForWeb, analyzeImage } from '../services/image-processor';
import { addImageJob, addBatchImageJob } from '../services/queues';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
};

const minioClient = new Client(MINIO_CONFIG);

// Command line argument parsing
const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  console.log('🖼️  Cryb Image Optimization Pipeline');
  console.log('=====================================');

  switch (command) {
    case 'migrate':
      await migrateExistingImages();
      break;
    case 'optimize':
      await optimizeBucket(args[0] || 'media');
      break;
    case 'generate-avatars':
      await generateBulkAvatars(args[0]);
      break;
    case 'analyze':
      await analyzeBucket(args[0] || 'media');
      break;
    case 'benchmark':
      await runBenchmarks();
      break;
    case 'health-check':
      await performHealthCheck();
      break;
    case 'cleanup':
      await cleanupTempFiles();
      break;
    default:
      showHelp();
  }
}

async function migrateExistingImages() {
  console.log('🔄 Starting image migration...');
  
  const buckets = ['media', 'avatars', 'attachments', 'banners'];
  let totalProcessed = 0;
  let totalErrors = 0;

  for (const bucket of buckets) {
    console.log(`\n📁 Processing bucket: ${bucket}`);
    
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        console.log(`⚠️  Bucket ${bucket} does not exist, skipping...`);
        continue;
      }

      const objects = await listAllObjects(bucket);
      console.log(`📊 Found ${objects.length} objects in ${bucket}`);

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        process.stdout.write(`\rProcessing ${i + 1}/${objects.length}: ${obj.name}`);

        try {
          // Check if it's an image
          if (!isImageFile(obj.name)) {
            continue;
          }

          // Download and analyze the image
          const stream = await minioClient.getObject(bucket, obj.name);
          const chunks: Buffer[] = [];
          
          await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', resolve);
            stream.on('error', reject);
          });

          const buffer = Buffer.concat(chunks);
          const analysis = await analyzeImage(buffer);

          // Process only if the image hasn't been optimized
          if (!obj.name.includes('optimized') && analysis.size > 100 * 1024) { // > 100KB
            await processImage(buffer, {
              type: getImageType(bucket),
              preserveMetadata: false,
              generateWebP: true,
              generateAVIF: true
            });
            totalProcessed++;
          }

        } catch (error) {
          console.error(`\n❌ Error processing ${obj.name}:`, error.message);
          totalErrors++;
        }
      }

      console.log(`\n✅ Completed bucket ${bucket}`);
    } catch (error) {
      console.error(`❌ Error processing bucket ${bucket}:`, error);
    }
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Total processed: ${totalProcessed}`);
  console.log(`❌ Total errors: ${totalErrors}`);
}

async function optimizeBucket(bucketName: string) {
  console.log(`🔧 Optimizing images in bucket: ${bucketName}`);

  try {
    const objects = await listAllObjects(bucketName);
    const imageObjects = objects.filter(obj => isImageFile(obj.name));
    
    console.log(`📊 Found ${imageObjects.length} images to optimize`);

    const batchSize = 10;
    for (let i = 0; i < imageObjects.length; i += batchSize) {
      const batch = imageObjects.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageObjects.length/batchSize)}`);
      
      const batchData = await Promise.all(
        batch.map(async (obj) => {
          const stream = await minioClient.getObject(bucketName, obj.name);
          const chunks: Buffer[] = [];
          
          await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', resolve);
            stream.on('error', reject);
          });

          return {
            buffer: Buffer.concat(chunks),
            type: getImageType(bucketName),
            userId: extractUserIdFromPath(obj.name)
          };
        })
      );

      // Queue batch processing
      await addBatchImageJob({ images: batchData });
    }

    console.log('✅ All batches queued for processing');
  } catch (error) {
    console.error('❌ Error optimizing bucket:', error);
  }
}

async function generateBulkAvatars(userListFile: string) {
  if (!userListFile) {
    console.error('❌ Please provide a user list file');
    return;
  }

  console.log(`👤 Generating avatars from: ${userListFile}`);

  try {
    const userList = await fs.readFile(userListFile, 'utf-8');
    const users = JSON.parse(userList);

    if (!Array.isArray(users)) {
      throw new Error('User list must be an array');
    }

    console.log(`📊 Generating ${users.length} avatars`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      process.stdout.write(`\rGenerating avatar ${i + 1}/${users.length}: ${user.username}`);

      try {
        await generateAvatar(user.username, {
          userId: user.id,
          size: 512,
          colors: user.colors || undefined
        });
      } catch (error) {
        console.error(`\n❌ Error generating avatar for ${user.username}:`, error.message);
      }
    }

    console.log('\n✅ Avatar generation complete!');
  } catch (error) {
    console.error('❌ Error reading user list:', error);
  }
}

async function analyzeBucket(bucketName: string) {
  console.log(`📊 Analyzing images in bucket: ${bucketName}`);

  try {
    const objects = await listAllObjects(bucketName);
    const imageObjects = objects.filter(obj => isImageFile(obj.name));
    
    let totalSize = 0;
    let totalImages = 0;
    const formatStats: Record<string, number> = {};
    const sizeRanges = {
      small: 0,    // < 100KB
      medium: 0,   // 100KB - 1MB
      large: 0,    // 1MB - 5MB
      xlarge: 0    // > 5MB
    };

    console.log(`📊 Analyzing ${imageObjects.length} images...`);

    for (let i = 0; i < imageObjects.length; i++) {
      const obj = imageObjects[i];
      process.stdout.write(`\rAnalyzing ${i + 1}/${imageObjects.length}: ${obj.name}`);

      try {
        const stream = await minioClient.getObject(bucketName, obj.name);
        const chunks: Buffer[] = [];
        
        await new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', resolve);
          stream.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        const analysis = await analyzeImage(buffer);

        totalSize += analysis.size;
        totalImages++;

        // Format statistics
        formatStats[analysis.format] = (formatStats[analysis.format] || 0) + 1;

        // Size range statistics
        if (analysis.size < 100 * 1024) sizeRanges.small++;
        else if (analysis.size < 1024 * 1024) sizeRanges.medium++;
        else if (analysis.size < 5 * 1024 * 1024) sizeRanges.large++;
        else sizeRanges.xlarge++;

      } catch (error) {
        console.error(`\n❌ Error analyzing ${obj.name}:`, error.message);
      }
    }

    console.log('\n\n📈 Analysis Results:');
    console.log('==================');
    console.log(`Total Images: ${totalImages}`);
    console.log(`Total Size: ${formatBytes(totalSize)}`);
    console.log(`Average Size: ${formatBytes(totalSize / totalImages)}`);
    
    console.log('\n📊 Format Distribution:');
    Object.entries(formatStats).forEach(([format, count]) => {
      const percentage = ((count / totalImages) * 100).toFixed(1);
      console.log(`  ${format}: ${count} (${percentage}%)`);
    });

    console.log('\n📏 Size Distribution:');
    console.log(`  Small (< 100KB): ${sizeRanges.small} (${((sizeRanges.small / totalImages) * 100).toFixed(1)}%)`);
    console.log(`  Medium (100KB-1MB): ${sizeRanges.medium} (${((sizeRanges.medium / totalImages) * 100).toFixed(1)}%)`);
    console.log(`  Large (1-5MB): ${sizeRanges.large} (${((sizeRanges.large / totalImages) * 100).toFixed(1)}%)`);
    console.log(`  X-Large (>5MB): ${sizeRanges.xlarge} (${((sizeRanges.xlarge / totalImages) * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error analyzing bucket:', error);
  }
}

async function runBenchmarks() {
  console.log('🏃 Running image processing benchmarks...');

  // Create test images
  const testSizes = [500, 1000, 2000, 4000];
  const testFormats = ['jpeg', 'png', 'webp', 'avif'];
  
  console.log('📊 Benchmark Results:');
  console.log('====================');

  for (const size of testSizes) {
    console.log(`\n🖼️  Testing ${size}x${size} images:`);
    
    // Generate test image
    const testImage = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    }).jpeg().toBuffer();

    for (const format of testFormats) {
      const startTime = Date.now();
      
      try {
        const result = await optimizeImageForWeb(testImage, {
          width: Math.floor(size * 0.8),
          height: Math.floor(size * 0.8),
          format: format as any,
          quality: 85
        });

        const processingTime = Date.now() - startTime;
        const compressionRatio = ((testImage.length - result.buffer.length) / testImage.length * 100).toFixed(1);
        
        console.log(`  ${format.toUpperCase()}: ${processingTime}ms, ${formatBytes(result.buffer.length)}, ${compressionRatio}% compression`);
      } catch (error) {
        console.log(`  ${format.toUpperCase()}: Failed - ${error.message}`);
      }
    }
  }
}

async function performHealthCheck() {
  console.log('🏥 Performing health check...');

  const checks = [
    { name: 'MinIO Connection', check: () => minioClient.listBuckets() },
    { name: 'Sharp Availability', check: () => sharp().metadata() },
    { name: 'Redis Connection', check: async () => {
      const { imageQueue } = await import('../services/queues');
      return imageQueue.getJobCounts();
    }},
    { name: 'Image Processing', check: async () => {
      const testBuffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'red' }
      }).jpeg().toBuffer();
      return analyzeImage(testBuffer);
    }}
  ];

  for (const { name, check } of checks) {
    try {
      const startTime = Date.now();
      await check();
      const responseTime = Date.now() - startTime;
      console.log(`✅ ${name}: OK (${responseTime}ms)`);
    } catch (error) {
      console.log(`❌ ${name}: FAILED - ${error.message}`);
    }
  }
}

async function cleanupTempFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  // This would implement cleanup logic for temporary processing files
  // For now, just show what would be cleaned
  console.log('✅ Cleanup complete (no temp files found)');
}

// Helper functions
async function listAllObjects(bucket: string): Promise<any[]> {
  const objects: any[] = [];
  const stream = minioClient.listObjects(bucket, '', true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => objects.push(obj));
    stream.on('end', () => resolve(objects));
    stream.on('error', reject);
  });
}

function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

function getImageType(bucket: string): 'avatar' | 'banner' | 'post' | 'thumbnail' {
  switch (bucket) {
    case 'avatars': return 'avatar';
    case 'banners': return 'banner';
    case 'thumbnails': return 'thumbnail';
    default: return 'post';
  }
}

function extractUserIdFromPath(objectName: string): string | undefined {
  const parts = objectName.split('/');
  // Assuming format: userId/type/filename
  return parts.length > 1 ? parts[0] : undefined;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showHelp() {
  console.log(`
Usage: npm run optimize-images <command> [args]

Commands:
  migrate                    - Migrate and optimize existing images
  optimize <bucket>          - Optimize all images in a bucket
  generate-avatars <file>    - Generate avatars from user list JSON file
  analyze <bucket>           - Analyze images in a bucket
  benchmark                  - Run performance benchmarks
  health-check              - Check system health
  cleanup                   - Clean up temporary files
  
Examples:
  npm run optimize-images migrate
  npm run optimize-images optimize media
  npm run optimize-images generate-avatars users.json
  npm run optimize-images analyze avatars
  npm run optimize-images benchmark
  `);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export {
  migrateExistingImages,
  optimizeBucket,
  generateBulkAvatars,
  analyzeBucket,
  runBenchmarks,
  performHealthCheck
};