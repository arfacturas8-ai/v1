import {
  RateLimiter,
  CSRFProtection,
  sanitizeInput,
  escapeSQL,
  detectXSS,
  generateSecureToken,
  hashPassword,
  RateLimitError
} from '../security';

describe('Security Middleware', () => {
  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 60000);

      for (let i = 0; i < 5; i++) {
        const result = limiter.check('user1');
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(3, 60000);

      for (let i = 0; i < 3; i++) {
        limiter.check('user2');
      }

      const result = limiter.check('user2');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset requests for specific identifier', () => {
      const limiter = new RateLimiter(2, 60000);

      limiter.check('user3');
      limiter.check('user3');
      limiter.reset('user3');

      const result = limiter.check('user3');
      expect(result.allowed).toBe(true);
    });

    it('should cleanup old requests', () => {
      const limiter = new RateLimiter(5, 100);

      limiter.check('user4');

      setTimeout(() => {
        limiter.cleanup();
        const result = limiter.check('user4');
        expect(result.remaining).toBe(4);
      }, 150);
    });
  });

  describe('CSRFProtection', () => {
    it('should generate unique tokens', () => {
      const csrf = new CSRFProtection();

      const token1 = csrf.generateToken();
      const token2 = csrf.generateToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64);
    });

    it('should validate correct tokens', () => {
      const csrf = new CSRFProtection();
      const token = csrf.generateToken();

      expect(csrf.validateToken(token)).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const csrf = new CSRFProtection();

      expect(csrf.validateToken('invalid-token')).toBe(false);
    });

    it('should reject reused tokens', () => {
      const csrf = new CSRFProtection();
      const token = csrf.generateToken();

      csrf.validateToken(token);
      expect(csrf.validateToken(token)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle quotes', () => {
      const input = "He said 'hello' and she said \"hi\"";
      const result = sanitizeInput(input);

      expect(result).toContain('&#x27;');
      expect(result).toContain('&quot;');
    });

    it('should return non-string inputs unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('escapeSQL', () => {
    it('should escape single quotes', () => {
      const input = "O'Reilly";
      const result = escapeSQL(input);

      expect(result).toBe("O''Reilly");
    });

    it('should escape backslashes', () => {
      const input = 'C:\\Users\\test';
      const result = escapeSQL(input);

      expect(result).toContain('\\\\');
    });

    it('should handle non-string inputs', () => {
      expect(escapeSQL(123)).toBe(123);
    });
  });

  describe('detectXSS', () => {
    it('should detect script tags', () => {
      expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
      expect(detectXSS('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(detectXSS('javascript:alert("xss")')).toBe(true);
      expect(detectXSS('JAVASCRIPT:alert("xss")')).toBe(true);
    });

    it('should detect inline event handlers', () => {
      expect(detectXSS('<div onclick="alert(\'xss\')">test</div>')).toBe(true);
      expect(detectXSS('<img onload="alert(\'xss\')" />')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('should return false for safe input', () => {
      expect(detectXSS('<p>Hello world</p>')).toBe(false);
      expect(detectXSS('Just plain text')).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(detectXSS(123)).toBe(false);
      expect(detectXSS(null)).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(16);

      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate hex characters only', () => {
      const token = generateSecureToken();

      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('should hash password with salt', async () => {
      const password = 'myPassword123!';
      const salt = 'randomSalt';

      const hash = await hashPassword(password, salt);

      expect(hash).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('should generate different hashes for different salts', async () => {
      const password = 'myPassword123!';

      const hash1 = await hashPassword(password, 'salt1');
      const hash2 = await hashPassword(password, 'salt2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash for same password and salt', async () => {
      const password = 'myPassword123!';
      const salt = 'fixedSalt';

      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, salt);

      expect(hash1).toBe(hash2);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry time', () => {
      const error = new RateLimitError(5000);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Too many requests');
      expect(error.name).toBe('RateLimitError');
      expect(error.retryAfter).toBe(5000);
      expect(error.status).toBe(429);
    });
  });
});
