export interface NetworkQuality {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  quality: 'excellent' | 'good' | 'poor' | 'critical';
}

export interface AdaptationSettings {
  audio: {
    bitrate: number; // kbps
    sampleRate: number; // Hz
    channels: number;
    codec: 'opus' | 'aac';
    dtx: boolean; // discontinuous transmission
    fec: boolean; // forward error correction
  };
  video: {
    enabled: boolean;
    width: number;
    height: number;
    framerate: number;
    bitrate: number; // kbps
    codec: 'vp8' | 'vp9' | 'h264';
    keyFrameInterval: number; // seconds
  };
  screen: {
    enabled: boolean;
    width: number;
    height: number;
    framerate: number;
    bitrate: number; // kbps
    optimizeForText: boolean;
  };
}

export interface BandwidthStats {
  timestamp: number;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  availableIncomingBitrate?: number;
  availableOutgoingBitrate?: number;
}

export class BandwidthAdapter {
  private networkQuality: NetworkQuality = {
    bandwidth: 1000, // Default 1 Mbps
    latency: 50,
    packetLoss: 0,
    jitter: 5,
    quality: 'good'
  };
  
  private adaptationHistory: NetworkQuality[] = [];
  private statsHistory: BandwidthStats[] = [];
  private readonly MAX_HISTORY = 30; // Keep last 30 measurements
  private monitoringInterval: NodeJS.Timeout | null = null;
  private adaptationCallbacks: ((settings: AdaptationSettings) => void)[] = [];
  private isMonitoring = false;
  private room: any = null; // LiveKit Room instance
  
  // Preset configurations for different network conditions
  private readonly QUALITY_PRESETS = {
    excellent: {
      audio: {
        bitrate: 128,
        sampleRate: 48000,
        channels: 2,
        codec: 'opus' as const,
        dtx: false,
        fec: true
      },
      video: {
        enabled: true,
        width: 1280,
        height: 720,
        framerate: 30,
        bitrate: 2500,
        codec: 'vp9' as const,
        keyFrameInterval: 4
      },
      screen: {
        enabled: true,
        width: 1920,
        height: 1080,
        framerate: 15,
        bitrate: 3000,
        optimizeForText: false
      }
    },
    good: {
      audio: {
        bitrate: 64,
        sampleRate: 48000,
        channels: 1,
        codec: 'opus' as const,
        dtx: true,
        fec: true
      },
      video: {
        enabled: true,
        width: 960,
        height: 540,
        framerate: 24,
        bitrate: 1200,
        codec: 'vp8' as const,
        keyFrameInterval: 6
      },
      screen: {
        enabled: true,
        width: 1280,
        height: 720,
        framerate: 10,
        bitrate: 1500,
        optimizeForText: true
      }
    },
    poor: {
      audio: {
        bitrate: 32,
        sampleRate: 16000,
        channels: 1,
        codec: 'opus' as const,
        dtx: true,
        fec: true
      },
      video: {
        enabled: true,
        width: 640,
        height: 360,
        framerate: 15,
        bitrate: 500,
        codec: 'vp8' as const,
        keyFrameInterval: 10
      },
      screen: {
        enabled: false,
        width: 640,
        height: 360,
        framerate: 5,
        bitrate: 300,
        optimizeForText: true
      }
    },
    critical: {
      audio: {
        bitrate: 16,
        sampleRate: 8000,
        channels: 1,
        codec: 'opus' as const,
        dtx: true,
        fec: false
      },
      video: {
        enabled: false,
        width: 320,
        height: 240,
        framerate: 8,
        bitrate: 150,
        codec: 'vp8' as const,
        keyFrameInterval: 15
      },
      screen: {
        enabled: false,
        width: 320,
        height: 240,
        framerate: 2,
        bitrate: 100,
        optimizeForText: true
      }
    }
  };

