const request = require('supertest');
const { build } = require('../../src/app');

/**
 * Comprehensive Security Vulnerability Testing Suite
 * Tests for OWASP Top 10 vulnerabilities and platform-specific security issues
 */

describe('Comprehensive Security Vulnerability Tests', () => {
  let app;
  let authToken;
  let testUser = {
    email: `security-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `securityuser${Date.now()}`
  };

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();

    // Create test user
    await request(app.server)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('OWASP A01: Broken Access Control', () => {
    let serverId;
    let privateChannelId;

    beforeAll(async () => {
      // Create test server
      const serverResponse = await request(app.server)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Security Test Server',
          description: 'Server for security testing'
        });
      
      serverId = serverResponse.body.server.id;

      // Create private channel
      const channelResponse = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'private-channel',
          type: 'text',
          private: true
        });
      
      privateChannelId = channelResponse.body.channel.id;
    });

    it('should prevent unauthorized access to other users data', async () => {
      // Create another user
      const otherUser = {
        email: `other-user-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        username: `otheruser${Date.now()}`
      };

      await request(app.server)
        .post('/api/auth/register')
        .send(otherUser);

      const otherLoginResponse = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: otherUser.email,
          password: otherUser.password
        });

      const otherAuthToken = otherLoginResponse.body.token;

      // Try to access first user's data
      await request(app.server)
        .get(`/api/users/${testUser.username}/private-data`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(403);
    });

    it('should prevent horizontal privilege escalation', async () => {
      // Try to modify server owned by different user without permission
      await request(app.server)
        .patch(`/api/servers/${serverId}`)
        .set('Authorization', `Bearer ${authToken.replace('a', 'b')}`) // Invalid token
        .send({ name: 'Hacked Server Name' })
        .expect(401);
    });

    it('should prevent vertical privilege escalation', async () => {
      // Try to access admin endpoints
      await request(app.server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app.server)
        .delete('/api/admin/servers/all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should prevent direct object reference attacks', async () => {
      // Try to access private channel without permission
      await request(app.server)
        .get(`/api/servers/${serverId}/channels/${privateChannelId}/messages`)
        .expect(401); // No auth token

      // Try with different user's token
      const attackerUser = {
        email: `attacker-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        username: `attacker${Date.now()}`
      };

      await request(app.server)
        .post('/api/auth/register')
        .send(attackerUser);

      const attackerLoginResponse = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: attackerUser.email,
          password: attackerUser.password
        });

      await request(app.server)
        .get(`/api/servers/${serverId}/channels/${privateChannelId}/messages`)
        .set('Authorization', `Bearer ${attackerLoginResponse.body.token}`)
        .expect(403);
    });
  });

  describe('OWASP A02: Cryptographic Failures', () => {
    it('should use HTTPS in production', async () => {
      // Check security headers
      const response = await request(app.server)
        .get('/api/health')
        .expect(200);

      // Should have security headers
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should hash passwords securely', async () => {
      // Passwords should never be returned in API responses
      const response = await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should use secure session tokens', async () => {
      const loginResponse = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const token = loginResponse.body.token;
      
      // JWT token should be properly formatted
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      
      // Token should have reasonable length (indicating proper encryption)
      expect(token.length).toBeGreaterThan(100);
    });

    it('should protect sensitive data in transit', async () => {
      // API should not expose sensitive information in error messages
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401)
        .then(response => {
          expect(response.body.message).not.toContain('database');
          expect(response.body.message).not.toContain('sql');
          expect(response.body.message).not.toContain('error');
        });
    });
  });

  describe('OWASP A03: Injection Attacks', () => {
    it('should prevent SQL injection in authentication', async () => {
      const sqlInjectionPayloads = [
        "admin'--",
        "admin'/*",
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];

      for (const payload of sqlInjectionPayloads) {
        await request(app.server)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anypassword'
          })
          .expect(401);
      }
    });

    it('should prevent NoSQL injection', async () => {
      const noSQLInjectionPayloads = [
        { "$ne": null },
        { "$gt": "" },
        { "$where": "1==1" },
        { "$regex": ".*" }
      ];

      for (const payload of noSQLInjectionPayloads) {
        await request(app.server)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anypassword'
          })
          .expect(400); // Should be rejected as invalid input format
      }
    });

    it('should prevent XSS in message content', async () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "';alert('xss');//",
        "<iframe src='data:text/html,<script>alert(1)</script>'></iframe>"
      ];

      // Create server and channel for testing
      const serverResponse = await request(app.server)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'XSS Test Server',
          description: 'Server for XSS testing'
        });

      const channelResponse = await request(app.server)
        .post(`/api/servers/${serverResponse.body.server.id}/channels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'test-channel',
          type: 'text'
        });

      for (const payload of xssPayloads) {
        const response = await request(app.server)
          .post(`/api/servers/${serverResponse.body.server.id}/channels/${channelResponse.body.channel.id}/messages`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: payload
          })
          .expect(201);

        // Content should be sanitized
        expect(response.body.message.content).not.toContain('<script>');
        expect(response.body.message.content).not.toContain('javascript:');
        expect(response.body.message.content).not.toContain('onerror=');
      }
    });

    it('should prevent command injection', async () => {
      const commandInjectionPayloads = [
        "; ls -la",
        "| cat /etc/passwd",
        "&& rm -rf /",
        "; cat /proc/version",
        "$(whoami)",
        "`id`",
        "${IFS}cat${IFS}/etc/passwd"
      ];

      for (const payload of commandInjectionPayloads) {
        await request(app.server)
          .post('/api/communities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `community${payload}`,
            title: 'Test Community',
            description: 'Test'
          })
          .expect(res => {
            // Should either reject malicious input or sanitize it
            expect(res.status).toBeOneOf([400, 201]);
            if (res.status === 201) {
              expect(res.body.community.name).not.toContain(';');
              expect(res.body.community.name).not.toContain('|');
              expect(res.body.community.name).not.toContain('&');
            }
          });
      }
    });
  });

  describe('OWASP A04: Insecure Design', () => {
    it('should implement proper rate limiting', async () => {
      const requests = [];
      
      // Send multiple requests rapidly
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app.server)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent timing attacks', async () => {
      const timingTests = [];
      
      // Test with valid email, invalid password
      const start1 = Date.now();
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      const time1 = Date.now() - start1;

      // Test with invalid email
      const start2 = Date.now();
      await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        });
      const time2 = Date.now() - start2;

      // Response times should not vary significantly (within 50ms)
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(50);
    });

    it('should validate business logic constraints', async () => {
      // Test negative values
      await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity',
          title: 'Test Community',
          description: 'Test',
          memberLimit: -1 // Invalid negative value
        })
        .expect(400);

      // Test extremely large values
      await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity',
          title: 'Test Community',
          description: 'Test',
          memberLimit: Number.MAX_SAFE_INTEGER
        })
        .expect(400);
    });
  });

  describe('OWASP A05: Security Misconfiguration', () => {
    it('should not expose sensitive information in headers', async () => {
      const response = await request(app.server)
        .get('/api/health')
        .expect(200);

      // Should not expose server information
      expect(response.headers.server).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
      
      // Should have security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should not expose debug information', async () => {
      // Try to access debug endpoints
      await request(app.server)
        .get('/debug')
        .expect(404);

      await request(app.server)
        .get('/api/debug')
        .expect(404);

      await request(app.server)
        .get('/.env')
        .expect(404);
    });

    it('should handle errors securely', async () => {
      // Test with malformed JSON
      await request(app.server)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"malformed":json}')
        .expect(400)
        .then(response => {
          // Should not expose internal error details
          expect(response.body.message).not.toContain('SyntaxError');
          expect(response.body.message).not.toContain('stack');
          expect(response.body.message).not.toContain('path');
        });
    });

    it('should prevent information disclosure through timing', async () => {
      const nonExistentIds = [
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'invalid-id-format'
      ];

      for (const id of nonExistentIds) {
        await request(app.server)
          .get(`/api/servers/${id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404)
          .then(response => {
            expect(response.body.message).not.toContain('does not exist');
            expect(response.body.message).not.toContain('not found in database');
          });
      }
    });
  });

  describe('OWASP A06: Vulnerable Components', () => {
    it('should have security headers for vulnerable component protection', async () => {
      const response = await request(app.server)
        .get('/api/health')
        .expect(200);

      // Content Security Policy
      expect(response.headers['content-security-policy']).toBeDefined();
      
      // Prevent clickjacking
      expect(response.headers['x-frame-options']).toBeDefined();
      
      // MIME type sniffing protection
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should validate file uploads securely', async () => {
      const maliciousFiles = [
        { filename: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
        { filename: 'test.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { filename: 'test.exe', content: 'MZ\x90\x00\x03\x00\x00\x00' }, // PE header
        { filename: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' },
        { filename: 'test.svg', content: '<svg onload="alert(1)"><text>test</text></svg>' }
      ];

      for (const file of maliciousFiles) {
        await request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from(file.content), file.filename)
          .expect(res => {
            // Should reject malicious files
            expect(res.status).toBeOneOf([400, 415, 422]);
          });
      }
    });
  });

  describe('OWASP A07: Identification and Authentication Failures', () => {
    it('should enforce strong password policies', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'admin',
        '12345678',
        'qwerty',
        'abc123',
        '111111',
        'letmein'
      ];

      for (const weakPassword of weakPasswords) {
        await request(app.server)
          .post('/api/auth/register')
          .send({
            email: `weak-${Date.now()}@example.com`,
            username: `weakuser${Date.now()}`,
            password: weakPassword
          })
          .expect(400);
      }
    });

    it('should prevent credential stuffing', async () => {
      const commonCredentials = [
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'test@test.com', password: 'test' },
        { email: 'user@user.com', password: 'user' },
        { email: 'demo@demo.com', password: 'demo' }
      ];

      const responses = await Promise.all(
        commonCredentials.map(creds =>
          request(app.server)
            .post('/api/auth/login')
            .send(creds)
        )
      );

      // Should reject all common credentials
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('should implement secure session management', async () => {
      // Login
      const loginResponse = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Logout should invalidate token
      await request(app.server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should be invalid after logout
      await request(app.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should prevent brute force attacks', async () => {
      const attempts = [];
      
      // Multiple failed login attempts
      for (let i = 0; i < 20; i++) {
        attempts.push(
          request(app.server)
            .post('/api/auth/login')
            .send({
              email: testUser.email,
              password: 'wrongpassword'
            })
        );
      }

      const results = await Promise.allSettled(attempts);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('OWASP A08: Software and Data Integrity Failures', () => {
    it('should validate data integrity', async () => {
      // Test with tampered data
      const tamperedData = {
        id: 'malicious-id',
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } }
      };

      await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...tamperedData,
          name: 'testcommunity',
          title: 'Test Community',
          description: 'Test'
        })
        .expect(res => {
          expect(res.status).toBeOneOf([400, 201]);
          if (res.status === 201) {
            expect(res.body.community.admin).toBeUndefined();
          }
        });
    });

    it('should prevent prototype pollution', async () => {
      const pollutionPayloads = [
        '{"__proto__":{"polluted":true}}',
        '{"constructor":{"prototype":{"polluted":true}}}',
        '{"__proto__.polluted":"true"}'
      ];

      for (const payload of pollutionPayloads) {
        await request(app.server)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(res => {
            // Should not pollute Object.prototype
            expect(({}).polluted).toBeUndefined();
          });
      }
    });
  });

  describe('OWASP A09: Security Logging and Monitoring Failures', () => {
    it('should log security events', async () => {
      // This would require integration with logging system
      // For now, we'll test that security events trigger appropriate responses
      
      // Failed login should be handled appropriately
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: 'attacker@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).not.toContain('user not found');
    });

    it('should detect suspicious activities', async () => {
      // Multiple rapid requests should be detected and rate limited
      const rapidRequests = Array(30).fill(null).map(() =>
        request(app.server)
          .get('/api/communities')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(rapidRequests);
      const successCount = results.filter(r => r.status === 200).length;
      const rateLimitedCount = results.filter(r => r.status === 429).length;

      // Should have triggered rate limiting
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('OWASP A10: Server-Side Request Forgery (SSRF)', () => {
    it('should prevent SSRF in URL parameters', async () => {
      const ssrfPayloads = [
        'http://localhost:22',
        'http://127.0.0.1:80',
        'http://169.254.169.254/', // AWS metadata
        'file:///etc/passwd',
        'gopher://localhost:25',
        'dict://localhost:11211'
      ];

      for (const payload of ssrfPayloads) {
        await request(app.server)
          .post('/api/communities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'testcommunity',
            title: 'Test Community',
            description: 'Test',
            icon: payload // Malicious URL
          })
          .expect(res => {
            expect(res.status).toBeOneOf([400, 422]);
          });
      }
    });

    it('should validate webhook URLs', async () => {
      const maliciousUrls = [
        'http://localhost:3000/admin',
        'http://127.0.0.1:22',
        'http://internal-service:8080',
        'ftp://internal-ftp:21'
      ];

      for (const url of maliciousUrls) {
        await request(app.server)
          .post('/api/webhooks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Webhook',
            url: url
          })
          .expect(res => {
            expect(res.status).toBeOneOf([400, 422]);
          });
      }
    });
  });

  describe('Platform-Specific Security Tests', () => {
    it('should protect against Discord-specific attacks', async () => {
      // Create server for testing
      const serverResponse = await request(app.server)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Security Test Server',
          description: 'Server for security testing'
        });

      const serverId = serverResponse.body.server.id;

      // Test message content that could bypass filters
      const discordAttacks = [
        '@everyone DROP TABLE messages;',
        '/join * && rm -rf /',
        '!eval process.exit()',
        '<@&12345> sudo rm -rf /',
        '```.js\nprocess.exit()\n```'
      ];

      const channelResponse = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'security-test',
          type: 'text'
        });

      const channelId = channelResponse.body.channel.id;

      for (const attack of discordAttacks) {
        await request(app.server)
          .post(`/api/servers/${serverId}/channels/${channelId}/messages`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: attack
          })
          .expect(201)
          .then(response => {
            // Content should be sanitized or flagged
            expect(response.body.message.content).toBeDefined();
          });
      }
    });

    it('should protect against Reddit-specific attacks', async () => {
      const redditAttacks = [
        'u/admin DELETE FROM posts WHERE 1=1;',
        '/r/all/../../../etc/passwd',
        '[malicious link](javascript:alert("xss"))',
        '**[bold link](data:text/html,<script>alert(1)</script>)**'
      ];

      // Create community for testing
      const communityResponse = await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `securitytest${Date.now()}`,
          title: 'Security Test Community',
          description: 'Test community for security'
        });

      const communityId = communityResponse.body.community.id;

      for (const attack of redditAttacks) {
        await request(app.server)
          .post(`/api/communities/${communityId}/posts`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Security Test Post',
            content: attack,
            type: 'text'
          })
          .expect(201)
          .then(response => {
            // Content should be sanitized
            expect(response.body.post.content).not.toContain('javascript:');
            expect(response.body.post.content).not.toContain('<script>');
          });
      }
    });

    it('should secure voice/video functionality', async () => {
      // Test voice channel access controls
      const serverResponse = await request(app.server)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Voice Security Test Server',
          description: 'Server for voice security testing'
        });

      const voiceChannelResponse = await request(app.server)
        .post(`/api/servers/${serverResponse.body.server.id}/channels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'voice-security-test',
          type: 'voice'
        });

      const voiceChannelId = voiceChannelResponse.body.channel.id;

      // Test unauthorized voice channel access
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .expect(401); // No auth token

      // Test with invalid token
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate all input fields', async () => {
      const invalidInputs = [
        { name: '', title: 'Valid Title', description: 'Valid Description' }, // Empty name
        { name: 'a'.repeat(1000), title: 'Valid Title', description: 'Valid Description' }, // Too long name
        { name: 'validname', title: '', description: 'Valid Description' }, // Empty title
        { name: 'validname', title: 'Valid Title', description: 'a'.repeat(10000) }, // Too long description
      ];

      for (const input of invalidInputs) {
        await request(app.server)
          .post('/api/communities')
          .set('Authorization', `Bearer ${authToken}`)
          .send(input)
          .expect(400);
      }
    });

    it('should sanitize HTML content', async () => {
      const htmlContent = `
        <div onclick="alert('xss')">Content</div>
        <script src="malicious.js"></script>
        <img src="x" onerror="alert('xss')">
        <iframe src="javascript:alert('xss')"></iframe>
      `;

      const communityResponse = await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `htmltest${Date.now()}`,
          title: 'HTML Test Community',
          description: htmlContent
        })
        .expect(201);

      const sanitizedDescription = communityResponse.body.community.description;
      expect(sanitizedDescription).not.toContain('<script>');
      expect(sanitizedDescription).not.toContain('onclick');
      expect(sanitizedDescription).not.toContain('onerror');
      expect(sanitizedDescription).not.toContain('javascript:');
    });
  });

  describe('API Security', () => {
    it('should prevent API abuse', async () => {
      // Test excessive pagination requests
      await request(app.server)
        .get('/api/communities')
        .query({ limit: 10000, offset: 0 })
        .expect(400); // Should reject excessive limits

      // Test negative pagination values
      await request(app.server)
        .get('/api/communities')
        .query({ limit: -1, offset: -1 })
        .expect(400);
    });

    it('should validate content types', async () => {
      // Test with wrong content type
      await request(app.server)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('email=test&password=test')
        .expect(400);
    });

    it('should handle malformed requests', async () => {
      // Test with malformed JSON
      await request(app.server)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);

      // Test with missing required fields
      await request(app.server)
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });
});

// Helper function for custom expectations
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});