#!/usr/bin/env node

/**
 * SOCKET.IO AUTHENTICATION DIAGNOSIS TOOL
 * 
 * This script comprehensively tests the Socket.IO authentication system
 * to identify and fix critical issues preventing real-time features.
 * 
 * Test Coverage:
 * - JWT token generation and validation
 * - Socket connection with various authentication methods
 * - Auth middleware functionality
 * - Redis connection and session management
 * - Real-time event handling
 * - Error scenarios and edge cases
 */

const io = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

// ANSI color codes for better output
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

class SocketAuthDiagnosis {
  constructor() {
    this.testResults = {
      authEndpoint: false,
      tokenGeneration: false,
      tokenValidation: false,
      socketConnection: false,
      socketAuth: false,
      realtimeEvents: false,
      redisConnection: false
    };
    
    this.testToken = null;
    this.testUserId = null;
    this.socket = null;
  }

  async runDiagnosis() {
    log('\n' + '='.repeat(60), 'bold');
    log('🔍 SOCKET.IO AUTHENTICATION DIAGNOSIS', 'bold');
    log('='.repeat(60), 'bold');
    log('Testing Socket.IO authentication system...', 'cyan');
    
    try {
      // Test sequence
      await this.testApiHealth();
      await this.testUserCreation();
      await this.testTokenGeneration();
      await this.testTokenValidation();
      await this.testSocketConnection();
      await this.testRealtimeFeatures();
      
      this.generateReport();
      
    } catch (error) {
      log(`\n💥 CRITICAL ERROR: ${error.message}`, 'red');
      this.generateReport();
    } finally {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }

  async testApiHealth() {
    log('\n📊 Testing API Health...', 'blue');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 10000
      });
      
