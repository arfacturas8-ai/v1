/**
 * CRYB Voice Client SDK
 * 
 * A comprehensive client-side SDK for integrating with CRYB's voice/video system.
 * Supports WebRTC, LiveKit, screen sharing, and quality management.
 * 
 * Usage:
 * const voiceClient = new CRYBVoiceClient(apiUrl, socketUrl);
 * await voiceClient.authenticate(token);
 * await voiceClient.joinVoiceChannel(channelId);
 */

class CRYBVoiceClient {
  constructor(apiUrl = 'http://localhost:3002', socketUrl = 'http://localhost:3002') {
    this.apiUrl = apiUrl;
    this.socketUrl = socketUrl;
    this.socket = null;
    this.token = null;
    this.userId = null;
    
    // Voice state
    this.currentChannel = null;
    this.voiceState = {
      muted: false,
      deafened: false,
      speaking: false,
      audioEnabled: true,
      videoEnabled: false,
      screenShareEnabled: false
    };
    
    // LiveKit integration
    this.liveKitRoom = null;
    this.liveKitToken = null;
    this.liveKitUrl = null;
    
    // WebRTC connections
    this.peerConnections = new Map();
    this.localStream = null;
    this.remoteStreams = new Map();
    
    // Quality monitoring
    this.qualityStats = null;
    this.qualityTimer = null;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Screen sharing
    this.screenShareStream = null;
    
    // Connection recovery
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.setupEventHandlers();
  }

  /**
   * Setup default event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.on('connected', () => {
      console.log('🔌 Connected to CRYB voice service');
      this.reconnectAttempts = 0;
    });
    
    this.on('disconnected', (reason) => {
      console.log(`🔌 Disconnected from CRYB voice service: ${reason}`);
      this.handleDisconnection(reason);
    });
    
    // Voice events
    this.on('voice:joined', (data) => {
      console.log('🎙️ Joined voice channel:', data);
      this.currentChannel = data.channelId;
      this.liveKitToken = data.liveKitToken;
      this.liveKitUrl = data.liveKitUrl;
    });
    
    this.on('voice:participant_joined', (data) => {
      console.log('👤 Participant joined:', data.participant.username);
    });
    
    this.on('voice:participant_left', (data) => {
      console.log('👤 Participant left:', data.username);
    });
    
    // Quality events
    this.on('voice:quality_warning', (data) => {
      console.warn('📊 Voice quality warning:', data);
    });
    
    this.on('voice:recovery_started', (data) => {
      console.log('🔄 Connection recovery started:', data);
    });
  }

  /**
   * Event emitter functionality
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Authenticate with the voice service
   */
  async authenticate(token) {
    this.token = token;
    
    // Decode token to get user ID (simple JWT decode)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.userId;
    } catch (error) {
      throw new Error('Invalid token format');
    }
    
