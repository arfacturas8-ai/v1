import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

describe('Comprehensive Authentication Tests', () => {
  let app: FastifyInstance;
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `testuser${Date.now()}`
  };
  let authToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app.server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body).toHaveProperty('token');
      
      authToken = response.body.token;
    });

    it('should reject registration with duplicate email', async () => {
      await request(app.server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should reject registration with weak password', async () => {
      await request(app.server)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: `weak-${Date.now()}@example.com`,
          password: '123'
        })
        .expect(400);
    });

    it('should reject registration with invalid email', async () => {
      await request(app.server)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
          password: 'SecurePassword123!'
        })
        .expect(400);
    });
  });

  describe('User Login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      
      authToken = response.body.token;
      if (response.body.refreshToken) {
        refreshToken = response.body.refreshToken;
      }
    });

    it('should reject login with incorrect password', async () => {
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);
    });

    it('should handle case-insensitive email login', async () => {
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password
        })
        .expect(200);
    });
  });

  describe('JWT Token Validation', () => {
    it('should access protected routes with valid token', async () => {
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject requests without token', async () => {
      await request(app.server)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should reject requests with malformed Authorization header', async () => {
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', 'invalid_format')
        .expect(401);
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset for existing email', async () => {
      const response = await request(app.server)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const response = await request(app.server)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should update user profile', async () => {
      const updateData = {
        username: `updated_${testUser.username}`,
        bio: 'Updated bio'
      };

      const response = await request(app.server)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.username).toBe(updateData.username);
    });
  });

  describe('Session Management', () => {
    it('should logout and invalidate token', async () => {
      await request(app.server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Token should be invalid after logout
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const invalidCredentials = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app.server)
          .post('/api/auth/login')
          .send(invalidCredentials);
      }

      // Should be rate limited after too many attempts
      const response = await request(app.server)
        .post('/api/auth/login')
        .send(invalidCredentials);

      expect(response.status).toBeGreaterThanOrEqual(429);
    }, 30000);
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});