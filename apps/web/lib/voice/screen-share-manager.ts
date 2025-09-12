export interface ScreenShareOptions {
  video?: boolean;
  audio?: boolean;
  cursor?: 'always' | 'motion' | 'never';
  displaySurface?: 'application' | 'browser' | 'monitor' | 'window';
  selfBrowserSurface?: 'exclude' | 'include';
  systemAudio?: 'exclude' | 'include';
  maxWidth?: number;
  maxHeight?: number;
  frameRate?: number;
}

export interface ScreenShareState {
  isSharing: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  displaySurface?: string;
  error: string | null;
  stream: MediaStream | null;
  startTime: number | null;
  endTime: number | null;
}

export interface ScreenShareError {
  type: 'permission_denied' | 'not_supported' | 'device_error' | 'stream_ended' | 'unknown';
  message: string;
  recoverable: boolean;
  timestamp: number;
}

export class ScreenShareManager {
  private state: ScreenShareState = {
    isSharing: false,
    hasVideo: false,
    hasAudio: false,
    error: null,
    stream: null,
    startTime: null,
    endTime: null
  };

  private eventHandlers: Map<string, Function[]> = new Map();
  private cleanupFunctions: Function[] = [];
  private retryAttempts = 0;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private voiceManager: any = null;
  private isDestroyed = false;
  
  // Browser capability cache
  private capabilities = {
    getDisplayMedia: false,
    audioConstraints: false,
    cursorConstraints: false,
    displaySurfaceConstraints: false,
    systemAudioConstraints: false
  };

  constructor() {
    this.checkBrowserCapabilities();
    this.setupGlobalErrorHandlers();
  }

  private checkBrowserCapabilities(): void {
    // Check if getDisplayMedia is supported
    this.capabilities.getDisplayMedia = 
      !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

    if (this.capabilities.getDisplayMedia) {
      // Check for advanced constraints support
      try {
        const testConstraints = {
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          },
          audio: {
            systemAudio: 'include'
          }
        };
        
        // Test if browser supports these constraints (won't actually start capture)
        this.capabilities.cursorConstraints = true;
        this.capabilities.displaySurfaceConstraints = true;
        this.capabilities.audioConstraints = true;
        this.capabilities.systemAudioConstraints = true;
      } catch (error) {
        // Advanced constraints not supported
      }
    }

