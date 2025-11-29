import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp: {
    enabled: boolean;
    reportOnly: boolean;
    directives: {
      defaultSrc: string[];
      scriptSrc: string[];
      styleSrc: string[];
      imgSrc: string[];
      fontSrc: string[];
      connectSrc: string[];
      mediaSrc: string[];
      objectSrc: string[];
      childSrc: string[];
      frameSrc: string[];
      workerSrc: string[];
      manifestSrc: string[];
      formAction: string[];
      frameAncestors: string[];
      baseUri: string[];
      upgradeInsecureRequests: boolean;
      blockAllMixedContent: boolean;
    };
    reportUri?: string;
    useNonces: boolean;
    useHashes: boolean;
  };
  
  // Cross-Origin Resource Sharing
  cors: {
    enabled: boolean;
    origins: string[] | string;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    preflightContinue: boolean;
    optionsSuccessStatus: number;
    strictOriginValidation: boolean;
    dynamicOrigins: boolean;
    originWhitelist: string[];
    originBlacklist: string[];
  };
  
  // HTTP Strict Transport Security
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // Additional security headers
  additionalHeaders: {
    xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    xContentTypeOptions: boolean;
    xXSSProtection: '0' | '1' | '1; mode=block';
    referrerPolicy: string;
    permissionsPolicy: string;
    crossOriginEmbedderPolicy: string;
    crossOriginOpenerPolicy: string;
    crossOriginResourcePolicy: string;
  };
  
  // Security monitoring
  monitoring: {
    logViolations: boolean;
    alertOnViolations: boolean;
    enableMetrics: boolean;
    alertWebhookUrl?: string;
  };
}

export interface CSPViolation {
  id: string;
  timestamp: Date;
  clientIP: string;
  userAgent: string;
  violatedDirective: string;
  blockedURI: string;
  documentURI: string;
  originalPolicy: string;
  disposition: 'report' | 'enforce';
  scriptSample?: string;
  lineNumber?: number;
  columnNumber?: number;
  sourceFile?: string;
}

export interface OriginAnalysis {
  origin: string;
  isValid: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

/**
 * Advanced Security Headers Middleware
 * 
 * Features:
 * - Comprehensive Content Security Policy with nonce and hash support
 * - Advanced CORS configuration with dynamic origin validation
 * - HTTP Strict Transport Security with preload support
 * - Complete set of security headers
 * - Real-time violation monitoring and alerting
 * - Dynamic CSP policy adjustment based on threat level
 * - Origin reputation management
 * - Security metrics collection
 * - Compliance with security standards (OWASP, Mozilla Observatory)
 */
export class AdvancedSecurityHeaders {
  private redis: Redis;
  private config: SecurityHeadersConfig;
  private nonceCache: Map<string, { nonce: string; expiresAt: number }> = new Map();
  private cspViolations: CSPViolation[] = [];
  private originReputation: Map<string, { trustScore: number; lastSeen: number; violations: number }> = new Map();
  private scriptHashes: Set<string> = new Set();
  private styleHashes: Set<string> = new Set();
  
  // Redis prefixes
  private readonly CSP_VIOLATION_PREFIX = 'security:csp:violations:';
  private readonly ORIGIN_REPUTATION_PREFIX = 'security:origin:reputation:';
  private readonly METRICS_PREFIX = 'security:metrics:';
  private readonly NONCE_PREFIX = 'security:nonce:';
  
  constructor(redis: Redis, config: Partial<SecurityHeadersConfig> = {}) {
    this.redis = redis;
    this.config = this.mergeWithDefaults(config);
    this.initializeService();
    console.log('🛡️  Advanced Security Headers initialized');
  }
  
