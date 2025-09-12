export interface StreamInfo {
  id: string;
  type: 'audio' | 'video' | 'screen' | 'mixed';
  source: 'microphone' | 'camera' | 'screen' | 'remote' | 'processed';
  stream: MediaStream;
  createdAt: number;
  lastUsed: number;
  trackCount: number;
  isActive: boolean;
  metadata: {
    deviceId?: string;
    deviceLabel?: string;
    constraints?: MediaTrackConstraints;
    processingApplied?: string[];
  };
}

export interface TrackInfo {
  id: string;
  kind: 'audio' | 'video';
  label: string;
  enabled: boolean;
  muted: boolean;
  readyState: MediaStreamTrackState;
  settings: MediaTrackSettings;
  constraints: MediaTrackConstraints | null;
  streamId: string;
  createdAt: number;
}

export interface CleanupStats {
  totalStreamsCreated: number;
  totalStreamsCleaned: number;
  totalTracksCreated: number;
  totalTracksCleaned: number;
  activeStreams: number;
  activeTracks: number;
  memoryUsageEstimate: number; // KB
  lastCleanupTime: number;
  cleanupErrors: number;
}

export class MediaStreamManager {
  private streams: Map<string, StreamInfo> = new Map();
  private tracks: Map<string, TrackInfo> = new Map();
  private cleanupQueue: Set<string> = new Set();
  private activeConnections: Set<string> = new Set();
  
  private cleanupTimer: NodeJS.Timeout | null = null;
  private memoryMonitorTimer: NodeJS.Timeout | null = null;
  private trackEventListeners: Map<string, { track: MediaStreamTrack; listeners: Function[] }> = new Map();
  
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MEMORY_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly MAX_INACTIVE_TIME = 300000; // 5 minutes
  private readonly FORCE_CLEANUP_THRESHOLD = 100; // Force cleanup after 100 streams
  
  private stats: CleanupStats = {
    totalStreamsCreated: 0,
    totalStreamsCleaned: 0,
    totalTracksCreated: 0,
    totalTracksCleaned: 0,
    activeStreams: 0,
    activeTracks: 0,
    memoryUsageEstimate: 0,
    lastCleanupTime: Date.now(),
    cleanupErrors: 0
  };

  private eventHandlers: Map<string, Function[]> = new Map();
  private isDestroyed = false;

