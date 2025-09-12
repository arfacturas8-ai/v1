/**
 * CRASH-SAFE NAVIGATION SYSTEM
 * Handles navigation errors and provides recovery mechanisms
 */

import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationState, PartialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';
import { ErrorBoundary } from '../components/ErrorBoundary';

const NAVIGATION_PERSISTENCE_KEY = '@cryb_navigation_state';
const NAVIGATION_ERROR_KEY = '@cryb_navigation_error';
const MAX_RESTORE_ATTEMPTS = 3;

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { serverId?: string; channelId?: string };
  Profile: { userId?: string };
  Settings: undefined;
  Voice: { channelId: string };
  Camera: undefined;
  ImageViewer: { imageUrl: string };
};

export type MainTabParamList = {
  Home: undefined;
  Servers: undefined;
  Friends: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface NavigationError {
  timestamp: number;
  error: string;
  state?: NavigationState;
  route?: string;
}

class NavigationErrorRecovery {
  private static instance: NavigationErrorRecovery;
  private errorCount = 0;
  private lastErrorTime = 0;
  private maxErrors = 5;
  private errorWindow = 60000; // 1 minute

  static getInstance(): NavigationErrorRecovery {
    if (!NavigationErrorRecovery.instance) {
      NavigationErrorRecovery.instance = new NavigationErrorRecovery();
    }
    return NavigationErrorRecovery.instance;
  }

  async handleNavigationError(error: any, state?: NavigationState): Promise<boolean> {
    const now = Date.now();
    
    // Reset counter if outside error window
    if (now - this.lastErrorTime > this.errorWindow) {
      this.errorCount = 0;
    }
    
    this.errorCount++;
    this.lastErrorTime = now;
    
    const navigationError: NavigationError = {
      timestamp: now,
      error: error.message || String(error),
      state,
      route: this.getCurrentRouteName(state),
    };
    
    try {
      // Store error for debugging
      await this.storeNavigationError(navigationError);
      
      // Report to crash detector
      await CrashDetector.reportError(
        new Error(`Navigation Error: ${navigationError.error}`),
        {
          route: navigationError.route,
          errorCount: this.errorCount.toString(),
        },
        this.errorCount > 3 ? 'high' : 'medium'
      );
      
      // Decide recovery strategy
      if (this.errorCount >= this.maxErrors) {
        // Too many errors - clear navigation state
        await this.clearNavigationState();
        return false; // Trigger app restart
      }
      
      return true; // Continue with fallback navigation
    } catch (recoveryError) {
      console.error('[NavigationRecovery] Error during recovery:', recoveryError);
      return false;
    }
  }

  private getCurrentRouteName(state?: NavigationState): string {
    if (!state) return 'Unknown';
    
    const route = state.routes[state.index];
    
    if (route.state) {
      return this.getCurrentRouteName(route.state as NavigationState);
    }
    
    return route.name;
  }

  private async storeNavigationError(error: NavigationError) {
    try {
      const errors = await this.getNavigationErrors();
      errors.push(error);
      
      // Keep only last 20 errors
      const recentErrors = errors.slice(-20);
      
      await AsyncStorage.setItem(NAVIGATION_ERROR_KEY, JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('[NavigationRecovery] Failed to store error:', storageError);
    }
  }

  async getNavigationErrors(): Promise<NavigationError[]> {
    try {
      const errorData = await AsyncStorage.getItem(NAVIGATION_ERROR_KEY);
      return errorData ? JSON.parse(errorData) : [];
    } catch (error) {
      return [];
    }
  }

  async clearNavigationState() {
    try {
      await AsyncStorage.multiRemove([NAVIGATION_PERSISTENCE_KEY, NAVIGATION_ERROR_KEY]);
    } catch (error) {
      console.error('[NavigationRecovery] Failed to clear navigation state:', error);
    }
  }
}

const navigationRecovery = NavigationErrorRecovery.getInstance();

// Safe navigation container with error handling
export function CrashSafeNavigationContainer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<NavigationState | undefined>();
  const [restoreAttempts, setRestoreAttempts] = React.useState(0);

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        if (restoreAttempts >= MAX_RESTORE_ATTEMPTS) {
          console.warn('[Navigation] Max restore attempts reached, starting fresh');
          await navigationRecovery.clearNavigationState();
          setIsReady(true);
          return;
        }

        const savedStateString = await AsyncStorage.getItem(NAVIGATION_PERSISTENCE_KEY);
        
        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          
          // Validate saved state
          if (savedState && typeof savedState === 'object' && savedState.routes) {
            setInitialState(savedState);
          } else {
            console.warn('[Navigation] Invalid saved state, starting fresh');
            await AsyncStorage.removeItem(NAVIGATION_PERSISTENCE_KEY);
          }
        }
      } catch (error) {
        console.error('[Navigation] Error restoring state:', error);
        
        // Report error and increment attempts
        await navigationRecovery.handleNavigationError(error);
        setRestoreAttempts(prev => prev + 1);
        
        // Clear potentially corrupted state
        await AsyncStorage.removeItem(NAVIGATION_PERSISTENCE_KEY);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [restoreAttempts]);

  const handleStateChange = async (state: NavigationState | undefined) => {
    try {
      if (state) {
        await AsyncStorage.setItem(NAVIGATION_PERSISTENCE_KEY, JSON.stringify(state));
        
        // Store current route for crash reporting
        const currentRoute = navigationRecovery.getCurrentRouteName(state);
        await AsyncStorage.setItem('@cryb_current_route', currentRoute);
      }
    } catch (error) {
      console.error('[Navigation] Error saving state:', error);
      await navigationRecovery.handleNavigationError(error, state);
    }
  };

  const handleUnhandledAction = async (action: any, state: NavigationState) => {
    try {
      console.warn('[Navigation] Unhandled action:', action);
      
      await CrashDetector.reportError(
        new Error(`Unhandled navigation action: ${action.type}`),
        {
          action: JSON.stringify(action),
          currentRoute: navigationRecovery.getCurrentRouteName(state),
        },
        'low'
      );
    } catch (error) {
      console.error('[Navigation] Error handling unhandled action:', error);
    }
  };

  if (!isReady) {
    return null; // Or your loading component
  }

  return (
    <ErrorBoundary
      onError={async (error) => {
        const handled = await navigationRecovery.handleNavigationError(error, initialState);
        if (!handled) {
          // Force restart if navigation is too broken
          const RNRestart = require('react-native-restart').default;
          RNRestart.Restart();
        }
      }}
    >
      <NavigationContainer
        initialState={initialState}
        onStateChange={handleStateChange}
        onUnhandledAction={handleUnhandledAction}
        onReady={() => {
          console.log('[Navigation] Ready');
          setRestoreAttempts(0); // Reset attempts on successful load
        }}
      >
        {children}
      </NavigationContainer>
    </ErrorBoundary>
  );
}

