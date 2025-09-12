import { connectionManager } from './ConnectionManager';
import { walletConnectionManager } from './WalletConnectionManager';
import { siweAuthManager } from './SiweAuthManager';

export interface SessionData {
  sessionId: string;
  walletAddress: string;
  chainId: number;
  providerId: string;
  siweSession?: any;
  isAuthenticated: boolean;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  metadata?: {
    userAgent: string;
    ipAddress?: string;
    location?: string;
    deviceInfo?: any;
  };
}

export interface SessionConfig {
  maxSessions: number;
  sessionTimeout: number;
  inactivityTimeout: number;
  autoCleanupInterval: number;
  enableReconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  enableSessionPersistence: boolean;
  enableDeviceFingerprinting: boolean;
}

export interface ReconnectionStrategy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableJitter: boolean;
}

export interface SessionEvent {
  type: 'created' | 'restored' | 'updated' | 'expired' | 'invalidated' | 'reconnected' | 'failed';
  sessionId: string;
  timestamp: number;
  details?: any;
}

export class CrashSafeSessionManager {
  private activeSessions = new Map<string, SessionData>();
  private sessionsByAddress = new Map<string, SessionData>();
  private sessionEvents: SessionEvent[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  private reconnectionTimers = new Map<string, NodeJS.Timeout>();
  private reconnectionAttempts = new Map<string, number>();
  private logger = console;

  private readonly config: SessionConfig = {
    maxSessions: 10,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours
    autoCleanupInterval: 5 * 60 * 1000, // 5 minutes
    enableReconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 5000,
    enableSessionPersistence: true,
    enableDeviceFingerprinting: false
  };

  private readonly reconnectionStrategy: ReconnectionStrategy = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableJitter: true
  };