  constructor() {
    this.startCleanupTimer();
    this.startMemoryMonitoring();
    this.setupGlobalCleanupHandlers();
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitorTimer = setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryThresholds();
    }, this.MEMORY_CHECK_INTERVAL);
  }

  private setupGlobalCleanupHandlers(): void {
    // Page unload cleanup
    window.addEventListener('beforeunload', () => {
      this.emergencyCleanup();
    });

    // Page visibility cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performCleanup();
      }
    });

    // Memory pressure cleanup (experimental)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('Memory pressure detected, forcing cleanup');
          this.forceCleanup();
        }
      }, 30000);
    }
  }

  public createStream(
    type: StreamInfo['type'],
    source: StreamInfo['source'],
    stream: MediaStream,
    metadata: StreamInfo['metadata'] = {}
  ): string {
    const streamInfo: StreamInfo = {
      id: this.generateId(),
      type,
      source,
      stream,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      trackCount: stream.getTracks().length,
      isActive: true,
      metadata
    };

    this.streams.set(streamInfo.id, streamInfo);
    this.stats.totalStreamsCreated++;
    this.stats.activeStreams++;

    // Track individual tracks
    stream.getTracks().forEach(track => {
      this.registerTrack(track, streamInfo.id);
    });

    // Set up stream event listeners
    this.setupStreamEventListeners(streamInfo);

    console.log(`Created stream ${streamInfo.id} (${type}/${source}) with ${streamInfo.trackCount} tracks`);
    this.emit('streamCreated', streamInfo);

    return streamInfo.id;
  }

  private registerTrack(track: MediaStreamTrack, streamId: string): void {
    const trackInfo: TrackInfo = {
      id: track.id,
      kind: track.kind as 'audio' | 'video',
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings(),
      constraints: track.getConstraints ? track.getConstraints() : null,
      streamId,
      createdAt: Date.now()
    };

    this.tracks.set(track.id, trackInfo);
    this.stats.totalTracksCreated++;
    this.stats.activeTracks++;

    // Set up track event listeners
    this.setupTrackEventListeners(track);

    console.log(`Registered track ${track.id} (${track.kind}): ${track.label}`);
  }

  private setupStreamEventListeners(streamInfo: StreamInfo): void {
    const stream = streamInfo.stream;
    const listeners: Function[] = [];

    // Track added event
    const onAddTrack = (event: MediaStreamTrackEvent) => {
      this.registerTrack(event.track, streamInfo.id);
      streamInfo.trackCount++;
      streamInfo.lastUsed = Date.now();
      this.emit('trackAdded', streamInfo.id, event.track);
    };

    // Track removed event
    const onRemoveTrack = (event: MediaStreamTrackEvent) => {
      this.unregisterTrack(event.track.id);
      streamInfo.trackCount--;
      streamInfo.lastUsed = Date.now();
      
      // Mark stream for cleanup if no tracks remain
      if (streamInfo.trackCount <= 0) {
        this.scheduleCleanup(streamInfo.id);
      }
      
      this.emit('trackRemoved', streamInfo.id, event.track);
    };

    stream.addEventListener('addtrack', onAddTrack);
    stream.addEventListener('removetrack', onRemoveTrack);

    listeners.push(
      () => stream.removeEventListener('addtrack', onAddTrack),
      () => stream.removeEventListener('removetrack', onRemoveTrack)
    );

    // Store cleanup functions
    streamInfo.metadata = {
      ...streamInfo.metadata,
      _cleanupListeners: listeners
    };
  }

  private setupTrackEventListeners(track: MediaStreamTrack): void {
    const listeners: Function[] = [];

    const onEnded = () => {
      console.log(`Track ${track.id} ended`);
      this.handleTrackEnded(track);
    };

    const onMute = () => {
      const trackInfo = this.tracks.get(track.id);
      if (trackInfo) {
        trackInfo.muted = true;
        this.emit('trackMuted', track.id);
      }
    };

    const onUnmute = () => {
      const trackInfo = this.tracks.get(track.id);
      if (trackInfo) {
        trackInfo.muted = false;
        this.emit('trackUnmuted', track.id);
      }
    };

    track.addEventListener('ended', onEnded);
    track.addEventListener('mute', onMute);
    track.addEventListener('unmute', onUnmute);

    listeners.push(
      () => track.removeEventListener('ended', onEnded),
      () => track.removeEventListener('mute', onMute),
      () => track.removeEventListener('unmute', onUnmute)
    );

    this.trackEventListeners.set(track.id, { track, listeners });
  }

  private handleTrackEnded(track: MediaStreamTrack): void {
    const trackInfo = this.tracks.get(track.id);
    if (trackInfo) {
      trackInfo.readyState = track.readyState;
      
      // Find parent stream and check if it should be cleaned up
      const streamInfo = this.streams.get(trackInfo.streamId);
      if (streamInfo) {
        const activeTracks = streamInfo.stream.getTracks().filter(t => t.readyState === 'live');
        if (activeTracks.length === 0) {
          console.log(`All tracks ended for stream ${streamInfo.id}, scheduling cleanup`);
          this.scheduleCleanup(streamInfo.id);
        }
      }
    }
    
    this.emit('trackEnded', track.id);
  }

  public updateStreamUsage(streamId: string): void {
    const streamInfo = this.streams.get(streamId);
    if (streamInfo) {
      streamInfo.lastUsed = Date.now();
      streamInfo.isActive = true;
    }
  }

  public markStreamInactive(streamId: string): void {
    const streamInfo = this.streams.get(streamId);
    if (streamInfo) {
      streamInfo.isActive = false;
    }
  }

  public scheduleCleanup(streamId: string): void {
    this.cleanupQueue.add(streamId);
    console.log(`Scheduled cleanup for stream ${streamId}`);
  }

  public cleanupStream(streamId: string, force: boolean = false): boolean {
    const streamInfo = this.streams.get(streamId);
    if (!streamInfo) {
      return false;
    }

    // Don't cleanup active connections unless forced
    if (!force && this.activeConnections.has(streamId)) {
      console.log(`Skipping cleanup of active stream ${streamId}`);
      return false;
    }

    try {
      console.log(`Cleaning up stream ${streamId} (${streamInfo.type}/${streamInfo.source})`);

      // Stop all tracks
      streamInfo.stream.getTracks().forEach(track => {
        try {
          if (track.readyState === 'live') {
            track.stop();
          }
          this.unregisterTrack(track.id);
        } catch (error) {
          console.error(`Error stopping track ${track.id}:`, error);
          this.stats.cleanupErrors++;
        }
      });

      // Clean up stream event listeners
      const listeners = (streamInfo.metadata as any)._cleanupListeners;
      if (Array.isArray(listeners)) {
        listeners.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.error('Error cleaning up stream listener:', error);
          }
        });
      }

      // Remove from collections
      this.streams.delete(streamId);
      this.cleanupQueue.delete(streamId);
      this.stats.totalStreamsCleaned++;
      this.stats.activeStreams = Math.max(0, this.stats.activeStreams - 1);

      this.emit('streamCleaned', streamId);
      return true;

    } catch (error) {
      console.error(`Error cleaning up stream ${streamId}:`, error);
      this.stats.cleanupErrors++;
      return false;
    }
  }

  private unregisterTrack(trackId: string): void {
    const trackInfo = this.tracks.get(trackId);
    if (trackInfo) {
      // Clean up track event listeners
      const listenerInfo = this.trackEventListeners.get(trackId);
      if (listenerInfo) {
        listenerInfo.listeners.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.error('Error cleaning up track listener:', error);
          }
        });
        this.trackEventListeners.delete(trackId);
      }

      this.tracks.delete(trackId);
      this.stats.totalTracksCleaned++;
      this.stats.activeTracks = Math.max(0, this.stats.activeTracks - 1);
    }
  }

  private performCleanup(): void {
    if (this.isDestroyed) return;

    const now = Date.now();
    let cleanupCount = 0;

    console.log(`Starting cleanup cycle - ${this.streams.size} streams, ${this.cleanupQueue.size} queued`);

    // Clean up queued streams
    for (const streamId of this.cleanupQueue) {
      if (this.cleanupStream(streamId)) {
        cleanupCount++;
      }
    }

    // Clean up inactive streams
    for (const [streamId, streamInfo] of this.streams) {
      const timeSinceLastUse = now - streamInfo.lastUsed;
      
      if (!streamInfo.isActive && timeSinceLastUse > this.MAX_INACTIVE_TIME) {
        console.log(`Cleaning up inactive stream ${streamId} (${timeSinceLastUse}ms since last use)`);
        if (this.cleanupStream(streamId)) {
          cleanupCount++;
        }
      }
    }

    // Force cleanup if we have too many streams
    if (this.streams.size > this.FORCE_CLEANUP_THRESHOLD) {
      console.warn(`Too many streams (${this.streams.size}), forcing cleanup of oldest`);
      this.forceCleanup();
    }

    this.stats.lastCleanupTime = now;
    
    if (cleanupCount > 0) {
      console.log(`Cleanup completed - cleaned ${cleanupCount} streams`);
      this.emit('cleanupCompleted', cleanupCount);
    }
  }

  private forceCleanup(): void {
    // Sort streams by last used time (oldest first)
    const sortedStreams = Array.from(this.streams.entries())
      .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

    // Clean up the oldest 25% of streams
    const cleanupCount = Math.ceil(sortedStreams.length * 0.25);
    let cleaned = 0;

    for (let i = 0; i < Math.min(cleanupCount, sortedStreams.length); i++) {
      const [streamId] = sortedStreams[i];
      if (this.cleanupStream(streamId, true)) {
        cleaned++;
      }
    }

    console.log(`Force cleanup completed - cleaned ${cleaned} streams`);
  }

  private emergencyCleanup(): void {
    console.log('Emergency cleanup - stopping all streams');
    
    let cleaned = 0;
    for (const [streamId] of this.streams) {
      if (this.cleanupStream(streamId, true)) {
        cleaned++;
      }
    }

    console.log(`Emergency cleanup completed - cleaned ${cleaned} streams`);
  }

  private updateMemoryStats(): void {
    // Estimate memory usage based on stream count and types
    let memoryEstimate = 0;
    
    for (const streamInfo of this.streams.values()) {
      // Rough estimates in KB
      if (streamInfo.type === 'video' || streamInfo.type === 'screen') {
        memoryEstimate += 2000; // ~2MB per video stream
      } else if (streamInfo.type === 'audio') {
        memoryEstimate += 100; // ~100KB per audio stream
      } else {
        memoryEstimate += 1000; // ~1MB for mixed streams
      }
    }

    this.stats.memoryUsageEstimate = memoryEstimate;
    this.stats.activeStreams = this.streams.size;
    this.stats.activeTracks = this.tracks.size;
  }

  private checkMemoryThresholds(): void {
    const memoryThreshold = 50000; // 50MB threshold
    
    if (this.stats.memoryUsageEstimate > memoryThreshold) {
      console.warn(`Memory usage high (${this.stats.memoryUsageEstimate}KB), forcing cleanup`);
      this.forceCleanup();
    }
  }

  public addActiveConnection(streamId: string): void {
    this.activeConnections.add(streamId);
    this.updateStreamUsage(streamId);
  }

  public removeActiveConnection(streamId: string): void {
    this.activeConnections.delete(streamId);
    this.markStreamInactive(streamId);
  }

  public getStreamInfo(streamId: string): StreamInfo | null {
    return this.streams.get(streamId) || null;
  }

  public getAllStreams(): StreamInfo[] {
    return Array.from(this.streams.values());
  }

  public getStreamsByType(type: StreamInfo['type']): StreamInfo[] {
    return Array.from(this.streams.values()).filter(stream => stream.type === type);
  }

  public getStreamsBySource(source: StreamInfo['source']): StreamInfo[] {
    return Array.from(this.streams.values()).filter(stream => stream.source === source);
  }

  public getStats(): CleanupStats {
    this.updateMemoryStats();
    return { ...this.stats };
  }

  public getTrackInfo(trackId: string): TrackInfo | null {
    return this.tracks.get(trackId) || null;
  }

  public getAllTracks(): TrackInfo[] {
    return Array.from(this.tracks.values());
  }

  private generateId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in media stream manager event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;

    // Clean up all timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.memoryMonitorTimer) {
      clearInterval(this.memoryMonitorTimer);
      this.memoryMonitorTimer = null;
    }

    // Emergency cleanup of all streams
    this.emergencyCleanup();

    // Clear all collections
    this.streams.clear();
    this.tracks.clear();
    this.cleanupQueue.clear();
    this.activeConnections.clear();
    this.trackEventListeners.clear();
    this.eventHandlers.clear();

    console.log('MediaStreamManager destroyed');
  }
}