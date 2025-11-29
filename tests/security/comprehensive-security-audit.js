const axios = require('axios');
const https = require('https');

const BASE_URL = 'http://54.236.166.224';
const API_URL = `${BASE_URL}/api`;

class SecurityTester {
  constructor() {
    this.results = [];
    this.vulnerabilities = [];
    this.httpAgent = new https.Agent({
      rejectUnauthorized: false // For testing purposes
    });
  }

  log(test, status, message, severity = 'info') {
    const result = {
      test,
      status,
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`[${severity.toUpperCase()}] ${test}: ${status} - ${message}`);
  }

  addVulnerability(type, description, severity, evidence) {
    this.vulnerabilities.push({
      type,
      description,
      severity,
      evidence,
      timestamp: new Date().toISOString()
    });
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url,
        timeout: 10000,
        validateStatus: () => true, // Don't throw on HTTP errors
        httpsAgent: this.httpAgent,
        headers: {
          'User-Agent': 'CRYB-Security-Audit/1.0',
          ...headers
        }
      };

      if (data) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      return response;
    } catch (error) {
      return {
        status: 0,
        statusText: error.message,
        data: null,
        headers: {}
      };
    }
  }

  async testHTTPSRedirection() {
    this.log('HTTPS Redirection', 'TESTING', 'Checking if HTTP redirects to HTTPS');
    
    try {
      const response = await this.makeRequest('GET', BASE_URL.replace('http://', 'https://'));
      
      if (response.status === 200) {
        this.log('HTTPS Redirection', 'PASS', 'HTTPS is accessible');
      } else {
        this.log('HTTPS Redirection', 'FAIL', 'HTTPS is not accessible', 'medium');
        this.addVulnerability(
          'Transport Security',
          'HTTPS is not properly configured',
          'medium',
          `HTTPS request returned status: ${response.status}`
        );
      }
    } catch (error) {
      this.log('HTTPS Redirection', 'FAIL', `HTTPS test failed: ${error.message}`, 'medium');
    }
  }

  async testSecurityHeaders() {
    this.log('Security Headers', 'TESTING', 'Checking for security headers');
    
    const response = await this.makeRequest('GET', BASE_URL);
    const headers = response.headers;
    
    const securityHeaders = {
      'x-frame-options': 'X-Frame-Options header missing',
      'x-content-type-options': 'X-Content-Type-Options header missing',
      'x-xss-protection': 'X-XSS-Protection header missing',
      'strict-transport-security': 'Strict-Transport-Security header missing',
      'content-security-policy': 'Content-Security-Policy header missing',
      'referrer-policy': 'Referrer-Policy header missing'
    };

    let missingHeaders = [];
    
    for (const [header, message] of Object.entries(securityHeaders)) {
      if (!headers[header] && !headers[header.toLowerCase()]) {
        missingHeaders.push(header);
        this.addVulnerability(
          'Missing Security Headers',
          message,
          'medium',
          `Header ${header} is not present in response`
        );
      }
    }

    if (missingHeaders.length === 0) {
      this.log('Security Headers', 'PASS', 'All security headers are present');
    } else {
      this.log('Security Headers', 'FAIL', `Missing headers: ${missingHeaders.join(', ')}`, 'medium');
    }
  }

  async testXSSPrevention() {
    this.log('XSS Prevention', 'TESTING', 'Testing for XSS vulnerabilities');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '${alert("XSS")}',
      '{{alert("XSS")}}',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];

    let vulnerableEndpoints = [];

    // Test common input endpoints
    const testEndpoints = [
      { url: `${API_URL}/v1/auth/register`, method: 'POST', data: { username: '', email: '', password: '' }},
      { url: `${API_URL}/v1/auth/login`, method: 'POST', data: { email: '', password: '' }},
      { url: `${API_URL}/v1/posts`, method: 'POST', data: { title: '', content: '' }},
      { url: `${API_URL}/v1/comments`, method: 'POST', data: { content: '', postId: '1' }}
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of xssPayloads.slice(0, 3)) { // Test first 3 payloads per endpoint
        try {
          const testData = { ...endpoint.data };
          
          // Inject payload into each field
          for (const field in testData) {
            testData[field] = payload;
          }

          const response = await this.makeRequest(endpoint.method, endpoint.url, testData);
          
          // Check if payload is reflected in response
          if (response.data && typeof response.data === 'string') {
            if (response.data.includes(payload) && !response.data.includes('&lt;') && !response.data.includes('&gt;')) {
              vulnerableEndpoints.push(`${endpoint.url} - ${payload}`);
              this.addVulnerability(
                'XSS Vulnerability',
                `Potential XSS vulnerability found at ${endpoint.url}`,
                'high',
                `Payload reflected: ${payload}`
              );
            }
          }
        } catch (error) {
          // Continue testing other endpoints
        }
      }
    }

    if (vulnerableEndpoints.length === 0) {
      this.log('XSS Prevention', 'PASS', 'No XSS vulnerabilities detected');
    } else {
      this.log('XSS Prevention', 'FAIL', `Potential XSS vulnerabilities found: ${vulnerableEndpoints.length}`, 'high');
    }
  }

  async testSQLInjection() {
    this.log('SQL Injection', 'TESTING', 'Testing for SQL injection vulnerabilities');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "admin'--",
      "admin'/*",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR '1'='1",
      "' OR 1=1--"
    ];

    let vulnerableEndpoints = [];

    const testEndpoints = [
      { url: `${API_URL}/v1/auth/login`, method: 'POST', data: { email: '', password: '' }},
      { url: `${API_URL}/v1/users/search`, method: 'GET', params: { q: '' }},
      { url: `${API_URL}/v1/posts/search`, method: 'GET', params: { query: '' }}
    ];

    for (const endpoint of testEndpoints) {
      for (const payload of sqlPayloads.slice(0, 3)) { // Test first 3 payloads per endpoint
        try {
          let response;
          
          if (endpoint.method === 'GET') {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(endpoint.params || {})) {
              params.append(key, payload);
            }
            response = await this.makeRequest('GET', `${endpoint.url}?${params}`);
          } else {
            const testData = { ...endpoint.data };
            for (const field in testData) {
              testData[field] = payload;
            }
            response = await this.makeRequest(endpoint.method, endpoint.url, testData);
          }

          // Check for SQL error messages
          if (response.data && typeof response.data === 'string') {
            const sqlErrors = [
              'mysql_fetch_array',
              'ORA-01756',
              'Microsoft OLE DB Provider for ODBC Drivers',
              'PostgreSQL query failed',
              'Warning: pg_',
              'valid MySQL result',
              'MySqlException',
              'sqlite3.OperationalError'
            ];

            for (const errorPattern of sqlErrors) {
              if (response.data.toLowerCase().includes(errorPattern.toLowerCase())) {
                vulnerableEndpoints.push(`${endpoint.url} - ${payload}`);
                this.addVulnerability(
                  'SQL Injection',
                  `Potential SQL injection vulnerability at ${endpoint.url}`,
                  'critical',
                  `SQL error detected: ${errorPattern}`
                );
                break;
              }
            }
          }
        } catch (error) {
          // Continue testing
        }
      }
    }

    if (vulnerableEndpoints.length === 0) {
      this.log('SQL Injection', 'PASS', 'No SQL injection vulnerabilities detected');
    } else {
      this.log('SQL Injection', 'FAIL', `Potential SQL injection vulnerabilities: ${vulnerableEndpoints.length}`, 'critical');
    }
  }

  async testAuthenticationBypass() {
    this.log('Authentication Bypass', 'TESTING', 'Testing for authentication bypass vulnerabilities');
    
    const protectedEndpoints = [
      `${API_URL}/v1/users/profile`,
      `${API_URL}/v1/admin/users`,
      `${API_URL}/v1/posts/admin`,
      `${API_URL}/v1/communities/admin`
    ];

    let bypassableEndpoints = [];

    for (const endpoint of protectedEndpoints) {
      try {
        // Test without authentication
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.status === 200) {
          bypassableEndpoints.push(endpoint);
          this.addVulnerability(
            'Authentication Bypass',
            `Protected endpoint accessible without authentication: ${endpoint}`,
            'high',
            `Endpoint returned status 200 without authentication`
          );
        }

        // Test with invalid token
        const invalidTokenResponse = await this.makeRequest('GET', endpoint, null, {
          'Authorization': 'Bearer invalid_token_12345'
        });

        if (invalidTokenResponse.status === 200) {
          bypassableEndpoints.push(`${endpoint} (invalid token)`);
          this.addVulnerability(
            'Authentication Bypass',
            `Protected endpoint accessible with invalid token: ${endpoint}`,
            'high',
            `Endpoint returned status 200 with invalid token`
          );
        }
      } catch (error) {
        // Continue testing
      }
    }

    if (bypassableEndpoints.length === 0) {
      this.log('Authentication Bypass', 'PASS', 'All protected endpoints require authentication');
    } else {
      this.log('Authentication Bypass', 'FAIL', `Bypassable endpoints: ${bypassableEndpoints.length}`, 'high');
    }
  }

  async testCSRFProtection() {
    this.log('CSRF Protection', 'TESTING', 'Testing for CSRF protection');
    
    // Test state-changing endpoints without CSRF tokens
    const stateChangingEndpoints = [
      { url: `${API_URL}/v1/auth/register`, method: 'POST', data: { username: 'test', email: 'test@test.com', password: 'test123' }},
      { url: `${API_URL}/v1/posts`, method: 'POST', data: { title: 'Test', content: 'Test content' }},
      { url: `${API_URL}/v1/users/profile`, method: 'PUT', data: { name: 'Updated Name' }}
    ];

    let vulnerableEndpoints = [];

    for (const endpoint of stateChangingEndpoints) {
      try {
        // Test with different origin
        const response = await this.makeRequest(endpoint.method, endpoint.url, endpoint.data, {
          'Origin': 'http://malicious-site.com',
          'Referer': 'http://malicious-site.com'
        });

        // If request succeeds without CSRF token, it's potentially vulnerable
        if (response.status === 200 || response.status === 201) {
          vulnerableEndpoints.push(endpoint.url);
          this.addVulnerability(
            'CSRF Vulnerability',
            `Endpoint may be vulnerable to CSRF: ${endpoint.url}`,
            'medium',
            `Request succeeded without CSRF protection`
          );
        }
      } catch (error) {
        // Continue testing
      }
    }

    if (vulnerableEndpoints.length === 0) {
      this.log('CSRF Protection', 'PASS', 'CSRF protection appears to be in place');
    } else {
      this.log('CSRF Protection', 'FAIL', `Potentially vulnerable endpoints: ${vulnerableEndpoints.length}`, 'medium');
    }
  }

  async testDirectoryTraversal() {
    this.log('Directory Traversal', 'TESTING', 'Testing for directory traversal vulnerabilities');
    
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '../../../../../../../etc/passwd',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd'
    ];

    let vulnerableEndpoints = [];

    // Test file serving endpoints
    const fileEndpoints = [
      `${API_URL}/v1/files/download`,
      `${API_URL}/v1/uploads/`,
      `${BASE_URL}/uploads/`,
      `${BASE_URL}/static/`,
      `${BASE_URL}/assets/`
    ];

    for (const baseEndpoint of fileEndpoints) {
      for (const payload of traversalPayloads.slice(0, 3)) {
        try {
          const testUrl = `${baseEndpoint}${payload}`;
          const response = await this.makeRequest('GET', testUrl);
          
          if (response.data && typeof response.data === 'string') {
            // Check for Unix/Linux system files
            if (response.data.includes('root:x:0:0:') || 
                response.data.includes('daemon:x:') ||
                response.data.includes('# localhost')) {
              vulnerableEndpoints.push(testUrl);
              this.addVulnerability(
                'Directory Traversal',
                `Directory traversal vulnerability found: ${baseEndpoint}`,
                'high',
                `System files accessible via: ${payload}`
              );
            }
          }
        } catch (error) {
          // Continue testing
        }
      }
    }

    if (vulnerableEndpoints.length === 0) {
      this.log('Directory Traversal', 'PASS', 'No directory traversal vulnerabilities detected');
    } else {
      this.log('Directory Traversal', 'FAIL', `Vulnerable endpoints: ${vulnerableEndpoints.length}`, 'high');
    }
  }

  async testRateLimiting() {
    this.log('Rate Limiting', 'TESTING', 'Testing rate limiting implementation');
    
    const testEndpoint = `${API_URL}/v1/auth/login`;
    const testData = { email: 'test@example.com', password: 'wrongpassword' };
    
    let requestCount = 0;
    let rateLimited = false;
    const maxRequests = 20;

    try {
      for (let i = 0; i < maxRequests; i++) {
        const response = await this.makeRequest('POST', testEndpoint, testData);
        requestCount++;
        
        if (response.status === 429 || 
            (response.data && response.data.includes && response.data.includes('rate limit'))) {
          rateLimited = true;
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      // Continue testing
    }

    if (rateLimited) {
      this.log('Rate Limiting', 'PASS', `Rate limiting activated after ${requestCount} requests`);
    } else {
      this.log('Rate Limiting', 'FAIL', `No rate limiting detected after ${requestCount} requests`, 'medium');
      this.addVulnerability(
        'Missing Rate Limiting',
        'No rate limiting detected on authentication endpoint',
        'medium',
        `${requestCount} requests made without rate limiting`
      );
    }
  }

  async testInputValidation() {
    this.log('Input Validation', 'TESTING', 'Testing input validation');
    
    const invalidInputs = [
      { type: 'email', value: 'invalid-email', field: 'email' },
      { type: 'long-string', value: 'A'.repeat(10000), field: 'username' },
      { type: 'null-bytes', value: 'test\x00test', field: 'username' },
      { type: 'unicode', value: '🚀🔥💯', field: 'username' },
      { type: 'special-chars', value: '!@#$%^&*()_+{}|:"<>?[]\\;\',./', field: 'username' }
    ];

    let validationIssues = [];

    const testEndpoint = `${API_URL}/v1/auth/register`;

    for (const input of invalidInputs) {
      try {
        const testData = {
          username: input.field === 'username' ? input.value : 'testuser',
          email: input.field === 'email' ? input.value : 'test@example.com',
          password: 'password123'
        };

        const response = await this.makeRequest('POST', testEndpoint, testData);
        
        // If request succeeds with invalid input, validation might be missing
        if (response.status === 200 || response.status === 201) {
          validationIssues.push(`${input.type}: ${input.value.substring(0, 50)}`);
          this.addVulnerability(
            'Input Validation',
            `Weak input validation for ${input.type}`,
            'medium',
            `Invalid input accepted: ${input.field} = ${input.value.substring(0, 100)}`
          );
        }
      } catch (error) {
        // Continue testing
      }
    }

    if (validationIssues.length === 0) {
      this.log('Input Validation', 'PASS', 'Input validation appears to be working');
    } else {
      this.log('Input Validation', 'FAIL', `Validation issues: ${validationIssues.length}`, 'medium');
    }
  }

  async generateReport() {
    const report = {
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        vulnerabilities: this.vulnerabilities.length,
        criticalVulnerabilities: this.vulnerabilities.filter(v => v.severity === 'critical').length,
        highVulnerabilities: this.vulnerabilities.filter(v => v.severity === 'high').length,
        mediumVulnerabilities: this.vulnerabilities.filter(v => v.severity === 'medium').length
      },
      testResults: this.results,
      vulnerabilities: this.vulnerabilities,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.vulnerabilities.some(v => v.type.includes('XSS'))) {
      recommendations.push({
        category: 'XSS Prevention',
        priority: 'high',
        description: 'Implement proper input sanitization and output encoding',
        actions: [
          'Use parameterized queries and prepared statements',
          'Implement Content Security Policy (CSP)',
          'Validate and sanitize all user inputs',
          'Use secure templating engines with auto-escaping'
        ]
      });
    }

    if (this.vulnerabilities.some(v => v.type.includes('SQL Injection'))) {
      recommendations.push({
        category: 'SQL Injection Prevention',
        priority: 'critical',
        description: 'Implement proper database query protection',
        actions: [
          'Use parameterized queries exclusively',
          'Implement proper input validation',
          'Use ORM with built-in protection',
          'Apply principle of least privilege for database accounts'
        ]
      });
    }

    if (this.vulnerabilities.some(v => v.type.includes('Security Headers'))) {
      recommendations.push({
        category: 'Security Headers',
        priority: 'medium',
        description: 'Implement comprehensive security headers',
        actions: [
          'Add X-Frame-Options header',
          'Implement Content-Security-Policy',
          'Add X-Content-Type-Options: nosniff',
          'Implement Strict-Transport-Security for HTTPS'
        ]
      });
    }

    if (this.vulnerabilities.some(v => v.type.includes('Rate Limiting'))) {
      recommendations.push({
        category: 'Rate Limiting',
        priority: 'medium',
        description: 'Implement proper rate limiting',
        actions: [
          'Add rate limiting to authentication endpoints',
          'Implement progressive delays for failed attempts',
          'Use distributed rate limiting for scalability',
          'Monitor and alert on suspicious activity'
        ]
      });
    }

    return recommendations;
  }

  async runAllTests() {
    console.log('🔒 Starting CRYB Platform Security Audit...\n');

    await this.testHTTPSRedirection();
    await this.testSecurityHeaders();
    await this.testXSSPrevention();
    await this.testSQLInjection();
    await this.testAuthenticationBypass();
    await this.testCSRFProtection();
    await this.testDirectoryTraversal();
    await this.testRateLimiting();
    await this.testInputValidation();

    const report = await this.generateReport();
    
    console.log('\n📊 Security Audit Summary:');
    console.log(`✅ Tests Passed: ${report.summary.passed}`);
    console.log(`❌ Tests Failed: ${report.summary.failed}`);
    console.log(`🚨 Total Vulnerabilities: ${report.summary.vulnerabilities}`);
    console.log(`🔴 Critical: ${report.summary.criticalVulnerabilities}`);
    console.log(`🟠 High: ${report.summary.highVulnerabilities}`);
    console.log(`🟡 Medium: ${report.summary.mediumVulnerabilities}`);

    return report;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityTester;
}

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new SecurityTester();
    const report = await tester.runAllTests();
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Report saved to: ${reportPath}`);
  })();
}