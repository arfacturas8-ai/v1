import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { z } from 'zod';

export default async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get('/notifications', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 20;
    const userId = (request as any).user.id;
    
    const result = await notificationService.getNotifications(userId, page, limit);
    
    return reply.send(result);
  });

  // Mark notification as read
  fastify.post('/notifications/:notificationId/read', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { notificationId } = request.params as any;
    const userId = (request as any).user.id;
    
    const success = await notificationService.markAsRead(notificationId, userId);
    
    if (!success) {
      return reply.status(404).send({ error: 'Notification not found' });
    }
    
    return reply.send({ success: true });
  });

  // Mark all notifications as read
  fastify.post('/notifications/read-all', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    
    await notificationService.markAllAsRead(userId);
    
    return reply.send({ success: true });
  });

  // Delete notification
  fastify.delete('/notifications/:notificationId', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { notificationId } = request.params as any;
    const userId = (request as any).user.id;
    
    const success = await notificationService.deleteNotification(notificationId, userId);
    
    if (!success) {
      return reply.status(404).send({ error: 'Notification not found' });
    }
    
    return reply.send({ success: true });
  });

  // Get unread count
  fastify.get('/notifications/unread-count', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    
    const count = await notificationService.getUnreadCount(userId);
    
    return reply.send({ count });
  });

  // Update notification preferences
  fastify.patch('/users/me/notification-settings', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    const preferences = request.body;
    
    await notificationService.updateUserPreferences(userId, preferences);
    
    return reply.send({ success: true });
  });
}
