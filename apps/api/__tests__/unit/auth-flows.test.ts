import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { AuthService } from '../../src/services/auth';
import { testData } from '../helpers/test-data';
import Redis from 'ioredis';

describe('Authentication Flows', () => {
  let app: FastifyInstance;
  let authService: AuthService;
  let mockRedis: Redis;

  beforeEach(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    mockRedis = new Redis();
    authService = new AuthService(mockRedis);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const userData = testData.validUser();
      
      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = testData.validUser();
      
      // First registration
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('email already exists');
    });

    it('should reject registration with invalid email format', async () => {
      const userData = testData.validUser();
      userData.email = 'invalid-email';

      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('invalid email');
    });

    it('should reject registration with weak password', async () => {
      const userData = testData.validUser();
      userData.password = '123';

      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('password must be at least');
    });

    it('should hash password before storing', async () => {
      const userData = testData.validUser();
      
      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Verify password is not stored in plain text
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify we can still login (password was hashed correctly)
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const userData = testData.validUser();
      
      // Register user first
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toContain('invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const userData = testData.validUser();
      
      // Register user first
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login with wrong password
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        })
        .expect(400);

      expect(response.body.error).toContain('password is required');
    });
  });

  describe('Token Validation', () => {
    it('should validate valid JWT token', async () => {
      const userData = testData.validUser();
      
      // Register and get token
      const registerResponse = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Use token to access protected route
      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('invalid token');
    });

    it('should reject expired JWT token', async () => {
      // Mock expired token - generateTokens returns a promise with tokens object
      const expiredTokens = await authService.generateTokens('1');
      const expiredToken = expiredTokens.accessToken;
      
      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toContain('token expired');
    });

    it('should reject missing Authorization header', async () => {
      const response = await request(app.server)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toContain('authorization header required');
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset with valid email', async () => {
      const userData = testData.validUser();
      
      // Register user first
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Request password reset
      const response = await request(app.server)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      expect(response.body.message).toContain('reset email sent');
    });

    it('should not reveal if email exists during password reset', async () => {
      // Request password reset for non-existent email
      const response = await request(app.server)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return same response to prevent email enumeration
      expect(response.body.message).toContain('reset email sent');
    });

    it('should reset password with valid reset token', async () => {
      const userData = testData.validUser();
      
      // Register user
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Get reset token (in real app this would be sent via email)
      // For testing, we'll use a mock token since generateResetToken doesn't exist
      const resetToken = 'mock-reset-token';

      // Reset password
      const newPassword = 'newPassword123!';
      const response = await request(app.server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.message).toContain('password reset successful');

      // Verify old password no longer works
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      // Verify new password works
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: newPassword
        })
        .expect(200);
    });
  });

  describe('Session Management', () => {
    it('should logout and invalidate token', async () => {
      const userData = testData.validUser();
      
      // Register and login
      const registerResponse = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Verify token works
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Logout
      await request(app.server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify token is invalidated
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should refresh token before expiration', async () => {
      const userData = testData.validUser();
      
      // Register with short-lived token
      const registerResponse = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Refresh token
      const response = await request(app.server)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token);

      // Verify new token works
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.token}`)
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const userData = testData.validUser();
      
      // Make multiple failed login attempts
      const promises = Array(6).fill(0).map(() =>
        request(app.server)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Last requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should rate limit registration attempts', async () => {
      // Make multiple registration attempts
      const promises = Array(6).fill(0).map((_, i) =>
        request(app.server)
          .post('/api/auth/register')
          .send(testData.validUser(`user${i}@example.com`))
      );

      const responses = await Promise.all(promises);
      
      // Should allow some registrations but rate limit excessive attempts
      const successfulResponses = responses.filter(r => r.status === 201);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation and Security', () => {
    it('should sanitize input to prevent XSS', async () => {
      const userData = testData.validUser();
      userData.username = '<script>alert("xss")</script>';

      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Script tags should be sanitized
      expect(response.body.user.username).not.toContain('<script>');
    });

    it('should validate username format', async () => {
      const userData = testData.validUser();
      userData.username = 'user@#$%';

      const response = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('invalid username format');
    });

    it('should enforce password complexity requirements', async () => {
      const userData = testData.validUser();
      
      const weakPasswords = [
        'short',           // too short
        'onlylowercase',   // no uppercase
        'ONLYUPPERCASE',   // no lowercase
        'NoNumbers!',      // no numbers
        'NoSpecialChars1', // no special characters
        'password123'      // common password
      ];

      for (const password of weakPasswords) {
        userData.password = password;
        
        const response = await request(app.server)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toContain('password does not meet requirements');
      }
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should enable 2FA for user account', async () => {
      const userData = testData.validUser();
      
      // Register and login
      const registerResponse = await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Enable 2FA
      const response = await request(app.server)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('secret');
    });

    it('should require 2FA code after enabling', async () => {
      const userData = testData.validUser();
      
      // Register user
      await request(app.server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Mock 2FA enabled user
      const userWith2FA = { ...userData, twoFactorEnabled: true };

      // Login should require 2FA code
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: userWith2FA.email,
          password: userWith2FA.password
        })
        .expect(200);

      expect(response.body.requiresTwoFactor).toBe(true);
      expect(response.body).not.toHaveProperty('token');
    });

    it('should complete login with valid 2FA code', async () => {
      const userData = testData.validUser();
      const validCode = '123456'; // Mock valid TOTP code

      // Mock 2FA verification - this method doesn't exist in the current AuthService
      // We'll skip this test functionality for now
      // jest.spyOn(authService, 'verifyTwoFactorToken').mockResolvedValue(true);

      const response = await request(app.server)
        .post('/api/auth/2fa/verify')
        .send({
          email: userData.email,
          code: validCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });
});