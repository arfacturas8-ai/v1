import { FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { AppError } from './errorHandler';

// Security configuration
export interface SecurityConfig {
  csrf: {
    enabled: boolean;
    cookieName: string;
    headerName: string;
    saltLength: number;
    sessionKey: string;
    ignoredMethods: string[];
  };
  
  contentSecurity: {
    enableCSP: boolean;
    enableXSSProtection: boolean;
    enableFrameOptions: boolean;
    enableContentTypeOptions: boolean;
    enableReferrerPolicy: boolean;
  };
  
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  
  inputSanitization: {
    enabled: boolean;
    stripHtml: boolean;
    preventSqlInjection: boolean;
    preventXss: boolean;
    maxInputLength: number;
  };
  
  authentication: {
    requireSecureCookies: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csrf: {
    enabled: true,
    cookieName: '__Host-csrf-token',
    headerName: 'x-csrf-token',
    saltLength: 8,
    sessionKey: 'csrfSecret',
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
  },
  
  contentSecurity: {
    enableCSP: true,
    enableXSSProtection: true,
    enableFrameOptions: true,
    enableContentTypeOptions: true,
    enableReferrerPolicy: true
  },
  
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  inputSanitization: {
    enabled: true,
    stripHtml: true,
    preventSqlInjection: true,
    preventXss: true,
    maxInputLength: 10000
  },
  
  authentication: {
    requireSecureCookies: process.env.NODE_ENV === 'production',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  }
};

export class ComprehensiveSecurityService {
  private config: SecurityConfig;
  private csrfSecrets: Map<string, { secret: string; expiresAt: number }> = new Map();
  
  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    
    // Cleanup expired CSRF secrets every hour
    setInterval(() => this.cleanupExpiredSecrets(), 60 * 60 * 1000);
  }
  
  private cleanupExpiredSecrets() {
    const now = Date.now();
    for (const [key, value] of this.csrfSecrets) {
      if (value.expiresAt < now) {
        this.csrfSecrets.delete(key);
      }
    }
  }
  
  // CSRF Protection
  generateCSRFToken(sessionId?: string): { token: string; secret: string } {
    const secret = randomBytes(this.config.csrf.saltLength).toString('hex');
    const salt = randomBytes(this.config.csrf.saltLength).toString('hex');
    const token = this.createCSRFToken(secret, salt);
    
    // Store secret with expiration (24 hours)
    const key = sessionId || 'anonymous';
    this.csrfSecrets.set(key, {
      secret,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });
    
    return { token, secret };
  }
  
  private createCSRFToken(secret: string, salt: string): string {
    const hash = createHmac('sha256', secret).update(salt).digest('hex');
    return `${salt}.${hash}`;
  }
  
  private verifyCSRFToken(token: string, secret: string): boolean {
    try {
      const [salt, hash] = token.split('.');
      if (!salt || !hash) return false;
      
      const expectedHash = createHmac('sha256', secret).update(salt).digest('hex');
      const providedHashBuffer = Buffer.from(hash, 'hex');
      const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
      
      return providedHashBuffer.length === expectedHashBuffer.length &&
             timingSafeEqual(providedHashBuffer, expectedHashBuffer);
    } catch (error) {
      return false;
    }
  }
  
  // Content Security Headers
  setSecurityHeaders(reply: FastifyReply): void {
    const { contentSecurity } = this.config;
    
    if (contentSecurity.enableCSP) {
      reply.header('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' wss: https:",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; '));
    }
    
    if (contentSecurity.enableXSSProtection) {
      reply.header('X-XSS-Protection', '1; mode=block');
    }
    
    if (contentSecurity.enableFrameOptions) {
      reply.header('X-Frame-Options', 'DENY');
    }
    
    if (contentSecurity.enableContentTypeOptions) {
      reply.header('X-Content-Type-Options', 'nosniff');
    }
    
    if (contentSecurity.enableReferrerPolicy) {
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    // Additional security headers
    reply.header('X-Permitted-Cross-Domain-Policies', 'none');
    reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Remove potentially revealing headers
    reply.removeHeader('X-Powered-By');
    reply.removeHeader('Server');
  }
  
  // Input Sanitization
  sanitizeInput(input: any): any {
    if (!this.config.inputSanitization.enabled) {
      return input;
    }
    
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
  
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    // Length check
    if (sanitized.length > this.config.inputSanitization.maxInputLength) {
      sanitized = sanitized.substring(0, this.config.inputSanitization.maxInputLength);
    }
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // SQL Injection prevention
    if (this.config.inputSanitization.preventSqlInjection) {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/gi,
        /(\b1\s*=\s*1\b|\b0\s*=\s*0\b)/gi
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitized)) {
          throw new AppError(
            'Input contains potentially malicious SQL patterns',
            400,
            'MALICIOUS_INPUT_DETECTED'
          );
        }
      }
    }
    
    // XSS prevention
    if (this.config.inputSanitization.preventXss) {
      const xssPatterns = [
        /<script[^>]*>[\s\S]*?<\/script[^>]*>/gi,
        /<iframe[^>]*>[\s\S]*?<\/iframe[^>]*>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi
      ];
      
      for (const pattern of xssPatterns) {
        sanitized = sanitized.replace(pattern, '');
      }
    }
    
    // HTML stripping
    if (this.config.inputSanitization.stripHtml) {
      sanitized = sanitized.replace(/<[^>]+>/g, '');
    }
    
    // Normalize unicode
    sanitized = sanitized.normalize('NFC');
    
    return sanitized.trim();
  }
  
  // Security audit logging
  logSecurityEvent(
    request: FastifyRequest,
    eventType: 'csrf_violation' | 'xss_attempt' | 'sql_injection' | 'rate_limit' | 'auth_failure',
    details: Record<string, any> = {}
  ): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      eventType,
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      userId: (request as any).userId || null,
      sessionId: (request as any).sessionId || null,
      details,
      severity: this.getEventSeverity(eventType)
    };
    
    // Log with appropriate level
    if (securityLog.severity === 'high') {
      request.log.error(securityLog, `High severity security event: ${eventType}`);
    } else if (securityLog.severity === 'medium') {
      request.log.warn(securityLog, `Medium severity security event: ${eventType}`);
    } else {
      request.log.info(securityLog, `Low severity security event: ${eventType}`);
    }
    
    // In production, you might want to send alerts for high-severity events
    if (securityLog.severity === 'high' && process.env.NODE_ENV === 'production') {
      // Send alert to security monitoring system
      this.sendSecurityAlert(securityLog);
    }
  }
  
  private getEventSeverity(eventType: string): 'low' | 'medium' | 'high' {
    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      csrf_violation: 'medium',
      xss_attempt: 'high',
      sql_injection: 'high',
      rate_limit: 'low',
      auth_failure: 'medium'
    };
    
    return severityMap[eventType] || 'medium';
  }
  
  private sendSecurityAlert(securityLog: any): void {
    // Implementation would send to external monitoring service
    // For now, just console log
    console.error('SECURITY ALERT:', securityLog);
  }
  
  private getClientIP(request: FastifyRequest): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (request.headers['x-real-ip'] as string) ||
           request.ip ||
           'unknown';
  }
  
  // Create comprehensive security middleware
  createSecurityMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Set security headers
        this.setSecurityHeaders(reply);
        
        // CSRF Protection for state-changing methods
        if (this.config.csrf.enabled && 
            !this.config.csrf.ignoredMethods.includes(request.method)) {
          await this.validateCSRF(request, reply);
        }
        
        // Input sanitization
        if (this.config.inputSanitization.enabled && request.body) {
          try {
            request.body = this.sanitizeInput(request.body);
          } catch (error) {
            this.logSecurityEvent(request, 'xss_attempt', { 
              originalBody: request.body,
              error: error instanceof Error ? error.message : String(error)
            });
            throw error;
          }
        }
        
        // Add security context to request
        (request as any).security = {
          generateCSRFToken: this.generateCSRFToken.bind(this),
          logSecurityEvent: (eventType: string, details: any) => 
            this.logSecurityEvent(request, eventType as any, details)
        };
        
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        
        request.log.error({ error }, 'Security middleware error');
        throw new AppError(
          'Security validation failed',
          500,
          'SECURITY_ERROR'
        );
      }
    };
  }
  
  private async validateCSRF(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = request.headers[this.config.csrf.headerName] as string ||
                  request.cookies?.[this.config.csrf.cookieName];
    
    if (!token) {
      this.logSecurityEvent(request, 'csrf_violation', { reason: 'missing_token' });
      throw new AppError('CSRF token required', 403, 'CSRF_TOKEN_REQUIRED');
    }
    
    // Get session ID or use IP as fallback
    const sessionId = (request as any).sessionId || 
                      (request as any).userId || 
                      this.getClientIP(request);
    
    const storedSecret = this.csrfSecrets.get(sessionId);
    
    if (!storedSecret || storedSecret.expiresAt < Date.now()) {
      this.logSecurityEvent(request, 'csrf_violation', { reason: 'expired_secret' });
      throw new AppError('CSRF token expired', 403, 'CSRF_TOKEN_EXPIRED');
    }
    
    if (!this.verifyCSRFToken(token, storedSecret.secret)) {
      this.logSecurityEvent(request, 'csrf_violation', { 
        reason: 'invalid_token',
        providedToken: token.substring(0, 8) + '...' // Log only first 8 chars for security
      });
      throw new AppError('Invalid CSRF token', 403, 'CSRF_TOKEN_INVALID');
    }
  }
  
  // Get security metrics
  getSecurityMetrics(): {
    csrfTokensActive: number;
    securityEventsLast24h: number;
    configStatus: Record<string, boolean>;
  } {
    return {
      csrfTokensActive: this.csrfSecrets.size,
      securityEventsLast24h: 0, // Would be tracked in a real implementation
      configStatus: {
        csrfEnabled: this.config.csrf.enabled,
        cspEnabled: this.config.contentSecurity.enableCSP,
        inputSanitizationEnabled: this.config.inputSanitization.enabled,
        secureHeaders: this.config.contentSecurity.enableXSSProtection
      }
    };
  }
}

