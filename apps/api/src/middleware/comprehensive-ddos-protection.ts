import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { AppError } from './errorHandler';
import { RedisCacheService } from '../services/redis-cache';

export interface DDoSProtectionConfig {
  // Rate limiting tiers
  rateLimits: {
    strict: { windowMs: number; maxRequests: number };
    moderate: { windowMs: number; maxRequests: number };
    lenient: { windowMs: number; maxRequests: number };
  };
  
  // DDoS detection thresholds
  ddosDetection: {
    requestBurstThreshold: number; // requests per second
    concurrentConnectionThreshold: number;
    suspiciousPatternThreshold: number;
    geoAnomalyThreshold: number;
  };
  
  // Mitigation strategies
  mitigation: {
    enableTarpit: boolean; // Slow down suspicious requests
    enableChallengeResponse: boolean; // CAPTCHA-like challenges
    enableGeoblocking: boolean;
    enableBehaviorAnalysis: boolean;
  };
  
  // Whitelisting
  whitelist: {
    ips: string[];
    userAgents: RegExp[];
    apiKeys: string[];
    countries: string[];
  };
  
  // Monitoring and alerting
  monitoring: {
    enableRealTimeAlerts: boolean;
    alertWebhookUrl?: string;
    logAllBlocked: boolean;
    enableMetricsCollection: boolean;
  };
}

export interface RequestAnalytics {
  ip: string;
  userAgent: string;
  country?: string;
  asn?: number;
  requestPath: string;
  method: string;
  timestamp: number;
  fingerprintHash: string;
  suspicionScore: number;
  rateLimitTier: 'strict' | 'moderate' | 'lenient';
}

export interface DDoSAlert {
  id: string;
  type: 'burst' | 'sustained' | 'distributed' | 'pattern' | 'geo';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  requestCount: number;
  timeWindow: number;
  mitigationApplied: string[];
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Comprehensive DDoS Protection and Rate Limiting Service
 * 
 * Features:
 * - Multi-tier rate limiting (strict/moderate/lenient)
 * - Real-time DDoS detection and mitigation
 * - Behavioral analysis and pattern recognition
 * - Geographic anomaly detection
 * - Adaptive rate limiting based on threat level
 * - Challenge-response mechanisms
 * - Tarpit for suspicious requests
 * - Comprehensive logging and alerting
 * - Automatic IP reputation management
 * - API-specific protection rules
 */
export class ComprehensiveDDoSProtection {
  private redis: Redis;
  private config: DDoSProtectionConfig;
  private requestBuffer: Map<string, RequestAnalytics[]> = new Map();
  private suspiciousIPs: Map<string, { score: number; lastSeen: number; violations: string[] }> = new Map();
  private activeTarpits: Map<string, { startTime: number; duration: number }> = new Map();
  private geoDatabase: Map<string, { country: string; asn: number; lastUpdate: number }> = new Map();
  private alertHistory: DDoSAlert[] = [];
  
  // Redis key prefixes
  private readonly RATE_LIMIT_PREFIX = 'ddos:rate:';
  private readonly BURST_DETECTION_PREFIX = 'ddos:burst:';
  private readonly SUSPICIOUS_IP_PREFIX = 'ddos:suspicious:';
  private readonly GEO_CACHE_PREFIX = 'ddos:geo:';
  private readonly CHALLENGE_PREFIX = 'ddos:challenge:';
  private readonly TARPIT_PREFIX = 'ddos:tarpit:';
  private readonly METRICS_PREFIX = 'ddos:metrics:';
  
  constructor(redis: Redis, config: Partial<DDoSProtectionConfig> = {}) {
    this.redis = redis;
    this.config = this.mergeWithDefaults(config);
    this.setupCleanupTasks();
    this.initializeGeoDatabase();
    console.log('🛡️  Comprehensive DDoS Protection initialized');
  }
  