// Safe screen wrapper that handles screen-level errors
export function SafeScreen({ 
  children, 
  name,
  fallback 
}: { 
  children: React.ReactNode;
  name: string;
  fallback?: React.ComponentType<any>;
}) {
  const handleScreenError = React.useCallback(async (error: Error) => {
    await CrashDetector.reportError(error, { screen: name }, 'medium');
  }, [name]);

  return (
    <ErrorBoundary fallback={fallback} onError={handleScreenError}>
      {children}
    </ErrorBoundary>
  );
}

// Navigation hook with error handling
export function useSafeNavigation() {
  const navigation = React.useContext(NavigationContainer);
  
  const safeNavigate = React.useCallback(async (name: string, params?: any) => {
    try {
      (navigation as any)?.navigate(name, params);
    } catch (error) {
      console.error('[Navigation] Error navigating:', error);
      await navigationRecovery.handleNavigationError(error);
    }
  }, [navigation]);

  const safeGoBack = React.useCallback(async () => {
    try {
      (navigation as any)?.goBack();
    } catch (error) {
      console.error('[Navigation] Error going back:', error);
      await navigationRecovery.handleNavigationError(error);
    }
  }, [navigation]);

  const safeReset = React.useCallback(async (state: PartialState<NavigationState>) => {
    try {
      (navigation as any)?.reset(state);
    } catch (error) {
      console.error('[Navigation] Error resetting:', error);
      await navigationRecovery.handleNavigationError(error);
    }
  }, [navigation]);

  return {
    navigate: safeNavigate,
    goBack: safeGoBack,
    reset: safeReset,
  };
}

// Route-specific error boundaries
export function AuthScreenBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SafeScreen name="Auth">
      {children}
    </SafeScreen>
  );
}

export function ChatScreenBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SafeScreen name="Chat">
      {children}
    </SafeScreen>
  );
}

export function VoiceScreenBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SafeScreen name="Voice">
      {children}
    </SafeScreen>
  );
}

// Deep linking handler with error safety
export class SafeDeepLinkHandler {
  private static instance: SafeDeepLinkHandler;
  
  static getInstance(): SafeDeepLinkHandler {
    if (!SafeDeepLinkHandler.instance) {
      SafeDeepLinkHandler.instance = new SafeDeepLinkHandler();
    }
    return SafeDeepLinkHandler.instance;
  }

  async handleDeepLink(url: string, navigation: any): Promise<boolean> {
    try {
      // Validate URL format
      if (!this.isValidDeepLink(url)) {
        throw new Error(`Invalid deep link format: ${url}`);
      }

      // Parse URL safely
      const parsed = this.parseDeepLink(url);
      if (!parsed) {
        throw new Error(`Failed to parse deep link: ${url}`);
      }

      // Navigate safely
      await this.navigateToDeepLink(parsed, navigation);
      
      return true;
    } catch (error) {
      console.error('[DeepLink] Error handling deep link:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { deepLink: url },
        'medium'
      );
      
      return false;
    }
  }

  private isValidDeepLink(url: string): boolean {
    try {
      const validSchemes = ['cryb://', 'https://cryb.app'];
      return validSchemes.some(scheme => url.startsWith(scheme));
    } catch {
      return false;
    }
  }

  private parseDeepLink(url: string): { screen: string; params?: any } | null {
    try {
      // Simple deep link parsing - extend as needed
      if (url.includes('/chat/')) {
        const channelId = url.split('/chat/')[1]?.split('/')[0];
        return { screen: 'Chat', params: { channelId } };
      }
      
      if (url.includes('/profile/')) {
        const userId = url.split('/profile/')[1]?.split('/')[0];
        return { screen: 'Profile', params: { userId } };
      }
      
      return { screen: 'Main' };
    } catch {
      return null;
    }
  }

  private async navigateToDeepLink(parsed: { screen: string; params?: any }, navigation: any) {
    // Ensure navigation is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    navigation.navigate(parsed.screen, parsed.params);
  }
}

export const deepLinkHandler = SafeDeepLinkHandler.getInstance();