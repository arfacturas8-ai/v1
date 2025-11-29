const express = require('express');
const { Registry, Counter, Gauge } = require('prom-client');
const winston = require('winston');
const Redis = require('ioredis');
const cron = require('node-cron');

const PORT = process.env.PORT || 9472;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6380;

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console({ format: winston.format.simple() })] });

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const register = new Registry();
const threatsDetected = new Counter({ name: 'security_threats_detected_total', help: 'Total number of security threats detected', labelNames: ['type'], registers: [register] });
const threatsMitigated = new Counter({ name: 'security_threats_mitigated_total', help: 'Total number of threats mitigated', labelNames: ['type', 'action'], registers: [register] });
const ipsBanned = new Gauge({ name: 'security_ips_banned_total', help: 'Total number of banned IP addresses', registers: [register] });

async function checkThreats() {
  try {
    const failedLogins = await redis.hgetall('failed_logins');
    for (const [ip, count] of Object.entries(failedLogins)) {
      const attempts = parseInt(count);
      if (attempts >= 10) {
        logger.warn(`Banning IP ${ip} due to ${attempts} failed login attempts`);
        await redis.sadd('banned_ips', ip);
        await redis.hdel('failed_logins', ip);
        threatsDetected.inc({ type: 'brute_force' });
        threatsMitigated.inc({ type: 'brute_force', action: 'ban_ip' });
      }
    }
    const bannedIps = await redis.scard('banned_ips');
    ipsBanned.set(bannedIps);
  } catch (error) {
    logger.error('Error in threat detection:', error);
  }
}

cron.schedule('* * * * *', checkThreats);

const app = express();
app.use(express.json());
app.post('/report', async (req, res) => { const { type, ip, details } = req.body; logger.warn(`Threat reported: ${type} from ${ip}`, details); threatsDetected.inc({ type }); if (type === 'ddos' || type === 'brute_force') { await redis.sadd('banned_ips', ip); threatsMitigated.inc({ type, action: 'ban_ip' }); } res.json({ success: true, action: 'logged' }); });
app.post('/unban', async (req, res) => { const { ip } = req.body; await redis.srem('banned_ips', ip); logger.info(`IP ${ip} unbanned`); res.json({ success: true }); });
app.get('/banned-ips', async (req, res) => { const ips = await redis.smembers('banned_ips'); res.json({ ips }); });
app.get('/metrics', async (req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.get('/health', (req, res) => { res.json({ status: 'healthy', service: 'security-automation' }); });

app.listen(PORT, () => { logger.info(`Security Automation Service listening on port ${PORT}`); logger.info('Threat detection cron job started (every minute)'); });
