// @jest imports are available globally
import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import authRoutes from '../../src/routes/auth';
import { mockDb, createMockUser, TEST_JWT_TOKEN } from '../setup';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify({ logger: false });
    
    // Mock validation middleware
    app.addHook('preHandler', async (request) => {
      request.userId = '1';
      request.user = createMockUser();
    });
    
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    test('should register user with valid email/password', async () => {
      const mockUser = createMockUser({
        username: 'newuser',
        email: 'newuser@example.com'
      });

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          username: 'newuser',
          displayName: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.username).toBe('newuser');
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();
    });

    test('should reject registration with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          username: 'newuser',
          displayName: 'New User',
          email: 'newuser@example.com',
          password: '123',
          confirmPassword: '123'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('WEAK_PASSWORD');
    });

    test('should reject registration with existing username', async () => {
      const existingUser = createMockUser({ username: 'testuser' });
      mockDb.user.findFirst.mockResolvedValue(existingUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('USERNAME_EXISTS');
    });

    test('should reject registration with invalid username format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          username: 'ab',
          displayName: 'Short Username',
          email: 'test@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_USERNAME_FORMAT');
    });

    test('should handle wallet registration', async () => {
      const mockUser = createMockUser({
        walletAddress: '0x1234567890123456789012345678901234567890'
      });

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          username: 'walletuser',
          displayName: 'Wallet User',
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: 'mock-signature',
          message: 'mock-message'
        }
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const mockUser = createMockUser();
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.username).toBe('testuser');
      expect(body.data.tokens.accessToken).toBeDefined();
    });

    test('should reject login with invalid credentials', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'nonexistent',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should handle wallet login', async () => {
      const mockUser = createMockUser({
        walletAddress: '0x1234567890123456789012345678901234567890'
      });
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: 'mock-signature',
          message: 'mock-message'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    test('should require authentication method', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NO_AUTH_METHOD');
    });
  });

  describe('POST /auth/web3/nonce', () => {
    test('should generate nonce for valid wallet address', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/web3/nonce',
        payload: {
          walletAddress: '0x1234567890123456789012345678901234567890'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.nonce).toBeDefined();
      expect(body.data.message).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
    });

    test('should reject invalid wallet address', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/web3/nonce',
        payload: {
          walletAddress: 'invalid-address'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('Invalid wallet address');
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh tokens with valid refresh token', async () => {
      const mockUser = createMockUser();
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();
    });

    test('should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should require refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully logged out');
    });

    test('should require authentication token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout-all', () => {
    test('should logout from all devices', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout-all',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully logged out from all devices');
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user profile', async () => {
      const mockUser = createMockUser();
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        _count: { servers: 5, posts: 10, comments: 25 }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.username).toBe('testuser');
      expect(body.data.user._count).toBeDefined();
    });

    test('should handle non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /auth/sessions', () => {
    test('should return active sessions', async () => {
      const mockSessions = [
        {
          id: '1',
          token: 'session-token-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000)
        },
        {
          id: '2',
          token: 'session-token-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000)
        }
      ];
      mockDb.session.findMany.mockResolvedValue(mockSessions);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/sessions',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.sessions).toHaveLength(2);
      expect(body.data.sessions[0].token).toContain('...');
    });
  });

  describe('DELETE /auth/sessions/:sessionId', () => {
    test('should delete specific session', async () => {
      mockDb.session.deleteMany.mockResolvedValue({ count: 1 });

      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/sessions/session-1',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Session deleted successfully');
    });

    test('should handle non-existent session', async () => {
      mockDb.session.deleteMany.mockResolvedValue({ count: 0 });

      const response = await app.inject({
        method: 'DELETE',
        url: '/auth/sessions/non-existent',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should handle forgot password request', async () => {
      const mockUser = createMockUser();
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/forgot-password',
        payload: {
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('password reset instructions');
    });

    test('should handle non-existent email', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/forgot-password',
        payload: {
          email: 'nonexistent@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    test('should reject invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/forgot-password',
        payload: {
          email: 'invalid-email'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_EMAIL');
    });
  });

  describe('POST /auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: {
          token: 'valid-reset-token',
          password: 'NewSecurePass123!',
          confirmPassword: 'NewSecurePass123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('reset successfully');
    });

    test('should reject mismatched passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: {
          token: 'valid-reset-token',
          password: 'NewSecurePass123!',
          confirmPassword: 'DifferentPass123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('PASSWORD_MISMATCH');
    });
  });

  describe('POST /auth/verify-email', () => {
    test('should verify email with valid token', async () => {
      const mockUser = createMockUser({ isVerified: false });
      mockDb.user.update.mockResolvedValue({ ...mockUser, isVerified: true });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: {
          token: 'valid-verification-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Email verified successfully');
    });

    test('should require verification token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('TOKEN_REQUIRED');
    });
  });

  describe('POST /auth/resend-verification', () => {
    test('should resend verification email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/resend-verification',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Verification email sent successfully');
    });
  });

  describe('OAuth Routes', () => {
    test('GET /auth/oauth/:provider/authorize should redirect to OAuth provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/oauth/google/authorize'
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
    });

    test('should reject unsupported OAuth provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/oauth/unsupported/authorize'
      });

      expect(response.statusCode).toBe(400);
    });
  });
});