import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, randomBytes } from 'crypto';

export interface MediaSecurityConfig {
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    headers: string[];
    maxAge?: number;
  };
  csp: {
    directives: Record<string, string[]>;
    reportUri?: string;
    upgradeInsecureRequests?: boolean;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  hotlinkProtection: {
    enabled: boolean;
    allowedDomains: string[];
    redirectUrl?: string;
  };
  tokenAuth: {
    enabled: boolean;
    secretKey: string;
    expirationTime: number;
  };
  fileValidation: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    virusScanning: boolean;
    contentTypeValidation: boolean;
  };
}

export interface SecurityToken {
  url: string;
  expiresAt: number;
  signature: string;
  nonce: string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

/**
 * Media Security Middleware
 * 
 * Provides comprehensive security for media operations including:
 * - CORS configuration with dynamic origin validation
 * - Content Security Policy headers
 * - Rate limiting with sliding window
 * - Hotlink protection
 * - Token-based authentication for sensitive operations
 * - File validation and virus scanning integration
 * - Request sanitization and validation
 * - Security headers (HSTS, X-Frame-Options, etc.)
 */
export class MediaSecurityMiddleware {
  private config: MediaSecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private cspNonces: Map<string, string> = new Map();

  constructor(config: MediaSecurityConfig) {
    this.config = config;
    this.setupCleanupTasks();
  }

  /**
   * Main security middleware handler
   */
  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Apply security headers
      this.applySecurityHeaders(request, reply);

      // Handle CORS preflight and regular requests
      await this.handleCORS(request, reply);

      // Rate limiting
      await this.checkRateLimit(request, reply);

      // Hotlink protection for media requests
      if (this.isMediaRequest(request)) {
        await this.checkHotlinkProtection(request, reply);
        
        // Token authentication for protected media
        await this.validateMediaToken(request, reply);
      }

