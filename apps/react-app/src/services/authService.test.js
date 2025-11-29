/**
 * Tests for authService
 */
import authService from './authService';
import apiService from './api';

// Mock the API service
jest.mock('./api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('storeTokens', () => {
    it('stores session token in localStorage', () => {
      const tokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      };

      authService.storeTokens(tokens, false);

      const storedSession = JSON.parse(localStorage.getItem('cryb_session_token'));
      expect(storedSession.token).toBe('access123');
      expect(storedSession.expiresAt).toBeDefined();
    });

    it('stores refresh token when rememberMe is true', () => {
      const tokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      };

      authService.storeTokens(tokens, true);

      const storedRefresh = JSON.parse(localStorage.getItem('cryb_remember_token'));
      expect(storedRefresh.token).toBe('refresh123');
    });

    it('does not store refresh token when rememberMe is false', () => {
      const tokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      };

      authService.storeTokens(tokens, false);

      expect(localStorage.getItem('cryb_remember_token')).toBeNull();
    });

    it('sets default expiration if not provided', () => {
      const tokens = {
        accessToken: 'access123'
      };

      authService.storeTokens(tokens);

      const storedSession = JSON.parse(localStorage.getItem('cryb_session_token'));
      expect(storedSession.expiresAt).toBeDefined();
    });
  });

  describe('clearAuth', () => {
    it('clears all authentication data from localStorage', () => {
      localStorage.setItem('cryb_session_token', 'session');
      localStorage.setItem('cryb_remember_token', 'remember');
      localStorage.setItem('user', 'user');
      localStorage.setItem('cryb_siwe_session', 'siwe');

      authService.clearAuth();

      expect(localStorage.getItem('cryb_session_token')).toBeNull();
      expect(localStorage.getItem('cryb_remember_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('cryb_siwe_session')).toBeNull();
    });
  });

  describe('register', () => {
    it('successfully registers a new user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser', email: 'test@test.com' },
          tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      const userData = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.data.user);
      expect(result.tokens).toEqual(mockResponse.data.tokens);
      expect(apiService.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123'
        }),
        { auth: false }
      );
    });

    it('stores user and tokens on successful registration', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser' },
          tokens: { accessToken: 'token123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.register({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(localStorage.getItem('user')).toBeTruthy();
      expect(localStorage.getItem('cryb_session_token')).toBeTruthy();
    });

    it('handles registration failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Email already exists'
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.register({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });

    it('handles network errors during registration', async () => {
      const error = new Error('Network error');
      apiService.post.mockRejectedValue(error);

      const result = await authService.register({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('includes displayName or defaults to username', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser' },
          tokens: { accessToken: 'token123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.register({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          displayName: 'Test User'
        }),
        { auth: false }
      );
    });
  });

  describe('login', () => {
    it('successfully logs in with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser' },
          tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login('testuser', 'password123', false);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.data.user);
      expect(apiService.post).toHaveBeenCalledWith(
        '/auth/login',
        {
          identifier: 'testuser',
          password: 'password123',
          rememberMe: false
        },
        { auth: false }
      );
    });

    it('stores tokens with rememberMe flag', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser' },
          tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.login('testuser', 'password123', true);

      expect(localStorage.getItem('cryb_remember_token')).toBeTruthy();
    });

    it('does not store refresh token without rememberMe', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser' },
          tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.login('testuser', 'password123', false);

      expect(localStorage.getItem('cryb_remember_token')).toBeNull();
    });

    it('handles invalid credentials', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      apiService.post.mockResolvedValue(mockResponse);

      const result = await authService.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('handles network errors during login', async () => {
      const error = new Error('Network error');
      apiService.post.mockRejectedValue(error);

      const result = await authService.login('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('stores user data on successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', username: 'testuser', email: 'test@test.com' },
          tokens: { accessToken: 'token123' }
        }
      };

      apiService.post.mockResolvedValue(mockResponse);

      await authService.login('testuser', 'password123');

      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser.username).toBe('testuser');
    });

    it('handles API errors with error.data structure', async () => {
      const error = {
        data: {
          error: 'Account locked'
        }
      };

      apiService.post.mockRejectedValue(error);

      const result = await authService.login('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account locked');
    });
  });

  describe('logout', () => {
    it('calls backend logout endpoint', async () => {
      apiService.post.mockResolvedValue({ success: true });

      await authService.logout();

      expect(apiService.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('clears local auth data', async () => {
      localStorage.setItem('cryb_session_token', 'token');
      localStorage.setItem('user', 'user');

      apiService.post.mockResolvedValue({ success: true });

      await authService.logout();

      expect(localStorage.getItem('cryb_session_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('clears local auth data even if backend call fails', async () => {
      localStorage.setItem('cryb_session_token', 'token');

      apiService.post.mockRejectedValue(new Error('Network error'));

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(localStorage.getItem('cryb_session_token')).toBeNull();
    });

    it('returns success even with errors', async () => {
      apiService.post.mockRejectedValue(new Error('Error'));

      const result = await authService.logout();

      expect(result.success).toBe(true);
    });
  });

  describe('endpoints configuration', () => {
    it('has all required endpoints configured', () => {
      expect(authService.endpoints.register).toBe('/auth/register');
      expect(authService.endpoints.login).toBe('/auth/login');
      expect(authService.endpoints.logout).toBe('/auth/logout');
      expect(authService.endpoints.refresh).toBe('/auth/refresh');
      expect(authService.endpoints.profile).toBe('/auth/profile');
      expect(authService.endpoints.changePassword).toBe('/auth/change-password');
      expect(authService.endpoints.resetPassword).toBe('/auth/reset-password');
      expect(authService.endpoints.verifyEmail).toBe('/auth/verify-email');
      expect(authService.endpoints.resendVerification).toBe('/auth/resend-verification');
      expect(authService.endpoints.twoFactor).toBe('/2fa');
      expect(authService.endpoints.web3).toBe('/auth/web3');
    });
  });
});