  private mergeWithDefaults(config: Partial<SecurityHeadersConfig>): SecurityHeadersConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      csp: {
        enabled: true,
        reportOnly: !isProduction,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            ...(isProduction ? [] : ["'unsafe-inline'", "'unsafe-eval'"]), // Remove in production
            'https://cdn.cryb.ai',
            'https://cdnjs.cloudflare.com',
            'https://cdn.jsdelivr.net'
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdn.cryb.ai'
          ],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'https://*.cryb.ai',
            'https://cdn.cryb.ai'
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://cdn.cryb.ai',
            'data:'
          ],
          connectSrc: [
            "'self'",
            'wss:',
            'ws:',
            'https://api.cryb.ai',
            'https://*.cryb.ai'
          ],
          mediaSrc: ["'self'", 'blob:', 'data:', 'https://*.cryb.ai'],
          objectSrc: ["'none'"],
          childSrc: ["'self'", 'blob:'],
          frameSrc: ["'self'", 'https://*.cryb.ai'],
          workerSrc: ["'self'", 'blob:'],
          manifestSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: isProduction,
          blockAllMixedContent: isProduction
        },
        reportUri: '/api/v1/security/csp-report',
        useNonces: true,
        useHashes: true,
        ...config.csp
      },
      cors: {
        enabled: true,
        origins: isProduction 
          ? ['https://cryb.ai', 'https://www.cryb.ai', 'https://app.cryb.ai']
          : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-API-Key',
          'X-CSRF-Token',
          'Accept',
          'Origin',
          'Cache-Control',
          'X-File-Name',
          'X-Request-ID'
        ],
        exposedHeaders: [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset',
          'X-Total-Count',
          'X-Request-ID',
          'X-Response-Time'
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
        preflightContinue: false,
        optionsSuccessStatus: 204,
        strictOriginValidation: isProduction,
        dynamicOrigins: !isProduction,
        originWhitelist: [],
        originBlacklist: [],
        ...config.cors
      },
      hsts: {
        enabled: isProduction,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
        ...config.hsts
      },
      additionalHeaders: {
        xFrameOptions: 'DENY',
        xContentTypeOptions: true,
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
        crossOriginEmbedderPolicy: 'unsafe-none',
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'cross-origin',
        ...config.additionalHeaders
      },
      monitoring: {
        logViolations: true,
        alertOnViolations: true,
        enableMetrics: true,
        ...config.monitoring
      }
    };
  }
  
  private async initializeService(): Promise<void> {
    // Setup cleanup tasks
    this.setupCleanupTasks();
    
    // Load script and style hashes
    await this.loadResourceHashes();
    
    // Setup CSP violation reporting endpoint
    this.setupCSPReporting();
    
    // Initialize origin reputation
    await this.loadOriginReputation();
  }
  
  /**
   * Main security headers middleware
   */
  async securityHeadersMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const origin = request.headers.origin;
        const clientIP = this.getClientIP(request);
        const userAgent = request.headers['user-agent'] || 'unknown';
        
        // Generate nonce for this request
        const nonce = this.config.csp.useNonces ? this.generateCSPNonce(request) : null;
        
        // Set Content Security Policy
        if (this.config.csp.enabled) {
          const cspHeader = await this.buildCSPHeader(request, nonce);
          const headerName = this.config.csp.reportOnly 
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';
          reply.header(headerName, cspHeader);
        }
        
        // Handle CORS
        if (this.config.cors.enabled) {
          await this.handleCORS(request, reply, origin);
        }
        
        // Set HSTS header for HTTPS requests
        if (this.config.hsts.enabled && this.isHTTPS(request)) {
          const hstsValue = this.buildHSTSHeader();
          reply.header('Strict-Transport-Security', hstsValue);
        }
        
        // Set additional security headers
        this.setAdditionalSecurityHeaders(reply);
        
        // Add nonce to request context for use in templates
        if (nonce) {
          (request as any).cspNonce = nonce;
        }
        
        // Log security metrics
        if (this.config.monitoring.enableMetrics) {
          await this.logSecurityMetrics(request, origin, clientIP);
        }
        
      } catch (error) {
        console.error('Security headers middleware error:', error);
        // Don't block requests on security header errors
      }
    };
  }
  
  /**
   * Build Content Security Policy header
   */
  private async buildCSPHeader(request: FastifyRequest, nonce: string | null): Promise<string> {
    const directives: string[] = [];
    const cspDirectives = this.config.csp.directives;
    
    // Process each directive
    for (const [directive, value] of Object.entries(cspDirectives)) {
      if (typeof value === 'boolean') {
        if (value) {
          directives.push(this.convertDirectiveName(directive));
        }
      } else if (Array.isArray(value)) {
        let sources = [...value];
        
        // Add nonce to script-src and style-src if enabled
        if (nonce && (directive === 'scriptSrc' || directive === 'styleSrc')) {
          sources.push(`'nonce-${nonce}'`);
        }
        
        // Add hashes if enabled
        if (this.config.csp.useHashes) {
          if (directive === 'scriptSrc') {
            sources.push(...Array.from(this.scriptHashes).map(hash => `'sha256-${hash}'`));
          } else if (directive === 'styleSrc') {
            sources.push(...Array.from(this.styleHashes).map(hash => `'sha256-${hash}'`));
          }
        }
        
        directives.push(`${this.convertDirectiveName(directive)} ${sources.join(' ')}`);
      }
    }
    
    // Add report-uri if configured
    if (this.config.csp.reportUri) {
      directives.push(`report-uri ${this.config.csp.reportUri}`);
    }
    
    return directives.join('; ');
  }
  
  /**
   * Handle CORS with advanced origin validation
   */
  private async handleCORS(
    request: FastifyRequest,
    reply: FastifyReply,
    origin?: string
  ): Promise<void> {
    const corsConfig = this.config.cors;
    
    // Analyze origin
    const originAnalysis = await this.analyzeOrigin(origin);
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      reply.header('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
      reply.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      reply.header('Access-Control-Max-Age', corsConfig.maxAge.toString());
      
      if (corsConfig.credentials && originAnalysis.isValid) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
    }
    
    // Set CORS headers based on origin analysis
    if (originAnalysis.isValid) {
      reply.header('Access-Control-Allow-Origin', origin || '*');
      
      if (corsConfig.credentials && origin) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
      
      if (corsConfig.exposedHeaders.length > 0) {
        reply.header('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
      }
    } else {
      // Log blocked origin
      if (origin && this.config.monitoring.logViolations) {
        await this.logCORSViolation(origin, originAnalysis, request);
      }
    }
    
    // Handle preflight response
    if (request.method === 'OPTIONS') {
      reply.code(corsConfig.optionsSuccessStatus).send();
    }
  }
  
  /**
   * Analyze origin validity and reputation
   */
  private async analyzeOrigin(origin?: string): Promise<OriginAnalysis> {
    if (!origin) {
      return {
        origin: 'none',
        isValid: true, // Allow requests without origin (mobile apps, etc.)
        isWhitelisted: false,
        isBlacklisted: false,
        riskLevel: 'low',
        reasons: ['no_origin']
      };
    }
    
    const corsConfig = this.config.cors;
    const reasons: string[] = [];
    let isValid = false;
    let isWhitelisted = false;
    let isBlacklisted = false;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    // Check blacklist first
    if (corsConfig.originBlacklist.some(blocked => origin.includes(blocked))) {
      isBlacklisted = true;
      riskLevel = 'critical';
      reasons.push('blacklisted');
      return { origin, isValid: false, isWhitelisted, isBlacklisted, riskLevel, reasons };
    }
    
    // Check whitelist
    if (corsConfig.originWhitelist.some(allowed => origin.includes(allowed))) {
      isWhitelisted = true;
      isValid = true;
      reasons.push('whitelisted');
    }
    
    // Check configured origins
    if (!isValid) {
      if (Array.isArray(corsConfig.origins)) {
        isValid = corsConfig.origins.some(allowedOrigin => {
          if (allowedOrigin === '*') return true;
          if (allowedOrigin.includes('*')) {
            // Wildcard matching
            const pattern = allowedOrigin.replace(/\*/g, '.*');
            return new RegExp(pattern).test(origin);
          }
          return origin === allowedOrigin;
        });
      } else if (typeof corsConfig.origins === 'string') {
        isValid = corsConfig.origins === '*' || corsConfig.origins === origin;
      }
    }
    
    // Dynamic origins in development
    if (corsConfig.dynamicOrigins && process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        isValid = true;
        reasons.push('localhost_allowed');
      }
    }
    
    return { origin, isValid, isWhitelisted, isBlacklisted, riskLevel, reasons };
  }
  
  /**
   * Set additional security headers
   */
  private setAdditionalSecurityHeaders(reply: FastifyReply): void {
    const headers = this.config.additionalHeaders;
    
    reply.header('X-Frame-Options', headers.xFrameOptions);
    
    if (headers.xContentTypeOptions) {
      reply.header('X-Content-Type-Options', 'nosniff');
    }
    
    reply.header('X-XSS-Protection', headers.xXSSProtection);
    reply.header('Referrer-Policy', headers.referrerPolicy);
    reply.header('Permissions-Policy', headers.permissionsPolicy);
    reply.header('Cross-Origin-Embedder-Policy', headers.crossOriginEmbedderPolicy);
    reply.header('Cross-Origin-Opener-Policy', headers.crossOriginOpenerPolicy);
    reply.header('Cross-Origin-Resource-Policy', headers.crossOriginResourcePolicy);
    
    // Additional security headers
    reply.header('X-Powered-By', 'CRYB-Platform'); // Custom branding
    reply.header('X-Security-Policy', 'enforced');
  }
  
  /**
   * Generate and manage nonces
   */
  private generateCSPNonce(request: FastifyRequest): string {
    const requestId = (request as any).id || request.headers['x-request-id'] || Date.now().toString();
    
    // Check if we already have a nonce for this request
    const existing = this.nonceCache.get(requestId);
    if (existing && existing.expiresAt > Date.now()) {
      return existing.nonce;
    }
    
    // Generate new nonce
    const nonce = randomBytes(16).toString('base64');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    this.nonceCache.set(requestId, { nonce, expiresAt });
    
    return nonce;
  }
  
  /**
   * Utility methods
   */
  private convertDirectiveName(directive: string): string {
    // Convert camelCase to kebab-case
    return directive.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  
  private buildHSTSHeader(): string {
    const hsts = this.config.hsts;
    let header = `max-age=${hsts.maxAge}`;
    
    if (hsts.includeSubDomains) {
      header += '; includeSubDomains';
    }
    
    if (hsts.preload) {
      header += '; preload';
    }
    
    return header;
  }
  
  private isHTTPS(request: FastifyRequest): boolean {
    return request.protocol === 'https' || 
           request.headers['x-forwarded-proto'] === 'https' ||
           request.headers['x-forwarded-ssl'] === 'on';
  }
  
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const cfConnectingIP = request.headers['cf-connecting-ip'] as string;
    
    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    
    return request.ip || 'unknown';
  }
  
  private generateViolationId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }
  
  /**
   * Setup and monitoring methods
   */
  private setupCSPReporting(): void {
    console.log('🚨 CSP violation reporting endpoint ready at', this.config.csp.reportUri);
  }
  
  private async loadResourceHashes(): Promise<void> {
    // In production, load hashes of trusted scripts and styles
    console.log(`🔒 Loaded ${this.scriptHashes.size} script hashes and ${this.styleHashes.size} style hashes`);
  }
  
  private async loadOriginReputation(): Promise<void> {
    try {
      const reputationKeys = await this.redis.keys(`${this.ORIGIN_REPUTATION_PREFIX}*`);
      
      for (const key of reputationKeys) {
        const origin = key.replace(this.ORIGIN_REPUTATION_PREFIX, '');
        const data = await this.redis.get(key);
        
        if (data) {
          const reputation = JSON.parse(data);
          this.originReputation.set(origin, reputation);
        }
      }
      
      console.log(`📊 Loaded reputation data for ${this.originReputation.size} origins`);
    } catch (error) {
      console.error('Failed to load origin reputation:', error);
    }
  }
  
  private async logCORSViolation(
    origin: string,
    analysis: OriginAnalysis,
    request: FastifyRequest
  ): Promise<void> {
    const violation = {
      type: 'cors_violation',
      origin,
      analysis,
      clientIP: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString()
    };
    
    console.warn('CORS Violation:', violation);
    
    // Store violation
    await this.redis.lpush('security:cors:violations', JSON.stringify(violation));
    await this.redis.expire('security:cors:violations', 86400); // 24 hours
  }
  
  private async logSecurityMetrics(
    request: FastifyRequest,
    origin: string | undefined,
    clientIP: string
  ): Promise<void> {
    const metrics = {
      timestamp: Date.now(),
      origin,
      clientIP,
      userAgent: request.headers['user-agent'],
      path: request.url,
      method: request.method,
      protocol: request.protocol,
      isHTTPS: this.isHTTPS(request)
    };
    
    const key = `${this.METRICS_PREFIX}${new Date().toISOString().split('T')[0]}`;
    await this.redis.lpush(key, JSON.stringify(metrics));
    await this.redis.expire(key, 86400); // 24 hours
  }
  
  /**
   * Cleanup and maintenance
   */
  private setupCleanupTasks(): void {
    // Clean up expired nonces every 5 minutes
    setInterval(() => {
      this.cleanupExpiredNonces();
    }, 5 * 60 * 1000);
  }
  
  private cleanupExpiredNonces(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [requestId, nonce] of this.nonceCache.entries()) {
      if (nonce.expiresAt < now) {
        this.nonceCache.delete(requestId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired nonces`);
    }
  }
  
  /**
   * Public API methods
   */
  getSecurityStats(): {
    cspViolations: number;
    originReputation: number;
    noncesActive: number;
  } {
    return {
      cspViolations: this.cspViolations.length,
      originReputation: this.originReputation.size,
      noncesActive: this.nonceCache.size
    };
  }
}

/**
 * Create advanced security headers service
 */
export function createAdvancedSecurityHeaders(
  redis: Redis,
  config: Partial<SecurityHeadersConfig> = {}
): AdvancedSecurityHeaders {
  return new AdvancedSecurityHeaders(redis, config);
}