      // File upload security
      if (this.isUploadRequest(request)) {
        await this.validateUploadSecurity(request, reply);
      }

    } catch (error) {
      console.error('Security middleware error:', error);
      reply.code(403).send({
        error: 'Access Denied',
        message: 'Security validation failed'
      });
    }
  }

  /**
   * Generate secure token for media access
   */
  generateSecureToken(
    url: string,
    clientIP: string,
    userAgent: string,
    expirationMinutes: number = 60
  ): SecurityToken {
    if (!this.config.tokenAuth.enabled) {
      throw new Error('Token authentication is not enabled');
    }

    const nonce = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    
    const payload = `${url}|${clientIP}|${userAgent}|${expiresAt}|${nonce}`;
    const signature = createHash('hmac-sha256')
      .setKey(this.config.tokenAuth.secretKey)
      .update(payload)
      .digest('hex');

    return {
      url,
      expiresAt,
      signature,
      nonce
    };
  }

  /**
   * Validate secure token
   */
  validateSecureToken(
    token: SecurityToken,
    url: string,
    clientIP: string,
    userAgent: string
  ): boolean {
    try {
      // Check expiration
      if (Date.now() > token.expiresAt) {
        return false;
      }

      // Check URL match
      if (token.url !== url) {
        return false;
      }

      // Verify signature
      const payload = `${url}|${clientIP}|${userAgent}|${token.expiresAt}|${token.nonce}`;
      const expectedSignature = createHash('hmac-sha256')
        .setKey(this.config.tokenAuth.secretKey)
        .update(payload)
        .digest('hex');

      return token.signature === expectedSignature;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Create CSP nonce for inline scripts
   */
  createCSPNonce(): string {
    const nonce = randomBytes(16).toString('base64');
    return nonce;
  }

  /**
   * Validate file upload security
   */
  async validateFileUpload(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // File size validation
    if (buffer.length > this.config.fileValidation.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.formatBytes(this.config.fileValidation.maxFileSize)}`);
    }

    // MIME type validation
    if (!this.config.fileValidation.allowedMimeTypes.includes(mimeType)) {
      errors.push(`File type ${mimeType} is not allowed`);
    }

    // Content type validation against file header
    if (this.config.fileValidation.contentTypeValidation) {
      const actualMimeType = this.detectMimeTypeFromHeader(buffer);
      if (actualMimeType && actualMimeType !== mimeType) {
        errors.push(`Declared MIME type ${mimeType} does not match file content ${actualMimeType}`);
      }
    }

    // Filename validation
    if (this.containsSuspiciousPatterns(filename)) {
      errors.push('Filename contains suspicious patterns');
    }

    // Virus scanning
    if (this.config.fileValidation.virusScanning) {
      const scanResult = await this.performVirusScan(buffer);
      if (!scanResult.clean) {
        errors.push(`File failed virus scan: ${scanResult.threats?.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private applySecurityHeaders(request: FastifyRequest, reply: FastifyReply): void {
    // Basic security headers
    reply.headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    });

    // Content Security Policy
    const cspNonce = this.createCSPNonce();
    const csp = this.buildCSP(cspNonce);
    reply.header('Content-Security-Policy', csp);

    // Store nonce for use in response
    this.cspNonces.set(request.id, cspNonce);

    // Remove server information
    reply.removeHeader('X-Powered-By');
    reply.removeHeader('Server');
  }

  private async handleCORS(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const origin = request.headers.origin as string;
    const method = request.method;

    // Check if origin is allowed
    const isAllowedOrigin = this.isOriginAllowed(origin);

    if (method === 'OPTIONS') {
      // Handle preflight request
      if (isAllowedOrigin) {
        reply.headers({
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': this.config.cors.methods.join(', '),
          'Access-Control-Allow-Headers': this.config.cors.headers.join(', '),
          'Access-Control-Allow-Credentials': this.config.cors.credentials.toString(),
          'Access-Control-Max-Age': (this.config.cors.maxAge || 86400).toString()
        });
      }
      reply.code(204).send();
      return;
    }

    // Handle actual request
    if (isAllowedOrigin) {
      reply.headers({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': this.config.cors.credentials.toString(),
        'Vary': 'Origin'
      });
    }
  }

  private async checkRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const clientIdentifier = this.getClientIdentifier(request);
    const now = Date.now();
    const windowStart = now - this.config.rateLimiting.windowMs;

    let entry = this.rateLimitStore.get(clientIdentifier);

    if (!entry || entry.resetTime <= now) {
      // Create new or reset existing entry
      entry = {
        count: 0,
        resetTime: now + this.config.rateLimiting.windowMs,
        blocked: false
      };
      this.rateLimitStore.set(clientIdentifier, entry);
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.rateLimiting.maxRequests) {
      entry.blocked = true;
      
      reply.headers({
        'X-RateLimit-Limit': this.config.rateLimiting.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetTime.toString(),
        'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
      });

      throw new Error('Rate limit exceeded');
    }

    // Add rate limit headers
    reply.headers({
      'X-RateLimit-Limit': this.config.rateLimiting.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.rateLimiting.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': entry.resetTime.toString()
    });
  }

  private async checkHotlinkProtection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!this.config.hotlinkProtection.enabled) {
      return;
    }

    const referer = request.headers.referer as string;
    
    // Allow direct access (no referer)
    if (!referer) {
      return;
    }

    // Check if referer domain is allowed
    const refererDomain = this.extractDomain(referer);
    const isAllowed = this.config.hotlinkProtection.allowedDomains.some(domain => {
      return refererDomain === domain || refererDomain.endsWith('.' + domain);
    });

    if (!isAllowed) {
      if (this.config.hotlinkProtection.redirectUrl) {
        reply.redirect(302, this.config.hotlinkProtection.redirectUrl);
      } else {
        throw new Error('Hotlinking not allowed');
      }
    }
  }

  private async validateMediaToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!this.config.tokenAuth.enabled) {
      return;
    }

    // Check if this is a protected media request
    const isProtectedMedia = this.isProtectedMediaRequest(request);
    if (!isProtectedMedia) {
      return;
    }

    const tokenParam = request.query as any;
    if (!tokenParam.token) {
      throw new Error('Access token required for protected media');
    }

    try {
      const token: SecurityToken = JSON.parse(Buffer.from(tokenParam.token, 'base64').toString());
      const clientIP = this.getClientIP(request);
      const userAgent = request.headers['user-agent'] || '';
      const requestUrl = request.url;

      const isValid = this.validateSecureToken(token, requestUrl, clientIP, userAgent);
      if (!isValid) {
        throw new Error('Invalid or expired access token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('Invalid access token');
    }
  }

  private async validateUploadSecurity(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Validate Content-Type header
    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      throw new Error('Invalid content type for file upload');
    }

    // Check Content-Length
    const contentLength = parseInt(request.headers['content-length'] || '0');
    if (contentLength > this.config.fileValidation.maxFileSize) {
      throw new Error('Upload size exceeds maximum limit');
    }

    // Additional upload-specific validations can be added here
  }

  private isOriginAllowed(origin: string): boolean {
    if (!origin) {
      return false; // Reject requests without origin
    }

    // Check exact matches first
    if (this.config.cors.origins.includes(origin)) {
      return true;
    }

    // Check wildcard patterns
    return this.config.cors.origins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });
  }

  private buildCSP(nonce: string): string {
    const directives = { ...this.config.csp.directives };
    
    // Add nonce to script-src if it exists
    if (directives['script-src']) {
      directives['script-src'].push(`'nonce-${nonce}'`);
    }

    const cspParts = Object.entries(directives).map(([directive, values]) => {
      return `${directive} ${values.join(' ')}`;
    });

    let csp = cspParts.join('; ');

    if (this.config.csp.upgradeInsecureRequests) {
      csp += '; upgrade-insecure-requests';
    }

    if (this.config.csp.reportUri) {
      csp += `; report-uri ${this.config.csp.reportUri}`;
    }

    return csp;
  }

  private getClientIdentifier(request: FastifyRequest): string {
    // Combine IP and User-Agent for more accurate rate limiting
    const ip = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || '';
    return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
  }

  private getClientIP(request: FastifyRequest): string {
    // Check various headers for the real IP
    const possibleHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'true-client-ip'    // Akamai
    ];

    for (const header of possibleHeaders) {
      const value = request.headers[header] as string;
      if (value) {
        // Take the first IP if there are multiple
        return value.split(',')[0].trim();
      }
    }

    return request.ip || 'unknown';
  }

  private extractDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return '';
    }
  }

  private isMediaRequest(request: FastifyRequest): boolean {
    const mediaPatterns = [
      /\/media\//,
      /\/uploads\//,
      /\/cdn\//,
      /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mp3|wav|ogg|pdf)$/i
    ];

    return mediaPatterns.some(pattern => pattern.test(request.url));
  }

  private isProtectedMediaRequest(request: FastifyRequest): boolean {
    // Define patterns for protected media (e.g., private files, premium content)
    const protectedPatterns = [
      /\/private\//,
      /\/premium\//,
      /\/secure\//
    ];

    return protectedPatterns.some(pattern => pattern.test(request.url));
  }

  private isUploadRequest(request: FastifyRequest): boolean {
    return request.method === 'POST' && 
           (request.url.includes('/upload') || 
            request.headers['content-type']?.startsWith('multipart/form-data'));
  }

  private detectMimeTypeFromHeader(buffer: Buffer): string | null {
    // Common file signatures
    const signatures = [
      { signature: [0xFF, 0xD8, 0xFF], mimeType: 'image/jpeg' },
      { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mimeType: 'image/png' },
      { signature: [0x47, 0x49, 0x46, 0x38], mimeType: 'image/gif' },
      { signature: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' },
      { signature: [0x25, 0x50, 0x44, 0x46], mimeType: 'application/pdf' },
      { signature: [0x00, 0x00, 0x00], mimeType: 'video/mp4' }, // Simplified MP4 check
    ];

    for (const { signature, mimeType } of signatures) {
      if (this.matchesSignature(buffer, signature)) {
        return mimeType;
      }
    }

    return null;
  }

  private matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  private containsSuspiciousPatterns(filename: string): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Directory traversal
      /[<>:"\\|?*]/,    // Invalid filename characters
      /\.(exe|bat|com|cmd|scr|pif|vbs|js)$/i, // Executable extensions
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Reserved Windows names
      /^\./,            // Hidden files (starting with dot)
      /__.*__/          // Dunder patterns
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  private async performVirusScan(buffer: Buffer): Promise<{
    clean: boolean;
    threats?: string[];
  }> {
    // Placeholder virus scanning implementation
    // In production, integrate with ClamAV, VirusTotal, or similar
    
    const threats: string[] = [];

    // Check for EICAR test signature
    const eicarSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    if (buffer.includes(Buffer.from(eicarSignature))) {
      threats.push('EICAR test virus');
    }

    // Additional basic checks can be added here

    return {
      clean: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private setupCleanupTasks(): void {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 5 * 60 * 1000);

    // Clean up CSP nonces every hour
    setInterval(() => {
      this.cleanupCSPNonces();
    }, 60 * 60 * 1000);
  }

  private cleanupRateLimitStore(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  private cleanupCSPNonces(): void {
    // CSP nonces are short-lived, clear all after an hour
    const clearedCount = this.cspNonces.size;
    this.cspNonces.clear();
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleaned up ${clearedCount} CSP nonces`);
    }
  }

  // Get current security statistics
  getSecurityStats(): {
    rateLimitEntries: number;
    cspNonces: number;
    blockedRequests: number;
  } {
    const blockedRequests = Array.from(this.rateLimitStore.values())
      .filter(entry => entry.blocked).length;

    return {
      rateLimitEntries: this.rateLimitStore.size,
      cspNonces: this.cspNonces.size,
      blockedRequests
    };
  }
}

/**
 * Default security configuration
 */
export const defaultMediaSecurityConfig: MediaSecurityConfig = {
  cors: {
    origins: ['http://localhost:3000', 'https://*.cryb.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    maxAge: 86400
  },
  csp: {
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'media-src': ["'self'", 'https:'],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", 'https://api.cryb.app'],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"]
    },
    upgradeInsecureRequests: true
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  hotlinkProtection: {
    enabled: true,
    allowedDomains: ['cryb.app', 'localhost'],
    redirectUrl: 'https://cryb.app/hotlink-blocked'
  },
  tokenAuth: {
    enabled: true,
    secretKey: process.env.MEDIA_TOKEN_SECRET || 'default-secret-key-change-in-production',
    expirationTime: 3600000 // 1 hour in milliseconds
  },
  fileValidation: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain'
    ],
    virusScanning: true,
    contentTypeValidation: true
  }
};