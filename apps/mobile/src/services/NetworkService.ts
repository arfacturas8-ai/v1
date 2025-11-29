/**
 * CRASH-SAFE NETWORK SERVICE
 * Handles network connectivity changes with comprehensive error handling
 */

import NetInfo, { NetInfoState, NetInfoConfiguration } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
  strength: number | null;
  isWifiEnabled: boolean;
  isCellularEnabled: boolean;
  ssid: string | null;
  bssid: string | null;
  frequency: number | null;
  ipAddress: string | null;
  subnet: string | null;
  details: any;
}

export interface NetworkQuality {
  rtt: number | null;
  downlink: number | null;
  uplink: number | null;
  effectiveType: string | null;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

export type NetworkChangeListener = (state: NetworkState) => void;
export type NetworkQualityListener = (quality: NetworkQuality) => void;

class NetworkService {
  private static instance: NetworkService;
  private currentState: NetworkState | null = null;
  private currentQuality: NetworkQuality | null = null;
  private listeners: NetworkChangeListener[] = [];
  private qualityListeners: NetworkQualityListener[] = [];
  private unsubscribe: (() => void) | null = null;
  private isMonitoring = false;
  private lastConnectedTime = 0;
  private connectionHistory: { timestamp: number; connected: boolean; type: string }[] = [];
  private qualityTestInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private maxRetryAttempts = 5;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Configure NetInfo
      await this.configureNetInfo();

      // Get initial state
      const initialState = await NetInfo.fetch();
      await this.handleNetworkChange(initialState);

      // Start monitoring
      await this.startMonitoring();

      // Load connection history
      await this.loadConnectionHistory();

      // Start quality monitoring
      this.startQualityMonitoring();

      console.log('[NetworkService] Initialized successfully');

    } catch (error) {
      console.error('[NetworkService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeNetworkService' },
        'high'
      );

