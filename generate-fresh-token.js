#!/usr/bin/env node

/**
 * Generate a fresh JWT token for testing Socket.io authentication
 * Uses the same JWT generation logic as the @cryb/auth package
 */

const { randomUUID, randomBytes } = require('crypto');

// Import the JWT utilities from @cryb/auth (same as used in production)
const { generateAccessToken } = require('./packages/auth/src/jwt.ts');

function generateFreshToken() {
  console.log('🔐 Generating fresh JWT token for Socket.io authentication...\n');
  
  const payload = {
    userId: 'cmfd6on710000rivtcdlldj70b', // Use the same test user ID
    sessionId: randomUUID(),
    email: 'freshsockettest999@test.local',
    walletAddress: null,
    isVerified: false,
    jti: randomUUID()
  };
  
  try {
    // Use the same generateAccessToken function as the AuthService
    const token = generateAccessToken(payload);
    
    console.log('✅ Fresh JWT token generated using production JWT utilities!');
    console.log(`📅 Valid for: 15 minutes`);
    console.log(`🎫 Token: ${token}\n`);
    
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    return null;
  }
}

const freshToken = generateFreshToken();
if (freshToken) {
  console.log('🚀 Ready to test Socket.io authentication with fresh token!');
  console.log('\n🔧 Copy this token to your test script:');
  console.log(`const FRESH_JWT_TOKEN = '${freshToken}';`);
}