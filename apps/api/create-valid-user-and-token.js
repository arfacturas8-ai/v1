const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const prisma = new PrismaClient();

async function createValidUserAndToken() {
  try {
    console.log('🔧 Creating valid user and token for testing...\n');
    
    // Clean up any existing test user
    try {
      await prisma.user.deleteMany({
        where: { username: 'testuser' }
      });
      console.log('Cleaned up existing test user');
    } catch (error) {
      // Ignore if user doesn't exist
    }
    
    // Create a real user in the database
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ User created:', {
      id: user.id,
      username: user.username,
      email: user.email
    });
    
    // Generate a valid JWT token using the same logic as the auth service
    const tokenPayload = {
      userId: user.id,
      sessionId: 'test-session-' + Date.now(),
      email: user.email,
      walletAddress: null,
      isVerified: user.isVerified,
      jti: 'test-jti-' + Date.now(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    };
    
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER || 'cryb-platform',
      audience: process.env.JWT_AUDIENCE || 'cryb-users'
    });
    
    console.log('✅ Token generated');
    
    // Create a session in the database
    const session = await prisma.session.create({
      data: {
        id: tokenPayload.sessionId,
        userId: user.id,
        token: accessToken,
        refreshToken: 'refresh-' + accessToken, // Simple refresh token for testing
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Session created:', {
      id: session.id,
      userId: session.userId
    });
    
    // Verify the token works
    try {
      const verified = jwt.verify(accessToken, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER || 'cryb-platform',
        audience: process.env.JWT_AUDIENCE || 'cryb-users'
      });
      console.log('✅ Token verification successful');
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return;
    }
    
    // Save the complete test data
    const testData = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: 'TestPassword123!' // For login testing
      },
      session: {
        id: session.id,
        token: accessToken,
        expiresAt: session.expiresAt
      },
      token: {
        accessToken,
        payload: tokenPayload,
        header: `Bearer ${accessToken}`
      },
      createdAt: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('./valid-test-user.json', JSON.stringify(testData, null, 2));
    
    console.log('\n📄 Test data saved to valid-test-user.json');
    console.log('🔑 Authorization header for API testing:');
    console.log(`   Bearer ${accessToken}`);
    
    console.log('\n🧪 You can now test authenticated endpoints with this token');
    
  } catch (error) {
    console.error('❌ Error creating user and token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createValidUserAndToken();