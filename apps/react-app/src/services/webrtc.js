/**
 * Enterprise-Grade WebRTC Service using LiveKit for CRYB Platform
 * Handles real-time voice and video communication with production-grade features
 * Supports unlimited participant voice channels, spatial audio, recording, analytics, and enterprise features
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Network transition handling (WiFi to cellular)
 * - Advanced voice effects and spatial audio
 * - Enterprise recording with cloud storage
 * - Real-time analytics and monitoring
 * - Mobile optimization with native call integration
 * - Voice transcription and AI moderation
 * - Music bot integration for shared experiences
 */
import {
  Room,
  RoomEvent,
  Track,
  TrackEvent,
  LocalParticipant,
  RemoteParticipant,
  createLocalVideoTrack,
  createLocalAudioTrack,
  VideoPresets,
  AudioPresets,
  TrackPublication,
  ConnectionQuality,
  ParticipantEvent,
  DataPacket_Kind,
  Participant,
  RemoteTrack,
  LocalTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  DisconnectReason,
  ConnectionState
} from 'livekit-client'
import socketService from './socket'
import sfuManager from './sfuManager'
import VoiceEffectsProcessor from './voiceEffectsProcessor'
import AdaptiveBitrateManager from './adaptiveBitrateManager'
import RecordingManager from './recordingManager'
import MobileCallManager from './mobileCallManager'

class WebRTCService {
  constructor() {
    this.room = null
    this.localParticipant = null
    this.participants = new Map()
    this.audioEnabled = true
    this.videoEnabled = false
    this.screenShareEnabled = false
    this.listeners = new Map()
    
    // LiveKit connection settings with fallback servers
    this.serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://api.cryb.ai:7880'
    this.fallbackServers = [
      'wss://backup1.cryb.ai:7880',
      'wss://backup2.cryb.ai:7880',
      'wss://eu.cryb.ai:7880',
      'wss://asia.cryb.ai:7880'
    ]
    this.currentServerIndex = 0
    this.currentChannel = null
    this.connectionState = 'disconnected' // disconnected, connecting, connected, reconnecting
    
    // Auto-reconnection settings
    this.reconnectionAttempts = 0
    this.maxReconnectionAttempts = 10
    this.reconnectionDelay = 1000 // Start with 1 second
    this.maxReconnectionDelay = 30000 // Max 30 seconds
    this.reconnectionTimer = null
    this.isReconnecting = false
    
    // Network monitoring
    this.networkMonitor = {
      isOnline: navigator.onLine,
      connectionType: 'unknown',
      lastQualityCheck: Date.now(),
      qualityHistory: []
    }
    
    // Session management
    this.sessionId = null
    this.sessionStartTime = null
    this.lastSuccessfulConnection = null
    
    // Voice effects processor
    this.voiceEffectsProcessor = new VoiceEffectsProcessor()
    this.enhancedAudioStream = null
    
    // Adaptive bitrate manager
    this.adaptiveBitrateManager = new AdaptiveBitrateManager()
    this.adaptiveBitrateManager.initialize(this)
    
    // Recording manager
    this.recordingManager = new RecordingManager()
    this.recordingManager.initialize(this)
    
    // Mobile call manager
    this.mobileCallManager = new MobileCallManager()
    this.mobileCallManager.initialize(this)

    // Timers for cleanup
    this.qualityMonitorInterval = null
    this.analyticsCleanupInterval = null

    // Advanced features
    this.isRecording = false
    this.recordingId = null
    this.spatialAudioEnabled = false
    this.noiseSuppressionEnabled = true
    this.echoCancellationEnabled = true
    this.autoGainControlEnabled = true
    this.voiceEffects = {
      robot: false,
      echo: false,
      pitch: 0, // -12 to +12 semitones
      reverb: false
    }
    
    // Analytics and monitoring
    this.analytics = {
      connectionStats: new Map(),
      bandwidthStats: new Map(),
      audioLevels: new Map(),
      participantMetrics: new Map()
    }
    
    // Device management
    this.audioDevices = []
    this.videoDevices = []
    this.currentAudioDevice = null
    this.currentVideoDevice = null
    
    // Quality management
    this.qualitySettings = {
      video: {
        resolution: '720p',
        frameRate: 30,
        bitrate: 2000000
      },
      audio: {
        bitrate: 128000,
        sampleRate: 48000
      }
    }
    
    // Voice activity detection
    this.vadEnabled = true
    this.vadThreshold = 0.5
    this.speakingThreshold = -50 // dBFS
    
    // Push-to-talk
    this.pushToTalkEnabled = false
    this.pushToTalkKey = 'KeyT'
    this.isPushToTalkActive = false
    
    // Admin and moderation
    this.isAdmin = false
    this.moderationTools = {
      canMuteOthers: false,
      canKickParticipants: false,
      canRecordSessions: false
    }
    
    // Initialize analytics collection
    this.startAnalyticsCollection()
    
    // Initialize device enumeration
    this.enumerateDevices()
    
    // Set up push-to-talk listener
    this.setupPushToTalk()
    
    // Set up network monitoring
    this.setupNetworkMonitoring()
    
    // Set up connection quality monitoring
    this.setupConnectionQualityMonitoring()
    
    // Set up automatic cleanup
    this.setupAutomaticCleanup()
  }

