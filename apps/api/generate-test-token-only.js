#!/usr/bin/env node

/**
 * Generate a simple JWT token for testing (no database required)
 */

const jwt = require('jsonwebtoken');

// Use the same JWT secret as the server
const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_change_in_production_32_chars_minimum';

function generateTestToken() {
  console.log('🔧 Generating test JWT token...');

  // Create JWT token payload for a mock user
  const payload = {
    userId: 'test-user-id-12345',
    username: 'realtimetest',
    email: 'realtime@test.com',
    isVerified: true,
    sessionId: 'test-session-' + Date.now(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  // Generate token
  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'cryb-platform',
    audience: 'cryb-users'
  });

  console.log('✅ Generated JWT token for testing');
  console.log('\nMock User Details:');
  console.log('- ID:', payload.userId);
  console.log('- Username:', payload.username);
  console.log('- Email:', payload.email);
  console.log('- Is Verified:', payload.isVerified);
  console.log('- Session ID:', payload.sessionId);

  console.log('\nJWT Token (copy this for testing):');
  console.log(token);

  // Verify the token works
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n✅ Token verification successful');
    console.log('Token expires at:', new Date(decoded.exp * 1000).toISOString());
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return null;
  }

  // Also output as environment variable format
  console.log('\n📝 Use this token in your test:');
  console.log('export TEST_JWT_TOKEN="' + token + '"');
  
  // Also create a simple test file
  const testConfig = {
    token,
    user: {
      id: payload.userId,
      username: payload.username,
      email: payload.email
    },
    testChannels: {
      text: 'test-channel-' + Date.now(),
      voice: 'test-voice-' + Date.now()
    }
  };

  require('fs').writeFileSync(__dirname + '/test-config.json', JSON.stringify(testConfig, null, 2));
  console.log('💾 Saved test configuration to test-config.json');

  return { token, payload };
}

if (require.main === module) {
  generateTestToken();
  console.log('\n🚀 Ready to test real-time features!');
  console.log('Run: node simple-realtime-test.js');
}

module.exports = { generateTestToken };