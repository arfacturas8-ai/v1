/**
 * Security Middleware
 * Rate limiting, CSRF protection, and security headers
 */

// Simple in-memory rate limiter
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  check(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        retryAfter: this.windowMs - (now - recentRequests[0])
      };
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length
    };
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }

  cleanup() {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Global rate limiters
export const globalLimiter = new RateLimiter(100, 60000); // 100 req/min
export const authLimiter = new RateLimiter(5, 300000); // 5 req/5min
export const apiLimiter = new RateLimiter(50, 60000); // 50 req/min

// Cleanup old entries every minute
setInterval(() => {
  globalLimiter.cleanup();
  authLimiter.cleanup();
  apiLimiter.cleanup();
}, 60000);

/**
 * CSRF Token Generator
 */
export class CSRFProtection {
  constructor() {
    this.tokens = new Map();
  }

  generateToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiry = Date.now() + 3600000; // 1 hour
    this.tokens.set(token, expiry);

    return token;
  }

  validateToken(token) {
    const expiry = this.tokens.get(token);

    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.tokens.delete(token);
      return false;
    }

    this.tokens.delete(token); // One-time use
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [token, expiry] of this.tokens.entries()) {
      if (now > expiry) {
        this.tokens.delete(token);
      }
    }
  }
}

export const csrfProtection = new CSRFProtection();

// Cleanup expired CSRF tokens every 5 minutes
setInterval(() => csrfProtection.cleanup(), 300000);

/**
 * Security Headers
 */
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss: ws: https://api.cryb.ai https://*.alchemy.com https://*.infura.io",
    "media-src 'self' blob:",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),

  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // HSTS for HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

/**
 * Apply security headers to fetch requests
 */
export const applySecurityHeaders = (headers = {}) => {
  return {
    ...headers,
    ...securityHeaders
  };
};

/**
 * Input Sanitization
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * SQL Injection Prevention (for parameterized queries)
 */
export const escapeSQL = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0');
};

/**
 * Check for common XSS patterns
 */
export const detectXSS = (input) => {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Secure Random String Generator
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Password Hashing (Client-side pre-hash before sending to server)
 */
export const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Content Security Policy Nonce Generator
 */
export const generateCSPNonce = () => {
  return generateSecureToken(16);
};

/**
 * Rate Limit Error
 */
export class RateLimitError extends Error {
  constructor(retryAfter) {
    super('Too many requests');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.status = 429;
  }
}

/**
 * Apply rate limiting to a function
 */
export const withRateLimit = (limiter, identifier) => {
  return async (fn) => {
    const result = limiter.check(identifier);

    if (!result.allowed) {
      throw new RateLimitError(result.retryAfter);
    }

    return await fn();
  };
};

export default {
  RateLimiter,
  globalLimiter,
  authLimiter,
  apiLimiter,
  CSRFProtection,
  csrfProtection,
  securityHeaders,
  applySecurityHeaders,
  sanitizeInput,
  escapeSQL,
  detectXSS,
  generateSecureToken,
  hashPassword,
  generateCSPNonce,
  RateLimitError,
  withRateLimit
};
