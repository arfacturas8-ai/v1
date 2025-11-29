const express = require('express');
const { Registry, Gauge } = require('prom-client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const winston = require('winston');

const PORT = process.env.PORT || 9467;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6380;

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console({ format: winston.format.simple() })] });

const register = new Registry();
const queueJobsWaiting = new Gauge({ name: 'bullmq_queue_jobs_waiting', help: 'Number of jobs waiting in queue', labelNames: ['queue'], registers: [register] });
const queueJobsActive = new Gauge({ name: 'bullmq_queue_jobs_active', help: 'Number of jobs currently processing', labelNames: ['queue'], registers: [register] });
const queueJobsCompleted = new Gauge({ name: 'bullmq_queue_jobs_completed', help: 'Number of completed jobs', labelNames: ['queue'], registers: [register] });
const queueJobsFailed = new Gauge({ name: 'bullmq_queue_jobs_failed', help: 'Number of failed jobs', labelNames: ['queue'], registers: [register] });
const queueJobsDelayed = new Gauge({ name: 'bullmq_queue_jobs_delayed', help: 'Number of delayed jobs', labelNames: ['queue'], registers: [register] });

const connection = new Redis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null });

const QUEUE_NAMES = ['messages', 'media', 'email', 'notifications', 'analytics', 'moderation', 'blockchain'];

const queues = QUEUE_NAMES.map(name => new Queue(name, { connection }));

async function collectMetrics() {
  for (const queue of queues) {
    try {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
      queueJobsWaiting.set({ queue: queue.name }, counts.waiting || 0);
      queueJobsActive.set({ queue: queue.name }, counts.active || 0);
      queueJobsCompleted.set({ queue: queue.name }, counts.completed || 0);
      queueJobsFailed.set({ queue: queue.name }, counts.failed || 0);
      queueJobsDelayed.set({ queue: queue.name }, counts.delayed || 0);
    } catch (error) {
      logger.error('Error collecting metrics for queue', queue.name, error);
    }
  }
}

const app = express();
app.get('/metrics', async (req, res) => { try { await collectMetrics(); res.set('Content-Type', register.contentType); res.end(await register.metrics()); } catch (error) { logger.error('Error generating metrics:', error); res.status(500).end(); } });
app.get('/health', (req, res) => { res.json({ status: 'healthy', service: 'bullmq-exporter' }); });

app.listen(PORT, () => { logger.info('BullMQ Exporter listening on port ' + PORT); logger.info('Monitoring queues: ' + QUEUE_NAMES.join(', ')); });