  // Event management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`WebRTC event error (${event}):`, error)
        }
      })
    }
  }

  // Advanced connection management with auto-reconnection
  async connectToVoiceChannel(channel, accessToken, options = {}) {
    try {
      this.connectionState = 'connecting'
      this.currentChannel = channel
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.sessionStartTime = Date.now()
      this.emit('connection_state_changed', { state: 'connecting', channel, sessionId: this.sessionId })

      // Enhanced room configuration for enterprise use
      const roomOptions = {
        publishDefaults: {
          videoSimulcastLayers: [
            VideoPresets.h1080,
            VideoPresets.h720,
            VideoPresets.h540,
            VideoPresets.h216
          ],
          videoCodec: options.videoCodec || 'vp9',
          audioCodec: options.audioCodec || 'opus',
          dtx: true, // Discontinuous transmission for bandwidth efficiency
          red: true, // Redundancy encoding for packet loss resilience
        },
        adaptiveStream: true,
        dynacast: true,
        e2ee: options.enableE2EE || false, // End-to-end encryption
        audioCaptureDefaults: {
          echoCancellation: this.echoCancellationEnabled,
          noiseSuppression: this.noiseSuppressionEnabled,
          autoGainControl: this.autoGainControlEnabled,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 1
        },
        videoCaptureDefaults: {
          resolution: this.qualitySettings.video.resolution,
          frameRate: this.qualitySettings.video.frameRate
        }
      }

      // Create room instance
      this.room = new Room(roomOptions)
      this.setupRoomEventHandlers()

      // Select optimal server using SFU manager
      const requirements = {
        userLocation: this.getUserLocation(),
        requiredFeatures: options.requiredFeatures || ['recording', 'spatial_audio'],
        roomSize: options.expectedParticipants || 1,
        qualityPreference: options.qualityPreference || 'balanced'
      }
      
      const selectedServer = await sfuManager.selectOptimalServer(requirements)
      this.serverUrl = selectedServer.url
      
      // Register connection with SFU manager
      const connectionId = this.sessionId
      sfuManager.registerConnection(connectionId, selectedServer.id, {
        channelId: channel.id,
        requiredFeatures: requirements.requiredFeatures,
        participantCount: requirements.roomSize,
        qualityPreference: requirements.qualityPreference,
        webrtcService: this
      })
      
      // Try to connect with retry logic
      await this.connectWithRetry(accessToken, options)
      
      this.localParticipant = this.room.localParticipant
      this.connectionState = 'connected'
      this.lastSuccessfulConnection = Date.now()
      this.reconnectionAttempts = 0
      
      // Enable audio by default (with enhanced settings)
      await this.enableAudio()
      
      // Set up audio processing
      await this.setupAudioProcessing()
      
      this.emit('connected', {
        room: this.room,
        localParticipant: this.localParticipant,
        channel,
        sessionId: this.sessionId,
        serverUrl: this.serverUrl
      })

      // Notify server via socket
      socketService.joinVoiceChannel(channel.id, { sessionId: this.sessionId })

      // Start connection monitoring
      this.startConnectionMonitoring()

      return this.room
    } catch (error) {
      console.error('Failed to connect to voice channel:', error)
      this.connectionState = 'disconnected'
      this.emit('connection_error', { 
        error: error.message, 
        channel, 
        sessionId: this.sessionId,
        serverUrl: this.serverUrl
      })
      
      // Try auto-reconnection if this was not the first attempt
      if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
        this.scheduleReconnection(channel, accessToken, options)
      }
      
      throw error
    }
  }

  async connectWithRetry(accessToken, options, serverIndex = 0) {
    const servers = [this.serverUrl, ...this.fallbackServers]
    const currentServer = servers[serverIndex % servers.length]
    
    try {
      await this.room.connect(currentServer, accessToken)
      this.serverUrl = currentServer // Update current server
      this.currentServerIndex = serverIndex
    } catch (error) {
      
      // Try next server if available
      if (serverIndex < servers.length - 1) {
        return this.connectWithRetry(accessToken, options, serverIndex + 1)
      } else {
        throw new Error(`Failed to connect to all available servers. Last error: ${error.message}`)
      }
    }
  }

  scheduleReconnection(channel, accessToken, options) {
    if (this.isReconnecting || this.connectionState === 'connected') {
      return
    }

    this.isReconnecting = true
    this.connectionState = 'reconnecting'
    this.reconnectionAttempts++
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(this.reconnectionDelay * Math.pow(2, this.reconnectionAttempts - 1), this.maxReconnectionDelay)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    const delay = baseDelay + jitter

    
    this.emit('reconnection_scheduled', { 
      attempt: this.reconnectionAttempts, 
      maxAttempts: this.maxReconnectionAttempts,
      delay: Math.round(delay),
      channel
    })

    this.reconnectionTimer = setTimeout(async () => {
      try {
        this.isReconnecting = false
        await this.connectToVoiceChannel(channel, accessToken, options)
      } catch (error) {
        this.isReconnecting = false
        console.error(`Reconnection attempt ${this.reconnectionAttempts} failed:`, error)
        
        if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
          this.scheduleReconnection(channel, accessToken, options)
        } else {
          this.emit('reconnection_failed', { 
            maxAttemptsReached: true, 
            lastError: error.message,
            channel
          })
        }
      }
    }, delay)
  }

  cancelReconnection() {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer)
      this.reconnectionTimer = null
    }
    this.isReconnecting = false
    this.reconnectionAttempts = 0
  }

  // Network monitoring setup
  setupNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkMonitor.isOnline = true
      this.emit('network_status_changed', { isOnline: true })
      
      // Try to reconnect if we were disconnected
      if (this.connectionState === 'disconnected' && this.currentChannel) {
        this.attemptReconnection()
      }
    })

    window.addEventListener('offline', () => {
      this.networkMonitor.isOnline = false
      this.emit('network_status_changed', { isOnline: false })
    })

    // Monitor connection type changes (mobile data, WiFi, etc.)
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const connection = navigator.connection
        this.networkMonitor.connectionType = connection.effectiveType || 'unknown'
        
        this.emit('network_type_changed', {
          type: this.networkMonitor.connectionType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
        
        // Adjust quality settings based on connection
        this.adaptToNetworkConditions(connection)
      })
    }
  }

  setupConnectionQualityMonitoring() {
    // Monitor connection quality every 10 seconds
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval)
    }
    this.qualityMonitorInterval = setInterval(() => {
      if (this.room && this.connectionState === 'connected') {
        this.checkConnectionQuality()
      }
    }, 10000)
  }

  setupAutomaticCleanup() {
    // Clean up old analytics data every 5 minutes
    if (this.analyticsCleanupInterval) {
      clearInterval(this.analyticsCleanupInterval)
    }
    this.analyticsCleanupInterval = setInterval(() => {
      this.cleanupOldAnalytics()
    }, 300000)
  }

  // Disconnect and cleanup
  disconnect() {
    // Clear all intervals
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval)
      this.qualityMonitorInterval = null
    }
    if (this.analyticsCleanupInterval) {
      clearInterval(this.analyticsCleanupInterval)
      this.analyticsCleanupInterval = null
    }
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer)
      this.reconnectionTimer = null
    }

    // Disconnect room
    if (this.room) {
      this.room.disconnect()
      this.room = null
    }

    // Reset state
    this.localParticipant = null
    this.participants.clear()
    this.connectionState = 'disconnected'
    this.isReconnecting = false
    this.reconnectionAttempts = 0

    // Clean up managers
    if (this.adaptiveBitrateManager) {
      this.adaptiveBitrateManager.cleanup?.()
    }
    if (this.recordingManager) {
      this.recordingManager.cleanup?.()
    }
    if (this.mobileCallManager) {
      this.mobileCallManager.cleanup?.()
    }
    if (this.voiceEffectsProcessor) {
      this.voiceEffectsProcessor.cleanup?.()
    }

    this.emit('disconnected')
  }

  async setupAudioProcessing() {
    if (!this.localParticipant) return

    try {
      // Get the local audio track
      const audioTrack = this.localParticipant.audioTracks.values().next().value?.track
      if (!audioTrack) return

      // Get the media stream track
      const mediaStreamTrack = audioTrack.mediaStreamTrack
      if (mediaStreamTrack) {
        // Create a media stream for voice effects processing
        const originalStream = new MediaStream([mediaStreamTrack])
        
        // Initialize voice effects processor with the audio stream
        this.enhancedAudioStream = await this.voiceEffectsProcessor.initialize(originalStream)
        
        // Replace the audio track with the processed one
        if (this.enhancedAudioStream) {
          const processedTrack = this.enhancedAudioStream.getAudioTracks()[0]
          if (processedTrack) {
            // Update the local participant's audio track
            await this.localParticipant.setMicrophoneEnabled(false)
            await this.localParticipant.publishTrack(processedTrack, {
              name: 'microphone_enhanced',
              source: 'microphone'
            })
            await this.localParticipant.setMicrophoneEnabled(true)
            
            this.emit('audio_processing_enabled', {
              effects: this.voiceEffectsProcessor.getEffectsState()
            })
          }
        }
        
        // Set up additional Web Audio processing if needed
        this.setupWebAudioProcessing(mediaStreamTrack)
      }
    } catch (error) {
      // Fallback to basic audio without effects
      this.setupWebAudioProcessing(mediaStreamTrack)
    }
  }

  setupWebAudioProcessing(audioTrack) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
      
      // Create gain node for volume control
      const gainNode = audioContext.createGain()
      
      // Create filter for voice enhancement
      const filterNode = audioContext.createBiquadFilter()
      filterNode.type = 'highpass'
      filterNode.frequency.value = 85 // Remove low frequency noise
      
      // Connect the audio processing chain
      source.connect(filterNode)
      filterNode.connect(gainNode)
      
      this.audioContext = audioContext
      this.audioNodes = { source, gainNode, filterNode }
      
    } catch (error) {
    }
  }

  startConnectionMonitoring() {
    // Monitor connection stats every 5 seconds
    this.connectionMonitorInterval = setInterval(() => {
      if (this.room && this.connectionState === 'connected') {
        this.collectConnectionStats()
      }
    }, 5000)
  }

  async checkConnectionQuality() {
    try {
      if (!this.room) return

      const stats = await this.room.getStats()
      let totalPacketLoss = 0
      let totalJitter = 0
      let totalRtt = 0
      let participantCount = 0

      for (const [participantId, participantStats] of stats) {
        totalPacketLoss += participantStats.packetsLost || 0
        totalJitter += participantStats.jitter || 0
        totalRtt += participantStats.roundTripTime || 0
        participantCount++
      }

      const avgPacketLoss = participantCount ? totalPacketLoss / participantCount : 0
      const avgJitter = participantCount ? totalJitter / participantCount : 0
      const avgRtt = participantCount ? totalRtt / participantCount : 0

      // Determine connection quality
      let quality = 'excellent'
      if (avgPacketLoss > 5 || avgJitter > 100 || avgRtt > 300) {
        quality = 'poor'
      } else if (avgPacketLoss > 2 || avgJitter > 50 || avgRtt > 150) {
        quality = 'fair'
      } else if (avgPacketLoss > 1 || avgJitter > 20 || avgRtt > 100) {
        quality = 'good'
      }

      this.networkMonitor.lastQualityCheck = Date.now()
      this.networkMonitor.qualityHistory.push({
        timestamp: Date.now(),
        quality,
        packetLoss: avgPacketLoss,
        jitter: avgJitter,
        rtt: avgRtt
      })

      // Keep only last 100 quality checks
      if (this.networkMonitor.qualityHistory.length > 100) {
        this.networkMonitor.qualityHistory.shift()
      }

      this.emit('connection_quality_updated', {
        quality,
        packetLoss: avgPacketLoss,
        jitter: avgJitter,
        rtt: avgRtt,
        timestamp: Date.now()
      })

      // Auto-adjust quality if needed
      if (quality === 'poor' && this.connectionState === 'connected') {
        this.adjustQualityForPoorConnection()
      }

    } catch (error) {
    }
  }

  adaptToNetworkConditions(connection) {
    const effectiveType = connection.effectiveType

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        this.adjustQualitySettings({
          video: { resolution: '360p', frameRate: 10, bitrate: 250000 },
          audio: { bitrate: 32000 }
        })
        break
      case '3g':
        this.adjustQualitySettings({
          video: { resolution: '480p', frameRate: 15, bitrate: 500000 },
          audio: { bitrate: 64000 }
        })
        break
      case '4g':
      default:
        this.adjustQualitySettings({
          video: { resolution: '720p', frameRate: 30, bitrate: 2000000 },
          audio: { bitrate: 128000 }
        })
        break
    }
  }

  adjustQualityForPoorConnection() {
    
    // Reduce video quality first
    if (this.videoEnabled) {
      this.adjustQualitySettings({
        video: { resolution: '360p', frameRate: 15, bitrate: 500000 }
      })
    }
    
    // Then reduce audio quality if still poor
    setTimeout(() => {
      if (this.getLastConnectionQuality() === 'poor') {
        this.adjustQualitySettings({
          audio: { bitrate: 64000 }
        })
      }
    }, 10000)
  }

  adjustQualitySettings(newSettings) {
    if (newSettings.video) {
      this.qualitySettings.video = { ...this.qualitySettings.video, ...newSettings.video }
    }
    if (newSettings.audio) {
      this.qualitySettings.audio = { ...this.qualitySettings.audio, ...newSettings.audio }
    }
    
    this.emit('quality_settings_changed', this.qualitySettings)
  }

  getLastConnectionQuality() {
    if (this.networkMonitor.qualityHistory.length === 0) return 'unknown'
    return this.networkMonitor.qualityHistory[this.networkMonitor.qualityHistory.length - 1].quality
  }

  cleanupOldAnalytics() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    // Clean up quality history
    this.networkMonitor.qualityHistory = this.networkMonitor.qualityHistory.filter(
      entry => entry.timestamp > cutoffTime
    )
    
    // Clean up bandwidth stats
    for (const [participantId, stats] of this.analytics.bandwidthStats) {
      if (stats.timestamp < cutoffTime) {
        this.analytics.bandwidthStats.delete(participantId)
      }
    }
  }

  async collectConnectionStats() {
    try {
      if (!this.room) return

      const stats = await this.room.getStats()
      const timestamp = Date.now()

      for (const [participantId, participantStats] of stats) {
        this.analytics.connectionStats.set(participantId, {
          timestamp,
          ...participantStats,
          sessionDuration: timestamp - this.sessionStartTime
        })
      }

      this.emit('connection_stats_updated', Object.fromEntries(this.analytics.connectionStats))
    } catch (error) {
    }
  }

  async attemptReconnection() {
    if (this.isReconnecting || !this.currentChannel) return

    try {
      const accessToken = await this.generateAccessToken(this.currentChannel.id, this.getCurrentUserId())
      await this.connectToVoiceChannel(this.currentChannel, accessToken)
    } catch (error) {
    }
  }

  setupRoomEventHandlers() {
    if (!this.room) return

    this.room.on(RoomEvent.Connected, () => {
      this.emit('room_connected')
    })

    this.room.on(RoomEvent.Disconnected, (reason) => {
      this.connectionState = 'disconnected'
      this.emit('disconnected', { reason })
    })

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      this.participants.set(participant.sid, participant)
      this.emit('participant_joined', {
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      this.participants.delete(participant.sid)
      this.emit('participant_left', {
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      this.emit('track_subscribed', {
        track,
        publication,
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      this.emit('track_unsubscribed', {
        track,
        publication,
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.TrackMuted, (publication, participant) => {
      this.emit('track_muted', {
        publication,
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      this.emit('track_unmuted', {
        publication,
        participant: this.serializeParticipant(participant)
      })
    })

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      this.emit('active_speakers_changed', {
        speakers: speakers.map(p => this.serializeParticipant(p))
      })
    })

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      this.emit('connection_quality_changed', {
        quality,
        participant: participant ? this.serializeParticipant(participant) : null
      })
    })
  }

  async disconnect(reason = 'user_action') {
    try {
      // Cancel any pending reconnection
      this.cancelReconnection()
      
      // Stop connection monitoring
      if (this.connectionMonitorInterval) {
        clearInterval(this.connectionMonitorInterval)
        this.connectionMonitorInterval = null
      }
      
      // Clean up audio processing
      if (this.audioContext) {
        await this.audioContext.close()
        this.audioContext = null
        this.audioNodes = null
      }
      
      if (this.room) {
        await this.room.disconnect()
        this.room = null
        this.localParticipant = null
        this.participants.clear()
      }

      if (this.currentChannel) {
        socketService.leaveVoiceChannel(this.currentChannel.id, { 
          sessionId: this.sessionId,
          reason 
        })
      }

      // Unregister from SFU manager
      if (this.sessionId) {
        sfuManager.unregisterConnection(this.sessionId)
      }

      const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
      
      this.connectionState = 'disconnected'
      this.currentChannel = null
      this.sessionId = null
      this.sessionStartTime = null
      
      this.emit('disconnected', { 
        reason, 
        sessionDuration,
        analytics: this.getSessionAnalytics()
      })
    } catch (error) {
      console.error('Error disconnecting from voice channel:', error)
    }
  }

  getCurrentUserId() {
    // This should be replaced with actual user ID from auth context
    return localStorage.getItem('user_id') || 'anonymous_user'
  }

  getUserLocation() {
    // Return cached user location if available
    if (sfuManager.userLocation) {
      return sfuManager.userLocation
    }
    
    // Geographic optimization DISABLED - no location permission requests
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(
    //     (position) => {
    //       sfuManager.userLocation = {
    //         lat: position.coords.latitude,
    //         lng: position.coords.longitude
    //       }
    //     },
    //     () => {} // Ignore errors
    //   )
    // }

    return null
  }

  async handleServerFailover(newServer, connectionInfo) {
    
    try {
      // Store current state
      const wasConnected = this.isConnected()
      const currentChannel = this.currentChannel
      const currentOptions = {
        requiredFeatures: connectionInfo.requiredFeatures,
        expectedParticipants: connectionInfo.participantCount,
        qualityPreference: connectionInfo.qualityPreference
      }
      
      // Emit failover start event
      this.emit('server_failover_start', {
        fromServer: this.serverUrl,
        toServer: newServer.url,
        reason: 'server_failure'
      })
      
      // Disconnect from current server
      if (this.room) {
        await this.room.disconnect()
        this.room = null
        this.localParticipant = null
        this.participants.clear()
      }
      
      // Update server URL
      this.serverUrl = newServer.url
      this.connectionState = 'reconnecting'
      
      // Generate new access token for new server
      const accessToken = await this.generateAccessToken(currentChannel.id, this.getCurrentUserId())
      
      // Reconnect to new server
      await this.connectToVoiceChannel(currentChannel, accessToken, currentOptions)
      
      this.emit('server_failover_complete', {
        newServer: newServer.url,
        reconnected: this.isConnected()
      })
      
    } catch (error) {
      console.error('Server failover failed:', error)
      this.emit('server_failover_failed', {
        error: error.message,
        newServer: newServer.url
      })
      
      // Try auto-reconnection with original logic
      this.scheduleReconnection(this.currentChannel, accessToken, currentOptions)
    }
  }

  getSessionAnalytics() {
    if (!this.sessionStartTime) return null
    
    const sessionDuration = Date.now() - this.sessionStartTime
    const qualityHistory = this.networkMonitor.qualityHistory
    
    // Calculate average quality metrics
    let avgPacketLoss = 0
    let avgJitter = 0
    let avgRtt = 0
    let qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
    
    if (qualityHistory.length > 0) {
      qualityHistory.forEach(entry => {
        avgPacketLoss += entry.packetLoss || 0
        avgJitter += entry.jitter || 0
        avgRtt += entry.rtt || 0
        qualityDistribution[entry.quality]++
      })
      
      avgPacketLoss /= qualityHistory.length
      avgJitter /= qualityHistory.length
      avgRtt /= qualityHistory.length
    }
    
    return {
      sessionDuration,
      qualityMetrics: {
        avgPacketLoss,
        avgJitter,
        avgRtt,
        qualityDistribution
      },
      reconnectionAttempts: this.reconnectionAttempts,
      serverUsed: this.serverUrl,
      networkTransitions: this.networkMonitor.connectionType
    }
  }

  // Audio controls
  async enableAudio() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setMicrophoneEnabled(true)
      this.audioEnabled = true
      this.emit('audio_enabled')
      return true
    } catch (error) {
      console.error('Failed to enable audio:', error)
      return false
    }
  }

  async disableAudio() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setMicrophoneEnabled(false)
      this.audioEnabled = false
      this.emit('audio_disabled')
      return true
    } catch (error) {
      console.error('Failed to disable audio:', error)
      return false
    }
  }

  async toggleAudio() {
    if (this.audioEnabled) {
      return await this.disableAudio()
    } else {
      return await this.enableAudio()
    }
  }

  // Video controls
  async enableVideo() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setCameraEnabled(true)
      this.videoEnabled = true
      this.emit('video_enabled')
      return true
    } catch (error) {
      console.error('Failed to enable video:', error)
      return false
    }
  }

  async disableVideo() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setCameraEnabled(false)
      this.videoEnabled = false
      this.emit('video_disabled')
      return true
    } catch (error) {
      console.error('Failed to disable video:', error)
      return false
    }
  }

  async toggleVideo() {
    if (this.videoEnabled) {
      return await this.disableVideo()
    } else {
      return await this.enableVideo()
    }
  }

  // Screen sharing
  async enableScreenShare() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setScreenShareEnabled(true)
      this.screenShareEnabled = true
      this.emit('screen_share_enabled')
      return true
    } catch (error) {
      console.error('Failed to enable screen share:', error)
      return false
    }
  }

  async disableScreenShare() {
    try {
      if (!this.localParticipant) return false

      await this.localParticipant.setScreenShareEnabled(false)
      this.screenShareEnabled = false
      this.emit('screen_share_disabled')
      return true
    } catch (error) {
      console.error('Failed to disable screen share:', error)
      return false
    }
  }

  async toggleScreenShare() {
    if (this.screenShareEnabled) {
      return await this.disableScreenShare()
    } else {
      return await this.enableScreenShare()
    }
  }

  // Utility methods
  serializeParticipant(participant) {
    if (!participant) return null
    
    return {
      sid: participant.sid,
      identity: participant.identity,
      name: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      audioEnabled: participant.isMicrophoneEnabled,
      videoEnabled: participant.isCameraEnabled,
      screenShareEnabled: participant.isScreenShareEnabled,
      connectionQuality: participant.connectionQuality,
      joinedAt: participant.joinedAt,
      isLocal: participant instanceof LocalParticipant
    }
  }

  getParticipants() {
    const participants = []
    
    // Add local participant
    if (this.localParticipant) {
      participants.push(this.serializeParticipant(this.localParticipant))
    }
    
    // Add remote participants
    this.participants.forEach(participant => {
      participants.push(this.serializeParticipant(participant))
    })
    
    return participants
  }

  getConnectionState() {
    return this.connectionState
  }

  isConnected() {
    return this.connectionState === 'connected' && this.room?.state === 'connected'
  }

  getCurrentChannel() {
    return this.currentChannel
  }

  getRoom() {
    return this.room
  }

  // Access token generation (should be done on server)
  async generateAccessToken(channelId, userId) {
    try {
      // Import apiService dynamically to avoid circular dependencies
      const { default: apiService } = await import('./api.js')

      const response = await apiService.post('/voice/token', {
        channelId,
        userId
      })

      if (response.success && response.data?.token) {
        return response.data.token
      }

      throw new Error(response.error || 'Failed to generate access token')
    } catch (error) {
      console.error('Failed to generate voice access token:', error)

      // Development fallback: throw error instead of returning mock token
      // This ensures developers know the API endpoint needs to be implemented
      if (import.meta.env.DEV) {
        console.warn(
          'Voice token API not available. Ensure backend implements POST /api/v1/voice/token endpoint.\n' +
          'Required response format: { success: true, data: { token: "jwt_token" } }'
        )
      }

      throw new Error(
        'Voice channel access token unavailable. Please ensure you are connected to the backend server.'
      )
    }
  }

  // Enhanced analytics and monitoring
  startAnalyticsCollection() {
    // Collect bandwidth stats every 5 seconds
    setInterval(() => {
      if (this.room && this.connectionState === 'connected') {
        this.collectBandwidthStats()
      }
    }, 5000)
  }

  async collectBandwidthStats() {
    try {
      const stats = await this.room.getStats()
      
      for (const [participantId, participantStats] of stats) {
        this.analytics.bandwidthStats.set(participantId, {
          timestamp: Date.now(),
          bytesReceived: participantStats.bytesReceived || 0,
          bytesSent: participantStats.bytesSent || 0,
          packetsLost: participantStats.packetsLost || 0,
          jitter: participantStats.jitter || 0,
          rtt: participantStats.roundTripTime || 0
        })
      }
      
      this.emit('bandwidth_stats_updated', this.analytics.bandwidthStats)
    } catch (error) {
    }
  }

  // Enhanced recording management with comprehensive features
  async startRecording(options = {}) {
    if (!this.room || this.isRecording) return false
    
    try {
      const recordingOptions = {
        config: options.quality || 'video-hd', // audio-only, video-hd, video-4k, screen-share
        participants: this.getParticipants(),
        metadata: {
          channelName: this.currentChannel?.name,
          roomLayout: options.layout || 'grid',
          quality: options.quality || 'high',
          includeTranscription: options.enableTranscription !== false,
          includeAI: options.enableAI !== false,
          priority: options.priority || 'normal'
        },
        channelId: this.currentChannel?.id,
        userId: this.getCurrentUserId(),
        roomLayout: options.layout || 'grid',
        enableTranscription: options.enableTranscription !== false,
        enableAI: options.enableAI !== false
      }
      
      this.recordingId = await this.recordingManager.startRecording(recordingOptions)
      this.isRecording = true
      
      this.emit('recording_started', { 
        recordingId: this.recordingId,
        options: recordingOptions 
      })
      
      return true
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      this.emit('recording_error', { error: error.message })
      return false
    }
  }

  async pauseRecording() {
    if (!this.isRecording || !this.recordingId) return false
    
    try {
      await this.recordingManager.pauseRecording(this.recordingId)
      this.emit('recording_paused', { recordingId: this.recordingId })
      return true
    } catch (error) {
      console.error('Failed to pause recording:', error)
      return false
    }
  }

  async resumeRecording() {
    if (!this.isRecording || !this.recordingId) return false
    
    try {
      await this.recordingManager.resumeRecording(this.recordingId)
      this.emit('recording_resumed', { recordingId: this.recordingId })
      return true
    } catch (error) {
      console.error('Failed to resume recording:', error)
      return false
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.recordingId) return false
    
    try {
      await this.recordingManager.stopRecording(this.recordingId)
      
      const recordingId = this.recordingId
      this.isRecording = false
      this.recordingId = null
      
      this.emit('recording_stopped', { recordingId })
      return true
      
    } catch (error) {
      console.error('Failed to stop recording:', error)
      this.emit('recording_error', { error: error.message })
      return false
    }
  }

  // Recording utility methods
  getRecordingStatus() {
    if (!this.recordingManager) return null
    
    return {
      isRecording: this.isRecording,
      recordingId: this.recordingId,
      recordings: this.recordingManager.getAllRecordings(),
      activeRecordings: this.recordingManager.getActiveRecordings()
    }
  }

  getRecording(recordingId) {
    if (!this.recordingManager) return null
    return this.recordingManager.getRecording(recordingId)
  }

  async downloadRecording(recordingId, format = 'original') {
    if (!this.recordingManager) return null
    
    const recording = this.recordingManager.getRecording(recordingId)
    if (!recording || !recording.blob) return null
    
    try {
      // Create download URL
      const url = URL.createObjectURL(recording.blob)
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = recording.filename || `recording_${recordingId}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(url), 100)
      
      return true
    } catch (error) {
      console.error('Failed to download recording:', error)
      return false
    }
  }

  async shareRecording(recordingId, options = {}) {
    if (!this.recordingManager) return null
    
    const recording = this.recordingManager.getRecording(recordingId)
    if (!recording) return null
    
    // If recording is uploaded to cloud, return cloud URL
    if (recording.cloudStorage?.url) {
      return {
        url: recording.cloudStorage.url,
        expiresAt: options.expiresAt,
        accessType: options.accessType || 'private'
      }
    }
    
    // Otherwise create temporary sharing link
    if (recording.blob) {
      const url = URL.createObjectURL(recording.blob)
      return {
        url,
        temporary: true,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    }
    
    return null
  }

  // Real-time recording features
  getRecordingTranscription(recordingId) {
    if (!this.recordingManager) return null
    
    const recording = this.recordingManager.getRecording(recordingId)
    return recording?.transcription || null
  }

  getRecordingAI(recordingId) {
    if (!this.recordingManager) return null
    
    const recording = this.recordingManager.getRecording(recordingId)
    return recording?.ai || null
  }

  getRecordingAnalytics(recordingId) {
    if (!this.recordingManager) return null
    
    const recording = this.recordingManager.getRecording(recordingId)
    return recording?.analytics || null
  }

  // Enhanced voice effects implementation
  async applyVoiceEffect(effectType, enabled, parameters = {}) {
    if (!this.voiceEffectsProcessor || !this.voiceEffectsProcessor.isProcessing) {
      return false
    }
    
    try {
      await this.voiceEffectsProcessor.setEffect(effectType, enabled, parameters)
      
      // Update local voice effects state
      if (this.voiceEffects[effectType]) {
        this.voiceEffects[effectType] = enabled
        if (typeof parameters === 'object') {
          Object.assign(this.voiceEffects[effectType], parameters)
        }
      }
      
      this.emit('voice_effect_applied', { effectType, enabled, parameters })
      return true
    } catch (error) {
      console.error('Failed to apply voice effect:', error)
      return false
    }
  }

  async setVoiceEffectParameter(effectType, parameter, value) {
    if (!this.voiceEffectsProcessor) return false
    
    try {
      const currentEffect = this.voiceEffectsProcessor.effects[effectType]
      if (currentEffect) {
        await this.voiceEffectsProcessor.setEffect(effectType, currentEffect.enabled, {
          [parameter]: value
        })
        return true
      }
    } catch (error) {
      console.error('Failed to set voice effect parameter:', error)
    }
    
    return false
  }

  async enableRobotVoice(carrierFreq = 1000, modulatorFreq = 30, depth = 0.8) {
    return this.applyVoiceEffect('robot', true, {
      carrierFreq,
      modulatorFreq,
      depth
    })
  }

  async enableEcho(delay = 0.3, feedback = 0.4, wetness = 0.3) {
    return this.applyVoiceEffect('echo', true, {
      delay,
      feedback,
      wetness
    })
  }

  async enableReverb(roomSize = 0.7, damping = 0.3, wetness = 0.4) {
    return this.applyVoiceEffect('reverb', true, {
      roomSize,
      damping,
      wetness
    })
  }

  async setPitchShift(semitones = 0, formantCorrection = true) {
    return this.applyVoiceEffect('pitchShift', Math.abs(semitones) > 0.1, {
      pitch: semitones,
      formantCorrection
    })
  }

  async enableNoiseGate(threshold = -50, ratio = 10) {
    return this.applyVoiceEffect('noiseGate', true, {
      threshold,
      ratio
    })
  }

  async enableVoiceEnhancement(clarity = 0.3, presence = 0.2, warmth = 0.1) {
    return this.applyVoiceEffect('voiceEnhancement', true, {
      clarity,
      presence,
      warmth
    })
  }

  async setMasterVolume(volume) {
    if (this.voiceEffectsProcessor) {
      this.voiceEffectsProcessor.setVolume(volume)
      this.emit('master_volume_changed', { volume })
      return true
    }
    return false
  }

  // Voice activity detection
  getVoiceActivity() {
    if (this.voiceEffectsProcessor) {
      return this.voiceEffectsProcessor.getVoiceActivity()
    }
    return { isActive: false, level: -100, history: [] }
  }

  // Audio analysis
  getAudioAnalysis() {
    if (this.voiceEffectsProcessor) {
      return this.voiceEffectsProcessor.getAudioAnalysis()
    }
    return {
      fundamentalFreq: 0,
      formants: [],
      spectralCentroid: 0,
      spectralRolloff: 0,
      pitch: 0,
      confidence: 0
    }
  }

  // Get current effects state
  getVoiceEffectsState() {
    if (this.voiceEffectsProcessor) {
      return this.voiceEffectsProcessor.getEffectsState()
    }
    return this.voiceEffects
  }

  // AI-powered features
  async enableAINoiseReduction(aggressiveness = 0.7) {
    if (this.voiceEffectsProcessor) {
      await this.voiceEffectsProcessor.enableNoiseReduction(aggressiveness)
      this.emit('ai_noise_reduction_enabled', { aggressiveness })
      return true
    }
    return false
  }

  async enableVoiceCloning(targetVoiceProfile) {
    if (this.voiceEffectsProcessor) {
      await this.voiceEffectsProcessor.enableVoiceCloning(targetVoiceProfile)
      this.emit('voice_cloning_enabled', { targetVoiceProfile })
      return true
    }
    return false
  }

  // Enhanced spatial audio
  async enableSpatialAudio(position = { x: 0, y: 0, z: 0 }, roomSize = 'medium') {
    if (this.voiceEffectsProcessor) {
      await this.voiceEffectsProcessor.setEffect('spatialAudio', true, {
        position,
        roomSize
      })
      this.spatialAudioEnabled = true
      this.emit('spatial_audio_enabled', { position, roomSize })
      return true
    }
    
    // Fallback for basic spatial audio
    this.spatialAudioEnabled = true
    this.emit('spatial_audio_enabled')
    return true
  }

  async setSpatialPosition(x, y, z) {
    if (this.voiceEffectsProcessor) {
      this.voiceEffectsProcessor.setSpatialPosition(x, y, z)
      this.emit('spatial_position_changed', { x, y, z })
      return true
    }
    return false
  }

  async disableSpatialAudio() {
    if (this.voiceEffectsProcessor) {
      await this.voiceEffectsProcessor.setEffect('spatialAudio', false)
    }
    this.spatialAudioEnabled = false
    this.emit('spatial_audio_disabled')
    return true
  }

  // Push-to-talk
  setupPushToTalk() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('keydown', (event) => {
      if (this.pushToTalkEnabled && event.code === this.pushToTalkKey && !this.isPushToTalkActive) {
        this.isPushToTalkActive = true
        this.enableAudio()
        this.emit('push_to_talk_start')
      }
    })
    
    window.addEventListener('keyup', (event) => {
      if (this.pushToTalkEnabled && event.code === this.pushToTalkKey && this.isPushToTalkActive) {
        this.isPushToTalkActive = false
        this.disableAudio()
        this.emit('push_to_talk_end')
      }
    })
  }

  togglePushToTalk(enabled = !this.pushToTalkEnabled) {
    this.pushToTalkEnabled = enabled
    
    if (enabled) {
      this.disableAudio()
    } else {
      this.enableAudio()
    }
    
    this.emit('push_to_talk_toggled', { enabled })
    return enabled
  }

  // Device management
  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      this.audioDevices = devices.filter(device => device.kind === 'audioinput')
      this.videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      this.emit('devices_updated', {
        audioDevices: this.audioDevices,
        videoDevices: this.videoDevices
      })
      
      return { audioDevices: this.audioDevices, videoDevices: this.videoDevices }
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      return { audioDevices: [], videoDevices: [] }
    }
  }

  // Moderation
  async muteParticipant(participantId, muted = true) {
    if (!this.moderationTools.canMuteOthers) {
      throw new Error('Insufficient permissions to mute participants')
    }
    
    this.emit('participant_moderated', { participantId, action: muted ? 'mute' : 'unmute' })
    return true
  }

  // Analytics getters
  getAnalytics() {
    const baseAnalytics = {
      connectionStats: Object.fromEntries(this.analytics.connectionStats),
      bandwidthStats: Object.fromEntries(this.analytics.bandwidthStats),
      audioLevels: Object.fromEntries(this.analytics.audioLevels),
      participantMetrics: Object.fromEntries(this.analytics.participantMetrics),
      sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    }
    
    // Include adaptive bitrate analytics
    if (this.adaptiveBitrateManager) {
      baseAnalytics.adaptiveBitrate = this.adaptiveBitrateManager.getMetrics()
      baseAnalytics.qualityRecommendations = this.adaptiveBitrateManager.getRecommendations()
    }
    
    return baseAnalytics
  }

  // Adaptive bitrate control methods
  async setQualityProfile(profileName) {
    if (this.adaptiveBitrateManager) {
      const success = await this.adaptiveBitrateManager.setProfile(profileName)
      if (success) {
        this.emit('quality_profile_changed', { 
          profile: profileName, 
          reason: 'manual' 
        })
      }
      return success
    }
    return false
  }

  getQualityProfile() {
    if (this.adaptiveBitrateManager) {
      return this.adaptiveBitrateManager.currentProfile
    }
    return 'unknown'
  }

  getQualityMetrics() {
    if (this.adaptiveBitrateManager) {
      return this.adaptiveBitrateManager.getMetrics()
    }
    return null
  }

  enableAdaptiveBitrate() {
    if (this.adaptiveBitrateManager) {
      this.adaptiveBitrateManager.currentProfile = 'auto'
      this.emit('adaptive_bitrate_enabled')
      return true
    }
    return false
  }

  disableAdaptiveBitrate() {
    if (this.adaptiveBitrateManager) {
      // Set to high quality and disable automatic adaptation
      this.adaptiveBitrateManager.setProfile('high')
      this.emit('adaptive_bitrate_disabled')
      return true
    }
    return false
  }

  // Mobile-specific optimizations
  enableMobileOptimizations() {
    if (this.adaptiveBitrateManager && this.adaptiveBitrateManager.deviceType === 'mobile') {
      // Force mobile-optimized profile
      this.adaptiveBitrateManager.setProfile('medium')
      
      // Enable battery optimizations
      this.enableVoiceEnhancement(0.2, 0.1, 0.1) // Reduced processing
      this.enableNoiseGate(-45, 8) // More aggressive noise gate
      
      this.emit('mobile_optimizations_enabled')
      return true
    }
    return false
  }

  // Network condition handling
  handlePoorNetworkConditions() {
    if (this.adaptiveBitrateManager) {
      this.adaptiveBitrateManager.enableEmergencyMode()
      this.emit('emergency_mode_enabled', { 
        reason: 'poor_network_conditions' 
      })
    }
  }

  handleNetworkRecovery() {
    if (this.adaptiveBitrateManager) {
      this.adaptiveBitrateManager.disableEmergencyMode()
      this.emit('emergency_mode_disabled', { 
        reason: 'network_recovery' 
      })
    }
  }

  // Clean up with enhanced cleanup
  async destroy() {
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording()
    }
    
    // Cancel any pending reconnection
    this.cancelReconnection()
    
    // Stop connection monitoring
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval)
    }
    
    // Destroy voice effects processor
    if (this.voiceEffectsProcessor) {
      await this.voiceEffectsProcessor.destroy()
      this.voiceEffectsProcessor = null
    }
    
    // Destroy adaptive bitrate manager
    if (this.adaptiveBitrateManager) {
      this.adaptiveBitrateManager.destroy()
      this.adaptiveBitrateManager = null
    }
    
    // Destroy recording manager
    if (this.recordingManager) {
      await this.recordingManager.destroy()
      this.recordingManager = null
    }
    
    // Destroy mobile call manager
    if (this.mobileCallManager) {
      await this.mobileCallManager.destroy()
      this.mobileCallManager = null
    }
    
    // Clean up enhanced audio stream
    if (this.enhancedAudioStream) {
      this.enhancedAudioStream.getTracks().forEach(track => track.stop())
      this.enhancedAudioStream = null
    }
    
    // Disconnect and clean up
    await this.disconnect('service_shutdown')
    this.listeners.clear()
    
    // Clear analytics data
    if (this.analytics) {
      this.analytics.connectionStats.clear()
      this.analytics.bandwidthStats.clear()
      this.analytics.audioLevels.clear()
      this.analytics.participantMetrics.clear()
    }
    
    // Unregister from SFU manager
    if (this.sessionId) {
      sfuManager.unregisterConnection(this.sessionId)
    }
    
  }
}

// Export singleton instance
const webrtcService = new WebRTCService()
export default webrtcService