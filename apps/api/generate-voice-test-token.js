const { prisma } = require('@cryb/database');
const jwt = require('jsonwebtoken');

async function generateVoiceTestToken() {
  console.log('🔑 Generating JWT token for voice testing...');
  
  try {
    // Find any test user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' },
          { email: 'discordtest@test.com' }
        ]
      }
    });

    if (!user) {
      console.log('🔨 Creating new test user for voice testing...');
      // Create a new test user
      user = await prisma.user.create({
        data: {
          id: `voice-test-user-${Date.now()}`,
          username: `voicetestuser`,
          email: 'voicetest@example.com',
          displayName: 'Voice Test User',
          passwordHash: 'test-hash-not-for-production',
          isVerified: true
        }
      });
      console.log('✅ Created test user:', user.username);
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
    console.log('   Token (24h valid):', token);
    console.log('');
    console.log('💡 Use this token for voice/video API testing');
    console.log('📋 Test command:');
    console.log(`   curl -X GET "http://localhost:3002/api/v1/voice/health" -H "Authorization: Bearer ${token}"`);
    
    return { user, token };

  } catch (error) {
    console.error('❌ Failed to generate test token:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateVoiceTestToken().catch(console.error);