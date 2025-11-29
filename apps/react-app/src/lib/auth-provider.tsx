'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock API functions - replace with actual API calls
const authAPI = {
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('cryb-token');
    if (!token) return null;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock user data
    return {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      avatar: '/avatars/default.png',
      bio: 'Hello, I\'m using CRYB!',
      isOnline: true,
      lastSeen: new Date(),
      joinedAt: new Date('2023-01-01'),
      verified: true,
      role: 'user',
      karma: 100,
      preferences: {
        theme: 'system' as const,
        notifications: {
          email: true,
          push: true,
          desktop: true,
          mentions: true,
          directMessages: true,
          channelUpdates: true,
          communityUpdates: true,
        },
        privacy: {
          profileVisibility: 'public' as const,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone' as const,
          showEmail: false,
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          fontSize: 'medium' as const,
          screenReader: false,
        },
      },
    };
  },
  
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'error@example.com') {
      throw new Error('Invalid credentials');
    }
    
    const user: User = {
      id: '1',
      username: 'testuser',
      email,
      displayName: 'Test User',
      avatar: '/avatars/default.png',
      bio: 'Hello, I\'m using CRYB!',
      isOnline: true,
      lastSeen: new Date(),
      joinedAt: new Date('2023-01-01'),
      verified: true,
      role: 'user',
      karma: 100,
      preferences: {
        theme: 'system' as const,
        notifications: {
          email: true,
          push: true,
          desktop: true,
          mentions: true,
          directMessages: true,
          channelUpdates: true,
          communityUpdates: true,
        },
        privacy: {
          profileVisibility: 'public' as const,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone' as const,
          showEmail: false,
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          fontSize: 'medium' as const,
          screenReader: false,
        },
      },
    };
    
    const token = 'mock-jwt-token-' + Date.now();
    return { user, token };
  },
  
  register: async (userData: RegisterData): Promise<{ user: User; token: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (userData.email === 'taken@example.com') {
      throw new Error('Email already exists');
    }
    
    const user: User = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      displayName: userData.username,
      avatar: '/avatars/default.png',
      bio: '',
      isOnline: true,
      lastSeen: new Date(),
      joinedAt: new Date(),
      verified: false,
      role: 'user',
      karma: 0,
      preferences: {
        theme: 'system' as const,
        notifications: {
          email: true,
          push: true,
          desktop: true,
          mentions: true,
          directMessages: true,
          channelUpdates: true,
          communityUpdates: true,
        },
        privacy: {
          profileVisibility: 'public' as const,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone' as const,
          showEmail: false,
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          fontSize: 'medium' as const,
          screenReader: false,
        },
      },
    };
    
    const token = 'mock-jwt-token-' + Date.now();
    return { user, token };
  },
  
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return updated user (this would come from the server)
    const currentUser = await authAPI.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    return { ...currentUser, ...updates };
  },
  
  logout: async (): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem('cryb-token');
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout, updateUser, setLoading, setError } = useAuthStore();

  // Query to get current user
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    enabled: !!token && !user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Update store when user data is fetched
  useEffect(() => {
    if (currentUser && !user) {
      updateUser(currentUser);
    }
  }, [currentUser, user, updateUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password),
    onSuccess: ({ user, token }) => {
      localStorage.setItem('cryb-token', token);
      storeLogin(user, token);
      queryClient.setQueryData(['currentUser'], user);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: ({ user, token }) => {
      localStorage.setItem('cryb-token', token);
      storeLogin(user, token);
      queryClient.setQueryData(['currentUser'], user);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
    },
  });

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    register: async (userData: RegisterData) => {
      await registerMutation.mutateAsync(userData);
    },
    updateProfile: async (updates: Partial<User>) => {
      await updateProfileMutation.mutateAsync(updates);
    },
    refreshUser: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}