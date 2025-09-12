#!/usr/bin/env node

/**
 * Generate a complete JWT token with session for Socket.io authentication testing
 * This creates both the JWT token AND the required session in Redis/database
 */

import { generateAccessToken, generateRefreshToken } from './packages/auth/src/jwt';
import { randomUUID } from 'crypto';
import { prisma } from './packages/database/src';
import Redis from 'ioredis';

async function generateTokenWithSession() {
  console.log('🔐 Generating complete JWT token with session for Socket.io authentication...\n');
  
  // Connect to Redis
  const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
  const redis = new Redis(redisUrl);
  
  try {
    // First, let's find an existing user or use the test user if it exists
    const testEmail = 'freshsockettest999@test.local';
    
    console.log('👤 Finding existing test user...');
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: testEmail },
          { id: 'cmfd6on710000rivtcdlldj70b' }
        ]
      }
    });
    
    if (!user) {
      // If no user found, get any existing user for testing
      user = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (!user) {
        throw new Error('No users found in database. Please create a user first.');
      }
      console.log(`✅ Using existing user for testing: ${user.username} (${user.id})`);
    } else {
      console.log(`✅ Found test user: ${user.username || user.email} (${user.id})`);
    }
    
    // Generate session data
    const sessionId = randomUUID();
    const jti = randomUUID();
    const now = new Date();
    const expiryTime = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes
    
    // Create the JWT payload
    const payload = {
      userId: user.id,
      sessionId: sessionId,
      email: user.email,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified || false,
      jti: jti
    };
    
    // Generate both access and refresh tokens
    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    console.log('🎫 Generated access and refresh tokens');
    
    // Create session in database
    console.log('💾 Creating session in database...');
    const dbSession = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: token,
        refreshToken: refreshToken,
        expiresAt: expiryTime
      }
    });
    console.log(`✅ Created database session: ${dbSession.id}`);
    
    // Create session in Redis
    console.log('🔴 Creating session in Redis...');
    const sessionKey = `session:${sessionId}`;
    await redis.hset(sessionKey, {
      userId: user.id,
      sessionId: sessionId,
      token: token,
      expiresAt: expiryTime.toISOString(),
      lastActivity: now.toISOString(),
      deviceInfo: 'Socket.io Test Client',
      ipAddress: '127.0.0.1'
    });
    
    // Set expiration on Redis session
    await redis.expireat(sessionKey, Math.floor(expiryTime.getTime() / 1000));
    console.log('✅ Created Redis session with expiration');
    
    console.log('\n✅ COMPLETE TOKEN WITH SESSION GENERATED!');
    console.log(`📅 Valid until: ${expiryTime.toISOString()}`);
    console.log(`🆔 Session ID: ${sessionId}`);
    console.log(`👤 User ID: ${user.id}`);
    console.log(`🎫 JWT Token: ${token}\n`);
    
    // Verify the complete authentication flow
    console.log('🔍 Verifying authentication flow...');
    
    // Test Redis session exists
    const sessionExists = await redis.exists(sessionKey);
    console.log(`🔴 Redis session exists: ${sessionExists ? '✅' : '❌'}`);
    
    // Test database session exists
    const dbSessionExists = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    console.log(`💾 Database session exists: ${dbSessionExists ? '✅' : '❌'}`);
    
    console.log('\n🎯 AUTHENTICATION SETUP COMPLETE!');
    console.log('🔧 Use this token in your Socket.io test:');
    console.log(`const COMPLETE_JWT_TOKEN = '${token}';`);
    
    return token;
    
  } catch (error) {
    console.error('❌ Failed to generate token with session:', error);
    return null;
  } finally {
    await redis.disconnect();
    await prisma.$disconnect();
  }
}

generateTokenWithSession();