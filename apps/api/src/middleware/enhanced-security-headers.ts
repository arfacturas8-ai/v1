import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
});

interface SecurityConfig {
  csp: CSPConfig;
  hsts: HSTSConfig;
  frameOptions: FrameOptionsConfig;
  contentType: ContentTypeConfig;
  referrer: ReferrerConfig;
  permissions: PermissionsConfig;
  cors: CORSConfig;
}

interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  useNonces: boolean;
  reportUri?: string;
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
}

interface HSTSConfig {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

interface FrameOptionsConfig {
  enabled: boolean;
  policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  allowFrom?: string;
}

interface ContentTypeConfig {
  enabled: boolean;
  noSniff: boolean;
}

interface ReferrerConfig {
  enabled: boolean;
  policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

interface PermissionsConfig {
  enabled: boolean;
  allowedFeatures: string[];
}

interface CORSConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export class EnhancedSecurityHeaders {
  private config: SecurityConfig;
  private nonceCache: Map<string, string> = new Map();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
  }

  private mergeWithDefaults(config: Partial<SecurityConfig>): SecurityConfig {
    const defaults: SecurityConfig = {
      csp: {
        enabled: true,
        reportOnly: process.env.NODE_ENV !== 'production',
        useNonces: true,
        reportUri: '/api/v1/security/csp-report',
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:", "*.cryb.ai"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
          connectSrc: ["'self'", "ws:", "wss:", "https:", "*.cryb.ai"],
          mediaSrc: ["'self'", "blob:", "data:", "*.cryb.ai"],
          objectSrc: ["'none'"],
          childSrc: ["'self'", "blob:"],
          frameSrc: ["'self'", "*.youtube.com", "*.vimeo.com"],
          workerSrc: ["'self'", "blob:"],
          manifestSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production',
          blockAllMixedContent: process.env.NODE_ENV === 'production'
        }
      },
      hsts: {
        enabled: process.env.NODE_ENV === 'production',
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      frameOptions: {
        enabled: true,
        policy: 'DENY'
      },
      contentType: {
        enabled: true,
        noSniff: true
      },
      referrer: {
        enabled: true,
        policy: 'strict-origin-when-cross-origin'
      },
      permissions: {
        enabled: true,
        allowedFeatures: [
          'accelerometer=()',
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'gyroscope=()',
          'magnetometer=()',
          'payment=()',
          'usb=()'
        ]
      },
      cors: {
        enabled: true,
        allowedOrigins: [
          'https://cryb.ai',
          'https://platform.cryb.ai',
          'https://admin.cryb.ai',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:19001'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-CSRF-Token',
          'X-API-Key',
          'X-Client-Version',
          'Accept',
          'Origin'
        ],
        exposedHeaders: [
          'X-Total-Count',
          'X-Rate-Limit-Remaining',
          'X-Rate-Limit-Reset'
        ],
        credentials: true,
        maxAge: 86400 // 24 hours
      }
    };

    return {
      csp: { ...defaults.csp, ...config.csp },
      hsts: { ...defaults.hsts, ...config.hsts },
      frameOptions: { ...defaults.frameOptions, ...config.frameOptions },
      contentType: { ...defaults.contentType, ...config.contentType },
      referrer: { ...defaults.referrer, ...config.referrer },
      permissions: { ...defaults.permissions, ...config.permissions },
      cors: { ...defaults.cors, ...config.cors }
    };
  }

  /**
   * Generate CSP nonce for inline scripts/styles
   */
  private generateNonce(): string {
    return createHash('sha256')
      .update(Date.now().toString() + Math.random().toString())
      .digest('base64')
      .substring(0, 16);
  }

