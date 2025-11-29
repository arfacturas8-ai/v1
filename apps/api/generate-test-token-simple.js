const jwt = require('jsonwebtoken');
const fs = require('fs');

// Use the same JWT secret that the API uses
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-development-only-change-in-production';

console.log('🔑 Generating test JWT token...');

const payload = {
  userId: 'test-user-123',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('✅ Test token generated:');
console.log(token);

// Save token to file for easy access
const tokenData = {
  token,
  payload,
  expires: new Date(payload.exp * 1000).toISOString()
};

fs.writeFileSync('/home/ubuntu/cryb-platform/apps/api/test-token.json', JSON.stringify(tokenData, null, 2));

console.log('\n💾 Token saved to test-token.json');
console.log('🔍 Payload:', payload);
console.log('⏰ Expires:', tokenData.expires);