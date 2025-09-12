/**
 * CRASH DETECTOR SYSTEM
 * Detects and handles crashes, JS errors, and native module failures
 */

import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import RNRestart from 'react-native-restart';
import uuid from 'react-native-uuid';

const generateUUID = () => uuid.v4() as string;

export interface CrashEvent {
  id: string;
  timestamp: number;
  type: 'js' | 'native' | 'promise' | 'network' | 'permission';
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
  appState: {
    route?: string;
    userId?: string;
    networkStatus?: string;
    [key: string]: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class CrashDetectorService {
  private crashCount = 0;
  private maxCrashesBeforeRestart = 3;
  private crashWindow = 5 * 60 * 1000; // 5 minutes
  private lastCrashTime = 0;
  private crashCallbacks: Array<(crash: CrashEvent) => void> = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.setupJSErrorHandler();
      await this.setupNativeErrorHandler();
      await this.setupUnhandledPromiseRejection();
      await this.loadCrashHistory();
      
      this.isInitialized = true;
      console.log('[CrashDetector] Initialized successfully');
    } catch (error) {
      console.error('[CrashDetector] Failed to initialize:', error);
      // Don't throw - we need the app to start even if crash detection fails
    }
  }

  private setupJSErrorHandler() {
    setJSExceptionHandler(async (error: any, isFatal: boolean) => {
      const crashEvent: CrashEvent = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'js',
        error: {
          name: error.name || 'Unknown',
          message: error.message || 'Unknown error',
          stack: error.stack,
        },
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        appState: await this.getAppState(),
        severity: isFatal ? 'critical' : 'high',
      };

      await this.handleCrash(crashEvent, isFatal);
    }, true);
  }

  private setupNativeErrorHandler() {
    setNativeExceptionHandler((exceptionString: string) => {
      const crashEvent: CrashEvent = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'native',
        error: {
          name: 'NativeException',
          message: exceptionString,
        },
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        appState: {},
        severity: 'critical',
      };

      // For native crashes, we can't use async operations
      this.storeCrashSync(crashEvent);
      this.notifyCrashCallbacks(crashEvent);
      
      // Force restart after native crash
      setTimeout(() => RNRestart.Restart(), 1000);
    }, true);
  }

  private setupUnhandledPromiseRejection() {
    const originalHandler = global.Promise?.prototype?.catch;
    
    global.addEventListener?.('unhandledrejection', async (event: any) => {
      const crashEvent: CrashEvent = {
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'promise',
        error: {
          name: 'UnhandledPromiseRejection',
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        },
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        appState: await this.getAppState(),
        severity: 'medium',
      };

      await this.handleCrash(crashEvent, false);
    });
  }

  private async handleCrash(crashEvent: CrashEvent, isFatal: boolean) {
    try {
      // Store crash data
      await this.storeCrash(crashEvent);
      
      // Notify callbacks
      this.notifyCrashCallbacks(crashEvent);
      
      // Update crash counter
      this.crashCount++;
      this.lastCrashTime = Date.now();
      
      // Check if we need to restart
      if (this.shouldRestart(isFatal)) {
        await this.performRestart();
      }
    } catch (error) {
      console.error('[CrashDetector] Error handling crash:', error);
    }
  }

  private shouldRestart(isFatal: boolean): boolean {
    if (isFatal) return true;
    
    const now = Date.now();
    const timeSinceLastCrash = now - this.lastCrashTime;
    
    // Reset counter if outside crash window
    if (timeSinceLastCrash > this.crashWindow) {
      this.crashCount = 1;
      return false;
    }
    
    return this.crashCount >= this.maxCrashesBeforeRestart;
  }

  private async performRestart() {
    try {
      // Clear any unstable state
      await this.clearVolatileData();
      
      // Show restart message
      console.warn('[CrashDetector] App is restarting due to multiple crashes');
      
      // Restart after brief delay
      setTimeout(() => RNRestart.Restart(), 2000);
    } catch (error) {
      console.error('[CrashDetector] Error during restart:', error);
      RNRestart.Restart();
    }
  }

  private async storeCrash(crash: CrashEvent) {
    try {
      const crashes = await this.getCrashes();
      crashes.push(crash);
      
      // Keep only last 50 crashes to avoid storage bloat
      const recentCrashes = crashes.slice(-50);
      
      await AsyncStorage.setItem('@cryb_crashes', JSON.stringify(recentCrashes));
    } catch (error) {
      console.error('[CrashDetector] Failed to store crash:', error);
    }
  }

  private storeCrashSync(crash: CrashEvent) {
    // Synchronous crash storage for native crashes
    try {
      // Use platform-specific sync storage if available
      if (Platform.OS === 'ios' && NativeModules.SyncStorage) {
        NativeModules.SyncStorage.setItem('@cryb_last_crash', JSON.stringify(crash));
      }
    } catch (error) {
      console.error('[CrashDetector] Failed to store crash synchronously:', error);
    }
  }

  private notifyCrashCallbacks(crash: CrashEvent) {
    this.crashCallbacks.forEach(callback => {
      try {
        callback(crash);
      } catch (error) {
        console.error('[CrashDetector] Error in crash callback:', error);
      }
    });
  }

  private async getAppState(): Promise<CrashEvent['appState']> {
    try {
      const [route, userId, networkStatus] = await Promise.all([
        AsyncStorage.getItem('@cryb_current_route'),
        AsyncStorage.getItem('@cryb_user_id'),
        AsyncStorage.getItem('@cryb_network_status'),
      ]);

      return {
        route: route || undefined,
        userId: userId || undefined,
        networkStatus: networkStatus || undefined,
      };
    } catch (error) {
      return {};
    }
  }

  private async clearVolatileData() {
    try {
      const keysToRemove = [
        '@cryb_socket_state',
        '@cryb_temp_data',
        '@cryb_media_cache',
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('[CrashDetector] Failed to clear volatile data:', error);
    }
  }

  private async loadCrashHistory() {
    try {
      const crashes = await this.getCrashes();
      const recentCrashes = crashes.filter(
        crash => Date.now() - crash.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      if (recentCrashes.length > 10) {
        console.warn(`[CrashDetector] ${recentCrashes.length} crashes in last 24 hours`);
      }
    } catch (error) {
      console.error('[CrashDetector] Failed to load crash history:', error);
    }
  }

  async getCrashes(): Promise<CrashEvent[]> {
    try {
      const crashData = await AsyncStorage.getItem('@cryb_crashes');
      return crashData ? JSON.parse(crashData) : [];
    } catch (error) {
      console.error('[CrashDetector] Failed to get crashes:', error);
      return [];
    }
  }

  async clearCrashes() {
    try {
      await AsyncStorage.removeItem('@cryb_crashes');
      this.crashCount = 0;
    } catch (error) {
      console.error('[CrashDetector] Failed to clear crashes:', error);
    }
  }

  onCrash(callback: (crash: CrashEvent) => void) {
    this.crashCallbacks.push(callback);
    
    return () => {
      const index = this.crashCallbacks.indexOf(callback);
      if (index > -1) {
        this.crashCallbacks.splice(index, 1);
      }
    };
  }

  // Manual crash reporting for caught errors
  async reportError(error: Error, context: Record<string, any> = {}, severity: CrashEvent['severity'] = 'medium') {
    const crashEvent: CrashEvent = {
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'js',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
      appState: {
        ...(await this.getAppState()),
        ...context,
      },
      severity,
    };

    await this.handleCrash(crashEvent, severity === 'critical');
  }

  // Network error reporting
  async reportNetworkError(error: any, contextInfo: string) {
    const crashEvent: CrashEvent = {
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'network',
      error: {
        name: 'NetworkError',
        message: error.message || 'Network request failed',
        stack: error.stack,
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
      appState: {
        ...(await this.getAppState()),
        context: contextInfo,
      },
      severity: 'low',
    };

    await this.storeCrash(crashEvent);
    this.notifyCrashCallbacks(crashEvent);
  }

  // Permission error reporting
  async reportPermissionError(permission: string, error: string) {
    const crashEvent: CrashEvent = {
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'permission',
      error: {
        name: 'PermissionError',
        message: `Permission denied: ${permission} - ${error}`,
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
      appState: {
        ...(await this.getAppState()),
        permission: permission,
      },
      severity: 'low',
    };

    await this.storeCrash(crashEvent);
    this.notifyCrashCallbacks(crashEvent);
  }

  getStats() {
    return {
      crashCount: this.crashCount,
      lastCrashTime: this.lastCrashTime,
      isInitialized: this.isInitialized,
    };
  }
}

export const CrashDetector = new CrashDetectorService();