  private mergeWithDefaults(config: Partial<DDoSProtectionConfig>): DDoSProtectionConfig {
    return {
      rateLimits: {
        strict: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
        moderate: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute  
        lenient: { windowMs: 60000, maxRequests: 1000 }, // 1000 requests per minute
        ...config.rateLimits
      },
      ddosDetection: {
        requestBurstThreshold: 50, // 50 requests per second
        concurrentConnectionThreshold: 100,
        suspiciousPatternThreshold: 5,
        geoAnomalyThreshold: 3,
        ...config.ddosDetection
      },
      mitigation: {
        enableTarpit: true,
        enableChallengeResponse: true,
        enableGeoblocking: false,
        enableBehaviorAnalysis: true,
        ...config.mitigation
      },
      whitelist: {
        ips: ['127.0.0.1', '::1'],
        userAgents: [/^HealthCheck/, /^InternalMonitor/],
        apiKeys: [],
        countries: ['US', 'CA', 'GB', 'DE', 'FR'],
        ...config.whitelist
      },
      monitoring: {
        enableRealTimeAlerts: true,
        logAllBlocked: true,
        enableMetricsCollection: true,
        ...config.monitoring
      }
    };
  }
  
  /**
   * Main DDoS protection middleware
   */
  async protectionMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const clientIP = this.getClientIP(request);
      const userAgent = request.headers['user-agent'] || 'unknown';
      const requestPath = request.url;
      const method = request.method;
      