  /**
   * Build Content Security Policy header value
   */
  private buildCSPHeader(nonce?: string): string {
    const directives: string[] = [];
    const { csp } = this.config;

    Object.entries(csp.directives).forEach(([directive, values]) => {
      if (directive === 'upgradeInsecureRequests' || directive === 'blockAllMixedContent') {
        if (values === true) {
          directives.push(directive.replace(/([A-Z])/g, '-$1').toLowerCase());
        }
        return;
      }

      if (Array.isArray(values) && values.length > 0) {
        let directiveValues = [...values];

        // Add nonce to script-src and style-src if enabled
        if (nonce && csp.useNonces && (directive === 'scriptSrc' || directive === 'styleSrc')) {
          directiveValues.push(`'nonce-${nonce}'`);
        }

        const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        directives.push(`${kebabDirective} ${directiveValues.join(' ')}`);
      }
    });

    // Add report-uri if specified
    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    return directives.join('; ');
  }

  /**
   * Security headers middleware
   */
  public middleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Generate nonce for this request
        let nonce: string | undefined;
        if (this.config.csp.useNonces) {
          nonce = this.generateNonce();
          // Store nonce in request context for use in templates
          (request as any).nonce = nonce;
        }

        // Content Security Policy
        if (this.config.csp.enabled) {
          const cspValue = this.buildCSPHeader(nonce);
          const headerName = this.config.csp.reportOnly 
            ? 'Content-Security-Policy-Report-Only' 
            : 'Content-Security-Policy';
          reply.header(headerName, cspValue);
        }

        // HTTP Strict Transport Security
        if (this.config.hsts.enabled) {
          let hstsValue = `max-age=${this.config.hsts.maxAge}`;
          if (this.config.hsts.includeSubDomains) {
            hstsValue += '; includeSubDomains';
          }
          if (this.config.hsts.preload) {
            hstsValue += '; preload';
          }
          reply.header('Strict-Transport-Security', hstsValue);
        }

        // X-Frame-Options
        if (this.config.frameOptions.enabled) {
          let frameValue = this.config.frameOptions.policy;
          if (frameValue === 'ALLOW-FROM' && this.config.frameOptions.allowFrom) {
            frameValue += ` ${this.config.frameOptions.allowFrom}`;
          }
          reply.header('X-Frame-Options', frameValue);
        }

        // X-Content-Type-Options
        if (this.config.contentType.enabled && this.config.contentType.noSniff) {
          reply.header('X-Content-Type-Options', 'nosniff');
        }

        // Referrer-Policy
        if (this.config.referrer.enabled) {
          reply.header('Referrer-Policy', this.config.referrer.policy);
        }

        // Permissions-Policy (formerly Feature-Policy)
        if (this.config.permissions.enabled) {
          reply.header('Permissions-Policy', this.config.permissions.allowedFeatures.join(', '));
        }

        // Additional security headers
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('X-DNS-Prefetch-Control', 'off');
        reply.header('X-Download-Options', 'noopen');
        reply.header('X-Permitted-Cross-Domain-Policies', 'none');
        reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
        reply.header('Cross-Origin-Opener-Policy', 'same-origin');
        reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

        // Server information hiding
        reply.removeHeader('X-Powered-By');
        reply.header('Server', 'Cryb');

