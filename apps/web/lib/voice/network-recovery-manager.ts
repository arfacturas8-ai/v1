export interface ConnectionState {
  channelId: string;
  userId: string;
  settings: {
    muted: boolean;
    deafened: boolean;
    videoEnabled: boolean;
    screenSharing: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
  };
  participants: Map<string, any>;
  joinedAt: number;
  lastHeartbeat: number;
}

export interface RecoveryAttempt {
  attempt: number;
  timestamp: number;
  method: 'auto' | 'manual' | 'fallback';
  success: boolean;
  error?: string;
  duration?: number;
}

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  lastChange: number;
}

export class NetworkRecoveryManager {
  private connectionState: ConnectionState | null = null;
  private recoveryAttempts: RecoveryAttempt[] = [];
  private networkStatus: NetworkStatus = {
    online: navigator.onLine,
    lastChange: Date.now()
  };
  
  private recoveryTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private stateBackupTimer: NodeJS.Timeout | null = null;
  
  private readonly MAX_RECOVERY_ATTEMPTS = 10;
  private readonly RECOVERY_BASE_DELAY = 2000; // 2 seconds
  private readonly RECOVERY_MAX_DELAY = 60000; // 1 minute
  private readonly HEARTBEAT_INTERVAL = 15000; // 15 seconds
  private readonly STATE_BACKUP_INTERVAL = 5000; // 5 seconds
  
  private callbacks: {
    onRecoveryStarted?: () => void;
    onRecoveryProgress?: (attempt: RecoveryAttempt) => void;
    onRecoverySuccess?: () => void;
    onRecoveryFailed?: (attempts: RecoveryAttempt[]) => void;
    onNetworkStatusChange?: (status: NetworkStatus) => void;
    onStateRestored?: (state: ConnectionState) => void;
  } = {};
  
  private voiceManager: any = null;
  private isRecovering = false;
  private isDestroyed = false;

  constructor() {
    this.setupNetworkListeners();
    this.startHeartbeat();
    this.startStateBackup();
    this.loadPersistedState();
  }