// Export factory function
export const createComprehensiveSecurityMiddleware = (config?: Partial<SecurityConfig>) => {
  const service = new ComprehensiveSecurityService(config);
  return service.createSecurityMiddleware();
};

// Pre-configured security profiles
export const securityProfiles = {
  development: {
    csrf: { enabled: false },
    contentSecurity: { enableCSP: false },
    inputSanitization: { enabled: true, maxInputLength: 50000 },
    authentication: { requireSecureCookies: false }
  },
  
  production: {
    csrf: { enabled: true },
    contentSecurity: { 
      enableCSP: true,
      enableXSSProtection: true,
      enableFrameOptions: true,
      enableContentTypeOptions: true,
      enableReferrerPolicy: true
    },
    inputSanitization: { 
      enabled: true,
      stripHtml: true,
      preventSqlInjection: true,
      preventXss: true,
      maxInputLength: 10000
    },
    authentication: { requireSecureCookies: true }
  },
  
  highSecurity: {
    csrf: { enabled: true, saltLength: 16 },
    contentSecurity: {
      enableCSP: true,
      enableXSSProtection: true,
      enableFrameOptions: true,
      enableContentTypeOptions: true,
      enableReferrerPolicy: true
    },
    inputSanitization: {
      enabled: true,
      stripHtml: true,
      preventSqlInjection: true,
      preventXss: true,
      maxInputLength: 5000
    },
    authentication: {
      requireSecureCookies: true,
      sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
      maxLoginAttempts: 3,
      lockoutDuration: 30 * 60 * 1000 // 30 minutes
    }
  }
};

export default {
  ComprehensiveSecurityService,
  createComprehensiveSecurityMiddleware,
  securityProfiles,
  DEFAULT_SECURITY_CONFIG
};