import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';

/**
 * DDoS Protection Middleware
 * Implements multiple layers of protection against DDoS attacks
 */

interface DDoSConfig {
  // Request rate limits
  windowMs: number;
  maxRequests: number;
  
  // Connection limits
  maxConcurrentConnections: number;
  maxConnectionsPerIP: number;
  
  // Payload limits
  maxPayloadSize: number; // bytes
  maxQueryParams: number;
  
  // Slowdown configuration
  delayAfter: number;
  delayMs: number;
  
  // Blacklist/whitelist
  whitelist: string[];
  blacklist: string[];
  
  // Fingerprinting
  enableFingerprinting: boolean;
  suspiciousThreshold: number;
}

const DEFAULT_CONFIG: DDoSConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  maxConcurrentConnections: 1000,
  maxConnectionsPerIP: 20,
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  maxQueryParams: 50,
  delayAfter: 50,
  delayMs: 500,
  whitelist: ['127.0.0.1', '::1'],
  blacklist: [],
  enableFingerprinting: true,
  suspiciousThreshold: 10
};

// Store request counts and connections
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const activeConnections = new Map<string, number>();
const suspiciousActivity = new Map<string, number>();

export function ddosProtection(config: Partial<DDoSConfig> = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  
  return async function(request: FastifyRequest, reply: FastifyReply) {
    const clientIP = getClientIP(request);
    
    // Check whitelist
    if (settings.whitelist.includes(clientIP)) {
      return;
    }
    
    // Check blacklist
    if (settings.blacklist.includes(clientIP)) {
      return reply.code(403).send({ error: 'Access denied' });
    }
    
    // Check payload size
    if (request.headers['content-length']) {
      const size = parseInt(request.headers['content-length']);
      if (size > settings.maxPayloadSize) {
        return reply.code(413).send({ error: 'Payload too large' });
      }
    }
    
    // Check query parameters count
    const queryCount = Object.keys(request.query as any).length;
    if (queryCount > settings.maxQueryParams) {
      return reply.code(400).send({ error: 'Too many query parameters' });
    }
    
    // Track active connections
    const currentConnections = activeConnections.get(clientIP) || 0;
    if (currentConnections >= settings.maxConnectionsPerIP) {
      return reply.code(429).send({ error: 'Too many connections' });
    }
    
    // Update connection count
    activeConnections.set(clientIP, currentConnections + 1);
    
    // Clean up connection on response
    reply.raw.on('finish', () => {
      const conns = activeConnections.get(clientIP) || 0;
      if (conns > 1) {
        activeConnections.set(clientIP, conns - 1);
      } else {
        activeConnections.delete(clientIP);
      }
    });
    
    // Rate limiting
    const now = Date.now();
    const clientData = requestCounts.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      // New window
      requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + settings.windowMs
      });
    } else {
      // Increment count
      clientData.count++;
      
      // Check if over limit
      if (clientData.count > settings.maxRequests) {
        // Track suspicious activity
        if (settings.enableFingerprinting) {
          const suspCount = (suspiciousActivity.get(clientIP) || 0) + 1;
          suspiciousActivity.set(clientIP, suspCount);
          
          // Auto-blacklist if too suspicious
          if (suspCount >= settings.suspiciousThreshold) {
            settings.blacklist.push(clientIP);
            request.log.warn(`Auto-blacklisted IP due to suspicious activity: ${clientIP}`);
          }
        }
        
        return reply.code(429).send({
          error: 'Too many requests',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }
      
      // Apply slowdown if configured
      if (clientData.count > settings.delayAfter) {
        const delay = (clientData.count - settings.delayAfter) * settings.delayMs;
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
      }
    }
    
    // Fingerprint analysis for bot detection
    if (settings.enableFingerprinting) {
      const fingerprint = analyzeRequest(request);
      
      if (fingerprint.suspicious) {
        const suspCount = (suspiciousActivity.get(clientIP) || 0) + 1;
        suspiciousActivity.set(clientIP, suspCount);
        
        request.log.warn(`Suspicious activity detected from ${clientIP}: ${fingerprint.reason}`);
      }
    }
  };
}

// Get real client IP considering proxies
function getClientIP(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return (forwarded as string).split(',')[0].trim();
  }
  
  const realIP = request.headers['x-real-ip'];
  if (realIP) {
    return realIP as string;
  }
  
  return request.ip;
}

// Analyze request for suspicious patterns
function analyzeRequest(request: FastifyRequest): { suspicious: boolean; reason?: string } {
  const userAgent = request.headers['user-agent'] || '';
  const accept = request.headers['accept'] || '';
  
  // Check for missing or suspicious headers
  if (!userAgent) {
    return { suspicious: true, reason: 'Missing User-Agent' };
  }
  
  if (!accept) {
    return { suspicious: true, reason: 'Missing Accept header' };
  }
  
  // Check for bot patterns in User-Agent
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return { suspicious: true, reason: `Bot pattern detected: ${pattern}` };
    }
  }
  
  // Check for rapid sequential requests (fingerprinting)
  // This would need more sophisticated tracking in production
  
  return { suspicious: false };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean request counts
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime + 60000) {
      requestCounts.delete(ip);
    }
  }
  
  // Clean suspicious activity after 1 hour
  suspiciousActivity.clear();
}, 60000);

// Export utility to manually block/unblock IPs
export const ddosManager = {
  block(ip: string) {
    if (!DEFAULT_CONFIG.blacklist.includes(ip)) {
      DEFAULT_CONFIG.blacklist.push(ip);
    }
  },
  
  unblock(ip: string) {
    const index = DEFAULT_CONFIG.blacklist.indexOf(ip);
    if (index > -1) {
      DEFAULT_CONFIG.blacklist.splice(index, 1);
    }
  },
  
  getBlocked(): string[] {
    return [...DEFAULT_CONFIG.blacklist];
  },
  
  getStats() {
    return {
      activeConnections: activeConnections.size,
      trackedIPs: requestCounts.size,
      suspiciousIPs: suspiciousActivity.size,
      blockedIPs: DEFAULT_CONFIG.blacklist.length
    };
  }
};