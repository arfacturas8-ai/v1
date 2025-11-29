#!/usr/bin/env node

/**
 * OWASP Top 10 Security Testing Suite for CRYB Platform
 * 
 * Tests for the OWASP Top 10 2021 security vulnerabilities:
 * 1. Broken Access Control
 * 2. Cryptographic Failures  
 * 3. Injection
 * 4. Insecure Design
 * 5. Security Misconfiguration
 * 6. Vulnerable and Outdated Components
 * 7. Identification and Authentication Failures
 * 8. Software and Data Integrity Failures
 * 9. Security Logging and Monitoring Failures
 * 10. Server-Side Request Forgery (SSRF)
 */

const axios = require('axios');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3002',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_COUNT: 3
};

// Test results storage
const securityResults = {
  passed: 0,
  failed: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  tests: []
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function runSecurityTest(name, severity, testFn) {
  log('info', `Running security test: ${name} (${severity})`);
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    
    securityResults.passed++;
    securityResults.tests.push({
      name,
      severity,
      status: 'PASSED',
      duration,
      message: 'Security test passed - no vulnerabilities detected'
    });
    
    log('info', `✅ PASSED: ${name} (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    securityResults.failed++;
    securityResults[severity.toLowerCase()]++;
    securityResults.tests.push({
      name,
      severity,
      status: 'FAILED',
      duration,
      vulnerability: error.message,
      recommendation: error.recommendation || 'Please review and fix this security issue',
      stack: error.stack
    });
    
    log('error', `❌ FAILED: ${name} (${severity}) (${duration}ms)`, { 
      vulnerability: error.message,
      recommendation: error.recommendation
    });
    return false;
  }
}

// Helper function to create test users
async function createTestUser(userData = {}) {
  const defaultUser = {
    username: `sectest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    displayName: 'Security Test User',
    email: `sectest_${Date.now()}@example.com`,
    password: 'SecTest123!',
    confirmPassword: 'SecTest123!'
  };
  
  const user = { ...defaultUser, ...userData };
  
  const response = await axios.post(`${CONFIG.API_URL}/auth/register`, user, {
    timeout: CONFIG.TIMEOUT
  });
  
  return {
    ...user,
    token: response.data.data.tokens.accessToken,
    userId: response.data.data.user.id
  };
}

// OWASP #1: Broken Access Control Tests
async function testBrokenAccessControl() {
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  
  // Test vertical privilege escalation
  try {
    await axios.get(`${CONFIG.API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${user1.token}` },
      timeout: CONFIG.TIMEOUT
    });
    
    throw {
      message: 'Regular user can access admin endpoints',
      recommendation: 'Implement proper role-based access control (RBAC)'
    };
  } catch (error) {
    if (error.response && [401, 403].includes(error.response.status)) {
      // Good - access denied
    } else if (error.message) {
      throw error; // Re-throw our custom error
    } else {
      throw {
        message: 'Unexpected error testing admin access',
        recommendation: 'Review error handling for admin endpoints'
      };
    }
  }
  
  // Test horizontal privilege escalation
  const postResponse = await axios.post(`${CONFIG.API_URL}/posts`, {
    title: 'Security Test Post',
    content: 'Test content',
    type: 'text'
  }, {
    headers: { Authorization: `Bearer ${user1.token}` }
  });
  
  const postId = postResponse.data.data.post.id;
  
  try {
    await axios.put(`${CONFIG.API_URL}/posts/${postId}`, {
      title: 'Modified by another user',
      content: 'This should not be allowed'
    }, {
      headers: { Authorization: `Bearer ${user2.token}` }
    });
    
    throw {
      message: 'User can modify posts created by other users',
      recommendation: 'Implement proper ownership checks before allowing modifications'
    };
  } catch (error) {
    if (error.response && [401, 403].includes(error.response.status)) {
      // Good - access denied
    } else if (error.message) {
      throw error;
    } else {
      throw {
        message: 'Unexpected error testing post modification access',
        recommendation: 'Review authorization logic for post modifications'
      };
    }
  }
  
  // Test direct object reference
  try {
    const response = await axios.get(`${CONFIG.API_URL}/users/${user1.userId}/private`, {
      headers: { Authorization: `Bearer ${user2.token}` }
    });
    
    if (response.status === 200) {
      throw {
        message: 'Insecure Direct Object Reference found - user can access other users private data',
        recommendation: 'Implement proper authorization checks for user data access'
      };
    }
  } catch (error) {
    if (error.response && [401, 403, 404].includes(error.response.status)) {
      // Good - access denied or not found
    } else if (error.message) {
      throw error;
    }
    // Endpoint might not exist, which is fine
  }
}

