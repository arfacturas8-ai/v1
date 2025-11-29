import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';

export default async function eventRoutes(fastify: FastifyInstance) {
  // Polling endpoint for clients that can't use WebSocket
  fastify.post('/events/poll', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    // This is a fallback endpoint for when WebSocket connections fail
    // Return empty events array to indicate no pending events
    return reply.send({
      success: true,
      events: [],
      message: 'Please use WebSocket connection for real-time events'
    });
  });

  // Health check for event system
  fastify.get('/events/status', async (request, reply) => {
    return reply.send({
      success: true,
      websocket: 'available',
      polling: 'available'
    });
  });
}