  constructor(config?: Partial<SessionConfig>) {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  private initialize(): void {
    // Load persisted sessions
    if (this.config.enableSessionPersistence) {
      this.loadPersistedSessions();
    }

    // Start cleanup timer
    this.startCleanupTimer();

    // Set up wallet event listeners
    this.setupWalletListeners();

    // Set up visibility change listener for reconnection
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Set up connection monitoring
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private setupWalletListeners(): void {
    walletConnectionManager.on('connect', this.handleWalletConnect);
    walletConnectionManager.on('disconnect', this.handleWalletDisconnect);
    walletConnectionManager.on('accountChanged', this.handleAccountChanged);
    walletConnectionManager.on('chainChanged', this.handleChainChanged);
  }

  private handleWalletConnect = async (event: any) => {
    try {
      await this.createSession(event.account, event.chainId, event.providerId);
    } catch (error) {
      this.logger.error('Failed to create session on wallet connect:', error);
    }
  };

  private handleWalletDisconnect = () => {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      this.invalidateSession(currentSession.sessionId, 'wallet_disconnected');
    }
  };

  private handleAccountChanged = async (event: any) => {
    const currentSession = this.getCurrentSession();
    if (currentSession && event.account !== currentSession.walletAddress) {
      // Account changed, invalidate old session and create new one
      this.invalidateSession(currentSession.sessionId, 'account_changed');
      
      if (event.account) {
        const chainId = walletConnectionManager.getChainId() || 1;
        const providerId = walletConnectionManager.getProvider()?.id || 'unknown';
        await this.createSession(event.account, chainId, providerId);
      }
    }
  };

  private handleChainChanged = (event: any) => {
    const currentSession = this.getCurrentSession();
    if (currentSession && event.chainId !== currentSession.chainId) {
      this.updateSessionActivity(currentSession.sessionId, {
        chainId: event.chainId
      });
    }
  };

  private handleVisibilityChange = async () => {
    if (!document.hidden && this.config.enableReconnection) {
      // Page became visible, check if we need to reconnect
      const currentSession = this.getCurrentSession();
      if (currentSession && !walletConnectionManager.isConnected()) {
        await this.attemptReconnection(currentSession);
      }
    }
  };

  private handleOnline = async () => {
    if (this.config.enableReconnection) {
      const currentSession = this.getCurrentSession();
      if (currentSession) {
        await this.attemptReconnection(currentSession);
      }
    }
  };

  private handleOffline = () => {
    this.logger.warn('Network went offline');
    this.addSessionEvent('failed', '', { reason: 'network_offline' });
  };

  public async createSession(
    walletAddress: string,
    chainId: number,
    providerId: string,
    options?: {
      skipSiweAuth?: boolean;
      metadata?: any;
    }
  ): Promise<SessionData> {
    try {
      // Clean up any existing sessions for this address
      const existingSession = this.sessionsByAddress.get(walletAddress.toLowerCase());
      if (existingSession) {
        this.invalidateSession(existingSession.sessionId, 'replaced');
      }

      // Generate session ID
      const sessionId = this.generateSessionId();
      const now = Date.now();

      // Create session data
      const sessionData: SessionData = {
        sessionId,
        walletAddress: walletAddress.toLowerCase(),
        chainId,
        providerId,
        isAuthenticated: false,
        createdAt: now,
        lastActivity: now,
        expiresAt: now + this.config.sessionTimeout,
        metadata: await this.gatherMetadata()
      };

      // Perform SIWE authentication if enabled
      if (!options?.skipSiweAuth) {
        try {
          const nonce = siweAuthManager.generateNonce();
          const { message } = await siweAuthManager.createSiweMessage(
            walletAddress,
            chainId,
            nonce
          );

          const signature = await walletConnectionManager.signMessage(message);
          const verification = await siweAuthManager.verifySiweMessage(message, signature);

          if (verification.success) {
            sessionData.siweSession = verification.session;
            sessionData.isAuthenticated = true;
          }
        } catch (siweError) {
          this.logger.warn('SIWE authentication failed during session creation:', siweError);
          // Continue without SIWE auth
        }
      }

      // Store session
      this.activeSessions.set(sessionId, sessionData);
      this.sessionsByAddress.set(walletAddress.toLowerCase(), sessionData);

      // Persist session
      if (this.config.enableSessionPersistence) {
        this.persistSession(sessionData);
      }

      // Add event
      this.addSessionEvent('created', sessionId, {
        walletAddress,
        chainId,
        providerId,
        isAuthenticated: sessionData.isAuthenticated
      });

      // Clean up old sessions
      this.cleanupExpiredSessions();

      this.logger.info(`Session created: ${sessionId}`);
      return sessionData;
    } catch (error: any) {
      this.logger.error('Failed to create session:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  public getCurrentSession(): SessionData | null {
    // Get the most recently active session
    let mostRecent: SessionData | null = null;
    
    for (const session of this.activeSessions.values()) {
      if (!mostRecent || session.lastActivity > mostRecent.lastActivity) {
        mostRecent = session;
      }
    }

    return mostRecent;
  }

  public getSession(sessionId: string): SessionData | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      this.invalidateSession(sessionId, 'expired');
      return null;
    }

    return session;
  }

  public getSessionByAddress(address: string): SessionData | null {
    const session = this.sessionsByAddress.get(address.toLowerCase());
    if (!session) return null;

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      this.invalidateSession(session.sessionId, 'expired');
      return null;
    }

    return session;
  }

  public updateSessionActivity(
    sessionId: string,
    updates?: Partial<Pick<SessionData, 'chainId' | 'providerId'>>
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Update last activity
    session.lastActivity = Date.now();

    // Apply updates
    if (updates) {
      Object.assign(session, updates);
    }

    // Extend expiration
    session.expiresAt = Date.now() + this.config.sessionTimeout;

    // Persist changes
    if (this.config.enableSessionPersistence) {
      this.persistSession(session);
    }

    this.addSessionEvent('updated', sessionId, updates);
    return true;
  }

