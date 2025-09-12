// Debug version to identify where the server hangs
console.log('1. Starting debug server...');

process.env.NODE_ENV = 'development';
process.env.PORT = '3002';

console.log('2. Loading environment...');
require('dotenv').config();

console.log('3. Loading database...');
const { prisma, ensureDatabaseConnection } = require('@cryb/database');

console.log('4. Loading Fastify...');
const Fastify = require('fastify');

async function start() {
  try {
    console.log('5. Testing database connection...');
    const dbHealthy = await ensureDatabaseConnection(1);
    console.log('6. Database health:', dbHealthy);

    console.log('7. Creating Fastify instance...');
    const app = Fastify({
      logger: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      },
      trustProxy: true,
      bodyLimit: 50 * 1024 * 1024
    });

    console.log('8. Adding health endpoint...');
    app.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'healthy' : 'unhealthy'
      };
    });

    console.log('9. Starting server on port 3003...');
    await app.listen({ port: 3003, host: '0.0.0.0' });
    console.log('10. ✅ Server started successfully!');

  } catch (error) {
    console.error('❌ Error at step:', error);
    process.exit(1);
  }
}

console.log('0. Calling start function...');
start();