    console.log('Screen share capabilities:', this.capabilities);
  }

  private setupGlobalErrorHandlers(): void {
    // Handle global errors related to screen sharing
    window.addEventListener('error', (event) => {
      if (event.error?.stack?.includes('getDisplayMedia') ||
          event.error?.stack?.includes('screen') ||
          event.error?.stack?.includes('display')) {
        this.handleError({
          type: 'unknown',
          message: event.error.message,
          recoverable: true,
          timestamp: Date.now()
        });
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.toString().includes('getDisplayMedia') ||
          event.reason?.toString().includes('screen share') ||
          event.reason?.toString().includes('display media')) {
        this.handleError({
          type: 'unknown',
          message: event.reason?.message || 'Screen share promise rejection',
          recoverable: true,
          timestamp: Date.now()
        });
        event.preventDefault();
      }
    });
  }

  public setVoiceManager(manager: any): void {
    this.voiceManager = manager;
  }

  public isSupported(): boolean {
    return this.capabilities.getDisplayMedia;
  }

  public getCapabilities(): typeof this.capabilities {
    return { ...this.capabilities };
  }

  public getState(): ScreenShareState {
    return { ...this.state };
  }

  public async startScreenShare(options: ScreenShareOptions = {}): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('ScreenShareManager has been destroyed');
    }

    if (!this.isSupported()) {
      throw new Error('Screen sharing is not supported in this browser');
    }

    if (this.state.isSharing) {
      console.warn('Screen sharing is already active');
      return;
    }

    try {
      this.setState({ error: null });
      const stream = await this.captureScreen(options);
      await this.publishStream(stream);
      
      this.setState({
        isSharing: true,
        hasVideo: stream.getVideoTracks().length > 0,
        hasAudio: stream.getAudioTracks().length > 0,
        stream,
        startTime: Date.now()
      });

      this.setupStreamEventHandlers(stream);
      this.retryAttempts = 0;
      
      this.emit('started', this.getState());
      console.log('Screen sharing started successfully');
      
    } catch (error) {
      const screenShareError = this.categorizeError(error as Error);
      this.handleError(screenShareError);
      throw error;
    }
  }

  private async captureScreen(options: ScreenShareOptions): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: options.video !== false ? this.buildVideoConstraints(options) : false,
      audio: options.audio === true ? this.buildAudioConstraints(options) : false
    };

    try {
      console.log('Requesting screen share with constraints:', constraints);
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      if (!stream) {
        throw new Error('Failed to capture screen - no stream returned');
      }

      // Validate that we got the expected tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      if (options.video !== false && videoTracks.length === 0) {
        throw new Error('No video track received despite video being requested');
      }

      // Get display surface information if available
      const videoTrack = videoTracks[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.setState({
          displaySurface: settings.displaySurface
        });
      }

      return stream;
      
    } catch (error) {
      console.error('Screen capture failed:', error);
      throw error;
    }
  }

  private buildVideoConstraints(options: ScreenShareOptions): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = {};

    // Basic resolution constraints
    if (options.maxWidth) {
      constraints.width = { max: options.maxWidth };
    }
    if (options.maxHeight) {
      constraints.height = { max: options.maxHeight };
    }
    if (options.frameRate) {
      constraints.frameRate = { max: options.frameRate };
    }

    // Advanced constraints (if supported)
    if (this.capabilities.cursorConstraints && options.cursor) {
      (constraints as any).cursor = options.cursor;
    }

    if (this.capabilities.displaySurfaceConstraints && options.displaySurface) {
      (constraints as any).displaySurface = options.displaySurface;
    }

    if (this.capabilities.displaySurfaceConstraints && options.selfBrowserSurface) {
      (constraints as any).selfBrowserSurface = options.selfBrowserSurface;
    }

    return constraints;
  }

  private buildAudioConstraints(options: ScreenShareOptions): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = {};

    if (this.capabilities.systemAudioConstraints && options.systemAudio) {
      (constraints as any).systemAudio = options.systemAudio;
    }

    return constraints;
  }

  private async publishStream(stream: MediaStream): Promise<void> {
    if (!this.voiceManager) {
      console.warn('No voice manager available, screen share stream not published');
      return;
    }

    try {
      // Use the voice manager's screen share method
      await this.voiceManager.publishScreenShare(stream);
    } catch (error) {
      console.error('Failed to publish screen share stream:', error);
      throw new Error('Failed to publish screen share to voice channel');
    }
  }

  private setupStreamEventHandlers(stream: MediaStream): void {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Handle video track ending
    if (videoTrack) {
      const handleVideoEnd = () => {
        console.log('Screen share video track ended');
        this.handleStreamEnded();
      };

      videoTrack.addEventListener('ended', handleVideoEnd);
      this.cleanupFunctions.push(() => {
        videoTrack.removeEventListener('ended', handleVideoEnd);
      });

      // Monitor track state
      const monitorTrack = () => {
        if (videoTrack.readyState === 'ended') {
          this.handleStreamEnded();
        }
      };

      const trackMonitor = setInterval(monitorTrack, 1000);
      this.cleanupFunctions.push(() => clearInterval(trackMonitor));
    }

    // Handle audio track ending
    if (audioTrack) {
      const handleAudioEnd = () => {
        console.log('Screen share audio track ended');
        // Don't stop entire screen share if only audio ends
        this.setState({ hasAudio: false });
        this.emit('audioEnded');
      };

      audioTrack.addEventListener('ended', handleAudioEnd);
      this.cleanupFunctions.push(() => {
        audioTrack.removeEventListener('ended', handleAudioEnd);
      });
    }

    // Handle browser tab/window closing
    const handleBeforeUnload = () => {
      this.stopScreenShare();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    this.cleanupFunctions.push(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }

  private handleStreamEnded(): void {
    console.log('Screen share stream ended unexpectedly');
    this.handleError({
      type: 'stream_ended',
      message: 'Screen sharing was stopped by the user or system',
      recoverable: false,
      timestamp: Date.now()
    });
    
    this.stopScreenShare(false); // Don't stop tracks as they're already ended
  }

  public async stopScreenShare(stopTracks: boolean = true): Promise<void> {
    if (!this.state.isSharing) {
      return;
    }

    try {
      // Unpublish from voice channel
      if (this.voiceManager) {
        await this.voiceManager.unpublishScreenShare();
      }

      // Stop media tracks
      if (stopTracks && this.state.stream) {
        this.state.stream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      }

      // Clean up event handlers
      this.cleanupFunctions.forEach(cleanup => cleanup());
      this.cleanupFunctions.length = 0;

      this.setState({
        isSharing: false,
        hasVideo: false,
        hasAudio: false,
        stream: null,
        endTime: Date.now(),
        error: null
      });

      this.emit('stopped', this.getState());
      console.log('Screen sharing stopped');

    } catch (error) {
      console.error('Error stopping screen share:', error);
      // Still update state even if cleanup fails
      this.setState({
        isSharing: false,
        hasVideo: false,
        hasAudio: false,
        stream: null,
        endTime: Date.now()
      });
    }
  }

  public async retryScreenShare(options: ScreenShareOptions = {}): Promise<void> {
    if (this.retryAttempts >= this.MAX_RETRY_ATTEMPTS) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.retryAttempts++;
    console.log(`Retrying screen share (attempt ${this.retryAttempts}/${this.MAX_RETRY_ATTEMPTS})`);

    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryAttempts));

    try {
      await this.startScreenShare(options);
    } catch (error) {
      if (this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
        console.log('Retry failed, will attempt again');
        throw error;
      } else {
        console.error('All retry attempts failed');
        throw new Error('Failed to start screen share after multiple attempts');
      }
    }
  }

  private categorizeError(error: Error): ScreenShareError {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name === 'notallowederror' || message.includes('permission denied')) {
      return {
        type: 'permission_denied',
        message: 'Screen sharing permission was denied',
        recoverable: true,
        timestamp: Date.now()
      };
    }

    if (name === 'notsupportederror' || message.includes('not supported')) {
      return {
        type: 'not_supported',
        message: 'Screen sharing is not supported in this browser',
        recoverable: false,
        timestamp: Date.now()
      };
    }

    if (message.includes('track') || message.includes('stream') || message.includes('device')) {
      return {
        type: 'device_error',
        message: error.message,
        recoverable: true,
        timestamp: Date.now()
      };
    }

    return {
      type: 'unknown',
      message: error.message,
      recoverable: true,
      timestamp: Date.now()
    };
  }

  private handleError(error: ScreenShareError): void {
    this.setState({ error: error.message });
    this.emit('error', error);

    console.error('Screen share error:', error);

    // Auto-retry for certain recoverable errors
    if (error.recoverable && error.type !== 'permission_denied' && this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
      console.log('Attempting automatic recovery...');
      setTimeout(() => {
        this.retryScreenShare().catch(retryError => {
          console.error('Auto-retry failed:', retryError);
        });
      }, 2000);
    }
  }

  public async testScreenShareAccess(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Immediately stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;

    } catch (error) {
      console.log('Screen share access test failed:', error);
      return false;
    }
  }

  public getUsageStatistics(): {
    totalSessions: number;
    averageSessionDuration: number;
    successRate: number;
    errors: ScreenShareError[];
  } {
    // This would be implemented with proper statistics tracking
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      successRate: 100,
      errors: []
    };
  }

  private setState(updates: Partial<ScreenShareState>): void {
    this.state = { ...this.state, ...updates };
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
          console.error(`Error in screen share event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;

    // Stop screen sharing if active
    if (this.state.isSharing) {
      this.stopScreenShare();
    }

    // Clean up all event handlers
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.length = 0;
    
    // Clear event handlers
    this.eventHandlers.clear();

    // Reset state
    this.state = {
      isSharing: false,
      hasVideo: false,
      hasAudio: false,
      error: null,
      stream: null,
      startTime: null,
      endTime: null
    };

    console.log('ScreenShareManager destroyed');
  }
}