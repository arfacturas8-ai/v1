import { FastifyInstance } from 'fastify';
import enhancedProfileRoutes from './enhanced-profile';
import { createProfileRealtimeService } from '../services/profile-realtime-service';

/**
 * Profile System Integration
 * 
 * This module integrates the enhanced profile system with the main Fastify application.
 * It sets up routes, WebSocket handlers, and background services.
 */

export async function registerProfileSystem(fastify: FastifyInstance) {
  // Register the enhanced profile routes under /api/v1/users
  fastify.register(enhancedProfileRoutes, { prefix: '/users' });

  // Initialize real-time profile service if WebSocket is available
  if (fastify.io) {
    const profileRealtimeService = createProfileRealtimeService(fastify.io);
    
    // Make the service available throughout the app
    fastify.decorate('profileRealtimeService', profileRealtimeService);
    
    console.log('✅ Profile real-time service initialized');
  }

  // Add profile-related hooks
  fastify.addHook('onReady', async () => {
    console.log('✅ Enhanced Profile System loaded successfully');
    console.log('📚 Available profile endpoints:');
    console.log('   - GET/PUT /api/v1/users/:userId/profile');
    console.log('   - POST/DELETE /api/v1/users/:userId/follow');
    console.log('   - GET /api/v1/users/search');
    console.log('   - GET /api/v1/users/:userId/activity');
    console.log('   - GET/PUT /api/v1/users/:userId/achievements');
    console.log('   - POST /api/v1/users/:userId/avatar');
    console.log('   - PUT /api/v1/users/:userId/privacy');
    console.log('   - POST/DELETE /api/v1/users/:userId/block');
    console.log('   - GET /api/v1/users/blocked');
  });

  // Add error handling for profile operations
  fastify.setErrorHandler((error, request, reply) => {
    if (error.message.includes('profile') || error.message.includes('user')) {
      fastify.log.error('Profile system error:', error);
      reply.status(500).send({
        success: false,
        error: 'Profile system error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } else {
      throw error; // Re-throw if not a profile error
    }
  });
}

// Type declarations for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    profileRealtimeService?: any;
  }
}