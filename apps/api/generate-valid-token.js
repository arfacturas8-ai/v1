const { generateAccessToken } = require('@cryb/auth');

console.log('🔑 Generating valid JWT token for testing...');

const payload = {
  userId: 'test-user-123',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  sessionId: 'test-session-123'
};

try {
  const token = generateAccessToken(payload);
  
  console.log('✅ Valid JWT token generated:');
  console.log(token);
  
  // Save token to file for easy access
  const fs = require('fs');
  const tokenData = {
    token,
    payload
  };
  
  fs.writeFileSync('/home/ubuntu/cryb-platform/apps/api/valid-test-token.json', JSON.stringify(tokenData, null, 2));
  
  console.log('\n💾 Token saved to valid-test-token.json');
  console.log('🔍 Payload:', payload);
  
} catch (error) {
  console.error('❌ Failed to generate token:', error);
  process.exit(1);
}