  public invalidateSession(sessionId: string, reason?: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    this.sessionsByAddress.delete(session.walletAddress);

    // Cancel any reconnection attempts
    const reconnectionTimer = this.reconnectionTimers.get(sessionId);
    if (reconnectionTimer) {
      clearTimeout(reconnectionTimer);
      this.reconnectionTimers.delete(sessionId);
      this.reconnectionAttempts.delete(sessionId);
    }

    // Remove from persistent storage
    if (this.config.enableSessionPersistence) {
      this.removePersistedSession(sessionId);
    }

    this.addSessionEvent('invalidated', sessionId, { reason });
    this.logger.info(`Session invalidated: ${sessionId}, reason: ${reason || 'manual'}`);
    
    return true;
  }

  public async attemptReconnection(session: SessionData): Promise<boolean> {
    const sessionId = session.sessionId;
    
    // Check if we've exceeded max attempts
    const attempts = this.reconnectionAttempts.get(sessionId) || 0;
    if (attempts >= this.reconnectionStrategy.maxAttempts) {
      this.logger.warn(`Max reconnection attempts exceeded for session ${sessionId}`);
      this.invalidateSession(sessionId, 'max_reconnection_attempts_exceeded');
      return false;
    }

    // Check if already attempting reconnection
    if (this.reconnectionTimers.has(sessionId)) {
      return false;
    }

    try {
      this.logger.info(`Attempting reconnection for session ${sessionId}, attempt ${attempts + 1}`);
      
      // Try to reconnect wallet
      const result = await walletConnectionManager.connectWallet(session.providerId, { force: false });
      
      if (result.success && result.accounts.includes(session.walletAddress)) {
        // Reconnection successful
        this.updateSessionActivity(sessionId, {
          chainId: result.chainId
        });
        
        this.reconnectionAttempts.delete(sessionId);
        this.addSessionEvent('reconnected', sessionId, {
          attempts: attempts + 1,
          chainId: result.chainId
        });
        
        this.logger.info(`Reconnection successful for session ${sessionId}`);
        return true;
      } else {
        throw new Error('Wallet connection failed or account mismatch');
      }
    } catch (error: any) {
      this.logger.warn(`Reconnection attempt ${attempts + 1} failed for session ${sessionId}:`, error);
      
      // Schedule next attempt with exponential backoff
      const nextAttempts = attempts + 1;
      this.reconnectionAttempts.set(sessionId, nextAttempts);
      
      if (nextAttempts < this.reconnectionStrategy.maxAttempts) {
        const delay = this.calculateReconnectionDelay(nextAttempts);
        
        const timer = setTimeout(async () => {
          this.reconnectionTimers.delete(sessionId);
          await this.attemptReconnection(session);
        }, delay);
        
        this.reconnectionTimers.set(sessionId, timer);
      } else {
        this.invalidateSession(sessionId, 'reconnection_failed');
      }
      
      return false;
    }
  }

  private calculateReconnectionDelay(attempt: number): number {
    const { baseDelay, maxDelay, backoffMultiplier, enableJitter } = this.reconnectionStrategy;
    
    let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
    
    if (enableJitter) {
      // Add up to 25% jitter to prevent thundering herd
      const jitter = delay * 0.25 * Math.random();
      delay += jitter;
    }
    
    return Math.floor(delay);
  }

  private isSessionExpired(session: SessionData): boolean {
    const now = Date.now();
    
    // Check absolute expiration
    if (now > session.expiresAt) {
      return true;
    }
    
    // Check inactivity timeout
    if (now - session.lastActivity > this.config.inactivityTimeout) {
      return true;
    }
    
    return false;
  }

  private cleanupExpiredSessions(): void {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.activeSessions) {
      if (this.isSessionExpired(session)) {
        expiredSessions.push(sessionId);
      }
    }
    
    for (const sessionId of expiredSessions) {
      this.invalidateSession(sessionId, 'expired');
    }

