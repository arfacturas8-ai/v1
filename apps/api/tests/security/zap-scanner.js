const ZapClient = require('zaproxy');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * OWASP ZAP Security Scanner Integration
 * 
 * This script runs automated security tests against the CRYB platform
 * to identify OWASP Top 10 vulnerabilities and other security issues.
 */

class SecurityScanner {
  constructor() {
    this.zapClient = new ZapClient({
      proxy: 'http://127.0.0.1:8080'
    });
    
    this.baseUrl = process.env.SCAN_TARGET_URL || 'http://localhost:3001';
    this.frontendUrl = process.env.SCAN_FRONTEND_URL || 'http://localhost:3000';
    
    this.scanResults = {
      timestamp: new Date().toISOString(),
      target: this.baseUrl,
      vulnerabilities: [],
      summary: {},
      recommendations: []
    };
    
    this.testCredentials = {
      email: 'security-test@example.com',
      password: 'SecurityTest123!',
      username: 'securitytester'
    };
  }

  /**
   * Initialize ZAP and prepare for scanning
   */
  async initialize() {
    try {
      console.log('🔍 Initializing OWASP ZAP Scanner...');
      
      // Check if ZAP is running
      await this.zapClient.core.version();
      console.log('✅ ZAP is running');
      
      // Configure ZAP settings for modern web apps
      await this.zapClient.core.setOptionDefaultUserAgent(
        'Mozilla/5.0 (compatible; OWASP ZAP Security Scanner)'
      );
      
      // Enable all passive scanners
      await this.zapClient.pscan.enableAllScanners();
      
      // Configure active scanner
      await this.zapClient.ascan.setOptionMaxScansInUI(10);
      await this.zapClient.ascan.setOptionAttackPolicy('High');
      
      console.log('✅ ZAP configuration complete');
      
    } catch (error) {
      console.error('❌ Failed to initialize ZAP:', error.message);
      console.log('Please ensure OWASP ZAP is running on port 8080');
      console.log('Download from: https://www.zaproxy.org/download/');
      throw error;
    }
  }

  /**
   * Create test user for authenticated scanning
   */
  async createTestUser() {
    try {
      console.log('👤 Creating test user for authenticated scanning...');
      
      const response = await axios.post(`${this.baseUrl}/auth/register`, this.testCredentials);
      
      if (response.status === 201) {
        console.log('✅ Test user created successfully');
        return response.data.accessToken;
      }
      
    } catch (error) {
      if (error.response?.status === 400) {
        // User might already exist, try to login
        try {
          const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, {
            email: this.testCredentials.email,
            password: this.testCredentials.password
          });
          
          console.log('✅ Test user login successful');
          return loginResponse.data.accessToken;
          
        } catch (loginError) {
          console.error('❌ Failed to create or login test user:', loginError.message);
        }
      }
    }
    
