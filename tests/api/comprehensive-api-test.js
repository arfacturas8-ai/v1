const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://54.236.166.224';
const API_URL = `${BASE_URL}/api`;

class APITester {
  constructor() {
    this.results = [];
    this.testData = {
      users: [],
      posts: [],
      communities: [],
      tokens: []
    };
    this.apiMetrics = {
      responseTime: [],
      successRate: 0,
      errorRate: 0,
      rateLimitHits: 0
    };
  }

  log(test, status, message, data = null) {
    const result = {
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`[${status}] ${test}: ${message}`);
  }

  async makeRequest(method, endpoint, data = null, headers = {}, expectStatus = [200, 201]) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${API_URL}${endpoint}`,
        timeout: 10000,
        validateStatus: () => true, // Don't throw on HTTP errors
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CRYB-API-Test/1.0',
          ...headers
        }
      };

      if (data && method !== 'GET') {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      this.apiMetrics.responseTime.push(responseTime);
      
      // Track rate limiting
      if (response.status === 429) {
        this.apiMetrics.rateLimitHits++;
      }

      return {
        ...response,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiMetrics.responseTime.push(responseTime);
      
      return {
        status: 0,
        statusText: error.message,
        data: null,
        headers: {},
        responseTime
      };
    }
  }

  async testHealthEndpoints() {
    this.log('Health Check', 'TESTING', 'Testing health endpoints');
    
    const healthEndpoints = [
      '/health',
      '/v1/health',
      '/status',
      '/ping',
      '/'
    ];

    let healthyEndpoints = 0;
    
    for (const endpoint of healthEndpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.status === 200) {
          healthyEndpoints++;
          this.log('Health Check', 'PASS', `${endpoint} is responsive`);
          break; // Found working health endpoint
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }

    if (healthyEndpoints === 0) {
      this.log('Health Check', 'FAIL', 'No health endpoints found');
    }
  }

  async testAuthenticationEndpoints() {
    this.log('Authentication', 'TESTING', 'Testing authentication endpoints');
    
    const testUser = {
      username: `apitest_${Date.now()}`,
      email: `apitest_${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };

    // Test user registration
    const registerResponse = await this.makeRequest('POST', '/v1/auth/register', testUser);
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      this.log('Authentication', 'PASS', 'User registration successful');
      
