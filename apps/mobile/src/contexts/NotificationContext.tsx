/**
 * NOTIFICATION CONTEXT PROVIDER
 * Provides notification functionality throughout the app with error handling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { NotificationService, NotificationPermissionStatus, NotificationPayload } from '../services/NotificationService';
import { CrashDetector } from '../utils/CrashDetector';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface NotificationContextType {
  // State
  isInitialized: boolean;
  permissionStatus: NotificationPermissionStatus | null;
  pushToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  scheduleNotification: (payload: NotificationPayload) => Promise<string | null>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

function NotificationProviderComponent({ children }: NotificationProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification service
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    setIsLoading(true);
    setError(null);

    try {
      const success = await NotificationService.initialize();
      
      if (success) {
        const permissions = NotificationService.getPermissionStatus();
        const token = NotificationService.getPushToken();
        
        setPermissionStatus(permissions);
        setPushToken(token);
        setIsInitialized(true);
        
        console.log('[NotificationContext] Initialized successfully');
        return true;
      } else {
        throw new Error('Failed to initialize notification service');
      }

    } catch (err) {
      console.error('[NotificationContext] Initialize error:', err);
      
      await CrashDetector.reportError(
        err instanceof Error ? err : new Error(String(err)),
        { action: 'initializeNotificationContext' },
        'high'
      );

      setError(err instanceof Error ? err.message : 'Initialization failed');
      return false;

    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<NotificationPermissionStatus> => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await NotificationService.requestPermissions();
      setPermissionStatus(status);
      
      // Update token if permissions granted
      if (status.granted) {
        const token = NotificationService.getPushToken();
        setPushToken(token);
      }

      return status;

    } catch (err) {
      console.error('[NotificationContext] Request permissions error:', err);
      
      await CrashDetector.reportError(
        err instanceof Error ? err : new Error(String(err)),
        { action: 'requestNotificationPermissions' },
        'medium'
      );

      setError(err instanceof Error ? err.message : 'Permission request failed');
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };

    } finally {
      setIsLoading(false);
    }
  }, []);

  // Schedule local notification
  const scheduleNotification = useCallback(async (payload: NotificationPayload): Promise<string | null> => {
    try {
      if (!permissionStatus?.granted) {
        setError('Notification permissions not granted');
        return null;
      }

      const notificationId = await NotificationService.scheduleLocalNotification(payload);
      
      if (!notificationId) {
        setError('Failed to schedule notification');
      }

      return notificationId;

    } catch (err) {
      console.error('[NotificationContext] Schedule notification error:', err);
      
      await CrashDetector.reportError(
        err instanceof Error ? err : new Error(String(err)),
        { action: 'scheduleNotification' },
        'medium'
      );

      setError(err instanceof Error ? err.message : 'Failed to schedule notification');
      return null;
    }
  }, [permissionStatus]);

  // Cancel notification
  const cancelNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await NotificationService.cancelNotification(id);
    } catch (err) {
      console.error('[NotificationContext] Cancel notification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel notification');
    }
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await NotificationService.cancelAllNotifications();
    } catch (err) {
      console.error('[NotificationContext] Cancel all notifications error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel notifications');
    }
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    try {
      await NotificationService.setBadgeCount(count);
    } catch (err) {
      console.error('[NotificationContext] Set badge count error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set badge count');
    }
  }, []);

  // Clear badge
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await NotificationService.clearBadge();
    } catch (err) {
      console.error('[NotificationContext] Clear badge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear badge');
    }
  }, []);

  // Refresh push token
  const refreshToken = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await NotificationService.refreshToken();
      
      const token = NotificationService.getPushToken();
      setPushToken(token);

    } catch (err) {
      console.error('[NotificationContext] Refresh token error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh token');

    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      try {
        if (nextAppState === 'active' && isInitialized) {
          // Clear badge when app becomes active
          clearBadge();
          
          // Refresh permissions status
          const currentStatus = NotificationService.getPermissionStatus();
          if (currentStatus) {
            setPermissionStatus(currentStatus);
          }
        }
      } catch (err) {
        console.error('[NotificationContext] App state change error:', err);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isInitialized, clearBadge]);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  const contextValue: NotificationContextType = {
    // State
    isInitialized,
    permissionStatus,
    pushToken,
    isLoading,
    error,

    // Actions
    initialize,
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    setBadgeCount,
    clearBadge,
    refreshToken,
    clearError,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Export with error boundary wrapper
export function NotificationProvider({ children }: NotificationProviderProps) {
  return (
    <ErrorBoundary>
      <NotificationProviderComponent>
        {children}
      </NotificationProviderComponent>
    </ErrorBoundary>
  );
}

// Hook to use notification context
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}

// Hook for checking notification permissions
export function useNotificationPermissions() {
  const { permissionStatus, requestPermissions, isLoading } = useNotifications();
  
  return {
    isGranted: permissionStatus?.granted || false,
    canAskAgain: permissionStatus?.canAskAgain || false,
    status: permissionStatus?.status || 'undetermined',
    requestPermissions,
    isLoading,
  };
}

// Hook for managing badge count
export function useNotificationBadge() {
  const { setBadgeCount, clearBadge } = useNotifications();
  
  const [badgeCount, setBadgeCountState] = useState(0);
  
  const updateBadge = useCallback(async (count: number) => {
    setBadgeCountState(count);
    await setBadgeCount(count);
  }, [setBadgeCount]);
  
  const clearBadgeCount = useCallback(async () => {
    setBadgeCountState(0);
    await clearBadge();
  }, [clearBadge]);
  
  const incrementBadge = useCallback(async (increment = 1) => {
    const newCount = badgeCount + increment;
    await updateBadge(newCount);
  }, [badgeCount, updateBadge]);
  
  return {
    badgeCount,
    updateBadge,
    clearBadgeCount,
    incrementBadge,
  };
}