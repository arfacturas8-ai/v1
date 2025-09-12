import { Server } from 'socket.io';
import Redis from 'ioredis';

export interface AudioProcessingSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  highpassFilter: boolean;
  typingNoiseDetection: boolean;
  
  // Advanced settings
  noiseGate: {
    enabled: boolean;
    threshold: number; // -70 to -10 dB
    attack: number; // 1-100 ms
    release: number; // 10-1000 ms
  };
  
  compressor: {
    enabled: boolean;
    threshold: number; // -40 to 0 dB
    ratio: number; // 1:1 to 20:1
    attack: number; // 0.1-100 ms
    release: number; // 1-1000 ms
  };
  
  equalizer: {
    enabled: boolean;
    presets: 'voice' | 'music' | 'podcast' | 'custom';
    bands: {
      '60Hz': number;   // -12 to +12 dB
      '170Hz': number;
      '310Hz': number;
      '600Hz': number;
      '1kHz': number;
      '3kHz': number;
      '6kHz': number;
      '12kHz': number;
      '14kHz': number;
      '16kHz': number;
    };
  };
}

export interface VoiceQualitySettings {
  // Codec settings
  audioCodec: 'opus' | 'aac' | 'g722' | 'pcmu' | 'pcma';
  audioBitrate: number; // 8000-510000 bps
  sampleRate: number; // 8000, 16000, 24000, 48000 Hz
  channels: 1 | 2; // mono or stereo
  
  // Quality settings
  dtx: boolean; // Discontinuous transmission
  fec: boolean; // Forward error correction
  packetLossConcealment: boolean;
  
  // Adaptive settings
  adaptiveBitrate: boolean;
  bandwidthProbing: boolean;
  jitterBuffer: {
    enabled: boolean;
    minDelay: number; // 0-1000 ms
    maxDelay: number; // 0-1000 ms
    targetDelay: number; // 0-1000 ms
  };
  
  // Processing settings
  audioProcessing: AudioProcessingSettings;
  
  // Connection settings
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  
  // Advanced WebRTC settings
  bundlePolicy: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy: 'negotiate' | 'require';
  iceCandidatePoolSize: number;
  
  // DSCP marking for QoS
  networkPriority: 'very-low' | 'low' | 'medium' | 'high';
}

export interface VoiceAnalytics {
  sessionId: string;
  userId: string;
  channelId?: string;
  
  // Connection quality metrics
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
  
  // Audio quality metrics
  audioLevel: number; // 0-1
  jitter: number; // ms
  packetLoss: number; // percentage
  rtt: number; // ms (round trip time)
  
  // Bandwidth metrics
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  
  // Codec information
  codecName: string;
  clockRate: number;
  bitrate: number;
  
  // Network information
  localAddress: string;
  remoteAddress: string;
  networkType: string; // ethernet, wifi, cellular, vpn, etc.
  transport: 'udp' | 'tcp' | 'tls' | 'dtls';
  
  // Quality scores (0-5)
  mosScore: number; // Mean Opinion Score
  qualityScore: number; // Overall quality rating
  
  timestamp: Date;
}

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  category: 'gaming' | 'music' | 'podcast' | 'conference' | 'streaming';
  settings: Partial<VoiceQualitySettings>;
  isDefault?: boolean;
}

export class VoiceQualityService {
  private io: Server;
  private redis: Redis;
  private userSettings: Map<string, VoiceQualitySettings> = new Map();
  private qualityMetrics: Map<string, VoiceAnalytics[]> = new Map();
  private presets: Map<string, VoicePreset> = new Map();

  constructor(io: Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
    this.initializePresets();
    this.setupQualityMonitoring();
  }

  /**
   * Get voice quality settings for a user
   */
  async getUserSettings(userId: string): Promise<VoiceQualitySettings> {
    // Try to get from cache first
    let settings = this.userSettings.get(userId);
    
    if (!settings) {
      // Load from Redis
      const stored = await this.redis.hget('user_voice_settings', userId);
      if (stored) {
        settings = JSON.parse(stored);
        this.userSettings.set(userId, settings!);
      } else {
        // Use default settings
        settings = this.getDefaultSettings();
        await this.saveUserSettings(userId, settings);
      }
    }
    
    return settings;
  }

