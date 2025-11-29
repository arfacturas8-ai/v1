#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function createTokenFromAnyUser() {
  try {
    console.log('🔧 Finding any user and creating valid token...');
    
    // JWT secret (same as in app config)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret-here-replace-in-production-with-secure-random-key';
    
    // Find any existing user (without filtering by isVerified since that field seems unavailable)
    const user = await prisma.user.findFirst();
    
    if (!user) {
      throw new Error('No users found in database');
    }
    
    console.log('✅ Found user:', user.id, user.username);
    console.log('User fields:', Object.keys(user));
    
    // Create a session for the user
    const sessionId = randomBytes(32).toString('hex');
    
    try {
      const session = await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: randomBytes(64).toString('hex'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });
      
      console.log('✅ Created session:', session.id);
      
      // Generate JWT token with proper payload
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        isVerified: true, // Assume verified for testing
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
      console.log('Username:', user.username);
      console.log('Session ID:', session.id);
      console.log('Full Token:', token);
      
      return { user, session, token };
    } catch (sessionError) {
      console.log('Session creation failed:', sessionError.message);
      console.log('Session fields available:', Object.keys(sessionError?.meta?.target || {}));
      throw sessionError;
    }
    
  } catch (error) {
    console.error('❌ Failed to create token from any user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTokenFromAnyUser().catch(console.error);
}

module.exports = { createTokenFromAnyUser };