      throw error;
    }
  }

  private async configureNetInfo(): Promise<void> {
    try {
      const configuration: NetInfoConfiguration = {
        reachabilityUrl: 'https://clients3.google.com/generate_204',
        reachabilityTest: async (response: Response) => {
          return response.status === 204;
        },
        reachabilityLongTimeout: 10000, // 10s
        reachabilityShortTimeout: 5000, // 5s
        reachabilityRequestTimeout: 5000, // 5s
        reachabilityShouldRun: () => true,
        shouldFetchWiFiSSID: true,
        useNativeReachability: true,
      };

      NetInfo.configure(configuration);

    } catch (error) {
      console.error('[NetworkService] Configuration error:', error);
      throw error;
    }
  }

  private async startMonitoring(): Promise<void> {
    try {
      if (this.isMonitoring) {
        return;
      }

      this.unsubscribe = NetInfo.addEventListener(async (state) => {
        await this.handleNetworkChange(state);
      });

      this.isMonitoring = true;
      console.log('[NetworkService] Started network monitoring');

    } catch (error) {
      console.error('[NetworkService] Start monitoring error:', error);
      throw error;
    }
  }

  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    try {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        strength: this.extractSignalStrength(state),
        isWifiEnabled: state.type === 'wifi' && (state.isConnected ?? false),
        isCellularEnabled: state.type === 'cellular' && (state.isConnected ?? false),
        ssid: this.extractSSID(state),
        bssid: this.extractBSSID(state),
        frequency: this.extractFrequency(state),
        ipAddress: this.extractIPAddress(state),
        subnet: this.extractSubnet(state),
        details: state.details,
      };

      // Update current state
      this.currentState = networkState;

      // Store network state
      await this.storeNetworkState(networkState);

      // Update connection history
      await this.updateConnectionHistory(networkState);

      // Handle connection events
      if (networkState.isConnected && !this.wasConnected()) {
        await this.handleConnectionRestored();
      } else if (!networkState.isConnected && this.wasConnected()) {
        await this.handleConnectionLost();
      }

      // Notify listeners
      this.notifyListeners(networkState);

      console.log('[NetworkService] Network state changed:', {
        connected: networkState.isConnected,
        type: networkState.type,
        reachable: networkState.isInternetReachable,
      });

    } catch (error) {
      console.error('[NetworkService] Handle network change error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'handleNetworkChange', networkType: state.type },
        'medium'
      );
    }
  }

  private extractSignalStrength(state: NetInfoState): number | null {
    try {
      if (state.type === 'wifi' && state.details) {
        return (state.details as any).strength || null;
      }
      if (state.type === 'cellular' && state.details) {
        return (state.details as any).cellularGeneration || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractSSID(state: NetInfoState): string | null {
    try {
      if (state.type === 'wifi' && state.details) {
        return (state.details as any).ssid || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractBSSID(state: NetInfoState): string | null {
    try {
      if (state.type === 'wifi' && state.details) {
        return (state.details as any).bssid || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractFrequency(state: NetInfoState): number | null {
    try {
      if (state.type === 'wifi' && state.details) {
        return (state.details as any).frequency || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractIPAddress(state: NetInfoState): string | null {
    try {
      if (state.details) {
        return (state.details as any).ipAddress || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractSubnet(state: NetInfoState): string | null {
    try {
      if (state.details) {
        return (state.details as any).subnet || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private wasConnected(): boolean {
    return this.lastConnectedTime > 0;
  }

  private async handleConnectionRestored(): Promise<void> {
    try {
      this.lastConnectedTime = Date.now();
      this.retryAttempts = 0;

      console.log('[NetworkService] Connection restored');

      // Store connection event
      await AsyncStorage.setItem('@cryb_last_connected', this.lastConnectedTime.toString());

      // Test connection quality
      await this.testConnectionQuality();

    } catch (error) {
      console.error('[NetworkService] Connection restored handler error:', error);
    }
  }

  private async handleConnectionLost(): Promise<void> {
    try {
      console.log('[NetworkService] Connection lost');

      // Store disconnection event
      await AsyncStorage.setItem('@cryb_last_disconnected', Date.now().toString());

      // Update quality to offline
      const offlineQuality: NetworkQuality = {
        rtt: null,
        downlink: null,
        uplink: null,
        effectiveType: null,
        quality: 'offline',
      };

      this.currentQuality = offlineQuality;
      this.notifyQualityListeners(offlineQuality);

    } catch (error) {
      console.error('[NetworkService] Connection lost handler error:', error);
    }
  }

  private async storeNetworkState(state: NetworkState): Promise<void> {
    try {
      await AsyncStorage.setItem('@cryb_network_state', JSON.stringify({
        ...state,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('[NetworkService] Store network state error:', error);
    }
  }

  private async updateConnectionHistory(state: NetworkState): Promise<void> {
    try {
      const historyEntry = {
        timestamp: Date.now(),
        connected: state.isConnected,
        type: state.type,
      };

      this.connectionHistory.push(historyEntry);

      // Keep only last 100 entries
      if (this.connectionHistory.length > 100) {
        this.connectionHistory = this.connectionHistory.slice(-100);
      }

      // Store history
      await AsyncStorage.setItem(
        '@cryb_connection_history',
        JSON.stringify(this.connectionHistory)
      );

    } catch (error) {
      console.error('[NetworkService] Update connection history error:', error);
    }
  }

  private async loadConnectionHistory(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem('@cryb_connection_history');
      if (historyData) {
        this.connectionHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('[NetworkService] Load connection history error:', error);
    }
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[NetworkService] Listener error:', error);
      }
    });
  }

  private notifyQualityListeners(quality: NetworkQuality): void {
    this.qualityListeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        console.error('[NetworkService] Quality listener error:', error);
      }
    });
  }

  private startQualityMonitoring(): void {
    // Test connection quality every 30 seconds when connected
    this.qualityTestInterval = setInterval(async () => {
      try {
        if (this.currentState?.isConnected) {
          await this.testConnectionQuality();
        }
      } catch (error) {
        console.error('[NetworkService] Quality monitoring error:', error);
      }
    }, 30000);
  }

  private async testConnectionQuality(): Promise<void> {
    try {
      if (!this.currentState?.isConnected) {
        return;
      }

      const startTime = Date.now();
      
      // Test with a small request to measure RTT
      try {
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache',
        });

        const rtt = Date.now() - startTime;

        // Estimate connection quality based on RTT
        let quality: NetworkQuality['quality'];
        if (rtt < 100) {
          quality = 'excellent';
        } else if (rtt < 200) {
          quality = 'good';
        } else if (rtt < 500) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }

        const networkQuality: NetworkQuality = {
          rtt,
          downlink: this.estimateDownlink(rtt),
          uplink: this.estimateUplink(rtt),
          effectiveType: this.getEffectiveType(quality),
          quality,
        };

        this.currentQuality = networkQuality;
        this.notifyQualityListeners(networkQuality);

      } catch (error) {
        // Connection test failed
        const poorQuality: NetworkQuality = {
          rtt: null,
          downlink: null,
          uplink: null,
          effectiveType: null,
          quality: 'poor',
        };

        this.currentQuality = poorQuality;
        this.notifyQualityListeners(poorQuality);
      }

    } catch (error) {
      console.error('[NetworkService] Test connection quality error:', error);
    }
  }

  private estimateDownlink(rtt: number): number | null {
    try {
      // Rough estimation based on RTT
      if (rtt < 50) return 50; // 50 Mbps
      if (rtt < 100) return 25; // 25 Mbps
      if (rtt < 200) return 10; // 10 Mbps
      if (rtt < 500) return 5; // 5 Mbps
      return 1; // 1 Mbps
    } catch {
      return null;
    }
  }

  private estimateUplink(rtt: number): number | null {
    try {
      // Rough estimation (usually lower than downlink)
      const downlink = this.estimateDownlink(rtt);
      return downlink ? downlink * 0.3 : null;
    } catch {
      return null;
    }
  }

  private getEffectiveType(quality: NetworkQuality['quality']): string {
    switch (quality) {
      case 'excellent': return '4g';
      case 'good': return '3g';
      case 'fair': return '2g';
      case 'poor': return 'slow-2g';
      case 'offline': return 'offline';
      default: return 'unknown';
    }
  }

  // Public methods
  getCurrentState(): NetworkState | null {
    return this.currentState;
  }

  getCurrentQuality(): NetworkQuality | null {
    return this.currentQuality;
  }

  isConnected(): boolean {
    return this.currentState?.isConnected ?? false;
  }

  isInternetReachable(): boolean {
    return this.currentState?.isInternetReachable ?? false;
  }

  getConnectionType(): string {
    return this.currentState?.type ?? 'unknown';
  }

  addNetworkListener(listener: NetworkChangeListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  addQualityListener(listener: NetworkQualityListener): () => void {
    this.qualityListeners.push(listener);
    
    return () => {
      const index = this.qualityListeners.indexOf(listener);
      if (index > -1) {
        this.qualityListeners.splice(index, 1);
      }
    };
  }

  async retry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check if we're connected before attempting
        if (!this.isConnected() && attempt === 1) {
          throw new Error('No network connection available');
        }

        const result = await operation();
        
        // Reset retry counter on success
        this.retryAttempts = 0;
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.warn(`[NetworkService] Retry attempt ${attempt}/${maxAttempts} failed:`, error);

        if (attempt === maxAttempts) {
          break;
        }

        // Progressive delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Wait for connection if we're offline
        if (!this.isConnected()) {
          await this.waitForConnection(5000); // Wait up to 5 seconds
        }
      }
    }

    this.retryAttempts++;
    throw lastError!;
  }

  async waitForConnection(timeout = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const cleanup = this.addNetworkListener((state) => {
        if (state.isConnected) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(true);
        }
      });
    });
  }

  getConnectionHistory(): typeof this.connectionHistory {
    return [...this.connectionHistory];
  }

  getConnectionStats() {
    const now = Date.now();
    const last24h = this.connectionHistory.filter(
      entry => now - entry.timestamp < 24 * 60 * 60 * 1000
    );

    const connected = last24h.filter(entry => entry.connected);
    const disconnected = last24h.filter(entry => !entry.connected);

    return {
      totalEvents: last24h.length,
      connectedEvents: connected.length,
      disconnectedEvents: disconnected.length,
      connectionRate: connected.length / (last24h.length || 1),
      averageConnectionDuration: this.calculateAverageConnectionDuration(last24h),
    };
  }

  private calculateAverageConnectionDuration(history: typeof this.connectionHistory): number {
    let totalDuration = 0;
    let connectionCount = 0;
    let lastConnectedTime: number | null = null;

    for (const entry of history) {
      if (entry.connected && !lastConnectedTime) {
        lastConnectedTime = entry.timestamp;
      } else if (!entry.connected && lastConnectedTime) {
        totalDuration += entry.timestamp - lastConnectedTime;
        connectionCount++;
        lastConnectedTime = null;
      }
    }

    return connectionCount > 0 ? totalDuration / connectionCount : 0;
  }

  cleanup(): void {
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      if (this.qualityTestInterval) {
        clearInterval(this.qualityTestInterval);
        this.qualityTestInterval = null;
      }

      this.listeners = [];
      this.qualityListeners = [];
      this.isMonitoring = false;

      console.log('[NetworkService] Cleaned up successfully');

    } catch (error) {
      console.error('[NetworkService] Cleanup error:', error);
    }
  }
}

export const networkService = NetworkService.getInstance();