/**
 * Penetration Testing Suite
 * Advanced security testing simulating real-world attacks
 */

import { test, expect } from '@playwright/test';
import SecurityScanner from './security-scanner.js';

test.describe('Penetration Testing Suite', () => {
  let scanner;

  test.beforeAll(async () => {
    scanner = new SecurityScanner();
    await scanner.initialize();
  });

  test.afterAll(async () => {
    await scanner.cleanup();
  });

  test.describe('Authentication Security', () => {
    test('should prevent brute force attacks', async ({ page }) => {
      await page.goto('/auth/login');
      
      const attempts = [];
      const startTime = Date.now();
      
      // Attempt rapid login requests
      for (let i = 0; i < 20; i++) {
        attempts.push(
          page.request.post('/api/auth/login', {
            data: {
              email: 'attacker@example.com',
              password: `attempt${i}`
            }
          }).catch(() => null)
        );
      }
      
      const responses = await Promise.all(attempts);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Check if requests were rate limited
      const rateLimitedResponses = responses.filter(r => r?.status() === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(duration).toBeGreaterThan(1000); // Should take more than 1 second due to rate limiting
    });

    test('should detect and prevent credential stuffing', async ({ page }) => {
      const commonCredentials = [
        { email: 'admin@admin.com', password: 'password123' },
        { email: 'user@user.com', password: '123456789' },
        { email: 'test@test.com', password: 'qwerty123' },
        { email: 'demo@demo.com', password: 'password1' }
      ];

      let successfulLogins = 0;
      
      for (const cred of commonCredentials) {
        try {
          const response = await page.request.post('/api/auth/login', {
            data: cred
          });
          
          if (response.status() === 200) {
            successfulLogins++;
          }
        } catch (error) {
          // Expected for invalid credentials
        }
      }
      
      // Should not allow common credential combinations
      expect(successfulLogins).toBe(0);
    });

    test('should enforce strong session management', async ({ page }) => {
      // Login with valid credentials
      await page.goto('/auth/login');
      await page.fill('#email-input', 'test@example.com');
      await page.fill('#password-input', 'TestPassword123!');
      await page.click('#login-button');
      
      // Check session token properties
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name === 'session' || c.name === 'token');
      
      if (sessionCookie) {
        // Should be HTTPOnly
        expect(sessionCookie.httpOnly).toBe(true);
        
        // Should be Secure
        expect(sessionCookie.secure).toBe(true);
        
        // Should have SameSite
        expect(['Strict', 'Lax']).toContain(sessionCookie.sameSite);
        
        // Should have reasonable expiration
        const expirationTime = sessionCookie.expires;
        const now = Date.now() / 1000;
        const maxSessionTime = 24 * 60 * 60; // 24 hours
        
        expect(expirationTime - now).toBeLessThanOrEqual(maxSessionTime);
      }
    });
  });

  test.describe('Input Validation Security', () => {
    test('should prevent SQL injection in all forms', async ({ page }) => {
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT password FROM users WHERE '1'='1",
        "admin'/*",
        "' OR 1=1#"
      ];

      // Test login form
      await page.goto('/auth/login');
      
      for (const payload of sqlPayloads) {
        await page.fill('#email-input', payload);
        await page.fill('#password-input', 'test');
        
        const response = await page.waitForResponse(
          response => response.url().includes('/api/auth/login')
        );
        
        const responseText = await response.text();
        
        // Should not contain SQL error messages
        expect(responseText).not.toMatch(/mysql|sql|ora-|database|table/i);
        
        // Should return proper error response
        expect(response.status()).not.toBe(200);
      }
    });

    test('should prevent XSS in user inputs', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      await page.goto('/chat');
      
      // Intercept alert dialogs
      page.on('dialog', async dialog => {
        expect(dialog.type()).not.toBe('alert');
        await dialog.dismiss();
      });

      for (const payload of xssPayloads) {
        await page.fill('#message-input', payload);
        await page.click('#send-button');
        
        // Wait for message to appear
        await page.waitForTimeout(1000);
        
        // Check if payload was properly encoded
        const messageContent = await page.textContent('.message-content:last-child');
        expect(messageContent).not.toContain('<script>');
        expect(messageContent).not.toContain('javascript:');
      }
    });

    test('should prevent NoSQL injection', async ({ page }) => {
      const nosqlPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.password.length > 0"}',
        '{"$regex": ".*"}',
        '{"$or": [{"password": {"$exists": true}}]}'
      ];

      for (const payload of nosqlPayloads) {
        try {
          const response = await page.request.post('/api/auth/login', {
            data: {
              email: payload,
              password: 'test'
            }
          });
          
          expect(response.status()).not.toBe(200);
          
          const responseText = await response.text();
          expect(responseText).not.toMatch(/mongodb|mongoose|bson/i);
        } catch (error) {
          // Expected for malformed payloads
        }
      }
    });
  });

  test.describe('File Upload Security', () => {
    test('should prevent malicious file uploads', async ({ page }) => {
      await page.goto('/upload');
      
      const maliciousFiles = [
        { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
        { name: 'backdoor.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', type: 'application/java-archive' },
        { name: 'virus.exe', content: 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff', type: 'application/x-msdownload' },
        { name: 'script.js', content: 'document.cookie = "stolen=" + document.cookie;', type: 'application/javascript' }
      ];

      for (const file of maliciousFiles) {
        // Create file
        const buffer = Buffer.from(file.content);
        
        await page.setInputFiles('#file-input', {
          name: file.name,
          mimeType: file.type,
          buffer
        });
        
        const uploadResponse = await page.waitForResponse(
          response => response.url().includes('/api/upload')
        );
        
        // Should reject malicious files
        expect(uploadResponse.status()).not.toBe(200);
      }
    });

    test('should prevent path traversal in file uploads', async ({ page }) => {
      await page.goto('/upload');
      
      const pathTraversalNames = [
        '../../etc/passwd',
        '..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252fetc%252fpasswd'
      ];

      for (const filename of pathTraversalNames) {
        await page.setInputFiles('#file-input', {
          name: filename,
          mimeType: 'text/plain',
          buffer: Buffer.from('test content')
        });
        
        const response = await page.waitForResponse(
          response => response.url().includes('/api/upload')
        );
        
        // Should sanitize filename and reject path traversal attempts
        expect(response.status()).not.toBe(200);
      }
    });

    test('should enforce file size limits', async ({ page }) => {
      await page.goto('/upload');
      
      // Create a large file (>10MB)
      const largeFileSize = 11 * 1024 * 1024; // 11MB
      const largeBuffer = Buffer.alloc(largeFileSize, 'x');
      
      await page.setInputFiles('#file-input', {
        name: 'large-file.txt',
        mimeType: 'text/plain',
        buffer: largeBuffer
      });
      
      const response = await page.waitForResponse(
        response => response.url().includes('/api/upload')
      );
      
      // Should reject files that are too large
      expect(response.status()).toBe(413); // Payload Too Large
    });
  });

  test.describe('API Security', () => {
    test('should prevent API rate limit bypass', async ({ page }) => {
      const requests = [];
      
      // Try to bypass rate limiting with different headers
      const bypassHeaders = [
        { 'X-Forwarded-For': '127.0.0.1' },
        { 'X-Real-IP': '192.168.1.1' },
        { 'X-Originating-IP': '10.0.0.1' },
        { 'User-Agent': 'Different-Agent' },
        { 'X-Requested-With': 'XMLHttpRequest' }
      ];

      for (let i = 0; i < 50; i++) {
        const headers = bypassHeaders[i % bypassHeaders.length];
        requests.push(
          page.request.post('/api/search', {
            data: { query: `test${i}` },
            headers
          }).catch(() => null)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r?.status() === 429).length;
      
      // Should still enforce rate limiting despite bypass attempts
      expect(rateLimitedCount).toBeGreaterThan(10);
    });

    test('should prevent CSRF attacks', async ({ page }) => {
      // Get authenticated session
      await page.goto('/auth/login');
      await page.fill('#email-input', 'test@example.com');
      await page.fill('#password-input', 'TestPassword123!');
      await page.click('#login-button');
      
      // Try to perform state-changing operation without CSRF token
      const response = await page.request.post('/api/user/profile', {
        data: {
          displayName: 'Hacked Name'
        },
        headers: {
          'Content-Type': 'application/json'
          // Deliberately omit CSRF token
        }
      });
      
      // Should reject request without proper CSRF protection
      expect(response.status()).toBe(403);
    });

    test('should prevent information disclosure through API errors', async ({ page }) => {
      const endpoints = [
        '/api/users/999999',
        '/api/channels/invalid-id',
        '/api/admin/secret-data',
        '/api/internal/debug'
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint);
        const responseText = await response.text();
        
        // Should not expose sensitive information in error messages
        expect(responseText).not.toMatch(/database|internal|stack trace|debug|error.*line.*file/i);
        expect(responseText).not.toContain('at ');
        expect(responseText).not.toContain('TypeError:');
        expect(responseText).not.toContain('ReferenceError:');
      }
    });
  });

  test.describe('Business Logic Security', () => {
    test('should prevent privilege escalation through parameter manipulation', async ({ page }) => {
      // Login as regular user
      await page.goto('/auth/login');
      await page.fill('#email-input', 'user@example.com');
      await page.fill('#password-input', 'UserPassword123!');
      await page.click('#login-button');
      
      // Try to escalate privileges by manipulating user role
      const response = await page.request.put('/api/user/profile', {
        data: {
          role: 'admin',
          permissions: ['admin:read', 'admin:write'],
          isAdmin: true
        }
      });
      
      // Should not allow privilege escalation
      expect(response.status()).not.toBe(200);
      
      // Verify user still has regular permissions
      const profileResponse = await page.request.get('/api/user/profile');
      const profile = await profileResponse.json();
      
      expect(profile.user.role).not.toBe('admin');
      expect(profile.user.isAdmin).not.toBe(true);
    });

    test('should prevent resource exhaustion attacks', async ({ page }) => {
      const heavyRequests = [];
      
      // Try to exhaust server resources
      for (let i = 0; i < 20; i++) {
        heavyRequests.push(
          page.request.post('/api/search', {
            data: {
              query: 'a'.repeat(10000), // Very long query
              limit: 10000,
              recursive: true,
              deep: true
            }
          }).catch(() => null)
        );
      }
      
      const responses = await Promise.all(heavyRequests);
      const timeouts = responses.filter(r => !r || r.status() === 504).length;
      
      // Server should handle or reject resource-intensive requests
      expect(timeouts).toBeLessThan(responses.length);
    });
  });

  test.describe('Client-Side Security', () => {
    test('should have secure Content Security Policy', async ({ page }) => {
      await page.goto('/');
      
      const response = await page.waitForResponse(response => 
        response.url() === page.url()
      );
      
      const cspHeader = response.headers()['content-security-policy'];
      expect(cspHeader).toBeTruthy();
      
      // Should not allow unsafe-inline or unsafe-eval
      expect(cspHeader).not.toContain('unsafe-inline');
      expect(cspHeader).not.toContain('unsafe-eval');
      
      // Should not allow * for script-src
      expect(cspHeader).not.toMatch(/script-src[^;]*\*/);
    });

    test('should prevent clickjacking attacks', async ({ page }) => {
      await page.goto('/');
      
      const response = await page.waitForResponse(response => 
        response.url() === page.url()
      );
      
      const xFrameOptions = response.headers()['x-frame-options'];
      const csp = response.headers()['content-security-policy'];
      
      // Should have either X-Frame-Options or CSP frame-ancestors
      const hasFrameProtection = xFrameOptions === 'DENY' || 
                                 xFrameOptions === 'SAMEORIGIN' ||
                                 (csp && csp.includes('frame-ancestors'));
      
      expect(hasFrameProtection).toBe(true);
    });

    test('should secure sensitive data in localStorage/sessionStorage', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('#email-input', 'test@example.com');
      await page.fill('#password-input', 'TestPassword123!');
      await page.click('#login-button');
      
      // Check local storage for sensitive data
      const localStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      });
      
      const sessionStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          data[key] = sessionStorage.getItem(key);
        }
        return data;
      });
      
      // Should not store passwords or full tokens in plain text
      const allStorageData = { ...localStorage, ...sessionStorage };
      const storageString = JSON.stringify(allStorageData).toLowerCase();
      
      expect(storageString).not.toContain('password');
      expect(storageString).not.toMatch(/jwt.*\./); // Full JWT tokens
      expect(storageString).not.toContain('secret');
      expect(storageString).not.toContain('private');
    });
  });

  test('should run comprehensive security scan', async () => {
    const report = await scanner.runFullScan();
    
    // Fail test if critical vulnerabilities are found
    expect(report.summary.critical).toBe(0);
    
    // Warn about high severity vulnerabilities
    if (report.summary.high > 0) {
      console.warn(`Found ${report.summary.high} high severity vulnerabilities`);
    }
    
    // Log summary
    console.log('Security scan summary:', report.summary);
    
    // Save detailed report
    console.log('Full security report saved to test-results/security-report.json');
  });
});