  constructor() {
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    // Monitor network connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.handleConnectionChange();
      });
      
      // Initial network info
      this.updateNetworkInfoFromConnection(connection);
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.handleConnectionRestore();
    });

    window.addEventListener('offline', () => {
      this.handleConnectionLoss();
    });
  }

  private updateNetworkInfoFromConnection(connection: any): void {
    if (connection) {
      // Update network quality based on connection API
      const effectiveType = connection.effectiveType;
      let estimatedBandwidth = 1000; // Default 1 Mbps
      let estimatedLatency = 50;
      
      switch (effectiveType) {
        case '4g':
          estimatedBandwidth = 10000; // 10 Mbps
          estimatedLatency = 30;
          break;
        case '3g':
          estimatedBandwidth = 1500; // 1.5 Mbps
          estimatedLatency = 100;
          break;
        case '2g':
          estimatedBandwidth = 256; // 256 kbps
          estimatedLatency = 300;
          break;
        case 'slow-2g':
          estimatedBandwidth = 64; // 64 kbps
          estimatedLatency = 500;
          break;
      }
      
      this.updateNetworkQuality({
        bandwidth: estimatedBandwidth,
        latency: estimatedLatency,
        packetLoss: this.networkQuality.packetLoss,
        jitter: this.networkQuality.jitter,
        quality: this.calculateQuality(estimatedBandwidth, estimatedLatency, this.networkQuality.packetLoss)
      });
    }
  }

  private handleConnectionChange(): void {
    if ('connection' in navigator) {
      this.updateNetworkInfoFromConnection((navigator as any).connection);
    }
  }

  private handleConnectionRestore(): void {
    console.log('Network connection restored');
    // Gradually restore quality
    this.restoreQualityGradually();
  }

  private handleConnectionLoss(): void {
    console.log('Network connection lost');
    // Immediately switch to audio-only mode
    this.switchToAudioOnly();
  }

  public setRoom(room: any): void {
    this.room = room;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectStats();
    }, 2000); // Collect stats every 2 seconds
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  private async collectStats(): Promise<void> {
    if (!this.room) return;

    try {
      // Get WebRTC stats from LiveKit room
      const stats = await this.room.engine.getConnectedServerAddress();
      
      // In a real implementation, you would parse WebRTC stats here
      // For now, we'll simulate realistic values
      const currentStats: BandwidthStats = {
        timestamp: Date.now(),
        bytesReceived: Math.random() * 1000000,
        bytesSent: Math.random() * 500000,
        packetsReceived: Math.random() * 1000,
        packetsSent: Math.random() * 500,
        packetsLost: Math.random() * 10,
        roundTripTime: 20 + Math.random() * 100,
        jitter: Math.random() * 20,
        availableIncomingBitrate: 500 + Math.random() * 2000,
        availableOutgoingBitrate: 300 + Math.random() * 1000
      };
      
      this.statsHistory.push(currentStats);
      if (this.statsHistory.length > this.MAX_HISTORY) {
        this.statsHistory.shift();
      }
      
      this.analyzeStats();
    } catch (error) {
      console.error('Failed to collect bandwidth stats:', error);
    }
  }

  private analyzeStats(): void {
    if (this.statsHistory.length < 3) return; // Need at least 3 samples
    
    const recent = this.statsHistory.slice(-5); // Last 5 samples
    const avgRTT = recent.reduce((sum, stat) => sum + stat.roundTripTime, 0) / recent.length;
    const avgJitter = recent.reduce((sum, stat) => sum + stat.jitter, 0) / recent.length;
    
    // Calculate packet loss percentage
    const totalPackets = recent.reduce((sum, stat) => sum + stat.packetsSent, 0);
    const totalLost = recent.reduce((sum, stat) => sum + stat.packetsLost, 0);
    const packetLossPercent = totalPackets > 0 ? (totalLost / totalPackets) * 100 : 0;
    
    // Estimate bandwidth from available bitrate
    const avgIncomingBandwidth = recent
      .filter(s => s.availableIncomingBitrate)
      .reduce((sum, stat) => sum + (stat.availableIncomingBitrate || 0), 0) / recent.length;
    
    const newQuality: NetworkQuality = {
      bandwidth: avgIncomingBandwidth || this.networkQuality.bandwidth,
      latency: avgRTT,
      packetLoss: packetLossPercent,
      jitter: avgJitter,
      quality: this.calculateQuality(avgIncomingBandwidth, avgRTT, packetLossPercent)
    };
    
    this.updateNetworkQuality(newQuality);
  }

  private calculateQuality(
    bandwidth: number, 
    latency: number, 
    packetLoss: number
  ): NetworkQuality['quality'] {
    // Quality scoring based on multiple factors
    let score = 100;
    
    // Bandwidth penalty
    if (bandwidth < 200) score -= 40;
    else if (bandwidth < 500) score -= 25;
    else if (bandwidth < 1000) score -= 10;
    
    // Latency penalty
    if (latency > 200) score -= 30;
    else if (latency > 100) score -= 15;
    else if (latency > 50) score -= 5;
    
    // Packet loss penalty
    if (packetLoss > 5) score -= 40;
    else if (packetLoss > 2) score -= 20;
    else if (packetLoss > 1) score -= 10;
    
    if (score >= 85) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private updateNetworkQuality(quality: NetworkQuality): void {
    const previousQuality = this.networkQuality.quality;
    this.networkQuality = quality;
    
    this.adaptationHistory.push(quality);
    if (this.adaptationHistory.length > this.MAX_HISTORY) {
      this.adaptationHistory.shift();
    }
    
    // Trigger adaptation if quality changed significantly
    if (previousQuality !== quality.quality) {
      console.log(`Network quality changed from ${previousQuality} to ${quality.quality}`);
      this.adaptToNetworkQuality(quality.quality);
    }
  }

  private adaptToNetworkQuality(quality: NetworkQuality['quality']): void {
    const settings = this.QUALITY_PRESETS[quality];
    
    // Apply hysteresis to prevent flapping
    if (this.shouldApplyAdaptation(quality)) {
      console.log(`Adapting to ${quality} quality:`, settings);
      this.notifyAdaptation(settings);
    }
  }

  private shouldApplyAdaptation(newQuality: NetworkQuality['quality']): boolean {
    if (this.adaptationHistory.length < 5) return true;
    
    // Check if quality has been stable for at least 3 measurements
    const recentQualities = this.adaptationHistory.slice(-5).map(h => h.quality);
    const consistentReadings = recentQualities.filter(q => q === newQuality).length;
    
    return consistentReadings >= 3;
  }

  private restoreQualityGradually(): void {
    // Gradually restore quality over time to avoid overwhelming the connection
    const intervals = [5000, 10000, 20000]; // 5s, 10s, 20s
    
    intervals.forEach((delay, index) => {
      setTimeout(() => {
        if (this.networkQuality.quality !== 'critical') {
          const targetQuality: NetworkQuality['quality'] = 
            index === 0 ? 'poor' : 
            index === 1 ? 'good' : 'excellent';
          
          if (this.canUpgradeQuality(targetQuality)) {
            this.adaptToNetworkQuality(targetQuality);
          }
        }
      }, delay);
    });
  }

  private canUpgradeQuality(targetQuality: NetworkQuality['quality']): boolean {
    // Check if we can safely upgrade quality based on current conditions
    const currentBandwidth = this.networkQuality.bandwidth;
    const currentLatency = this.networkQuality.latency;
    const currentPacketLoss = this.networkQuality.packetLoss;
    
    switch (targetQuality) {
      case 'excellent':
        return currentBandwidth >= 2000 && currentLatency < 50 && currentPacketLoss < 1;
      case 'good':
        return currentBandwidth >= 800 && currentLatency < 100 && currentPacketLoss < 2;
      case 'poor':
        return currentBandwidth >= 300 && currentLatency < 200 && currentPacketLoss < 5;
      default:
        return true;
    }
  }

  private switchToAudioOnly(): void {
    const audioOnlySettings: AdaptationSettings = {
      ...this.QUALITY_PRESETS.critical,
      video: { ...this.QUALITY_PRESETS.critical.video, enabled: false },
      screen: { ...this.QUALITY_PRESETS.critical.screen, enabled: false }
    };
    
    this.notifyAdaptation(audioOnlySettings);
  }

  public getCurrentQuality(): NetworkQuality {
    return { ...this.networkQuality };
  }

  public getQualityHistory(): NetworkQuality[] {
    return [...this.adaptationHistory];
  }

  public getCurrentSettings(): AdaptationSettings {
    return this.QUALITY_PRESETS[this.networkQuality.quality];
  }

  public onAdaptation(callback: (settings: AdaptationSettings) => void): void {
    this.adaptationCallbacks.push(callback);
  }

  public offAdaptation(callback: (settings: AdaptationSettings) => void): void {
    const index = this.adaptationCallbacks.indexOf(callback);
    if (index > -1) {
      this.adaptationCallbacks.splice(index, 1);
    }
  }

  private notifyAdaptation(settings: AdaptationSettings): void {
    this.adaptationCallbacks.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('Error in adaptation callback:', error);
      }
    });
  }

  public forceQuality(quality: NetworkQuality['quality']): void {
    console.log(`Forcing quality to: ${quality}`);
    this.adaptToNetworkQuality(quality);
  }

  public estimateBandwidthUsage(settings: AdaptationSettings): number {
    let totalBitrate = 0;
    
    // Audio bitrate
    totalBitrate += settings.audio.bitrate;
    
    // Video bitrate (if enabled)
    if (settings.video.enabled) {
      totalBitrate += settings.video.bitrate;
    }
    
    // Screen share bitrate (if enabled)
    if (settings.screen.enabled) {
      totalBitrate += settings.screen.bitrate;
    }
    
    // Add overhead for protocol, retransmissions, etc.
    return Math.ceil(totalBitrate * 1.2); // 20% overhead
  }

  public getOptimalSettings(
    availableBandwidth: number,
    targetUsage: number = 0.8 // Use 80% of available bandwidth
  ): AdaptationSettings {
    const targetBitrate = availableBandwidth * targetUsage;
    
    // Find the best quality that fits within the bandwidth
    for (const quality of ['excellent', 'good', 'poor', 'critical'] as const) {
      const settings = this.QUALITY_PRESETS[quality];
      const estimatedUsage = this.estimateBandwidthUsage(settings);
      
      if (estimatedUsage <= targetBitrate) {
        return settings;
      }
    }
    
    return this.QUALITY_PRESETS.critical;
  }

  public destroy(): void {
    this.stopMonitoring();
    this.adaptationCallbacks = [];
    this.adaptationHistory = [];
    this.statsHistory = [];
    this.room = null;
  }
}