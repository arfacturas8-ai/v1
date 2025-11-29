const request = require('supertest');
const { app } = require('../../apps/api/src/app');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

describe('OWASP Top 10 Security Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Create test user for authenticated security tests
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'securitytest',
        email: 'security@test.com',
        password: 'SecurePassword123!',
        displayName: 'Security Test User'
      });
    
    testUserId = userResponse.body.user?.id;
    authToken = userResponse.body.token;
  });

  describe('A01:2021 - Broken Access Control', () => {
    test('should prevent unauthorized access to protected routes', async () => {
      const protectedRoutes = [
        '/api/users/profile',
        '/api/posts',
        '/api/admin/users',
        '/api/admin/analytics',
        '/api/moderation/reports'
      ];

      for (const route of protectedRoutes) {
        const response = await request(app).get(route);
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should prevent horizontal privilege escalation', async () => {
      // Try to access another user's private data
      const otherUserId = testUserId + 1;
      
      const response = await request(app)
        .get(`/api/users/${otherUserId}/private`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should prevent vertical privilege escalation', async () => {
      // Try to access admin-only endpoints with regular user token
      const adminRoutes = [
        '/api/admin/users',
        '/api/admin/delete-user',
        '/api/admin/platform-stats',
        '/api/admin/system-config'
      ];

      for (const route of adminRoutes) {
        const response = await request(app)
          .get(route)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.status).toBe(403);
      }
    });

    test('should validate JWT token integrity', async () => {
      // Test with tampered token
      const tamperedToken = authToken.slice(0, -5) + 'XXXXX';
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${tamperedToken}`);
      
      expect(response.status).toBe(401);
    });

    test('should prevent IDOR (Insecure Direct Object References)', async () => {
      // Try to access posts/comments with sequential IDs
      const testIds = ['1', '9999', '../admin', '%2e%2e%2fadmin'];
      
      for (const id of testIds) {
        const response = await request(app)
          .get(`/api/posts/${id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        // Should return 404 for non-existent resources, not expose data
        if (response.status !== 200) {
          expect([404, 400]).toContain(response.status);
        }
      }
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    test('should enforce HTTPS headers', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    test('should not expose sensitive information in responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security@test.com',
          password: 'SecurePassword123!'
        });
      
      expect(response.body.user?.password).toBeUndefined();
      expect(response.body.user?.passwordHash).toBeUndefined();
      expect(response.body.user?.salt).toBeUndefined();
    });

    test('should hash passwords securely', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'cryptotest',
          email: 'crypto@test.com', 
          password: 'TestPassword123!',
          displayName: 'Crypto Test'
        });
      
      expect(response.status).toBe(201);
      // Password should never be returned
      expect(response.body.user?.password).toBeUndefined();
    });

    test('should use secure session management', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security@test.com',
          password: 'SecurePassword123!'
        });
      
      // Check for secure cookie attributes
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookies.forEach(cookie => {
          if (cookie.includes('session') || cookie.includes('token')) {
            expect(cookie).toMatch(/httponly/i);
            expect(cookie).toMatch(/secure/i);
            expect(cookie).toMatch(/samesite/i);
          }
        });
      }
    });
  });

  describe('A03:2021 - Injection', () => {
    test('should prevent SQL injection in search queries', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (username, password) VALUES ('hacker', 'pwd'); --",
        "' UNION SELECT password FROM users WHERE '1'='1",
        "%'; DROP TABLE posts; --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/search/posts')
          .query({ q: payload })
          .set('Authorization', `Bearer ${authToken}`);
        
        // Should not cause database errors or return unexpected data
        expect([200, 400]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.results).toBeDefined();
        }
      }
    });

    test('should prevent NoSQL injection', async () => {
      const noSqlPayloads = [
        { "$gt": "" },
        { "$ne": null },
        { "$where": "this.username == this.password" },
        { "$regex": ".*" }
      ];

      for (const payload of noSqlPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anypassword'
          });
        
        expect(response.status).toBe(400);
      }
    });

    test('should prevent command injection', async () => {
      const commandInjectionPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(id)',
        '&& rm -rf /',
        '; ping 127.0.0.1'
      ];

      for (const payload of commandInjectionPayloads) {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Test Post ${payload}`,
            content: `Content with payload: ${payload}`,
            type: 'text',
            communityId: '1'
          });
        
        // Commands should be treated as literal text, not executed
        if (response.status === 201) {
          expect(response.body.post.title).toContain(payload);
        }
      }
    });

    test('should sanitize XSS payloads in content', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'XSS Test Post',
            content: payload,
            type: 'text',
            communityId: '1'
          });
        
        if (response.status === 201) {
          // Content should be sanitized or escaped
          expect(response.body.post.content).not.toMatch(/<script|javascript:/i);
        }
      }
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    test('should implement rate limiting', async () => {
      const promises = [];
      
      // Attempt 20 rapid requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@test.com',
              password: 'wrongpassword'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate business logic for voting', async () => {
      // Create a post first
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Voting Logic Test',
          content: 'Testing voting business logic',
          type: 'text',
          communityId: '1'
        });
      
      const postId = postResponse.body.post?.id;
      
      if (postId) {
        // Try to vote multiple times (should be prevented)
        await request(app)
          .post(`/api/posts/${postId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ voteType: 'upvote' });
        
        const secondVote = await request(app)
          .post(`/api/posts/${postId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ voteType: 'upvote' });
        
        // Should prevent duplicate votes or handle them properly
        expect([200, 400, 409]).toContain(secondVote.status);
      }
    });

    test('should validate file upload restrictions', async () => {
      const maliciousFiles = [
        { filename: 'test.exe', content: 'MZ\x90\x00', mimetype: 'application/octet-stream' },
        { filename: 'test.php', content: '<?php system($_GET["cmd"]); ?>', mimetype: 'application/x-php' },
        { filename: 'test.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', mimetype: 'text/plain' },
        { filename: 'test.js', content: 'require("child_process").exec("rm -rf /");', mimetype: 'application/javascript' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/upload/file')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from(file.content), {
            filename: file.filename,
            contentType: file.mimetype
          });
        
        // Should reject dangerous file types
        expect([400, 415]).toContain(response.status);
      }
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    test('should not expose server information', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers.server).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should have proper security headers', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should not expose debug information', async () => {
      const response = await request(app).get('/api/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.stack).toBeUndefined();
      expect(response.body.trace).toBeUndefined();
    });

    test('should handle errors gracefully without information disclosure', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'This should cause an error'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).not.toMatch(/internal|system|database|sql/i);
    });
  });

  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    test('should use secure dependency versions', () => {
      const packageJson = require('../../apps/api/package.json');
      
      // Check for known vulnerable packages (this would be automated in real testing)
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Example checks for commonly vulnerable packages
      if (dependencies.lodash) {
        const version = dependencies.lodash.replace(/[^\d.]/g, '');
        const [major, minor, patch] = version.split('.').map(Number);
        
        // Check if version is above known vulnerable versions
        expect(major).toBeGreaterThanOrEqual(4);
        if (major === 4 && minor < 17) {
          expect(patch).toBeGreaterThanOrEqual(21);
        }
      }
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    test('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'qwerty',
        'admin',
        'letmein',
        'password123'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `weakuser${Math.random()}`,
            email: `weak${Math.random()}@test.com`,
            password,
            displayName: 'Weak User'
          });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/password|strength|requirements/i);
      }
    });

    test('should prevent brute force attacks', async () => {
      const attempts = [];
      
      // Try multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'security@test.com',
              password: 'wrongpassword'
            })
        );
      }
      
      const responses = await Promise.all(attempts);
      const blockedResponses = responses.filter(r => r.status === 429 || r.status === 423);
      
      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    test('should invalidate sessions on logout', async () => {
      // Login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security@test.com',
          password: 'SecurePassword123!'
        });
      
      const token = loginResponse.body.token;
      
      // Use token to access protected route
      const protectedResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(protectedResponse.status).toBe(200);
      
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      // Try to use token again (should fail)
      const afterLogoutResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(afterLogoutResponse.status).toBe(401);
    });

    test('should implement account lockout after failed attempts', async () => {
      const testEmail = 'lockout@test.com';
      
      // Register test user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'lockoutuser',
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'Lockout Test'
        });
      
      // Multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: 'wrongpassword'
          });
      }
      
      // Next attempt should be blocked even with correct password
      const lockedResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'SecurePassword123!'
        });
      
      expect([423, 429]).toContain(lockedResponse.status);
    });
  });

  describe('A08:2021 - Software and Data Integrity Failures', () => {
    test('should validate JWT signature', async () => {
      // Create malicious token with wrong signature
      const payload = { userId: testUserId, email: 'security@test.com' };
      const maliciousToken = jwt.sign(payload, 'wrong-secret');
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${maliciousToken}`);
      
      expect(response.status).toBe(401);
    });

    test('should validate data integrity in critical operations', async () => {
      // Try to manipulate post data during creation
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integrity Test',
          content: 'Testing data integrity',
          type: 'text',
          communityId: '1',
          score: 9999999, // Should not be settable by user
          authorId: 'different-user-id' // Should not be settable by user
        });
      
      if (response.status === 201) {
        expect(response.body.post.score).toBe(0); // Should default to 0
        expect(response.body.post.authorId).toBe(testUserId); // Should use authenticated user
      }
    });
  });

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    test('should log security events', async () => {
      // This would typically check log files or monitoring systems
      // For demo purposes, we'll verify failed login attempts are handled
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should detect suspicious patterns', async () => {
      // Rapid requests from same source (basic detection)
      const rapidRequests = [];
      
      for (let i = 0; i < 15; i++) {
        rapidRequests.push(
          request(app)
            .get('/api/posts')
            .set('User-Agent', 'SuspiciousBot/1.0')
        );
      }
      
      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
    test('should prevent SSRF in URL fields', async () => {
      const ssrfPayloads = [
        'http://localhost:22',
        'http://127.0.0.1:3306',
        'http://169.254.169.254/latest/meta-data/',
        'file:///etc/passwd',
        'ftp://internal-server/',
        'gopher://127.0.0.1:25/'
      ];

      for (const payload of ssrfPayloads) {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'SSRF Test',
            content: 'Testing SSRF prevention',
            type: 'link',
            url: payload,
            communityId: '1'
          });
        
        // Should either reject the URL or sanitize it
        if (response.status === 201) {
          expect(response.body.post.url).not.toBe(payload);
        } else {
          expect([400, 422]).toContain(response.status);
        }
      }
    });

    test('should validate webhook URLs', async () => {
      const maliciousUrls = [
        'http://localhost:5432',
        'http://internal-database:3306',
        'https://169.254.169.254/latest/meta-data/iam/security-credentials/',
        'file:///etc/shadow'
      ];

      for (const url of maliciousUrls) {
        const response = await request(app)
          .post('/api/webhooks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url,
            events: ['post.created']
          });
        
        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Additional Security Tests', () => {
    test('should prevent timing attacks on user enumeration', async () => {
      const existingEmail = 'security@test.com';
      const nonExistentEmail = 'nonexistent@test.com';
      
      const times = [];
      
      // Test multiple times to get average
      for (let i = 0; i < 5; i++) {
        const start1 = Date.now();
        await request(app)
          .post('/api/auth/login')
          .send({ email: existingEmail, password: 'wrongpassword' });
        const time1 = Date.now() - start1;
        
        const start2 = Date.now();
        await request(app)
          .post('/api/auth/login')
          .send({ email: nonExistentEmail, password: 'wrongpassword' });
        const time2 = Date.now() - start2;
        
        times.push({ existing: time1, nonExistent: time2 });
      }
      
      // Response times should be similar (within reasonable variance)
      const avgExisting = times.reduce((sum, t) => sum + t.existing, 0) / times.length;
      const avgNonExistent = times.reduce((sum, t) => sum + t.nonExistent, 0) / times.length;
      const difference = Math.abs(avgExisting - avgNonExistent);
      
      // Allow up to 100ms difference to account for network variance
      expect(difference).toBeLessThan(100);
    });

    test('should prevent mass assignment vulnerabilities', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Name',
          isAdmin: true, // Should not be assignable
          role: 'admin', // Should not be assignable
          karma: 999999, // Should not be assignable
          verified: true // Should not be assignable
        });
      
      if (response.status === 200) {
        expect(response.body.user.displayName).toBe('Updated Name');
        expect(response.body.user.isAdmin).not.toBe(true);
        expect(response.body.user.role).not.toBe('admin');
        expect(response.body.user.karma).not.toBe(999999);
      }
    });

    test('should implement Content Security Policy', async () => {
      const response = await request(app).get('/');
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toMatch(/default-src/);
      expect(csp).toMatch(/script-src/);
      expect(csp).toMatch(/style-src/);
    });

    test('should prevent clickjacking attacks', async () => {
      const response = await request(app).get('/');
      
      const frameOptions = response.headers['x-frame-options'];
      expect(['DENY', 'SAMEORIGIN'].includes(frameOptions)).toBe(true);
    });
  });
});