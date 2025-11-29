#!/usr/bin/env node

/**
 * Smoke Tests for CRYB Platform Deployment Validation
 * 
 * These tests verify that all critical services are running and accessible
 * after deployment to any environment (staging, production, etc.)
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3002',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3001',
  MOBILE_URL: process.env.MOBILE_URL || 'http://localhost:19006', // Expo dev server
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/cryb',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  TIMEOUT: 10000, // 10 seconds
  RETRY_COUNT: 3
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest(requestFn, retries = CONFIG.RETRY_COUNT) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      log('warn', `Attempt ${attempt} failed, retrying in 2 seconds...`, { error: error.message });
      await sleep(2000);
    }
  }
}

async function runTest(name, testFn) {
  log('info', `Running test: ${name}`);
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    
    testResults.passed++;
    testResults.tests.push({
      name,
      status: 'PASSED',
      duration,
      message: 'Test completed successfully'
    });
    
    log('info', `✅ PASSED: ${name} (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'FAILED',
      duration,
      error: error.message,
      stack: error.stack
    });
    
    log('error', `❌ FAILED: ${name} (${duration}ms)`, { error: error.message });
    return false;
  }
}

// Health Check Tests
async function testAPIHealth() {
  const response = await retryRequest(async () => {
    return await axios.get(`${CONFIG.API_URL}/health`, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Health check returned success: false');
  }
  
  log('info', 'API health check passed', response.data);
}

async function testWebAppAccess() {
  const response = await retryRequest(async () => {
    return await axios.get(CONFIG.WEB_URL, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  // Check for basic HTML structure
  if (!response.data.includes('<html') && !response.data.includes('<!DOCTYPE html>')) {
    throw new Error('Response does not appear to be valid HTML');
  }
  
  log('info', 'Web app accessibility confirmed');
}

async function testDatabaseConnection() {
  const response = await retryRequest(async () => {
    return await axios.get(`${CONFIG.API_URL}/health/detailed`, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (!response.data.data.database || response.data.data.database.status !== 'healthy') {
    throw new Error('Database health check failed');
  }
  
  log('info', 'Database connection verified');
}

async function testRedisConnection() {
  const response = await retryRequest(async () => {
    return await axios.get(`${CONFIG.API_URL}/health/detailed`, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (!response.data.data.redis || response.data.data.redis.status !== 'healthy') {
    throw new Error('Redis health check failed');
  }
  
  log('info', 'Redis connection verified');
}

// Core Functionality Tests
async function testUserRegistration() {
  const testUser = {
    username: 'smoketest' + Date.now(),
    displayName: 'Smoke Test User',
    email: `smoketest${Date.now()}@example.com`,
    password: 'SmokeTestPass123!',
    confirmPassword: 'SmokeTestPass123!'
  };
  
  const response = await retryRequest(async () => {
    return await axios.post(`${CONFIG.API_URL}/auth/register`, testUser, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.data.tokens.accessToken) {
    throw new Error('Registration did not return access token');
  }
  
  log('info', 'User registration test passed');
  return response.data.data.tokens.accessToken;
}

async function testUserLogin() {
  // First register a user
  const testUser = {
    username: 'logintest' + Date.now(),
    displayName: 'Login Test User',
    email: `logintest${Date.now()}@example.com`,
    password: 'LoginTestPass123!',
    confirmPassword: 'LoginTestPass123!'
  };
  
  await axios.post(`${CONFIG.API_URL}/auth/register`, testUser);
  
  // Then try to login
  const loginResponse = await retryRequest(async () => {
    return await axios.post(`${CONFIG.API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (loginResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${loginResponse.status}`);
  }
  
  if (!loginResponse.data.success || !loginResponse.data.data.tokens.accessToken) {
    throw new Error('Login did not return access token');
  }
  
  log('info', 'User login test passed');
  return loginResponse.data.data.tokens.accessToken;
}

async function testPostCreation() {
  // Get auth token first
  const token = await testUserRegistration();
  
  const testPost = {
    title: 'Smoke Test Post',
    content: 'This is a test post created during smoke testing',
    type: 'text'
  };
  
  const response = await retryRequest(async () => {
    return await axios.post(`${CONFIG.API_URL}/posts`, testPost, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.data.post.id) {
    throw new Error('Post creation did not return post ID');
  }
  
  log('info', 'Post creation test passed');
  return response.data.data.post.id;
}

async function testWebSocketConnection() {
  const { io } = require('socket.io-client');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('WebSocket connection timeout'));
    }, CONFIG.TIMEOUT);
    
    const socket = io(CONFIG.API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.disconnect();
      log('info', 'WebSocket connection test passed');
      resolve();
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket connection failed: ${error.message}`));
    });
  });
}

// Performance Tests
async function testAPIResponseTime() {
  const startTime = Date.now();
  
  await axios.get(`${CONFIG.API_URL}/health`, {
    timeout: CONFIG.TIMEOUT
  });
  
  const responseTime = Date.now() - startTime;
  
  if (responseTime > 5000) {
    throw new Error(`API response time too slow: ${responseTime}ms (max 5000ms)`);
  }
  
  log('info', `API response time: ${responseTime}ms`);
}

async function testWebAppLoadTime() {
  const startTime = Date.now();
  
  await axios.get(CONFIG.WEB_URL, {
    timeout: CONFIG.TIMEOUT
  });
  
  const loadTime = Date.now() - startTime;
  
  if (loadTime > 10000) {
    throw new Error(`Web app load time too slow: ${loadTime}ms (max 10000ms)`);
  }
  
  log('info', `Web app load time: ${loadTime}ms`);
}

// File Upload Tests
async function testFileUpload() {
  const token = await testUserRegistration();
  
  // Create a test file
  const testFileContent = Buffer.from('This is a test file for smoke testing');
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', testFileContent, {
    filename: 'smoke-test.txt',
    contentType: 'text/plain'
  });
  
  const response = await retryRequest(async () => {
    return await axios.post(`${CONFIG.API_URL}/uploads/file`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: CONFIG.TIMEOUT
    });
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success || !response.data.data.upload.url) {
    throw new Error('File upload did not return URL');
  }
  
  log('info', 'File upload test passed');
}

// Security Tests
async function testRateLimiting() {
  const requests = [];
  
  // Make multiple requests rapidly
  for (let i = 0; i < 20; i++) {
    requests.push(
      axios.post(`${CONFIG.API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      }, {
        timeout: CONFIG.TIMEOUT,
        validateStatus: () => true // Don't throw on 4xx/5xx
      })
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  
  if (rateLimitedResponses.length === 0) {
    throw new Error('Rate limiting not working - no 429 responses received');
  }
  
  log('info', `Rate limiting working - ${rateLimitedResponses.length} requests rate limited`);
}

async function testSecurityHeaders() {
  const response = await axios.get(`${CONFIG.API_URL}/health`);
  
  const expectedHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  for (const header of expectedHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing security header: ${header}`);
    }
  }
  
  log('info', 'Security headers test passed');
}

// Environment-specific Tests
async function testEnvironmentConfiguration() {
  const response = await axios.get(`${CONFIG.API_URL}/health/detailed`);
  
  const config = response.data.data.environment;
  
  if (!config) {
    throw new Error('Environment configuration not available');
  }
  
  // Check for production-specific settings if in production
  if (process.env.NODE_ENV === 'production') {
    if (config.debug === true) {
      throw new Error('Debug mode should be disabled in production');
    }
  }
  
  log('info', 'Environment configuration test passed', config);
}

// SSL/TLS Tests (if using HTTPS)
async function testSSLCertificate() {
  if (!CONFIG.API_URL.startsWith('https://')) {
    log('warn', 'Skipping SSL test - API URL is not HTTPS');
    testResults.skipped++;
    return;
  }
  
  const https = require('https');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(CONFIG.API_URL);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: '/health',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      const certificate = res.connection.getPeerCertificate();
      
      if (!certificate || Object.keys(certificate).length === 0) {
        reject(new Error('No SSL certificate found'));
        return;
      }
      
      const now = new Date();
      const validFrom = new Date(certificate.valid_from);
      const validTo = new Date(certificate.valid_to);
      
      if (now < validFrom || now > validTo) {
        reject(new Error('SSL certificate is expired or not yet valid'));
        return;
      }
      
      log('info', 'SSL certificate test passed', {
        subject: certificate.subject,
        issuer: certificate.issuer,
        validFrom: certificate.valid_from,
        validTo: certificate.valid_to
      });
      
      resolve();
    });
    
    req.on('error', (error) => {
      reject(new Error(`SSL test failed: ${error.message}`));
    });
    
    req.setTimeout(CONFIG.TIMEOUT, () => {
      reject(new Error('SSL test timeout'));
    });
    
    req.end();
  });
}

// Mobile App Tests
async function testMobileAppAccess() {
  try {
    const response = await axios.get(CONFIG.MOBILE_URL, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status === 200) {
      log('info', 'Mobile app dev server is accessible');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('warn', 'Mobile app dev server not running - skipping test');
      testResults.skipped++;
      return;
    }
    throw error;
  }
}

// Voice/Video Service Tests
async function testVoiceVideoServices() {
  const response = await axios.get(`${CONFIG.API_URL}/health/detailed`);
  
  if (response.data.data.services && response.data.data.services.livekit) {
    if (response.data.data.services.livekit.status !== 'healthy') {
      throw new Error('LiveKit service is not healthy');
    }
    log('info', 'Voice/video services test passed');
  } else {
    log('warn', 'Voice/video services not configured - skipping test');
    testResults.skipped++;
  }
}

// Main test runner
async function runSmokeTests() {
  log('info', '🚀 Starting CRYB Platform Smoke Tests');
  log('info', 'Configuration:', CONFIG);
  
  const tests = [
    // Core Health Tests
    { name: 'API Health Check', fn: testAPIHealth },
    { name: 'Web App Access', fn: testWebAppAccess },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Redis Connection', fn: testRedisConnection },
    
    // Functionality Tests
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Post Creation', fn: testPostCreation },
    { name: 'WebSocket Connection', fn: testWebSocketConnection },
    { name: 'File Upload', fn: testFileUpload },
    
    // Performance Tests
    { name: 'API Response Time', fn: testAPIResponseTime },
    { name: 'Web App Load Time', fn: testWebAppLoadTime },
    
    // Security Tests
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'SSL Certificate', fn: testSSLCertificate },
    
    // Environment Tests
    { name: 'Environment Configuration', fn: testEnvironmentConfiguration },
    { name: 'Mobile App Access', fn: testMobileAppAccess },
    { name: 'Voice/Video Services', fn: testVoiceVideoServices }
  ];
  
  const startTime = Date.now();
  
  for (const test of tests) {
    await runTest(test.name, test.fn);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Generate report
  const report = {
    summary: {
      total: tests.length,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        apiUrl: CONFIG.API_URL,
        webUrl: CONFIG.WEB_URL
      }
    },
    tests: testResults.tests
  };
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'smoke-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  log('info', '📊 Smoke Test Results Summary:');
  log('info', `Total Tests: ${report.summary.total}`);
  log('info', `✅ Passed: ${report.summary.passed}`);
  log('info', `❌ Failed: ${report.summary.failed}`);
  log('info', `⏭️  Skipped: ${report.summary.skipped}`);
  log('info', `⏱️  Duration: ${totalDuration}ms`);
  log('info', `📄 Full report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    log('error', '💥 Some smoke tests failed!');
    process.exit(1);
  } else {
    log('info', '🎉 All smoke tests passed!');
    process.exit(0);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runSmokeTests().catch((error) => {
    log('error', 'Smoke tests failed with error:', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = {
  runSmokeTests,
  CONFIG
};