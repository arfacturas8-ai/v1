/**
 * Authentication API Integration Tests
 * Tests the complete authentication flow including JWT handling
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.cryb.ai';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

describe('Authentication API Integration', () => {
  let authToken = null;
  let userId = null;

  beforeAll(async () => {
    // Setup test environment
    console.log('Setting up authentication tests...');
  });

  afterAll(async () => {
    // Cleanup test data
    if (authToken && userId) {
      try {
        await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.warn('Failed to cleanup test user:', error.message);
      }
    }
  });

  beforeEach(() => {
    jest.setTimeout(30000);
  });

  describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: `testuser${Date.now()}`,
          displayName: 'Test User'
        })
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user).toHaveProperty('id');
      expect(data.user.email).toBe(TEST_EMAIL);

      // Store for cleanup
      authToken = data.token;
      userId = data.user.id;
    });

    test('should reject registration with invalid email', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: TEST_PASSWORD,
          username: 'testuser'
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('errors');
      expect(data.errors).toContain('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `weak-${Date.now()}@example.com`,
          password: '123',
          username: 'testuser'
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.errors).toContain('Password must be at least 8 characters');
    });

    test('should reject duplicate email registration', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL, // Same email as first test
          password: TEST_PASSWORD,
          username: `different${Date.now()}`
        })
      });

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('Email already exists');
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(TEST_EMAIL);

      // Verify JWT token format
      const tokenParts = data.token.split('.');
      expect(tokenParts).toHaveLength(3);

      authToken = data.token;
    });

    test('should reject login with invalid email', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: TEST_PASSWORD
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'wrong-password'
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('Invalid credentials');
    });

    test('should implement rate limiting for failed attempts', async () => {
      const promises = Array(6).fill().map(() => 
        fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: TEST_EMAIL,
            password: 'wrong-password'
          })
        })
      );

      const responses = await Promise.all(promises);
      const lastResponse = responses[responses.length - 1];
      
      expect(lastResponse.status).toBe(429);
      
      const data = await lastResponse.json();
      expect(data.message).toContain('Too many failed attempts');
    });
  });

  describe('Token Management', () => {
    test('should access protected routes with valid token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(TEST_EMAIL);
    });

    test('should reject access with invalid token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('Invalid token');
    });

    test('should reject access without token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('No token provided');
    });

    test('should refresh token successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('token');
      expect(data.token).not.toBe(authToken); // Should be a new token

      authToken = data.token;
    });
  });

  describe('Password Reset', () => {
    test('should request password reset', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('Password reset email sent');
    });

    test('should handle reset request for non-existent email', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com'
        })
      });

      // Should return success for security reasons (don't reveal if email exists)
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  describe('Logout', () => {
    test('should logout successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('Logged out successfully');
    });

    test('should invalidate token after logout', async () => {
      // Try to access protected route with the logged out token
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.message).toContain('Token has been revoked');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });

      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
      expect(response.headers.get('strict-transport-security')).toBeTruthy();
    });
  });
});