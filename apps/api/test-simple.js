const { prisma } = require('@cryb/database');
const Fastify = require('fastify');

console.log('Starting simple test server...');

async function start() {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create simple Fastify server
    console.log('🔄 Creating Fastify server...');
    const app = Fastify({ logger: true });
    
    app.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });
    
    console.log('🔄 Starting server...');
    await app.listen({ port: 3002, host: '0.0.0.0' });
    console.log('✅ Server started successfully on port 3002');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

start();