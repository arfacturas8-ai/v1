import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * Add request ID to every request for tracking
 */
export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Get or generate request ID
  const requestId = (request.headers['x-request-id'] as string) || randomUUID();
  
  // Attach to request object
  (request as any).requestId = requestId;
  
  // Add to response headers
  reply.header('X-Request-Id', requestId);
  
  // Add to logs
  request.log = request.log.child({ requestId });
}