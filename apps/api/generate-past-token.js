const jwt = require('jsonwebtoken');

// Generate a token with 2024 timestamps to work around clock issue
function generatePastToken() {
  console.log('🔑 Generating JWT token with 2024 timestamps...');
  
  const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';
  
  // Use 2024 timestamps
  const iat = Math.floor(new Date('2024-09-24T05:32:00Z').getTime() / 1000); // Issued at
  const exp = Math.floor(new Date('2024-09-25T05:32:00Z').getTime() / 1000); // Expires in 24h
  
  console.log('Issued at (iat):', iat, new Date(iat * 1000));
  console.log('Expires at (exp):', exp, new Date(exp * 1000));
  
  const token = jwt.sign(
    {
      userId: 'cmfxiipvt0000bfh9npu2hfbw',
      email: 'test@example.com',
      username: 'testuser',
      sub: 'cmfxiipvt0000bfh9npu2hfbw',
      iat: iat,
      exp: exp
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

generatePastToken();