  /**
   * Update voice quality settings for a user
   */
  async updateUserSettings(userId: string, updates: Partial<VoiceQualitySettings>): Promise<VoiceQualitySettings> {
    const currentSettings = await this.getUserSettings(userId);
    const newSettings = { ...currentSettings, ...updates };
    
    // Validate settings
    this.validateSettings(newSettings);
    
    await this.saveUserSettings(userId, newSettings);
    
    // Notify user about settings update
    this.io.to(`user:${userId}`).emit('voice:settings_updated', {
      settings: newSettings,
      updatedAt: new Date().toISOString()
    });
    
    return newSettings;
  }

  /**
   * Apply a preset to user settings
   */
  async applyPreset(userId: string, presetId: string): Promise<VoiceQualitySettings> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset ${presetId} not found`);
    }
    
    const currentSettings = await this.getUserSettings(userId);
    const newSettings = { ...currentSettings, ...preset.settings };
    
    await this.saveUserSettings(userId, newSettings);
    
    this.io.to(`user:${userId}`).emit('voice:preset_applied', {
      presetId,
      presetName: preset.name,
      settings: newSettings
    });
    
    return newSettings;
  }

  /**
   * Record voice quality analytics
   */
  async recordAnalytics(analytics: VoiceAnalytics): Promise<void> {
    const { userId, sessionId } = analytics;
    
    // Store in memory for recent access
    if (!this.qualityMetrics.has(userId)) {
      this.qualityMetrics.set(userId, []);
    }
    
    const userMetrics = this.qualityMetrics.get(userId)!;
    userMetrics.push(analytics);
    
    // Keep only last 100 entries per user
    if (userMetrics.length > 100) {
      userMetrics.splice(0, userMetrics.length - 100);
    }
    
    // Store in Redis for persistence
    await this.redis.lpush(
      `voice_analytics:${userId}`,
      JSON.stringify(analytics)
    );
    
    // Keep only last 1000 entries in Redis
    await this.redis.ltrim(`voice_analytics:${userId}`, 0, 999);
    
    // Set expiration (30 days)
    await this.redis.expire(`voice_analytics:${userId}`, 30 * 24 * 60 * 60);
    
    // Real-time quality monitoring
    this.analyzeQualityInRealTime(analytics);
  }

  /**
   * Get quality analytics for a user
   */
  async getAnalytics(userId: string, limit: number = 50): Promise<VoiceAnalytics[]> {
    // Get from Redis
    const stored = await this.redis.lrange(`voice_analytics:${userId}`, 0, limit - 1);
    return stored.map(item => JSON.parse(item));
  }

  /**
   * Get aggregated quality statistics
   */
  async getQualityStats(userId: string, timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    averageMOS: number;
    averageQuality: number;
    averageJitter: number;
    averagePacketLoss: number;
    averageRTT: number;
    connectionIssues: number;
    totalSessions: number;
    recommendations: string[];
  }> {
    const analytics = await this.getAnalytics(userId, this.getTimeframeSampleSize(timeframe));
    
    if (analytics.length === 0) {
      return {
        averageMOS: 0,
        averageQuality: 0,
        averageJitter: 0,
        averagePacketLoss: 0,
        averageRTT: 0,
        connectionIssues: 0,
        totalSessions: 0,
        recommendations: ['No voice data available']
      };
    }
    
    const stats = {
      averageMOS: analytics.reduce((sum, a) => sum + a.mosScore, 0) / analytics.length,
      averageQuality: analytics.reduce((sum, a) => sum + a.qualityScore, 0) / analytics.length,
      averageJitter: analytics.reduce((sum, a) => sum + a.jitter, 0) / analytics.length,
      averagePacketLoss: analytics.reduce((sum, a) => sum + a.packetLoss, 0) / analytics.length,
      averageRTT: analytics.reduce((sum, a) => sum + a.rtt, 0) / analytics.length,
      connectionIssues: analytics.filter(a => 
        a.connectionState === 'failed' || 
        a.connectionState === 'disconnected' ||
        a.packetLoss > 5 ||
        a.jitter > 100
      ).length,
      totalSessions: new Set(analytics.map(a => a.sessionId)).size,
      recommendations: this.generateRecommendations(analytics)
    };
    
    return stats;
  }

  /**
   * Optimize settings based on network conditions
   */
  async optimizeForNetwork(userId: string, networkInfo: {
    type: 'ethernet' | 'wifi' | 'cellular' | 'vpn';
    bandwidth: number; // kbps
    latency: number; // ms
    jitter: number; // ms
    packetLoss: number; // percentage
  }): Promise<VoiceQualitySettings> {
    const currentSettings = await this.getUserSettings(userId);
    let optimizedSettings = { ...currentSettings };
    
    // Adjust based on network type
    switch (networkInfo.type) {
      case 'cellular':
        optimizedSettings.audioBitrate = Math.min(optimizedSettings.audioBitrate, 32000);
        optimizedSettings.adaptiveBitrate = true;
        optimizedSettings.dtx = true;
        optimizedSettings.fec = true;
        break;
        
      case 'wifi':
        if (networkInfo.bandwidth < 1000) { // Low bandwidth WiFi
          optimizedSettings.audioBitrate = Math.min(optimizedSettings.audioBitrate, 64000);
        }
        break;
        
      case 'vpn':
        optimizedSettings.jitterBuffer.targetDelay = Math.max(
          optimizedSettings.jitterBuffer.targetDelay, 
          networkInfo.latency + 20
        );
        break;
    }
    
    // Adjust for bandwidth constraints
    if (networkInfo.bandwidth < 500) {
      optimizedSettings.audioBitrate = Math.min(optimizedSettings.audioBitrate, 24000);
      optimizedSettings.audioCodec = 'opus'; // Most efficient
      optimizedSettings.dtx = true;
    }
    
    // Adjust for high latency
    if (networkInfo.latency > 150) {
      optimizedSettings.jitterBuffer.targetDelay = networkInfo.latency + 30;
      optimizedSettings.jitterBuffer.maxDelay = networkInfo.latency + 100;
    }
    
    // Adjust for packet loss
    if (networkInfo.packetLoss > 2) {
      optimizedSettings.fec = true;
      optimizedSettings.packetLossConcealment = true;
      optimizedSettings.audioBitrate *= 1.2; // Increase bitrate for redundancy
    }
    
    // Adjust for jitter
    if (networkInfo.jitter > 50) {
      optimizedSettings.jitterBuffer.enabled = true;
      optimizedSettings.jitterBuffer.maxDelay = Math.max(
        optimizedSettings.jitterBuffer.maxDelay,
        networkInfo.jitter * 2
      );
    }
    
    await this.saveUserSettings(userId, optimizedSettings);
    
    this.io.to(`user:${userId}`).emit('voice:settings_optimized', {
      networkInfo,
      optimizedSettings,
      changes: this.getSettingsChanges(currentSettings, optimizedSettings)
    });
    
    return optimizedSettings;
  }

  /**
   * Get available voice presets
   */
  getPresets(): VoicePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Create a custom preset
   */
  async createCustomPreset(userId: string, preset: Omit<VoicePreset, 'id'>): Promise<VoicePreset> {
    const presetId = `custom_${userId}_${Date.now()}`;
    const newPreset: VoicePreset = {
      id: presetId,
      ...preset
    };
    
    this.presets.set(presetId, newPreset);
    
    // Store in Redis
    await this.redis.hset('custom_voice_presets', presetId, JSON.stringify(newPreset));
    
    return newPreset;
  }

  private getDefaultSettings(): VoiceQualitySettings {
    return {
      audioCodec: 'opus',
      audioBitrate: parseInt(process.env.VOICE_BITRATE || '64000'),
      sampleRate: 48000,
      channels: 1,
      dtx: true,
      fec: true,
      packetLossConcealment: true,
      adaptiveBitrate: true,
      bandwidthProbing: true,
      jitterBuffer: {
        enabled: true,
        minDelay: 20,
        maxDelay: 200,
        targetDelay: 60
      },
      audioProcessing: {
        echoCancellation: process.env.AUDIO_ECHO_CANCELLATION === 'true',
        noiseSuppression: process.env.AUDIO_NOISE_SUPPRESSION === 'true',
        autoGainControl: process.env.AUDIO_AUTO_GAIN_CONTROL === 'true',
        highpassFilter: true,
        typingNoiseDetection: true,
        noiseGate: {
          enabled: false,
          threshold: -45,
          attack: 5,
          release: 50
        },
        compressor: {
          enabled: false,
          threshold: -18,
          ratio: 3,
          attack: 3,
          release: 25
        },
        equalizer: {
          enabled: false,
          presets: 'voice',
          bands: {
            '60Hz': 0,
            '170Hz': 0,
            '310Hz': 0,
            '600Hz': 0,
            '1kHz': 0,
            '3kHz': 0,
            '6kHz': 0,
            '12kHz': 0,
            '14kHz': 0,
            '16kHz': 0
          }
        }
      },
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 4,
      networkPriority: 'high'
    };
  }

  private async saveUserSettings(userId: string, settings: VoiceQualitySettings): Promise<void> {
    this.userSettings.set(userId, settings);
    await this.redis.hset('user_voice_settings', userId, JSON.stringify(settings));
  }

  private validateSettings(settings: VoiceQualitySettings): void {
    // Validate bitrate range
    if (settings.audioBitrate < 8000 || settings.audioBitrate > 510000) {
      throw new Error('Audio bitrate must be between 8000 and 510000 bps');
    }
    
    // Validate sample rate
    const validSampleRates = [8000, 16000, 24000, 48000];
    if (!validSampleRates.includes(settings.sampleRate)) {
      throw new Error('Invalid sample rate. Must be 8000, 16000, 24000, or 48000 Hz');
    }
    
    // Validate jitter buffer settings
    if (settings.jitterBuffer.minDelay < 0 || settings.jitterBuffer.minDelay > 1000) {
      throw new Error('Jitter buffer min delay must be between 0 and 1000 ms');
    }
    
    if (settings.jitterBuffer.maxDelay < settings.jitterBuffer.minDelay) {
      throw new Error('Jitter buffer max delay must be greater than min delay');
    }
  }

  private initializePresets(): void {
    const defaultPresets: VoicePreset[] = [
      {
        id: 'gaming',
        name: 'Gaming',
        description: 'Optimized for low latency gaming communication',
        category: 'gaming',
        settings: {
          audioBitrate: 48000,
          jitterBuffer: { enabled: true, minDelay: 10, maxDelay: 100, targetDelay: 30 },
          audioProcessing: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            highpassFilter: true,
            typingNoiseDetection: true,
            noiseGate: { enabled: true, threshold: -40, attack: 2, release: 30 },
            compressor: { enabled: false, threshold: -18, ratio: 3, attack: 3, release: 25 },
            equalizer: { enabled: false, presets: 'voice', bands: {} as any }
          }
        }
      },
      {
        id: 'music',
        name: 'Music',
        description: 'High quality settings for music streaming',
        category: 'music',
        settings: {
          audioBitrate: 128000,
          channels: 2,
          audioProcessing: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            highpassFilter: false,
            typingNoiseDetection: false,
            noiseGate: { enabled: false, threshold: -45, attack: 5, release: 50 },
            compressor: { enabled: true, threshold: -15, ratio: 2, attack: 1, release: 100 },
            equalizer: { enabled: true, presets: 'music', bands: {} as any }
          }
        }
      },
      {
        id: 'podcast',
        name: 'Podcast',
        description: 'Clear voice settings for podcasting',
        category: 'podcast',
        settings: {
          audioBitrate: 96000,
          audioProcessing: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            highpassFilter: true,
            typingNoiseDetection: true,
            noiseGate: { enabled: true, threshold: -35, attack: 3, release: 40 },
            compressor: { enabled: true, threshold: -20, ratio: 4, attack: 2, release: 50 },
            equalizer: { enabled: true, presets: 'voice', bands: {} as any }
          }
        }
      }
    ];
    
    defaultPresets.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
  }

  private setupQualityMonitoring(): void {
    // Monitor quality every 30 seconds
    setInterval(() => {
      this.performQualityChecks();
    }, 30 * 1000);
  }

  private async performQualityChecks(): Promise<void> {
    // Check for users with poor quality and send recommendations
    for (const [userId, metrics] of this.qualityMetrics.entries()) {
      const recentMetrics = metrics.slice(-10); // Last 10 measurements
      
      if (recentMetrics.length < 5) continue;
      
      const avgQuality = recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length;
      const avgPacketLoss = recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length;
      
      if (avgQuality < 2.5 || avgPacketLoss > 5) {
        this.io.to(`user:${userId}`).emit('voice:quality_warning', {
          quality: avgQuality,
          packetLoss: avgPacketLoss,
          recommendations: this.generateRecommendations(recentMetrics)
        });
      }
    }
  }

  private analyzeQualityInRealTime(analytics: VoiceAnalytics): void {
    // Real-time quality analysis and alerts
    if (analytics.qualityScore < 2.0) {
      this.io.to(`user:${analytics.userId}`).emit('voice:quality_alert', {
        severity: 'high',
        message: 'Poor voice quality detected',
        analytics,
        recommendations: ['Check your network connection', 'Try adjusting audio settings']
      });
    } else if (analytics.packetLoss > 10) {
      this.io.to(`user:${analytics.userId}`).emit('voice:quality_alert', {
        severity: 'medium',
        message: 'High packet loss detected',
        analytics,
        recommendations: ['Check your network stability', 'Consider lowering audio bitrate']
      });
    }
  }

  private generateRecommendations(analytics: VoiceAnalytics[]): string[] {
    const recommendations: string[] = [];
    
    const avgJitter = analytics.reduce((sum, a) => sum + a.jitter, 0) / analytics.length;
    const avgPacketLoss = analytics.reduce((sum, a) => sum + a.packetLoss, 0) / analytics.length;
    const avgRTT = analytics.reduce((sum, a) => sum + a.rtt, 0) / analytics.length;
    
    if (avgJitter > 50) {
      recommendations.push('Enable jitter buffer to handle network instability');
    }
    
    if (avgPacketLoss > 2) {
      recommendations.push('Enable forward error correction (FEC)');
      recommendations.push('Consider lowering audio bitrate');
    }
    
    if (avgRTT > 200) {
      recommendations.push('Use a server closer to your location');
      recommendations.push('Check for VPN or proxy interference');
    }
    
    const connectionIssues = analytics.filter(a => 
      a.connectionState === 'failed' || a.connectionState === 'disconnected'
    ).length;
    
    if (connectionIssues > analytics.length * 0.1) {
      recommendations.push('Check your firewall settings');
      recommendations.push('Try using a different network');
    }
    
    return recommendations;
  }

  private getTimeframeSampleSize(timeframe: 'hour' | 'day' | 'week' | 'month'): number {
    const sizes = {
      hour: 60,
      day: 288,   // 5 min intervals
      week: 504,  // 30 min intervals  
      month: 744  // 1 hour intervals
    };
    
    return sizes[timeframe] || sizes.day;
  }

  private getSettingsChanges(oldSettings: VoiceQualitySettings, newSettings: VoiceQualitySettings): string[] {
    const changes: string[] = [];
    
    if (oldSettings.audioBitrate !== newSettings.audioBitrate) {
      changes.push(`Audio bitrate: ${oldSettings.audioBitrate} → ${newSettings.audioBitrate} bps`);
    }
    
    if (oldSettings.audioCodec !== newSettings.audioCodec) {
      changes.push(`Audio codec: ${oldSettings.audioCodec} → ${newSettings.audioCodec}`);
    }
    
    if (oldSettings.dtx !== newSettings.dtx) {
      changes.push(`DTX: ${oldSettings.dtx ? 'enabled' : 'disabled'} → ${newSettings.dtx ? 'enabled' : 'disabled'}`);
    }
    
    return changes;
  }
}