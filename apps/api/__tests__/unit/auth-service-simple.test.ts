import { AuthService } from '../../src/services/auth';

// Mock dependencies
jest.mock('ioredis');
jest.mock('@cryb/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    loginAttempt: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@cryb/auth', () => ({
  generateAccessToken: jest.fn((userId: string) => `access_token_${userId}`),
  generateRefreshToken: jest.fn(() => 'refresh_token_123'),
  verifyToken: jest.fn((token: string) => ({ userId: 'user_123', exp: Math.floor(Date.now() / 1000) + 3600 })),
  hashPassword: jest.fn((password: string) => `hashed_${password}`),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
}));

describe('AuthService - Simple Tests', () => {
  let authService: AuthService;
  let mockRedis: any;

  beforeEach(() => {
    // Create mock Redis instance
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      incr: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      multi: jest.fn(() => ({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1], [null, 1]]),
      })),
      ttl: jest.fn(),
      keys: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
    
    // Create AuthService instance
    authService = new AuthService(mockRedis);
  });

  describe('constructor', () => {
    test('should create an instance of AuthService', () => {
      expect(authService).toBeInstanceOf(AuthService);
    });

    test('should initialize with redis client', () => {
      expect(authService).toHaveProperty('redis');
    });
  });

  describe('validateCSRFToken', () => {
    test('should validate a valid CSRF token', async () => {
      const token = 'valid_csrf_token';
      const userId = 'user_123';
      
      mockRedis.get.mockResolvedValue(JSON.stringify({
        token,
        userId,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        used: false,
      }));

      const result = await authService.validateCSRFToken(token, userId);
      expect(result).toBe(true);
    });

    test('should reject an expired CSRF token', async () => {
      const token = 'expired_csrf_token';
      const userId = 'user_123';
      
      mockRedis.get.mockResolvedValue(JSON.stringify({
        token,
        userId,
        expiresAt: new Date(Date.now() - 3600000).toISOString(),
        used: false,
      }));

      const result = await authService.validateCSRFToken(token, userId);
      expect(result).toBe(false);
    });

    test('should reject a used CSRF token', async () => {
      const token = 'used_csrf_token';
      const userId = 'user_123';
      
      mockRedis.get.mockResolvedValue(JSON.stringify({
        token,
        userId,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        used: true,
      }));

      const result = await authService.validateCSRFToken(token, userId);
      expect(result).toBe(false);
    });

    test('should reject token for wrong user', async () => {
      const token = 'valid_csrf_token';
      const userId = 'user_123';
      
      mockRedis.get.mockResolvedValue(JSON.stringify({
        token,
        userId: 'different_user',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        used: false,
      }));

      const result = await authService.validateCSRFToken(token, userId);
      expect(result).toBe(false);
    });
  });

  describe('isTokenBlacklisted', () => {
    test('should return true for blacklisted token', async () => {
      const token = 'blacklisted_token';
      mockRedis.exists.mockResolvedValue(1);

      const result = await authService.isTokenBlacklisted(token);
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(`blacklist:token:blacklisted_token`);
    });

    test('should return false for non-blacklisted token', async () => {
      const token = 'valid_token';
      mockRedis.exists.mockResolvedValue(0);

      const result = await authService.isTokenBlacklisted(token);
      expect(result).toBe(false);
      expect(mockRedis.exists).toHaveBeenCalledWith(`blacklist:token:valid_token`);
    });
  });

  describe('blacklistToken', () => {
    test('should blacklist a token', async () => {
      const token = 'token_to_blacklist';
      const expiresIn = 3600;
      mockRedis.setex.mockResolvedValue('OK');

      await authService.blacklistToken(token, expiresIn);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `blacklist:token:token_to_blacklist`,
        expiresIn,
        '1'
      );
    });

    test('should use default expiration if not provided', async () => {
      const token = 'token_to_blacklist';
      mockRedis.setex.mockResolvedValue('OK');

      await authService.blacklistToken(token);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `blacklist:token:token_to_blacklist`,
        86400, // 24 hours default
        '1'
      );
    });
  });

  describe('generateCSRFToken', () => {
    test('should generate a CSRF token for user', async () => {
      const userId = 'user_123';
      mockRedis.setex.mockResolvedValue('OK');

      const token = await authService.generateCSRFToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    test('should store CSRF token in Redis', async () => {
      const userId = 'user_123';
      mockRedis.setex.mockResolvedValue('OK');

      const token = await authService.generateCSRFToken(userId);
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('csrf:'),
        3600, // 1 hour
        expect.stringContaining('"userId":"user_123"')
      );
    });
  });

  describe('getDeviceFingerprint', () => {
    test('should generate consistent fingerprint for same device info', () => {
      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        platform: 'Web',
      };

      const fingerprint1 = authService.getDeviceFingerprint(deviceInfo);
      const fingerprint2 = authService.getDeviceFingerprint(deviceInfo);

      expect(fingerprint1).toBe(fingerprint2);
      expect(typeof fingerprint1).toBe('string');
    });

    test('should generate different fingerprints for different devices', () => {
      const device1 = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const device2 = {
        userAgent: 'Chrome/91.0',
        ipAddress: '192.168.1.2',
      };

      const fingerprint1 = authService.getDeviceFingerprint(device1);
      const fingerprint2 = authService.getDeviceFingerprint(device2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });
});