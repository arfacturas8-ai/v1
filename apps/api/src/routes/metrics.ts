import { FastifyPluginAsync } from 'fastify';

const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Public metrics endpoint
  fastify.get('/dashboard', async (request, reply) => {
    try {
      const monitoring = (fastify as any).services?.monitoring;
      if (!monitoring) {
        return reply.code(503).send({
          success: false,
          error: 'Monitoring service not available'
        });
      }
      
      const stats = await monitoring.getDashboardStats();
      
      return reply.send({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Failed to get metrics:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  });
  
  // Simple health check with metrics
  fastify.get('/health', async (request, reply) => {
    const monitoring = (fastify as any).services?.monitoring;
    
    return reply.send({
      success: true,
      status: 'healthy',
      metrics: monitoring ? monitoring.getMetrics() : {},
      timestamp: new Date().toISOString()
    });
  });
};

export default metricsRoutes;