  private setupNetworkListeners(): void {
    // Online/Offline events
    window.addEventListener('online', () => {
      this.handleNetworkChange({ online: true });
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange({ online: false });
    });

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        this.handleNetworkChange({
          online: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };
      
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo(); // Initial check
    }

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.connectionState) {
        // Page became visible again, check connection health
        this.checkConnectionHealth();
      }
    });
  }

  private handleNetworkChange(changes: Partial<NetworkStatus>): void {
    const wasOnline = this.networkStatus.online;
    
    this.networkStatus = {
      ...this.networkStatus,
      ...changes,
      lastChange: Date.now()
    };

    console.log('Network status changed:', this.networkStatus);
    this.callbacks.onNetworkStatusChange?.(this.networkStatus);

    // Handle network reconnection
    if (!wasOnline && this.networkStatus.online && this.connectionState) {
      console.log('Network came back online, starting recovery...');
      this.startRecovery('auto');
    }

    // Handle network disconnection
    if (wasOnline && !this.networkStatus.online && this.connectionState) {
      console.log('Network went offline, preparing for recovery...');
      this.prepareForRecovery();
    }
  }

  public setVoiceManager(manager: any): void {
    this.voiceManager = manager;
  }

  public saveConnectionState(state: ConnectionState): void {
    this.connectionState = { ...state };
    this.persistState();
    console.log('Connection state saved:', state.channelId);
  }

  public clearConnectionState(): void {
    this.connectionState = null;
    this.clearPersistedState();
    console.log('Connection state cleared');
  }

  private persistState(): void {
    if (!this.connectionState) return;

    try {
      const stateToSave = {
        ...this.connectionState,
        participants: Array.from(this.connectionState.participants.entries())
      };
      
      localStorage.setItem('voice_connection_state', JSON.stringify(stateToSave));
      localStorage.setItem('voice_state_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Failed to persist voice state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const stateData = localStorage.getItem('voice_connection_state');
      const timestamp = localStorage.getItem('voice_state_timestamp');
      
      if (!stateData || !timestamp) return;
      
      const age = Date.now() - parseInt(timestamp);
      if (age > 30 * 60 * 1000) { // 30 minutes
        console.log('Persisted state too old, discarding');
        this.clearPersistedState();
        return;
      }
      
      const parsedState = JSON.parse(stateData);
      this.connectionState = {
        ...parsedState,
        participants: new Map(parsedState.participants || [])
      };
      
      console.log('Loaded persisted voice state:', this.connectionState.channelId);
      
      // If we have a persisted state and we're online, attempt recovery
      if (this.networkStatus.online) {
        setTimeout(() => {
          this.startRecovery('auto');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      this.clearPersistedState();
    }
  }

  private clearPersistedState(): void {
    try {
      localStorage.removeItem('voice_connection_state');
      localStorage.removeItem('voice_state_timestamp');
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  private startStateBackup(): void {
    this.stateBackupTimer = setInterval(() => {
      if (this.connectionState) {
        this.persistState();
      }
    }, this.STATE_BACKUP_INTERVAL);
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.connectionState || !this.voiceManager) return;

    try {
      // Update last heartbeat
      this.connectionState.lastHeartbeat = Date.now();
      
      // Check if voice manager is still connected
      if (!this.voiceManager.isConnected()) {
        console.log('Voice manager disconnected during heartbeat, starting recovery');
        this.startRecovery('auto');
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  private async checkConnectionHealth(): Promise<void> {
    if (!this.connectionState || !this.voiceManager) return;

    try {
      const isConnected = this.voiceManager.isConnected();
      const currentChannel = this.voiceManager.getCurrentChannel();
      
      if (!isConnected || currentChannel !== this.connectionState.channelId) {
        console.log('Connection health check failed, starting recovery');
        this.startRecovery('auto');
      }
    } catch (error) {
      console.error('Connection health check failed:', error);
      this.startRecovery('auto');
    }
  }

  private prepareForRecovery(): void {
    if (!this.connectionState) return;

    // Save current state with high fidelity
    this.connectionState.lastHeartbeat = Date.now();
    this.persistState();
    
    console.log('Prepared for recovery, state saved');
  }

  public startRecovery(method: 'auto' | 'manual' | 'fallback' = 'auto'): void {
    if (this.isRecovering || this.isDestroyed || !this.connectionState) {
      return;
    }

    if (!this.networkStatus.online && method !== 'fallback') {
      console.log('Cannot start recovery - network is offline');
      return;
    }

    this.isRecovering = true;
    this.callbacks.onRecoveryStarted?.();
    
    console.log(`Starting ${method} recovery for channel: ${this.connectionState.channelId}`);
    this.performRecovery(method);
  }

  private async performRecovery(method: 'auto' | 'manual' | 'fallback'): Promise<void> {
    const startTime = Date.now();
    const attemptNumber = this.recoveryAttempts.length + 1;
    
    const attempt: RecoveryAttempt = {
      attempt: attemptNumber,
      timestamp: startTime,
      method,
      success: false
    };

    try {
      this.callbacks.onRecoveryProgress?.(attempt);

      if (attemptNumber > this.MAX_RECOVERY_ATTEMPTS) {
        throw new Error('Maximum recovery attempts exceeded');
      }

      await this.executeRecovery(method);
      
      // Recovery successful
      attempt.success = true;
      attempt.duration = Date.now() - startTime;
      this.recoveryAttempts.push(attempt);
      
      this.isRecovering = false;
      this.callbacks.onRecoverySuccess?.();
      
      console.log(`Recovery successful in ${attempt.duration}ms`);
      
    } catch (error) {
      attempt.error = (error as Error).message;
      attempt.duration = Date.now() - startTime;
      this.recoveryAttempts.push(attempt);
      
      console.error(`Recovery attempt ${attemptNumber} failed:`, error);
      
      if (attemptNumber < this.MAX_RECOVERY_ATTEMPTS) {
        // Schedule next attempt with exponential backoff
        const delay = Math.min(
          this.RECOVERY_BASE_DELAY * Math.pow(2, attemptNumber - 1),
          this.RECOVERY_MAX_DELAY
        );
        
        console.log(`Scheduling next recovery attempt in ${delay}ms`);
        this.recoveryTimer = setTimeout(() => {
          this.performRecovery(method);
        }, delay);
      } else {
        // All recovery attempts failed
        this.isRecovering = false;
        this.callbacks.onRecoveryFailed?.(this.recoveryAttempts);
        console.error('All recovery attempts failed');
      }
    }
  }

  private async executeRecovery(method: 'auto' | 'manual' | 'fallback'): Promise<void> {
    if (!this.connectionState || !this.voiceManager) {
      throw new Error('No connection state or voice manager available');
    }

    switch (method) {
      case 'auto':
        await this.performAutoRecovery();
        break;
      case 'manual':
        await this.performManualRecovery();
        break;
      case 'fallback':
        await this.performFallbackRecovery();
        break;
    }
  }

  private async performAutoRecovery(): Promise<void> {
    if (!this.connectionState || !this.voiceManager) return;

    // 1. Disconnect current connection if any
    try {
      await this.voiceManager.disconnect();
    } catch (error) {
      console.warn('Failed to disconnect during recovery:', error);
    }

    // 2. Wait a moment for cleanup
    await this.sleep(1000);

    // 3. Reconnect to the same channel
    await this.voiceManager.connectToChannel(
      this.connectionState.channelId,
      {
        enableAudio: !this.connectionState.settings.muted,
        enableVideo: this.connectionState.settings.videoEnabled
      }
    );

    // 4. Restore settings
    await this.restoreConnectionSettings();
  }

  private async performManualRecovery(): Promise<void> {
    // Similar to auto recovery but with user confirmation steps
    await this.performAutoRecovery();
  }

  private async performFallbackRecovery(): Promise<void> {
    if (!this.connectionState) return;

    // Fallback to audio-only mode
    const fallbackSettings = {
      enableAudio: true,
      enableVideo: false,
      maxRetries: 3,
      retryDelay: 5000
    };

    await this.voiceManager.connectToChannel(
      this.connectionState.channelId,
      fallbackSettings
    );

    // Update connection state to reflect fallback mode
    this.connectionState.settings.videoEnabled = false;
    this.connectionState.settings.screenSharing = false;
  }

  private async restoreConnectionSettings(): Promise<void> {
    if (!this.connectionState || !this.voiceManager) return;

    const { settings } = this.connectionState;

    try {
      // Restore mute state
      if (settings.muted) {
        await this.voiceManager.disableMicrophone();
      }

      // Restore deafen state
      if (settings.deafened) {
        await this.voiceManager.toggleDeafen();
      }

      // Restore video state
      if (settings.videoEnabled) {
        await this.voiceManager.enableCamera();
      }

      // Restore screen sharing state
      if (settings.screenSharing) {
        await this.voiceManager.startScreenShare();
      }

      this.callbacks.onStateRestored?.(this.connectionState);
      
    } catch (error) {
      console.error('Failed to restore connection settings:', error);
      // Don't fail the recovery for settings restoration failures
    }
  }

  public getRecoveryAttempts(): RecoveryAttempt[] {
    return [...this.recoveryAttempts];
  }

  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  public isRecoveringNow(): boolean {
    return this.isRecovering;
  }

  public hasStoredState(): boolean {
    return this.connectionState !== null;
  }

  public forceRecovery(): void {
    this.startRecovery('manual');
  }

  public clearRecoveryHistory(): void {
    this.recoveryAttempts = [];
  }

  public onRecoveryStarted(callback: () => void): void {
    this.callbacks.onRecoveryStarted = callback;
  }

  public onRecoveryProgress(callback: (attempt: RecoveryAttempt) => void): void {
    this.callbacks.onRecoveryProgress = callback;
  }

  public onRecoverySuccess(callback: () => void): void {
    this.callbacks.onRecoverySuccess = callback;
  }

  public onRecoveryFailed(callback: (attempts: RecoveryAttempt[]) => void): void {
    this.callbacks.onRecoveryFailed = callback;
  }

  public onNetworkStatusChange(callback: (status: NetworkStatus) => void): void {
    this.callbacks.onNetworkStatusChange = callback;
  }

  public onStateRestored(callback: (state: ConnectionState) => void): void {
    this.callbacks.onStateRestored = callback;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.isRecovering = false;

    // Clear timers
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.stateBackupTimer) {
      clearInterval(this.stateBackupTimer);
      this.stateBackupTimer = null;
    }

    // Clear callbacks
    this.callbacks = {};

    // Clear state
    this.connectionState = null;
    this.recoveryAttempts = [];

    console.log('Network recovery manager destroyed');
  }
}