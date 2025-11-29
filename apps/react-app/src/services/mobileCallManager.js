/**
 * Mobile Call Manager for CRYB Platform
 * Handles iOS CallKit and Android TelecomManager integration for native call experience
 * Provides system-level call handling and background audio processing
 */

class MobileCallManager {
  constructor() {
    this.isInitialized = false
    this.platform = this.detectPlatform()
    this.callKitEnabled = false
    this.telecomEnabled = false
    this.backgroundAudioEnabled = false
    
    // Call state management
    this.activeCall = null
    this.incomingCall = null
    this.callHistory = []
    this.callUUID = null
    
    // Native integration objects
    this.callKit = null // iOS CallKit
    this.telecomManager = null // Android TelecomManager
    this.audioManager = null
    
    // Configuration
    this.config = {
      appName: 'CRYB',
      maxCallDuration: 8 * 60 * 60 * 1000, // 8 hours
      enableSystemUI: true,
      enableProximityMonitoring: true,
      enableSpeakerToggle: true,
      enableMuteToggle: true,
      enableVideo: true,
      ringtonePath: '/assets/sounds/ringtone.mp3',
      icon: '/assets/icons/icon-call.png'
    }
    
    // Audio session management
    this.audioSession = {
      category: 'playAndRecord',
      mode: 'voiceChat',
      options: ['allowBluetooth', 'allowBluetoothA2DP', 'defaultToSpeaker']
    }
    
    // WebRTC service reference
    this.webrtcService = null
    
    // Event listeners
    this.eventListeners = new Map()
    
    this.initialize()
  }

