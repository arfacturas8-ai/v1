const { prisma } = require('@cryb/database');
const jwt = require('jsonwebtoken');

async function generateTestToken() {
  console.log('🔑 Generating JWT token for Discord test user...');
  
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'discordtest@test.com' }
    });

    if (!user) {
      console.error('❌ Test user not found');
      return;
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    console.log('✅ JWT token generated successfully:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Token:', token);
    console.log('');
    console.log('💡 Use this token for Socket.IO authentication tests');
    
    return { user, token };

  } catch (error) {
    console.error('❌ Failed to generate test token:', error);
    throw error;
  }
}

generateTestToken().catch(console.error);
