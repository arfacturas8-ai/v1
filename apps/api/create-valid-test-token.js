#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function createTestUserAndToken() {
  try {
    console.log('🔧 Creating test user and valid token...');
    
    // JWT secret (same as in app config)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret-here-replace-in-production-with-secure-random-key';
    
    // Create or find test user
    const testUserId = 'test-upload-user-' + randomBytes(8).toString('hex');
    const testEmail = `testupload-${randomBytes(4).toString('hex')}@example.com`;
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: testUserId,
          username: 'testuploaduser' + randomBytes(4).toString('hex'),
          email: testEmail,
          passwordHash: '$2b$10$sample.hash.for.testing.purposes.only',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created test user:', user.id);
    } catch (error) {
      console.log('User creation failed, trying to find existing...', error.message);
      // If user creation fails, try to find existing one
      user = await prisma.user.findFirst({
        where: {
          email: { contains: 'testupload' }
        }
      });
      
      if (!user) {
        throw new Error('Could not create or find test user');
      }
      console.log('✅ Found existing test user:', user.id);
    }
    
    // Create a session for the user
    const sessionId = randomBytes(32).toString('hex');
    
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: randomBytes(64).toString('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Created session:', session.id);
    
    // Generate JWT token with proper payload
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      sessionId: session.id,
      isVerified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'cryb-platform',
      audience: 'cryb-users'
    });
    
    console.log('✅ Generated JWT token');
    console.log('User ID:', user.id);
    console.log('Session ID:', session.id);
    console.log('Token:', token);
    
    return { user, session, token };
    
  } catch (error) {
    console.error('❌ Failed to create test user and token:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUserAndToken().catch(console.error);
}

module.exports = { createTestUserAndToken };