    await this.connect();
  }

  /**
   * Connect to the socket server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      if (typeof io === 'undefined') {
        reject(new Error('Socket.IO client library not loaded'));
        return;
      }

      this.socket = io(this.socketUrl, {
        auth: { token: this.token },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.emit('connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.emit('connect_error', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.emit('disconnected', reason);
      });

      // Setup voice event listeners
      this.setupSocketEventListeners();
    });
  }

  /**
   * Setup socket event listeners
   */
  setupSocketEventListeners() {
    const voiceEvents = [
      'voice:joined',
      'voice:left',
      'voice:error',
      'voice:participant_joined',
      'voice:participant_left',
      'voice:state_updated',
      'voice:speaking_update',
      'voice:quality_warning',
      'voice:quality_alert',
      'voice:recovery_started',
      'voice:recovery_success',
      'voice:recovery_failed',
      'voice:token_refresh',
      'voice:health_check',
      'screenshare:started',
      'screenshare:stopped',
      'webrtc:offer',
      'webrtc:answer',
      'webrtc:ice_candidate'
    ];

    voiceEvents.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    });

    // Handle health checks
    this.socket.on('voice:health_check', () => {
      this.socket.emit('voice:health_check_response');
    });
  }

  /**
   * Join a voice channel
   */
  async joinVoiceChannel(channelId, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join voice channel timeout'));
      }, 10000);

      this.socket.once('voice:joined', (data) => {
        clearTimeout(timeout);
        this.currentChannel = channelId;
        this.liveKitToken = data.liveKitToken;
        this.liveKitUrl = data.liveKitUrl;
        
        // Initialize LiveKit connection
        if (options.enableLiveKit !== false) {
          this.initializeLiveKit(data).catch(console.error);
        }
        
        // Start quality monitoring
        this.startQualityMonitoring();
        
        resolve(data);
      });

      this.socket.once('voice:error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || 'Failed to join voice channel'));
      });

      this.socket.emit('voice:join_channel', {
        channelId,
        capabilities: {
          audio: options.audio !== false,
          video: options.video === true,
          screenShare: options.screenShare !== false
        },
        audioSettings: {
          echoCancellation: options.echoCancellation !== false,
          noiseSuppression: options.noiseSuppression !== false,
          autoGainControl: options.autoGainControl !== false
        }
      });
    });
  }

  /**
   * Leave the current voice channel
   */
  async leaveVoiceChannel() {
    if (!this.currentChannel) {
      throw new Error('Not in a voice channel');
    }

    return new Promise((resolve) => {
      this.socket.once('voice:left', () => {
        this.cleanup();
        resolve();
      });

      this.socket.emit('voice:leave_channel');
    });
  }

  /**
   * Initialize LiveKit connection
   */
  async initializeLiveKit(joinData) {
    if (typeof LiveKit === 'undefined') {
      console.warn('LiveKit library not loaded, skipping LiveKit initialization');
      return;
    }

    try {
      const room = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: LiveKit.AudioPresets.music,
          videoPreset: LiveKit.VideoPresets.h720
        }
      });

      // Setup room events
      room.on('participantConnected', (participant) => {
        console.log('LiveKit participant connected:', participant.identity);
        this.emit('participant_connected', participant);
      });

      room.on('participantDisconnected', (participant) => {
        console.log('LiveKit participant disconnected:', participant.identity);
        this.emit('participant_disconnected', participant);
      });

      room.on('trackSubscribed', (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        this.handleTrackSubscribed(track, publication, participant);
      });

      room.on('trackUnsubscribed', (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, participant.identity);
        this.handleTrackUnsubscribed(track, publication, participant);
      });

      // Connect to LiveKit room
      await room.connect(joinData.liveKitUrl, joinData.liveKitToken);
      this.liveKitRoom = room;

      console.log('✅ Connected to LiveKit room:', joinData.roomName);

    } catch (error) {
      console.error('Failed to initialize LiveKit:', error);
      throw error;
    }
  }

  /**
   * Handle subscribed tracks
   */
  handleTrackSubscribed(track, publication, participant) {
    if (track.kind === 'audio') {
      const audioElement = document.createElement('audio');
      audioElement.srcObject = new MediaStream([track.mediaStreamTrack]);
      audioElement.autoplay = true;
      audioElement.setAttribute('data-participant-id', participant.identity);
      
      // Add to DOM or handle as needed
      this.emit('audio_track_added', {
        element: audioElement,
        participant: participant.identity,
        track
      });
      
    } else if (track.kind === 'video') {
      const videoElement = document.createElement('video');
      videoElement.srcObject = new MediaStream([track.mediaStreamTrack]);
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.setAttribute('data-participant-id', participant.identity);
      
      this.emit('video_track_added', {
        element: videoElement,
        participant: participant.identity,
        track
      });
    }
  }

  /**
   * Handle unsubscribed tracks
   */
  handleTrackUnsubscribed(track, publication, participant) {
    this.emit('track_removed', {
      participant: participant.identity,
      track,
      kind: track.kind
    });
  }

  /**
   * Enable/disable microphone
   */
  async setMicrophoneEnabled(enabled) {
    this.voiceState.muted = !enabled;
    this.voiceState.audioEnabled = enabled;
    
    if (this.liveKitRoom) {
      await this.liveKitRoom.localParticipant.setMicrophoneEnabled(enabled);
    }
    
    this.socket.emit('voice:update_state', {
      selfMute: !enabled,
      audioEnabled: enabled
    });
    
    this.emit('microphone_changed', { enabled });
  }

  /**
   * Enable/disable camera
   */
  async setCameraEnabled(enabled) {
    this.voiceState.videoEnabled = enabled;
    
    if (this.liveKitRoom) {
      await this.liveKitRoom.localParticipant.setCameraEnabled(enabled);
    }
    
    this.socket.emit('voice:update_state', {
      videoEnabled: enabled
    });
    
    this.emit('camera_changed', { enabled });
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(options = {}) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: options.cursor || 'always'
        },
        audio: options.audio !== false
      });

      this.screenShareStream = stream;
      this.voiceState.screenShareEnabled = true;

      // Publish screen share to LiveKit
      if (this.liveKitRoom) {
        await this.liveKitRoom.localParticipant.publishTrack(stream.getVideoTracks()[0], {
          name: 'screen_share',
          source: LiveKit.Track.Source.ScreenShare
        });

        if (options.audio && stream.getAudioTracks().length > 0) {
          await this.liveKitRoom.localParticipant.publishTrack(stream.getAudioTracks()[0], {
            name: 'screen_share_audio',
            source: LiveKit.Track.Source.ScreenShareAudio
          });
        }
      }

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      this.socket.emit('screenshare:start', {
        source: 'screen',
        audio: options.audio !== false
      });

      this.emit('screen_share_started', { stream });

      return stream;

    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    if (!this.screenShareStream) return;

    // Stop all tracks
    this.screenShareStream.getTracks().forEach(track => track.stop());
    this.screenShareStream = null;
    this.voiceState.screenShareEnabled = false;

    // Unpublish from LiveKit
    if (this.liveKitRoom) {
      const screenTrack = this.liveKitRoom.localParticipant.getTrack(LiveKit.Track.Source.ScreenShare);
      const audioTrack = this.liveKitRoom.localParticipant.getTrack(LiveKit.Track.Source.ScreenShareAudio);
      
      if (screenTrack) {
        await this.liveKitRoom.localParticipant.unpublishTrack(screenTrack);
      }
      if (audioTrack) {
        await this.liveKitRoom.localParticipant.unpublishTrack(audioTrack);
      }
    }

    this.socket.emit('screenshare:stop');
    this.emit('screen_share_stopped');
  }

  /**
   * Get voice quality settings
   */
  async getQualitySettings() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get quality settings timeout'));
      }, 5000);

      this.socket.once('voice:quality_settings', (data) => {
        clearTimeout(timeout);
        resolve(data.settings);
      });

      this.socket.emit('voice:get_quality_settings');
    });
  }

  /**
   * Update voice quality settings
   */
  async updateQualitySettings(updates) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Update quality settings timeout'));
      }, 5000);

      this.socket.once('voice:quality_settings_updated', (data) => {
        clearTimeout(timeout);
        resolve(data.settings);
      });

      this.socket.emit('voice:update_quality_settings', { updates });
    });
  }

  /**
   * Apply a quality preset
   */
  async applyQualityPreset(presetId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Apply preset timeout'));
      }, 5000);

      this.socket.once('voice:preset_applied', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.emit('voice:apply_preset', { presetId });
    });
  }

  /**
   * Get available quality presets
   */
  async getQualityPresets() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get presets timeout'));
      }, 5000);

      this.socket.once('voice:presets', (data) => {
        clearTimeout(timeout);
        resolve(data.presets);
      });

      this.socket.emit('voice:get_presets');
    });
  }

  /**
   * Start quality monitoring
   */
  startQualityMonitoring() {
    if (this.qualityTimer) {
      clearInterval(this.qualityTimer);
    }

    this.qualityTimer = setInterval(() => {
      this.reportQualityStats();
    }, 5000); // Report every 5 seconds
  }

  /**
   * Report quality statistics
   */
  async reportQualityStats() {
    if (!this.liveKitRoom) return;

    try {
      const stats = await this.liveKitRoom.engine.getStats();
      
      // Extract relevant metrics
      const qualityData = {
        jitter: 0,
        packetLoss: 0,
        rtt: 0,
        audioLevel: 0
      };

      // Process stats (simplified)
      for (const report of stats.values()) {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          qualityData.jitter = report.jitter || 0;
          qualityData.packetLoss = ((report.packetsLost || 0) / (report.packetsReceived || 1)) * 100;
        }
        
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          qualityData.rtt = report.currentRoundTripTime || 0;
        }
      }

      // Get audio level
      if (this.liveKitRoom.localParticipant.audioTrack) {
        qualityData.audioLevel = this.liveKitRoom.localParticipant.audioTrack.getVolume() || 0;
      }

      // Report to server
      this.socket.emit('voice:quality_report', qualityData);
      this.qualityStats = qualityData;
      
      this.emit('quality_update', qualityData);

    } catch (error) {
      console.warn('Failed to get quality stats:', error);
    }
  }

  /**
   * Handle disconnection with recovery
   */
  async handleDisconnection(reason) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed', { reason: 'Max reconnection attempts reached' });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(async () => {
      try {
        this.reconnectAttempts++;
        await this.connect();
        
        // Rejoin voice channel if we were in one
        if (this.currentChannel) {
          await this.joinVoiceChannel(this.currentChannel, { enableLiveKit: true });
        }
        
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleDisconnection(reason);
      }
    }, delay);
  }

  /**
   * Get current voice state
   */
  getVoiceState() {
    return { ...this.voiceState };
  }

  /**
   * Get current quality stats
   */
  getQualityStats() {
    return this.qualityStats;
  }

  /**
   * Check if currently in a voice channel
   */
  isInVoiceChannel() {
    return !!this.currentChannel;
  }

  /**
   * Get current channel participants
   */
  async getChannelParticipants() {
    if (!this.currentChannel) {
      throw new Error('Not in a voice channel');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get participants timeout'));
      }, 5000);

      this.socket.once('voice:channel_participants', (data) => {
        clearTimeout(timeout);
        resolve(data.participants);
      });

      this.socket.emit('voice:get_channel_participants', {
        channelId: this.currentChannel
      });
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop quality monitoring
    if (this.qualityTimer) {
      clearInterval(this.qualityTimer);
      this.qualityTimer = null;
    }

    // Stop screen sharing
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;
    }

    // Disconnect LiveKit
    if (this.liveKitRoom) {
      this.liveKitRoom.disconnect();
      this.liveKitRoom = null;
    }

    // Close peer connections
    for (const pc of this.peerConnections.values()) {
      pc.close();
    }
    this.peerConnections.clear();

    // Reset state
    this.currentChannel = null;
    this.liveKitToken = null;
    this.liveKitUrl = null;
    this.voiceState = {
      muted: false,
      deafened: false,
      speaking: false,
      audioEnabled: true,
      videoEnabled: false,
      screenShareEnabled: false
    };
  }

  /**
   * Disconnect from voice service
   */
  disconnect() {
    this.cleanup();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.emit('disconnected', 'client_disconnect');
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRYBVoiceClient };
} else if (typeof window !== 'undefined') {
  window.CRYBVoiceClient = CRYBVoiceClient;
}

// Example usage:
/*
// Initialize the client
const voiceClient = new CRYBVoiceClient('http://localhost:3002');

// Setup event listeners
voiceClient.on('voice:joined', (data) => {
  console.log('Joined voice channel:', data);
});

voiceClient.on('participant_connected', (participant) => {
  console.log('New participant:', participant.identity);
});

voiceClient.on('audio_track_added', ({ element, participant }) => {
  document.body.appendChild(element);
});

// Authenticate and join
try {
  await voiceClient.authenticate('your-jwt-token');
  await voiceClient.joinVoiceChannel('channel-id');
  
  // Enable microphone
  await voiceClient.setMicrophoneEnabled(true);
  
  // Start screen sharing
  await voiceClient.startScreenShare({ audio: true });
  
  // Apply gaming preset
  await voiceClient.applyQualityPreset('gaming');
  
} catch (error) {
  console.error('Voice client error:', error);
}
*/