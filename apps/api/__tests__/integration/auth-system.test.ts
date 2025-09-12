import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { generateNonce, generateSiweMessage } from '@cryb/web3';

describe('Authentication System Integration Tests', () => {
  let app: FastifyInstance;
  let testUser: any;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_chars_long_for_validation';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cryb_test';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
    
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id }
      }).catch(() => {}); // Ignore if already deleted
    }
    
    await app.close();
  });

  describe('Password-based Authentication', () => {
    const testUserData = {
      username: 'testuser' + Date.now(),
      displayName: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!'
    };

    it('should successfully register a new user with password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: testUserData
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user).toBeDefined();
      expect(body.data.user.username).toBe(testUserData.username);
      expect(body.data.user.email).toBe(testUserData.email);
      expect(body.data.tokens).toBeDefined();
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();

      testUser = body.data.user;
    });

    it('should reject registration with duplicate username', async () => {
      const duplicateUser = { ...testUserData, email: 'another' + Date.now() + '@example.com' };
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: duplicateUser
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.code).toBe('USERNAME_EXISTS');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        ...testUserData,
        username: 'weakuser' + Date.now(),
        email: 'weak' + Date.now() + '@example.com',
        password: '123',
        confirmPassword: '123'
      };
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: weakPasswordUser
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.code).toBe('WEAK_PASSWORD');
    });

    it('should successfully login with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: testUserData.username,
          password: testUserData.password
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user).toBeDefined();
      expect(body.data.tokens).toBeDefined();
      expect(body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: testUserData.username,
          password: 'WrongPassword123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: 'nonexistentuser123',
          password: 'SomePassword123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('JWT Token Management', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get tokens
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: testUser ? testUser.username : 'testuser',
          password: 'SecurePassword123!'
        }
      });

      const body = JSON.parse(response.body);
      accessToken = body.data.tokens.accessToken;
      refreshToken = body.data.tokens.refreshToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user).toBeDefined();
    });

    it('should reject access with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid_token_here'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();
      
      // Update tokens for subsequent tests
      accessToken = body.data.tokens.accessToken;
      refreshToken = body.data.tokens.refreshToken;
    });

    it('should successfully logout and invalidate tokens', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Token should now be invalid
      const protectedResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(protectedResponse.statusCode).toBe(401);
    });
  });

  describe('Web3 Authentication', () => {
    const walletAddress = '0x742d35Cc9097C6a5ED2B6785B82C1a7Cc3e3A6F8';
    
    it('should generate SIWE nonce and message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/web3/nonce',
        payload: {
          walletAddress
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.nonce).toBeDefined();
      expect(body.data.message).toBeDefined();
      expect(body.data.message).toContain(walletAddress);
      expect(body.data.expiresAt).toBeDefined();
    });

    it('should reject invalid wallet address format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/web3/nonce',
        payload: {
          walletAddress: 'invalid_address'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('OAuth Flow Endpoints', () => {
    it('should return OAuth authorization URL for Google', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/oauth/authorize/google'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.authUrl).toBeDefined();
      expect(body.data.authUrl).toContain('accounts.google.com');
      expect(body.data.state).toBeDefined();
      expect(body.data.provider).toBe('google');
    });

    it('should return OAuth authorization URL for Discord', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/oauth/authorize/discord'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.authUrl).toBeDefined();
      expect(body.data.authUrl).toContain('discord.com');
      expect(body.data.state).toBeDefined();
      expect(body.data.provider).toBe('discord');
    });

    it('should return OAuth authorization URL for GitHub', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/oauth/authorize/github'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.authUrl).toBeDefined();
      expect(body.data.authUrl).toContain('github.com');
      expect(body.data.state).toBeDefined();
      expect(body.data.provider).toBe('github');
    });

    it('should reject unsupported OAuth provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/oauth/authorize/facebook'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Session Management', () => {
    let sessionToken: string;

    beforeAll(async () => {
      // Create a new session
      const testUser = {
        username: 'sessiontest' + Date.now(),
        displayName: 'Session Test User',
        email: 'sessiontest' + Date.now() + '@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      };

      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: testUser
      });

      const body = JSON.parse(registerResponse.body);
      sessionToken = body.data.tokens.accessToken;
    });

    it('should get user sessions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/sessions',
        headers: {
          authorization: `Bearer ${sessionToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.sessions).toBeDefined();
      expect(Array.isArray(body.data.sessions)).toBe(true);
      expect(body.data.sessions.length).toBeGreaterThan(0);
    });

    it('should logout from all devices', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout-all',
        headers: {
          authorization: `Bearer ${sessionToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // All tokens should now be invalid
      const protectedResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${sessionToken}`
        }
      });

      expect(protectedResponse.statusCode).toBe(401);
    });
  });

  describe('Security Features', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const requests = Array(20).fill(null).map(() => 
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          payload: {
            username: 'nonexistent',
            password: 'wrong'
          }
        })
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should return proper security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid'
        }
      });

      // Check for security headers (these come from helmet middleware)
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: '{"malformed": json}',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should validate input schemas strictly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: '', // Too short
          displayName: '',
          email: 'not-an-email',
          password: '123' // Too weak
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.errors).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // This test would require mocking database failures
      // For now, we just ensure error responses are properly formatted
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: 'test',
          password: 'test'
        }
      });

      // Even with errors, response should be properly formatted JSON
      expect(() => JSON.parse(response.body)).not.toThrow();
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      
      if (!body.success) {
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
      }
    });

    it('should provide helpful validation error messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.errors).toBeDefined();
      expect(typeof body.errors).toBe('object');
    });
  });
});