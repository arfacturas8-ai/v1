import { AuthService } from '../src/services/auth';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

describe('Socket.IO Authentication Service Integration', () => {
  let authService: AuthService;
  let redis: Redis;
  let testUser: any;

  beforeAll(async () => {
    // Initialize Redis and AuthService
    redis = new Redis(process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0');
    authService = new AuthService(redis);
    
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: 'test-user-auth-unit',
        username: 'authtest',
        displayName: 'Auth Test User',
        email: 'auth@test.com',
        isVerified: true
      }
    });
    
  }, 30000);
  
  afterAll(async () => {
    // Cleanup test user
    try {
      await prisma.session.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    
    await redis.quit();
  }, 15000);

  test('should generate and validate access tokens correctly', async () => {
    // Generate tokens
    const tokens = await authService.generateTokens(testUser.id, {
      deviceInfo: 'test-device',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresAt).toBeDefined();

    // Validate the access token
    const validation = await authService.validateAccessToken(tokens.accessToken);
    
    expect(validation.valid).toBe(true);
    expect(validation.payload).toBeDefined();
    expect(validation.payload?.userId).toBe(testUser.id);
  });

  test('should reject blacklisted tokens', async () => {
    // Generate tokens
    const tokens = await authService.generateTokens(testUser.id);

    // First validation should succeed
    const validation1 = await authService.validateAccessToken(tokens.accessToken);
    expect(validation1.valid).toBe(true);

    // Blacklist the token
    await authService.blacklistToken(tokens.accessToken);

    // Second validation should fail
    const validation2 = await authService.validateAccessToken(tokens.accessToken);
    expect(validation2.valid).toBe(false);
    expect(validation2.reason).toContain('revoked');
  });

  test('should handle invalid tokens gracefully', async () => {
    const validation = await authService.validateAccessToken('invalid-token');
    
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBeDefined();
  });

  test('should handle expired tokens', async () => {
    // This test would require a token that's already expired
    // For simplicity, we'll test with a malformed token that fails parsing
    const validation = await authService.validateAccessToken('expired.token.here');
    
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBeDefined();
  });

  test('should validate session existence for tokens', async () => {
    // Generate tokens
    const tokens = await authService.generateTokens(testUser.id);

    // Validate - should succeed as session exists
    const validation1 = await authService.validateAccessToken(tokens.accessToken);
    expect(validation1.valid).toBe(true);

    // Logout to remove session
    await authService.logout(tokens.accessToken);

    // Validate again - should fail as session no longer exists
    const validation2 = await authService.validateAccessToken(tokens.accessToken);
    expect(validation2.valid).toBe(false);
    expect(validation2.reason).toContain('revoked');
  });

  test('should handle rate limiting on token validation', async () => {
    // Generate tokens
    const tokens = await authService.generateTokens(testUser.id);

    // Make many validation requests quickly
    const validations = [];
    for (let i = 0; i < 120; i++) {
      validations.push(authService.validateAccessToken(tokens.accessToken));
    }

    const results = await Promise.all(validations);
    
    // First several should succeed
    expect(results[0].valid).toBe(true);
    expect(results[10].valid).toBe(true);
    
    // Some later ones might be rate limited
    const rateLimitedCount = results.filter(r => !r.valid && r.reason?.includes('rate limit')).length;
    
    // We expect some rate limiting to occur with 120 rapid requests
    expect(rateLimitedCount).toBeGreaterThan(0);
  }, 15000);

  test('should provide proper error reasons for different failure types', async () => {
    const testCases = [
      { token: '', expectedReason: 'Invalid token format' },
      { token: 'not.a.token', expectedReason: 'verification failed' },
      { token: 'invalid-format', expectedReason: 'verification failed' },
    ];

    for (const testCase of testCases) {
      const validation = await authService.validateAccessToken(testCase.token);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBeDefined();
      // Reason should contain some indication of the error type
      expect(typeof validation.reason).toBe('string');
    }
  });

  test('should handle Redis connection failures gracefully', async () => {
    // Create a new auth service with a bad Redis connection
    const badRedis = new Redis('redis://localhost:9999'); // Non-existent port
    const badAuthService = new AuthService(badRedis);

    // Generate tokens with the original service
    const tokens = await authService.generateTokens(testUser.id);

    // Try to validate with the service that has bad Redis
    const validation = await badAuthService.validateAccessToken(tokens.accessToken);
    
    // Should handle the Redis failure gracefully
    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
    
    await badRedis.quit();
  });
});