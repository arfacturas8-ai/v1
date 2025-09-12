import { FastifyInstance } from 'fastify';
import { LiveKitService, ParticipantInfo } from '../services/livekit';

export default async function voiceTestRoutes(fastify: FastifyInstance) {
  // Initialize LiveKit service
  const liveKitService = new LiveKitService({
    url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
    apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
  });

  /**
   * Test endpoint to generate voice tokens without auth
   */
  fastify.post('/test-token', {
    schema: {
      tags: ['voice-test'],
      summary: 'Generate test voice token'
    }
  }, async (request, reply) => {
    const { channelId = 'test-channel', userId = `user_${Date.now()}`, username = 'TestUser' } = request.body as any || {};

    try {
      // Create participant info
      const participantInfo: ParticipantInfo = {
        identity: userId,
        name: username,
        metadata: JSON.stringify({
          userId,
          channelId,
          joinedAt: Date.now(),
          test: true
        }),
        permissions: {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          hidden: false,
          recorder: false
        }
      };

      // Generate room name
      const roomName = `test_${channelId}`;

      // Ensure room exists
      try {
        await liveKitService.getRoom(roomName);
      } catch (error) {
        // Room doesn't exist, create it
        await liveKitService.createRoom({
          name: roomName,
          maxParticipants: 100,
          enableRecording: false,
          emptyTimeout: 300,
          metadata: JSON.stringify({
            channelId,
            channelName: `Test Channel ${channelId}`,
            channelType: 'VOICE',
            createdAt: Date.now(),
            test: true
          })
        });
      }

      // Generate access token
      const liveKitToken = liveKitService.generateAccessToken(roomName, participantInfo);

      reply.send({
        success: true,
        data: {
          liveKitToken,
          liveKitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          roomName,
          participantInfo,
          channelId,
          userId,
          username
        }
      });

    } catch (error) {
      fastify.log.error({ error, channelId, userId }, 'Failed to generate test voice token');
      
      reply.code(500).send({
        success: false,
        error: 'Failed to generate voice token',
        message: (error as Error).message
      });
    }
  });

  /**
   * Health check for voice service
   */
  fastify.get('/health', {
    schema: {
      tags: ['voice-test'],
      summary: 'Voice service health check'
    }
  }, async (request, reply) => {
    try {
      // Check LiveKit server connectivity
      const rooms = await liveKitService.listRooms();
      
      reply.send({
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        livekit: {
          connected: true,
          url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          rooms: rooms.length
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Voice service health check failed');
      
      reply.code(503).send({
        success: false,
        status: 'unhealthy',
        timestamp: Date.now(),
        error: (error as Error).message,
        livekit: {
          connected: false,
          url: process.env.LIVEKIT_URL || 'ws://localhost:7880'
        }
      });
    }
  });
}