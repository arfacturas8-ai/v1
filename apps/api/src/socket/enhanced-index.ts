import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { RealtimeCommunicationService } from './realtime-communication';

/**
 * Production-Ready Real-time Communication Setup
 * 
 * This module initializes the comprehensive real-time communication system with:
 * 
 * Core Features:
 * - Scalable Socket.io with Redis adapter for horizontal scaling
 * - Advanced authentication with JWT validation and user verification
 * - Real-time messaging with delivery guarantees and read receipts
 * - Comprehensive presence tracking with heartbeat monitoring
 * - Advanced typing indicators with auto-cleanup
 * - Voice and video channel management with state synchronization
 * - Direct messaging system with privacy controls
 * - Advanced room and channel management
 * - Cross-server communication via Redis pub/sub
 * 
 * Security & Performance:
 * - Multi-tier rate limiting with configurable limits per event type
 * - Comprehensive input validation and sanitization
 * - Abuse prevention with automatic rate limiting
 * - Connection monitoring and analytics
 * - Graceful error handling and reconnection strategies
 * 
 * Moderation & Admin:
 * - Real-time moderation actions (kick, ban, mute)
 * - Permission-based access controls
 * - Audit logging for all administrative actions
 * - Cross-server synchronization of moderation actions
 * 
 * Analytics & Monitoring:
 * - Real-time connection metrics and analytics
 * - Event tracking for performance optimization
 * - Health monitoring and alerting
 * - Redis-based caching for optimal performance
 */

let realtimeService: RealtimeCommunicationService | null = null;

/**
 * Initialize the enhanced real-time communication system
 */
export function setupEnhancedSocketHandlers(io: Server, fastify: FastifyInstance) {
  try {
    // Create the real-time communication service
    realtimeService = new RealtimeCommunicationService(fastify);
    
    // Decorate Fastify with the real-time service
    fastify.decorate('realtimeService', realtimeService);
    
    // Add graceful shutdown handler
    fastify.addHook('onClose', async () => {
      if (realtimeService) {
        await realtimeService.close();
      }
    });
    
    fastify.log.info('🚀 Enhanced Real-time Communication System initialized successfully');
    fastify.log.info('📊 Features enabled:');
    fastify.log.info('   ✅ Scalable Socket.io with Redis adapter');
    fastify.log.info('   ✅ Advanced authentication and authorization');
    fastify.log.info('   ✅ Real-time messaging with read receipts');
    fastify.log.info('   ✅ Presence tracking and heartbeat monitoring');
    fastify.log.info('   ✅ Typing indicators with auto-cleanup');
    fastify.log.info('   ✅ Voice/video channel management');
    fastify.log.info('   ✅ Direct messaging system');
    fastify.log.info('   ✅ Advanced room and broadcasting');
    fastify.log.info('   ✅ Cross-server Redis pub/sub');
    fastify.log.info('   ✅ Multi-tier rate limiting');
    fastify.log.info('   ✅ Real-time moderation tools');
    fastify.log.info('   ✅ Analytics and monitoring');
    
  } catch (error) {
    fastify.log.error('❌ Failed to initialize enhanced real-time communication system:', error);
    throw error;
  }
}

/**
 * Get the real-time service instance
 */
export function getRealtimeService(): RealtimeCommunicationService | null {
  return realtimeService;
}

/**
 * Health check for the real-time communication system
 */
export async function getRealtimeHealthCheck() {
  if (!realtimeService) {
    return {
      status: 'down',
      message: 'Real-time service not initialized'
    };
  }
  
  try {
    const metrics = realtimeService.getConnectionMetrics();
    
    return {
      status: 'healthy',
      metrics: {
        activeConnections: metrics.activeConnections,
        totalConnections: metrics.totalConnections,
        messagesSent: metrics.messagesSent,
        eventsProcessed: metrics.eventsProcessed
      },
      presenceCount: realtimeService.getPresenceMap().size,
      voiceConnections: realtimeService.getVoiceStates().size
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get real-time analytics data
 */
export async function getRealtimeAnalytics(event: string, limit: number = 100) {
  if (!realtimeService) {
    throw new Error('Real-time service not initialized');
  }
  
  return await realtimeService.getAnalytics(event, limit);
}

/**
 * Broadcast message to specific server
 */
export async function broadcastToServer(serverId: string, event: string, data: any) {
  if (!realtimeService) {
    throw new Error('Real-time service not initialized');
  }
  
  return await realtimeService.broadcastToServer(serverId, event, data);
}

/**
 * Send notification to specific user
 */
export async function sendNotificationToUser(userId: string, notification: any) {
  if (!realtimeService) {
    throw new Error('Real-time service not initialized');
  }
  
  return await realtimeService.sendNotificationToUser(userId, notification);
}

// Export types for external use
export type { 
  AuthenticatedSocket, 
  PresenceData, 
  VoiceState, 
  TypingIndicator, 
  ReadReceipt 
} from './realtime-communication';

// Export service class for advanced usage
export { RealtimeCommunicationService } from './realtime-communication';