/**
 * Adaptive Bitrate Manager for CRYB Platform
 * Handles dynamic quality adjustment based on network conditions and device capabilities
 * Optimizes for mobile devices and poor network connections
 */

class AdaptiveBitrateManager {
  constructor() {
    this.currentProfile = 'auto'
    this.networkMonitor = {
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    }
    
    // Quality profiles optimized for different scenarios
    this.qualityProfiles = {
      // Ultra-low for very poor connections (2G, high packet loss)
      'ultra-low': {
        audio: {
          codec: 'opus',
          bitrate: 16000,
          sampleRate: 16000,
          channels: 1,
          dtx: true,
          fec: true,
          complexity: 1
        },
        video: {
          codec: 'vp8',
          maxBitrate: 150000,
          minBitrate: 50000,
          width: 240,
          height: 180,
          frameRate: 10,
          scalabilityMode: 'L1T2'
        }
      },
      
      // Low quality for poor connections (3G, mobile data saver)
      'low': {
        audio: {
          codec: 'opus',
          bitrate: 32000,
          sampleRate: 24000,
          channels: 1,
          dtx: true,
          fec: true,
          complexity: 3
        },
        video: {
          codec: 'vp8',
          maxBitrate: 300000,
          minBitrate: 100000,
          width: 320,
          height: 240,
          frameRate: 15,
          scalabilityMode: 'L1T2'
        }
      },
      
      // Medium quality for stable 3G/4G connections
      'medium': {
        audio: {
          codec: 'opus',
          bitrate: 64000,
          sampleRate: 48000,
          channels: 1,
          dtx: true,
          fec: true,
          complexity: 5
        },
        video: {
          codec: 'vp9',
          maxBitrate: 800000,
          minBitrate: 200000,
          width: 640,
          height: 480,
          frameRate: 24,
          scalabilityMode: 'L1T3'
        }
      },
      
      // High quality for good connections (WiFi, 4G+)
      'high': {
        audio: {
          codec: 'opus',
          bitrate: 128000,
          sampleRate: 48000,
          channels: 2,
          dtx: false,
          fec: true,
          complexity: 8
        },
        video: {
          codec: 'vp9',
          maxBitrate: 2000000,
          minBitrate: 500000,
          width: 1280,
          height: 720,
          frameRate: 30,
          scalabilityMode: 'L2T3'
        }
      },
      
      // Ultra-high quality for excellent connections (5G, fiber)
      'ultra-high': {
        audio: {
          codec: 'opus',
          bitrate: 256000,
          sampleRate: 48000,
          channels: 2,
          dtx: false,
          fec: true,
          complexity: 10
        },
        video: {
          codec: 'av1',
          maxBitrate: 5000000,
          minBitrate: 1000000,
          width: 1920,
          height: 1080,
          frameRate: 60,
          scalabilityMode: 'L3T3'
        }
      }
    }
    
    // Device-specific optimizations
    this.deviceOptimizations = {
      mobile: {
        batteryOptimized: true,
        preferredCodec: 'vp8', // Better hardware support
        maxResolution: '720p',
        reducedFrameRate: true,
        aggressiveDTX: true
      },
      tablet: {
        batteryOptimized: true,
        preferredCodec: 'vp9',
        maxResolution: '1080p',
        reducedFrameRate: false,
        aggressiveDTX: false
      },
      desktop: {
        batteryOptimized: false,
        preferredCodec: 'av1',
        maxResolution: '4k',
        reducedFrameRate: false,
        aggressiveDTX: false
      }
    }
    
    // Real-time monitoring
    this.metrics = {
      packetLoss: 0,
      jitter: 0,
      rtt: 0,
      bandwidth: {
        upload: 0,
        download: 0
      },
      qualityScore: 100,
      adaptationHistory: [],
      lastAdaptation: Date.now()
    }
    
    // Configuration
    this.config = {
      adaptationInterval: 10000, // 10 seconds
      minAdaptationDelay: 5000, // Minimum 5 seconds between adaptations
      maxAdaptationDelay: 60000, // Maximum 60 seconds
      packetLossThreshold: 3, // 3% packet loss
      jitterThreshold: 50, // 50ms jitter
      rttThreshold: 300, // 300ms RTT
      qualityScoreThreshold: 70, // Quality score below 70 triggers adaptation
      emergencyThreshold: 30 // Emergency adaptation at quality score 30
    }
    
    // State
    this.isAdapting = false
    this.adaptationTimer = null
    this.emergencyMode = false
    this.webrtcService = null
    
    // Initialize
    this.detectDevice()
    this.setupNetworkMonitoring()
    this.startQualityMonitoring()
  }

