/**
 * Comprehensive WebRTC Statistics Monitor for Voice Communications
 * Collects, analyzes, and reports detailed WebRTC performance metrics
 */

export interface AudioStats {
  // Input audio stats
  inputLevel: number; // 0-100
  inputLevelRaw: number; // Raw dBFS
  microphoneVolume: number; // 0-100
  inputClipping: boolean;
  inputSilence: boolean;
  
  // Output audio stats
  outputLevel: number; // 0-100
  outputLevelRaw: number; // Raw dBFS
  outputVolume: number; // 0-100
  outputClipping: boolean;
  
  // Processing stats
  echoCancellationEnabled: boolean;
  noiseSuppressionEnabled: boolean;
  autoGainControlEnabled: boolean;
  processingDelay: number; // ms
  
  // Quality metrics
  audioQualityScore: number; // 0-100
  speechQuality: number; // MOS-like score 1-5
  backgroundNoise: number; // 0-100
}

export interface ConnectionStats {
  // Basic connection info
  state: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
  
  // Network metrics
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  packetLossRate: number; // percentage
  
  // Latency and jitter
  roundTripTime: number; // ms
  jitter: number; // ms
  jitterBuffer: number; // ms
  
  // Bandwidth
  availableIncomingBitrate: number; // kbps
  availableOutgoingBitrate: number; // kbps
  actualBitrate: number; // kbps
  targetBitrate: number; // kbps
  
  // Connection quality
  networkType: string;
  qualityScore: number; // 0-100
  stabilityScore: number; // 0-100
}

export interface TrackStats {
  // Track identification
  trackId: string;
  kind: 'audio' | 'video';
  direction: 'inbound' | 'outbound';
  
  // Codec information
  codecName: string;
  clockRate: number;
  channels?: number;
  
  // Audio-specific metrics
  audioLevel?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
  
  // Packet metrics
  packetsReceived?: number;
  packetsSent?: number;
  packetsLost?: number;
  
  // Bitrate
  bitrate: number; // kbps
  
  // Timing
  jitter?: number;
  delay?: number;
  
  // Quality
  qualityScore: number; // 0-100
}

export interface DetailedStats {
  timestamp: number;
  duration: number; // ms since start
  
  // High-level metrics
  audio: AudioStats;
  connection: ConnectionStats;
  tracks: TrackStats[];
  
  // Historical data points
  qualityHistory: number[];
  latencyHistory: number[];
  packetLossHistory: number[];
  
  // Performance indicators
  overallScore: number; // 0-100
  issues: string[];
  warnings: string[];
}

export interface StatsEvents {
  statsUpdated: (stats: DetailedStats) => void;
  qualityChanged: (score: number, previous: number) => void;
  issueDetected: (issue: string, severity: 'warning' | 'error') => void;
  issueResolved: (issue: string) => void;
  connectionHealthChanged: (healthy: boolean) => void;
}

export class WebRTCStatsMonitor {
  private peerConnection: RTCPeerConnection | null = null;
  private eventHandlers: Map<keyof StatsEvents, Function[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isMonitoring = false;
  private startTime = 0;
  
  // Historical data
  private statsHistory: DetailedStats[] = [];
  private readonly MAX_HISTORY = 300; // Keep 5 minutes at 1Hz
  
  // Issue tracking
  private activeIssues = new Set<string>();
  private issueThresholds = {
    highLatency: 150, // ms
    highPacketLoss: 5, // percentage
    lowQuality: 30, // score out of 100
    connectionUnstable: 3, // state changes per minute
    audioClipping: 0.1, // 10% of samples
    lowBitrate: 32 // kbps
  };
  
  // Quality calculation weights
  private qualityWeights = {
    latency: 0.3,
    packetLoss: 0.3,
    bitrate: 0.2,
    audioLevel: 0.1,
    stability: 0.1
  };

  constructor() {
    this.setupAudioAnalysis();
  }

  private async setupAudioAnalysis(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 48000 });
      
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
      
