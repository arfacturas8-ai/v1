import { Worker } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';
import { MessagesWorker } from './workers/messages.worker';
import { NotificationsWorker } from './workers/notifications.worker';
import { MediaWorker } from './workers/media.worker';
import { AnalyticsWorker } from './workers/analytics.worker';
import { ModerationWorker } from './workers/moderation.worker';
import { BlockchainWorker } from './workers/blockchain.worker';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  password: process.env.REDIS_PASSWORD || 'cryb_redis_password'
};

async function startWorkers() {
  logger.info('🚀 Starting CRYB Worker Services...');

  const workers = [
    new MessagesWorker(connection, logger),
    new NotificationsWorker(connection, logger),
    new MediaWorker(connection, logger),
    new AnalyticsWorker(connection, logger),
    new ModerationWorker(connection, logger),
    new BlockchainWorker(connection, logger)
  ];

  // Start all workers
  await Promise.all(workers.map(worker => worker.start()));

  logger.info('✅ All workers started successfully');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down workers...');
    await Promise.all(workers.map(worker => worker.stop()));
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down workers...');
    await Promise.all(workers.map(worker => worker.stop()));
    process.exit(0);
  });
}

startWorkers().catch(error => {
  logger.error('Failed to start workers:', error);
  process.exit(1);
});