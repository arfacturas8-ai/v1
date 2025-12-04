/**
 * Authentication Store (Zustand)
 * Manages authentication state, user data, and session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { environment } from '../config/environment';

interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  walletAddress?: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithWallet: (address: string, signature: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string, refreshToken?: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Login with email/password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${environment.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // Login with wallet
      loginWithWallet: async (address: string, signature: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${environment.API_BASE_URL}/auth/wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature }),
          });

          if (!response.ok) {
            throw new Error('Wallet authentication failed');
          }

          const data = await response.json();
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Wallet authentication failed',
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        });
      },

      // Refresh session
      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch(`${environment.API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          set({
            token: data.token,
            refreshToken: data.refreshToken,
          });
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      // Update user
      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      // Set token
      setToken: (token: string, refreshToken?: string) => {
        set({
          token,
          refreshToken: refreshToken || get().refreshToken,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cryb-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
