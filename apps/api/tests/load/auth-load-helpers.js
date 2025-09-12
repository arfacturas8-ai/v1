const crypto = require('crypto');

// Authentication load test configuration
const AUTH_CONFIG = {
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  rateLimiting: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    resetWindow: 60 * 60 * 1000 // 1 hour
  },
  tokenConfig: {
    accessTokenExpiry: 15 * 60, // 15 minutes
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
    totpWindow: 30 // 30 second window for TOTP
  },
  oauth: {
    providers: ['google', 'facebook', 'github', 'discord'],
    stateExpiry: 10 * 60 * 1000 // 10 minutes
  }
};

// Tracking variables
let registrationCounter = 0;
let loginCounter = 0;
let tokenRefreshCounter = 0;
let failedLoginCounter = 0;
let rateLimitCounter = 0;

const activeUsers = new Map();
const activeSessions = new Map();
const failedAttempts = new Map();
const oauthStates = new Map();

// Realistic user data pools
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Ryan', 'Ashley'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];

// Common weak passwords for security testing
const weakPasswords = ['password123', '123456789', 'qwerty123', 'password!', 'admin123'];

// Device fingerprints for realistic testing
const deviceTypes = ['desktop', 'mobile', 'tablet'];
const browsers = ['chrome', 'firefox', 'safari', 'edge'];
const operatingSystems = ['windows', 'macos', 'linux', 'ios', 'android'];

/**
 * Generate unique user registration data
 */
function generateUniqueRegistration(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const uniqueId = crypto.randomBytes(4).toString('hex');
  registrationCounter++;
  
  // Generate realistic user data
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  const userData = {
    email: `loadtest.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@${domain}`,
    username: `${firstName}${lastName}${registrationCounter}`.toLowerCase(),
    password: generateSecurePassword(),
    firstName: firstName,
    lastName: lastName,
    dateOfBirth: generateRealisticBirthDate(),
    marketingOptIn: Math.random() > 0.3 // 70% opt-in rate
  };
  
  // Set context variables
  Object.entries(userData).forEach(([key, value]) => {
    context.vars[key] = value;
  });
  
  // Track user for later use
  activeUsers.set(userData.email, {
    password: userData.password,
    username: userData.username,
    registrationTime: timestamp,
    type: 'new_user'
  });
  
  ee.emit('counter', 'auth.registrations.generated', 1);
  ee.emit('histogram', 'auth.user.registration_sequence', registrationCounter);
  
  return next();
}

/**
 * Generate login credentials (mix of existing and new users)
 */
function generateLoginCredentials(requestParams, context, ee, next) {
  loginCounter++;
  
  // 80% existing users, 20% failed attempts with wrong credentials
  const useExistingUser = Math.random() > 0.2;
  
  if (useExistingUser && activeUsers.size > 0) {
    // Use existing user credentials
    const userEmails = Array.from(activeUsers.keys());
    const randomEmail = userEmails[Math.floor(Math.random() * userEmails.length)];
    const userData = activeUsers.get(randomEmail);
    
    context.vars.email = randomEmail;
    context.vars.password = userData.password;
    context.vars.isExistingUser = true;
    
    ee.emit('counter', 'auth.logins.existing_user', 1);
  } else {
    // Generate credentials for non-existent user or wrong password
    context.vars.email = generateRandomEmail();
    context.vars.password = Math.random() > 0.5 ? 'wrongpassword123' : generateSecurePassword();
    context.vars.isExistingUser = false;
    
    ee.emit('counter', 'auth.logins.invalid_credentials', 1);
  }
  
  // Generate realistic login metadata
  context.vars.rememberMe = Math.random() > 0.6; // 40% remember me
  context.vars.deviceFingerprint = generateDeviceFingerprint();
  
  ee.emit('histogram', 'auth.login.sequence', loginCounter);
  
  return next();
}

/**
 * Generate OAuth callback data
 */
