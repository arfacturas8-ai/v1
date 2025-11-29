
import authService from '../authService';

// Mock the API service
jest.mock('../api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('authService', () => {
  let apiMock;

  beforeEach(async () => {
    apiMock = (await import('../api')).default;
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'test-token', user: { id: '1', username: 'test' } },
      };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(apiMock.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle login failure', async () => {
      const mockError = { success: false, message: 'Invalid credentials' };
      apiMock.post.mockResolvedValue(mockError);

      const result = await authService.login('test@example.com', 'wrong');

      expect(result.success).toBe(false);
    });

    it('should store token on successful login', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'test-token', user: { id: '1' } },
      };
      apiMock.post.mockResolvedValue(mockResponse);

      await authService.login('test@example.com', 'password');

      expect(localStorage.getItem('token')).toBeTruthy();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'test-token', user: { id: '1', username: 'newuser' } },
      };
      apiMock.post.mockResolvedValue(mockResponse);

      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      const result = await authService.register(userData);

      expect(apiMock.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const mockError = { success: false, message: 'Username taken' };
      apiMock.post.mockResolvedValue(mockError);

      const result = await authService.register({
        username: 'taken',
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      localStorage.setItem('token', 'test-token');
      const mockResponse = { success: true };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(localStorage.getItem('token')).toBeFalsy();
    });

    it('should clear local storage on logout', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      await authService.logout();

      expect(localStorage.getItem('token')).toBeFalsy();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@example.com' };
      apiMock.get.mockResolvedValue({ success: true, data: mockUser });

      const result = await authService.getCurrentUser();

      expect(apiMock.get).toHaveBeenCalledWith('/auth/me');
      expect(result.data).toEqual(mockUser);
    });

    it('should handle unauthorized access', async () => {
      apiMock.get.mockResolvedValue({ success: false, message: 'Unauthorized' });

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = { success: true, data: { token: 'new-token' } };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(apiMock.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual(mockResponse);
    });

    it('should store new token', async () => {
      const mockResponse = { success: true, data: { token: 'new-token' } };
      apiMock.post.mockResolvedValue(mockResponse);

      await authService.refreshToken();

      expect(localStorage.getItem('token')).toBeTruthy();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const mockResponse = { success: true, message: 'Email sent' };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword('test@example.com');

      expect(apiMock.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockResponse = { success: true };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword('reset-token', 'newPassword123');

      expect(apiMock.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        password: 'newPassword123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      const mockResponse = { success: true };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyEmail('verify-token');

      expect(apiMock.post).toHaveBeenCalledWith('/auth/verify-email', {
        token: 'verify-token',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = { success: true };
      apiMock.put.mockResolvedValue(mockResponse);

      const result = await authService.changePassword('oldPass', 'newPass');

      expect(apiMock.put).toHaveBeenCalledWith('/auth/change-password', {
        oldPassword: 'oldPass',
        newPassword: 'newPass',
      });
      expect(result.success).toBe(true);
    });

    it('should handle incorrect old password', async () => {
      const mockError = { success: false, message: 'Incorrect password' };
      apiMock.put.mockResolvedValue(mockError);

      const result = await authService.changePassword('wrong', 'newPass');

      expect(result.success).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return stored token', () => {
      localStorage.setItem('token', 'test-token');

      const token = authService.getToken();

      expect(token).toBe('test-token');
    });

    it('should return null when no token', () => {
      const token = authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when no token', () => {
      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });
});
