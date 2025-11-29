const jwt = require('jsonwebtoken');

// Test different JWT secrets
const secrets = [
  'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024',
  'your-super-secret-jwt-key-that-should-be-in-env-file-and-at-least-256-bits-long',
  'development-secret-change-in-production'
];

// Test token (from our recent generation)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGNyeWIuYWkiLCJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24tNDU2IiwiaXNWZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzU4MDQ3Mjk4LCJleHAiOjE3NTgwNDgxOTgsImF1ZCI6ImNyeWItdXNlcnMiLCJpc3MiOiJjcnliLXBsYXRmb3JtIn0.e8bHKXPQxE62gBo1hTDcSg_Y0VvhgDjLYZQdNwsHcIs';

console.log('Testing JWT verification with different secrets...\n');

secrets.forEach((secret, index) => {
  console.log(`Testing secret ${index + 1}: ${secret.substring(0, 20)}...`);
  try {
    const decoded = jwt.verify(testToken, secret);
    console.log('✅ SUCCESS: Token verified with this secret');
    console.log('Decoded payload:', decoded);
    console.log('---');
    return;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('---');
  }
});

// Also try to create a simple test token with a working secret for immediate use
const workingSecret = secrets[0]; // Use first secret as base

const simplePayload = {
  userId: 'test-user-123',
  sessionId: 'test-session-456',
  email: 'test@cryb.ai',
  isVerified: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  aud: 'cryb-users',
  iss: 'cryb-platform'
};

const simpleToken = jwt.sign(simplePayload, workingSecret);
console.log('\nGenerated test token:', simpleToken);
console.log('Use this token for testing');