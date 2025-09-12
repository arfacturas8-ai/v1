#!/usr/bin/env node

/**
 * Generate a test JWT token for Socket.io authentication testing
 */

const crypto = require('crypto');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';

function base64UrlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncode(str) {
    return base64UrlEscape(Buffer.from(str).toString('base64'));
}

function createJWT(payload, secret) {
    // Use the same method as the auth package
    const jwt = require('jsonwebtoken');
    
    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER || 'cryb-platform',
      audience: process.env.JWT_AUDIENCE || 'cryb-users'
    });
}

// Test user data that matches Socket.io authentication requirements
const testUser = {
  userId: 'test-user-socket-auth-123',
  sessionId: 'test-session-socket-456',
  username: 'socketuser',
  email: 'sockettest@cryb.ai',
  isVerified: true
};

console.log('🔐 CRYB Platform - Socket.io JWT Token Generator');
console.log('='.repeat(60));

try {
  // Create test payload with required fields for Socket.io auth
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId: testUser.userId,
    sessionId: testUser.sessionId,
    username: testUser.username,
    email: testUser.email,
    isVerified: testUser.isVerified,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days from now
  };

  const token = createJWT(payload, JWT_SECRET);

  console.log('\n📋 Token Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\n🎫 Generated JWT Token:');
  console.log(token);
  
  console.log('\n📊 Token Info:');
  console.log(`   Length: ${token.length} characters`);
  console.log(`   Expires: ${new Date(payload.exp * 1000).toISOString()}`);
  console.log(`   User ID: ${payload.userId}`);
  console.log(`   Username: ${payload.username}`);
  
  // Save to file for easy access
  const testData = {
    token: token,
    payload: payload,
    usage: 'Copy the token above and paste it into the Socket.io test client',
    instructions: [
      '1. Open socket-test.html in your browser',
      '2. Paste this token into the JWT input field',
      '3. Click "Connect with Token"',
      '4. Test various real-time events'
    ]
  };
  
  fs.writeFileSync('./test-token.json', JSON.stringify(testData, null, 2));
  
  console.log('\n✅ Token saved to test-token.json');
  console.log('\n🧪 Testing Instructions:');
  console.log('   1. Copy the JWT token above');
  console.log('   2. Open socket-test.html in your browser');
  console.log('   3. Paste token into the input field');
  console.log('   4. Click "Connect with Token"');
  console.log('   5. Test real-time events!');
  
} catch (error) {
  console.error('\n❌ Error generating token:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(60));