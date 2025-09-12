#!/usr/bin/env node

/**
 * Debug the exact Socket.io authentication flow
 * This simulates what the crash-safe socket middleware does
 */

import { AuthService } from './apps/api/src/services/auth';
import { prisma } from './packages/database/src';
import Redis from 'ioredis';

const COMPLETE_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZkNm9uNzEwMDByaXZ0Y2RsbGRqNzBiIiwic2Vzc2lvbklkIjoiNzhhYjFjYzItZWM0MS00MWFlLTk2MmUtYzczODlhOTFmZTRlIiwiZW1haWwiOiJmcmVzaHNvY2tldHRlc3Q5OTlAdGVzdC5sb2NhbCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI0OGYwODIxZC1lOTZhLTQ3ZDktOTNkYy0yMzc0ZGE4OGU1MDkiLCJpYXQiOjE3NTc0NjE5NTAsImV4cCI6MTc1NzQ2Mjg1MCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.irBVUSM78Rah-ZvOIquXXDmi59m3Lkn4c4s6W6fSWFU';

// Simulate circuit breaker
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  timeout: number;
  threshold: number;
  retryTimeout: number;
}

class SocketAuthDebugger {
  private authService: AuthService;
  private redis: Redis;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
    this.redis = new Redis(redisUrl);
    this.authService = new AuthService(this.redis);
    this.setupCircuitBreakers();
  }

  private setupCircuitBreakers() {
    const services = ['redis', 'database', 'auth', 'livekit'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        timeout: 60000,
        threshold: 5,
        retryTimeout: 30000
      });
    });
    console.log('🔌 Circuit breakers initialized');
  }

  private async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T | null> {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      throw new Error(`Circuit breaker not found for service: ${service}`);
    }

    const now = Date.now();

    // Check if circuit is open
    if (breaker.state === CircuitState.OPEN) {
      if (now - breaker.lastFailureTime < breaker.retryTimeout) {
        console.log(`🚫 Circuit breaker OPEN for ${service}, rejecting request`);
        return null;
      } else {
        breaker.state = CircuitState.HALF_OPEN;
        breaker.successCount = 0;
        console.log(`🔄 Circuit breaker HALF-OPEN for ${service}, testing recovery`);
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failure count
      breaker.failureCount = 0;
      
      if (breaker.state === CircuitState.HALF_OPEN) {
        breaker.successCount++;
        if (breaker.successCount >= 3) {
          breaker.state = CircuitState.CLOSED;
          console.log(`✅ Circuit breaker CLOSED for ${service} - service recovered`);
        }
      }
      
      return result;
    } catch (error) {
      breaker.failureCount++;
      breaker.lastFailureTime = now;
      
      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = CircuitState.OPEN;
        console.log(`❌ Circuit breaker OPEN for ${service} - threshold exceeded`);
      }
      
      throw error;
    }
  }

  async testSocketAuthentication() {
    console.log('🔍 SOCKET AUTHENTICATION FLOW DEBUG');
    console.log('===================================\n');

    try {
      console.log('1️⃣ TOKEN EXTRACTION SIMULATION...');
      const token = COMPLETE_JWT_TOKEN; // Simulate extracting from socket.handshake.auth.token
      console.log(`   ✅ Token extracted: ${token.substring(0, 50)}...\n`);

      console.log('2️⃣ TOKEN VALIDATION (with circuit breaker)...');
      const validation = await this.executeWithCircuitBreaker('auth', async () => {
        console.log('   🔍 Calling authService.validateAccessToken...');
        return this.authService.validateAccessToken(token);
      });

      console.log('   📋 Validation result:', validation);
      
      if (!validation || !validation.valid) {
        const reason = validation?.reason || 'Authentication service unavailable';
        console.log(`   ❌ AUTHENTICATION FAILED: ${reason}`);
        return false;
      }

      const payload = validation.payload;
      console.log('   ✅ Token validation successful');
      console.log(`   👤 User ID: ${payload.userId}`);
      console.log(`   🆔 Session ID: ${payload.sessionId}\n`);

      console.log('3️⃣ USER LOOKUP (with circuit breaker)...');
      const user = await this.executeWithCircuitBreaker('database', async () => {
        console.log('   🔍 Looking up user in database...');
        return prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            lastSeenAt: true
          }
        });
      });

      if (!user) {
        console.log('   ❌ USER NOT FOUND or database unavailable');
        return false;
      }

      console.log('   ✅ User lookup successful');
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   📧 Display name: ${user.displayName}\n`);

      console.log('4️⃣ BAN CHECK (with circuit breaker)...');
      const banCount = await this.executeWithCircuitBreaker('database', async () => {
        console.log('   🔍 Checking for user bans...');
        return prisma.ban.count({
          where: { userId: user.id }
        });
      });

      if (banCount && banCount > 0) {
        console.log(`   ❌ USER IS BANNED (${banCount} active bans)`);
        return false;
      }

      console.log('   ✅ User is not banned\n');

      console.log('🎉 SOCKET AUTHENTICATION SUCCESS!');
      console.log('   ✅ Token validated');
      console.log('   ✅ User exists');
      console.log('   ✅ User not banned');
      console.log('   ✅ All circuit breakers operational');
      
      return true;

    } catch (error) {
      console.error('❌ Socket authentication failed with error:', error);
      return false;
    }
  }

  async cleanup() {
    await this.redis.disconnect();
    await prisma.$disconnect();
  }
}

async function main() {
  const authDebugger = new SocketAuthDebugger();
  
  try {
    const success = await authDebugger.testSocketAuthentication();
    
    console.log('\n🎯 FINAL RESULT:');
    console.log('   Socket auth would', success ? '✅ SUCCEED' : '❌ FAIL');
    
  } finally {
    await authDebugger.cleanup();
  }
}

main();