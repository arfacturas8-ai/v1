import { FastifyInstance } from 'fastify';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function statusRoutes(fastify: FastifyInstance) {
  
  /**
   * Comprehensive system status dashboard
   */
  fastify.get('/status', async (request, reply) => {
    const startTime = Date.now();
    
    // Get all service statuses
    const services = {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
      elasticsearch: 'unknown',
      minio: 'unknown',
      livekit: 'unknown',
      workers: 'unknown'
    };
    
    // Check database
    try {
      await (fastify as any).services.database.prisma.$queryRaw`SELECT 1`;
      services.database = 'healthy';
    } catch {
      services.database = 'unhealthy';
    }
    
    // Check Redis
    try {
      await (fastify as any).services.redis.ping();
      services.redis = 'healthy';
    } catch {
      services.redis = 'unhealthy';
    }
    
    // Check Elasticsearch
    try {
      const { data } = await (fastify as any).axios.get('http://localhost:9200/_cluster/health');
      services.elasticsearch = data.status === 'green' ? 'healthy' : 'degraded';
    } catch {
      services.elasticsearch = 'unhealthy';
    }
    
    // Check MinIO
    try {
      if ((fastify as any).services.minio) {
        await (fastify as any).services.minio.listBuckets();
        services.minio = 'healthy';
      }
    } catch {
      services.minio = 'unhealthy';
    }
    
    // Check LiveKit
    try {
      const { stdout } = await execAsync('ps aux | grep -c "[l]ivekit"');
      services.livekit = parseInt(stdout.trim()) > 0 ? 'healthy' : 'stopped';
    } catch {
      services.livekit = 'unknown';
    }
    
    // Check workers
    try {
      const { stdout } = await execAsync('pm2 list | grep cryb-workers | awk \'{print $9}\'');
      services.workers = stdout.trim() === 'online' ? 'healthy' : 'stopped';
    } catch {
      services.workers = 'unknown';
    }
    
    // System metrics
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Disk usage
    let diskUsage = { total: 0, used: 0, free: 0, percentage: 0 };
    try {
      const { stdout } = await execAsync('df -B1 / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      diskUsage = {
        total: parseInt(parts[1]),
        used: parseInt(parts[2]),
        free: parseInt(parts[3]),
        percentage: parseInt(parts[4])
      };
    } catch {}
    
    // Database stats
    let dbStats = { users: 0, posts: 0, communities: 0, messages: 0 };
    try {
      const prisma = (fastify as any).services.database.prisma;
      const [users, posts, communities] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.community.count()
      ]);
      dbStats = { users, posts, communities, messages: 0 };
    } catch {}
    
    // Active connections
    let connections = { http: 0, websocket: 0, total: 0 };
    try {
      const { stdout } = await execAsync('netstat -an | grep -c ":3002.*ESTABLISHED"');
      connections.http = parseInt(stdout.trim());
    } catch {}
    
    // Response time
    const responseTime = Date.now() - startTime;
    
    // Feature status
    const features = {
      authentication: services.database === 'healthy',
      realtime: services.redis === 'healthy',
      search: services.elasticsearch === 'healthy' || services.elasticsearch === 'degraded',
      fileUpload: services.minio === 'healthy',
      voiceVideo: services.livekit === 'healthy',
      backgroundJobs: services.workers === 'healthy',
      email: false, // Requires SMTP
      ai: false, // Requires OpenAI key
      payments: false, // Requires Transak
      discord: false // Requires bot token
    };
    
    const overallHealth = Object.values(services).every(s => s === 'healthy') ? 'healthy' :
                          Object.values(services).some(s => s === 'unhealthy') ? 'degraded' : 'partial';
    
    reply.header('X-Response-Time', responseTime.toString());
    
    return reply.send({
      status: overallHealth,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services,
      features,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model,
          usage: Math.round(process.cpuUsage().user / 1000000) // Convert to seconds
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          percentage: Math.round((usedMemory / totalMemory) * 100)
        },
        disk: diskUsage
      },
      database: dbStats,
      connections,
      version: {
        api: '1.0.0',
        platform: 'CRYB',
        environment: process.env.NODE_ENV
      }
    });
  });
  
  /**
   * Simple health check
   */
  fastify.get('/health-detailed', async (request, reply) => {
    const checks: any = {};
    
    // Run all checks in parallel
    const checkPromises = [
      (async () => {
        try {
          await (fastify as any).services.database.prisma.$queryRaw`SELECT 1`;
          checks.database = { status: 'pass', message: 'Connected' };
        } catch (error: any) {
          checks.database = { status: 'fail', message: error.message };
        }
      })(),
      (async () => {
        try {
          await (fastify as any).services.redis.ping();
          checks.redis = { status: 'pass', message: 'Connected' };
        } catch (error: any) {
          checks.redis = { status: 'fail', message: error.message };
        }
      })(),
      (async () => {
        try {
          const { data } = await (fastify as any).axios.get('http://localhost:9200/_cluster/health');
          checks.elasticsearch = { 
            status: data.status === 'green' ? 'pass' : 'warn',
            message: `Cluster ${data.status}`,
            nodes: data.number_of_nodes
          };
        } catch (error: any) {
          checks.elasticsearch = { status: 'fail', message: error.message };
        }
      })()
    ];
    
    await Promise.allSettled(checkPromises);
    
    const allHealthy = Object.values(checks).every((c: any) => c.status === 'pass');
    
    reply.code(allHealthy ? 200 : 503);
    return reply.send({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    });
  });
}