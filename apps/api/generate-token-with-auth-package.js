const { prisma } = require('@cryb/database');
const { generateAccessToken } = require('@cryb/auth');
const { randomUUID } = require('crypto');

async function generateTestTokenWithAuthPackage() {
  console.log('🔑 Generating JWT token using @cryb/auth package...');
  
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'discordtest@test.com' }
    });

    if (!user) {
      console.error('❌ Test user not found');
      return;
    }

    console.log('User found:', user.username, user.id);

    // Generate token using the auth package
    const sessionId = randomUUID();
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: sessionId,
      isVerified: true
    });

    console.log('✅ JWT token generated successfully using @cryb/auth:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Session ID:', sessionId);
    console.log('   Token:', token);
    console.log('');
    console.log('💡 Use this token for Socket.IO authentication tests');
    
    return { user, token, sessionId };

  } catch (error) {
    console.error('❌ Failed to generate test token:', error);
    throw error;
  }
}

generateTestTokenWithAuthPackage().catch(console.error);