/**
 * Advanced Connection Recovery Manager for WebRTC Voice Communications
 * Handles complex reconnection scenarios, network transitions, and failover strategies
 */

export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
  jitterMax: number;
  healthCheckInterval: number;
  fallbackUrls: string[];
  enableFastReconnect: boolean;
  networkTransitionDelay: number;
}

export interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  avgConnectionTime: number;
  lastFailureReason: string;
  networkType: string;
  signalStrength: number;
  bandwidthEstimate: number;
}

export interface RecoveryEvents {
  recoveryStarted: (attempt: number) => void;
  recoveryFailed: (attempt: number, error: Error) => void;
  recoverySucceeded: (attempt: number, duration: number) => void;
  fallbackActivated: (url: string) => void;
  networkChanged: (type: string) => void;
  metricsUpdated: (metrics: ConnectionMetrics) => void;
}

export class ConnectionRecoveryManager {
  private config: RecoveryConfig;
  private metrics: ConnectionMetrics;
  private eventHandlers: Map<keyof RecoveryEvents, Function[]> = new Map();
  private recoveryTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private networkMonitor: any = null;
  private isRecovering = false;
  private currentAttempt = 0;
  private recoveryStartTime = 0;
  private connectionHistory: { timestamp: number; success: boolean; duration: number; error?: string }[] = [];
  
  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: 10,
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 1.5,
      jitterMax: 1000,
      healthCheckInterval: 15000,
      fallbackUrls: [],
      enableFastReconnect: true,
      networkTransitionDelay: 2000,
      ...config
    };

    this.metrics = {
      connectionAttempts: 0,
      successfulConnections: 0,
      avgConnectionTime: 0,
      lastFailureReason: '',
      networkType: this.detectNetworkType(),
      signalStrength: 1.0,
      bandwidthEstimate: 1000
    };

    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    // Monitor network connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleNetworkChange = () => {
        const newType = this.detectNetworkType();
        if (newType !== this.metrics.networkType) {
          console.log(`Network changed from ${this.metrics.networkType} to ${newType}`);
          this.metrics.networkType = newType;
          this.emit('networkChanged', newType);
          
          // Trigger reconnection if needed on significant network changes
          if (this.shouldReconnectOnNetworkChange(newType)) {
            this.handleNetworkTransition();
          }
        }
      };

      connection.addEventListener('change', handleNetworkChange);
      this.networkMonitor = () => connection.removeEventListener('change', handleNetworkChange);
    }

    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private detectNetworkType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return navigator.onLine ? 'online' : 'offline';
  }

  private shouldReconnectOnNetworkChange(newType: string): boolean {
    // Reconnect when switching from offline to online, or between different connection types
    const oldType = this.metrics.networkType;
    return oldType === 'offline' || 
           (oldType !== newType && ['slow-2g', '2g', '3g', '4g'].includes(newType));
  }

  private handleNetworkTransition(): void {
    if (this.isRecovering) return;

    console.log('Network transition detected, scheduling reconnection');
    
    // Delay reconnection to allow network to stabilize
    setTimeout(() => {
      if (!this.isRecovering) {
        this.startRecovery(0); // Reset retry count on network change
      }
    }, this.config.networkTransitionDelay);
  }

  private handleOnline(): void {
    console.log('Network connection restored');
    this.metrics.networkType = this.detectNetworkType();
    
    if (this.config.enableFastReconnect && !this.isRecovering) {
      // Fast reconnect when coming back online
      this.startRecovery(0, true);
    }
  }

  private handleOffline(): void {
    console.log('Network connection lost');
    this.metrics.networkType = 'offline';
    this.stopRecovery();
  }

  public startRecovery(initialAttempt: number = 0, fastReconnect: boolean = false): void {
    if (this.isRecovering) {
      console.log('Recovery already in progress');
      return;
    }

    this.isRecovering = true;
    this.currentAttempt = initialAttempt;
    this.recoveryStartTime = Date.now();
    
    console.log(`Starting connection recovery (fast: ${fastReconnect})`);
    this.emit('recoveryStarted', this.currentAttempt);
    
    if (fastReconnect) {
      // Immediate attempt for fast reconnect
      this.attemptRecovery();
    } else {
      this.scheduleNextAttempt();
    }
  }

  private scheduleNextAttempt(): void {
    if (this.currentAttempt >= this.config.maxRetries) {
      this.handleRecoveryExhausted();
      return;
    }

    // Calculate delay with exponential backoff and jitter
    const baseDelay = this.config.baseDelay * Math.pow(this.config.multiplier, this.currentAttempt);
    const jitter = Math.random() * this.config.jitterMax;
    const delay = Math.min(baseDelay + jitter, this.config.maxDelay);

    console.log(`Scheduling recovery attempt ${this.currentAttempt + 1} in ${Math.round(delay)}ms`);

    this.recoveryTimer = setTimeout(() => {
      this.attemptRecovery();
    }, delay);
  }

  private async attemptRecovery(): Promise<void> {
    if (!this.isRecovering) return;

    this.currentAttempt++;
    this.metrics.connectionAttempts++;
    
    const attemptStart = Date.now();
    console.log(`Attempting recovery ${this.currentAttempt}/${this.config.maxRetries}`);

    try {
      // Try fallback URLs if available
      const connectionUrl = this.selectConnectionUrl();
      
      // Perform the actual connection attempt (this would be implemented by the calling code)
      await this.performConnectionAttempt(connectionUrl);
      
      // Success!
      const duration = Date.now() - attemptStart;
      this.handleRecoverySuccess(duration);
      
    } catch (error) {
      const duration = Date.now() - attemptStart;
      this.handleRecoveryFailure(error as Error, duration);
    }
  }

  private selectConnectionUrl(): string {
    if (this.config.fallbackUrls.length === 0) {
      return ''; // Use default URL
    }

    // Use round-robin for fallback URLs after initial failures
    if (this.currentAttempt > 2) {
      const index = (this.currentAttempt - 3) % this.config.fallbackUrls.length;
      const fallbackUrl = this.config.fallbackUrls[index];
      console.log(`Using fallback URL: ${fallbackUrl}`);
      this.emit('fallbackActivated', fallbackUrl);
      return fallbackUrl;
    }

    return ''; // Use primary URL for first few attempts
  }

  private async performConnectionAttempt(url: string): Promise<void> {
    // This method should be overridden or passed as a callback
    // For now, we'll simulate the connection attempt
    throw new Error('performConnectionAttempt must be implemented');
  }

  private handleRecoverySuccess(duration: number): void {
    console.log(`Recovery succeeded after ${this.currentAttempt} attempts in ${duration}ms`);
    
    this.metrics.successfulConnections++;
    this.updateAverageConnectionTime(duration);
    
    this.connectionHistory.push({
      timestamp: Date.now(),
      success: true,
      duration
    });

    this.emit('recoverySucceeded', this.currentAttempt, duration);
    this.emit('metricsUpdated', this.getMetrics());
    
    this.resetRecovery();
  }

  private handleRecoveryFailure(error: Error, duration: number): void {
    console.error(`Recovery attempt ${this.currentAttempt} failed:`, error.message);
    
    this.metrics.lastFailureReason = error.message;
    
    this.connectionHistory.push({
      timestamp: Date.now(),
      success: false,
      duration,
      error: error.message
    });

    this.emit('recoveryFailed', this.currentAttempt, error);
    this.emit('metricsUpdated', this.getMetrics());
    
    // Schedule next attempt
    this.scheduleNextAttempt();
  }

  private handleRecoveryExhausted(): void {
    console.error(`Recovery exhausted after ${this.config.maxRetries} attempts`);
    
    const totalDuration = Date.now() - this.recoveryStartTime;
    console.log(`Total recovery time: ${totalDuration}ms`);
    
    this.resetRecovery();
    
    // Emit final failure event
    this.emit('recoveryFailed', this.currentAttempt, new Error('Maximum retry attempts exceeded'));
  }

  private resetRecovery(): void {
    this.isRecovering = false;
    this.currentAttempt = 0;
    this.recoveryStartTime = 0;
    
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  public stopRecovery(): void {
    console.log('Stopping connection recovery');
    this.resetRecovery();
  }

  private updateAverageConnectionTime(newTime: number): void {
    const total = this.metrics.avgConnectionTime * this.metrics.successfulConnections;
    this.metrics.avgConnectionTime = (total + newTime) / (this.metrics.successfulConnections);
  }

  public updateBandwidthEstimate(bandwidthKbps: number): void {
    this.metrics.bandwidthEstimate = bandwidthKbps;
    this.emit('metricsUpdated', this.getMetrics());
  }

  public updateSignalStrength(strength: number): void {
    this.metrics.signalStrength = Math.max(0, Math.min(1, strength));
    this.emit('metricsUpdated', this.getMetrics());
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public getConnectionHistory(): typeof this.connectionHistory {
    return [...this.connectionHistory];
  }

  public isCurrentlyRecovering(): boolean {
    return this.isRecovering;
  }

  public getCurrentAttempt(): number {
    return this.currentAttempt;
  }

  // Event handling
  public on<K extends keyof RecoveryEvents>(event: K, handler: RecoveryEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof RecoveryEvents>(event: K, handler: RecoveryEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof RecoveryEvents>(event: K, ...args: Parameters<RecoveryEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in recovery manager event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.stopRecovery();
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.networkMonitor) {
      this.networkMonitor();
      this.networkMonitor = null;
    }

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    this.eventHandlers.clear();
    this.connectionHistory = [];
  }
}