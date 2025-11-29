const jwt = require('jsonwebtoken');
const fs = require('fs');

const fixedSecret = 'super-secret-jwt-key-for-development-only-change-in-production-fixed-for-testing-12345678901234567890';

console.log('🔑 Generating token for real user...');

const payload = {
  userId: 'cmfli232m00007r75206dsan1', // Real user ID from database
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@test.com',
  sessionId: 'test-session-123',
  type: 'access',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
};

const token = jwt.sign(payload, fixedSecret, {
  algorithm: 'HS256',
  issuer: process.env.JWT_ISSUER || 'cryb-platform',
  audience: process.env.JWT_AUDIENCE || 'cryb-users'
});

console.log('✅ Token generated for real user:');
console.log(token);

// Save to file
fs.writeFileSync('/home/ubuntu/cryb-platform/apps/api/real-user-token.json', JSON.stringify({
  token,
  payload,
  secret: fixedSecret
}, null, 2));

console.log('\n💾 Token saved to real-user-token.json');
console.log('🔍 User ID:', payload.userId);
console.log('🔍 Username:', payload.username);