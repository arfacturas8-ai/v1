/**
 * NETWORK CONTEXT PROVIDER
 * Provides network connectivity state throughout the app with error handling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { NetworkService, NetworkState, NetworkQuality } from '../services/NetworkService';
import { CrashDetector } from '../utils/CrashDetector';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface NetworkContextType {
  // State
  networkState: NetworkState | null;
  networkQuality: NetworkQuality | null;
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  isInitialized: boolean;
  error: string | null;

  // Actions
  retry: <T>(operation: () => Promise<T>, maxAttempts?: number) => Promise<T>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
  refresh: () => Promise<void>;
  getConnectionStats: () => any;
  clearError: () => void;

  // Events
  onNetworkChange: (callback: (state: NetworkState) => void) => () => void;
  onQualityChange: (callback: (quality: NetworkQuality) => void) => () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: React.ReactNode;
}

function NetworkProviderComponent({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  // Derived state
  const isConnected = networkState?.isConnected ?? false;
  const isInternetReachable = networkState?.isInternetReachable ?? false;
  const connectionType = networkState?.type ?? 'unknown';
  const isOnline = isConnected && isInternetReachable;
  const isOffline = !isConnected;
  const connectionQuality = networkQuality?.quality ?? 'offline';

  // Initialize network service
  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        await NetworkService.initialize();

        // Get initial state
        const initialState = NetworkService.getCurrentState();
        const initialQuality = NetworkService.getCurrentQuality();

        if (initialState) {
          setNetworkState(initialState);
        }

        if (initialQuality) {
          setNetworkQuality(initialQuality);
        }

        setIsInitialized(true);
        console.log('[NetworkContext] Initialized successfully');

      } catch (err) {
        console.error('[NetworkContext] Initialize error:', err);
        
        await CrashDetector.reportError(
          err instanceof Error ? err : new Error(String(err)),
          { action: 'initializeNetworkContext' },
          'high'
        );

        setError(err instanceof Error ? err.message : 'Network initialization failed');
      }
    };

    initializeNetwork();

    return () => {
      NetworkService.cleanup();
    };
  }, []);

  // Set up network change listener
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = NetworkService.addNetworkListener((state) => {
      setNetworkState(state);

      // Handle connection state changes
      if (!state.isConnected && isConnected) {
        handleConnectionLost();
      } else if (state.isConnected && !isConnected) {
        handleConnectionRestored();
      }
    });

    return unsubscribe;
  }, [isInitialized, isConnected]);

  // Set up quality change listener
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = NetworkService.addQualityListener((quality) => {
      setNetworkQuality(quality);
    });

    return unsubscribe;
  }, [isInitialized]);

  const handleConnectionLost = useCallback(() => {
    console.log('[NetworkContext] Connection lost');
    
    if (!showOfflineAlert) {
      setShowOfflineAlert(true);
      
      Alert.alert(
        'Connection Lost',
        'You\'re now offline. Some features may be limited.',
        [
          {
            text: 'OK',
            onPress: () => setShowOfflineAlert(false),
          },
        ]
      );
    }
  }, [showOfflineAlert]);

  const handleConnectionRestored = useCallback(() => {
    console.log('[NetworkContext] Connection restored');
    
    setShowOfflineAlert(false);
    
    // Show brief success message
    Alert.alert(
      'Connection Restored',
      'You\'re back online!',
      [{ text: 'OK' }],
      { 
        onDismiss: () => {
          // Auto dismiss after 2 seconds
          setTimeout(() => {
            // Clear any pending alerts
          }, 2000);
        }
      }
    );
  }, []);

  // Retry operation with network awareness
  const retry = useCallback(async <T,>(
    operation: () => Promise<T>,
    maxAttempts = 3
  ): Promise<T> => {
    try {
      return await NetworkService.retry(operation, maxAttempts);
    } catch (error) {
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'networkRetry', attempts: maxAttempts },
        'medium'
      );
      throw error;
    }
  }, []);

  // Wait for connection
  const waitForConnection = useCallback(async (timeout = 30000): Promise<boolean> => {
    try {
      return await NetworkService.waitForConnection(timeout);
    } catch (error) {
      console.error('[NetworkContext] Wait for connection error:', error);
      return false;
    }
  }, []);

  // Refresh network state
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const currentState = NetworkService.getCurrentState();
      const currentQuality = NetworkService.getCurrentQuality();

      if (currentState) {
        setNetworkState(currentState);
      }

      if (currentQuality) {
        setNetworkQuality(currentQuality);
      }

    } catch (err) {
      console.error('[NetworkContext] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh network state');
    }
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    try {
      return NetworkService.getConnectionStats();
    } catch (error) {
      console.error('[NetworkContext] Get stats error:', error);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Add network change listener
  const onNetworkChange = useCallback((callback: (state: NetworkState) => void) => {
    return NetworkService.addNetworkListener(callback);
  }, []);

  // Add quality change listener
  const onQualityChange = useCallback((callback: (quality: NetworkQuality) => void) => {
    return NetworkService.addQualityListener(callback);
  }, []);

  const contextValue: NetworkContextType = {
    // State
    networkState,
    networkQuality,
    isConnected,
    isInternetReachable,
    connectionType,
    isOnline,
    isOffline,
    connectionQuality,
    isInitialized,
    error,

    // Actions
    retry,
    waitForConnection,
    refresh,
    getConnectionStats,
    clearError,

    // Events
    onNetworkChange,
    onQualityChange,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

// Export with error boundary wrapper
export function NetworkProvider({ children }: NetworkProviderProps) {
  return (
    <ErrorBoundary>
      <NetworkProviderComponent>
        {children}
      </NetworkProviderComponent>
    </ErrorBoundary>
  );
}

// Hook to use network context
export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  
  return context;
}

// Hook for connection status
export function useConnectionStatus() {
  const { isConnected, isInternetReachable, connectionType, connectionQuality } = useNetwork();
  
  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
    isOffline: !isConnected,
    connectionType,
    connectionQuality,
    canMakeRequests: isConnected && isInternetReachable,
  };
}

// Hook for network-aware operations
export function useNetworkOperations() {
  const { retry, waitForConnection, isOnline } = useNetwork();
  
  const executeWhenOnline = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      waitTimeout?: number;
      maxRetries?: number;
      fallback?: () => T;
    }
  ): Promise<T> => {
    try {
      // Wait for connection if offline
      if (!isOnline) {
        const connected = await waitForConnection(options?.waitTimeout);
        if (!connected) {
          if (options?.fallback) {
            return options.fallback();
          }
          throw new Error('No network connection available');
        }
      }

      // Execute with retry
      return await retry(operation, options?.maxRetries);

    } catch (error) {
      if (options?.fallback) {
        console.warn('[NetworkOperations] Using fallback due to error:', error);
        return options.fallback();
      }
      throw error;
    }
  }, [isOnline, waitForConnection, retry]);

  return {
    executeWhenOnline,
    retry,
    waitForConnection,
  };
}

// Hook for monitoring connection quality
export function useConnectionQuality() {
  const { networkQuality, connectionQuality, onQualityChange } = useNetwork();
  
  const [qualityHistory, setQualityHistory] = useState<NetworkQuality[]>([]);

  useEffect(() => {
    const unsubscribe = onQualityChange((quality) => {
      setQualityHistory(prev => [...prev.slice(-9), quality]); // Keep last 10 entries
    });

    return unsubscribe;
  }, [onQualityChange]);

  return {
    current: networkQuality,
    quality: connectionQuality,
    history: qualityHistory,
    isGood: connectionQuality === 'excellent' || connectionQuality === 'good',
    isPoor: connectionQuality === 'poor' || connectionQuality === 'offline',
  };
}