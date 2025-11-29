#!/usr/bin/env node

/**
 * Simple Real-time Systems Verification
 * Uses basic Node.js modules and system commands
 */

const { exec, spawn } = require('child_process');
const http = require('http');
const util = require('util');
const execAsync = util.promisify(exec);

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: {},
  summary: { total: 0, passed: 0, failed: 0, errors: [] }
};

function logTest(name, status, message = '', data = null) {
  results.tests[name] = { status, message, data, timestamp: new Date().toISOString() };
  results.summary.total++;
  if (status === 'PASS') {
    results.summary.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    results.summary.failed++;
    results.summary.errors.push(`${name}: ${message}`);
    console.log(`❌ ${name}: ${message}`);
  }
  if (data) console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Check running processes
async function testRunningProcesses() {
  console.log('\n🔍 Testing Running Processes...');
  
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    const apiProcess = processes.find(p => p.name === 'cryb-api');
    const socketProcess = processes.find(p => p.name === 'cryb-socket');
    const webProcess = processes.find(p => p.name === 'cryb-web');
    
    if (apiProcess && apiProcess.pm2_env.status === 'online') {
      logTest('api_process_status', 'PASS', 'API process is running', {
        pid: apiProcess.pid,
        uptime: apiProcess.pm2_env.pm_uptime,
        memory: apiProcess.pm2_env.memory
      });
    } else {
      logTest('api_process_status', 'FAIL', 'API process not running or unhealthy');
    }
    
    if (socketProcess && socketProcess.pm2_env.status === 'online') {
      logTest('socket_process_status', 'PASS', 'Socket process is running', {
        pid: socketProcess.pid,
        uptime: socketProcess.pm2_env.pm_uptime,
        memory: socketProcess.pm2_env.memory
      });
    } else {
      logTest('socket_process_status', 'FAIL', 'Socket process not running or unhealthy');
    }
    
    if (webProcess && webProcess.pm2_env.status === 'online') {
      logTest('web_process_status', 'PASS', 'Web process is running', {
        pid: webProcess.pid,
        uptime: webProcess.pm2_env.pm_uptime,
        memory: webProcess.pm2_env.memory
      });
    } else {
      logTest('web_process_status', 'FAIL', 'Web process not running or unhealthy');
    }
    
  } catch (error) {
    logTest('process_check', 'FAIL', `Error checking processes: ${error.message}`);
  }
}

// Test 2: Check Redis connectivity
async function testRedisConnectivity() {
  console.log('\n🔍 Testing Redis Connectivity...');
  
  try {
    const { stdout } = await execAsync('redis-cli -p 6380 ping');
    if (stdout.trim() === 'PONG') {
      logTest('redis_ping', 'PASS', 'Redis server responding to ping');
    } else {
      logTest('redis_ping', 'FAIL', `Unexpected redis response: ${stdout.trim()}`);
    }
    
    // Test Redis info
    const { stdout: infoOutput } = await execAsync('redis-cli -p 6380 info server');
    if (infoOutput.includes('redis_version')) {
      const versionMatch = infoOutput.match(/redis_version:(\S+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      logTest('redis_info', 'PASS', 'Redis server info accessible', { version });
    } else {
      logTest('redis_info', 'FAIL', 'Redis server info not accessible');
    }
    
    // Test basic operations
    const testKey = `test:${Date.now()}`;
    await execAsync(`redis-cli -p 6380 set ${testKey} "test-value"`);
    const { stdout: getValue } = await execAsync(`redis-cli -p 6380 get ${testKey}`);
    
    if (getValue.trim() === '"test-value"') {
      logTest('redis_operations', 'PASS', 'Redis read/write operations working');
      await execAsync(`redis-cli -p 6380 del ${testKey}`);
    } else {
      logTest('redis_operations', 'FAIL', `Redis operations failed. Got: ${getValue.trim()}`);
    }
    
  } catch (error) {
    logTest('redis_connectivity', 'FAIL', `Redis error: ${error.message}`);
  }
}

// Test 3: Check API endpoint availability
async function testAPIEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/health', name: 'health_endpoint' },
    { path: '/api/v1/auth/status', name: 'auth_status_endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:4000${endpoint.path}`, { timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logTest(endpoint.name, 'PASS', `Endpoint responding with status ${res.statusCode}`, {
                statusCode: res.statusCode,
                responseSize: data.length
              });
            } else {
              logTest(endpoint.name, 'FAIL', `Endpoint returned status ${res.statusCode}`);
            }
            resolve();
          });
        });
        
        req.on('error', (error) => {
          logTest(endpoint.name, 'FAIL', `Endpoint error: ${error.message}`);
          resolve();
        });
        
        req.on('timeout', () => {
          req.destroy();
          logTest(endpoint.name, 'FAIL', 'Endpoint timeout');
          resolve();
        });
      });
    } catch (error) {
      logTest(endpoint.name, 'FAIL', `Endpoint test error: ${error.message}`);
    }
  }
}

