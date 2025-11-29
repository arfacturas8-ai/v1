const express = require('express');
const { Registry, Counter, Gauge } = require('prom-client');
const winston = require('winston');
const Redis = require('ioredis');

const PORT = process.env.PORT || 9470;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6380;

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console({ format: winston.format.simple() })] });

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const register = new Registry();
const errorsTotal = new Counter({ name: 'application_errors_total', help: 'Total number of application errors', labelNames: ['service', 'severity', 'type'], registers: [register] });
const errorRate = new Gauge({ name: 'application_error_rate', help: 'Error rate per minute', labelNames: ['service'], registers: [register] });

const errors = [];

const app = express();
app.use(express.json());

app.post('/log', (req, res) => {
  const { service, severity, type, message, stack, metadata } = req.body;
  const error = { timestamp: new Date().toISOString(), service, severity: severity || 'error', type: type || 'UnknownError', message, stack, metadata };
  errors.push(error);
  errorsTotal.inc({ service, severity: error.severity, type: error.type });
  logger.error('Error logged:', error);
  redis.lpush('errors', JSON.stringify(error));
  redis.ltrim('errors', 0, 999);
  res.json({ success: true });
});

app.get('/errors', async (req, res) => { const limit = parseInt(req.query.limit) || 100; const recentErrors = errors.slice(-limit); res.json(recentErrors); });
app.get('/metrics', async (req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.get('/health', (req, res) => { res.json({ status: 'healthy', service: 'error-tracking', errorCount: errors.length }); });

app.listen(PORT, () => { logger.info(`Error Tracking Service listening on port ${PORT}`); });
