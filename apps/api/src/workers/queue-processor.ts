import { Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Create connection with proper BullMQ configuration
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  // Only add password if it's set in environment to avoid Redis warnings
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
};

// Create connection with conditional password handling
const connection = new Redis(redisOptions);

// Email Worker
const emailWorker = new Worker('email', async job => {
  console.log(`Processing email job ${job.id}:`, job.data);
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { sent: true, timestamp: new Date() };
}, { connection });

// Notification Worker
const notificationWorker = new Worker('notifications', async job => {
  console.log(`Processing notification job ${job.id}:`, job.data);
  // Process notification
  return { delivered: true };
}, { connection });

// Media Processing Worker
const mediaWorker = new Worker('media', async job => {
  console.log(`Processing media job ${job.id}:`, job.data);
  // Process media (thumbnails, optimization, etc.)
  return { processed: true };
}, { connection });

// Analytics Worker
const analyticsWorker = new Worker('analytics', async job => {
  console.log(`Processing analytics job ${job.id}:`, job.data);
  // Aggregate analytics data
  return { aggregated: true };
}, { connection });

// Messages Worker
const messagesWorker = new Worker('messages', async job => {
  console.log(`Processing message job ${job.id}:`, job.data);
  // Process message delivery
  return { delivered: true };
}, { connection });

// Moderation Worker
const moderationWorker = new Worker('moderation', async job => {
  console.log(`Processing moderation job ${job.id}:`, job.data);
  // Run moderation checks
  return { moderated: true };
}, { connection });

// Blockchain Worker
const blockchainWorker = new Worker('blockchain', async job => {
  console.log(`Processing blockchain job ${job.id}:`, job.data);
  // Process blockchain operations
  return { processed: true };
}, { connection });

// Error handling
[emailWorker, notificationWorker, mediaWorker, analyticsWorker, messagesWorker, moderationWorker, blockchainWorker].forEach(worker => {
  worker.on('completed', job => {
    console.log(`✅ Job ${job.id} completed in queue ${job.queueName}`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed in queue ${job?.queueName}:`, err);
  });
});

console.log('🚀 Queue workers started successfully');
console.log('📬 Processing queues: email, notifications, media, analytics, messages, moderation, blockchain');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    emailWorker.close(),
    notificationWorker.close(),
    mediaWorker.close(),
    analyticsWorker.close(),
    messagesWorker.close(),
    moderationWorker.close(),
    blockchainWorker.close()
  ]);
  process.exit(0);
});