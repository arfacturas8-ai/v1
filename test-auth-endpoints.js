#!/usr/bin/env node

/**
 * CRYB Platform Authentication Endpoint Tests
 * 
 * Tests actual authentication endpoints to verify they work correctly
 */

const https = require('https');
const http = require('http');

console.log('🧪 CRYB Platform Authentication Endpoint Tests');
console.log('===============================================\n');

class AuthEndpointTester {
  constructor(baseUrl = 'http://localhost:3002') {
    this.baseUrl = baseUrl;
    this.results = { total: 0, passed: 0, failed: 0, tests: [] };
    this.testUser = {
      username: `testuser_${Date.now()}`,
      displayName: 'Test User',
      email: `test_${Date.now()}@cryb.ai`,
      password: 'TestPassword123!'
    };
    this.tokens = {};
  }

  logTest(name, passed, details = '') {
    this.results.total++;
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name} - PASS ${details}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name} - FAIL ${details}`);
    }
    this.results.tests.push({ name, passed, details });
  }

  /**
   * Make HTTP request
   */
  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CRYB-Auth-Tester/1.0',
          ...headers
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: jsonBody,
              rawBody: body
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body,
              rawBody: body
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Test API Health
   */
  async testHealth() {
    console.log('🏥 API Health Tests');
    console.log('-------------------');

    try {
      const response = await this.makeRequest('GET', '/health');
      
      this.logTest(
        'API Health Endpoint',
        response.status === 200,
        `(${response.status})`
      );

      if (response.body && typeof response.body === 'object') {
        this.logTest(
          'Health Response Format',
          response.body.status || response.body.checks,
          '(structured response)'
        );
      }

    } catch (error) {
      this.logTest('API Health Endpoint', false, `(${error.message})`);
    }
  }

  /**
   * Test User Registration
   */
  async testRegistration() {
    console.log('\n👤 User Registration Tests');
    console.log('--------------------------');

    try {
      // Test valid registration
      const response = await this.makeRequest('POST', '/api/v1/auth/register', this.testUser);
      
      this.logTest(
        'User Registration',
        response.status === 201,
        `(${response.status})`
      );

      if (response.status === 201 && response.body.success) {
        this.logTest(
          'Registration Response Format',
          response.body.data && response.body.data.user && response.body.data.tokens,
          '(user and tokens returned)'
        );

        if (response.body.data.tokens) {
          this.tokens.accessToken = response.body.data.tokens.accessToken;
          this.tokens.refreshToken = response.body.data.tokens.refreshToken;
          
          this.logTest(
            'JWT Tokens Generated',
            this.tokens.accessToken && this.tokens.refreshToken,
            '(access and refresh tokens)'
          );
        }
      }

      // Test duplicate registration (should fail)
      const duplicateResponse = await this.makeRequest('POST', '/api/v1/auth/register', this.testUser);
      this.logTest(
        'Duplicate Registration Prevention',
        duplicateResponse.status === 409 || duplicateResponse.status === 400,
        `(${duplicateResponse.status} - prevented)`
      );

      // Test weak password
      const weakPasswordUser = {
        ...this.testUser,
        username: `weakpass_${Date.now()}`,
        email: `weak_${Date.now()}@cryb.ai`,
        password: '123456'
      };
      
      const weakResponse = await this.makeRequest('POST', '/api/v1/auth/register', weakPasswordUser);
      this.logTest(
        'Weak Password Rejection',
        weakResponse.status === 400,
        `(${weakResponse.status} - rejected)`
      );

    } catch (error) {
      this.logTest('User Registration', false, `(${error.message})`);
    }
  }

  /**
   * Test User Login
   */
  async testLogin() {
    console.log('\n🔐 User Login Tests');
    console.log('-------------------');

    try {
      // Test valid login
      const loginData = {
        username: this.testUser.username,
        password: this.testUser.password
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
      
      this.logTest(
        'User Login',
        response.status === 200,
        `(${response.status})`
      );

      if (response.status === 200 && response.body.success) {
        this.logTest(
          'Login Response Format',
          response.body.data && response.body.data.user && response.body.data.tokens,
          '(user and tokens returned)'
        );

        // Update tokens from login
        if (response.body.data.tokens) {
          this.tokens.accessToken = response.body.data.tokens.accessToken;
          this.tokens.refreshToken = response.body.data.tokens.refreshToken;
        }
      }

      // Test invalid login
      const invalidLogin = {
        username: this.testUser.username,
        password: 'wrongpassword'
      };

      const invalidResponse = await this.makeRequest('POST', '/api/v1/auth/login', invalidLogin);
      this.logTest(
        'Invalid Login Rejection',
        invalidResponse.status === 401 || invalidResponse.status === 400,
        `(${invalidResponse.status} - rejected)`
      );

      // Test non-existent user
      const nonExistentLogin = {
        username: 'nonexistentuser12345',
        password: 'anypassword'
      };

      const nonExistentResponse = await this.makeRequest('POST', '/api/v1/auth/login', nonExistentLogin);
      this.logTest(
        'Non-existent User Login',
        nonExistentResponse.status === 401 || nonExistentResponse.status === 400,
        `(${nonExistentResponse.status} - rejected)`
      );

    } catch (error) {
      this.logTest('User Login', false, `(${error.message})`);
    }
  }

  /**
   * Test Protected Routes
   */
  async testProtectedRoutes() {
    console.log('\n🛡️  Protected Route Tests');
    console.log('------------------------');

    try {
      // Test access without token
      const noTokenResponse = await this.makeRequest('GET', '/api/v1/auth/me');
      this.logTest(
        'Protected Route Without Token',
        noTokenResponse.status === 401,
        `(${noTokenResponse.status} - unauthorized)`
      );

      // Test access with invalid token
      const invalidTokenResponse = await this.makeRequest('GET', '/api/v1/auth/me', null, {
        'Authorization': 'Bearer invalidtoken123'
      });
      this.logTest(
        'Protected Route Invalid Token',
        invalidTokenResponse.status === 401,
        `(${invalidTokenResponse.status} - unauthorized)`
      );

      // Test access with valid token
      if (this.tokens.accessToken) {
        const validTokenResponse = await this.makeRequest('GET', '/api/v1/auth/me', null, {
          'Authorization': `Bearer ${this.tokens.accessToken}`
        });
        
        this.logTest(
          'Protected Route Valid Token',
          validTokenResponse.status === 200,
          `(${validTokenResponse.status} - authorized)`
        );

        if (validTokenResponse.status === 200) {
          this.logTest(
            'User Profile Response',
            validTokenResponse.body.data && validTokenResponse.body.data.user,
            '(user data returned)'
          );
        }
      } else {
        this.logTest('Protected Route Valid Token', false, '(no access token available)');
      }

    } catch (error) {
      this.logTest('Protected Routes', false, `(${error.message})`);
    }
  }

  /**
   * Test Token Refresh
   */
  async testTokenRefresh() {
    console.log('\n🔄 Token Refresh Tests');
    console.log('----------------------');

    try {
      if (!this.tokens.refreshToken) {
        this.logTest('Token Refresh', false, '(no refresh token available)');
        return;
      }

      // Test token refresh
      const refreshData = {
        refreshToken: this.tokens.refreshToken
      };

      const response = await this.makeRequest('POST', '/api/v1/auth/refresh', refreshData);
      
      this.logTest(
        'Token Refresh',
        response.status === 200,
        `(${response.status})`
      );

      if (response.status === 200 && response.body.success) {
        this.logTest(
          'Refresh Response Format',
          response.body.data && response.body.data.tokens,
          '(new tokens returned)'
        );

        // Update tokens
        if (response.body.data.tokens) {
          this.tokens.accessToken = response.body.data.tokens.accessToken;
          this.tokens.refreshToken = response.body.data.tokens.refreshToken;
        }
      }

      // Test invalid refresh token
      const invalidRefreshData = {
        refreshToken: 'invalid.refresh.token'
      };

      const invalidResponse = await this.makeRequest('POST', '/api/v1/auth/refresh', invalidRefreshData);
      this.logTest(
        'Invalid Refresh Token',
        invalidResponse.status === 401 || invalidResponse.status === 400,
        `(${invalidResponse.status} - rejected)`
      );

    } catch (error) {
      this.logTest('Token Refresh', false, `(${error.message})`);
    }
  }

  /**
   * Test Rate Limiting
   */
  async testRateLimiting() {
    console.log('\n⚡ Rate Limiting Tests');
    console.log('---------------------');

    try {
      // Test multiple rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeRequest('POST', '/api/v1/auth/login', {
          username: 'nonexistent',
          password: 'invalid'
        }));
      }

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );

      this.logTest(
        'Rate Limiting Active',
        rateLimitedResponses.length > 0 || responses.some(r => 
          r.status === 'fulfilled' && r.value.headers && 
          (r.value.headers['x-ratelimit-limit'] || r.value.headers['x-ratelimit-remaining'])
        ),
        `(rate limit headers or 429 responses)`
      );

      // Check for rate limit headers
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.status === 'fulfilled' && lastResponse.value.headers) {
        const hasHeaders = lastResponse.value.headers['x-ratelimit-limit'] || 
                          lastResponse.value.headers['x-ratelimit-remaining'];
        
        this.logTest(
          'Rate Limit Headers',
          !!hasHeaders,
          hasHeaders ? '(headers present)' : '(headers missing)'
        );
      }

    } catch (error) {
      this.logTest('Rate Limiting', false, `(${error.message})`);
    }
  }

  /**
   * Test Logout
   */
  async testLogout() {
    console.log('\n🚪 Logout Tests');
    console.log('---------------');

    try {
      if (!this.tokens.accessToken) {
        this.logTest('User Logout', false, '(no access token available)');
        return;
      }

      // Test logout
      const response = await this.makeRequest('POST', '/api/v1/auth/logout', null, {
        'Authorization': `Bearer ${this.tokens.accessToken}`
      });
      
      this.logTest(
        'User Logout',
        response.status === 200,
        `(${response.status})`
      );

      // Test access after logout (should fail)
      const afterLogoutResponse = await this.makeRequest('GET', '/api/v1/auth/me', null, {
        'Authorization': `Bearer ${this.tokens.accessToken}`
      });
      
      this.logTest(
        'Access After Logout',
        afterLogoutResponse.status === 401,
        `(${afterLogoutResponse.status} - token invalidated)`
      );

    } catch (error) {
      this.logTest('User Logout', false, `(${error.message})`);
    }
  }

  /**
   * Generate Test Results
   */
  generateResults() {
    console.log('\n📊 Authentication Endpoint Test Results');
    console.log('========================================');
    
    const score = (this.results.passed / this.results.total) * 100;
    
    console.log(`\nEndpoint Tests:`);
    console.log(`  Total: ${this.results.total}`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`\nSuccess Rate: ${score.toFixed(1)}%`);
    
    // Show failed tests
    const failedTests = this.results.tests.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name} ${test.details}`);
      });
    }

    // Overall assessment
    if (score >= 90) {
      console.log('\n✅ EXCELLENT: All authentication endpoints working properly!');
    } else if (score >= 80) {
      console.log('\n✅ GOOD: Most authentication features working, minor issues found.');
    } else if (score >= 70) {
      console.log('\n⚠️  FAIR: Several authentication issues need attention.');
    } else {
      console.log('\n❌ POOR: Critical authentication problems found.');
    }

    console.log('\n🔧 Test Configuration:');
    console.log(`   API Base URL: ${this.baseUrl}`);
    console.log(`   Test User: ${this.testUser.username} (${this.testUser.email})`);
    
    return { score, failedTests };
  }

  /**
   * Run all endpoint tests
   */
  async runAllTests() {
    console.log('Testing authentication endpoints...\n');
    
    await this.testHealth();
    await this.testRegistration();
    await this.testLogin();
    await this.testProtectedRoutes();
    await this.testTokenRefresh();
    await this.testRateLimiting();
    await this.testLogout();
    
    return this.generateResults();
  }
}

/**
 * Main execution
 */
async function main() {
  const apiUrl = process.argv[2] || 'http://localhost:3002';
  const tester = new AuthEndpointTester(apiUrl);
  
  try {
    const result = await tester.runAllTests();
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Authentication Endpoint Tests Complete');
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(result.score >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Endpoint tests failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = AuthEndpointTester;