      console.log('Audio analysis setup completed');
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  }

  public startMonitoring(peerConnection: RTCPeerConnection, interval: number = 1000): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.peerConnection = peerConnection;
    this.isMonitoring = true;
    this.startTime = Date.now();
    
    console.log(`Starting WebRTC stats monitoring (interval: ${interval}ms)`);
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectAndAnalyzeStats();
    }, interval);
    
    // Set up connection state monitoring
    this.setupConnectionMonitoring();
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('WebRTC stats monitoring stopped');
  }

  private setupConnectionMonitoring(): void {
    if (!this.peerConnection) return;

    const handleStateChange = () => {
      console.log('Connection state changed:', {
        connectionState: this.peerConnection?.connectionState,
        iceConnectionState: this.peerConnection?.iceConnectionState,
        signalingState: this.peerConnection?.signalingState
      });
    };

    this.peerConnection.addEventListener('connectionstatechange', handleStateChange);
    this.peerConnection.addEventListener('iceconnectionstatechange', handleStateChange);
    this.peerConnection.addEventListener('signalingstatechange', handleStateChange);
  }

  private async collectAndAnalyzeStats(): Promise<void> {
    if (!this.peerConnection || !this.isMonitoring) return;

    try {
      const rawStats = await this.peerConnection.getStats();
      const detailedStats = await this.processRawStats(rawStats);
      
      // Add to history
      this.statsHistory.push(detailedStats);
      if (this.statsHistory.length > this.MAX_HISTORY) {
        this.statsHistory.shift();
      }
      
      // Analyze for issues
      this.analyzeForIssues(detailedStats);
      
      // Emit events
      this.emit('statsUpdated', detailedStats);
      
      // Check for quality changes
      this.checkQualityChanges(detailedStats);
      
    } catch (error) {
      console.error('Failed to collect WebRTC stats:', error);
    }
  }

  private async processRawStats(rawStats: RTCStatsReport): Promise<DetailedStats> {
    const now = Date.now();
    const duration = now - this.startTime;
    
    // Initialize stats structure
    const stats: DetailedStats = {
      timestamp: now,
      duration,
      audio: this.initializeAudioStats(),
      connection: this.initializeConnectionStats(),
      tracks: [],
      qualityHistory: this.statsHistory.map(s => s.overallScore).slice(-10),
      latencyHistory: this.statsHistory.map(s => s.connection.roundTripTime).slice(-10),
      packetLossHistory: this.statsHistory.map(s => s.connection.packetLossRate).slice(-10),
      overallScore: 0,
      issues: [],
      warnings: []
    };

    // Process each stat
    for (const [id, stat] of rawStats) {
      await this.processStat(id, stat, stats);
    }
    
    // Calculate derived metrics
    this.calculateDerivedMetrics(stats);
    
    // Calculate overall quality score
    stats.overallScore = this.calculateOverallQuality(stats);
    
    return stats;
  }

  private async processStat(id: string, stat: any, stats: DetailedStats): Promise<void> {
    switch (stat.type) {
      case 'inbound-rtp':
        if (stat.kind === 'audio') {
          await this.processInboundAudioStats(stat, stats);
        }
        break;
        
      case 'outbound-rtp':
        if (stat.kind === 'audio') {
          await this.processOutboundAudioStats(stat, stats);
        }
        break;
        
      case 'candidate-pair':
        if (stat.state === 'succeeded') {
          await this.processConnectionStats(stat, stats);
        }
        break;
        
      case 'media-source':
        if (stat.kind === 'audio') {
          await this.processMediaSourceStats(stat, stats);
        }
        break;
        
      case 'track':
        await this.processTrackStats(stat, stats);
        break;
    }
  }

  private async processInboundAudioStats(stat: any, stats: DetailedStats): Promise<void> {
    // Update connection stats
    stats.connection.bytesReceived += stat.bytesReceived || 0;
    stats.connection.packetsReceived += stat.packetsReceived || 0;
    stats.connection.packetsLost += stat.packetsLost || 0;
    stats.connection.jitter = stat.jitter || 0;
    
    // Calculate packet loss rate
    const totalPackets = stats.connection.packetsReceived + stats.connection.packetsLost;
    stats.connection.packetLossRate = totalPackets > 0 ? 
      (stats.connection.packetsLost / totalPackets) * 100 : 0;
    
    // Audio level processing
    if (stat.audioLevel !== undefined) {
      stats.audio.outputLevel = Math.min(100, stat.audioLevel * 1000);
      stats.audio.outputLevelRaw = 20 * Math.log10(stat.audioLevel || 0.001); // Convert to dBFS
      stats.audio.outputClipping = stat.audioLevel > 0.95;
    }
    
    // Track stats
    const trackStat: TrackStats = {
      trackId: stat.trackId || id,
      kind: 'audio',
      direction: 'inbound',
      codecName: '', // Will be filled from codec stats
      clockRate: 0,
      channels: 1,
      packetsReceived: stat.packetsReceived,
      packetsLost: stat.packetsLost,
      bitrate: this.calculateBitrate(stat.bytesReceived, 'received'),
      jitter: stat.jitter,
      qualityScore: 0 // Will be calculated
    };
    
    stats.tracks.push(trackStat);
  }

  private async processOutboundAudioStats(stat: any, stats: DetailedStats): Promise<void> {
    stats.connection.bytesSent += stat.bytesSent || 0;
    stats.connection.packetsSent += stat.packetsSent || 0;
    
    // Track stats
    const trackStat: TrackStats = {
      trackId: stat.trackId || id,
      kind: 'audio',
      direction: 'outbound',
      codecName: '',
      clockRate: 0,
      channels: 1,
      packetsSent: stat.packetsSent,
      bitrate: this.calculateBitrate(stat.bytesSent, 'sent'),
      qualityScore: 0
    };
    
    stats.tracks.push(trackStat);
  }

  private async processConnectionStats(stat: any, stats: DetailedStats): Promise<void> {
    stats.connection.roundTripTime = stat.currentRoundTripTime || 0;
    stats.connection.availableIncomingBitrate = stat.availableIncomingBitrate || 0;
    stats.connection.availableOutgoingBitrate = stat.availableOutgoingBitrate || 0;
  }

  private async processMediaSourceStats(stat: any, stats: DetailedStats): Promise<void> {
    if (stat.audioLevel !== undefined) {
      stats.audio.inputLevel = Math.min(100, stat.audioLevel * 1000);
      stats.audio.inputLevelRaw = 20 * Math.log10(stat.audioLevel || 0.001);
      stats.audio.inputClipping = stat.audioLevel > 0.95;
      stats.audio.inputSilence = stat.audioLevel < 0.001;
    }
    
    // Echo cancellation info
    if (stat.echoCancellationReturnLoss !== undefined) {
      stats.audio.echoCancellationEnabled = stat.echoCancellationReturnLoss > -100;
    }
  }

  private async processTrackStats(stat: any, stats: DetailedStats): Promise<void> {
    // Additional track processing if needed
  }

  private calculateBitrate(bytes: number, direction: 'sent' | 'received'): number {
    const previousStats = this.statsHistory[this.statsHistory.length - 1];
    if (!previousStats) return 0;
    
    const timeDiff = (Date.now() - previousStats.timestamp) / 1000; // seconds
    if (timeDiff <= 0) return 0;
    
    const previousBytes = direction === 'sent' ? 
      previousStats.connection.bytesSent : 
      previousStats.connection.bytesReceived;
    
    const bytesDiff = bytes - previousBytes;
    return Math.max(0, (bytesDiff * 8) / (timeDiff * 1000)); // kbps
  }

  private initializeAudioStats(): AudioStats {
    return {
      inputLevel: 0,
      inputLevelRaw: -60,
      microphoneVolume: 100,
      inputClipping: false,
      inputSilence: true,
      outputLevel: 0,
      outputLevelRaw: -60,
      outputVolume: 100,
      outputClipping: false,
      echoCancellationEnabled: true,
      noiseSuppressionEnabled: true,
      autoGainControlEnabled: true,
      processingDelay: 0,
      audioQualityScore: 0,
      speechQuality: 3.0,
      backgroundNoise: 0
    };
  }

  private initializeConnectionStats(): ConnectionStats {
    return {
      state: this.peerConnection?.connectionState || 'new',
      iceConnectionState: this.peerConnection?.iceConnectionState || 'new',
      iceGatheringState: this.peerConnection?.iceGatheringState || 'new',
      signalingState: this.peerConnection?.signalingState || 'stable',
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      packetsLost: 0,
      packetLossRate: 0,
      roundTripTime: 0,
      jitter: 0,
      jitterBuffer: 0,
      availableIncomingBitrate: 0,
      availableOutgoingBitrate: 0,
      actualBitrate: 0,
      targetBitrate: 64,
      networkType: this.getNetworkType(),
      qualityScore: 0,
      stabilityScore: 0
    };
  }

  private getNetworkType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private calculateDerivedMetrics(stats: DetailedStats): void {
    // Calculate audio quality score
    stats.audio.audioQualityScore = this.calculateAudioQuality(stats.audio);
    
    // Calculate connection quality
    stats.connection.qualityScore = this.calculateConnectionQuality(stats.connection);
    
    // Calculate connection stability
    stats.connection.stabilityScore = this.calculateStabilityScore();
    
    // Update track quality scores
    stats.tracks.forEach(track => {
      track.qualityScore = this.calculateTrackQuality(track, stats);
    });
  }

  private calculateAudioQuality(audio: AudioStats): number {
    let score = 100;
    
    // Penalize clipping
    if (audio.inputClipping || audio.outputClipping) score -= 30;
    
    // Penalize if too quiet or too loud
    if (audio.inputLevel < 10 || audio.inputLevel > 90) score -= 20;
    if (audio.outputLevel < 10 || audio.outputLevel > 90) score -= 10;
    
    // Reward proper audio processing
    if (audio.echoCancellationEnabled) score += 5;
    if (audio.noiseSuppressionEnabled) score += 5;
    if (audio.autoGainControlEnabled) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateConnectionQuality(connection: ConnectionStats): number {
    let score = 100;
    
    // Latency penalty
    if (connection.roundTripTime > 200) score -= 40;
    else if (connection.roundTripTime > 100) score -= 20;
    else if (connection.roundTripTime > 50) score -= 10;
    
    // Packet loss penalty
    score -= connection.packetLossRate * 10;
    
    // Jitter penalty
    if (connection.jitter > 30) score -= 20;
    else if (connection.jitter > 15) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateStabilityScore(): number {
    if (this.statsHistory.length < 10) return 50;
    
    // Look at connection state changes over time
    const recentStats = this.statsHistory.slice(-10);
    const stateChanges = new Set(recentStats.map(s => s.connection.state)).size;
    
    // More stable = fewer state changes
    return Math.max(0, 100 - (stateChanges * 20));
  }

  private calculateTrackQuality(track: TrackStats, stats: DetailedStats): number {
    let score = 100;
    
    if (track.kind === 'audio') {
      // Bitrate scoring
      if (track.bitrate < 16) score -= 40;
      else if (track.bitrate < 32) score -= 20;
      else if (track.bitrate < 48) score -= 10;
      
      // Packet loss
      if (track.packetsLost && track.packetsReceived) {
        const lossRate = (track.packetsLost / (track.packetsReceived + track.packetsLost)) * 100;
        score -= lossRate * 10;
      }
      
      // Jitter
      if (track.jitter) {
        if (track.jitter > 30) score -= 20;
        else if (track.jitter > 15) score -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallQuality(stats: DetailedStats): number {
    const weights = this.qualityWeights;
    
    let score = 0;
    score += stats.audio.audioQualityScore * weights.audioLevel;
    score += stats.connection.qualityScore * (weights.latency + weights.packetLoss);
    score += stats.connection.stabilityScore * weights.stability;
    
    // Average track quality
    const avgTrackQuality = stats.tracks.length > 0 ? 
      stats.tracks.reduce((sum, track) => sum + track.qualityScore, 0) / stats.tracks.length : 0;
    score += avgTrackQuality * weights.bitrate;
    
    return Math.max(0, Math.min(100, score));
  }

  private analyzeForIssues(stats: DetailedStats): void {
    const newIssues: string[] = [];
    const resolvedIssues: string[] = [];
    
    // Check for various issues
    if (stats.connection.roundTripTime > this.issueThresholds.highLatency) {
      newIssues.push('high_latency');
    } else if (this.activeIssues.has('high_latency')) {
      resolvedIssues.push('high_latency');
    }
    
    if (stats.connection.packetLossRate > this.issueThresholds.highPacketLoss) {
      newIssues.push('high_packet_loss');
    } else if (this.activeIssues.has('high_packet_loss')) {
      resolvedIssues.push('high_packet_loss');
    }
    
    if (stats.overallScore < this.issueThresholds.lowQuality) {
      newIssues.push('low_quality');
    } else if (this.activeIssues.has('low_quality')) {
      resolvedIssues.push('low_quality');
    }
    
    if (stats.audio.inputClipping || stats.audio.outputClipping) {
      newIssues.push('audio_clipping');
    } else if (this.activeIssues.has('audio_clipping')) {
      resolvedIssues.push('audio_clipping');
    }
    
    // Process new issues
    for (const issue of newIssues) {
      if (!this.activeIssues.has(issue)) {
        this.activeIssues.add(issue);
        stats.issues.push(issue);
        this.emit('issueDetected', issue, this.getIssueSeverity(issue));
      }
    }
    
    // Process resolved issues
    for (const issue of resolvedIssues) {
      this.activeIssues.delete(issue);
      this.emit('issueResolved', issue);
    }
    
    // Update current issues list
    stats.issues = Array.from(this.activeIssues);
  }

  private getIssueSeverity(issue: string): 'warning' | 'error' {
    switch (issue) {
      case 'high_packet_loss':
      case 'low_quality':
        return 'error';
      default:
        return 'warning';
    }
  }

  private checkQualityChanges(stats: DetailedStats): void {
    const previousStats = this.statsHistory[this.statsHistory.length - 2];
    if (previousStats) {
      const qualityDiff = Math.abs(stats.overallScore - previousStats.overallScore);
      if (qualityDiff > 10) { // Significant change
        this.emit('qualityChanged', stats.overallScore, previousStats.overallScore);
      }
    }
  }

  public getCurrentStats(): DetailedStats | null {
    return this.statsHistory.length > 0 ? 
      this.statsHistory[this.statsHistory.length - 1] : null;
  }

  public getStatsHistory(): DetailedStats[] {
    return [...this.statsHistory];
  }

  public getAverageQuality(duration: number = 60000): number {
    const cutoff = Date.now() - duration;
    const recentStats = this.statsHistory.filter(s => s.timestamp > cutoff);
    
    if (recentStats.length === 0) return 0;
    
    return recentStats.reduce((sum, stats) => sum + stats.overallScore, 0) / recentStats.length;
  }

  // Event handling
  public on<K extends keyof StatsEvents>(event: K, handler: StatsEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof StatsEvents>(event: K, handler: StatsEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof StatsEvents>(event: K, ...args: Parameters<StatsEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in WebRTC stats monitor event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.stopMonitoring();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyserNode = null;
    this.peerConnection = null;
    this.statsHistory = [];
    this.activeIssues.clear();
    this.eventHandlers.clear();
    
    console.log('WebRTC Stats Monitor destroyed');
  }
}