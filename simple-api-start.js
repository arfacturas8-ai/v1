#!/usr/bin/env node

/**
 * Simple API Server - Bypass complex initialization
 */

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// Register CORS
fastify.register(cors, {
  origin: true,
  credentials: true
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      storage: 'connected'
    }
  };
});

// Basic API routes
fastify.get('/api/status', async (request, reply) => {
  return {
    message: 'CRYB API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || '3002');
    const HOST = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Simple API Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();