function generateOAuthCallback(requestParams, context, ee, next) {
  const providers = AUTH_CONFIG.oauth.providers;
  const provider = providers[Math.floor(Math.random() * providers.length)];
  
  const authCode = crypto.randomBytes(16).toString('hex');
  const authState = crypto.randomBytes(8).toString('hex');
  
  // Store OAuth state for validation
  oauthStates.set(authState, {
    provider: provider,
    timestamp: Date.now(),
    used: false
  });
  
  context.vars.authCode = authCode;
  context.vars.authState = authState;
  context.vars.provider = provider;
  
  ee.emit('counter', `auth.oauth.${provider}`, 1);
  ee.emit('counter', 'auth.oauth.callbacks_generated', 1);
  
  return next();
}

/**
 * Generate password reset data
 */
function generatePasswordReset(requestParams, context, ee, next) {
  // Use existing user email 70% of the time
  let email;
  
  if (Math.random() > 0.3 && activeUsers.size > 0) {
    const userEmails = Array.from(activeUsers.keys());
    email = userEmails[Math.floor(Math.random() * userEmails.length)];
  } else {
    email = generateRandomEmail();
  }
  
  context.vars.email = email;
  context.vars.captchaToken = generateCaptchaToken();
  context.vars.resetToken = crypto.randomBytes(16).toString('hex');
  context.vars.newPassword = generateSecurePassword();
  
  ee.emit('counter', 'auth.password_reset.requests_generated', 1);
  
  return next();
}

/**
 * Authenticate existing user for token operations
 */
function authenticateExistingUser(context, ee, next) {
  if (activeUsers.size === 0) {
    // Create a default user if none exist
    const defaultUser = {
      email: 'defaultuser@loadtest.com',
      password: generateSecurePassword(),
      username: 'defaultuser'
    };
    
    activeUsers.set(defaultUser.email, defaultUser);
  }
  
  const userEmails = Array.from(activeUsers.keys());
  const randomEmail = userEmails[Math.floor(Math.random() * userEmails.length)];
  const userData = activeUsers.get(randomEmail);
  
  // Generate tokens
  const authToken = generateJWTToken(userData);
  const refreshToken = generateRefreshToken();
  
  context.vars.email = randomEmail;
  context.vars.password = userData.password;
  context.vars.authToken = authToken;
  context.vars.refreshToken = refreshToken;
  
  // Create session
  const sessionId = crypto.randomBytes(8).toString('hex');
  activeSessions.set(sessionId, {
    email: randomEmail,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    refreshToken: refreshToken
  });
  
  context.vars.sessionId = sessionId;
  
  ee.emit('counter', 'auth.existing_user.authenticated', 1);
  
  return next();
}

/**
 * Generate TOTP code for 2FA testing
 */
function generateTOTPCode(requestParams, context, ee, next) {
  // Simulate TOTP generation (in real implementation, use proper TOTP library)
  const totpSecret = context.vars.totpSecret || 'LOADTESTSECRET12345';
  const timeWindow = Math.floor(Date.now() / 1000 / AUTH_CONFIG.tokenConfig.totpWindow);
  
  // Simple mock TOTP (not cryptographically secure, for testing only)
  const hash = crypto.createHmac('sha256', totpSecret).update(timeWindow.toString()).digest('hex');
  const totpCode = (parseInt(hash.slice(-6), 16) % 1000000).toString().padStart(6, '0');
  
  context.vars.totpCode = totpCode;
  context.vars.tempToken = crypto.randomBytes(16).toString('hex');
  
  ee.emit('counter', 'auth.totp.codes_generated', 1);
  
  return next();
}

/**
 * Maybe verify email (30% chance)
 */
function maybeVerifyEmail(context, ee, next) {
  if (Math.random() > 0.7) { // 30% chance
    const verificationToken = crypto.randomBytes(16).toString('hex');
    
    // Simulate email verification API call
    setTimeout(() => {
      ee.emit('counter', 'auth.email.verifications_completed', 1);
      ee.emit('histogram', 'auth.email.verification_time', 500 + Math.random() * 1000);
    }, 200);
  }
  
  return next();
}