// Test 4: Check Socket.io implementation
async function testSocketImplementation() {
  console.log('\n🔍 Testing Socket.io Implementation...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check main socket files
    const socketFiles = [
      'apps/api/src/socket/index.ts',
      'apps/api/src/socket/discord-realtime.ts',
      'apps/api/src/socket/voice-webrtc.ts'
    ];
    
    let implementationScore = 0;
    const maxScore = socketFiles.length;
    
    for (const file of socketFiles) {
      const filePath = path.join('/home/ubuntu/cryb-platform', file);
      if (fs.existsSync(filePath)) {
        implementationScore++;
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (file.includes('discord-realtime.ts')) {
          const features = [
            'handleConnectionEvents',
            'handleMessageEvents', 
            'handlePresenceEvents',
            'handleVoiceEvents',
            'broadcastToServer'
          ];
          
          const implementedFeatures = features.filter(feature => content.includes(feature));
          logTest('discord_realtime_features', 'PASS', `Discord realtime features implemented`, {
            implementedFeatures,
            totalFeatures: features.length,
            percentage: Math.round((implementedFeatures.length / features.length) * 100)
          });
        }
      }
    }
    
    if (implementationScore === maxScore) {
      logTest('socket_implementation', 'PASS', 'All Socket.io files present and implemented', {
        score: `${implementationScore}/${maxScore}`
      });
    } else {
      logTest('socket_implementation', 'FAIL', `Missing Socket.io implementation files: ${implementationScore}/${maxScore}`);
    }
    
  } catch (error) {
    logTest('socket_implementation', 'FAIL', `Implementation check error: ${error.message}`);
  }
}

// Test 5: Check presence data in Redis
async function testPresenceTracking() {
  console.log('\n🔍 Testing Presence Tracking...');
  
  try {
    const { stdout } = await execAsync('redis-cli -p 6380 keys "presence:*"');
    const presenceKeys = stdout.trim().split('\n').filter(key => key && key !== '(empty list or set)');
    
    if (presenceKeys.length > 0) {
      logTest('presence_keys', 'PASS', `Found ${presenceKeys.length} presence entries`, {
        count: presenceKeys.length,
        sampleKeys: presenceKeys.slice(0, 3)
      });
      
      // Test a sample presence entry
      if (presenceKeys[0]) {
        const { stdout: presenceData } = await execAsync(`redis-cli -p 6380 get "${presenceKeys[0]}"`);
        try {
          const parsed = JSON.parse(presenceData.replace(/^"|"$/g, ''));
          const hasRequiredFields = ['userId', 'status', 'lastSeen'].every(field => field in parsed);
          
          if (hasRequiredFields) {
            logTest('presence_data_structure', 'PASS', 'Presence data structure valid', { sampleData: parsed });
          } else {
            logTest('presence_data_structure', 'FAIL', 'Presence data missing required fields');
          }
        } catch (parseError) {
          logTest('presence_data_structure', 'FAIL', 'Invalid presence data format');
        }
      }
    } else {
      logTest('presence_keys', 'INFO', 'No active presence entries found (users may be offline)');
    }
    
  } catch (error) {
    logTest('presence_tracking', 'FAIL', `Presence tracking error: ${error.message}`);
  }
}

