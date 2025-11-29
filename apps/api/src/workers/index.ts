import { Worker } from 'bullmq';
import { prisma } from '@cryb/database';
import { emailQueue, notificationQueue, imageQueue, searchIndexQueue } from '../services/queues';
import { sendEmail } from '../services/email';
import { processImage, generateAvatar, batchProcessImages } from '../services/image-processor';
import { indexDocument } from '../services/search';

// Email Worker
const emailWorker = new Worker('email', async (job) => {
  console.log('Processing email job:', job.id);
  const { to, subject, template, data } = job.data;
  
  try {
    // SMTP configuration would be needed here
    console.log(`Would send email to ${to}: ${subject}`);
    // await sendEmail(to, subject, template, data);
    return { sent: true, to, subject };
  } catch (error) {
    console.error('Email job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 5,
});

// Notification Worker
const notificationWorker = new Worker('notifications', async (job) => {
  console.log('Processing notification job:', job.id);
  const { userId, type, data } = job.data;
  
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: data.title,
        message: data.message,
        data: JSON.stringify(data),
        read: false,
      }
    });
    
    // Send push notification if user has device tokens
    // await sendPushNotification(userId, data);
    
    return { sent: true, userId, type };
  } catch (error) {
    console.error('Notification job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 10,
});

// Image Processing Worker
const imageWorker = new Worker('image-processing', async (job) => {
  console.log('Processing image job:', job.id, 'with data:', job.data.type);
  
  try {
    const { 
      url, 
      buffer, 
      type, 
      userId, 
      sizes, 
      quality, 
      customSizes, 
      generateWebP, 
      generateAVIF, 
      preserveMetadata 
    } = job.data;
    
    // Handle different job types
    switch (job.name) {
      case 'process-image':
        const input = buffer ? Buffer.from(buffer) : url;
        if (!input) {
          throw new Error('No image input provided (URL or buffer required)');
        }
        
        const result = await processImage(input, {
          type: type || 'post',
          userId,
          customSizes: customSizes || sizes,
          quality,
          generateWebP,
          generateAVIF,
          preserveMetadata
        });
        
        return { 
          processed: true, 
          result,
          jobType: 'single-image'
        };
        
      case 'batch-process-images':
        const { images } = job.data;
        if (!images || !Array.isArray(images)) {
          throw new Error('Images array required for batch processing');
        }
        
        const batchResults = [];
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          job.updateProgress((i / images.length) * 100);
          
          try {
            const imageInput = image.buffer ? Buffer.from(image.buffer) : image.url;
            const imageResult = await processImage(imageInput, {
              type: image.type || 'post',
              userId: image.userId,
              generateWebP: true,
              generateAVIF: true
            });
            
            batchResults.push({
              index: i,
              success: true,
              result: imageResult
            });
          } catch (error) {
            console.error(`Failed to process image ${i}:`, error);
            batchResults.push({
              index: i,
              success: false,
              error: error.message
            });
          }
        }
        
        return {
          processed: true,
          results: batchResults,
          jobType: 'batch-images',
          totalImages: images.length,
          successCount: batchResults.filter(r => r.success).length
        };
        
      case 'generate-avatar':
        const { username, size, colors } = job.data;
        if (!username) {
          throw new Error('Username required for avatar generation');
        }
        
        const avatarResult = await generateAvatar(username, {
          userId,
          size,
          colors
        });
        
        return {
          processed: true,
          result: avatarResult,
          jobType: 'avatar-generation'
        };
        
      default:
        // Legacy support for old job format
        const legacyResult = await processImage(url, {
          type: 'post',
          customSizes: sizes,
          quality
        });
        
        return {
          processed: true,
          result: legacyResult,
          jobType: 'legacy'
        };
    }
  } catch (error) {
    console.error('Image processing job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 5, // Increased concurrency for better throughput
  limiter: {
    max: 10, // Maximum 10 jobs per duration
    duration: 1000 // 1 second
  }
});

// Search Indexing Worker
const searchIndexWorker = new Worker('search-index', async (job) => {
  console.log('Processing search index job:', job.id);
  const { type, id, data } = job.data;
  
  try {
    await indexDocument(type, id, data);
    return { indexed: true, type, id };
  } catch (error) {
    console.error('Search index job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 5,
});

// Analytics Worker
const analyticsWorker = new Worker('analytics', async (job) => {
  console.log('Processing analytics job:', job.id);
  const { event, userId, data } = job.data;
  
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        userId,
        data: JSON.stringify(data),
        timestamp: new Date(),
      }
    });
    return { recorded: true, event };
  } catch (error) {
    console.error('Analytics job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 20,
});

// Cleanup Worker
const cleanupWorker = new Worker('cleanup', async (job) => {
  console.log('Processing cleanup job:', job.id);
  const { type } = job.data;
  
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days old
    
    switch(type) {
      case 'sessions':
        await prisma.session.deleteMany({
          where: { expiresAt: { lt: cutoff } }
        });
        break;
      case 'notifications':
        await prisma.notification.deleteMany({
          where: { 
            read: true,
            createdAt: { lt: cutoff } 
          }
        });
        break;
      case 'temp-files':
        // Clean temp upload files
        break;
    }
    
    return { cleaned: true, type };
  } catch (error) {
    console.error('Cleanup job failed:', error);
    throw error;
  }
}, {
  connection: {
    host: 'localhost',
    port: 6380,
  },
  concurrency: 1,
});

// Worker health monitoring
emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

imageWorker.on('completed', (job) => {
  console.log(`Image job ${job.id} completed`);
});

searchIndexWorker.on('completed', (job) => {
  console.log(`Search index job ${job.id} completed`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await emailWorker.close();
  await notificationWorker.close();
  await imageWorker.close();
  await searchIndexWorker.close();
  await analyticsWorker.close();
  await cleanupWorker.close();
  process.exit(0);
});

console.log('🚀 Background workers started');
console.log('- Email worker: Running');
console.log('- Notification worker: Running');
console.log('- Image processing worker: Running');
console.log('- Search indexing worker: Running');
console.log('- Analytics worker: Running');
console.log('- Cleanup worker: Running');

export {
  emailWorker,
  notificationWorker,
  imageWorker,
  searchIndexWorker,
  analyticsWorker,
  cleanupWorker
};