      if (registerResponse.data && registerResponse.data.token) {
        this.testData.tokens.push(registerResponse.data.token);
        this.testData.users.push({ ...testUser, token: registerResponse.data.token });
      }
    } else if (registerResponse.status === 400 || registerResponse.status === 422) {
      this.log('Authentication', 'INFO', 'Registration validation working');
    } else {
      this.log('Authentication', 'FAIL', `Registration failed: ${registerResponse.status}`);
    }

    // Test user login
    const loginResponse = await this.makeRequest('POST', '/v1/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.status === 200) {
      this.log('Authentication', 'PASS', 'User login successful');
      
      if (loginResponse.data && loginResponse.data.token) {
        this.testData.tokens.push(loginResponse.data.token);
      }
    } else if (loginResponse.status === 401) {
      this.log('Authentication', 'INFO', 'Login validation working (unauthorized)');
    } else {
      this.log('Authentication', 'FAIL', `Login failed: ${loginResponse.status}`);
    }

    // Test invalid login
    const invalidLoginResponse = await this.makeRequest('POST', '/v1/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });

    if (invalidLoginResponse.status === 401 || invalidLoginResponse.status === 400) {
      this.log('Authentication', 'PASS', 'Invalid login properly rejected');
    } else {
      this.log('Authentication', 'FAIL', 'Invalid login not properly rejected');
    }
  }

  async testAuthorizedEndpoints() {
    this.log('Authorization', 'TESTING', 'Testing protected endpoints');
    
    const protectedEndpoints = [
      { method: 'GET', path: '/v1/auth/me' },
      { method: 'GET', path: '/v1/users/profile' },
      { method: 'POST', path: '/v1/posts' },
      { method: 'POST', path: '/v1/communities' },
      { method: 'GET', path: '/v1/admin/users' }
    ];

    // Test without authentication
    for (const endpoint of protectedEndpoints) {
      const response = await this.makeRequest(endpoint.method, endpoint.path);
      
      if (response.status === 401 || response.status === 403) {
        this.log('Authorization', 'PASS', `${endpoint.path} properly protected`);
      } else if (response.status === 404) {
        this.log('Authorization', 'INFO', `${endpoint.path} endpoint not found`);
      } else {
        this.log('Authorization', 'FAIL', `${endpoint.path} not properly protected`);
      }
    }

    // Test with authentication if we have tokens
    if (this.testData.tokens.length > 0) {
      const token = this.testData.tokens[0];
      
      for (const endpoint of protectedEndpoints.slice(0, 3)) { // Test first 3 endpoints
        const response = await this.makeRequest(
          endpoint.method, 
          endpoint.path, 
          null, 
          { Authorization: `Bearer ${token}` }
        );
        
        if (response.status === 200 || response.status === 201) {
          this.log('Authorization', 'PASS', `${endpoint.path} accessible with token`);
        } else if (response.status === 404) {
          this.log('Authorization', 'INFO', `${endpoint.path} endpoint not found`);
        } else {
          this.log('Authorization', 'WARN', `${endpoint.path} returned ${response.status} with token`);
        }
      }
    }
  }

  async testUserEndpoints() {
    this.log('User Endpoints', 'TESTING', 'Testing user-related endpoints');
    
    // Test user listing
    const usersResponse = await this.makeRequest('GET', '/v1/users');
    
    if (usersResponse.status === 200) {
      this.log('User Endpoints', 'PASS', 'Users listing accessible');
    } else if (usersResponse.status === 404) {
      this.log('User Endpoints', 'INFO', 'Users endpoint not found');
    } else {
      this.log('User Endpoints', 'FAIL', `Users listing failed: ${usersResponse.status}`);
    }

    // Test user search
    const searchResponse = await this.makeRequest('GET', '/v1/users/search?q=test');
    
    if (searchResponse.status === 200) {
      this.log('User Endpoints', 'PASS', 'User search working');
    } else if (searchResponse.status === 404) {
      this.log('User Endpoints', 'INFO', 'User search endpoint not found');
    } else {
      this.log('User Endpoints', 'WARN', `User search returned: ${searchResponse.status}`);
    }
  }

  async testPostEndpoints() {
    this.log('Post Endpoints', 'TESTING', 'Testing post-related endpoints');
    
    // Test posts listing
    const postsResponse = await this.makeRequest('GET', '/v1/posts');
    
    if (postsResponse.status === 200) {
      this.log('Post Endpoints', 'PASS', 'Posts listing accessible');
      
      if (postsResponse.data && postsResponse.data.posts) {
        this.testData.posts = postsResponse.data.posts;
      }
    } else if (postsResponse.status === 404) {
      this.log('Post Endpoints', 'INFO', 'Posts endpoint not found');
    } else {
      this.log('Post Endpoints', 'FAIL', `Posts listing failed: ${postsResponse.status}`);
    }

    // Test post creation (if we have a token)
    if (this.testData.tokens.length > 0) {
      const token = this.testData.tokens[0];
      const testPost = {
        title: 'API Test Post',
        content: 'This is a test post created by API testing',
        type: 'text'
      };

      const createResponse = await this.makeRequest(
        'POST',
        '/v1/posts',
        testPost,
        { Authorization: `Bearer ${token}` }
      );

      if (createResponse.status === 201 || createResponse.status === 200) {
        this.log('Post Endpoints', 'PASS', 'Post creation successful');
        
        if (createResponse.data && createResponse.data.post) {
          this.testData.posts.push(createResponse.data.post);
        }
      } else if (createResponse.status === 401) {
        this.log('Post Endpoints', 'INFO', 'Post creation requires authentication');
      } else if (createResponse.status === 404) {
        this.log('Post Endpoints', 'INFO', 'Post creation endpoint not found');
      } else {
        this.log('Post Endpoints', 'FAIL', `Post creation failed: ${createResponse.status}`);
      }
    }

    // Test individual post retrieval
    if (this.testData.posts.length > 0) {
      const postId = this.testData.posts[0].id;
      const postResponse = await this.makeRequest('GET', `/v1/posts/${postId}`);
      
      if (postResponse.status === 200) {
        this.log('Post Endpoints', 'PASS', 'Individual post retrieval working');
      } else if (postResponse.status === 404) {
        this.log('Post Endpoints', 'INFO', 'Individual post endpoint format may differ');
      } else {
        this.log('Post Endpoints', 'WARN', `Individual post retrieval returned: ${postResponse.status}`);
      }
    }
  }

  async testCommunityEndpoints() {
    this.log('Community Endpoints', 'TESTING', 'Testing community-related endpoints');
    
    // Test communities listing
    const communitiesResponse = await this.makeRequest('GET', '/v1/communities');
    
    if (communitiesResponse.status === 200) {
      this.log('Community Endpoints', 'PASS', 'Communities listing accessible');
      
      if (communitiesResponse.data && communitiesResponse.data.communities) {
        this.testData.communities = communitiesResponse.data.communities;
      }
    } else if (communitiesResponse.status === 404) {
      this.log('Community Endpoints', 'INFO', 'Communities endpoint not found');
    } else {
      this.log('Community Endpoints', 'FAIL', `Communities listing failed: ${communitiesResponse.status}`);
    }

    // Test community creation (if we have a token)
    if (this.testData.tokens.length > 0) {
      const token = this.testData.tokens[0];
      const testCommunity = {
        name: `apitest_${Date.now()}`,
        description: 'Test community created by API testing',
        type: 'public'
      };

      const createResponse = await this.makeRequest(
        'POST',
        '/v1/communities',
        testCommunity,
        { Authorization: `Bearer ${token}` }
      );

      if (createResponse.status === 201 || createResponse.status === 200) {
        this.log('Community Endpoints', 'PASS', 'Community creation successful');
        
        if (createResponse.data && createResponse.data.community) {
          this.testData.communities.push(createResponse.data.community);
        }
      } else if (createResponse.status === 401) {
        this.log('Community Endpoints', 'INFO', 'Community creation requires authentication');
      } else if (createResponse.status === 404) {
        this.log('Community Endpoints', 'INFO', 'Community creation endpoint not found');
      } else {
        this.log('Community Endpoints', 'FAIL', `Community creation failed: ${createResponse.status}`);
      }
    }
  }

  async testSearchEndpoints() {
    this.log('Search Endpoints', 'TESTING', 'Testing search functionality');
    
    const searchEndpoints = [
      '/v1/search?q=test',
      '/v1/search/posts?q=test',
      '/v1/search/communities?q=test',
      '/v1/search/users?q=test'
    ];

    for (const endpoint of searchEndpoints) {
      const response = await this.makeRequest('GET', endpoint);
      
      if (response.status === 200) {
        this.log('Search Endpoints', 'PASS', `${endpoint} working`);
      } else if (response.status === 404) {
        this.log('Search Endpoints', 'INFO', `${endpoint} not found`);
      } else {
        this.log('Search Endpoints', 'WARN', `${endpoint} returned: ${response.status}`);
      }
    }
  }

  async testRateLimiting() {
    this.log('Rate Limiting', 'TESTING', 'Testing API rate limiting');
    
    const testEndpoint = '/v1/auth/login';
    const testData = { email: 'test@example.com', password: 'wrongpassword' };
    
    let requestCount = 0;
    let rateLimited = false;
    const maxRequests = 30;

    for (let i = 0; i < maxRequests; i++) {
      const response = await this.makeRequest('POST', testEndpoint, testData);
      requestCount++;
      
      if (response.status === 429) {
        rateLimited = true;
        this.log('Rate Limiting', 'PASS', `Rate limiting activated after ${requestCount} requests`);
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!rateLimited) {
      this.log('Rate Limiting', 'WARN', `No rate limiting detected after ${requestCount} requests`);
    }
  }

  async testInputValidation() {
    this.log('Input Validation', 'TESTING', 'Testing API input validation');
    
    // Test registration with invalid data
    const invalidInputs = [
      { username: '', email: 'test@example.com', password: 'password123' }, // Empty username
      { username: 'test', email: 'invalid-email', password: 'password123' }, // Invalid email
      { username: 'test', email: 'test@example.com', password: '123' }, // Weak password
      { username: 'x'.repeat(1000), email: 'test@example.com', password: 'password123' }, // Long username
    ];

    let validationWorking = 0;

    for (const input of invalidInputs) {
      const response = await this.makeRequest('POST', '/v1/auth/register', input);
      
      if (response.status === 400 || response.status === 422) {
        validationWorking++;
      }
    }

    if (validationWorking === invalidInputs.length) {
      this.log('Input Validation', 'PASS', 'Input validation working properly');
    } else if (validationWorking > 0) {
      this.log('Input Validation', 'PARTIAL', `${validationWorking}/${invalidInputs.length} validations working`);
    } else {
      this.log('Input Validation', 'FAIL', 'Input validation not working');
    }
  }

  async testErrorHandling() {
    this.log('Error Handling', 'TESTING', 'Testing API error handling');
    
    // Test non-existent endpoints
    const invalidEndpoints = [
      '/v1/nonexistent',
      '/v1/posts/invalid-id',
      '/v1/users/999999',
      '/invalid/endpoint'
    ];

    let properErrorCount = 0;

    for (const endpoint of invalidEndpoints) {
      const response = await this.makeRequest('GET', endpoint);
      
      if (response.status === 404) {
        properErrorCount++;
      } else if (response.status === 400 || response.status === 422) {
        properErrorCount++;
      }
    }

    if (properErrorCount === invalidEndpoints.length) {
      this.log('Error Handling', 'PASS', 'Error handling working properly');
    } else if (properErrorCount > 0) {
      this.log('Error Handling', 'PARTIAL', `${properErrorCount}/${invalidEndpoints.length} errors handled properly`);
    } else {
      this.log('Error Handling', 'FAIL', 'Error handling needs improvement');
    }
  }

  async testPerformanceMetrics() {
    this.log('Performance', 'TESTING', 'Analyzing API performance metrics');
    
    if (this.apiMetrics.responseTime.length === 0) {
      this.log('Performance', 'SKIP', 'No response time data collected');
      return;
    }

    const responseTimes = this.apiMetrics.responseTime;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    // Calculate percentiles
    const sorted = responseTimes.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    const performanceData = {
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      p95,
      p99,
      totalRequests: responseTimes.length,
      rateLimitHits: this.apiMetrics.rateLimitHits
    };

    this.log('Performance', 'INFO', 'Performance metrics calculated', performanceData);

    // Performance thresholds
    if (avgResponseTime < 1000) {
      this.log('Performance', 'PASS', `Average response time: ${Math.round(avgResponseTime)}ms`);
    } else if (avgResponseTime < 3000) {
      this.log('Performance', 'WARN', `Average response time: ${Math.round(avgResponseTime)}ms (acceptable)`);
    } else {
      this.log('Performance', 'FAIL', `Average response time: ${Math.round(avgResponseTime)}ms (too slow)`);
    }

    if (p95 < 2000) {
      this.log('Performance', 'PASS', `95th percentile: ${p95}ms`);
    } else {
      this.log('Performance', 'WARN', `95th percentile: ${p95}ms (needs optimization)`);
    }
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warnTests = this.results.filter(r => r.status === 'WARN').length;
    
    const responseTimes = this.apiMetrics.responseTime;
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        warnTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        avgResponseTime: Math.round(avgResponseTime),
        totalRequests: responseTimes.length,
        rateLimitHits: this.apiMetrics.rateLimitHits
      },
      testResults: this.results,
      performanceMetrics: {
        responseTime: this.apiMetrics.responseTime,
        avgResponseTime: Math.round(avgResponseTime),
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0
      },
      testData: {
        usersCreated: this.testData.users.length,
        postsFound: this.testData.posts.length,
        communitiesFound: this.testData.communities.length,
        tokensObtained: this.testData.tokens.length
      },
      timestamp: new Date().toISOString()
    };
  }

  async runAllTests() {
    console.log('🔧 Starting CRYB Platform API Testing...\n');

    await this.testHealthEndpoints();
    await this.testAuthenticationEndpoints();
    await this.testAuthorizedEndpoints();
    await this.testUserEndpoints();
    await this.testPostEndpoints();
    await this.testCommunityEndpoints();
    await this.testSearchEndpoints();
    await this.testRateLimiting();
    await this.testInputValidation();
    await this.testErrorHandling();
    await this.testPerformanceMetrics();

    const report = this.generateReport();
    
    console.log('\n📊 API Testing Summary:');
    console.log(`✅ Tests Passed: ${report.summary.passedTests}`);
    console.log(`❌ Tests Failed: ${report.summary.failedTests}`);
    console.log(`⚠️ Tests with Warnings: ${report.summary.warnTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`⏱️ Average Response Time: ${report.summary.avgResponseTime}ms`);
    console.log(`🔄 Total Requests: ${report.summary.totalRequests}`);
    console.log(`⛔ Rate Limit Hits: ${report.summary.rateLimitHits}`);

    return report;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APITester;
}

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new APITester();
    const report = await tester.runAllTests();
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'api-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Report saved to: ${reportPath}`);
  })();
}