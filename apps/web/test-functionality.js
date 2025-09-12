#!/usr/bin/env node

/**
 * Basic functionality test script for CRYB platform
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3002';
const WEB_BASE = 'http://localhost:3000';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAPIEndpoint(name, url, expectedStatus = 200) {
  try {
    const response = await makeRequest(url);
    if (response.status === expectedStatus) {
      log('green', `✓ ${name}: OK (${response.status})`);
      return true;
    } else {
      log('yellow', `⚠ ${name}: Unexpected status ${response.status} (expected ${expectedStatus})`);
      return false;
    }
  } catch (error) {
    log('red', `✗ ${name}: ${error.message}`);
    return false;
  }
}

async function testWebPage(name, url) {
  try {
    const response = await makeRequest(url);
    if (response.status === 200 && response.data.includes('<!DOCTYPE html')) {
      log('green', `✓ ${name}: OK`);
      return true;
    } else {
      log('yellow', `⚠ ${name}: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    log('red', `✗ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('bold', '🚀 Testing CRYB Platform Functionality');
  log('blue', '==========================================\n');

  let passed = 0;
  let total = 0;

  // API Health Checks
  log('bold', '🏥 API Health Checks');
  total++; passed += await testAPIEndpoint('API Health', `${API_BASE}/health`) ? 1 : 0;
  total++; passed += await testAPIEndpoint('API Auth Endpoints', `${API_BASE}/api/v1/auth/me`, 401) ? 1 : 0; // Should be unauthorized
  total++; passed += await testAPIEndpoint('API Posts Endpoint', `${API_BASE}/api/posts`, 200) ? 1 : 0;
  total++; passed += await testAPIEndpoint('API Communities', `${API_BASE}/api/communities`, 200) ? 1 : 0;
  
  console.log('');

  // Web Application Pages
  log('bold', '🌐 Web Application Pages');
  total++; passed += await testWebPage('Home Page', `${WEB_BASE}/`) ? 1 : 0;
  total++; passed += await testWebPage('Login Page', `${WEB_BASE}/login`) ? 1 : 0;
  total++; passed += await testWebPage('Register Page', `${WEB_BASE}/register`) ? 1 : 0;
  total++; passed += await testWebPage('Reddit Demo', `${WEB_BASE}/reddit-demo`) ? 1 : 0;
  total++; passed += await testWebPage('Profile Page', `${WEB_BASE}/profile`) ? 1 : 0;
  
  console.log('');

  // Server Status
  log('bold', '📊 Server Status');
  try {
    const apiHealth = await makeRequest(`${API_BASE}/health`);
    if (apiHealth.data && apiHealth.data.status === 'healthy') {
      log('green', '✓ API Server: Healthy');
      if (apiHealth.data.services) {
        Object.entries(apiHealth.data.services).forEach(([service, status]) => {
          const color = status === 'connected' || status === 'healthy' ? 'green' : 'yellow';
          log(color, `  - ${service}: ${status}`);
        });
      }
      passed++;
    } else {
      log('yellow', '⚠ API Server: Partial Health');
    }
    total++;
  } catch (error) {
    log('red', `✗ API Server: ${error.message}`);
    total++;
  }

  console.log('');

  // Results
  log('bold', '📈 Test Results');
  log('blue', '================');
  log('green', `✓ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    log('green', '🎉 All tests passed! The CRYB platform is working correctly.');
  } else {
    log('yellow', `⚠ ${total - passed} tests had issues. Check the logs above for details.`);
  }

  console.log('');
  log('bold', '🔗 Access URLs:');
  log('blue', `Web App: ${WEB_BASE}`);
  log('blue', `API: ${API_BASE}`);
  log('blue', `Reddit Demo: ${WEB_BASE}/reddit-demo`);
  log('blue', `Profile: ${WEB_BASE}/profile`);
  log('blue', `Chat: ${WEB_BASE}/chat`);

  return passed === total;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});