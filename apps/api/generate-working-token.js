const jwt = require('jsonwebtoken');

// Generate a simple working token for voice testing
function generateWorkingToken() {
  console.log('🔑 Generating working JWT token...');
  
  const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';
  
  const now = Math.floor(Date.now() / 1000);
  console.log('Current timestamp:', now);
  console.log('Current date:', new Date());
  
  const token = jwt.sign(
    {
      userId: 'cmfxiipvt0000bfh9npu2hfbw',
      email: 'test@example.com',
      username: 'testuser',
      sub: 'cmfxiipvt0000bfh9npu2hfbw',
      iat: now,
      exp: now + (24 * 60 * 60) // 24 hours
    },
    JWT_SECRET
  );

  console.log('✅ Token generated:');
  console.log(token);
  console.log('');
  console.log('📋 Test command:');
  console.log(`curl -X GET "http://localhost:3002/api/v1/voice/health" -H "Authorization: Bearer ${token}"`);
  
  return token;
}

generateWorkingToken();