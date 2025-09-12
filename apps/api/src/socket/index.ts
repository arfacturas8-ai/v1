import { Server } from "socket.io";
import { FastifyInstance } from "fastify";
import { DiscordRealtimeHandler } from "./discord-realtime";
import { VoiceWebRTCHandler } from "./voice-webrtc";
import { LiveKitService } from "../services/livekit";
import { AuthService } from "../services/auth";

/**
 * Setup Socket.io handlers for Discord-style real-time communication
 * 
 * Features:
 * - Discord Gateway-style event system
 * - Real-time messaging with typing indicators
 * - Voice channel state management
 * - Presence and activity tracking
 * - Server and channel management
 * - Message reactions and editing
 * - Direct messaging system
 * - Member and role management
 * - Comprehensive permission system
 * - Rate limiting and security
 * - Redis-backed scalability
 */
export function setupSocketHandlers(io: Server, fastify: FastifyInstance) {
  // Initialize services
  const authService = new AuthService((fastify as any).redis);
  const discordHandler = new DiscordRealtimeHandler(io, (fastify as any).redis, authService);
  
  // Initialize LiveKit service for voice/video
  let voiceHandler: VoiceWebRTCHandler | null = null;
  
  if (process.env.ENABLE_VOICE_VIDEO === 'true') {
    try {
      const liveKitService = new LiveKitService({
        url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
        apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
        apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
      });
      
      voiceHandler = new VoiceWebRTCHandler(io, (fastify as any).redis, liveKitService);
      
      console.log('🎙️ WebRTC Voice/Video handler initialized with LiveKit');
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC Voice handler:', error);
      console.log('🔇 Voice/Video features will be unavailable');
    }
  }
  
  console.log('🔌 Discord-style Socket.io handlers initialized with features:');
  console.log('   - Discord Gateway-compatible events');
  console.log('   - Real-time messaging and channels');
  console.log(`   - Voice/video communication: ${voiceHandler ? '✅ Enabled with WebRTC' : '❌ Disabled'}`);
  console.log('   - Presence and activity tracking');
  console.log('   - Message reactions and editing');
  console.log('   - Direct messaging system');
  console.log('   - Server discovery and invites');
  console.log('   - Member and role management');
  console.log('   - Comprehensive permission system');
  console.log('   - Rate limiting and security');
  console.log('   - Redis-backed scalability');
  
  return { discordHandler, voiceHandler };
}

// Export socket types for use in other modules
export { DiscordSocket, PresenceData, VoiceState } from "./discord-realtime";
export { WebRTCSocket, VoiceConnection, ScreenShareRequest, VoiceWebRTCHandler } from "./voice-webrtc";