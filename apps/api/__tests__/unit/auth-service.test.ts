import { AuthService } from '../../src/services/auth';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';

// Mock Redis instance
const mockRedis = {
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  incr: jest.fn(),
  hset: jest.fn(),
  hgetall: jest.fn(),
  multi: jest.fn(() => ({
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  })),
  ttl: jest.fn(),
  keys: jest.fn(),
} as any;

// Mock prisma with comprehensive user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  walletAddress: '0x123...abc',
  isVerified: true,
  username: 'testuser',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  token: 'access-token-123',
  refreshToken: 'refresh-token-123',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser
};

// Mock @cryb/auth functions
jest.mock('@cryb/auth', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mocked-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mocked-refresh-token'),
  verifyToken: jest.fn(),
  hashPassword: jest.fn().mockReturnValue('hashed-password'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockRedis);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Token Generation Safety', () => {
    beforeEach(() => {
      // Mock successful database operations
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    test('should generate tokens with valid user ID', async () => {
      const result = await authService.generateTokens('user-123');
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    test('should fail with invalid user ID', async () => {
      await expect(authService.generateTokens('')).rejects.toThrow('Invalid userId provided');
      await expect(authService.generateTokens(null as any)).rejects.toThrow('Invalid userId provided');
    });

    test('should fail when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(authService.generateTokens('nonexistent-user')).rejects.toThrow('User not found');
    });

    test('should handle database connection failures during token generation', async () => {
      (prisma.session.create as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));
      
      // Should retry and eventually fail
      await expect(authService.generateTokens('user-123')).rejects.toThrow('Failed to create session in database');
    });

    test('should handle Redis failures during token generation', async () => {
      mockRedis.hset.mockRejectedValueOnce(new Error('Redis connection failed'));
      
      await expect(authService.generateTokens('user-123')).rejects.toThrow('Failed to store session in Redis');
    });

    test('should store session metadata correctly', async () => {
      const sessionInfo = {
        deviceInfo: 'iPhone 12',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };
      
      await authService.generateTokens('user-123', sessionInfo);
      
      expect(mockRedis.hset).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.objectContaining({
          userId: 'user-123',
          deviceInfo: 'iPhone 12',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        })
      );
    });
  });

  describe('Token Validation Safety', () => {
    const { verifyToken } = require('@cryb/auth');

    beforeEach(() => {
      mockRedis.exists.mockResolvedValue(0); // Not blacklisted
      mockRedis.incr.mockResolvedValue(1); // Rate limit
      mockRedis.expire.mockResolvedValue(1);
      verifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
        exp: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
        jti: 'token-id-123'
      });
    });

    test('should validate valid tokens', async () => {
      mockRedis.exists.mockResolvedValue(1); // Session exists
      
      const result = await authService.validateAccessToken('valid-token');
      
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
    });

    test('should reject invalid token formats', async () => {
      const result = await authService.validateAccessToken('');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid token format');
    });

    test('should reject blacklisted tokens', async () => {
      mockRedis.exists
        .mockResolvedValueOnce(1) // Token is blacklisted
        .mockResolvedValueOnce(1); // Session exists (won't be checked)
      
      const result = await authService.validateAccessToken('blacklisted-token');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token has been revoked');
    });

    test('should reject expired tokens', async () => {
      verifyToken.mockImplementationOnce(() => {
        const error = new Error('Token expired');
        error.message = 'jwt expired';
        throw error;
      });
      
      const result = await authService.validateAccessToken('expired-token');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token has expired');
    });

    test('should reject refresh tokens used as access tokens', async () => {
      verifyToken.mockReturnValue({
        type: 'refresh',
        userId: 'user-123',
        sessionId: 'session-123'
      });
      
      const result = await authService.validateAccessToken('refresh-token');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Refresh token cannot be used for access');
    });

    test('should handle Redis failures gracefully during validation', async () => {
      mockRedis.exists.mockRejectedValueOnce(new Error('Redis down'));
      (prisma.session.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      
      const result = await authService.validateAccessToken('valid-token');
      
      // Should fallback to database and still work
      expect(result.valid).toBe(true);
    });

    test('should implement rate limiting for token validation', async () => {
      mockRedis.incr.mockResolvedValue(101); // Exceed limit
      
      const result = await authService.validateAccessToken('rate-limited-token');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token validation rate limit exceeded');
    });
  });

  describe('Token Refresh Safety', () => {
    const { verifyToken } = require('@cryb/auth');

    beforeEach(() => {
      verifyToken.mockReturnValue({
        type: 'refresh',
        userId: 'user-123',
        sessionId: 'session-123',
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      (prisma.session.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      (prisma.session.delete as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      mockRedis.exists.mockResolvedValue(0); // Not blacklisted
    });

    test('should refresh valid tokens successfully', async () => {
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock) = jest.fn().mockResolvedValue({
        ...mockSession,
        id: 'new-session-123'
      });
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      
      const result = await authService.refreshTokens('valid-refresh-token');
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id }
      });
    });

    test('should reject invalid refresh token formats', async () => {
      await expect(authService.refreshTokens('')).rejects.toThrow('Invalid refresh token provided');
    });

    test('should reject expired refresh tokens', async () => {
      verifyToken.mockImplementationOnce(() => {
        const error = new Error('Token expired');
        error.message = 'jwt expired';
        throw error;
      });
      
      await expect(authService.refreshTokens('expired-refresh-token')).rejects.toThrow('Refresh token has expired');
    });

    test('should reject access tokens used for refresh', async () => {
      verifyToken.mockReturnValue({
        type: 'access', // Wrong type
        userId: 'user-123'
      });
      
      await expect(authService.refreshTokens('access-token')).rejects.toThrow('Invalid token type for refresh operation');
    });

    test('should reject tokens for non-existent sessions', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(authService.refreshTokens('orphan-refresh-token')).rejects.toThrow('Session not found');
    });

    test('should clean up expired sessions during refresh', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000) // Expired
      };
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(expiredSession);
      (prisma.session.delete as jest.Mock) = jest.fn().mockResolvedValue(expiredSession);
      
      await expect(authService.refreshTokens('expired-session-token')).rejects.toThrow('Refresh token has expired');
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: expiredSession.id }
      });
    });

    test('should blacklist old refresh token after successful refresh', async () => {
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      
      await authService.refreshTokens('old-refresh-token');
      
      // Should attempt to blacklist the old token
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('blacklist:token:'),
        expect.any(Number),
        expect.stringContaining('revokedAt')
      );
    });
  });

  describe('Brute Force Protection', () => {
    test('should allow requests under the limit', async () => {
      mockRedis.get.mockResolvedValue('3'); // 3 attempts
      
      const result = await authService.checkBruteForce('user@example.com');
      
      expect(result.allowed).toBe(true);
    });

    test('should block requests over the limit', async () => {
      mockRedis.get.mockResolvedValue('5'); // 5 attempts (at limit)
      mockRedis.ttl.mockResolvedValue(1800); // 30 minutes left
      
      const result = await authService.checkBruteForce('user@example.com');
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(1800);
    });

    test('should record failed attempts correctly', async () => {
      const multiMock = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };
      mockRedis.multi.mockReturnValue(multiMock);
      
      await authService.recordFailedAttempt('user@example.com');
      
      expect(multiMock.incr).toHaveBeenCalledWith('bruteforce:user@example.com');
      expect(multiMock.expire).toHaveBeenCalledWith('bruteforce:user@example.com', 3600);
    });

    test('should clear failed attempts on successful login', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      await authService.clearFailedAttempts('user@example.com');
      
      expect(mockRedis.del).toHaveBeenCalledWith('bruteforce:user@example.com');
    });
  });

  describe('Session Management Safety', () => {
    test('should logout user and blacklist token', async () => {
      const { verifyToken } = require('@cryb/auth');
      verifyToken.mockReturnValue({
        sessionId: 'session-123',
        userId: 'user-123'
      });
      (prisma.session.deleteMany as jest.Mock) = jest.fn().mockResolvedValue({ count: 1 });
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
      
      await authService.logout('test-token');
      
      expect(mockRedis.setex).toHaveBeenCalled(); // Token blacklisted
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { token: 'test-token' }
      });
      expect(mockRedis.del).toHaveBeenCalledWith('session:session-123');
    });

    test('should logout from all devices', async () => {
      const sessions = [
        { ...mockSession, id: 'session-1' },
        { ...mockSession, id: 'session-2' }
      ];
      (prisma.session.findMany as jest.Mock) = jest.fn().mockResolvedValue(sessions);
      (prisma.session.deleteMany as jest.Mock) = jest.fn().mockResolvedValue({ count: 2 });
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(2);
      
      await authService.logoutAllDevices('user-123');
      
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      });
      expect(mockRedis.del).toHaveBeenCalledWith('session:session-1', 'session:session-2');
    });

    test('should handle logout failures gracefully', async () => {
      const { verifyToken } = require('@cryb/auth');
      verifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      mockRedis.setex.mockResolvedValue('OK');
      (prisma.session.deleteMany as jest.Mock) = jest.fn().mockResolvedValue({ count: 0 });
      
      // Should not throw error, but still blacklist token
      await expect(authService.logout('invalid-token')).resolves.not.toThrow();
      expect(mockRedis.setex).toHaveBeenCalled(); // Token still blacklisted
    });
  });

  describe('Security Statistics and Monitoring', () => {
    test('should calculate security score correctly', async () => {
      (prisma.session.count as jest.Mock) = jest.fn().mockResolvedValue(5);
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        ...mockUser,
        isVerified: true
      });
      mockRedis.get.mockResolvedValue('0'); // No failed attempts
      mockRedis.hgetall.mockResolvedValue({
        deviceInfo: 'Chrome Browser',
        ipAddress: '192.168.1.1',
        lastActivity: new Date().toISOString()
      });
      
      const stats = await authService.getSecurityStats('user-123');
      
      expect(stats.securityScore).toBeGreaterThan(80); // High score for verified user
      expect(stats.isVerified).toBe(true);
      expect(stats.hasEmail).toBe(true);
      expect(stats.hasWallet).toBe(true);
    });

    test('should handle errors in security stats gracefully', async () => {
      (prisma.session.count as jest.Mock) = jest.fn().mockRejectedValue(new Error('DB Error'));
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockRejectedValue(new Error('DB Error'));
      mockRedis.get.mockRejectedValue(new Error('Redis Error'));
      
      const stats = await authService.getSecurityStats('user-123');
      
      expect(stats).toHaveProperty('error');
      expect(stats.securityScore).toBe(0);
      expect(stats.activeSessionCount).toBe(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should retry database operations on failure', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce('success');
      
      const result = await (authService as any).executeWithRetry(
        operation,
        'Test operation failed',
        3
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        (authService as any).executeWithRetry(operation, 'Test operation failed', 2)
      ).rejects.toThrow('Test operation failed: Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should handle missing Redis gracefully', async () => {
      // Simulate Redis being completely down
      const redisDownMock = {
        ping: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        exists: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        hgetall: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      } as any;
      
      const authServiceWithoutRedis = new AuthService(redisDownMock);
      
      // Should still validate tokens using database fallback
      const { verifyToken } = require('@cryb/auth');
      verifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123'
      });
      (prisma.session.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      
      const result = await authServiceWithoutRedis.validateAccessToken('test-token');
      expect(result.valid).toBe(true);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should reject malformed inputs', async () => {
      // Test various malformed inputs
      const malformedInputs = [
        undefined,
        null,
        {},
        [],
        123,
        true,
        Symbol('test')
      ];
      
      for (const input of malformedInputs) {
        await expect(authService.generateTokens(input as any))
          .rejects.toThrow('Invalid userId provided');
      }
    });

    test('should handle special characters in identifiers safely', async () => {
      const specialIdentifiers = [
        'user@example.com',
        'user+test@example.com',
        'user.test@example.com',
        'user_test@example.com'
      ];
      
      mockRedis.get.mockResolvedValue('0');
      
      for (const identifier of specialIdentifiers) {
        const result = await authService.checkBruteForce(identifier);
        expect(result.allowed).toBe(true);
      }
    });
  });
});