  // Initialize and bind to WebRTC service
  initialize(webrtcService) {
    this.webrtcService = webrtcService
    
    // Listen for WebRTC events
    if (webrtcService) {
      webrtcService.on('connection_quality_updated', this.handleQualityUpdate.bind(this))
      webrtcService.on('bandwidth_stats_updated', this.handleBandwidthUpdate.bind(this))
      webrtcService.on('network_type_changed', this.handleNetworkChange.bind(this))
    }
    
  }

  detectDevice() {
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent)
    
    if (isMobile && !isTablet) {
      this.deviceType = 'mobile'
    } else if (isTablet) {
      this.deviceType = 'tablet'
    } else {
      this.deviceType = 'desktop'
    }
    
  }

  setupNetworkMonitoring() {
    // Monitor network connection changes
    if ('connection' in navigator) {
      const connection = navigator.connection
      
      this.updateNetworkInfo(connection)
      
      connection.addEventListener('change', () => {
        this.updateNetworkInfo(connection)
        this.triggerAdaptation('network_change')
      })
    }
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.triggerAdaptation('connection_restored')
    })
    
    window.addEventListener('offline', () => {
      this.enableEmergencyMode()
    })
  }

  updateNetworkInfo(connection) {
    this.networkMonitor = {
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    }
    
  }

  startQualityMonitoring() {
    // Regular quality monitoring
    this.adaptationTimer = setInterval(() => {
      this.analyzeAndAdapt()
    }, this.config.adaptationInterval)
  }

  handleQualityUpdate(qualityData) {
    this.metrics.packetLoss = qualityData.packetLoss || 0
    this.metrics.jitter = qualityData.jitter || 0
    this.metrics.rtt = qualityData.rtt || 0
    
    // Calculate quality score
    this.calculateQualityScore()
    
    // Trigger emergency adaptation if quality is very poor
    if (this.metrics.qualityScore < this.config.emergencyThreshold) {
      this.enableEmergencyMode()
    } else if (this.metrics.qualityScore < this.config.qualityScoreThreshold) {
      this.triggerAdaptation('poor_quality')
    }
  }

  handleBandwidthUpdate(bandwidthData) {
    // Update bandwidth metrics from WebRTC stats
    this.metrics.bandwidth.upload = this.estimateUploadBandwidth(bandwidthData)
    this.metrics.bandwidth.download = this.estimateDownloadBandwidth(bandwidthData)
  }

  handleNetworkChange(networkData) {
    this.updateNetworkInfo(networkData)
    this.triggerAdaptation('network_change')
  }

  calculateQualityScore() {
    let score = 100
    
    // Penalize based on packet loss
    if (this.metrics.packetLoss > 0) {
      score -= Math.min(this.metrics.packetLoss * 10, 50)
    }
    
    // Penalize based on jitter
    if (this.metrics.jitter > 20) {
      score -= Math.min((this.metrics.jitter - 20) / 5, 20)
    }
    
    // Penalize based on RTT
    if (this.metrics.rtt > 100) {
      score -= Math.min((this.metrics.rtt - 100) / 10, 20)
    }
    
    // Consider network type
    switch (this.networkMonitor.effectiveType) {
      case 'slow-2g':
        score = Math.min(score, 30)
        break
      case '2g':
        score = Math.min(score, 50)
        break
      case '3g':
        score = Math.min(score, 70)
        break
      case '4g':
        // No penalty for 4G
        break
    }
    
    this.metrics.qualityScore = Math.max(0, score)
  }

  analyzeAndAdapt() {
    if (this.isAdapting) return
    
    const now = Date.now()
    const timeSinceLastAdaptation = now - this.metrics.lastAdaptation
    
    // Don't adapt too frequently
    if (timeSinceLastAdaptation < this.config.minAdaptationDelay) {
      return
    }
    
    // Determine optimal quality profile
    const optimalProfile = this.determineOptimalProfile()
    
    if (optimalProfile !== this.currentProfile) {
      this.adaptToProfile(optimalProfile, 'quality_optimization')
    }
  }

  determineOptimalProfile() {
    const deviceOptimization = this.deviceOptimizations[this.deviceType]
    
    // Emergency mode: use ultra-low quality
    if (this.emergencyMode || this.metrics.qualityScore < this.config.emergencyThreshold) {
      return 'ultra-low'
    }
    
    // Data saver mode
    if (this.networkMonitor.saveData) {
      return 'low'
    }
    
    // Network-based adaptation
    switch (this.networkMonitor.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'ultra-low'
      case '3g':
        return this.metrics.qualityScore > 60 ? 'low' : 'ultra-low'
      case '4g':
        if (this.deviceType === 'mobile') {
          return this.metrics.qualityScore > 80 ? 'medium' : 'low'
        }
        return this.metrics.qualityScore > 80 ? 'high' : 'medium'
      default:
        // Unknown network type, use conservative approach
        if (this.metrics.qualityScore > 90) {
          return this.deviceType === 'mobile' ? 'medium' : 'high'
        } else if (this.metrics.qualityScore > 70) {
          return 'medium'
        } else {
          return 'low'
        }
    }
  }

  async adaptToProfile(profileName, reason = 'manual') {
    if (this.isAdapting) return false
    
    const profile = this.qualityProfiles[profileName]
    if (!profile) {
      console.error(`Unknown quality profile: ${profileName}`)
      return false
    }
    
    
    this.isAdapting = true
    const adaptationStart = Date.now()
    
    try {
      // Apply device-specific optimizations
      const optimizedProfile = this.applyDeviceOptimizations(profile)
      
      // Apply audio settings
      await this.applyAudioSettings(optimizedProfile.audio)
      
      // Apply video settings
      await this.applyVideoSettings(optimizedProfile.video)
      
      // Update current profile
      this.currentProfile = profileName
      this.metrics.lastAdaptation = Date.now()
      
      // Record adaptation
      this.metrics.adaptationHistory.push({
        timestamp: Date.now(),
        fromProfile: this.currentProfile,
        toProfile: profileName,
        reason,
        duration: Date.now() - adaptationStart,
        qualityScore: this.metrics.qualityScore,
        networkType: this.networkMonitor.effectiveType
      })
      
      // Keep only last 50 adaptations
      if (this.metrics.adaptationHistory.length > 50) {
        this.metrics.adaptationHistory.shift()
      }
      
      // Disable emergency mode if we successfully adapted to a better profile
      if (this.emergencyMode && profileName !== 'ultra-low') {
        this.emergencyMode = false
      }
      
      return true
      
    } catch (error) {
      console.error(`Failed to adapt to ${profileName} profile:`, error)
      return false
    } finally {
      this.isAdapting = false
    }
  }

  applyDeviceOptimizations(profile) {
    const deviceOptimization = this.deviceOptimizations[this.deviceType]
    const optimized = JSON.parse(JSON.stringify(profile)) // Deep clone
    
    // Apply device-specific audio optimizations
    if (deviceOptimization.aggressiveDTX) {
      optimized.audio.dtx = true
      optimized.audio.complexity = Math.min(optimized.audio.complexity, 5)
    }
    
    // Apply device-specific video optimizations
    if (deviceOptimization.batteryOptimized) {
      optimized.video.frameRate = Math.min(optimized.video.frameRate, 24)
    }
    
    if (deviceOptimization.reducedFrameRate && this.deviceType === 'mobile') {
      optimized.video.frameRate = Math.min(optimized.video.frameRate, 20)
    }
    
    // Override codec if device has preferences
    if (deviceOptimization.preferredCodec) {
      optimized.video.codec = deviceOptimization.preferredCodec
    }
    
    return optimized
  }

  async applyAudioSettings(audioSettings) {
    if (!this.webrtcService) return
    
    try {
      // Update audio quality settings
      this.webrtcService.qualitySettings.audio = {
        bitrate: audioSettings.bitrate,
        sampleRate: audioSettings.sampleRate,
        codec: audioSettings.codec
      }
      
      // Apply audio processing settings
      await this.webrtcService.setVoiceEffectParameter('compressor', 'enabled', true)
      await this.webrtcService.setVoiceEffectParameter('noiseGate', 'enabled', true)
      
    } catch (error) {
      console.error('Failed to apply audio settings:', error)
    }
  }

  async applyVideoSettings(videoSettings) {
    if (!this.webrtcService) return
    
    try {
      // Update video quality settings
      this.webrtcService.qualitySettings.video = {
        resolution: `${videoSettings.width}x${videoSettings.height}`,
        frameRate: videoSettings.frameRate,
        bitrate: videoSettings.maxBitrate,
        codec: videoSettings.codec
      }
      
    } catch (error) {
      console.error('Failed to apply video settings:', error)
    }
  }

  triggerAdaptation(reason) {
    // Debounce rapid adaptation triggers
    clearTimeout(this.adaptationDebounce)
    this.adaptationDebounce = setTimeout(() => {
      this.analyzeAndAdapt()
    }, 1000)
  }

  enableEmergencyMode() {
    if (this.emergencyMode) return
    
    this.emergencyMode = true
    this.adaptToProfile('ultra-low', 'emergency')
  }

  disableEmergencyMode() {
    if (!this.emergencyMode) return
    
    this.emergencyMode = false
    
    // Re-evaluate optimal profile
    setTimeout(() => {
      this.analyzeAndAdapt()
    }, 5000)
  }

  // Manual profile selection
  async setProfile(profileName) {
    return this.adaptToProfile(profileName, 'manual')
  }

  // Utility methods
  estimateUploadBandwidth(bandwidthData) {
    // Implement bandwidth estimation based on WebRTC stats
    let totalBytesSent = 0
    let totalPacketsSent = 0
    
    for (const [participantId, stats] of Object.entries(bandwidthData)) {
      totalBytesSent += stats.bytesSent || 0
      totalPacketsSent += stats.packetsSent || 0
    }
    
    // Simple estimation - in real implementation, use time-based calculation
    return totalBytesSent * 8 / 1000 // Convert to kbps
  }

  estimateDownloadBandwidth(bandwidthData) {
    let totalBytesReceived = 0
    let totalPacketsReceived = 0
    
    for (const [participantId, stats] of Object.entries(bandwidthData)) {
      totalBytesReceived += stats.bytesReceived || 0
      totalPacketsReceived += stats.packetsReceived || 0
    }
    
    return totalBytesReceived * 8 / 1000 // Convert to kbps
  }

  // Analytics and monitoring
  getMetrics() {
    return {
      currentProfile: this.currentProfile,
      qualityScore: this.metrics.qualityScore,
      networkInfo: this.networkMonitor,
      deviceType: this.deviceType,
      emergencyMode: this.emergencyMode,
      bandwidth: this.metrics.bandwidth,
      connectionQuality: {
        packetLoss: this.metrics.packetLoss,
        jitter: this.metrics.jitter,
        rtt: this.metrics.rtt
      },
      adaptationHistory: this.metrics.adaptationHistory.slice(-10) // Last 10 adaptations
    }
  }

  getRecommendations() {
    const recommendations = []
    
    if (this.metrics.qualityScore < 50) {
      recommendations.push({
        type: 'quality',
        message: 'Consider switching to a better network connection',
        severity: 'high'
      })
    }
    
    if (this.networkMonitor.saveData) {
      recommendations.push({
        type: 'data',
        message: 'Data saver mode is enabled, affecting call quality',
        severity: 'medium'
      })
    }
    
    if (this.deviceType === 'mobile' && this.currentProfile === 'high') {
      recommendations.push({
        type: 'battery',
        message: 'High quality settings may drain battery faster',
        severity: 'low'
      })
    }
    
    return recommendations
  }

  // Cleanup
  destroy() {
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer)
    }
    
    if (this.adaptationDebounce) {
      clearTimeout(this.adaptationDebounce)
    }
    
    // Remove event listeners
    if (this.webrtcService) {
      this.webrtcService.off('connection_quality_updated', this.handleQualityUpdate)
      this.webrtcService.off('bandwidth_stats_updated', this.handleBandwidthUpdate)
      this.webrtcService.off('network_type_changed', this.handleNetworkChange)
    }
    
  }
}

export default AdaptiveBitrateManager