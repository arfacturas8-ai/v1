#!/usr/bin/env node

/**
 * REAL PROGRESS CHECK - Test what actually works
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';
const timestamp = Date.now();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ ${name}: WORKING (${response.status})`, 'green');
      return { working: true, status: response.status, data: response.data };
    } else {
      log(`⚠️  ${name}: DEGRADED (${response.status})`, 'yellow');
      return { working: false, status: response.status };
    }
  } catch (error) {
    if (error.response) {
      log(`❌ ${name}: FAILED (${error.response.status}) - ${error.response.data?.error || error.response.statusText}`, 'red');
      return { working: false, status: error.response.status, error: error.response.data };
    } else {
      log(`❌ ${name}: FAILED - ${error.message}`, 'red');
      return { working: false, error: error.message };
    }
  }
}

async function realProgressCheck() {
  log('\n' + '='.repeat(60), 'bold');
  log('🔍 REAL PROGRESS CHECK - What Actually Works', 'bold');
  log('='.repeat(60), 'bold');
  
  const results = {
    infrastructure: {},
    auth: {},
    discord: {},
    files: {},
    voice: {},
    realtime: {}
  };
  
  // Infrastructure
  log('\n🏗️ Testing Infrastructure...', 'blue');
  results.infrastructure.health = await testEndpoint('Health Check', 'GET', '/health');
  results.infrastructure.docs = await testEndpoint('API Documentation', 'GET', '/documentation');
  
  // Authentication
  log('\n🔐 Testing Authentication...', 'blue');
  results.auth.register = await testEndpoint('User Registration', 'POST', '/api/v1/auth/register', {
    email: `realtest${timestamp}@example.com`,
    username: `realtest${timestamp}`,
    displayName: 'Real Test User',
    password: 'RealTest123!',
    confirmPassword: 'RealTest123!'
  }, { 'Content-Type': 'application/json' });
  
  // Get token if registration worked
  let authToken = null;
  if (results.auth.register.working && results.auth.register.data?.data?.tokens?.accessToken) {
    authToken = results.auth.register.data.data.tokens.accessToken;
    log(`   Token obtained: ${authToken.substring(0, 20)}...`, 'cyan');
  }
  
  if (authToken) {
    // Test authenticated endpoints
    results.auth.me = await testEndpoint('Get User Profile', 'GET', '/api/v1/users/me', null, {
      'Authorization': `Bearer ${authToken}`
    });
  }
  
  // Discord Features
  log('\n🎮 Testing Discord Features...', 'blue');
  results.discord.servers_list = await testEndpoint('List Servers', 'GET', '/api/v1/servers', null, {
    'Authorization': `Bearer ${authToken || 'test'}`
  });
  
  if (authToken) {
    results.discord.server_create = await testEndpoint('Create Server', 'POST', '/api/v1/servers', {
      name: `Test Server ${timestamp}`,
      description: 'Real progress test server'
    }, {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });
  }
  
  // File Uploads
  log('\n📁 Testing File Upload...', 'blue');
  if (authToken) {
    results.files.stats = await testEndpoint('Upload Stats', 'GET', '/api/v1/uploads/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    results.files.signed_url = await testEndpoint('Signed URL', 'POST', '/api/v1/uploads/signed-url', {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    }, {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });
  }
  
  // Voice/Video
  log('\n🎙️ Testing Voice/Video...', 'blue');
  if (authToken) {
    results.voice.health = await testEndpoint('Voice Health', 'GET', '/api/v1/voice/health', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    results.voice.rooms = await testEndpoint('Create Voice Room', 'POST', '/api/v1/voice/rooms', {
      name: `Test Room ${timestamp}`,
      maxParticipants: 4
    }, {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });
  }
  
  // Calculate actual progress
  log('\n' + '='.repeat(60), 'bold');
  log('📊 REAL PROGRESS ANALYSIS', 'bold');
  log('='.repeat(60), 'bold');
  
  let totalTests = 0;
  let passingTests = 0;
  
  Object.keys(results).forEach(category => {
    const categoryTests = Object.keys(results[category]).length;
    const categoryPassing = Object.values(results[category]).filter(r => r.working).length;
    
    totalTests += categoryTests;
    passingTests += categoryPassing;
    
    if (categoryTests > 0) {
      const percentage = Math.round((categoryPassing / categoryTests) * 100);
      log(`${category.toUpperCase()}: ${categoryPassing}/${categoryTests} (${percentage}%)`, 
          percentage > 70 ? 'green' : percentage > 40 ? 'yellow' : 'red');
    }
  });
  
  const overallPercentage = Math.round((passingTests / totalTests) * 100);
  log(`\nOVERALL: ${passingTests}/${totalTests} (${overallPercentage}%)`, 
      overallPercentage > 70 ? 'green' : overallPercentage > 40 ? 'yellow' : 'red');
  
  // Reality check
  log('\n🎯 REALITY CHECK:', 'bold');
  if (overallPercentage >= 70) {
    log('✅ Claims are ACCURATE - Platform is functional', 'green');
  } else if (overallPercentage >= 50) {
    log('⚠️  Claims are OPTIMISTIC - Some features not working', 'yellow');
  } else {
    log('❌ Claims are INFLATED - Major issues present', 'red');
  }
  
  log(`\nACTUAL WORKING PERCENTAGE: ${overallPercentage}%`, 'bold');
  log(`CLAIMED PERCENTAGE: 70-75%`, 'cyan');
  
  return { overallPercentage, results };
}

if (require.main === module) {
  realProgressCheck().then(({ overallPercentage }) => {
    process.exit(overallPercentage > 50 ? 0 : 1);
  }).catch(error => {
    console.error('Progress check failed:', error);
    process.exit(1);
  });
}

module.exports = { realProgressCheck };