      try {
        // Skip protection for health checks and internal endpoints
        if (this.shouldSkipProtection(request)) {
          return;
        }
        
        // Check if IP is whitelisted
        if (this.isWhitelisted(clientIP, userAgent, request)) {
          await this.recordLegitimateRequest(clientIP);
          return;
        }
        
        // Check if IP is in tarpit
        if (await this.isInTarpit(clientIP)) {
          await this.applyTarpit(clientIP, reply);
          return;
        }
        
        // Generate request fingerprint for analysis
        const fingerprint = this.generateRequestFingerprint(request);
        
        // Perform behavioral analysis
        const suspicionScore = await this.analyzeBehavior(clientIP, userAgent, requestPath, fingerprint);
        
        // Determine rate limit tier based on suspicion score
        const rateLimitTier = this.determineRateLimitTier(suspicionScore);
        
        // Apply rate limiting
        const rateLimitResult = await this.applyRateLimit(clientIP, rateLimitTier, request);
        if (!rateLimitResult.allowed) {
          await this.handleRateLimitExceeded(clientIP, rateLimitResult, reply);
          return;
        }
        
        // Check for request bursts
        const burstDetected = await this.detectRequestBurst(clientIP);
        if (burstDetected) {
          await this.handleSuspiciousActivity(clientIP, 'burst', { burstRate: burstDetected.rate }, reply);
          return;
        }
        
        // Perform geographic anomaly detection
        const geoAnomaly = await this.detectGeographicAnomaly(clientIP);
        if (geoAnomaly.isAnomalous) {
          await this.handleSuspiciousActivity(clientIP, 'geo', geoAnomaly, reply);
          return;
        }
        
        // Check for suspicious patterns
        const patternDetected = await this.detectSuspiciousPatterns(clientIP, requestPath, userAgent);
        if (patternDetected.isSuspicious) {
          await this.handleSuspiciousActivity(clientIP, 'pattern', patternDetected, reply);
          return;
        }
        
        // Record successful request for analytics
        await this.recordRequest({
          ip: clientIP,
          userAgent,
          country: geoAnomaly.country,
          asn: geoAnomaly.asn,
          requestPath,
          method,
          timestamp: startTime,
          fingerprintHash: fingerprint,
          suspicionScore,
          rateLimitTier
        });
        
        // Set security headers
        this.setSecurityHeaders(reply, rateLimitResult);
        
      } catch (error) {
        console.error('DDoS protection middleware error:', error);
        // Fail open to avoid blocking legitimate traffic
        return;
      }
    };
  }
  
  /**
   * Analyze request behavior for suspicious patterns
   */
  private async analyzeBehavior(
    ip: string, 
    userAgent: string, 
    requestPath: string, 
    fingerprint: string
  ): Promise<number> {
    let suspicionScore = 0;
    
    try {
      // Check request frequency patterns
      const recentRequests = await this.getRecentRequests(ip, 300000); // Last 5 minutes
      
      // Rapid fire requests (same endpoint)
      const sameEndpointRequests = recentRequests.filter(req => req.requestPath === requestPath);
      if (sameEndpointRequests.length > 50) {
        suspicionScore += 30;
      }
      
      // Diverse endpoint scanning
      const uniqueEndpoints = new Set(recentRequests.map(req => req.requestPath));
      if (uniqueEndpoints.size > 100 && recentRequests.length > 200) {
        suspicionScore += 25; // Potential scanning
      }
      
      // User agent analysis
      if (!userAgent || userAgent === 'unknown') {
        suspicionScore += 10;
      } else if (/bot|crawler|spider|scraper/i.test(userAgent)) {
        suspicionScore += 15;
      } else if (userAgent.length < 10 || userAgent.length > 500) {
        suspicionScore += 10;
      }
      
      // Request pattern analysis
      if (requestPath.includes('..') || requestPath.includes('<script>') || requestPath.includes('union select')) {
        suspicionScore += 40; // Potential attack
      }
      
      // Check against known attack patterns
      const attackPatterns = [
        /\/wp-admin/, /\/admin/, /\/phpmyadmin/, /\.(php|asp|jsp)$/,
        /\/\.env/, /\/config/, /\/backup/, /\/debug/
      ];
      
      if (attackPatterns.some(pattern => pattern.test(requestPath))) {
        suspicionScore += 35;
      }
      
      // Request timing analysis
      const requestIntervals = recentRequests
        .slice(-10)
        .map((req, i, arr) => i > 0 ? req.timestamp - arr[i-1].timestamp : 0)
        .filter(interval => interval > 0);
      
      if (requestIntervals.length > 3) {
        const avgInterval = requestIntervals.reduce((sum, interval) => sum + interval, 0) / requestIntervals.length;
        if (avgInterval < 100) { // Less than 100ms between requests
          suspicionScore += 20;
        }
      }
      
      // Fingerprint similarity (potential bot behavior)
      const similarFingerprints = recentRequests.filter(req => req.fingerprintHash === fingerprint);
      if (similarFingerprints.length > recentRequests.length * 0.8) {
        suspicionScore += 15;
      }
      
    } catch (error) {
      console.warn('Behavior analysis error:', error);
    }
    
    return Math.min(suspicionScore, 100); // Cap at 100
  }
  
  /**
   * Detect request bursts (potential DDoS)
   */
  private async detectRequestBurst(ip: string): Promise<{ detected: boolean; rate: number } | null> {
    const now = Date.now();
    const windowStart = now - 1000; // 1 second window
    const key = `${this.BURST_DETECTION_PREFIX}${ip}:${Math.floor(now / 1000)}`;
    
    try {
      const count = await this.redis.incr(key);
      await this.redis.expire(key, 60); // Keep for 1 minute for analysis
      
      if (count >= this.config.ddosDetection.requestBurstThreshold) {
        return { detected: true, rate: count };
      }
      
      return null;
    } catch (error) {
      console.warn('Burst detection error:', error);
      return null;
    }
  }
  
  /**
   * Detect geographic anomalies
   */
  private async detectGeographicAnomaly(ip: string): Promise<{
    isAnomalous: boolean;
    country?: string;
    asn?: number;
    reason?: string;
  }> {
    try {
      const geoInfo = await this.getGeoInfo(ip);
      if (!geoInfo) {
        return { isAnomalous: false };
      }
      
      // Check if country is in whitelist
      if (this.config.whitelist.countries.includes(geoInfo.country)) {
        return { isAnomalous: false, ...geoInfo };
      }
      
      // Check for requests from high-risk countries
      const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY']; // Example high-risk countries
      if (highRiskCountries.includes(geoInfo.country)) {
        return { 
          isAnomalous: true, 
          ...geoInfo, 
          reason: `Request from high-risk country: ${geoInfo.country}` 
        };
      }
      
      // Check for suspicious ASN (known hosting providers, VPNs)
      const suspiciousASNs = [12876, 13335, 16509, 14061]; // Example suspicious ASNs
      if (suspiciousASNs.includes(geoInfo.asn)) {
        return { 
          isAnomalous: true, 
          ...geoInfo, 
          reason: `Request from suspicious ASN: ${geoInfo.asn}` 
        };
      }
      
      return { isAnomalous: false, ...geoInfo };
    } catch (error) {
      console.warn('Geographic anomaly detection error:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Detect suspicious request patterns
   */
  private async detectSuspiciousPatterns(
    ip: string, 
    requestPath: string, 
    userAgent: string
  ): Promise<{ isSuspicious: boolean; patterns: string[]; severity: number }> {
    const suspiciousPatterns: string[] = [];
    let severity = 0;
    
    try {
      // SQL injection patterns
      const sqlPatterns = [
        /union\s+(all\s+)?select/i,
        /\s+(or|and)\s+.*(=|<|>)/i,
        /\s+drop\s+(table|database)/i,
        /\s+insert\s+into/i,
        /\s+update\s+.+\s+set/i
      ];
      
      if (sqlPatterns.some(pattern => pattern.test(requestPath))) {
        suspiciousPatterns.push('sql_injection');
        severity += 40;
      }
      
      // XSS patterns
      const xssPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on(load|error|click|mouseover)\s*=/i,
        /<iframe[^>]*>/i
      ];
      
      if (xssPatterns.some(pattern => pattern.test(requestPath))) {
        suspiciousPatterns.push('xss_attempt');
        severity += 35;
      }
      
      // Path traversal patterns
      const pathTraversalPatterns = [
        /\.\.\//, 
        /\.\.\\/,
        /\%2e\%2e\%2f/i,
        /\%2e\%2e\\/i
      ];
      
      if (pathTraversalPatterns.some(pattern => pattern.test(requestPath))) {
        suspiciousPatterns.push('path_traversal');
        severity += 30;
      }
      
      // Command injection patterns
      const cmdPatterns = [
        /;\s*(cat|ls|pwd|whoami|id|nc|wget|curl)/i,
        /\|\s*(cat|ls|pwd|whoami|id|nc|wget|curl)/i,
        /`[^`]*`/,
        /\$\([^)]*\)/
      ];
      
      if (cmdPatterns.some(pattern => pattern.test(requestPath))) {
        suspiciousPatterns.push('command_injection');
        severity += 45;
      }
      
      // Suspicious user agents
      const suspiciousUAPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /openvas/i,
        /masscan/i,
        /nmap/i
      ];
      
      if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
        suspiciousPatterns.push('malicious_user_agent');
        severity += 50;
      }
      
      // Check recent pattern frequency
      const recentRequests = await this.getRecentRequests(ip, 600000); // Last 10 minutes
      const patternRequestCount = recentRequests.filter(req => 
        suspiciousPatterns.some(pattern => req.requestPath.includes(pattern))
      ).length;
      
      if (patternRequestCount >= this.config.ddosDetection.suspiciousPatternThreshold) {
        suspiciousPatterns.push('pattern_frequency');
        severity += 25;
      }
      
    } catch (error) {
      console.warn('Pattern detection error:', error);
    }
    
    return {
      isSuspicious: suspiciousPatterns.length > 0,
      patterns: suspiciousPatterns,
      severity: Math.min(severity, 100)
    };
  }
  
  /**
   * Apply appropriate rate limiting based on tier
   */
  private async applyRateLimit(
    ip: string, 
    tier: 'strict' | 'moderate' | 'lenient',
    request: FastifyRequest
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; tier: string }> {
    const limits = this.config.rateLimits[tier];
    const now = Date.now();
    const windowStart = Math.floor(now / limits.windowMs) * limits.windowMs;
    const key = `${this.RATE_LIMIT_PREFIX}${tier}:${ip}:${windowStart}`;
    
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, Math.ceil(limits.windowMs / 1000));
      }
      
      const remaining = Math.max(0, limits.maxRequests - count);
      const resetTime = windowStart + limits.windowMs;
      
      return {
        allowed: count <= limits.maxRequests,
        remaining,
        resetTime,
        tier
      };
    } catch (error) {
      console.warn('Rate limiting error:', error);
      return { allowed: true, remaining: 0, resetTime: 0, tier };
    }
  }
  
  /**
   * Handle rate limit exceeded
   */
  private async handleRateLimitExceeded(
    ip: string, 
    rateLimitResult: any, 
    reply: FastifyReply
  ): Promise<void> {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    
    // Escalate suspicion score
    await this.escalateSuspicion(ip, 'rate_limit_exceeded', 15);
    
    // Set headers
    reply.header('Retry-After', retryAfter.toString());
    reply.header('X-RateLimit-Limit', this.config.rateLimits[rateLimitResult.tier].maxRequests.toString());
    reply.header('X-RateLimit-Remaining', '0');
    reply.header('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
    reply.header('X-RateLimit-Tier', rateLimitResult.tier);
    
    // Log the event
    if (this.config.monitoring.logAllBlocked) {
      console.warn(`Rate limit exceeded for IP ${ip} (tier: ${rateLimitResult.tier})`);
    }
    
    // Create alert for repeated violations
    const violations = await this.redis.incr(`violations:${ip}`);
    await this.redis.expire(`violations:${ip}`, 3600); // 1 hour
    
    if (violations >= 3) {
      await this.createAlert({
        type: 'sustained',
        severity: 'medium',
        sourceIp: ip,
        requestCount: violations,
        timeWindow: 3600,
        mitigationApplied: ['rate_limit'],
        metadata: { tier: rateLimitResult.tier }
      });
    }
    
    reply.code(429).send({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      tier: rateLimitResult.tier
    });
  }
  
  /**
   * Handle suspicious activity
   */
  private async handleSuspiciousActivity(
    ip: string, 
    type: string, 
    metadata: any, 
    reply: FastifyReply
  ): Promise<void> {
    // Escalate suspicion
    await this.escalateSuspicion(ip, type, 30);
    
    // Apply mitigation strategies
    const mitigationApplied: string[] = [];
    
    if (this.config.mitigation.enableTarpit) {
      await this.addToTarpit(ip, 300000); // 5 minutes
      mitigationApplied.push('tarpit');
    }
    
    if (this.config.mitigation.enableChallengeResponse) {
      const challengeToken = await this.generateChallenge(ip);
      mitigationApplied.push('challenge');
      
      reply.header('X-Challenge-Required', 'true');
      reply.header('X-Challenge-Token', challengeToken);
    }
    
    // Create alert
    await this.createAlert({
      type: type as any,
      severity: metadata.severity || 'high',
      sourceIp: ip,
      requestCount: 1,
      timeWindow: 60,
      mitigationApplied,
      metadata
    });
    
    // Log the event
    console.warn(`Suspicious activity detected: ${type} from IP ${ip}`, metadata);
    
    reply.code(429).send({
      success: false,
      error: 'Suspicious activity detected',
      message: 'Your request has been flagged for review. Please try again later.',
      type,
      mitigation: mitigationApplied
    });
  }
  
  /**
   * Determine rate limit tier based on suspicion score
   */
  private determineRateLimitTier(suspicionScore: number): 'strict' | 'moderate' | 'lenient' {
    if (suspicionScore >= 50) {
      return 'strict';
    } else if (suspicionScore >= 20) {
      return 'moderate';
    } else {
      return 'lenient';
    }
  }
  
  /**
   * Check if request should skip protection
   */
  private shouldSkipProtection(request: FastifyRequest): boolean {
    const skipPaths = ['/health', '/metrics', '/ping', '/status'];
    return skipPaths.some(path => request.url.startsWith(path));
  }
  
  /**
   * Check if source is whitelisted
   */
  private isWhitelisted(ip: string, userAgent: string, request: FastifyRequest): boolean {
    // Check IP whitelist
    if (this.config.whitelist.ips.includes(ip)) {
      return true;
    }
    
    // Check User-Agent whitelist
    if (this.config.whitelist.userAgents.some(pattern => pattern.test(userAgent))) {
      return true;
    }
    
    // Check API key whitelist
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey && this.config.whitelist.apiKeys.includes(apiKey)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Generate request fingerprint for analysis
   */
  private generateRequestFingerprint(request: FastifyRequest): string {
    const components = [
      request.headers['user-agent'] || '',
      request.headers['accept'] || '',
      request.headers['accept-language'] || '',
      request.headers['accept-encoding'] || '',
      request.method,
      Object.keys(request.headers).sort().join(',')
    ];
    
    return createHash('md5').update(components.join('|')).digest('hex');
  }
  
  /**
   * Get client IP with proxy support
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const cfConnectingIP = request.headers['cf-connecting-ip'] as string;
    
    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    
    return request.ip || 'unknown';
  }
  
  /**
   * Tarpit implementation
   */
  private async isInTarpit(ip: string): Promise<boolean> {
    const tarpit = this.activeTarpits.get(ip);
    if (!tarpit) return false;
    
    if (Date.now() > tarpit.startTime + tarpit.duration) {
      this.activeTarpits.delete(ip);
      return false;
    }
    
    return true;
  }
  
  private async addToTarpit(ip: string, duration: number): Promise<void> {
    this.activeTarpits.set(ip, {
      startTime: Date.now(),
      duration
    });
    
    await this.redis.setex(`${this.TARPIT_PREFIX}${ip}`, Math.ceil(duration / 1000), '1');
  }
  
  private async applyTarpit(ip: string, reply: FastifyReply): Promise<void> {
    const tarpit = this.activeTarpits.get(ip);
    if (!tarpit) return;
    
    const remainingTime = Math.ceil((tarpit.startTime + tarpit.duration - Date.now()) / 1000);
    
    // Artificially slow down the response
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    
    reply.header('Retry-After', remainingTime.toString());
    reply.header('X-Tarpit-Applied', 'true');
    
    reply.code(429).send({
      success: false,
      error: 'Request throttled',
      message: 'Your request is being processed slowly due to suspicious activity.',
      retryAfter: remainingTime
    });
  }
  
  /**
   * Challenge-response system
   */
  private async generateChallenge(ip: string): Promise<string> {
    const challenge = createHash('sha256').update(`${ip}-${Date.now()}-${Math.random()}`).digest('hex');
    const key = `${this.CHALLENGE_PREFIX}${ip}`;
    
    await this.redis.setex(key, 300, challenge); // 5 minutes
    
    return challenge;
  }
  
  /**
   * Geographic information lookup
   */
  private async getGeoInfo(ip: string): Promise<{ country: string; asn: number } | null> {
    const cached = this.geoDatabase.get(ip);
    if (cached && Date.now() - cached.lastUpdate < 86400000) { // 24 hours
      return { country: cached.country, asn: cached.asn };
    }
    
    try {
      // In production, integrate with MaxMind GeoIP or similar service
      // For now, return mock data based on IP ranges
      const mockGeoData = this.getMockGeoData(ip);
      
      this.geoDatabase.set(ip, {
        ...mockGeoData,
        lastUpdate: Date.now()
      });
      
      return mockGeoData;
    } catch (error) {
      console.warn('Geo lookup error:', error);
      return null;
    }
  }
  
  private getMockGeoData(ip: string): { country: string; asn: number } {
    // Simple mock implementation - in production use real GeoIP service
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { country: 'US', asn: 0 }; // Private IP
    }
    
    // Mock based on IP hash
    const hash = createHash('md5').update(ip).digest('hex');
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'CN', 'RU', 'IN', 'BR', 'AU'];
    const asns = [12345, 67890, 11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888];
    
    const countryIndex = parseInt(hash.substring(0, 2), 16) % countries.length;
    const asnIndex = parseInt(hash.substring(2, 4), 16) % asns.length;
    
    return {
      country: countries[countryIndex],
      asn: asns[asnIndex]
    };
  }
  
  /**
   * Recent requests tracking
   */
  private async getRecentRequests(ip: string, timeWindow: number): Promise<RequestAnalytics[]> {
    const buffer = this.requestBuffer.get(ip) || [];
    const cutoff = Date.now() - timeWindow;
    
    return buffer.filter(req => req.timestamp > cutoff);
  }
  
  private async recordRequest(analytics: RequestAnalytics): Promise<void> {
    const buffer = this.requestBuffer.get(analytics.ip) || [];
    buffer.push(analytics);
    
    // Keep only last 1000 requests per IP
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }
    
    this.requestBuffer.set(analytics.ip, buffer);
    
    // Store in Redis for distributed analysis
    if (this.config.monitoring.enableMetricsCollection) {
      await this.redis.lpush(`${this.METRICS_PREFIX}${analytics.ip}`, JSON.stringify(analytics));
      await this.redis.expire(`${this.METRICS_PREFIX}${analytics.ip}`, 3600); // 1 hour
    }
  }
  
  private async recordLegitimateRequest(ip: string): Promise<void> {
    // Reduce suspicion score for whitelisted IPs
    const suspicious = this.suspiciousIPs.get(ip);
    if (suspicious && suspicious.score > 0) {
      suspicious.score = Math.max(0, suspicious.score - 5);
      this.suspiciousIPs.set(ip, suspicious);
    }
  }
  
  /**
   * Suspicion score management
   */
  private async escalateSuspicion(ip: string, reason: string, points: number): Promise<void> {
    const current = this.suspiciousIPs.get(ip) || { score: 0, lastSeen: 0, violations: [] };
    
    current.score = Math.min(100, current.score + points);
    current.lastSeen = Date.now();
    current.violations.push(reason);
    
    // Keep only last 10 violations
    if (current.violations.length > 10) {
      current.violations = current.violations.slice(-10);
    }
    
    this.suspiciousIPs.set(ip, current);
    
    // Store in Redis
    await this.redis.setex(`${this.SUSPICIOUS_IP_PREFIX}${ip}`, 3600, JSON.stringify(current));
  }
  
  /**
   * Alert system
   */
  private async createAlert(alertData: Omit<DDoSAlert, 'id' | 'timestamp'>): Promise<void> {
    const alert: DDoSAlert = {
      id: createHash('md5').update(`${alertData.sourceIp}-${Date.now()}`).digest('hex'),
      timestamp: new Date(),
      ...alertData
    };
    
    this.alertHistory.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
    
    // Store in Redis
    await this.redis.lpush('ddos:alerts', JSON.stringify(alert));
    await this.redis.expire('ddos:alerts', 86400); // 24 hours
    
    // Send webhook if configured
    if (this.config.monitoring.enableRealTimeAlerts && this.config.monitoring.alertWebhookUrl) {
      await this.sendAlertWebhook(alert);
    }
    
    console.warn(`DDoS Alert [${alert.severity}]: ${alert.type} from ${alert.sourceIp}`);
  }
  
  private async sendAlertWebhook(alert: DDoSAlert): Promise<void> {
    try {
      const payload = {
        text: `🚨 DDoS Alert: ${alert.type} from ${alert.sourceIp}`,
        severity: alert.severity,
        details: alert,
        timestamp: alert.timestamp.toISOString()
      };
      
      // In production, send actual webhook
      console.log('Webhook alert would be sent:', payload);
    } catch (error) {
      console.error('Failed to send alert webhook:', error);
    }
  }
  
  /**
   * Set security headers
   */
  private setSecurityHeaders(reply: FastifyReply, rateLimitResult: any): void {
    reply.header('X-DDoS-Protection', 'enabled');
    reply.header('X-RateLimit-Tier', rateLimitResult.tier);
    reply.header('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
  }
  
  /**
   * Initialize geographic database
   */
  private async initializeGeoDatabase(): Promise<void> {
    // Initialize with common IP ranges - in production, load from GeoIP database
    console.log('🌍 Geographic database initialized');
  }
  
  /**
   * Cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }
  
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean up request buffers
    for (const [ip, buffer] of this.requestBuffer.entries()) {
      const cutoff = now - 3600000; // 1 hour
      const filtered = buffer.filter(req => req.timestamp > cutoff);
      
      if (filtered.length !== buffer.length) {
        this.requestBuffer.set(ip, filtered);
        cleanedCount++;
      }
      
      if (filtered.length === 0) {
        this.requestBuffer.delete(ip);
      }
    }
    
    // Clean up suspicious IPs
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > 3600000) { // 1 hour
        this.suspiciousIPs.delete(ip);
        cleanedCount++;
      }
    }
    
    // Clean up tarpits
    for (const [ip, tarpit] of this.activeTarpits.entries()) {
      if (now > tarpit.startTime + tarpit.duration) {
        this.activeTarpits.delete(ip);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 DDoS Protection cleaned up ${cleanedCount} expired entries`);
    }
  }
  
  /**
   * Get protection statistics
   */
  getStats(): {
    activeRequests: number;
    suspiciousIPs: number;
    activeTarpits: number;
    recentAlerts: number;
    requestsAnalyzed: number;
  } {
    const recentAlerts = this.alertHistory.filter(
      alert => Date.now() - alert.timestamp.getTime() < 3600000
    ).length;
    
    const requestsAnalyzed = Array.from(this.requestBuffer.values())
      .reduce((total, buffer) => total + buffer.length, 0);
    
    return {
      activeRequests: this.requestBuffer.size,
      suspiciousIPs: this.suspiciousIPs.size,
      activeTarpits: this.activeTarpits.size,
      recentAlerts,
      requestsAnalyzed
    };
  }
  
  /**
   * Manual IP management
   */
  async banIP(ip: string, duration: number = 3600000): Promise<void> {
    await this.addToTarpit(ip, duration);
    await this.escalateSuspicion(ip, 'manual_ban', 100);
    console.log(`🚫 Manually banned IP ${ip} for ${duration / 1000} seconds`);
  }
  
  async unbanIP(ip: string): Promise<void> {
    this.activeTarpits.delete(ip);
    this.suspiciousIPs.delete(ip);
    await this.redis.del(`${this.TARPIT_PREFIX}${ip}`);
    await this.redis.del(`${this.SUSPICIOUS_IP_PREFIX}${ip}`);
    console.log(`✅ Unbanned IP ${ip}`);
  }
}

/**
 * Create comprehensive DDoS protection service
 */
export function createComprehensiveDDoSProtection(
  redis: Redis,
  config: Partial<DDoSProtectionConfig> = {}
): ComprehensiveDDoSProtection {
  return new ComprehensiveDDoSProtection(redis, config);
}