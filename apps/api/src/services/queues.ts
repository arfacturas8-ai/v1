import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis({
  host: 'localhost',
  port: 6380,
  maxRetriesPerRequest: null,
});

// Define queues
export const emailQueue = new Queue('email', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const imageQueue = new Queue('image-processing', { connection });
export const searchIndexQueue = new Queue('search-index', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
export const cleanupQueue = new Queue('cleanup', { connection });

// Queue helper functions
export async function addEmailJob(data: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export async function addNotificationJob(data: {
  userId: string;
  type: string;
  data: any;
}) {
  return notificationQueue.add('send-notification', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

export async function addImageJob(data: {
  url?: string;
  buffer?: Buffer;
  type: 'avatar' | 'banner' | 'post' | 'thumbnail';
  userId?: string;
  sizes?: number[];
  quality?: number;
  customSizes?: number[];
  generateWebP?: boolean;
  generateAVIF?: boolean;
  preserveMetadata?: boolean;
}) {
  return imageQueue.add('process-image', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
}

export async function addBatchImageJob(data: {
  images: Array<{
    url?: string;
    buffer?: Buffer;
    type: 'avatar' | 'banner' | 'post' | 'thumbnail';
    userId?: string;
  }>;
}) {
  return imageQueue.add('batch-process-images', data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 5,
    removeOnFail: 3,
  });
}

export async function addAvatarGenerationJob(data: {
  username: string;
  userId: string;
  size?: number;
  colors?: { start: string; end: string };
}) {
  return imageQueue.add('generate-avatar', data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
}

export async function addSearchIndexJob(data: {
  type: string;
  id: string;
  data: any;
}) {
  return searchIndexQueue.add('index-document', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

export async function addAnalyticsJob(data: {
  event: string;
  userId?: string;
  data: any;
}) {
  return analyticsQueue.add('track-event', data, {
    attempts: 1,
  });
}

export async function addCleanupJob(type: string) {
  return cleanupQueue.add('cleanup', { type }, {
    attempts: 1,
    repeat: {
      cron: '0 3 * * *', // Run at 3 AM daily
    },
  });
}

// Schedule recurring cleanup jobs
export async function scheduleRecurringJobs() {
  // Clean expired sessions daily
  await cleanupQueue.add('cleanup-sessions', 
    { type: 'sessions' }, 
    {
      repeat: { cron: '0 3 * * *' },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  // Clean old notifications weekly
  await cleanupQueue.add('cleanup-notifications',
    { type: 'notifications' },
    {
      repeat: { cron: '0 4 * * 0' }, // Sunday at 4 AM
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  // Clean temp files daily
  await cleanupQueue.add('cleanup-temp-files',
    { type: 'temp-files' },
    {
      repeat: { cron: '0 2 * * *' }, // 2 AM daily
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ Recurring jobs scheduled');
}

// Queue monitoring
export async function getQueueStats() {
  const stats = {
    email: await emailQueue.getJobCounts(),
    notifications: await notificationQueue.getJobCounts(),
    imageProcessing: await imageQueue.getJobCounts(),
    searchIndex: await searchIndexQueue.getJobCounts(),
    analytics: await analyticsQueue.getJobCounts(),
    cleanup: await cleanupQueue.getJobCounts(),
  };
  
  return stats;
}

export default {
  emailQueue,
  notificationQueue,
  imageQueue,
  searchIndexQueue,
  analyticsQueue,
  cleanupQueue,
  addEmailJob,
  addNotificationJob,
  addImageJob,
  addSearchIndexJob,
  addAnalyticsJob,
  addCleanupJob,
  scheduleRecurringJobs,
  getQueueStats,
};