        // Security monitoring
        await this.logSecurityEvent(request, 'security_headers_applied');

      } catch (error) {
        request.log.error('Error applying security headers:', error);
        // Don't block the request if security headers fail
      }
    };
  }

  /**
   * CORS middleware with enhanced security
   */
  public corsMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!this.config.cors.enabled) return;

      const origin = request.headers.origin;
      const method = request.method;

      // Check if origin is allowed
      const isOriginAllowed = !origin || 
        this.config.cors.allowedOrigins.includes('*') ||
        this.config.cors.allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'));

      if (!isOriginAllowed) {
        await this.logSecurityEvent(request, 'cors_violation', { origin, method });
        return reply.code(403).send({ error: 'CORS policy violation' });
      }

      // Set CORS headers
      if (origin) {
        reply.header('Access-Control-Allow-Origin', origin);
      }

      if (this.config.cors.credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }

      reply.header('Access-Control-Allow-Methods', this.config.cors.allowedMethods.join(', '));
      reply.header('Access-Control-Allow-Headers', this.config.cors.allowedHeaders.join(', '));
      reply.header('Access-Control-Expose-Headers', this.config.cors.exposedHeaders.join(', '));
      reply.header('Access-Control-Max-Age', this.config.cors.maxAge.toString());

      // Handle preflight requests
      if (method === 'OPTIONS') {
        return reply.code(204).send();
      }
    };
  }

  /**
   * CSP violation report endpoint handler
   */
  public cspReportHandler() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const report = request.body as any;
        
        // Log CSP violation
        request.log.warn({
          cspViolation: report,
          userAgent: request.headers['user-agent'],
          ip: request.ip
        }, 'CSP violation reported');

        // Store violation in Redis for monitoring
        const violationKey = `csp:violations:${Date.now()}`;
        await redis.setex(violationKey, 86400, JSON.stringify({
          report,
          timestamp: new Date().toISOString(),
          userAgent: request.headers['user-agent'],
          ip: request.ip
        }));

        // Check for suspicious patterns
        if (report?.['csp-report']) {
          const violation = report['csp-report'];
          if (violation['blocked-uri'] && violation['blocked-uri'].includes('data:')) {
            await this.logSecurityEvent(request, 'csp_data_uri_violation', violation);
          }
        }

        return reply.code(204).send();

      } catch (error) {
        request.log.error('Error handling CSP report:', error);
        return reply.code(400).send({ error: 'Invalid CSP report' });
      }
    };
  }

  /**
   * Security monitoring endpoint
   */
  public securityMonitoringHandler() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get recent security events
        const violationKeys = await redis.keys('csp:violations:*');
        const securityEventKeys = await redis.keys('security:events:*');

        const [violations, events] = await Promise.all([
          Promise.all(violationKeys.slice(-50).map(key => redis.get(key))),
          Promise.all(securityEventKeys.slice(-100).map(key => redis.get(key)))
        ]);

        const violationData = violations
          .filter(v => v)
          .map(v => JSON.parse(v!))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const eventData = events
          .filter(e => e)
          .map(e => JSON.parse(e!))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return reply.send({
          security: {
            cspViolations: {
              total: violationData.length,
              recent: violationData.slice(0, 10)
            },
            securityEvents: {
              total: eventData.length,
              recent: eventData.slice(0, 20)
            },
            lastUpdated: new Date().toISOString()
          }
        });

      } catch (error) {
        request.log.error('Error getting security monitoring data:', error);
        return reply.code(500).send({ error: 'Failed to retrieve security data' });
      }
    };
  }

  /**
   * Log security events for monitoring
   */
  private async logSecurityEvent(
    request: FastifyRequest, 
    eventType: string, 
    data: any = {}
  ): Promise<void> {
    try {
      const event = {
        type: eventType,
        timestamp: new Date().toISOString(),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        url: request.url,
        method: request.method,
        data
      };

      const eventKey = `security:events:${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await redis.setex(eventKey, 86400, JSON.stringify(event)); // Keep for 24 hours

    } catch (error) {
      request.log.error('Failed to log security event:', error);
    }
  }

  /**
   * Update security configuration dynamically
   */
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = this.mergeWithDefaults(newConfig);
  }

  /**
   * Get current security configuration
   */
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Validate and sanitize user input for XSS prevention
   */
  public static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/`/g, '&#96;');
  }

  /**
   * Generate security report for compliance
   */
  public async generateSecurityReport(): Promise<any> {
    try {
      const [violations, events] = await Promise.all([
        redis.keys('csp:violations:*').then(keys => keys.length),
        redis.keys('security:events:*').then(keys => keys.length)
      ]);

      return {
        securityHeaders: {
          csp: this.config.csp.enabled,
          hsts: this.config.hsts.enabled,
          frameOptions: this.config.frameOptions.enabled,
          contentTypeOptions: this.config.contentType.enabled,
          referrerPolicy: this.config.referrer.enabled,
          permissionsPolicy: this.config.permissions.enabled
        },
        monitoring: {
          cspViolations: violations,
          securityEvents: events,
          reportingEnabled: !!this.config.csp.reportUri
        },
        configuration: {
          environment: process.env.NODE_ENV || 'development',
          reportOnlyMode: this.config.csp.reportOnly,
          nonceEnabled: this.config.csp.useNonces
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to generate security report:', error);
      return { error: 'Failed to generate security report' };
    }
  }
}

export default EnhancedSecurityHeaders;