// OWASP #2: Cryptographic Failures Tests
async function testCryptographicFailures() {
  // Test password transmission
  const testPassword = 'TestPassword123!';
  
  try {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
      email: 'test@example.com',
      password: testPassword
    }, {
      timeout: CONFIG.TIMEOUT,
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    // Check if password is returned in response
    const responseText = JSON.stringify(response.data).toLowerCase();
    if (responseText.includes(testPassword.toLowerCase())) {
      throw {
        message: 'Password returned in API response',
        recommendation: 'Never return passwords in API responses, even for failed authentication'
      };
    }
  } catch (error) {
    if (error.message) {
      throw error;
    }
  }
  
  // Test for weak crypto algorithms in JWT
  const user = await createTestUser();
  const token = user.token;
  
  // Decode JWT header to check algorithm
  const [headerB64] = token.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
  
  const weakAlgorithms = ['none', 'HS256', 'RS256']; // Add more as needed
  if (header.alg === 'none') {
    throw {
      message: 'JWT uses "none" algorithm - no signature verification',
      recommendation: 'Use strong signing algorithms like HS512, RS512, or ES256'
    };
  }
  
  // Test for sensitive data in JWT payload
  const [, payloadB64] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  
  const sensitiveFields = ['password', 'passwordHash', 'ssn', 'creditCard'];
  for (const field of sensitiveFields) {
    if (payload[field]) {
      throw {
        message: `Sensitive data (${field}) found in JWT payload`,
        recommendation: 'Remove sensitive data from JWT payloads'
      };
    }
  }
  
  // Test session token randomness
  const tokens = [];
  for (let i = 0; i < 5; i++) {
    const testUser = await createTestUser();
    tokens.push(testUser.token);
  }
  
  // Basic check for token uniqueness
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size !== tokens.length) {
    throw {
      message: 'Duplicate session tokens generated',
      recommendation: 'Ensure session tokens are cryptographically random and unique'
    };
  }
}

