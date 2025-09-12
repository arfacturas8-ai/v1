/**
 * APP STATE SERVICE
 * Handles app state changes (foreground/background) with comprehensive error handling
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';

export interface AppStateData {
  currentState: AppStateStatus;
  previousState: AppStateStatus;
  timestamp: number;
  sessionId: string;
  backgroundTime?: number;
  foregroundTime?: number;
  totalBackgroundTime: number;
  totalForegroundTime: number;
  transitionCount: number;
}

export interface AppStateEvent {
  type: 'background' | 'foreground' | 'inactive';
  timestamp: number;
  previousState: AppStateStatus;
  currentState: AppStateStatus;
  duration?: number;
}

export type AppStateListener = (event: AppStateEvent) => void;
export type StateChangeListener = (state: AppStateData) => void;

class AppStateService {
  private static instance: AppStateService;
  private isInitialized = false;
  private currentData: AppStateData;
  private listeners: AppStateListener[] = [];
  private stateChangeListeners: StateChangeListener[] = [];
  private appStateSubscription: any = null;
  private sessionStartTime = Date.now();
  private lastStateChangeTime = Date.now();
  private backgroundStartTime: number | null = null;
  private foregroundStartTime: number | null = null;
  private stateHistory: AppStateEvent[] = [];
  private maxHistoryEntries = 100;

  private readonly STORAGE_KEY = '@cryb_app_state';
  private readonly SESSION_KEY = '@cryb_session';
  private readonly HISTORY_KEY = '@cryb_state_history';

  static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  constructor() {
    this.currentData = {
      currentState: AppState.currentState,
      previousState: 'unknown' as AppStateStatus,
      timestamp: Date.now(),
      sessionId: this.generateSessionId(),
      totalBackgroundTime: 0,
      totalForegroundTime: 0,
      transitionCount: 0,
    };
  }

  async initialize(): Promise<void> {
    try {
      // Load previous state data
      await this.loadStateData();

      // Load state history
      await this.loadStateHistory();

      // Set up app state listener
      this.setupAppStateListener();

      // Track initial state
      await this.handleInitialState();

      // Set up periodic state saving
      this.setupPeriodicSave();

      // Set up session tracking
      await this.initializeSession();

      this.isInitialized = true;
      console.log('[AppStateService] Initialized successfully');

    } catch (error) {
      console.error('[AppStateService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeAppState' },
        'high'
      );

      throw error;
    }
  }

  private setupAppStateListener(): void {
    try {
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        this.handleAppStateChange(nextAppState);
      });

    } catch (error) {
      console.error('[AppStateService] Setup listener error:', error);
    }
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      const now = Date.now();
      const previousState = this.currentData.currentState;
      const duration = now - this.lastStateChangeTime;

      // Update timing data
      if (previousState === 'background' && this.backgroundStartTime) {
        this.currentData.totalBackgroundTime += now - this.backgroundStartTime;
        this.backgroundStartTime = null;
      } else if (previousState === 'active' && this.foregroundStartTime) {
        this.currentData.totalForegroundTime += now - this.foregroundStartTime;
        this.foregroundStartTime = null;
      }

      // Set new timing start
      if (nextAppState === 'background') {
        this.backgroundStartTime = now;
      } else if (nextAppState === 'active') {
        this.foregroundStartTime = now;
      }

      // Create state event
      const event: AppStateEvent = {
        type: this.getEventType(nextAppState),
        timestamp: now,
        previousState,
        currentState: nextAppState,
        duration,
      };

      // Update current data
      this.currentData = {
        ...this.currentData,
        previousState,
        currentState: nextAppState,
        timestamp: now,
        backgroundTime: this.backgroundStartTime || undefined,
        foregroundTime: this.foregroundStartTime || undefined,
        transitionCount: this.currentData.transitionCount + 1,
      };

      // Add to history
      this.addToHistory(event);

      // Save state
      await this.saveStateData();

      // Handle specific state changes
      await this.handleSpecificStateChange(nextAppState, previousState);

      // Notify listeners
      this.notifyListeners(event);
      this.notifyStateChangeListeners(this.currentData);

      // Update last change time
      this.lastStateChangeTime = now;

      console.log(`[AppStateService] State changed: ${previousState} -> ${nextAppState}`);

    } catch (error) {
      console.error('[AppStateService] Handle state change error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { 
          action: 'handleAppStateChange',
          nextState: nextAppState,
          previousState: this.currentData.currentState,
        },
        'medium'
      );
    }
  }

  private getEventType(appState: AppStateStatus): AppStateEvent['type'] {
    switch (appState) {
      case 'background':
        return 'background';
      case 'active':
        return 'foreground';
      case 'inactive':
        return 'inactive';
      default:
        return 'foreground';
    }
  }

  private async handleSpecificStateChange(
    nextState: AppStateStatus,
    previousState: AppStateStatus
  ): Promise<void> {
    try {
      if (nextState === 'background' && previousState === 'active') {
        await this.handleGoingToBackground();
      } else if (nextState === 'active' && previousState === 'background') {
        await this.handleComingToForeground();
      } else if (nextState === 'inactive') {
        await this.handleBecomeInactive();
      }

    } catch (error) {
      console.error('[AppStateService] Handle specific state change error:', error);
    }
  }

  private async handleGoingToBackground(): Promise<void> {
    try {
      console.log('[AppStateService] App going to background');

      // Save critical data
      await this.saveStateData();

      // Pause non-critical operations
      // This could integrate with other services
      // e.g., pause video, reduce network requests, etc.

      // Track background entry
      await AsyncStorage.setItem('@cryb_background_entry', Date.now().toString());

    } catch (error) {
      console.error('[AppStateService] Handle going to background error:', error);
    }
  }

  private async handleComingToForeground(): Promise<void> {
    try {
      console.log('[AppStateService] App coming to foreground');

      // Check how long we were in background
      const backgroundEntry = await AsyncStorage.getItem('@cryb_background_entry');
      if (backgroundEntry) {
        const backgroundDuration = Date.now() - parseInt(backgroundEntry);
        
        if (backgroundDuration > 5 * 60 * 1000) { // 5 minutes
          console.log('[AppStateService] App was in background for extended period');
          
          // Refresh critical data
          await this.handleExtendedBackground(backgroundDuration);
        }
      }

      // Resume operations
      // This could integrate with other services
      // e.g., resume video, refresh data, reconnect sockets, etc.

    } catch (error) {
      console.error('[AppStateService] Handle coming to foreground error:', error);
    }
  }

  private async handleBecomeInactive(): Promise<void> {
    try {
      console.log('[AppStateService] App became inactive');

      // Save current state quickly
      await this.saveStateData();

      // Pause time-sensitive operations
      // This is useful for handling phone calls, notifications overlay, etc.

    } catch (error) {
      console.error('[AppStateService] Handle become inactive error:', error);
    }
  }

  private async handleExtendedBackground(duration: number): Promise<void> {
    try {
      console.log(`[AppStateService] Extended background duration: ${duration}ms`);

      // This could trigger:
      // - Data refresh
      // - Socket reconnection
      // - Cache validation
      // - User session validation
      
      // Add breadcrumb for crash reporting
      const breadcrumb = {
        message: 'Extended background period detected',
        category: 'app_state',
        level: 'info' as const,
        data: { duration },
      };

      // This would integrate with crash reporting
      // CrashReportingService.addBreadcrumb(breadcrumb);

    } catch (error) {
      console.error('[AppStateService] Handle extended background error:', error);
    }
  }

  private async handleInitialState(): Promise<void> {
    try {
      const initialEvent: AppStateEvent = {
        type: this.getEventType(AppState.currentState),
        timestamp: Date.now(),
        previousState: 'unknown' as AppStateStatus,
        currentState: AppState.currentState,
      };

      this.addToHistory(initialEvent);
      
      if (AppState.currentState === 'active') {
        this.foregroundStartTime = Date.now();
      } else if (AppState.currentState === 'background') {
        this.backgroundStartTime = Date.now();
      }

      await this.saveStateData();

    } catch (error) {
      console.error('[AppStateService] Handle initial state error:', error);
    }
  }

  private async initializeSession(): Promise<void> {
    try {
      const sessionData = {
        id: this.currentData.sessionId,
        startTime: this.sessionStartTime,
        appVersion: '1.0.0', // This would be dynamic
        platform: 'mobile',
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));

    } catch (error) {
      console.error('[AppStateService] Initialize session error:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(event: AppStateEvent): void {
    try {
      this.stateHistory.push(event);

      // Keep only recent history
      if (this.stateHistory.length > this.maxHistoryEntries) {
        this.stateHistory = this.stateHistory.slice(-this.maxHistoryEntries);
      }

    } catch (error) {
      console.error('[AppStateService] Add to history error:', error);
    }
  }

  private setupPeriodicSave(): void {
    // Save state every 30 seconds when active
    setInterval(async () => {
      try {
        if (this.currentData.currentState === 'active') {
          await this.saveStateData();
        }
      } catch (error) {
        console.error('[AppStateService] Periodic save error:', error);
      }
    }, 30000);
  }

  private async saveStateData(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentData));
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.stateHistory));

    } catch (error) {
      console.error('[AppStateService] Save state data error:', error);
    }
  }

  private async loadStateData(): Promise<void> {
    try {
      const savedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Merge with current data, keeping new session info
        this.currentData = {
          ...parsedData,
          sessionId: this.currentData.sessionId,
          currentState: AppState.currentState,
          timestamp: Date.now(),
        };
      }

    } catch (error) {
      console.error('[AppStateService] Load state data error:', error);
    }
  }

  private async loadStateHistory(): Promise<void> {
    try {
      const savedHistory = await AsyncStorage.getItem(this.HISTORY_KEY);
      
      if (savedHistory) {
        this.stateHistory = JSON.parse(savedHistory);
      }

    } catch (error) {
      console.error('[AppStateService] Load state history error:', error);
    }
  }

  private notifyListeners(event: AppStateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[AppStateService] Listener error:', error);
      }
    });
  }

  private notifyStateChangeListeners(data: AppStateData): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[AppStateService] State change listener error:', error);
      }
    });
  }

  // Public methods
  getCurrentState(): AppStateData {
    return { ...this.currentData };
  }

  getCurrentAppState(): AppStateStatus {
    return this.currentData.currentState;
  }

  isInBackground(): boolean {
    return this.currentData.currentState === 'background';
  }

  isInForeground(): boolean {
    return this.currentData.currentState === 'active';
  }

  isInactive(): boolean {
    return this.currentData.currentState === 'inactive';
  }

  getSessionId(): string {
    return this.currentData.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  getBackgroundTime(): number {
    let totalTime = this.currentData.totalBackgroundTime;
    
    if (this.backgroundStartTime) {
      totalTime += Date.now() - this.backgroundStartTime;
    }
    
    return totalTime;
  }

  getForegroundTime(): number {
    let totalTime = this.currentData.totalForegroundTime;
    
    if (this.foregroundStartTime) {
      totalTime += Date.now() - this.foregroundStartTime;
    }
    
    return totalTime;
  }

  getStateHistory(): AppStateEvent[] {
    return [...this.stateHistory];
  }

  getRecentStateChanges(count = 10): AppStateEvent[] {
    return this.stateHistory.slice(-count);
  }

  // Listeners
  addListener(listener: AppStateListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  addStateChangeListener(listener: StateChangeListener): () => void {
    this.stateChangeListeners.push(listener);
    
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  // Statistics
  getStatistics() {
    const totalTime = this.getSessionDuration();
    const backgroundTime = this.getBackgroundTime();
    const foregroundTime = this.getForegroundTime();

    return {
      sessionDuration: totalTime,
      backgroundTime,
      foregroundTime,
      backgroundPercentage: totalTime > 0 ? (backgroundTime / totalTime) * 100 : 0,
      foregroundPercentage: totalTime > 0 ? (foregroundTime / totalTime) * 100 : 0,
      transitionCount: this.currentData.transitionCount,
      averageSessionLength: totalTime / Math.max(this.currentData.transitionCount, 1),
    };
  }

  // Utilities
  async clearHistory(): Promise<void> {
    try {
      this.stateHistory = [];
      await AsyncStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      console.error('[AppStateService] Clear history error:', error);
    }
  }

  async reset(): Promise<void> {
    try {
      this.currentData = {
        currentState: AppState.currentState,
        previousState: 'unknown' as AppStateStatus,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
        totalBackgroundTime: 0,
        totalForegroundTime: 0,
        transitionCount: 0,
      };

      this.stateHistory = [];
      this.sessionStartTime = Date.now();

      await this.saveStateData();
      
    } catch (error) {
      console.error('[AppStateService] Reset error:', error);
    }
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  cleanup(): void {
    try {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      this.listeners = [];
      this.stateChangeListeners = [];
      this.isInitialized = false;

      console.log('[AppStateService] Cleaned up successfully');

    } catch (error) {
      console.error('[AppStateService] Cleanup error:', error);
    }
  }
}

export const AppStateService = AppStateService.getInstance();