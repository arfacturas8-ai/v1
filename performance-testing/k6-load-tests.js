/**
 * ==============================================
 * CRYB PLATFORM - COMPREHENSIVE LOAD TESTING
 * ==============================================
 * K6 performance testing suite for Cryb Platform
 * Tests API, WebSocket, and business logic under load
 * ==============================================
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ==============================================
// CONFIGURATION
// ==============================================

const config = {
  baseUrl: __ENV.BASE_URL || 'https://api.cryb.ai',
  wsUrl: __ENV.WS_URL || 'wss://api.cryb.ai',
  
  // Test users
  testUsers: {
    count: parseInt(__ENV.TEST_USERS || '100'),
    credentials: JSON.parse(__ENV.TEST_CREDENTIALS || '{}')
  },
  
  // Performance thresholds
  thresholds: {
    api_response_time: 2000,    // 2 seconds max
    websocket_latency: 500,     // 500ms max
    error_rate: 0.05,           // 5% max error rate
    concurrent_users: 1000      // Max concurrent users
  }
};

// ==============================================
// CUSTOM METRICS
// ==============================================

const apiErrors = new Counter('api_errors_total');
const websocketErrors = new Counter('websocket_errors_total');
const authSuccessRate = new Rate('auth_success_rate');
const messageLatency = new Trend('message_latency');
const concurrentConnections = new Gauge('concurrent_websocket_connections');
const businessMetrics = {
  userRegistrations: new Counter('load_test_user_registrations'),
  messagesSeent: new Counter('load_test_messages_sent'),
  postsCreated: new Counter('load_test_posts_created'),
  voiceCallsStarted: new Counter('load_test_voice_calls_started')
};

// ==============================================
// TEST SCENARIOS CONFIGURATION
// ==============================================

export const options = {
  scenarios: {
    // ==============================================
    // API LOAD TEST - STANDARD OPERATIONS
    // ==============================================
    api_load_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },    // Ramp up
        { duration: '5m', target: 100 },   // Steady load
        { duration: '2m', target: 200 },   // Peak load
        { duration: '3m', target: 200 },   // Sustained peak
        { duration: '2m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'apiLoadTest',
      tags: { test_type: 'api_load' }
    },
    
    // ==============================================
    // WEBSOCKET STRESS TEST
    // ==============================================
    websocket_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      exec: 'websocketTest',
      tags: { test_type: 'websocket' }
    },
    
    // ==============================================
    // SPIKE TEST - SUDDEN TRAFFIC INCREASE
    // ==============================================
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },    // Normal load
        { duration: '30s', target: 500 },  // Spike
        { duration: '2m', target: 500 },   // Sustained spike
        { duration: '30s', target: 10 },   // Back to normal
      ],
      exec: 'spikeTest',
      tags: { test_type: 'spike' }
    },
    
    // ==============================================
    // STRESS TEST - FIND BREAKING POINT
    // ==============================================
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 400 },
        { duration: '2m', target: 0 },
      ],
      exec: 'stressTest',
      tags: { test_type: 'stress' }
    },
    
    // ==============================================
    // ENDURANCE TEST - LONG DURATION
    // ==============================================
    endurance_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30m',
      exec: 'enduranceTest',
      tags: { test_type: 'endurance' }
    },
    
    // ==============================================
    // BUSINESS FLOW TEST - USER JOURNEYS
    // ==============================================
    business_flow_test: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 25 },
        { duration: '8m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      exec: 'businessFlowTest',
      tags: { test_type: 'business_flow' }
    }
  },
  
  // Performance thresholds
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'],
    'websocket_connecting_time': ['p(95)<1000'],
    'message_latency': ['p(95)<500'],
    'api_errors_total': ['count<100'],
    'auth_success_rate': ['rate>0.95'],
    'concurrent_websocket_connections': ['value<1000']
  },
  
  // Test data collection
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  
  // External metrics (Prometheus)
  ext: {
    prometheus: {
      addr: 'localhost:9090',
      namespace: 'k6_load_test'
    }
  }
};

// ==============================================
// SETUP AND TEARDOWN
// ==============================================

export function setup() {
  console.log('🚀 Starting Cryb Platform Load Tests');
  console.log(`Target: ${config.baseUrl}`);
  console.log(`WebSocket: ${config.wsUrl}`);
  
  // Create test data
  const testData = {
    users: [],
    authTokens: new Map(),
    communities: [],
    channels: []
  };
  
  // Generate test users
  for (let i = 0; i < config.testUsers.count; i++) {
    testData.users.push({
      username: `loadtest_${randomString(8)}`,
      email: `loadtest_${randomString(8)}@example.com`,
      password: 'LoadTest123!',
      id: null
    });
  }
  
  console.log(`Generated ${testData.users.length} test users`);
  return testData;
}

export function teardown(data) {
  console.log('🧹 Cleaning up test data...');
  
  // Cleanup test users and data
  // This would typically involve API calls to delete test data
  console.log('Load test complete');
}

// ==============================================
// API LOAD TEST
// ==============================================

export function apiLoadTest(data) {
  group('API Load Test', () => {
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    let authToken;
    
    // Authentication flow
    group('Authentication', () => {
      if (!data.authTokens.has(user.username)) {
        // Register user if not exists
        const registerResponse = http.post(`${config.baseUrl}/api/auth/register`, {
          username: user.username,
          email: user.email,
          password: user.password
        });
        
        const registerSuccess = check(registerResponse, {
          'registration successful': (r) => r.status === 201 || r.status === 409
        });
        
        if (registerSuccess) {
          businessMetrics.userRegistrations.add(1);
        }
        
        // Login to get token
        const loginResponse = http.post(`${config.baseUrl}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        const loginSuccess = check(loginResponse, {
          'login successful': (r) => r.status === 200,
          'token received': (r) => r.json('token') !== undefined
        });
        
        authSuccessRate.add(loginSuccess);
        
        if (loginSuccess) {
          authToken = loginResponse.json('token');
          data.authTokens.set(user.username, authToken);
        }
      } else {
        authToken = data.authTokens.get(user.username);
      }
    });
    
    if (authToken) {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      
      // API endpoint tests
      group('Core API Endpoints', () => {
        // Get user profile
        const profileResponse = http.get(`${config.baseUrl}/api/user/profile`, { headers });
        check(profileResponse, {
          'profile fetch successful': (r) => r.status === 200
        });
        
        // Get communities list
        const communitiesResponse = http.get(`${config.baseUrl}/api/communities`, { headers });
        check(communitiesResponse, {
          'communities fetch successful': (r) => r.status === 200
        });
        
        // Create a post
        const postResponse = http.post(`${config.baseUrl}/api/posts`, {
          title: `Load test post ${randomString(10)}`,
          content: `This is a load test post created at ${new Date().toISOString()}`,
          communityId: randomIntBetween(1, 10)
        }, { headers });
        
        const postSuccess = check(postResponse, {
          'post creation successful': (r) => r.status === 201
        });
        
        if (postSuccess) {
          businessMetrics.postsCreated.add(1);
        }
        
        // Search functionality
        const searchResponse = http.get(
          `${config.baseUrl}/api/search?q=${randomString(5)}&type=posts`,
          { headers }
        );
        check(searchResponse, {
          'search successful': (r) => r.status === 200
        });
      });
      
      // Health and status endpoints
      group('System Endpoints', () => {
        const healthResponse = http.get(`${config.baseUrl}/api/health`);
        check(healthResponse, {
          'health check successful': (r) => r.status === 200
        });
        
        const metricsResponse = http.get(`${config.baseUrl}/api/metrics`);
        check(metricsResponse, {
          'metrics endpoint accessible': (r) => r.status === 200
        });
      });
    }
    
    // Track API errors
    if (!check(null, { 'no auth token': () => authToken !== undefined })) {
      apiErrors.add(1);
    }
  });
  
  sleep(randomIntBetween(1, 3));
}

// ==============================================
// WEBSOCKET TEST
// ==============================================

export function websocketTest(data) {
  group('WebSocket Test', () => {
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    const authToken = data.authTokens.get(user.username);
    
    if (!authToken) {
      websocketErrors.add(1);
      return;
    }
    
    const wsUrl = `${config.wsUrl}/socket.io/?EIO=4&transport=websocket&token=${authToken}`;
    
    const response = ws.connect(wsUrl, {}, function(socket) {
      concurrentConnections.add(1);
      
      socket.on('open', () => {
        console.log('WebSocket connected');
        
        // Join a room
        socket.send(JSON.stringify({
          type: 'join_room',
          data: { room: `test_room_${randomIntBetween(1, 10)}` }
        }));
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        const latency = Date.now() - message.timestamp;
        messageLatency.add(latency);
      });
      
      socket.on('error', (error) => {
        console.log('WebSocket error:', error);
        websocketErrors.add(1);
      });
      
      // Send messages periodically
      const messageInterval = setInterval(() => {
        const message = {
          type: 'chat_message',
          data: {
            content: `Load test message ${randomString(20)}`,
            timestamp: Date.now()
          }
        };
        socket.send(JSON.stringify(message));
        businessMetrics.messagesSeent.add(1);
      }, randomIntBetween(2000, 5000));
      
      // Keep connection alive for test duration
      setTimeout(() => {
        clearInterval(messageInterval);
        socket.close();
        concurrentConnections.add(-1);
      }, randomIntBetween(30000, 60000));
    });
    
    check(response, {
      'websocket connected': (r) => r && r.status === 101
    });
  });
}

// ==============================================
// SPIKE TEST
// ==============================================

export function spikeTest(data) {
  group('Spike Test', () => {
    // Simulate sudden high load with multiple rapid requests
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(['GET', `${config.baseUrl}/api/health`]);
      requests.push(['GET', `${config.baseUrl}/api/communities`]);
    }
    
    const responses = http.batch(requests);
    
    responses.forEach((response, index) => {
      check(response, {
        [`spike request ${index} successful`]: (r) => r.status === 200
      });
    });
  });
  
  sleep(0.1); // Minimal sleep for spike test
}

// ==============================================
// STRESS TEST
// ==============================================

export function stressTest(data) {
  group('Stress Test', () => {
    // Higher load version of API test
    apiLoadTest(data);
    
    // Additional concurrent requests
    const batchRequests = [
      ['GET', `${config.baseUrl}/api/health`],
      ['GET', `${config.baseUrl}/api/metrics`],
      ['GET', `${config.baseUrl}/api/status`]
    ];
    
    const batchResponses = http.batch(batchRequests);
    
    batchResponses.forEach((response, index) => {
      check(response, {
        [`stress batch ${index} successful`]: (r) => r.status < 400
      });
    });
  });
  
  sleep(0.5);
}

// ==============================================
// ENDURANCE TEST
// ==============================================

export function enduranceTest(data) {
  group('Endurance Test', () => {
    // Steady load over long period
    apiLoadTest(data);
    
    // Monitor for memory leaks and performance degradation
    const startTime = Date.now();
    
    if (startTime % 60000 < 1000) { // Every minute
      console.log(`Endurance test running for ${(Date.now() - startTime) / 1000}s`);
    }
  });
  
  sleep(randomIntBetween(2, 5));
}

// ==============================================
// BUSINESS FLOW TEST
// ==============================================

export function businessFlowTest(data) {
  group('Business Flow Test', () => {
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    let authToken = data.authTokens.get(user.username);
    
    // Complete user journey simulation
    group('User Registration Journey', () => {
      if (!authToken) {
        // New user registration
        const registerResponse = http.post(`${config.baseUrl}/api/auth/register`, {
          username: user.username,
          email: user.email,
          password: user.password
        });
        
        check(registerResponse, {
          'registration in journey successful': (r) => r.status === 201 || r.status === 409
        });
        
        // Email verification simulation
        sleep(1);
        
        // Login
        const loginResponse = http.post(`${config.baseUrl}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        const loginSuccess = check(loginResponse, {
          'login in journey successful': (r) => r.status === 200
        });
        
        if (loginSuccess) {
          authToken = loginResponse.json('token');
          data.authTokens.set(user.username, authToken);
        }
      }
    });
    
    if (authToken) {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      
      group('Content Creation Journey', () => {
        // Browse communities
        const communitiesResponse = http.get(`${config.baseUrl}/api/communities`, { headers });
        check(communitiesResponse, {
          'communities browsing successful': (r) => r.status === 200
        });
        
        sleep(2); // Reading time
        
        // Create post
        const postResponse = http.post(`${config.baseUrl}/api/posts`, {
          title: `Business flow post ${randomString(10)}`,
          content: `This post simulates real user behavior with longer content and realistic timing patterns.`,
          communityId: randomIntBetween(1, 5)
        }, { headers });
        
        check(postResponse, {
          'post creation in journey successful': (r) => r.status === 201
        });
        
        sleep(3); // Think time
        
        // Read and comment on other posts
        const postsResponse = http.get(`${config.baseUrl}/api/posts?limit=10`, { headers });
        
        if (check(postsResponse, { 'posts fetch successful': (r) => r.status === 200 })) {
          const posts = postsResponse.json('data');
          
          if (posts && posts.length > 0) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            
            // Add comment
            const commentResponse = http.post(`${config.baseUrl}/api/posts/${randomPost.id}/comments`, {
              content: `Great post! ${randomString(10)}`
            }, { headers });
            
            check(commentResponse, {
              'comment creation successful': (r) => r.status === 201
            });
          }
        }
      });
      
      group('Social Interaction Journey', () => {
        // Search for content
        const searchResponse = http.get(
          `${config.baseUrl}/api/search?q=test&type=all`,
          { headers }
        );
        
        check(searchResponse, {
          'search in journey successful': (r) => r.status === 200
        });
        
        sleep(2);
        
        // Join/leave communities
        const joinResponse = http.post(`${config.baseUrl}/api/communities/1/join`, {}, { headers });
        check(joinResponse, {
          'community join successful': (r) => r.status === 200 || r.status === 409
        });
      });
      
      group('Voice Call Simulation', () => {
        // Simulate voice call start
        const voiceResponse = http.post(`${config.baseUrl}/api/voice/start`, {
          type: 'test_call',
          participants: [user.id]
        }, { headers });
        
        const voiceSuccess = check(voiceResponse, {
          'voice call start successful': (r) => r.status === 200 || r.status === 201
        });
        
        if (voiceSuccess) {
          businessMetrics.voiceCallsStarted.add(1);
          
          // Simulate call duration
          sleep(randomIntBetween(10, 30));
          
          // End call
          const endResponse = http.post(`${config.baseUrl}/api/voice/end`, {
            callId: voiceResponse.json('callId')
          }, { headers });
          
          check(endResponse, {
            'voice call end successful': (r) => r.status === 200
          });
        }
      });
    }
  });
  
  sleep(randomIntBetween(5, 10)); // Realistic user pause
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data),
    'load-test-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

function htmlReport(data) {
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cryb Platform Load Test Results</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
            .passed { border-left-color: #28a745; }
            .failed { border-left-color: #dc3545; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>🚀 Cryb Platform Load Test Results</h1>
        <div class="summary">
            <h2>Test Summary</h2>
            <p><strong>Duration:</strong> ${data.metrics.http_req_duration?.values?.avg || 'N/A'}ms average response time</p>
            <p><strong>Success Rate:</strong> ${((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2)}%</p>
            <p><strong>Total Requests:</strong> ${data.metrics.http_reqs?.values?.count || 'N/A'}</p>
        </div>
        
        <h2>Performance Metrics</h2>
        ${Object.entries(data.metrics).map(([name, metric]) => `
            <div class="metric ${metric.thresholds ? (Object.values(metric.thresholds).every(t => t.ok) ? 'passed' : 'failed') : ''}">
                <strong>${name}:</strong> ${JSON.stringify(metric.values || metric.value || 'N/A')}
            </div>
        `).join('')}
        
        <h2>Business Metrics</h2>
        <div class="metric">
            <strong>User Registrations:</strong> ${data.metrics.load_test_user_registrations?.values?.count || 0}
        </div>
        <div class="metric">
            <strong>Messages Sent:</strong> ${data.metrics.load_test_messages_sent?.values?.count || 0}
        </div>
        <div class="metric">
            <strong>Posts Created:</strong> ${data.metrics.load_test_posts_created?.values?.count || 0}
        </div>
        <div class="metric">
            <strong>Voice Calls Started:</strong> ${data.metrics.load_test_voice_calls_started?.values?.count || 0}
        </div>
    </body>
    </html>
  `;
  return template;
}