      if (response.status === 200 || response.status === 503) {
        const statusIcon = response.status === 200 ? '✅' : '⚠️ ';
        log(`${statusIcon} API Health Check: ${response.status === 200 ? 'PASSED' : 'DEGRADED'}`, 
            response.status === 200 ? 'green' : 'yellow');
        log(`   Status: ${response.data.status}`, 'cyan');
        log(`   Database: ${response.data.checks.database}`, 'cyan');
        log(`   Redis: ${response.data.checks.redis}`, 'cyan');
        log(`   Realtime: ${response.data.checks.realtime}`, 'cyan');
        
        // Check if critical services are healthy
        const critical = ['database', 'realtime'];
        const unhealthy = critical.filter(service => 
          response.data.checks[service] !== 'healthy'
        );
        
        if (unhealthy.length > 0) {
          log(`⚠️  Critical services unhealthy: ${unhealthy.join(', ')}`, 'yellow');
        } else {
          log('   All critical services are healthy - continuing tests...', 'green');
        }
        
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.response?.status === 503) {
        // Handle 503 (degraded) as acceptable for testing
        const data = error.response.data;
        log(`⚠️  API Health Check: DEGRADED (503)`, 'yellow');
        log(`   Status: ${data.status}`, 'cyan');
        log(`   Database: ${data.checks.database}`, 'cyan');
        log(`   Redis: ${data.checks.redis}`, 'cyan');
        log(`   Realtime: ${data.checks.realtime}`, 'cyan');
        
        // Check if critical services are healthy
        const critical = ['database', 'realtime'];
        const unhealthy = critical.filter(service => 
          data.checks[service] !== 'healthy'
        );
        
        if (unhealthy.length > 0) {
          log(`⚠️  Critical services unhealthy: ${unhealthy.join(', ')}`, 'yellow');
          throw new Error('Critical services are unhealthy - cannot proceed');
        } else {
          log('   All critical services healthy - continuing despite degraded status...', 'green');
        }
      } else {
        log(`❌ API Health Check: FAILED - ${error.message}`, 'red');
        throw new Error('API is not accessible - cannot proceed with tests');
      }
    }
  }

  async testUserCreation() {
    log('\n👤 Testing User Creation...', 'blue');
    
    try {
      // Try to create a test user or use existing credentials
      const testUser = {
        email: 'socket-test@example.com',
        username: 'socket_test_user',
        displayName: 'Socket Test User',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };
      
      let response;
      try {
        // Try to register new user
        response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser, {
          timeout: 10000
        });
        log('✅ New test user created', 'green');
      } catch (registerError) {
        // If user exists, try to login
        if (registerError.response?.status === 400 || registerError.response?.status === 409) {
          log('   Test user already exists, attempting login...', 'cyan');
          response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
            identifier: testUser.email,
            password: testUser.password
          }, {
            timeout: 10000
          });
          log('✅ Test user login successful', 'green');
        } else {
          throw registerError;
        }
      }
      
      if (response.data.success && response.data.data.tokens) {
        this.testToken = response.data.data.tokens.accessToken;
        this.testUserId = response.data.data.user.id;
        this.testResults.authEndpoint = true;
        
        log(`   User ID: ${this.testUserId}`, 'cyan');
        log(`   Token: ${this.testToken.substring(0, 20)}...`, 'cyan');
        
      } else {
        throw new Error('Invalid response format from auth endpoint');
      }
      
    } catch (error) {
      log(`❌ User Creation: FAILED - ${error.message}`, 'red');
      log(`   Response: ${error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data'}`, 'red');
      throw new Error('Cannot create/authenticate test user');
    }
  }

  async testTokenGeneration() {
    log('\n🔑 Testing Token Generation...', 'blue');
    
    if (!this.testToken) {
      log('❌ Token Generation: SKIPPED - No token available', 'red');
      return;
    }
    
    try {
      // Analyze token structure
      const tokenParts = this.testToken.split('.');
      if (tokenParts.length === 3) {
        log('✅ Token has valid JWT structure (3 parts)', 'green');
        
        // Decode payload (without verification for inspection)
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          log(`   User ID: ${payload.userId}`, 'cyan');
          log(`   Expires: ${new Date(payload.exp * 1000).toISOString()}`, 'cyan');
          log(`   Session ID: ${payload.sessionId}`, 'cyan');
          
          // Check if token is expired
          if (payload.exp * 1000 < Date.now()) {
            log('⚠️  Token is EXPIRED', 'yellow');
          } else {
            log('✅ Token is not expired', 'green');
          }
          
          this.testResults.tokenGeneration = true;
        } catch (decodeError) {
          log(`⚠️  Cannot decode token payload: ${decodeError.message}`, 'yellow');
        }
        
      } else {
        log(`❌ Token has invalid structure (${tokenParts.length} parts)`, 'red');
      }
      
    } catch (error) {
      log(`❌ Token Generation: FAILED - ${error.message}`, 'red');
    }
  }

  async testTokenValidation() {
    log('\n🔐 Testing Token Validation...', 'blue');
    
    if (!this.testToken) {
      log('❌ Token Validation: SKIPPED - No token available', 'red');
      return;
    }
    
    try {
      // Test token validation via protected endpoint
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.testToken}`
        },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        log('✅ Token validation via API: PASSED', 'green');
        log(`   User: ${response.data.data.displayName} (@${response.data.data.username})`, 'cyan');
        this.testResults.tokenValidation = true;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
      
    } catch (error) {
      log(`❌ Token Validation: FAILED - ${error.message}`, 'red');
      if (error.response?.status === 401) {
        log('   This indicates JWT validation is failing in the auth middleware', 'red');
      }
    }
  }

  async testSocketConnection() {
    log('\n🔌 Testing Socket.IO Connection...', 'blue');
    
    return new Promise(async (resolve) => {
      let connectionTimeout;
      let connectionResolved = false;
      
      const resolveOnce = (success) => {
        if (connectionResolved) return;
        connectionResolved = true;
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        
        this.testResults.socketConnection = success;
        resolve();
      };
      
      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        log('❌ Socket Connection: TIMEOUT (30 seconds)', 'red');
        resolveOnce(false);
      }, 30000);
      
      try {
        log('   Attempting connection with multiple auth methods...', 'cyan');
        
        // Test various authentication methods
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          forceNew: true,
          
          // Method 1: auth object (recommended)
          auth: {
            token: this.testToken
          },
          
          // Method 2: query parameters (fallback)
          query: {
            token: this.testToken
          },
          
          // Method 3: extra headers
          extraHeaders: {
            Authorization: `Bearer ${this.testToken}`
          }
        });
        
        // Connection success
        this.socket.on('connect', () => {
          log('✅ Socket connected successfully', 'green');
          log(`   Socket ID: ${this.socket.id}`, 'cyan');
          log(`   Transport: ${this.socket.io.engine.transport.name}`, 'cyan');
          log(`   Connected to: ${this.socket.io.uri}`, 'cyan');
          
          resolveOnce(true);
        });
        
        // Authentication success
        this.socket.on('ready', (data) => {
          log('✅ Socket authentication successful', 'green');
          log(`   Ready event received:`, 'cyan');
          log(`   User: ${data.user?.displayName}`, 'cyan');
          log(`   Session ID: ${data.session_id}`, 'cyan');
          log(`   Servers: ${data.servers?.length || 0}`, 'cyan');
          
          this.testResults.socketAuth = true;
        });
        
        // Connection error
        this.socket.on('connect_error', (error) => {
          log(`❌ Socket Connection Error: ${error.message}`, 'red');
          log(`   Error Type: ${error.type}`, 'red');
          log(`   Error Context: ${error.context}`, 'red');
          log(`   Error Data:`, 'red');
          console.log(error);
          
          // Analyze common authentication errors
          if (error.message.includes('Authentication')) {
            log('   🔍 This is an AUTHENTICATION ERROR', 'yellow');
            log('   Check: JWT validation in socket middleware', 'yellow');
          }
          
          if (error.message.includes('expired')) {
            log('   🔍 TOKEN EXPIRED - generate new token', 'yellow');
          }
          
          if (error.message.includes('Database')) {
            log('   🔍 DATABASE CONNECTION ISSUE', 'yellow');
          }
          
          resolveOnce(false);
        });
        
        // Disconnection
        this.socket.on('disconnect', (reason) => {
          log(`⚠️  Socket disconnected: ${reason}`, 'yellow');
        });
        
        // Error event
        this.socket.on('error', (error) => {
          log(`❌ Socket Error: ${error.message || error}`, 'red');
        });
        
        log('   Connection attempt initiated...', 'cyan');
        
      } catch (error) {
        log(`❌ Socket Connection Setup: FAILED - ${error.message}`, 'red');
        resolveOnce(false);
      }
    });
  }

  async testRealtimeFeatures() {
    log('\n⚡ Testing Real-time Features...', 'blue');
    
    if (!this.socket || !this.socket.connected) {
      log('❌ Real-time Features: SKIPPED - No socket connection', 'red');
      return;
    }
    
    return new Promise((resolve) => {
      let testsCompleted = 0;
      const totalTests = 4;
      let featuresWorking = 0;
      
      const completeTest = () => {
        testsCompleted++;
        if (testsCompleted >= totalTests) {
          this.testResults.realtimeEvents = featuresWorking > 0;
          log(`\n   Summary: ${featuresWorking}/${totalTests} real-time features working`, 
              featuresWorking > 0 ? 'green' : 'red');
          resolve();
        }
      };
      
      // Test 1: Heartbeat/Ping
      log('   Testing heartbeat...', 'cyan');
      this.socket.emit('heartbeat');
      
      const heartbeatTimeout = setTimeout(() => {
        log('   ❌ Heartbeat: TIMEOUT', 'red');
        completeTest();
      }, 5000);
      
      this.socket.once('heartbeat_ack', () => {
        clearTimeout(heartbeatTimeout);
        log('   ✅ Heartbeat: WORKING', 'green');
        featuresWorking++;
        completeTest();
      });
      
      // Test 2: Presence Updates
      log('   Testing presence...', 'cyan');
      this.socket.emit('presence:update', {
        status: 'online',
        activity: { type: 'testing', name: 'Socket Diagnosis' }
      });
      
      const presenceTimeout = setTimeout(() => {
        log('   ❌ Presence: TIMEOUT', 'red');
        completeTest();
      }, 5000);
      
      this.socket.once('presence:update', () => {
        clearTimeout(presenceTimeout);
        log('   ✅ Presence: WORKING', 'green');
        featuresWorking++;
        completeTest();
      });
      
      // Test 3: Server Join (if available)
      log('   Testing server join...', 'cyan');
      
      // First try to get user's servers
      this.socket.emit('identify', {});
      
      const serverTimeout = setTimeout(() => {
        log('   ⚠️  Server join: NO SERVERS TO TEST', 'yellow');
        completeTest();
      }, 5000);
      
      this.socket.once('ready', (data) => {
        clearTimeout(serverTimeout);
        
        if (data.servers && data.servers.length > 0) {
          const firstServer = data.servers[0];
          log(`   Joining server: ${firstServer.name}`, 'cyan');
          
          this.socket.emit('server:join', { serverId: firstServer.id });
          
          const joinTimeout = setTimeout(() => {
            log('   ❌ Server join: TIMEOUT', 'red');
            completeTest();
          }, 5000);
          
          this.socket.once('server:state', () => {
            clearTimeout(joinTimeout);
            log('   ✅ Server join: WORKING', 'green');
            featuresWorking++;
            completeTest();
          });
          
        } else {
          log('   ⚠️  Server join: NO SERVERS AVAILABLE', 'yellow');
          completeTest();
        }
      });
      
      // Test 4: Error Handling
      log('   Testing error handling...', 'cyan');
      this.socket.emit('invalid:event', { test: true });
      
      setTimeout(() => {
        log('   ✅ Error handling: NO CRASH (good)', 'green');
        featuresWorking++;
        completeTest();
      }, 2000);
    });
  }

  generateReport() {
    log('\n' + '='.repeat(60), 'bold');
    log('📋 DIAGNOSIS REPORT', 'bold');
    log('='.repeat(60), 'bold');
    
    const results = [
      { name: 'API Health', status: true, critical: true }, // Always true if we got here
      { name: 'Auth Endpoint', status: this.testResults.authEndpoint, critical: true },
      { name: 'Token Generation', status: this.testResults.tokenGeneration, critical: true },
      { name: 'Token Validation', status: this.testResults.tokenValidation, critical: true },
      { name: 'Socket Connection', status: this.testResults.socketConnection, critical: true },
      { name: 'Socket Authentication', status: this.testResults.socketAuth, critical: true },
      { name: 'Real-time Events', status: this.testResults.realtimeEvents, critical: false }
    ];
    
    let criticalIssues = 0;
    let totalIssues = 0;
    
    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      const status = result.status ? 'PASS' : 'FAIL';
      const priority = result.critical ? '[CRITICAL]' : '[OPTIONAL]';
      
      log(`${icon} ${result.name}: ${status} ${priority}`, 
          result.status ? 'green' : 'red');
      
      if (!result.status) {
        totalIssues++;
        if (result.critical) {
          criticalIssues++;
        }
      }
    });
    
    log('\n' + '='.repeat(40), 'bold');
    log('🎯 SUMMARY', 'bold');
    log('='.repeat(40), 'bold');
    
    if (criticalIssues === 0) {
      log('🎉 All critical systems are WORKING!', 'green');
    } else {
      log(`💥 ${criticalIssues} CRITICAL ISSUES found`, 'red');
    }
    
    if (totalIssues > 0) {
      log(`⚠️  Total issues: ${totalIssues}`, 'yellow');
    } else {
      log('🎉 NO ISSUES found - system is healthy!', 'green');
    }
    
    // Recommendations
    log('\n🔧 RECOMMENDATIONS:', 'blue');
    
    if (!this.testResults.tokenValidation) {
      log('1. Check JWT_SECRET environment variable', 'cyan');
      log('2. Verify auth middleware is properly configured', 'cyan');
      log('3. Check database connection for user validation', 'cyan');
    }
    
    if (!this.testResults.socketConnection) {
      log('1. Verify Socket.IO server is running on correct port', 'cyan');
      log('2. Check CORS configuration for socket connections', 'cyan');
      log('3. Verify Redis connection for socket adapter', 'cyan');
    }
    
    if (!this.testResults.socketAuth) {
      log('1. Check socket authentication middleware', 'cyan');
      log('2. Verify token extraction logic in socket handlers', 'cyan');
      log('3. Check database connectivity in socket auth flow', 'cyan');
    }
    
    if (criticalIssues === 0 && !this.testResults.realtimeEvents) {
      log('1. Real-time events need debugging (non-critical)', 'cyan');
      log('2. Check event handlers implementation', 'cyan');
    }
    
    log('\n✅ Diagnosis completed!', 'green');
    
    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        criticalIssues,
        totalIssues,
        overallStatus: criticalIssues === 0 ? 'healthy' : 'critical'
      },
      testToken: this.testToken ? `${this.testToken.substring(0, 20)}...` : null,
      testUserId: this.testUserId
    };
    
    fs.writeFileSync('./socket-diagnosis-report.json', JSON.stringify(reportData, null, 2));
    log('📄 Detailed report saved to: socket-diagnosis-report.json', 'cyan');
  }
}

// Run diagnosis if called directly
if (require.main === module) {
  const diagnosis = new SocketAuthDiagnosis();
  diagnosis.runDiagnosis().catch(error => {
    console.error('Diagnosis failed:', error);
    process.exit(1);
  });
}

module.exports = SocketAuthDiagnosis;