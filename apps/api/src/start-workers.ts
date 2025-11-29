import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6380,
  maxRetriesPerRequest: null,
});

// Simple notification worker
const notificationWorker = new Worker('notifications', async (job) => {
  console.log(`Processing notification: ${job.id}`, job.data);
  // Process notification
  return { success: true };
}, { connection });

// Simple email worker (SMTP to be configured)
const emailWorker = new Worker('email', async (job) => {
  console.log(`Email job (SMTP not configured): ${job.id}`, job.data);
  // Email would be sent here when SMTP is configured
  return { success: true, note: 'SMTP configuration needed' };
}, { connection });

// Simple analytics worker
const analyticsWorker = new Worker('analytics', async (job) => {
  console.log(`Analytics event: ${job.id}`, job.data);
  return { success: true };
}, { connection });

// Simple cleanup worker
const cleanupWorker = new Worker('cleanup', async (job) => {
  console.log(`Cleanup job: ${job.id}`, job.data);
  return { success: true };
}, { connection });

console.log('✅ Workers started:');
console.log('- Notification worker');
console.log('- Email worker (awaiting SMTP config)');
console.log('- Analytics worker');
console.log('- Cleanup worker');

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await notificationWorker.close();
  await emailWorker.close();
  await analyticsWorker.close();
  await cleanupWorker.close();
  process.exit(0);
});