    return null;
  }

  /**
   * Configure authentication context in ZAP
   */
  async setupAuthentication(accessToken) {
    if (!accessToken) {
      console.log('⚠️  Running unauthenticated scan only');
      return;
    }
    
    try {
      console.log('🔐 Setting up authentication context...');
      
      // Create authentication context
      const contextName = 'CRYB-Auth';
      await this.zapClient.context.newContext(contextName);
      
      // Include URLs in context
      await this.zapClient.context.includeInContext(contextName, `${this.baseUrl}.*`);
      await this.zapClient.context.includeInContext(contextName, `${this.frontendUrl}.*`);
      
      // Set authentication method (Bearer token)
      await this.zapClient.authentication.setAuthenticationMethod(
        contextName,
        'scriptBasedAuthentication',
        JSON.stringify({
          'scriptName': 'bearer-auth.js',
          'scriptEngine': 'ECMAScript',
          'scriptDescription': 'Bearer token authentication',
          'scriptContent': `
            function authenticate(helper, paramsValues, credentials) {
              var token = credentials.getParam("token");
              helper.getCorrespondingHttpMessage().getRequestHeader().setHeader("Authorization", "Bearer " + token);
              return helper.getCorrespondingHttpMessage();
            }
          `
        })
      );
      
      // Create user with token
      await this.zapClient.users.newUser(contextName, 'testuser');
      await this.zapClient.users.setUserEnabled(contextName, 'testuser', true);
      await this.zapClient.users.setAuthenticationCredentials(
        contextName,
        'testuser',
        JSON.stringify({ token: accessToken })
      );
      
      console.log('✅ Authentication context configured');
      
    } catch (error) {
      console.error('❌ Failed to setup authentication:', error.message);
    }
  }

  /**
   * Spider the application to discover URLs
   */
  async spiderScan() {
    try {
      console.log('🕷️  Starting spider scan...');
      
      // Start spider scan
      const spiderScanId = await this.zapClient.spider.scan(this.baseUrl);
      
      // Wait for spider to complete
      let progress = 0;
      while (progress < 100) {
        await this.sleep(2000);
        progress = await this.zapClient.spider.status(spiderScanId);
        console.log(`Spider progress: ${progress}%`);
      }
      
      const urls = await this.zapClient.spider.results(spiderScanId);
      console.log(`✅ Spider scan complete. Found ${urls.length} URLs`);
      
      return urls;
      
    } catch (error) {
      console.error('❌ Spider scan failed:', error.message);
      return [];
    }
  }

  /**
   * Run passive security scans
   */
  async passiveScan() {
    try {
      console.log('📊 Running passive security scan...');
      
      // Ensure passive scanners are enabled
      await this.zapClient.pscan.enableAllScanners();
      
      // Wait for passive scan to process all records
      let recordsToScan = 1;
      while (recordsToScan > 0) {
        await this.sleep(2000);
        recordsToScan = await this.zapClient.pscan.recordsToScan();
        if (recordsToScan > 0) {
          console.log(`Passive scan processing ${recordsToScan} records...`);
        }
      }
      
      console.log('✅ Passive scan complete');
      
    } catch (error) {
      console.error('❌ Passive scan failed:', error.message);
    }
  }

  /**
   * Run active security scans (more aggressive)
   */
  async activeScan() {
    try {
      console.log('⚡ Starting active security scan...');
      
      // Start active scan
      const activeScanId = await this.zapClient.ascan.scan(this.baseUrl);
      
      // Wait for active scan to complete
      let progress = 0;
      while (progress < 100) {
        await this.sleep(5000);
        progress = await this.zapClient.ascan.status(activeScanId);
        console.log(`Active scan progress: ${progress}%`);
      }
      
      console.log('✅ Active scan complete');
      
    } catch (error) {
      console.error('❌ Active scan failed:', error.message);
    }
  }

  /**
   * Test for OWASP Top 10 vulnerabilities specifically
   */
  async testOwaspTop10() {
    console.log('🔒 Testing for OWASP Top 10 vulnerabilities...');
    
    const owaspTests = [
      { name: 'A01:2021 - Broken Access Control', test: () => this.testBrokenAccessControl() },
      { name: 'A02:2021 - Cryptographic Failures', test: () => this.testCryptographicFailures() },
      { name: 'A03:2021 - Injection', test: () => this.testInjectionFlaws() },
      { name: 'A04:2021 - Insecure Design', test: () => this.testInsecureDesign() },
      { name: 'A05:2021 - Security Misconfiguration', test: () => this.testSecurityMisconfiguration() },
      { name: 'A06:2021 - Vulnerable Components', test: () => this.testVulnerableComponents() },
      { name: 'A07:2021 - Authentication Failures', test: () => this.testAuthenticationFailures() },
      { name: 'A08:2021 - Software Integrity Failures', test: () => this.testSoftwareIntegrityFailures() },
      { name: 'A09:2021 - Security Logging Failures', test: () => this.testSecurityLoggingFailures() },
      { name: 'A10:2021 - Server-Side Request Forgery', test: () => this.testSSRF() },
    ];
    
    for (const { name, test } of owaspTests) {
      try {
        console.log(`Testing: ${name}`);
        await test();
      } catch (error) {
        console.error(`Failed to test ${name}:`, error.message);
      }
    }
  }

  /**
   * Test for broken access control
   */
  async testBrokenAccessControl() {
    const testCases = [
      // Test direct object references
      { method: 'GET', url: `${this.baseUrl}/users/1`, description: 'Direct user ID access' },
      { method: 'GET', url: `${this.baseUrl}/admin/users`, description: 'Admin endpoint access' },
      { method: 'DELETE', url: `${this.baseUrl}/users/1`, description: 'Delete other user' },
      
      // Test privilege escalation
      { method: 'PUT', url: `${this.baseUrl}/users/1/role`, body: { role: 'admin' }, description: 'Role escalation' },
    ];
    
    for (const testCase of testCases) {
      try {
        const response = await axios({
          method: testCase.method,
          url: testCase.url,
          data: testCase.body,
          validateStatus: () => true // Don't throw on HTTP errors
        });
        
        // Check if unauthorized access was successful
        if (response.status === 200 && testCase.url.includes('admin')) {
          this.addVulnerability('HIGH', 'A01:2021 - Broken Access Control', 
            `Unauthorized access to admin endpoint: ${testCase.url}`, testCase.url);
        }
        
      } catch (error) {
        // Network errors are expected for some tests
      }
    }
  }

  /**
   * Test for cryptographic failures
   */
  async testCryptographicFailures() {
    try {
      // Test for HTTP usage
      if (this.baseUrl.startsWith('http://') && !this.baseUrl.includes('localhost')) {
        this.addVulnerability('HIGH', 'A02:2021 - Cryptographic Failures',
          'Application uses HTTP instead of HTTPS in production', this.baseUrl);
      }
      
      // Test password policies
      const weakPasswords = ['123', 'password', 'admin'];
      for (const password of weakPasswords) {
        try {
          const response = await axios.post(`${this.baseUrl}/auth/register`, {
            email: `test-${Date.now()}@example.com`,
            username: `test${Date.now()}`,
            password: password
          }, { validateStatus: () => true });
          
          if (response.status === 201) {
            this.addVulnerability('MEDIUM', 'A02:2021 - Cryptographic Failures',
              'Weak password accepted during registration', `${this.baseUrl}/auth/register`);
          }
        } catch (error) {
          // Expected for weak passwords
        }
      }
      
    } catch (error) {
      console.error('Cryptographic failures test error:', error.message);
    }
  }

  /**
   * Test for injection vulnerabilities
   */
  async testInjectionFlaws() {
    const injectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "<script>alert('XSS')</script>",
      "${7*7}",
      "{{7*7}}",
      "#{7*7}",
    ];
    
    const testEndpoints = [
      `${this.baseUrl}/auth/login`,
      `${this.baseUrl}/search`,
      `${this.baseUrl}/users/profile`,
    ];
    
    for (const endpoint of testEndpoints) {
      for (const payload of injectionPayloads) {
        try {
          const response = await axios.post(endpoint, {
            query: payload,
            email: payload,
            content: payload
          }, { 
            validateStatus: () => true,
            timeout: 5000 
          });
          
          // Check for SQL injection indicators
          if (response.data && typeof response.data === 'string') {
            if (response.data.includes('SQL syntax') || 
                response.data.includes('mysql_') || 
                response.data.includes('ORA-') ||
                response.data.includes('PostgreSQL')) {
              this.addVulnerability('HIGH', 'A03:2021 - Injection',
                `SQL injection vulnerability detected at ${endpoint}`, endpoint);
            }
            
            // Check for XSS reflection
            if (response.data.includes(payload) && payload.includes('<script>')) {
              this.addVulnerability('HIGH', 'A03:2021 - Injection',
                `XSS vulnerability detected at ${endpoint}`, endpoint);
            }
          }
          
        } catch (error) {
          // Timeout or network errors are acceptable
        }
      }
    }
  }

  /**
   * Test for insecure design patterns
   */
  async testInsecureDesign() {
    // Test for common insecure design patterns
    try {
      // Check for information disclosure in error messages
      const response = await axios.get(`${this.baseUrl}/nonexistent-endpoint`, {
        validateStatus: () => true
      });
      
      if (response.data && typeof response.data === 'string') {
        const sensitiveInfo = [
          'stack trace',
          'file path',
          '/home/',
          '/var/',
          'Exception',
          'at Object.',
        ];
        
        for (const info of sensitiveInfo) {
          if (response.data.includes(info)) {
            this.addVulnerability('MEDIUM', 'A04:2021 - Insecure Design',
              `Information disclosure in error messages: ${info}`, 
              `${this.baseUrl}/nonexistent-endpoint`);
            break;
          }
        }
      }
      
    } catch (error) {
      // Expected for non-existent endpoints
    }
  }

  /**
   * Test for security misconfigurations
   */
  async testSecurityMisconfiguration() {
    try {
      // Test for security headers
      const response = await axios.get(this.baseUrl, { validateStatus: () => true });
      
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-XSS-Protection',
      ];
      
      for (const header of requiredHeaders) {
        if (!response.headers[header.toLowerCase()]) {
          this.addVulnerability('MEDIUM', 'A05:2021 - Security Misconfiguration',
            `Missing security header: ${header}`, this.baseUrl);
        }
      }
      
      // Test for server information disclosure
      if (response.headers['server'] || response.headers['x-powered-by']) {
        this.addVulnerability('LOW', 'A05:2021 - Security Misconfiguration',
          'Server information disclosed in headers', this.baseUrl);
      }
      
    } catch (error) {
      console.error('Security misconfiguration test error:', error.message);
    }
  }

  /**
   * Test for vulnerable components
   */
  async testVulnerableComponents() {
    // This would typically involve checking package.json for known vulnerabilities
    // For now, we'll just add a recommendation
    this.scanResults.recommendations.push(
      'Run npm audit regularly to check for vulnerable dependencies'
    );
  }

  /**
   * Test for authentication failures
   */
  async testAuthenticationFailures() {
    try {
      // Test brute force protection
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(
          axios.post(`${this.baseUrl}/auth/login`, {
            email: 'brute-force-test@example.com',
            password: 'wrongpassword'
          }, { validateStatus: () => true })
        );
      }
      
      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];
      
      if (lastResponse.status !== 429) {
        this.addVulnerability('MEDIUM', 'A07:2021 - Authentication Failures',
          'Insufficient brute force protection', `${this.baseUrl}/auth/login`);
      }
      
      // Test session management
      const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.testCredentials.email,
        password: this.testCredentials.password
      }, { validateStatus: () => true });
      
      if (loginResponse.status === 200) {
        const token = loginResponse.data.accessToken;
        
        // Test token in URL (should not be present)
        if (loginResponse.headers.location && loginResponse.headers.location.includes('token=')) {
          this.addVulnerability('HIGH', 'A07:2021 - Authentication Failures',
            'Authentication token exposed in URL', loginResponse.headers.location);
        }
      }
      
    } catch (error) {
      console.error('Authentication failures test error:', error.message);
    }
  }

  /**
   * Test for software integrity failures
   */
  async testSoftwareIntegrityFailures() {
    // Check for SRI (Subresource Integrity) on external resources
    try {
      const frontendResponse = await axios.get(this.frontendUrl, { validateStatus: () => true });
      
      if (frontendResponse.data && typeof frontendResponse.data === 'string') {
        const hasExternalScripts = frontendResponse.data.includes('src="http') || 
                                  frontendResponse.data.includes("src='http");
        const hasSRI = frontendResponse.data.includes('integrity=');
        
        if (hasExternalScripts && !hasSRI) {
          this.addVulnerability('MEDIUM', 'A08:2021 - Software Integrity Failures',
            'External scripts loaded without Subresource Integrity', this.frontendUrl);
        }
      }
      
    } catch (error) {
      console.error('Software integrity failures test error:', error.message);
    }
  }

  /**
   * Test for security logging failures
   */
  async testSecurityLoggingFailures() {
    // This would typically require access to logs
    // For now, we'll add recommendations
    this.scanResults.recommendations.push(
      'Ensure all authentication events are logged with sufficient detail',
      'Implement log monitoring and alerting for security events',
      'Ensure logs do not contain sensitive information'
    );
  }

  /**
   * Test for Server-Side Request Forgery
   */
  async testSSRF() {
    const ssrfPayloads = [
      'http://localhost:22',
      'http://127.0.0.1:22',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd',
    ];
    
    // Test endpoints that might make external requests
    const testEndpoints = [
      `${this.baseUrl}/api/fetch`,
      `${this.baseUrl}/webhook`,
      `${this.baseUrl}/preview`,
    ];
    
    for (const endpoint of testEndpoints) {
      for (const payload of ssrfPayloads) {
        try {
          const response = await axios.post(endpoint, {
            url: payload
          }, { 
            validateStatus: () => true,
            timeout: 5000 
          });
          
          if (response.status === 200 && response.data) {
            this.addVulnerability('HIGH', 'A10:2021 - Server-Side Request Forgery',
              `SSRF vulnerability detected at ${endpoint}`, endpoint);
          }
          
        } catch (error) {
          // Expected for most SSRF attempts
        }
      }
    }
  }

  /**
   * Add vulnerability to results
   */
  addVulnerability(severity, category, description, url) {
    this.scanResults.vulnerabilities.push({
      severity,
      category,
      description,
      url,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get scan results from ZAP
   */
  async getZapResults() {
    try {
      console.log('📋 Collecting scan results...');
      
      const alerts = await this.zapClient.core.alerts();
      
      for (const alert of alerts) {
        this.scanResults.vulnerabilities.push({
          severity: alert.risk,
          category: alert.name,
          description: alert.description,
          url: alert.url,
          solution: alert.solution,
          reference: alert.reference,
          evidence: alert.evidence,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`Found ${alerts.length} vulnerabilities from ZAP scan`);
      
    } catch (error) {
      console.error('Failed to get ZAP results:', error.message);
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    const vulnerabilities = this.scanResults.vulnerabilities;
    
    this.scanResults.summary = {
      total: vulnerabilities.length,
      high: vulnerabilities.filter(v => v.severity === 'HIGH' || v.severity === 'High').length,
      medium: vulnerabilities.filter(v => v.severity === 'MEDIUM' || v.severity === 'Medium').length,
      low: vulnerabilities.filter(v => v.severity === 'LOW' || v.severity === 'Low').length,
      info: vulnerabilities.filter(v => v.severity === 'INFO' || v.severity === 'Informational').length,
    };
    
    // Generate report file
    const reportPath = path.join(__dirname, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.scanResults, null, 2));
    
    console.log('\n📊 Security Scan Results:');
    console.log(`Total vulnerabilities: ${this.scanResults.summary.total}`);
    console.log(`High severity: ${this.scanResults.summary.high}`);
    console.log(`Medium severity: ${this.scanResults.summary.medium}`);
    console.log(`Low severity: ${this.scanResults.summary.low}`);
    console.log(`Info: ${this.scanResults.summary.info}`);
    
    if (this.scanResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.scanResults.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    console.log(`\nFull report saved to: ${reportPath}`);
    
    return this.scanResults;
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Delete test user
      await axios.delete(`${this.baseUrl}/test/cleanup-user`, {
        data: { email: this.testCredentials.email }
      });
      
    } catch (error) {
      console.log('Cleanup completed (some operations may have failed)');
    }
  }

  /**
   * Utility method to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function runSecurityScan() {
  const scanner = new SecurityScanner();
  
  try {
    await scanner.initialize();
    
    // Create test user for authenticated scanning
    const accessToken = await scanner.createTestUser();
    await scanner.setupAuthentication(accessToken);
    
    // Run comprehensive security scan
    await scanner.spiderScan();
    await scanner.passiveScan();
    await scanner.activeScan();
    
    // Test specific OWASP Top 10 vulnerabilities
    await scanner.testOwaspTop10();
    
    // Collect results from ZAP
    await scanner.getZapResults();
    
    // Generate report
    const results = scanner.generateReport();
    
    // Cleanup
    await scanner.cleanup();
    
    // Exit with appropriate code
    const hasHighSeverity = results.summary.high > 0;
    process.exit(hasHighSeverity ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSecurityScan();
}

module.exports = SecurityScanner;