#!/usr/bin/env node

/**
 * Debug AuthService.validateAccessToken directly
 * This will test the complete authentication flow that Socket.io uses
 */

import { AuthService } from './apps/api/src/services/auth';
import Redis from 'ioredis';

const COMPLETE_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZkNm9uNzEwMDByaXZ0Y2RsbGRqNzBiIiwic2Vzc2lvbklkIjoiNzhhYjFjYzItZWM0MS00MWFlLTk2MmUtYzczODlhOTFmZTRlIiwiZW1haWwiOiJmcmVzaHNvY2tldHRlc3Q5OTlAdGVzdC5sb2NhbCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI0OGYwODIxZC1lOTZhLTQ3ZDktOTNkYy0yMzc0ZGE4OGU1MDkiLCJpYXQiOjE3NTc0NjE5NTAsImV4cCI6MTc1NzQ2Mjg1MCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.irBVUSM78Rah-ZvOIquXXDmi59m3Lkn4c4s6W6fSWFU';

async function debugAuthService() {
  console.log('🔍 AUTH SERVICE DEBUGGING');
  console.log('========================\n');

  // Create Redis connection (same as AuthService)
  const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
  const redis = new Redis(redisUrl);
  
  try {
    // Create AuthService instance (same as the Socket.io server)
    console.log('🔴 Creating AuthService instance...');
    const authService = new AuthService(redis);
    console.log('✅ AuthService created\n');
    
    // Test validateAccessToken method directly
    console.log('🔍 Testing validateAccessToken method...');
    console.log(`🎫 Token: ${COMPLETE_JWT_TOKEN.substring(0, 50)}...\n`);
    
    const result = await authService.validateAccessToken(COMPLETE_JWT_TOKEN);
    
    console.log('📋 VALIDATION RESULT:');
    console.log('   - Valid:', result.valid ? '✅ YES' : '❌ NO');
    
    if (result.valid) {
      console.log('   - User ID:', result.payload?.userId);
      console.log('   - Session ID:', result.payload?.sessionId);
      console.log('   - Email:', result.payload?.email);
      console.log('   - JWT ID:', result.payload?.jti);
      console.log('   - Type:', result.payload?.type || 'access');
    } else {
      console.log('   - Reason:', result.reason);
      
      // Provide debugging suggestions based on the failure reason
      if (result.reason?.includes('Session not found')) {
        console.log('\n💡 DEBUG SUGGESTIONS:');
        console.log('   - Check if Redis session exists');
        console.log('   - Check if database session exists');
        console.log('   - Verify session ID matches JWT payload');
      } else if (result.reason?.includes('Token verification failed')) {
        console.log('\n💡 DEBUG SUGGESTIONS:');
        console.log('   - Check JWT secret matches between generation and validation');
        console.log('   - Verify token structure and signature');
      } else if (result.reason?.includes('blacklisted')) {
        console.log('\n💡 DEBUG SUGGESTIONS:');
        console.log('   - Token was explicitly blacklisted (logged out)');
      }
    }
    
    console.log('\n🎯 AUTH SERVICE DEBUG COMPLETE!');
    
  } catch (error) {
    console.error('❌ AuthService debug failed:', error);
  } finally {
    await redis.disconnect();
  }
}

debugAuthService();