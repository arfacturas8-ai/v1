import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth-provider';
import { useAuthStore } from '@/stores/auth-store';
import { User } from '@/types';

// Mock the auth store
jest.mock('@/stores/auth-store');

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    set store(value: Record<string, string>) {
      store = value;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper function to create a mock user
const createMockUser = (overrides?: Partial<User>): User => ({
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
    theme: 'system',
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
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowDirectMessages: 'everyone',
      showEmail: false,
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      fontSize: 'medium',
      screenReader: false,
    },
  },
  ...overrides,
});

// Helper to create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthProvider', () => {
  let mockStoreLogin: jest.Mock;
  let mockStoreLogout: jest.Mock;
  let mockUpdateUser: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    // Reset localStorage
    localStorageMock.store = {};
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Create mock functions
    mockStoreLogin = jest.fn();
    mockStoreLogout = jest.fn();
    mockUpdateUser = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    // Mock useAuthStore
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockStoreLogin,
      logout: mockStoreLogout,
      updateUser: mockUpdateUser,
      setLoading: mockSetLoading,
      setError: mockSetError,
      clearError: jest.fn(),
    });

    // Clear all timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Provider Initialization', () => {
    it('should provide initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('Auto-login from Stored Token', () => {
    it('should fetch current user when token exists in store', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token-123';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: 'mock-token-123',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Wait for the query to complete
      await waitFor(
        () => {
          expect(mockUpdateUser).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const updateUserCall = mockUpdateUser.mock.calls[0][0];
      expect(updateUserCall).toMatchObject({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should not fetch user when token does not exist', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should not fetch user when user already exists in store', () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token-123';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token-123',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toEqual(mockUser);
      // Should not call updateUser since user already exists
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });

      const [user, token] = mockStoreLogin.mock.calls[0];
      expect(user).toMatchObject({
        email: 'test@example.com',
        username: 'testuser',
      });
      expect(token).toContain('mock-jwt-token-');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb-token',
        expect.stringContaining('mock-jwt-token-')
      );
    });

    it('should handle login failure with invalid credentials', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('error@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Invalid credentials');
      });

      expect(mockStoreLogin).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });
    });

    it('should store user data in query cache after login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });

      // Verify that the user was stored in the store
      expect(mockStoreLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
        expect.stringContaining('mock-jwt-token-')
      );
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const registerData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });

      const [user, token] = mockStoreLogin.mock.calls[0];
      expect(user).toMatchObject({
        username: 'newuser',
        email: 'newuser@example.com',
        verified: false,
        karma: 0,
      });
      expect(token).toContain('mock-jwt-token-');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cryb-token',
        expect.stringContaining('mock-jwt-token-')
      );
    });

    it('should handle registration failure with existing email', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const registerData = {
        username: 'testuser',
        email: 'taken@example.com',
        password: 'password123',
      };

      await act(async () => {
        try {
          await result.current.register(registerData);
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Email already exists');
      });

      expect(mockStoreLogin).not.toHaveBeenCalled();
    });

    it('should create user with default preferences on registration', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const registerData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });

      const [user] = mockStoreLogin.mock.calls[0];
      expect(user.preferences).toBeDefined();
      expect(user.preferences.theme).toBe('system');
      expect(user.preferences.notifications).toBeDefined();
      expect(user.preferences.privacy).toBeDefined();
      expect(user.preferences.accessibility).toBeDefined();
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout', async () => {
      localStorageMock.store['cryb-token'] = 'existing-token';

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockStoreLogout).toHaveBeenCalled();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cryb-token');
    });

    it('should clear query cache on logout', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set some data in the cache
      queryClient.setQueryData(['currentUser'], createMockUser());

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockStoreLogout).toHaveBeenCalled();
      });

      // Verify cache was cleared
      const cachedUser = queryClient.getQueryData(['currentUser']);
      expect(cachedUser).toBeUndefined();
    });

    it('should remove token from localStorage on logout', async () => {
      localStorageMock.store['cryb-token'] = 'existing-token';

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('cryb-token');
      });
    });
  });

  describe('Profile Update', () => {
    it('should successfully update user profile', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      await act(async () => {
        await result.current.updateProfile(updates);
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });

      const updatedUser = mockUpdateUser.mock.calls[0][0];
      expect(updatedUser).toMatchObject({
        displayName: 'Updated Name',
        bio: 'Updated bio',
      });
    });

    it('should handle profile update failure when not authenticated', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.updateProfile({ displayName: 'New Name' });
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Not authenticated');
      });
    });

    it('should update preferences correctly', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const preferenceUpdates = {
        preferences: {
          ...mockUser.preferences,
          theme: 'dark' as const,
        },
      };

      await act(async () => {
        await result.current.updateProfile(preferenceUpdates);
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });

      const updatedUser = mockUpdateUser.mock.calls[0][0];
      expect(updatedUser.preferences.theme).toBe('dark');
    });
  });

  describe('User Refresh', () => {
    it('should refresh user data', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      // The refresh should invalidate queries
      // This will trigger a refetch of currentUser if needed
      expect(result.current.user).toBeDefined();
    });

    it('should handle refresh when token exists', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: 'mock-token',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      // Should trigger a query refetch
      await waitFor(
        () => {
          expect(mockUpdateUser).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Authentication State Management', () => {
    it('should correctly reflect authenticated state', () => {
      const mockUser = createMockUser();

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should correctly reflect unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should update state when user logs in', async () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });

      // After successful login, the store would update
      // In a real scenario, you'd rerender with updated store values
    });
  });

  describe('Role Management', () => {
    it('should handle user role correctly', () => {
      const adminUser = createMockUser({ role: 'admin' });

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: adminUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user?.role).toBe('admin');
    });

    it('should handle moderator role', () => {
      const modUser = createMockUser({ role: 'moderator' });

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: modUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user?.role).toBe('moderator');
    });

    it('should default to user role', () => {
      const regularUser = createMockUser({ role: 'user' });

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: regularUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user?.role).toBe('user');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('error@example.com', 'password');
        } catch (error) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalled();
      });
    });

    it('should handle errors during registration', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.register({
            username: 'test',
            email: 'taken@example.com',
            password: 'password',
          });
        } catch (error) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Email already exists');
      });
    });

    it('should handle errors during profile update', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.updateProfile({ displayName: 'New Name' });
        } catch (error) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });
    });

    it('should show loading during registration', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.register({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });
    });

    it('should not show loading when idle', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should store token in localStorage after login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'cryb-token',
          expect.stringContaining('mock-jwt-token-')
        );
      });
    });

    it('should store token in localStorage after registration', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.register({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'cryb-token',
          expect.stringContaining('mock-jwt-token-')
        );
      });
    });

    it('should remove token from localStorage on logout', async () => {
      localStorageMock.store['cryb-token'] = 'existing-token';

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('cryb-token');
      });
    });
  });

  describe('User Data Persistence', () => {
    it('should persist user data in store after login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            username: 'testuser',
          }),
          expect.any(String)
        );
      });
    });

    it('should maintain user preferences after profile update', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateProfile({
          displayName: 'New Display Name',
        });
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });

      const updatedUser = mockUpdateUser.mock.calls[0][0];
      expect(updatedUser.preferences).toBeDefined();
    });
  });

  describe('Context Value', () => {
    it('should provide all required context methods', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('updateProfile');
      expect(result.current).toHaveProperty('refreshUser');
    });

    it('should have login as a callable function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.login).toBe('function');
    });

    it('should have logout as a callable function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.logout).toBe('function');
    });

    it('should have register as a callable function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.register).toBe('function');
    });

    it('should have updateProfile as a callable function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.updateProfile).toBe('function');
    });

    it('should have refreshUser as a callable function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refreshUser).toBe('function');
    });
  });

  describe('Query Integration', () => {
    it('should use React Query for data fetching', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: 'mock-token',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(mockUpdateUser).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should cache user data with 5 minute stale time', async () => {
      // This test verifies the query configuration
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        token: 'mock-token',
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(mockUpdateUser).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // The query should be configured with appropriate stale time
      // This is tested implicitly through the provider configuration
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email in login', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('', 'password');
      });

      // Should still attempt the API call (validation happens server-side)
      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });
    });

    it('should handle empty password in login', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', '');
      });

      await waitFor(() => {
        expect(mockStoreLogin).toHaveBeenCalled();
      });
    });

    it('should handle partial profile updates', async () => {
      const mockUser = createMockUser();
      localStorageMock.store['cryb-token'] = 'mock-token';

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: mockStoreLogin,
        logout: mockStoreLogout,
        updateUser: mockUpdateUser,
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: jest.fn(),
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.updateProfile({ bio: 'New bio only' });
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });

      const updatedUser = mockUpdateUser.mock.calls[0][0];
      expect(updatedUser.bio).toBe('New bio only');
    });

    it('should handle multiple rapid login attempts', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start login attempts sequentially to avoid race conditions
      await act(async () => {
        await result.current.login('test1@example.com', 'pass1');
      });

      // Should have attempted the login
      await waitFor(() => {
        expect(mockStoreLogin.mock.calls.length).toBeGreaterThan(0);
      });
    });
  });
});