    // Limit total number of sessions
    if (this.activeSessions.size > this.config.maxSessions) {
      const sortedSessions = Array.from(this.activeSessions.values())
        .sort((a, b) => a.lastActivity - b.lastActivity);
      
      const toRemove = sortedSessions.slice(0, this.activeSessions.size - this.config.maxSessions);
      for (const session of toRemove) {
        this.invalidateSession(session.sessionId, 'session_limit_exceeded');
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupSessionEvents();
    }, this.config.autoCleanupInterval);
  }

  private cleanupSessionEvents(): void {
    // Keep only last 100 events
    if (this.sessionEvents.length > 100) {
      this.sessionEvents = this.sessionEvents.slice(-100);
    }
  }

  private loadPersistedSessions(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const keys = Object.keys(localStorage).filter(key => key.startsWith('cryb_session_'));
      
      for (const key of keys) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(key) || '');
          
          // Validate session data
          if (this.validateSessionData(sessionData) && !this.isSessionExpired(sessionData)) {
            this.activeSessions.set(sessionData.sessionId, sessionData);
            this.sessionsByAddress.set(sessionData.walletAddress, sessionData);
            
            this.addSessionEvent('restored', sessionData.sessionId, {
              walletAddress: sessionData.walletAddress,
              chainId: sessionData.chainId
            });
            
            // Attempt reconnection if enabled
            if (this.config.enableReconnection) {
              setTimeout(() => {
                this.attemptReconnection(sessionData);
              }, 1000);
            }
          } else {
            // Remove invalid/expired session
            localStorage.removeItem(key);
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse persisted session ${key}:`, parseError);
          localStorage.removeItem(key);
        }
      }
      
      this.logger.info(`Loaded ${this.activeSessions.size} persisted sessions`);
    } catch (error) {
      this.logger.error('Failed to load persisted sessions:', error);
    }
  }

  private persistSession(session: SessionData): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `cryb_session_${session.sessionId}`;
        localStorage.setItem(key, JSON.stringify(session));
      }
    } catch (error) {
      this.logger.warn('Failed to persist session:', error);
    }
  }

  private removePersistedSession(sessionId: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `cryb_session_${sessionId}`;
        localStorage.removeItem(key);
      }
    } catch (error) {
      this.logger.warn('Failed to remove persisted session:', error);
    }
  }

  private validateSessionData(data: any): data is SessionData {
    return (
      typeof data === 'object' &&
      typeof data.sessionId === 'string' &&
      typeof data.walletAddress === 'string' &&
      typeof data.chainId === 'number' &&
      typeof data.providerId === 'string' &&
      typeof data.createdAt === 'number' &&
      typeof data.lastActivity === 'number' &&
      typeof data.expiresAt === 'number'
    );
  }

  private async gatherMetadata(): Promise<any> {
    if (!this.config.enableDeviceFingerprinting) {
      return {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: Date.now()
      };
    }

    try {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return {
        userAgent: 'unknown',
        error: error?.message || 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private addSessionEvent(type: SessionEvent['type'], sessionId: string, details?: any): void {
    this.sessionEvents.push({
      type,
      sessionId,
      timestamp: Date.now(),
      details
    });
  }

  // Public getters and utilities
  public getAllSessions(): SessionData[] {
    return Array.from(this.activeSessions.values());
  }

  public getSessionStats(): {
    totalSessions: number;
    authenticatedSessions: number;
    averageSessionDuration: number;
    reconnectionAttempts: number;
  } {
    const sessions = this.getAllSessions();
    const now = Date.now();
    
    return {
      totalSessions: sessions.length,
      authenticatedSessions: sessions.filter(s => s.isAuthenticated).length,
      averageSessionDuration: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (now - s.createdAt), 0) / sessions.length 
        : 0,
      reconnectionAttempts: Array.from(this.reconnectionAttempts.values()).reduce((sum, attempts) => sum + attempts, 0)
    };
  }

  public getSessionEvents(limit = 50): SessionEvent[] {
    return this.sessionEvents.slice(-limit);
  }

  public isSessionActive(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    return session !== null;
  }

  public refreshSession(sessionId: string): boolean {
    return this.updateSessionActivity(sessionId);
  }

  public cleanup(): void {
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    for (const timer of this.reconnectionTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectionTimers.clear();

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    // Clear data
    this.activeSessions.clear();
    this.sessionsByAddress.clear();
    this.reconnectionAttempts.clear();
    this.sessionEvents.length = 0;
  }
}

// Export singleton instance
export const sessionManager = new CrashSafeSessionManager();