  detectPlatform() {
    const userAgent = navigator.userAgent
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'ios'
    } else if (/Android/i.test(userAgent)) {
      return 'android'
    } else {
      return 'web'
    }
  }

  async initialize() {
    try {
      
      // Initialize platform-specific features
      switch (this.platform) {
        case 'ios':
          await this.initializeCallKit()
          break
        case 'android':
          await this.initializeTelecomManager()
          break
        default:
      }
      
      // Initialize audio session management
      await this.initializeAudioSession()
      
      // Set up background audio processing
      await this.setupBackgroundAudio()
      
      // Set up system event listeners
      this.setupSystemEventListeners()
      
      this.isInitialized = true
      
    } catch (error) {
      console.error('Failed to initialize mobile call manager:', error)
    }
  }

  async initializeCallKit() {
    try {
      // Check if CallKit is available (iOS only)
      if (typeof window !== 'undefined' && window.CallKit) {
        this.callKit = window.CallKit
        
        // Configure CallKit
        await this.callKit.configure({
          appName: this.config.appName,
          imageName: this.config.icon,
          ringtoneSound: this.config.ringtonePath,
          includesCallsInRecents: true,
          supportsVideo: this.config.enableVideo,
          maximumCallsPerCallGroup: 1,
          maximumCallGroups: 1
        })
        
        // Set up CallKit event handlers
        this.setupCallKitEventHandlers()
        
        this.callKitEnabled = true
        
      } else {
      }
    } catch (error) {
      console.error('Failed to initialize CallKit:', error)
    }
  }

  setupCallKitEventHandlers() {
    if (!this.callKit) return
    
    // Handle answer call
    this.callKit.on('answerCall', (data) => {
      this.handleAnswerCall(data.callUUID)
    })
    
    // Handle end call
    this.callKit.on('endCall', (data) => {
      this.handleEndCall(data.callUUID)
    })
    
    // Handle mute call
    this.callKit.on('setMutedCall', (data) => {
      this.handleMuteToggle(data.callUUID, data.muted)
    })
    
    // Handle hold call
    this.callKit.on('setHeldCall', (data) => {
      this.handleHoldToggle(data.callUUID, data.onHold)
    })
    
    // Handle DTMF (dial tone)
    this.callKit.on('playDTMF', (data) => {
      this.handleDTMF(data.callUUID, data.digits)
    })
  }

  async initializeTelecomManager() {
    try {
      // Check if TelecomManager is available (Android only)
      if (typeof window !== 'undefined' && window.TelecomManager) {
        this.telecomManager = window.TelecomManager
        
        // Register phone account
        await this.telecomManager.registerPhoneAccount({
          accountHandle: {
            componentName: 'ai.cryb.app',
            id: 'cryb_calling'
          },
          address: 'sip:cryb@cryb.ai',
          subscriptionAddress: 'sip:cryb@cryb.ai',
          capabilities: [
            'CAPABILITY_CALL_PROVIDER',
            'CAPABILITY_CONNECTION_MANAGER',
            'CAPABILITY_VIDEO_CALLING',
            'CAPABILITY_SUPPORTS_VIDEO_CALLING'
          ],
          highlightColor: 0x0066CC,
          label: this.config.appName,
          shortDescription: 'CRYB Voice & Video Calls',
          supportedUriSchemes: ['sip', 'tel']
        })
        
        // Set up TelecomManager event handlers
        this.setupTelecomEventHandlers()
        
        this.telecomEnabled = true
        
      } else {
      }
    } catch (error) {
      console.error('Failed to initialize TelecomManager:', error)
    }
  }

  setupTelecomEventHandlers() {
    if (!this.telecomManager) return
    
    // Handle incoming call
    this.telecomManager.on('onCreateIncomingConnection', (data) => {
      this.handleIncomingConnection(data)
    })
    
    // Handle outgoing call
    this.telecomManager.on('onCreateOutgoingConnection', (data) => {
      this.handleOutgoingConnection(data)
    })
    
    // Handle connection state changes
    this.telecomManager.on('onConnectionStateChanged', (data) => {
      this.handleConnectionStateChange(data)
    })
  }

  async initializeAudioSession() {
    try {
      // Configure audio session for optimal voice calling
      if (typeof window !== 'undefined' && window.AudioSession) {
        this.audioManager = window.AudioSession
        
        await this.audioManager.setCategory(
          this.audioSession.category,
          this.audioSession.mode,
          this.audioSession.options
        )
        
        // Enable proximity monitoring
        if (this.config.enableProximityMonitoring) {
          await this.audioManager.setProximityMonitoringEnabled(true)
        }
        
      }
    } catch (error) {
      console.error('Failed to configure audio session:', error)
    }
  }

  async setupBackgroundAudio() {
    try {
      // Request background audio permissions
      if ('serviceWorker' in navigator) {
        // Register service worker for background processing
        const registration = await navigator.serviceWorker.register('/sw-call.js')
        
        // Set up message handling with service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data)
        })
      }
      
      // Request persistent notification permission for call notifications
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission()
      }
      
      // Set up wake lock to prevent screen sleep during calls
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen')
      }
      
      this.backgroundAudioEnabled = true
      
    } catch (error) {
      console.error('Failed to setup background audio:', error)
    }
  }

  setupSystemEventListeners() {
    // Handle app state changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.activeCall) {
        this.handleAppBackgrounded()
      } else if (!document.hidden && this.activeCall) {
        this.handleAppForegrounded()
      }
    })
    
    // Handle page unload during active call
    window.addEventListener('beforeunload', (event) => {
      if (this.activeCall) {
        event.preventDefault()
        event.returnValue = 'You have an active call. Are you sure you want to leave?'
        return event.returnValue
      }
    })
    
    // Handle network changes
    window.addEventListener('online', () => {
      if (this.activeCall) {
        this.handleNetworkReconnected()
      }
    })
    
    window.addEventListener('offline', () => {
      if (this.activeCall) {
        this.handleNetworkDisconnected()
      }
    })
  }

  // Call management methods
  async startOutgoingCall(options = {}) {
    const {
      calleeId,
      calleeName,
      calleeAvatar,
      channelId,
      isVideoCall = false,
      metadata = {}
    } = options
    
    try {
      // Generate call UUID
      const callUUID = this.generateCallUUID()
      
      // Create call object
      const call = {
        uuid: callUUID,
        direction: 'outgoing',
        calleeId,
        calleeName,
        calleeAvatar,
        channelId,
        isVideoCall,
        startTime: Date.now(),
        status: 'connecting',
        metadata
      }
      
      this.activeCall = call
      this.callUUID = callUUID
      
      // Start native call UI
      if (this.callKitEnabled) {
        await this.callKit.startCall({
          callUUID,
          handle: calleeName,
          handleType: 'generic',
          hasVideo: isVideoCall,
          contactIdentifier: calleeId
        })
      } else if (this.telecomEnabled) {
        await this.telecomManager.placeCall({
          address: `sip:${calleeId}@cryb.ai`,
          extras: {
            calleeName,
            isVideoCall,
            channelId
          }
        })
      }
      
      // Start WebRTC connection
      if (this.webrtcService) {
        await this.webrtcService.connectToVoiceChannel(
          { id: channelId, name: calleeName },
          await this.webrtcService.generateAccessToken(channelId, calleeId)
        )
      }
      
      // Update call status
      call.status = 'ringing'
      this.emit('call_started', call)
      
      return callUUID
      
    } catch (error) {
      console.error('Failed to start outgoing call:', error)
      this.handleCallError(error)
      throw error
    }
  }

  async handleIncomingCall(options = {}) {
    const {
      callerId,
      callerName,
      callerAvatar,
      channelId,
      isVideoCall = false,
      metadata = {}
    } = options
    
    try {
      // Generate call UUID
      const callUUID = this.generateCallUUID()
      
      // Create call object
      const call = {
        uuid: callUUID,
        direction: 'incoming',
        callerId,
        callerName,
        callerAvatar,
        channelId,
        isVideoCall,
        startTime: Date.now(),
        status: 'ringing',
        metadata
      }
      
      this.incomingCall = call
      this.callUUID = callUUID
      
      // Show native incoming call UI
      if (this.callKitEnabled) {
        await this.callKit.displayIncomingCall({
          callUUID,
          handle: callerName,
          handleType: 'generic',
          hasVideo: isVideoCall,
          localizedCallerName: callerName,
          contactIdentifier: callerId
        })
      } else if (this.telecomEnabled) {
        await this.telecomManager.addNewIncomingCall({
          handle: `sip:${callerId}@cryb.ai`,
          extras: {
            callerName,
            isVideoCall,
            channelId
          }
        })
      } else {
        // Fallback: show browser notification
        this.showIncomingCallNotification(call)
      }
      
      this.emit('incoming_call', call)
      
      return callUUID
      
    } catch (error) {
      console.error('Failed to handle incoming call:', error)
      throw error
    }
  }

  async answerCall(callUUID = this.callUUID) {
    try {
      const call = this.incomingCall || this.activeCall
      if (!call || call.uuid !== callUUID) {
        throw new Error('Call not found')
      }
      
      // Update call status
      call.status = 'connecting'
      call.answerTime = Date.now()
      
      // Move from incoming to active
      if (this.incomingCall) {
        this.activeCall = this.incomingCall
        this.incomingCall = null
      }
      
      // Connect to WebRTC
      if (this.webrtcService && call.channelId) {
        await this.webrtcService.connectToVoiceChannel(
          { id: call.channelId, name: call.callerName || call.calleeName },
          await this.webrtcService.generateAccessToken(call.channelId, call.callerId || call.calleeId)
        )
      }
      
      // Update native call status
      if (this.callKitEnabled) {
        await this.callKit.reportConnectedOutgoingCall(callUUID)
      }
      
      // Update call status
      call.status = 'connected'
      call.connectedTime = Date.now()
      
      this.emit('call_answered', call)
      
      
    } catch (error) {
      console.error('Failed to answer call:', error)
      this.handleCallError(error)
    }
  }

  async endCall(callUUID = this.callUUID, reason = 'user_ended') {
    try {
      const call = this.activeCall || this.incomingCall
      if (!call) return
      
      // Update call status
      call.status = 'ended'
      call.endTime = Date.now()
      call.endReason = reason
      call.duration = call.connectedTime ? call.endTime - call.connectedTime : 0
      
      // Disconnect WebRTC
      if (this.webrtcService) {
        await this.webrtcService.disconnect(reason)
      }
      
      // End native call
      if (this.callKitEnabled) {
        await this.callKit.endCall(callUUID)
      } else if (this.telecomEnabled) {
        await this.telecomManager.disconnectCall(callUUID)
      }
      
      // Add to call history
      this.callHistory.unshift(call)
      
      // Keep only last 100 calls
      if (this.callHistory.length > 100) {
        this.callHistory = this.callHistory.slice(0, 100)
      }
      
      // Clean up call state
      this.activeCall = null
      this.incomingCall = null
      this.callUUID = null
      
      // Release wake lock
      if (this.wakeLock) {
        this.wakeLock.release()
        this.wakeLock = null
      }
      
      this.emit('call_ended', call)
      
      
    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }

  async muteCall(muted = true) {
    try {
      if (!this.activeCall) return false
      
      // Update WebRTC mute state
      if (this.webrtcService) {
        if (muted) {
          await this.webrtcService.disableAudio()
        } else {
          await this.webrtcService.enableAudio()
        }
      }
      
      // Update native call mute state
      if (this.callKitEnabled) {
        await this.callKit.setMutedCall(this.callUUID, muted)
      }
      
      this.activeCall.isMuted = muted
      this.emit('call_muted', { callUUID: this.callUUID, muted })
      
      return true
    } catch (error) {
      console.error('Failed to mute call:', error)
      return false
    }
  }

  async holdCall(onHold = true) {
    try {
      if (!this.activeCall) return false
      
      // Update call hold state
      this.activeCall.isOnHold = onHold
      
      // Update native call hold state
      if (this.callKitEnabled) {
        await this.callKit.setHeldCall(this.callUUID, onHold)
      }
      
      this.emit('call_held', { callUUID: this.callUUID, onHold })
      
      return true
    } catch (error) {
      console.error('Failed to hold call:', error)
      return false
    }
  }

  async toggleSpeaker() {
    try {
      if (!this.audioManager) return false
      
      const isCurrentlySpeaker = await this.audioManager.getCurrentOutput() === 'speaker'
      const newOutput = isCurrentlySpeaker ? 'earpiece' : 'speaker'
      
      await this.audioManager.setOutput(newOutput)
      
      this.emit('speaker_toggled', { output: newOutput })
      
      return true
    } catch (error) {
      console.error('Failed to toggle speaker:', error)
      return false
    }
  }

  // Utility methods
  generateCallUUID() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  showIncomingCallNotification(call) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Incoming call from ${call.callerName}`, {
        icon: call.callerAvatar || this.config.icon,
        body: call.isVideoCall ? 'Video call' : 'Voice call',
        requireInteraction: true,
        actions: [
          { action: 'answer', title: 'Answer' },
          { action: 'decline', title: 'Decline' }
        ]
      })
      
      notification.onclick = () => this.answerCall(call.uuid)
    }
  }

  // Event handlers
  handleAnswerCall(callUUID) {
    this.answerCall(callUUID)
  }

  handleEndCall(callUUID) {
    this.endCall(callUUID, 'user_ended')
  }

  handleMuteToggle(callUUID, muted) {
    this.muteCall(muted)
  }

  handleHoldToggle(callUUID, onHold) {
    this.holdCall(onHold)
  }

  handleDTMF(callUUID, digits) {
    this.emit('dtmf_sent', { callUUID, digits })
  }

  handleIncomingConnection(data) {
    // Extract call information from telecom data
    const call = {
      callerId: data.address?.replace('sip:', '').replace('@cryb.ai', ''),
      callerName: data.extras?.callerName || 'Unknown',
      channelId: data.extras?.channelId,
      isVideoCall: data.extras?.isVideoCall || false
    }
    
    this.handleIncomingCall(call)
  }

  handleOutgoingConnection(data) {
    // Handle outgoing connection setup
  }

  handleConnectionStateChange(data) {
    if (this.activeCall) {
      this.activeCall.connectionState = data.state
      this.emit('connection_state_changed', data)
    }
  }

  handleAppBackgrounded() {
    // Ensure call continues in background
  }

  handleAppForegrounded() {
    // Update UI state
  }

  handleNetworkDisconnected() {
    this.emit('network_disconnected')
  }

  handleNetworkReconnected() {
    this.emit('network_reconnected')
  }

  handleServiceWorkerMessage(data) {
    
    switch (data.type) {
      case 'call_ended_background':
        this.endCall(data.callUUID, 'background_timeout')
        break
      case 'call_quality_poor':
        this.emit('call_quality_poor', data)
        break
    }
  }

  handleCallError(error) {
    console.error('Call error:', error)
    this.emit('call_error', { error: error.message })
    
    // End call on error
    if (this.activeCall || this.incomingCall) {
      this.endCall(this.callUUID, 'error')
    }
  }

  // State getters
  getActiveCall() {
    return this.activeCall
  }

  getIncomingCall() {
    return this.incomingCall
  }

  getCallHistory() {
    return [...this.callHistory]
  }

  isCallActive() {
    return this.activeCall !== null
  }

  isCallIncoming() {
    return this.incomingCall !== null
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  // Integration with WebRTC service
  initialize(webrtcService) {
    this.webrtcService = webrtcService
  }

  // Cleanup
  async destroy() {
    // End any active calls
    if (this.activeCall || this.incomingCall) {
      await this.endCall(this.callUUID, 'service_shutdown')
    }
    
    // Release wake lock
    if (this.wakeLock) {
      this.wakeLock.release()
    }
    
    // Clear event listeners
    this.eventListeners.clear()
    
    // Clean up native integrations
    this.callKit = null
    this.telecomManager = null
    this.audioManager = null
    
  }
}

export default MobileCallManager