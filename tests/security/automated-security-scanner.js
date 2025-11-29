#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Automated Security Scanner for CRYB Platform
 * Performs automated vulnerability scanning and security testing
 */
class SecurityScanner {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = {
      timestamp: new Date().toISOString(),
      baseURL,
      vulnerabilities: [],
      passed: [],
      failed: [],
      warnings: [],
      summary: {}
    };
    this.authToken = null;
  }

  async run() {
    console.log('🔐 Starting Automated Security Scan...');
    console.log(`Target: ${this.baseURL}`);
    console.log('=' * 50);

    try {
      await this.setupAuthentication();
      await this.runAllTests();
      await this.generateReport();
      
      console.log('\n📊 Security Scan Complete!');
      console.log(`Results saved to: security-scan-report.json`);
      
    } catch (error) {
      console.error('❌ Security scan failed:', error.message);
      this.results.error = error.message;
    }
  }

  async setupAuthentication() {
    console.log('🔑 Setting up authentication...');
    
    try {
      // Register test user
      const registerResponse = await axios.post(`${this.baseURL}/api/auth/register`, {
        username: `scanner_${Date.now()}`,
        email: `scanner_${Date.now()}@security.test`,
        password: 'SecurePassword123!',
        displayName: 'Security Scanner'
      });

      this.authToken = registerResponse.data.token;
      console.log('✅ Authentication setup complete');
      
    } catch (error) {
      console.log('⚠️  Using unauthenticated mode');
    }
  }

  async runAllTests() {
    const testSuites = [
      this.testSSLTLS,
      this.testSecurityHeaders,
      this.testAuthentication,
      this.testAuthorization,
      this.testInjectionVulnerabilities,
      this.testXSSPrevention,
      this.testCSRFPrevention,
      this.testRateLimiting,
      this.testInputValidation,
      this.testErrorHandling,
      this.testSessionManagement,
      this.testFileUploadSecurity,
      this.testInformationDisclosure,
      this.testBusinessLogic
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite.call(this);
      } catch (error) {
        this.logFailure(`Test suite error: ${error.message}`, 'HIGH');
      }
    }
  }

  async testSSLTLS() {
    console.log('🔒 Testing SSL/TLS Configuration...');
    
    try {
      const response = await axios.get(this.baseURL);
      
      // Check for HTTPS enforcement
      if (!this.baseURL.startsWith('https://')) {
        this.logWarning('Application not using HTTPS', 'MEDIUM');
      } else {
        this.logPass('HTTPS properly configured');
      }
      
      // Check for HSTS header
      const hstsHeader = response.headers['strict-transport-security'];
      if (hstsHeader) {
        this.logPass('HSTS header present');
        
        if (hstsHeader.includes('includeSubDomains')) {
          this.logPass('HSTS includes subdomains');
        } else {
          this.logWarning('HSTS does not include subdomains', 'LOW');
        }
      } else {
        this.logFailure('Missing HSTS header', 'MEDIUM');
      }
      
    } catch (error) {
      this.logFailure(`SSL/TLS test failed: ${error.message}`, 'HIGH');
    }
  }

  async testSecurityHeaders() {
    console.log('🛡️  Testing Security Headers...');
    
    try {
      const response = await axios.get(this.baseURL);
      const headers = response.headers;
      
      // Required security headers
      const requiredHeaders = {
        'x-frame-options': {
          required: true,
          expected: ['DENY', 'SAMEORIGIN'],
          severity: 'HIGH'
        },
        'x-content-type-options': {
          required: true,
          expected: ['nosniff'],
          severity: 'MEDIUM'
        },
        'x-xss-protection': {
          required: true,
          expected: ['1; mode=block', '0'],
          severity: 'MEDIUM'
        },
        'content-security-policy': {
          required: true,
          severity: 'HIGH'
        },
        'referrer-policy': {
          required: false,
          expected: ['strict-origin-when-cross-origin', 'same-origin'],
          severity: 'LOW'
        },
        'permissions-policy': {
          required: false,
          severity: 'LOW'
        }
      };

      for (const [headerName, config] of Object.entries(requiredHeaders)) {
        const headerValue = headers[headerName];
        
        if (!headerValue) {
          if (config.required) {
            this.logFailure(`Missing security header: ${headerName}`, config.severity);
          } else {
            this.logWarning(`Recommended header missing: ${headerName}`, config.severity);
          }
        } else {
          if (config.expected && !config.expected.some(exp => headerValue.includes(exp))) {
            this.logWarning(`Security header ${headerName} has unexpected value: ${headerValue}`, config.severity);
          } else {
            this.logPass(`Security header ${headerName} properly configured`);
          }
        }
      }
      
      // Check for information disclosure headers
      const dangerousHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
      for (const header of dangerousHeaders) {
        if (headers[header]) {
          this.logWarning(`Information disclosure header present: ${header}`, 'LOW');
        }
      }
      
    } catch (error) {
      this.logFailure(`Security headers test failed: ${error.message}`, 'HIGH');
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication Security...');
    
    // Test weak password rejection
    try {
      const weakPasswords = ['123', 'password', 'admin', '12345678'];
      
      for (const password of weakPasswords) {
        try {
          await axios.post(`${this.baseURL}/api/auth/register`, {
            username: `weak_${Date.now()}`,
            email: `weak_${Date.now()}@test.com`,
            password,
            displayName: 'Weak User'
          });
          
          this.logFailure(`Weak password accepted: ${password}`, 'HIGH');
        } catch (error) {
          if (error.response?.status === 400) {
            this.logPass(`Weak password rejected: ${password}`);
          }
        }
      }
    } catch (error) {
      this.logFailure(`Password strength test failed: ${error.message}`, 'MEDIUM');
    }

    // Test brute force protection
    try {
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          axios.post(`${this.baseURL}/api/auth/login`, {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          }).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(r => r?.status === 429);
      
      if (rateLimited) {
        this.logPass('Brute force protection active');
      } else {
        this.logFailure('No brute force protection detected', 'HIGH');
      }
      
    } catch (error) {
      this.logFailure(`Brute force test failed: ${error.message}`, 'MEDIUM');
    }
  }

  async testAuthorization() {
    console.log('🔑 Testing Authorization Controls...');
    
    if (!this.authToken) {
      this.logWarning('Skipping authorization tests - no auth token', 'LOW');
      return;
    }

    // Test access to protected endpoints without token
    const protectedEndpoints = [
      '/api/users/profile',
      '/api/posts',
      '/api/admin/users',
      '/api/moderation/reports'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.get(`${this.baseURL}${endpoint}`);
        
        if (response.status === 200) {
          this.logFailure(`Unprotected endpoint accessible: ${endpoint}`, 'HIGH');
        }
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) {
          this.logPass(`Protected endpoint secured: ${endpoint}`);
        }
      }
    }

    // Test privilege escalation
    try {
      const adminEndpoints = ['/api/admin/users', '/api/admin/platform-stats'];
      
      for (const endpoint of adminEndpoints) {
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: { Authorization: `Bearer ${this.authToken}` }
          });
          
          if (response.status === 200) {
            this.logFailure(`Privilege escalation possible: ${endpoint}`, 'CRITICAL');
          }
        } catch (error) {
          if (error.response?.status === 403) {
            this.logPass(`Admin endpoint properly protected: ${endpoint}`);
          }
        }
      }
    } catch (error) {
      this.logFailure(`Authorization test failed: ${error.message}`, 'MEDIUM');
    }
  }

  async testInjectionVulnerabilities() {
    console.log('💉 Testing Injection Vulnerabilities...');
    
    // SQL Injection tests
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT password FROM users --"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await axios.get(`${this.baseURL}/api/search/posts`, {
          params: { q: payload },
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
        });
        
        // Check if response contains suspicious database information
        if (response.data && typeof response.data === 'string') {
          if (response.data.includes('mysql') || response.data.includes('postgresql') || 
              response.data.includes('syntax error') || response.data.includes('ORA-')) {
            this.logFailure(`Possible SQL injection vulnerability detected with payload: ${payload}`, 'CRITICAL');
          }
        }
        
      } catch (error) {
        // Database errors might indicate injection vulnerability
        if (error.response?.data?.includes?.('database') || 
            error.response?.data?.includes?.('SQL')) {
          this.logFailure(`SQL injection vulnerability detected: ${payload}`, 'CRITICAL');
        }
      }
    }

    // NoSQL Injection tests
    const noSqlPayloads = [
      { "$gt": "" },
      { "$ne": null },
      { "$where": "this.username == this.password" }
    ];

    for (const payload of noSqlPayloads) {
      try {
        await axios.post(`${this.baseURL}/api/auth/login`, {
          email: payload,
          password: 'test'
        });
        
        this.logFailure(`NoSQL injection vulnerability detected`, 'CRITICAL');
      } catch (error) {
        if (error.response?.status === 400) {
          this.logPass('NoSQL injection properly handled');
        }
      }
    }
  }

  async testXSSPrevention() {
    console.log('🔍 Testing XSS Prevention...');
    
    if (!this.authToken) {
      this.logWarning('Skipping XSS tests - no auth token', 'LOW');
      return;
    }

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${this.baseURL}/api/posts`, {
          title: 'XSS Test',
          content: payload,
          type: 'text',
          communityId: '1'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (response.status === 201) {
          // Check if XSS payload was sanitized
          if (response.data.post?.content?.includes('<script') ||
              response.data.post?.content?.includes('javascript:') ||
              response.data.post?.content?.includes('onerror=')) {
            this.logFailure(`XSS vulnerability detected with payload: ${payload}`, 'HIGH');
          } else {
            this.logPass(`XSS payload properly sanitized: ${payload}`);
          }
        }
        
      } catch (error) {
        this.logPass(`XSS payload rejected: ${payload}`);
      }
    }
  }

  async testCSRFPrevention() {
    console.log('🔄 Testing CSRF Prevention...');
    
    if (!this.authToken) {
      this.logWarning('Skipping CSRF tests - no auth token', 'LOW');
      return;
    }

    try {
      // Attempt state-changing operation without CSRF token
      const response = await axios.post(`${this.baseURL}/api/posts`, {
        title: 'CSRF Test',
        content: 'Testing CSRF protection',
        type: 'text',
        communityId: '1'
      }, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Origin': 'https://evil.com'
        }
      });

      // Check if CSRF protection is in place
      if (response.status === 201) {
        this.logWarning('Possible CSRF vulnerability - cross-origin request succeeded', 'MEDIUM');
      }
      
    } catch (error) {
      if (error.response?.status === 403) {
        this.logPass('CSRF protection active');
      }
    }
  }

  async testRateLimiting() {
    console.log('⏱️  Testing Rate Limiting...');
    
    try {
      const rapidRequests = [];
      
      // Send rapid requests
      for (let i = 0; i < 20; i++) {
        rapidRequests.push(
          axios.get(`${this.baseURL}/api/posts`).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.some(r => r?.status === 429);
      
      if (rateLimited) {
        this.logPass('Rate limiting active');
      } else {
        this.logWarning('No rate limiting detected', 'MEDIUM');
      }
      
    } catch (error) {
      this.logFailure(`Rate limiting test failed: ${error.message}`, 'MEDIUM');
    }
  }

  async testInputValidation() {
    console.log('✅ Testing Input Validation...');
    
    if (!this.authToken) {
      this.logWarning('Skipping input validation tests - no auth token', 'LOW');
      return;
    }

    // Test oversized inputs
    const oversizedData = {
      title: 'A'.repeat(10000),
      content: 'B'.repeat(100000),
      type: 'text',
      communityId: '1'
    };

    try {
      const response = await axios.post(`${this.baseURL}/api/posts`, oversizedData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.status === 201) {
        this.logWarning('Oversized input accepted - possible DoS vulnerability', 'MEDIUM');
      }
      
    } catch (error) {
      if (error.response?.status === 400) {
        this.logPass('Oversized input properly rejected');
      }
    }

    // Test invalid data types
    const invalidData = {
      title: { malicious: 'object' },
      content: ['malicious', 'array'],
      type: 'invalid_type',
      communityId: null
    };

    try {
      await axios.post(`${this.baseURL}/api/posts`, invalidData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      this.logWarning('Invalid data types accepted', 'MEDIUM');
      
    } catch (error) {
      if (error.response?.status === 400) {
        this.logPass('Invalid data types properly rejected');
      }
    }
  }

  async testErrorHandling() {
    console.log('❌ Testing Error Handling...');
    
    try {
      // Test 404 handling
      const response404 = await axios.get(`${this.baseURL}/api/nonexistent`).catch(err => err.response);
      
      if (response404?.status === 404) {
        // Check for information disclosure in error messages
        const errorBody = response404.data;
        
        if (typeof errorBody === 'string' && 
            (errorBody.includes('stack') || errorBody.includes('trace') || 
             errorBody.includes('internal') || errorBody.includes('database'))) {
          this.logFailure('Error messages disclose sensitive information', 'MEDIUM');
        } else {
          this.logPass('Error handling does not expose sensitive information');
        }
      }
      
      // Test 500 error handling
      try {
        await axios.post(`${this.baseURL}/api/posts`, {
          invalidField: 'should cause error'
        }, {
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
        });
      } catch (error) {
        if (error.response?.status === 500) {
          const errorBody = error.response.data;
          if (typeof errorBody === 'string' && errorBody.includes('stack')) {
            this.logFailure('Stack traces exposed in error responses', 'MEDIUM');
          }
        }
      }
      
    } catch (error) {
      this.logFailure(`Error handling test failed: ${error.message}`, 'LOW');
    }
  }

  async testSessionManagement() {
    console.log('🍪 Testing Session Management...');
    
    if (!this.authToken) {
      this.logWarning('Skipping session tests - no auth token', 'LOW');
      return;
    }

    try {
      // Test token validation
      const validResponse = await axios.get(`${this.baseURL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (validResponse.status === 200) {
        this.logPass('Valid token properly accepted');
      }
      
      // Test invalid token
      const invalidToken = this.authToken.slice(0, -5) + 'XXXXX';
      
      try {
        await axios.get(`${this.baseURL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${invalidToken}` }
        });
        
        this.logFailure('Invalid token accepted', 'HIGH');
      } catch (error) {
        if (error.response?.status === 401) {
          this.logPass('Invalid token properly rejected');
        }
      }
      
    } catch (error) {
      this.logFailure(`Session management test failed: ${error.message}`, 'MEDIUM');
    }
  }

  async testFileUploadSecurity() {
    console.log('📁 Testing File Upload Security...');
    
    if (!this.authToken) {
      this.logWarning('Skipping file upload tests - no auth token', 'LOW');
      return;
    }

    // Test malicious file uploads
    const maliciousFiles = [
      { filename: 'test.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { filename: 'test.exe', content: 'MZ\x90\x00', type: 'application/octet-stream' },
      { filename: 'test.jsp', content: '<% Runtime.getRuntime().exec("whoami"); %>', type: 'text/plain' }
    ];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.content], { type: file.type }), file.filename);
        
        const response = await axios.post(`${this.baseURL}/api/upload/file`, formData, {
          headers: { 
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.status === 200) {
          this.logFailure(`Malicious file uploaded: ${file.filename}`, 'HIGH');
        }
        
      } catch (error) {
        if ([400, 415, 422].includes(error.response?.status)) {
          this.logPass(`Malicious file rejected: ${file.filename}`);
        }
      }
    }
  }

  async testInformationDisclosure() {
    console.log('🔍 Testing Information Disclosure...');
    
    try {
      // Test for common sensitive files
      const sensitiveFiles = [
        '/.env',
        '/config.json',
        '/package.json',
        '/.git/config',
        '/admin',
        '/debug',
        '/test'
      ];

      for (const file of sensitiveFiles) {
        try {
          const response = await axios.get(`${this.baseURL}${file}`);
          
          if (response.status === 200) {
            this.logWarning(`Sensitive file accessible: ${file}`, 'MEDIUM');
          }
        } catch (error) {
          if (error.response?.status === 404) {
            this.logPass(`Sensitive file properly protected: ${file}`);
          }
        }
      }
      
    } catch (error) {
      this.logFailure(`Information disclosure test failed: ${error.message}`, 'LOW');
    }
  }

  async testBusinessLogic() {
    console.log('🏢 Testing Business Logic Security...');
    
    if (!this.authToken) {
      this.logWarning('Skipping business logic tests - no auth token', 'LOW');
      return;
    }

    try {
      // Test for privilege manipulation
      const response = await axios.put(`${this.baseURL}/api/users/profile`, {
        displayName: 'Updated User',
        isAdmin: true,
        role: 'admin',
        karma: 999999
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        const user = response.data.user;
        
        if (user.isAdmin === true || user.role === 'admin' || user.karma === 999999) {
          this.logFailure('Mass assignment vulnerability - privilege escalation possible', 'HIGH');
        } else {
          this.logPass('Mass assignment properly prevented');
        }
      }
      
    } catch (error) {
      this.logPass('Business logic properly protected');
    }
  }

  logPass(message) {
    console.log(`✅ ${message}`);
    this.results.passed.push(message);
  }

  logFailure(message, severity = 'MEDIUM') {
    console.log(`❌ ${message} [${severity}]`);
    this.results.failed.push({ message, severity });
    this.results.vulnerabilities.push({ message, severity, type: 'failure' });
  }

  logWarning(message, severity = 'LOW') {
    console.log(`⚠️  ${message} [${severity}]`);
    this.results.warnings.push({ message, severity });
    this.results.vulnerabilities.push({ message, severity, type: 'warning' });
  }

  async generateReport() {
    this.results.summary = {
      total_tests: this.results.passed.length + this.results.failed.length + this.results.warnings.length,
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      warnings: this.results.warnings.length,
      critical_issues: this.results.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high_issues: this.results.vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium_issues: this.results.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low_issues: this.results.vulnerabilities.filter(v => v.severity === 'LOW').length
    };

    // Write detailed report
    const reportPath = path.join(process.cwd(), 'security-scan-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate summary
    console.log('\n📋 Security Scan Summary:');
    console.log(`Total Tests: ${this.results.summary.total_tests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Warnings: ${this.results.summary.warnings}`);
    console.log('\n🚨 Issues by Severity:');
    console.log(`Critical: ${this.results.summary.critical_issues}`);
    console.log(`High: ${this.results.summary.high_issues}`);
    console.log(`Medium: ${this.results.summary.medium_issues}`);
    console.log(`Low: ${this.results.summary.low_issues}`);

    // Generate recommendations
    if (this.results.vulnerabilities.length > 0) {
      console.log('\n🔧 Recommendations:');
      const criticalIssues = this.results.vulnerabilities.filter(v => v.severity === 'CRITICAL');
      if (criticalIssues.length > 0) {
        console.log('⚡ URGENT: Address critical security issues immediately!');
      }
      
      const highIssues = this.results.vulnerabilities.filter(v => v.severity === 'HIGH');
      if (highIssues.length > 0) {
        console.log('🔥 HIGH PRIORITY: Fix high severity issues before production deployment');
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseURL = process.argv[2] || 'http://localhost:3000';
  const scanner = new SecurityScanner(baseURL);
  scanner.run().catch(console.error);
}

module.exports = SecurityScanner;