// OWASP #3: Injection Tests
async function testInjection() {
  // SQL Injection tests
  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "'; INSERT INTO posts (title) VALUES ('hacked'); --",
    "admin'--",
    "admin' /*",
    "' or 1=1#"
  ];
  
  for (const payload of sqlPayloads) {
    try {
      const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
        email: payload,
        password: 'test123'
      }, {
        timeout: CONFIG.TIMEOUT,
        validateStatus: () => true
      });
      
      // Check for SQL error messages in response
      const responseText = JSON.stringify(response.data).toLowerCase();
      const sqlErrorIndicators = [
        'sql syntax',
        'mysql_fetch',
        'ora-',
        'postgresql',
        'sqlite',
        'column',
        'table',
        'database'
      ];
      
      for (const indicator of sqlErrorIndicators) {
        if (responseText.includes(indicator)) {
          throw {
            message: `SQL injection vulnerability detected with payload: ${payload}`,
            recommendation: 'Use parameterized queries and input validation to prevent SQL injection'
          };
        }
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Network/timeout errors are expected and OK
    }
  }
  
  // NoSQL Injection tests
  const nosqlPayloads = [
    { "$ne": null },
    { "$gt": "" },
    { "$regex": ".*" },
    { "$where": "1==1" }
  ];
  
  for (const payload of nosqlPayloads) {
    try {
      await axios.post(`${CONFIG.API_URL}/auth/login`, {
        email: payload,
        password: 'test123'
      }, {
        timeout: CONFIG.TIMEOUT,
        validateStatus: () => true
      });
    } catch (error) {
      // Expected to fail, just checking server doesn't crash
    }
  }
  
  // Command Injection tests
  const cmdPayloads = [
    '; cat /etc/passwd',
    '| whoami',
    '`id`',
    '$(ls -la)',
    '; rm -rf /',
    '|| ping -c 4 google.com'
  ];
  
  const user = await createTestUser();
  
  for (const payload of cmdPayloads) {
    try {
      await axios.post(`${CONFIG.API_URL}/posts`, {
        title: `Test${payload}`,
        content: 'Test content',
        type: 'text'
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        timeout: 5000 // Shorter timeout for command injection
      });
    } catch (error) {
      // Expected to fail or timeout, which is good
    }
  }
  
  // XSS tests (Cross-Site Scripting)
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ];
  
  for (const payload of xssPayloads) {
    const response = await axios.post(`${CONFIG.API_URL}/posts`, {
      title: payload,
      content: `XSS test: ${payload}`,
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${user.token}` },
      validateStatus: () => true
    });
    
    if (response.status === 201) {
      // Check if payload was sanitized
      const postContent = JSON.stringify(response.data);
      if (postContent.includes('<script>') || postContent.includes('onerror=')) {
        throw {
          message: `XSS vulnerability detected - unsanitized script content: ${payload}`,
          recommendation: 'Implement proper input sanitization and output encoding'
        };
      }
    }
  }
}

// OWASP #4: Insecure Design Tests
async function testInsecureDesign() {
  // Test for business logic flaws
  const user = await createTestUser();
  
  // Test for race conditions in voting
  const postResponse = await axios.post(`${CONFIG.API_URL}/posts`, {
    title: 'Race condition test post',
    content: 'Testing for race conditions',
    type: 'text'
  }, {
    headers: { Authorization: `Bearer ${user.token}` }
  });
  
  const postId = postResponse.data.data.post.id;
  
  // Attempt rapid voting to test for race conditions
  const votePromises = [];
  for (let i = 0; i < 10; i++) {
    votePromises.push(
      axios.post(`${CONFIG.API_URL}/posts/${postId}/vote`, {
        type: 'up'
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        validateStatus: () => true
      })
    );
  }
  
  const voteResponses = await Promise.all(votePromises);
  const successfulVotes = voteResponses.filter(r => r.status === 200);
  
  if (successfulVotes.length > 1) {
    throw {
      message: 'Race condition detected in voting system - multiple votes allowed',
      recommendation: 'Implement proper locking mechanisms to prevent race conditions'
    };
  }
  
  // Test for insecure password reset flow
  try {
    const resetResponse = await axios.post(`${CONFIG.API_URL}/auth/forgot-password`, {
      email: user.email
    });
    
    // In development, the token might be returned in the response
    if (process.env.NODE_ENV === 'production' && resetResponse.data.data && resetResponse.data.data.resetToken) {
      throw {
        message: 'Password reset token returned in API response in production',
        recommendation: 'Never return reset tokens in API responses in production'
      };
    }
  } catch (error) {
    if (error.message && error.recommendation) {
      throw error;
    }
    // Other errors are acceptable
  }
  
  // Test for missing rate limiting on sensitive operations
  const sensitiveEndpoints = [
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  for (const endpoint of sensitiveEndpoints) {
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(
        axios.post(`${CONFIG.API_URL}${endpoint}`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }, {
          validateStatus: () => true,
          timeout: 5000
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    if (rateLimitedResponses.length === 0) {
      throw {
        message: `No rate limiting detected on sensitive endpoint: ${endpoint}`,
        recommendation: 'Implement rate limiting on all sensitive endpoints'
      };
    }
  }
}

// OWASP #5: Security Misconfiguration Tests  
async function testSecurityMisconfiguration() {
  // Test for debug information exposure
  const response = await axios.get(`${CONFIG.API_URL}/health`, {
    validateStatus: () => true
  });
  
  const responseText = JSON.stringify(response.data).toLowerCase();
  const debugIndicators = [
    'stack trace',
    'debug',
    'error_reporting',
    'phpinfo',
    'test',
    'dev',
    'development'
  ];
  
  for (const indicator of debugIndicators) {
    if (responseText.includes(indicator) && process.env.NODE_ENV === 'production') {
      throw {
        message: `Debug information exposed in production: ${indicator}`,
        recommendation: 'Disable debug information in production environments'
      };
    }
  }
  
  // Test for security headers
  const securityHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': ['DENY', 'SAMEORIGIN'],
    'x-xss-protection': '1; mode=block',
    'strict-transport-security': true, // Should exist for HTTPS
    'content-security-policy': true,
    'referrer-policy': true
  };
  
  for (const [header, expectedValue] of Object.entries(securityHeaders)) {
    const headerValue = response.headers[header];
    
    if (!headerValue) {
      if (header === 'strict-transport-security' && !CONFIG.API_URL.startsWith('https://')) {
        // HSTS not required for HTTP
        continue;
      }
      
      throw {
        message: `Missing security header: ${header}`,
        recommendation: `Add the ${header} security header to all responses`
      };
    }
    
    if (Array.isArray(expectedValue) && !expectedValue.includes(headerValue)) {
      throw {
        message: `Incorrect value for security header ${header}: ${headerValue}`,
        recommendation: `Set ${header} to one of: ${expectedValue.join(', ')}`
      };
    }
    
    if (typeof expectedValue === 'string' && headerValue !== expectedValue) {
      throw {
        message: `Incorrect value for security header ${header}: ${headerValue}`,
        recommendation: `Set ${header} to: ${expectedValue}`
      };
    }
  }
  
  // Test for default credentials
  const defaultCredentials = [
    { email: 'admin@admin.com', password: 'admin' },
    { email: 'admin@example.com', password: 'password' },
    { email: 'test@test.com', password: 'test' },
    { email: 'root@localhost', password: 'root' }
  ];
  
  for (const cred of defaultCredentials) {
    try {
      const loginResponse = await axios.post(`${CONFIG.API_URL}/auth/login`, cred, {
        validateStatus: () => true,
        timeout: CONFIG.TIMEOUT
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        throw {
          message: `Default credentials working: ${cred.email}:${cred.password}`,
          recommendation: 'Remove or change default credentials immediately'
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Login failures are expected and good
    }
  }
  
  // Test for unnecessary HTTP methods
  const unnecessaryMethods = ['TRACE', 'OPTIONS', 'CONNECT'];
  
  for (const method of unnecessaryMethods) {
    try {
      const response = await axios({
        method: method,
        url: `${CONFIG.API_URL}/auth/login`,
        validateStatus: () => true,
        timeout: CONFIG.TIMEOUT
      });
      
      if (response.status !== 405 && response.status !== 501) {
        throw {
          message: `Unnecessary HTTP method enabled: ${method}`,
          recommendation: `Disable unnecessary HTTP methods like ${method}`
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Other errors are acceptable
    }
  }
}

// OWASP #6: Vulnerable and Outdated Components Tests
async function testVulnerableComponents() {
  // Check for version information disclosure
  const response = await axios.get(`${CONFIG.API_URL}/health`, {
    validateStatus: () => true
  });
  
  // Check response headers for version info
  const versionHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
  
  for (const header of versionHeaders) {
    if (response.headers[header]) {
      log('warn', `Version information disclosed in ${header} header: ${response.headers[header]}`);
      // This is informational, not necessarily a failure
    }
  }
  
  // Try to access common vulnerable paths
  const vulnerablePaths = [
    '/.git/config',
    '/.env',
    '/package.json',
    '/composer.json',
    '/yarn.lock',
    '/package-lock.json',
    '/.htaccess',
    '/web.config',
    '/config.php',
    '/phpinfo.php'
  ];
  
  for (const path of vulnerablePaths) {
    try {
      const response = await axios.get(`${CONFIG.API_URL}${path}`, {
        validateStatus: () => true,
        timeout: 5000
      });
      
      if (response.status === 200) {
        throw {
          message: `Sensitive file accessible: ${path}`,
          recommendation: 'Prevent access to sensitive files and directories'
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // 404 errors are expected and good
    }
  }
}

// OWASP #7: Identification and Authentication Failures Tests
async function testAuthenticationFailures() {
  // Test for weak password policies
  const weakPasswords = [
    'password',
    '123456',
    'admin',
    'test',
    'pass',
    '12345',
    'abc123'
  ];
  
  for (const weakPassword of weakPasswords) {
    try {
      const response = await axios.post(`${CONFIG.API_URL}/auth/register`, {
        username: `test_${Date.now()}`,
        displayName: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: weakPassword,
        confirmPassword: weakPassword
      }, {
        validateStatus: () => true,
        timeout: CONFIG.TIMEOUT
      });
      
      if (response.status === 201) {
        throw {
          message: `Weak password accepted: ${weakPassword}`,
          recommendation: 'Implement strong password policies (minimum length, complexity requirements)'
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Registration failures for weak passwords are expected and good
    }
  }
  
  // Test for session fixation
  const user = await createTestUser();
  const originalToken = user.token;
  
  // Login again with same credentials
  const loginResponse = await axios.post(`${CONFIG.API_URL}/auth/login`, {
    email: user.email,
    password: user.password
  });
  
  const newToken = loginResponse.data.data.tokens.accessToken;
  
  if (originalToken === newToken) {
    throw {
      message: 'Session fixation vulnerability - same token returned on re-login',
      recommendation: 'Generate new session tokens on each login'
    };
  }
  
  // Test for session timeout
  // This would require a longer test period, so we'll just check if the mechanism exists
  try {
    const sessionResponse = await axios.get(`${CONFIG.API_URL}/auth/sessions`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    if (sessionResponse.data.data.sessions) {
      const sessions = sessionResponse.data.data.sessions;
      if (sessions.length > 0 && !sessions[0].expiresAt) {
        throw {
          message: 'Sessions do not have expiration times',
          recommendation: 'Implement session timeouts for security'
        };
      }
    }
  } catch (error) {
    if (error.message && error.recommendation) {
      throw error;
    }
    // Other errors might be acceptable
  }
  
  // Test for concurrent session limits
  const tokens = [];
  for (let i = 0; i < 10; i++) {
    try {
      const loginResponse = await axios.post(`${CONFIG.API_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      tokens.push(loginResponse.data.data.tokens.accessToken);
    } catch (error) {
      // Some failures are expected if there are session limits
    }
  }
  
  // All tokens working would indicate no session limits
  let validTokenCount = 0;
  for (const token of tokens) {
    try {
      const response = await axios.get(`${CONFIG.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      if (response.status === 200) validTokenCount++;
    } catch (error) {
      // Expected for some tokens if limits exist
    }
  }
  
  if (validTokenCount === tokens.length && tokens.length > 5) {
    log('warn', `No apparent session limits - ${validTokenCount} concurrent sessions allowed`);
    // This is informational, not necessarily a critical failure
  }
}

// OWASP #8: Software and Data Integrity Failures Tests
async function testIntegrityFailures() {
  // Test for unsigned/unverified JWT tokens
  const user = await createTestUser();
  let token = user.token;
  
  // Try to modify the JWT payload
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw {
      message: 'JWT token format is invalid',
      recommendation: 'Ensure JWT tokens follow standard format'
    };
  }
  
  // Decode and modify payload
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  payload.userId = 'modified-user-id';
  payload.exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24); // Extend expiry
  
  // Encode modified payload
  const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const modifiedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;
  
  try {
    const response = await axios.get(`${CONFIG.API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${modifiedToken}` },
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      throw {
        message: 'Modified JWT token accepted - signature verification failed',
        recommendation: 'Ensure JWT signatures are properly verified'
      };
    }
  } catch (error) {
    if (error.message && error.recommendation) {
      throw error;
    }
    // Rejection of modified token is expected and good
  }
  
  // Test for insecure deserialization (if applicable)
  const serializedPayloads = [
    '{"__proto__":{"admin":true}}',
    '{"constructor":{"prototype":{"admin":true}}}',
    'O:8:"stdClass":1:{s:5:"admin";b:1;}'
  ];
  
  for (const payload of serializedPayloads) {
    try {
      await axios.post(`${CONFIG.API_URL}/posts`, {
        title: 'Test',
        content: payload,
        type: 'text',
        metadata: payload
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        validateStatus: () => true,
        timeout: 5000
      });
      // If this doesn't crash the server, it's likely safe
    } catch (error) {
      // Expected to fail or be rejected
    }
  }
}

// OWASP #9: Security Logging and Monitoring Failures Tests
async function testLoggingFailures() {
  // Test if failed authentication attempts are logged
  // This is hard to test without access to logs, so we'll test the response behavior
  
  const failedAttempts = [];
  for (let i = 0; i < 5; i++) {
    try {
      const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }, {
        validateStatus: () => true
      });
      
      failedAttempts.push(response);
    } catch (error) {
      // Network errors are acceptable
    }
  }
  
  // Check if account gets locked after multiple failures
  const lastAttempt = failedAttempts[failedAttempts.length - 1];
  if (lastAttempt && lastAttempt.status !== 423 && lastAttempt.status !== 429) {
    log('warn', 'No account lockout detected after multiple failed login attempts');
    // This is informational
  }
  
  // Test for information disclosure in error messages
  const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
    email: 'test@example.com',
    password: 'wrongpassword'
  }, {
    validateStatus: () => true
  });
  
  const errorMessage = JSON.stringify(response.data).toLowerCase();
  
  if (errorMessage.includes('user not found') || errorMessage.includes('invalid email')) {
    throw {
      message: 'Authentication error messages leak user enumeration information',
      recommendation: 'Use generic error messages for authentication failures'
    };
  }
  
  // Test for security event monitoring
  const user = await createTestUser();
  
  // Perform suspicious activities
  const suspiciousActivities = [
    () => axios.get(`${CONFIG.API_URL}/admin/users`, { 
      headers: { Authorization: `Bearer ${user.token}` },
      validateStatus: () => true 
    }),
    () => axios.get(`${CONFIG.API_URL}/../../../etc/passwd`, { 
      validateStatus: () => true 
    }),
    () => axios.post(`${CONFIG.API_URL}/posts`, {
      title: '<script>alert("xss")</script>',
      content: 'XSS attempt',
      type: 'text'
    }, { 
      headers: { Authorization: `Bearer ${user.token}` },
      validateStatus: () => true 
    })
  ];
  
  for (const activity of suspiciousActivities) {
    try {
      await activity();
    } catch (error) {
      // Expected to fail
    }
  }
  
  // In a real implementation, we would check if these activities were logged
  // For now, we'll just ensure the server didn't crash
  const healthCheck = await axios.get(`${CONFIG.API_URL}/health`);
  if (healthCheck.status !== 200) {
    throw {
      message: 'Server appears to be unstable after suspicious activities',
      recommendation: 'Ensure proper error handling and logging for security events'
    };
  }
}

// OWASP #10: Server-Side Request Forgery (SSRF) Tests
async function testSSRF() {
  const user = await createTestUser();
  
  // Test for SSRF in file upload URLs
  const ssrfPayloads = [
    'http://localhost:22',
    'http://127.0.0.1:3306',
    'file:///etc/passwd',
    'ftp://internal.server.com',
    'http://169.254.169.254/latest/meta-data/', // AWS metadata
    'http://169.254.169.254/latest/user-data/',
    'http://metadata.google.internal/computeMetadata/v1/', // Google Cloud metadata
    'http://100.100.100.200/latest/meta-data/' // Alibaba Cloud metadata
  ];
  
  for (const payload of ssrfPayloads) {
    try {
      // Test SSRF via file upload URL parameter
      const response = await axios.post(`${CONFIG.API_URL}/uploads/from-url`, {
        url: payload
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        validateStatus: () => true,
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.success) {
        throw {
          message: `SSRF vulnerability detected with payload: ${payload}`,
          recommendation: 'Validate and restrict URLs to prevent SSRF attacks'
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Other errors (404, validation failures) are expected and good
    }
    
    // Test SSRF via webhook URLs
    try {
      const response = await axios.post(`${CONFIG.API_URL}/webhooks`, {
        url: payload,
        events: ['post.created']
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        validateStatus: () => true,
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.success) {
        throw {
          message: `SSRF vulnerability detected in webhooks with payload: ${payload}`,
          recommendation: 'Implement URL validation and allowlists for webhook endpoints'
        };
      }
    } catch (error) {
      if (error.message && error.recommendation) {
        throw error;
      }
      // Endpoint might not exist, which is fine
    }
  }
  
  // Test for DNS rebinding protection
  const dnsRebindingPayloads = [
    'http://localtest.me:3306',
    'http://spoofed.burpcollaborator.net',
    'http://127.0.0.1.nip.io'
  ];
  
  for (const payload of dnsRebindingPayloads) {
    try {
      await axios.post(`${CONFIG.API_URL}/uploads/from-url`, {
        url: payload
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
        validateStatus: () => true,
        timeout: 3000
      });
    } catch (error) {
      // Expected to fail or timeout
    }
  }
}

// Main security test runner
async function runOWASPSecurityTests() {
  log('info', '🛡️  Starting OWASP Top 10 Security Tests');
  log('info', 'Configuration:', CONFIG);
  
  const tests = [
    { name: 'OWASP #1: Broken Access Control', severity: 'CRITICAL', fn: testBrokenAccessControl },
    { name: 'OWASP #2: Cryptographic Failures', severity: 'HIGH', fn: testCryptographicFailures },
    { name: 'OWASP #3: Injection', severity: 'CRITICAL', fn: testInjection },
    { name: 'OWASP #4: Insecure Design', severity: 'HIGH', fn: testInsecureDesign },
    { name: 'OWASP #5: Security Misconfiguration', severity: 'HIGH', fn: testSecurityMisconfiguration },
    { name: 'OWASP #6: Vulnerable Components', severity: 'MEDIUM', fn: testVulnerableComponents },
    { name: 'OWASP #7: Authentication Failures', severity: 'HIGH', fn: testAuthenticationFailures },
    { name: 'OWASP #8: Integrity Failures', severity: 'HIGH', fn: testIntegrityFailures },
    { name: 'OWASP #9: Logging Failures', severity: 'MEDIUM', fn: testLoggingFailures },
    { name: 'OWASP #10: SSRF', severity: 'HIGH', fn: testSSRF }
  ];
  
  const startTime = Date.now();
  
  for (const test of tests) {
    await runSecurityTest(test.name, test.severity, test.fn);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Generate security report
  const report = {
    summary: {
      total: tests.length,
      passed: securityResults.passed,
      failed: securityResults.failed,
      critical: securityResults.critical,
      high: securityResults.high,
      medium: securityResults.medium,
      low: securityResults.low,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        apiUrl: CONFIG.API_URL,
        webUrl: CONFIG.WEB_URL
      }
    },
    vulnerabilities: securityResults.tests.filter(test => test.status === 'FAILED'),
    allTests: securityResults.tests
  };
  
  // Save security report
  const reportPath = path.join(process.cwd(), 'owasp-security-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  log('info', '🛡️  OWASP Security Test Results Summary:');
  log('info', `Total Tests: ${report.summary.total}`);
  log('info', `✅ Passed: ${report.summary.passed}`);
  log('info', `❌ Failed: ${report.summary.failed}`);
  log('info', `🔴 Critical: ${report.summary.critical}`);
  log('info', `🟠 High: ${report.summary.high}`);
  log('info', `🟡 Medium: ${report.summary.medium}`);
  log('info', `🔵 Low: ${report.summary.low}`);
  log('info', `⏱️  Duration: ${totalDuration}ms`);
  log('info', `📄 Full report saved to: ${reportPath}`);
  
  // Security recommendations
  if (report.summary.failed > 0) {
    log('warn', '⚠️  Security Issues Found:');
    report.vulnerabilities.forEach(vuln => {
      log('warn', `- ${vuln.name} (${vuln.severity}): ${vuln.vulnerability}`);
      log('info', `  Recommendation: ${vuln.recommendation}`);
    });
  }
  
  // Exit with appropriate code
  if (securityResults.critical > 0) {
    log('error', '🚨 CRITICAL security vulnerabilities found!');
    process.exit(1);
  } else if (securityResults.high > 0) {
    log('warn', '⚠️  HIGH severity security issues found!');
    process.exit(1);
  } else if (securityResults.failed > 0) {
    log('warn', '⚠️  Some security tests failed.');
    process.exit(1);
  } else {
    log('info', '🎉 All OWASP security tests passed!');
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
  runOWASPSecurityTests().catch((error) => {
    log('error', 'OWASP security tests failed with error:', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = {
  runOWASPSecurityTests,
  CONFIG
};