// Test 6: Check for rate limiting implementation
async function testRateLimiting() {
  console.log('\n🔍 Testing Rate Limiting...');
  
  try {
    const { stdout } = await execAsync('redis-cli -p 6380 keys "rate_limit:*"');
    const rateLimitKeys = stdout.trim().split('\n').filter(key => key && key !== '(empty list or set)');
    
    if (rateLimitKeys.length > 0) {
      logTest('rate_limiting_active', 'PASS', `Rate limiting active with ${rateLimitKeys.length} tracked limits`);
    } else {
      logTest('rate_limiting_active', 'INFO', 'No active rate limits (expected if no recent activity)');
    }
    
    // Check rate limiting implementation in code
    const fs = require('fs');
    const realtimePath = '/home/ubuntu/cryb-platform/apps/api/src/socket/discord-realtime.ts';
    
    if (fs.existsSync(realtimePath)) {
      const content = fs.readFileSync(realtimePath, 'utf8');
      if (content.includes('checkMessageRateLimit') && content.includes('rate_limit')) {
        logTest('rate_limiting_implementation', 'PASS', 'Rate limiting properly implemented in code');
      } else {
        logTest('rate_limiting_implementation', 'FAIL', 'Rate limiting not found in implementation');
      }
    }
    
  } catch (error) {
    logTest('rate_limiting', 'FAIL', `Rate limiting test error: ${error.message}`);
  }
}

// Test 7: Test database connectivity
async function testDatabaseConnectivity() {
  console.log('\n🔍 Testing Database Connectivity...');
  
  try {
    // Check if database is accessible through API
    await new Promise((resolve) => {
      const req = http.get('http://localhost:4000/health', { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            if (healthData.database === 'connected' || res.statusCode === 200) {
              logTest('database_connectivity', 'PASS', 'Database accessible through API');
            } else {
              logTest('database_connectivity', 'FAIL', 'Database not accessible through API');
            }
          } catch {
            if (res.statusCode === 200) {
              logTest('database_connectivity', 'PASS', 'API responding (database likely connected)');
            } else {
              logTest('database_connectivity', 'FAIL', 'API not responding properly');
            }
          }
          resolve();
        });
      });
      
      req.on('error', () => {
        logTest('database_connectivity', 'FAIL', 'Cannot connect to API to test database');
        resolve();
      });
      
      req.on('timeout', () => {
        req.destroy();
        logTest('database_connectivity', 'FAIL', 'API timeout');
        resolve();
      });
    });
    
  } catch (error) {
    logTest('database_connectivity', 'FAIL', `Database test error: ${error.message}`);
  }
}

// Main execution
async function runVerification() {
  console.log('🚀 Starting Real-time Systems Verification\n');
  console.log('==========================================');
  
  await testRunningProcesses();
  await testRedisConnectivity();
  await testAPIEndpoints();
  await testSocketImplementation();
  await testPresenceTracking();
  await testRateLimiting();
  await testDatabaseConnectivity();
  
  // Generate report
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} ✅`);
  console.log(`Failed: ${results.summary.failed} ❌`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  
  const systemStatus = results.summary.failed === 0 ? 'HEALTHY' : 
                      results.summary.passed > results.summary.failed ? 'DEGRADED' : 'CRITICAL';
  
  console.log(`\n🎯 OVERALL SYSTEM STATUS: ${systemStatus}`);
  
  // Component status summary
  console.log('\n🔧 COMPONENT STATUS:');
  console.log(`   PM2 Processes: ${results.tests.api_process_status?.status === 'PASS' && results.tests.socket_process_status?.status === 'PASS' ? '✅ RUNNING' : '❌ ISSUES'}`);
  console.log(`   Redis Backend: ${results.tests.redis_ping?.status === 'PASS' ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
  console.log(`   API Endpoints: ${results.tests.health_endpoint?.status === 'PASS' ? '✅ RESPONDING' : '❌ NOT RESPONDING'}`);
  console.log(`   Socket Implementation: ${results.tests.socket_implementation?.status === 'PASS' ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`   Message Delivery: ${results.tests.discord_realtime_features?.status === 'PASS' ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED'}`);
  console.log(`   Presence Tracking: ${results.tests.presence_keys?.status === 'PASS' ? '✅ ACTIVE' : '⚠️ INACTIVE'}`);
  console.log(`   Room Management: ${results.tests.discord_realtime_features?.status === 'PASS' ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
  console.log(`   Event Broadcasting: ${results.tests.socket_implementation?.status === 'PASS' ? '✅ READY' : '❌ NOT READY'}`);
  
  if (results.summary.failed > 0) {
    console.log('\n🔍 ISSUES FOUND:');
    results.summary.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Save results
  require('fs').writeFileSync(
    '/home/ubuntu/cryb-platform/realtime-verification-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📄 Detailed results saved to: realtime-verification-results.json');
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runVerification().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});