/**
 * Generate secure password meeting requirements
 */
function generateSecurePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one character from each required category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill remaining characters
  const allChars = uppercase + lowercase + numbers + specialChars;
  const remainingLength = Math.floor(Math.random() * 8) + 8; // 8-15 total length
  
  for (let i = password.length; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate realistic birth date
 */
function generateRealisticBirthDate() {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * 60) - 18; // 18-78 years old
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1; // Avoid month edge cases
  
  return `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
}

/**
 * Generate random email address
 */
function generateRandomEmail() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 10000);
  
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomNum}@${domain}`;
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint() {
  const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const os = operatingSystems[Math.floor(Math.random() * operatingSystems.length)];
  
  const fingerprint = {
    deviceType: deviceType,
    browser: browser,
    browserVersion: `${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.${Math.floor(Math.random() * 1000)}`,
    os: os,
    osVersion: generateOSVersion(os),
    screenResolution: generateScreenResolution(deviceType),
    timezone: generateTimezone(),
    language: 'en-US',
    userAgent: generateUserAgent(browser, os)
  };
  
  return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}

/**
 * Generate OS version based on operating system
 */
function generateOSVersion(os) {
  const versions = {
    windows: ['10.0.19045', '11.0.22631', '10.0.18363'],
    macos: ['14.1.0', '13.6.0', '12.7.0'],
    linux: ['5.15.0', '6.2.0', '5.4.0'],
    ios: ['17.1.1', '16.7.0', '15.7.9'],
    android: ['14', '13', '12', '11']
  };
  
  const osVersions = versions[os] || versions.linux;
  return osVersions[Math.floor(Math.random() * osVersions.length)];
}

/**
 * Generate screen resolution based on device type
 */
function generateScreenResolution(deviceType) {
  const resolutions = {
    desktop: ['1920x1080', '2560x1440', '1366x768', '3840x2160'],
    mobile: ['390x844', '414x896', '375x667', '360x640'],
    tablet: ['1024x768', '2048x1536', '1920x1200', '2560x1600']
  };
  
  const deviceResolutions = resolutions[deviceType] || resolutions.desktop;
  return deviceResolutions[Math.floor(Math.random() * deviceResolutions.length)];
}

/**
 * Generate random timezone
 */
function generateTimezone() {
  const timezones = [
    'America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai',
    'Australia/Sydney', 'America/Toronto', 'America/Sao_Paulo'
  ];
  
  return timezones[Math.floor(Math.random() * timezones.length)];
}

/**
 * Generate realistic user agent
 */
function generateUserAgent(browser, os) {
  const userAgents = {
    chrome: {
      windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      macos: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    firefox: {
      windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      macos: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
    },
    safari: {
      macos: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
    }
  };
  
  return userAgents[browser]?.[os] || userAgents.chrome.windows;
}

/**
 * Generate JWT token
 */
function generateJWTToken(userData) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId: crypto.randomBytes(8).toString('hex'),
    email: userData.email,
    username: userData.username,
    roles: ['user'],
    permissions: ['read', 'write'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AUTH_CONFIG.tokenConfig.accessTokenExpiry,
    iss: 'cryb-auth',
    aud: 'cryb-api'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHash('sha256').update(`${encodedHeader}.${encodedPayload}.secret`).digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Generate refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate captcha token
 */
function generateCaptchaToken() {
  return `captcha_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate random IP address for testing
 */
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

/**
 * Monitor authentication metrics
 */
function monitorAuthMetrics(context, ee, next) {
  // User metrics
  ee.emit('gauge', 'auth.active_users', activeUsers.size);
  ee.emit('gauge', 'auth.active_sessions', activeSessions.size);
  ee.emit('gauge', 'auth.oauth_states', oauthStates.size);
  
  // Operation counters
  ee.emit('gauge', 'auth.total_registrations', registrationCounter);
  ee.emit('gauge', 'auth.total_logins', loginCounter);
  ee.emit('gauge', 'auth.total_token_refreshes', tokenRefreshCounter);
  ee.emit('gauge', 'auth.failed_login_attempts', failedLoginCounter);
  ee.emit('gauge', 'auth.rate_limit_triggers', rateLimitCounter);
  
  // Failed attempts by IP (simulate)
  let totalFailedByIP = 0;
  for (const attempts of failedAttempts.values()) {
    totalFailedByIP += attempts.count;
  }
  ee.emit('gauge', 'auth.failed_attempts_by_ip', totalFailedByIP);
  
  // Session duration calculation
  let totalSessionDuration = 0;
  let activeSessionCount = 0;
  
  for (const session of activeSessions.values()) {
    const duration = Date.now() - session.createdAt;
    totalSessionDuration += duration;
    activeSessionCount++;
  }
  
  if (activeSessionCount > 0) {
    const avgSessionDuration = totalSessionDuration / activeSSessionCount;
    ee.emit('histogram', 'auth.average_session_duration', avgSessionDuration);
  }
  
  return next();
}

/**
 * Track authentication security events
 */
function trackSecurityEvent(eventType, context, ee, next) {
  const ip = context.vars.clientIP || generateRandomIP();
  const timestamp = Date.now();
  
  switch (eventType) {
    case 'failed_login':
      if (!failedAttempts.has(ip)) {
        failedAttempts.set(ip, { count: 0, firstAttempt: timestamp });
      }
      
      const attempts = failedAttempts.get(ip);
      attempts.count++;
      attempts.lastAttempt = timestamp;
      
      if (attempts.count >= AUTH_CONFIG.rateLimiting.maxFailedAttempts) {
        ee.emit('counter', 'auth.security.rate_limit_triggered', 1);
        rateLimitCounter++;
      }
      
      failedLoginCounter++;
      ee.emit('counter', 'auth.security.failed_login', 1);
      break;
      
    case 'successful_login':
      // Reset failed attempts on successful login
      if (failedAttempts.has(ip)) {
        failedAttempts.delete(ip);
      }
      ee.emit('counter', 'auth.security.successful_login', 1);
      break;
      
    case 'suspicious_activity':
      ee.emit('counter', 'auth.security.suspicious_activity', 1);
      break;
      
    case 'account_lockout':
      ee.emit('counter', 'auth.security.account_lockout', 1);
      break;
  }
  
  return next();
}

/**
 * Cleanup authentication resources
 */
function cleanupAuthResources() {
  console.log('🧹 Cleaning up authentication load test resources...');
  
  activeUsers.clear();
  activeSessions.clear();
  failedAttempts.clear();
  oauthStates.clear();
  
  console.log('✅ Authentication load test cleanup completed');
}

// Register cleanup handlers
process.on('SIGINT', cleanupAuthResources);
process.on('SIGTERM', cleanupAuthResources);
process.on('beforeExit', cleanupAuthResources);

// Artillery helper functions (for template use)
function $randomIP() {
  return generateRandomIP();
}

function $timestamp() {
  return new Date().toISOString();
}

function $userAgent() {
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const os = operatingSystems[Math.floor(Math.random() * operatingSystems.length)];
  return generateUserAgent(browser, os);
}

function $randomString(length = 8) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  generateUniqueRegistration,
  generateLoginCredentials,
  generateOAuthCallback,
  generatePasswordReset,
  authenticateExistingUser,
  generateTOTPCode,
  maybeVerifyEmail,
  monitorAuthMetrics,
  trackSecurityEvent,
  cleanupAuthResources,
  // Utility functions for templates
  $randomIP,
  $timestamp,
  $userAgent,
  $randomString
};