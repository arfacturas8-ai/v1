#!/usr/bin/env node

/**
 * FOCUSED SOCKET.IO CONNECTION TEST
 * 
 * This test focuses specifically on the Socket.IO WebSocket connection
 * and authentication issues, without relying on user creation.
 */

const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3002';

// Use a sample JWT token structure for testing (this would be invalid but tests connection)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

// ANSI color codes
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

class SocketConnectionTest {
  constructor() {
    this.results = {
      transportPolling: false,
      transportWebSocket: false,
      authHeaderMethod: false,
      authObjectMethod: false,
      queryParamMethod: false,
      connectionEstablished: false,
      authenticationResponse: null
    };
    
    this.tests = [
      { name: 'Polling Transport', method: this.testPollingTransport.bind(this) },
      { name: 'WebSocket Transport', method: this.testWebSocketTransport.bind(this) },
      { name: 'Auth via Headers', method: this.testAuthViaHeaders.bind(this) },
      { name: 'Auth via Auth Object', method: this.testAuthViaObject.bind(this) },
      { name: 'Auth via Query Params', method: this.testAuthViaQuery.bind(this) }
    ];
  }

  async runAllTests() {
    log('\n' + '='.repeat(60), 'bold');
    log('🔌 SOCKET.IO CONNECTION TEST SUITE', 'bold');
    log('='.repeat(60), 'bold');
    
    for (const test of this.tests) {
      await this.runSingleTest(test.name, test.method);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
    }
    
    this.generateReport();
  }

  async runSingleTest(testName, testMethod) {
    log(`\n🧪 Testing: ${testName}`, 'blue');
    
    try {
      const result = await testMethod();
      const status = result ? '✅ PASS' : '❌ FAIL';
      log(`   ${status}`, result ? 'green' : 'red');
      return result;
    } catch (error) {
      log(`   ❌ FAIL: ${error.message}`, 'red');
      return false;
    }
  }

