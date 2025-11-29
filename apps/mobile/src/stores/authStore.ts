/**
 * CRASH-SAFE AUTHENTICATION STORE
 * Handles auth state with comprehensive error handling and recovery
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { CrashDetector } from '../utils/CrashDetector';
import apiService from '../services/RealApiService';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  role: 'user' | 'admin' | 'moderator';
  settings?: {
    biometricEnabled: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastAuthTime: number | null;
  biometricAvailable: boolean;
  authAttempts: number;
  lockoutTime: number | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  register: (data: { username: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  resetAuthAttempts: () => void;
  isAuthenticated: () => boolean;
}

const MAX_AUTH_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const API_BASE_URL = __DEV__ ? 'http://localhost:3002' : 'https://api.cryb.ai';

class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async secureStore(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[AuthService] Secure store error:', error);
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'secureStore', key },
        'medium'
      );
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  }

  async secureRetrieve(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[AuthService] Secure retrieve error:', error);
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'secureRetrieve', key },
        'low'
      );
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(`secure_${key}`);
    }
  }

  async secureDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[AuthService] Secure delete error:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  }

  async makeAuthRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('[AuthService] Request error:', error);
      
      await CrashDetector.reportNetworkError(error, `AUTH_${endpoint}`);
      
      throw error;
    }
  }

  async checkBiometricAvailability(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('[AuthService] Biometric check error:', error);
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'checkBiometric' },
        'low'
      );
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use password instead',
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('[AuthService] Biometric auth error:', error);
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'biometricAuth' },
        'medium'
      );
      return false;
    }
  }
}

const authService = AuthService.getInstance();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      lastAuthTime: null,
      biometricAvailable: false,
      authAttempts: 0,
      lockoutTime: null,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
          // Check biometric availability
          const biometricAvailable = await authService.checkBiometricAvailability();
          
          if (apiService.isAuthenticated()) {
            // Validate current authentication
            const userResponse = await apiService.getCurrentUser();
            
            if (userResponse) {
              set({ 
                user: userResponse,
                token: apiService.getToken(),
                biometricAvailable,
                isInitialized: true,
                isLoading: false,
                lastAuthTime: Date.now(),
              });
            } else {
              set({ 
                biometricAvailable,
                isInitialized: true,
                isLoading: false 
              });
            }
          } else {
            set({ 
              biometricAvailable,
              isInitialized: true,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('[AuthStore] Initialize error:', error);
          
          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { action: 'initialize' },
            'high'
          );

          set({
            error: 'Failed to initialize authentication',
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      login: async (email: string, password: string) => {
        const state = get();

        // Check lockout
        if (state.lockoutTime && Date.now() < state.lockoutTime) {
          const remainingTime = Math.ceil((state.lockoutTime - Date.now()) / 1000);
          set({ error: `Too many attempts. Try again in ${remainingTime} seconds.` });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await apiService.login(email, password);

          if (response && response.user) {
            set({
              user: response.user,
              token: apiService.getToken(),
              lastAuthTime: Date.now(),
              isLoading: false,
              error: null,
              authAttempts: 0,
              lockoutTime: null,
            });

            return true;
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          console.error('[AuthStore] Login error:', error);

          const newAttempts = state.authAttempts + 1;
          const lockoutTime = newAttempts >= MAX_AUTH_ATTEMPTS 
            ? Date.now() + LOCKOUT_DURATION 
            : null;

          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { 
              action: 'login', 
              attempts: newAttempts.toString(),
              email: email.substring(0, 3) + '***' // Partial email for debugging
            },
            newAttempts >= MAX_AUTH_ATTEMPTS ? 'high' : 'medium'
          );

          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            authAttempts: newAttempts,
            lockoutTime,
          });

          return false;
        }
      },

      loginWithBiometric: async () => {
        const state = get();

        if (!state.biometricAvailable) {
          set({ error: 'Biometric authentication not available' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const biometricSuccess = await authService.authenticateWithBiometric();
          
          if (!biometricSuccess) {
            set({ 
              error: 'Biometric authentication failed',
              isLoading: false 
            });
            return false;
          }

          // Retrieve stored credentials
          const token = await authService.secureRetrieve('auth_token');
          
          if (!token) {
            set({ 
              error: 'No stored credentials found',
              isLoading: false 
            });
            return false;
          }

          // Validate token
          const refreshSuccess = await get().refreshAuth();
          
          if (refreshSuccess) {
            set({ 
              lastAuthTime: Date.now(),
              isLoading: false,
              error: null 
            });
            return true;
          } else {
            set({ 
              error: 'Session expired, please login again',
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          console.error('[AuthStore] Biometric login error:', error);

          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { action: 'biometricLogin' },
            'medium'
          );

          set({
            error: 'Biometric login failed',
            isLoading: false,
          });

          return false;
        }
      },

      register: async (data: { username: string; email: string; password: string }) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.register(data.email, data.password, data.username);

          if (response && response.user) {
            set({
              user: response.user,
              token: apiService.getToken(),
              lastAuthTime: Date.now(),
              isLoading: false,
              error: null,
            });

            return true;
          } else {
            throw new Error('Registration failed');
          }
        } catch (error) {
          console.error('[AuthStore] Register error:', error);

          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { 
              action: 'register',
              email: data.email.substring(0, 3) + '***'
            },
            'medium'
          );

          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });

          return false;
        }
      },

      refreshAuth: async () => {
        const state = get();

        if (!state.token) {
          return false;
        }

        try {
          const userResponse = await apiService.getCurrentUser();

          if (userResponse) {
            set({
              user: userResponse,
              lastAuthTime: Date.now(),
              error: null,
            });
            return true;
          } else {
            throw new Error('Invalid user data');
          }
        } catch (error) {
          console.error('[AuthStore] Refresh error:', error);

          // Try refresh token automatically handled by RealApiService
          if (apiService.isAuthenticated()) {
            try {
              const userResponse = await apiService.getCurrentUser();
              if (userResponse) {
                set({
                  user: userResponse,
                  token: apiService.getToken(),
                  lastAuthTime: Date.now(),
                  error: null,
                });
                return true;
              }
            } catch (refreshError) {
              console.error('[AuthStore] Refresh token error:', refreshError);
            }
          }

          // Clear invalid tokens
          await get().logout();
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          // Notify server
          await apiService.logout();

          set({
            user: null,
            token: null,
            refreshToken: null,
            lastAuthTime: null,
            isLoading: false,
            error: null,
            authAttempts: 0,
            lockoutTime: null,
          });
        } catch (error) {
          console.error('[AuthStore] Logout error:', error);

          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { action: 'logout' },
            'medium'
          );

          // Force clear state even on error
          set({
            user: null,
            token: null,
            refreshToken: null,
            lastAuthTime: null,
            isLoading: false,
            error: null,
            authAttempts: 0,
            lockoutTime: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      enableBiometric: async () => {
        try {
          const isAvailable = await authService.checkBiometricAvailability();
          
          if (!isAvailable) {
            set({ error: 'Biometric authentication is not available on this device' });
            return false;
          }

          const authenticated = await authService.authenticateWithBiometric();
          
          if (authenticated) {
            const user = get().user;
            if (user) {
              set({
                user: {
                  ...user,
                  settings: {
                    ...user.settings,
                    biometricEnabled: true,
                  },
                },
              });
            }
            return true;
          } else {
            set({ error: 'Biometric setup cancelled' });
            return false;
          }
        } catch (error) {
          console.error('[AuthStore] Enable biometric error:', error);

          await CrashDetector.reportError(
            error instanceof Error ? error : new Error(String(error)),
            { action: 'enableBiometric' },
            'medium'
          );

          set({ error: 'Failed to enable biometric authentication' });
          return false;
        }
      },

      disableBiometric: async () => {
        try {
          const user = get().user;
          if (user) {
            set({
              user: {
                ...user,
                settings: {
                  ...user.settings,
                  biometricEnabled: false,
                },
              },
            });
          }
        } catch (error) {
          console.error('[AuthStore] Disable biometric error:', error);
          set({ error: 'Failed to disable biometric authentication' });
        }
      },

      resetAuthAttempts: () => {
        set({ authAttempts: 0, lockoutTime: null });
      },

      isAuthenticated: () => {
        const state = get();
        return state.user !== null && state.token !== null && apiService.isAuthenticated();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive state
        biometricAvailable: state.biometricAvailable,
        lastAuthTime: state.lastAuthTime,
        user: state.user ? {
          ...state.user,
          // Don't persist sensitive user data
        } : null,
      }),
    }
  )
);