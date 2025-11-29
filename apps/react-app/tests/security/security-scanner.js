/**
 * Comprehensive Security Scanner
 * OWASP Top 10 vulnerability testing and security analysis
 */

import { chromium } from 'playwright';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecurityScanner {
  constructor(baseURL = 'https://platform.cryb.ai') {
    this.baseURL = baseURL;
    this.vulnerabilities = [];
    this.browser = null;
    this.context = null;
    this.page = null;
    this.authToken = null;
  }

  async initialize() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      userAgent: 'CRYB-Security-Scanner/1.0'
    });
    this.page = await this.context.newPage();

    // Setup request/response interception
    this.page.on('response', this.analyzeResponse.bind(this));
    this.page.on('request', this.analyzeRequest.bind(this));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'security-test@example.com',
        password: 'SecurityTest123!'
      });
      
      this.authToken = response.data.token;
      return true;
    } catch (error) {
      console.warn('Authentication failed for security testing');
      return false;
    }
  }

  addVulnerability(type, severity, description, evidence = null) {
    this.vulnerabilities.push({
      type,
      severity,
      description,
      evidence,
      timestamp: new Date().toISOString(),
      url: this.page?.url() || 'N/A'
    });
  }

  async analyzeResponse(response) {
    const headers = response.headers();
    const url = response.url();
    
    // Check for security headers
    this.checkSecurityHeaders(headers, url);
    
    // Check for sensitive data exposure
    if (response.status() === 200) {
      try {
        const text = await response.text();
        this.checkSensitiveDataExposure(text, url);
      } catch (error) {
        // Ignore binary responses
      }
    }
  }

  async analyzeRequest(request) {
    const url = request.url();
    const headers = request.headers();
    
    // Check for insecure protocols
    if (url.startsWith('http://') && !url.includes('localhost')) {
      this.addVulnerability(
        'A02_CRYPTOGRAPHIC_FAILURES',
        'medium',
        'Insecure HTTP protocol used',
        { url }
      );
    }
  }

  checkSecurityHeaders(headers, url) {
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': null, // Just check presence
      'content-security-policy': null,
      'referrer-policy': null
    };

    Object.entries(requiredHeaders).forEach(([headerName, expectedValue]) => {
      const actualValue = headers[headerName];
      
      if (!actualValue) {
        this.addVulnerability(
          'A05_SECURITY_MISCONFIGURATION',
          'medium',
          `Missing security header: ${headerName}`,
          { url, missingHeader: headerName }
        );
      } else if (expectedValue && Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          this.addVulnerability(
            'A05_SECURITY_MISCONFIGURATION',
            'low',
            `Weak security header value: ${headerName}`,
            { url, header: headerName, value: actualValue, expected: expectedValue }
          );
        }
      } else if (expectedValue && actualValue !== expectedValue) {
        this.addVulnerability(
          'A05_SECURITY_MISCONFIGURATION',
          'low',
          `Incorrect security header value: ${headerName}`,
          { url, header: headerName, value: actualValue, expected: expectedValue }
        );
      }
    });
  }

  checkSensitiveDataExposure(content, url) {
    const sensitivePatterns = [
      { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, type: 'password' },
      { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: 'api_key' },
      { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, type: 'secret' },
      { pattern: /token\s*[:=]\s*["'][^"']+["']/gi, type: 'token' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
      { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, type: 'ssn' },
      { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, type: 'credit_card' }
    ];

    sensitivePatterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        this.addVulnerability(
          'A02_CRYPTOGRAPHIC_FAILURES',
          'high',
          `Potential sensitive data exposure: ${type}`,
          { url, type, matchCount: matches.length }
        );
      }
    });
  }

  // A01: Broken Access Control
  async testBrokenAccessControl() {
    console.log('Testing for Broken Access Control...');
    
    // Test unauthorized access to protected endpoints
    const protectedEndpoints = [
      '/api/admin/users',
      '/api/user/profile',
      '/api/channels/private',
      '/dashboard',
      '/admin'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await this.page.goto(`${this.baseURL}${endpoint}`, {
          waitUntil: 'networkidle'
        });

        if (response.status() === 200) {
          this.addVulnerability(
            'A01_BROKEN_ACCESS_CONTROL',
            'critical',
            `Unauthorized access to protected endpoint: ${endpoint}`,
            { endpoint, status: response.status() }
          );
        }
      } catch (error) {
        // Expected for protected endpoints
      }
    }

    // Test privilege escalation
    if (this.authToken) {
      await this.testPrivilegeEscalation();
    }
  }

  async testPrivilegeEscalation() {
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/settings',
      '/api/admin/moderation'
    ];

    // Set auth token
    await this.page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${this.authToken}`
    });

    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.page.goto(`${this.baseURL}${endpoint}`);
        
        if (response.status() === 200) {
          this.addVulnerability(
            'A01_BROKEN_ACCESS_CONTROL',
            'critical',
            `Regular user can access admin endpoint: ${endpoint}`,
            { endpoint, status: response.status() }
          );
        }
      } catch (error) {
        // Expected for admin endpoints with regular user
      }
    }
  }

  // A03: Injection vulnerabilities
  async testInjectionVulnerabilities() {
    console.log('Testing for Injection vulnerabilities...');
    
    await this.page.goto(`${this.baseURL}/auth/login`);
    
    // SQL Injection payloads
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1#"
    ];

    for (const payload of sqlPayloads) {
      await this.testSQLInjection(payload);
    }

    // XSS payloads
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "javascript:alert('XSS')",
      "<img src=x onerror=alert('XSS')>",
      "<svg onload=alert('XSS')>",
      "';alert('XSS');//"
    ];

    for (const payload of xssPayloads) {
      await this.testXSS(payload);
    }

    // Command injection
    const commandPayloads = [
      "; ls -la",
      "| whoami",
      "& dir",
      "`cat /etc/passwd`",
      "$(id)"
    ];

    for (const payload of commandPayloads) {
      await this.testCommandInjection(payload);
    }
  }

  async testSQLInjection(payload) {
    try {
      // Test login form
      await this.page.fill('#email-input', payload);
      await this.page.fill('#password-input', 'test');
      await this.page.click('#login-button');

      // Check for SQL error messages
      const content = await this.page.content();
      const sqlErrors = [
        'mysql_fetch_array',
        'ORA-01756',
        'Microsoft Access Driver',
        'JET Database Engine',
        'SQLServer JDBC Driver',
        'PostgreSQL query failed',
        'Warning: mysql_'
      ];

      sqlErrors.forEach(error => {
        if (content.includes(error)) {
          this.addVulnerability(
            'A03_INJECTION',
            'critical',
            'SQL Injection vulnerability detected',
            { payload, error }
          );
        }
      });
    } catch (error) {
      // Continue testing
    }
  }

  async testXSS(payload) {
    try {
      // Test search functionality
      await this.page.goto(`${this.baseURL}/search?q=${encodeURIComponent(payload)}`);
      
      // Check if payload is reflected without encoding
      const content = await this.page.content();
      if (content.includes(payload) && !content.includes(encodeURIComponent(payload))) {
        this.addVulnerability(
          'A03_INJECTION',
          'high',
          'Reflected XSS vulnerability detected',
          { payload, location: 'search parameter' }
        );
      }

      // Test for DOM-based XSS
      try {
        await this.page.evaluate(() => {
          window.xssTriggered = false;
          window.alert = () => { window.xssTriggered = true; };
        });

        await this.page.waitForTimeout(1000);
        
        const xssTriggered = await this.page.evaluate(() => window.xssTriggered);
        if (xssTriggered) {
          this.addVulnerability(
            'A03_INJECTION',
            'high',
            'DOM-based XSS vulnerability detected',
            { payload }
          );
        }
      } catch (error) {
        // XSS test failed
      }
    } catch (error) {
      // Continue testing
    }
  }

  async testCommandInjection(payload) {
    // Test file upload with command injection
    try {
      await this.page.goto(`${this.baseURL}/upload`);
      
      // Create a test file with the payload as filename
      const filename = `test${payload}.txt`;
      await this.page.setInputFiles('#file-input', {
        name: filename,
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });

      await this.page.click('#upload-button');
      
      // Check response for command execution indicators
      const content = await this.page.content();
      const indicators = ['root:', 'bin:', 'etc:', 'usr:', 'Administrator'];
      
      indicators.forEach(indicator => {
        if (content.includes(indicator)) {
          this.addVulnerability(
            'A03_INJECTION',
            'critical',
            'Command injection vulnerability detected',
            { payload, indicator }
          );
        }
      });
    } catch (error) {
      // Continue testing
    }
  }

  // A04: Insecure Design
  async testInsecureDesign() {
    console.log('Testing for Insecure Design patterns...');
    
    // Test for weak password policies
    await this.testWeakPasswordPolicy();
    
    // Test for missing rate limiting
    await this.testRateLimiting();
    
    // Test for insecure file uploads
    await this.testInsecureFileUpload();
  }

  async testWeakPasswordPolicy() {
    await this.page.goto(`${this.baseURL}/auth/register`);
    
    const weakPasswords = ['123', 'password', 'abc', '111111'];
    
    for (const password of weakPasswords) {
      try {
        await this.page.fill('#password-input', password);
        await this.page.click('#register-button');
        
        // Check if weak password is accepted
        const content = await this.page.content();
        if (!content.includes('Password too weak') && !content.includes('Password must')) {
          this.addVulnerability(
            'A04_INSECURE_DESIGN',
            'medium',
            'Weak password policy allows trivial passwords',
            { testedPassword: password }
          );
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  async testRateLimiting() {
    const requests = [];
    
    // Test login rate limiting
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.post(`${this.baseURL}/api/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }).catch(() => {}) // Ignore errors
      );
    }
    
    const responses = await Promise.all(requests);
    const successfulRequests = responses.filter(r => r && r.status !== 429);
    
    if (successfulRequests.length >= 8) {
      this.addVulnerability(
        'A04_INSECURE_DESIGN',
        'medium',
        'Missing or insufficient rate limiting on login endpoint',
        { attemptsMade: successfulRequests.length }
      );
    }
  }

  async testInsecureFileUpload() {
    if (!this.authToken) return;
    
    const maliciousFiles = [
      { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'script.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
      { name: 'evil.exe', content: 'MZ' + 'x'.repeat(100) },
      { name: 'large.txt', content: 'x'.repeat(10 * 1024 * 1024) } // 10MB file
    ];
    
    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.content]), file.name);
        
        const response = await axios.post(`${this.baseURL}/api/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.status === 200) {
          this.addVulnerability(
            'A04_INSECURE_DESIGN',
            'high',
            `Insecure file upload allows ${file.name}`,
            { filename: file.name, size: file.content.length }
          );
        }
      } catch (error) {
        // Expected for malicious files
      }
    }
  }

  // A05: Security Misconfiguration
  async testSecurityMisconfiguration() {
    console.log('Testing for Security Misconfiguration...');
    
    // Test for debug mode
    await this.testDebugMode();
    
    // Test for default credentials
    await this.testDefaultCredentials();
    
    // Test for directory listing
    await this.testDirectoryListing();
  }

  async testDebugMode() {
    const debugUrls = [
      '/debug',
      '/.env',
      '/config',
      '/phpinfo.php',
      '/server-info',
      '/server-status'
    ];
    
    for (const url of debugUrls) {
      try {
        const response = await this.page.goto(`${this.baseURL}${url}`);
        
        if (response.status() === 200) {
          const content = await this.page.content();
          if (content.includes('debug') || content.includes('config') || content.includes('environment')) {
            this.addVulnerability(
              'A05_SECURITY_MISCONFIGURATION',
              'medium',
              `Debug information exposed at ${url}`,
              { url }
            );
          }
        }
      } catch (error) {
        // Expected for non-existent debug endpoints
      }
    }
  }

  async testDefaultCredentials() {
    const defaultCreds = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'root', password: 'root' },
      { username: 'test', password: 'test' }
    ];
    
    for (const cred of defaultCreds) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/login`, {
          email: cred.username,
          password: cred.password
        });
        
        if (response.status === 200) {
          this.addVulnerability(
            'A05_SECURITY_MISCONFIGURATION',
            'critical',
            `Default credentials work: ${cred.username}/${cred.password}`,
            cred
          );
        }
      } catch (error) {
        // Expected for wrong credentials
      }
    }
  }

  async testDirectoryListing() {
    const directories = [
      '/uploads/',
      '/files/',
      '/assets/',
      '/static/',
      '/public/'
    ];
    
    for (const dir of directories) {
      try {
        const response = await this.page.goto(`${this.baseURL}${dir}`);
        
        if (response.status() === 200) {
          const content = await this.page.content();
          if (content.includes('Index of') || content.includes('<a href=')) {
            this.addVulnerability(
              'A05_SECURITY_MISCONFIGURATION',
              'low',
              `Directory listing enabled for ${dir}`,
              { directory: dir }
            );
          }
        }
      } catch (error) {
        // Expected for non-existent directories
      }
    }
  }

  // A06: Vulnerable and Outdated Components
  async testVulnerableComponents() {
    console.log('Testing for Vulnerable Components...');
    
    // Check client-side libraries
    await this.page.goto(this.baseURL);
    
    const libraries = await this.page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => script.src);
    });
    
    // Check for known vulnerable libraries (simplified check)
    const vulnerablePatterns = [
      { pattern: /jquery-1\.[0-8]\./i, library: 'jQuery', severity: 'medium' },
      { pattern: /angular-1\.[0-5]\./i, library: 'AngularJS', severity: 'high' },
      { pattern: /bootstrap-[2-3]\./i, library: 'Bootstrap', severity: 'low' }
    ];
    
    libraries.forEach(src => {
      vulnerablePatterns.forEach(({ pattern, library, severity }) => {
        if (pattern.test(src)) {
          this.addVulnerability(
            'A06_VULNERABLE_COMPONENTS',
            severity,
            `Potentially vulnerable ${library} version detected`,
            { library, source: src }
          );
        }
      });
    });
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      target: this.baseURL,
      vulnerabilities: this.vulnerabilities,
      summary: {
        total: this.vulnerabilities.length,
        critical: this.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: this.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: this.vulnerabilities.filter(v => v.severity === 'low').length
      },
      owaspMapping: this.getOwaspMapping()
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'test-results', 'security-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  getOwaspMapping() {
    const mapping = {};
    this.vulnerabilities.forEach(vuln => {
      if (!mapping[vuln.type]) {
        mapping[vuln.type] = 0;
      }
      mapping[vuln.type]++;
    });
    return mapping;
  }

  async runFullScan() {
    console.log('Starting comprehensive security scan...');
    
    await this.initialize();
    await this.authenticate();

    // Run all tests
    await this.testBrokenAccessControl();
    await this.testInjectionVulnerabilities();
    await this.testInsecureDesign();
    await this.testSecurityMisconfiguration();
    await this.testVulnerableComponents();

    const report = await this.generateReport();
    await this.cleanup();

    console.log(`Security scan completed. Found ${report.summary.total} vulnerabilities.`);
    console.log(`Critical: ${report.summary.critical}, High: ${report.summary.high}, Medium: ${report.summary.medium}, Low: ${report.summary.low}`);

    return report;
  }
}

// Export for use in tests
export default SecurityScanner;

// Run standalone if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new SecurityScanner();
  scanner.runFullScan().catch(console.error);
}