  testPollingTransport() {
    return new Promise((resolve) => {
      log('   Attempting polling transport connection...', 'cyan');
      
      const socket = io(SOCKET_URL, {
        transports: ['polling'], // Force polling only
        timeout: 10000,
        auth: { token: TEST_TOKEN }
      });
      
      const cleanup = () => {
        try {
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      const timer = setTimeout(() => {
        cleanup();
        log('   Timeout: No connection established', 'yellow');
        resolve(false);
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        log('   ✅ Polling transport connected successfully', 'green');
        this.results.transportPolling = true;
        cleanup();
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        log(`   ❌ Polling connection error: ${error.message}`, 'red');
        log(`   Error type: ${error.type}`, 'red');
        cleanup();
        resolve(false);
      });
    });
  }

  testWebSocketTransport() {
    return new Promise((resolve) => {
      log('   Attempting WebSocket transport connection...', 'cyan');
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket'], // Force WebSocket only
        timeout: 10000,
        auth: { token: TEST_TOKEN },
        upgrade: false // Prevent upgrade attempts
      });
      
      const cleanup = () => {
        try {
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      const timer = setTimeout(() => {
        cleanup();
        log('   Timeout: WebSocket connection failed', 'yellow');
        resolve(false);
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        log('   ✅ WebSocket transport connected successfully', 'green');
        this.results.transportWebSocket = true;
        cleanup();
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        log(`   ❌ WebSocket connection error: ${error.message}`, 'red');
        log(`   Error type: ${error.type}`, 'red');
        
        // Check for specific WebSocket frame errors
        if (error.message.includes('RSV1')) {
          log('   🔍 RSV1 frame error detected - compression issue', 'yellow');
        }
        if (error.message.includes('websocket error')) {
          log('   🔍 WebSocket protocol error', 'yellow');
        }
        
        cleanup();
        resolve(false);
      });
    });
  }

  testAuthViaHeaders() {
    return new Promise((resolve) => {
      log('   Testing authentication via Authorization header...', 'cyan');
      
      const socket = io(SOCKET_URL, {
        transports: ['polling'],
        timeout: 10000,
        extraHeaders: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      const cleanup = () => {
        try {
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      const timer = setTimeout(() => {
        cleanup();
        log('   Timeout: Auth via headers test incomplete', 'yellow');
        resolve(false);
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        log('   ✅ Header authentication method works', 'green');
        this.results.authHeaderMethod = true;
        cleanup();
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        log(`   📊 Header auth result: ${error.message}`, 'cyan');
        
        // Even if auth fails, if connection was attempted, the method works
        if (error.message.includes('Authentication')) {
          log('   ✅ Header method reached auth layer', 'green');
          this.results.authHeaderMethod = true;
          cleanup();
          resolve(true);
        } else {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  testAuthViaObject() {
    return new Promise((resolve) => {
      log('   Testing authentication via auth object...', 'cyan');
      
      const socket = io(SOCKET_URL, {
        transports: ['polling'],
        timeout: 10000,
        auth: {
          token: TEST_TOKEN
        }
      });
      
      const cleanup = () => {
        try {
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      const timer = setTimeout(() => {
        cleanup();
        log('   Timeout: Auth object test incomplete', 'yellow');
        resolve(false);
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        log('   ✅ Auth object method works', 'green');
        this.results.authObjectMethod = true;
        cleanup();
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        log(`   📊 Auth object result: ${error.message}`, 'cyan');
        
        // Even if auth fails, if connection was attempted, the method works
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          log('   ✅ Auth object method reached auth layer', 'green');
          this.results.authObjectMethod = true;
          cleanup();
          resolve(true);
        } else {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  testAuthViaQuery() {
    return new Promise((resolve) => {
      log('   Testing authentication via query parameters...', 'cyan');
      
      const socket = io(SOCKET_URL, {
        transports: ['polling'],
        timeout: 10000,
        query: {
          token: TEST_TOKEN
        }
      });
      
      const cleanup = () => {
        try {
          socket.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      const timer = setTimeout(() => {
        cleanup();
        log('   Timeout: Query param test incomplete', 'yellow');
        resolve(false);
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        log('   ✅ Query parameter method works', 'green');
        this.results.queryParamMethod = true;
        cleanup();
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        log(`   📊 Query param result: ${error.message}`, 'cyan');
        
        // Even if auth fails, if connection was attempted, the method works
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          log('   ✅ Query param method reached auth layer', 'green');
          this.results.queryParamMethod = true;
          cleanup();
          resolve(true);
        } else {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  generateReport() {
    log('\n' + '='.repeat(60), 'bold');
    log('📋 CONNECTION TEST RESULTS', 'bold');
    log('='.repeat(60), 'bold');
    
    const results = [
      { name: 'Polling Transport', status: this.results.transportPolling, critical: true },
      { name: 'WebSocket Transport', status: this.results.transportWebSocket, critical: false },
      { name: 'Auth via Headers', status: this.results.authHeaderMethod, critical: false },
      { name: 'Auth via Object', status: this.results.authObjectMethod, critical: true },
      { name: 'Auth via Query', status: this.results.queryParamMethod, critical: false }
    ];
    
    let criticalIssues = 0;
    let totalIssues = 0;
    
    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      const status = result.status ? 'WORKING' : 'FAILED';
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
    log('🎯 DIAGNOSIS', 'bold');
    log('='.repeat(40), 'bold');
    
    if (this.results.transportPolling) {
      log('✅ Socket.IO server is accessible via polling', 'green');
    } else {
      log('❌ Socket.IO server connection failed completely', 'red');
    }
    
    if (this.results.transportWebSocket) {
      log('✅ WebSocket transport is working correctly', 'green');
    } else {
      log('⚠️  WebSocket transport has issues (likely RSV1/compression)', 'yellow');
      log('   Recommendation: Check WebSocket configuration', 'cyan');
    }
    
    if (this.results.authObjectMethod) {
      log('✅ Socket.IO authentication middleware is functional', 'green');
    } else {
      log('❌ Socket.IO authentication middleware has issues', 'red');
    }
    
    log('\n🔧 NEXT STEPS:', 'blue');
    
    if (criticalIssues === 0) {
      log('1. Socket.IO server is working - test with valid JWT token', 'cyan');
      log('2. WebSocket issues can be resolved by configuration updates', 'cyan');
    } else {
      log('1. Fix critical connection issues first', 'cyan');
      log('2. Check Socket.IO server initialization', 'cyan');
      log('3. Verify authentication middleware setup', 'cyan');
    }
    
    log(`\n📊 Summary: ${criticalIssues}/${totalIssues} critical issues found`, 
        criticalIssues === 0 ? 'green' : 'red');
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new SocketConnectionTest();
  test.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = SocketConnectionTest;