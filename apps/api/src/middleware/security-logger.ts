import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Create security logs directory
const securityLogDir = '/var/log/cryb';
if (!fs.existsSync(securityLogDir)) {
  fs.mkdirSync(securityLogDir, { recursive: true, mode: 0o755 });
}

// Security event types
export enum SecurityEventType {
  AUTHENTICATION_FAILED = 'authentication_failed',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  ACCOUNT_LOCKOUT = 'account_lockout',
  INVALID_JWT = 'invalid_jwt',
  WEB3_AUTH_FAILED = 'web3_auth_failed',
  INVALID_SIGNATURE = 'invalid_signature',
  NONCE_ATTACK = 'nonce_attack',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  API_ABUSE = 'api_abuse',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  SOCKET_AUTH_FAILED = 'socket_auth_failed',
  SOCKET_FLOODING = 'socket_flooding',
  WEBSOCKET_ABUSE = 'websocket_abuse',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
  UPLOAD_ABUSE = 'upload_abuse',
  INVALID_FILE_TYPE = 'invalid_file_type',
  SYSTEM_COMPROMISE = 'system_compromise',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SUSPICIOUS_PROCESS = 'suspicious_process',
  DDOS_ATTACK = 'ddos_attack',
  TRAFFIC_ANOMALY = 'traffic_anomaly',
  CONFIG_CHANGE = 'config_change',
  UNAUTHORIZED_FILE_CHANGE = 'unauthorized_file_change',
  SUSPICIOUS_LOGIN_LOCATION = 'suspicious_login_location',
  PASSWORD_RESET_ABUSE = 'password_reset_abuse',
  ADMIN_ACTION = 'admin_action',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityEvent {
  timestamp: string;
  event: SecurityEventType;
  severity: SecuritySeverity;
  srcip: string;
  user?: string;
  user_agent?: string;
  endpoint?: string;
  method?: string;
  details?: any;
  session_id?: string;
  success?: boolean;
  attempts?: number;
  reason?: string;
  file?: string;
  process?: string;
  attack_type?: string;
  location?: {
    country?: string;
    city?: string;
    ip_reputation?: string;
  };
}

// Create specialized loggers for different security events
const createSecurityLogger = (filename: string) => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    transports: [
      new transports.File({
        filename: path.join(securityLogDir, filename),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      }),
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        ),
        level: 'warn'
      })
    ]
  });
};

// Individual security loggers
export const authSecurityLogger = createSecurityLogger('api-auth.log');
export const apiSecurityLogger = createSecurityLogger('api-security.log');
export const socketSecurityLogger = createSecurityLogger('socket-security.log');
export const uploadSecurityLogger = createSecurityLogger('upload-security.log');
export const web3SecurityLogger = createSecurityLogger('web3-security.log');
export const systemSecurityLogger = createSecurityLogger('system-security.log');

// Security event tracker for rate limiting and pattern detection
class SecurityEventTracker {
  private events: Map<string, SecurityEvent[]> = new Map();
  private readonly maxEvents = 1000;
  private readonly timeWindow = 3600000; // 1 hour

  addEvent(ip: string, event: SecurityEvent) {
    if (!this.events.has(ip)) {
      this.events.set(ip, []);
    }

    const ipEvents = this.events.get(ip)!;
    ipEvents.push(event);

    // Clean old events
    const cutoff = Date.now() - this.timeWindow;
    const recentEvents = ipEvents.filter(e => 
      new Date(e.timestamp).getTime() > cutoff
    );
    
    this.events.set(ip, recentEvents.slice(-this.maxEvents));
  }

  getEvents(ip: string, eventType?: SecurityEventType): SecurityEvent[] {
    const events = this.events.get(ip) || [];
    if (eventType) {
      return events.filter(e => e.event === eventType);
    }
    return events;
  }

  getRecentEventCount(ip: string, eventType: SecurityEventType, minutes: number = 10): number {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const events = this.getEvents(ip, eventType);
    return events.filter(e => new Date(e.timestamp).getTime() > cutoff).length;
  }

  isUnderAttack(ip: string): boolean {
    const recentEvents = this.getEvents(ip).filter(e => 
      new Date(e.timestamp).getTime() > Date.now() - 300000 // 5 minutes
    );
    
    return recentEvents.length > 50 || 
           recentEvents.filter(e => e.severity === SecuritySeverity.HIGH).length > 10;
  }
}

export const securityTracker = new SecurityEventTracker();

// Get client IP address with proxy support
export const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const real = req.headers['x-real-ip'] as string;
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return remoteAddress || 'unknown';
};

// Get user agent with sanitization
export const getUserAgent = (req: Request): string => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  return userAgent.replace(/[<>'"]/g, ''); // Basic XSS protection
};

// Log security event with appropriate logger
export const logSecurityEvent = (event: SecurityEvent): void => {
  // Track the event
  securityTracker.addEvent(event.srcip, event);

  // Log to console for immediate visibility
  if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
    console.error(`[SECURITY ALERT] ${event.event}: ${event.details || ''} from ${event.srcip}`);
  }

  // Log to appropriate file
  switch (event.event) {
    case SecurityEventType.AUTHENTICATION_FAILED:
    case SecurityEventType.AUTHENTICATION_SUCCESS:
    case SecurityEventType.ACCOUNT_LOCKOUT:
    case SecurityEventType.INVALID_JWT:
    case SecurityEventType.SUSPICIOUS_LOGIN_LOCATION:
    case SecurityEventType.PASSWORD_RESET_ABUSE:
      authSecurityLogger.info(event);
      break;

    case SecurityEventType.WEB3_AUTH_FAILED:
    case SecurityEventType.INVALID_SIGNATURE:
    case SecurityEventType.NONCE_ATTACK:
      web3SecurityLogger.info(event);
      break;

    case SecurityEventType.SOCKET_AUTH_FAILED:
    case SecurityEventType.SOCKET_FLOODING:
    case SecurityEventType.WEBSOCKET_ABUSE:
      socketSecurityLogger.info(event);
      break;

    case SecurityEventType.MALICIOUS_FILE_UPLOAD:
    case SecurityEventType.UPLOAD_ABUSE:
    case SecurityEventType.INVALID_FILE_TYPE:
      uploadSecurityLogger.info(event);
      break;

    case SecurityEventType.SYSTEM_COMPROMISE:
    case SecurityEventType.PRIVILEGE_ESCALATION:
    case SecurityEventType.SUSPICIOUS_PROCESS:
    case SecurityEventType.CONFIG_CHANGE:
    case SecurityEventType.UNAUTHORIZED_FILE_CHANGE:
      systemSecurityLogger.info(event);
      break;

    default:
      apiSecurityLogger.info(event);
      break;
  }

  // Check for attack patterns
  const recentFailures = securityTracker.getRecentEventCount(event.srcip, SecurityEventType.AUTHENTICATION_FAILED, 5);
  if (recentFailures >= 5) {
    logSecurityEvent({
      timestamp: new Date().toISOString(),
      event: SecurityEventType.BRUTE_FORCE_ATTACK,
      severity: SecuritySeverity.HIGH,
      srcip: event.srcip,
      details: `${recentFailures} authentication failures in 5 minutes`,
      attempts: recentFailures
    });
  }

  // Check for DDoS patterns
  if (securityTracker.isUnderAttack(event.srcip)) {
    logSecurityEvent({
      timestamp: new Date().toISOString(),
      event: SecurityEventType.DDOS_ATTACK,
      severity: SecuritySeverity.CRITICAL,
      srcip: event.srcip,
      attack_type: 'High frequency requests',
      details: 'Potential DDoS attack detected'
    });
  }
};

// Security middleware for request monitoring
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /[<>'"]/,  // XSS attempts
    /(union|select|insert|drop|delete|update|script)/i,  // SQL injection
    /\.\.\//,  // Path traversal
    /(eval|exec|system|shell_exec)/i,  // Code injection
  ];

  const url = req.url.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    logSecurityEvent({
      timestamp: new Date().toISOString(),
      event: url.includes('script') || url.includes('<') ? 
        SecurityEventType.XSS_ATTEMPT : SecurityEventType.SQL_INJECTION_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      srcip: clientIP,
      user_agent: userAgent,
      endpoint: req.url,
      method: req.method,
      details: 'Suspicious pattern detected in request'
    });
  }

  // Monitor response for errors
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (res.statusCode === 401) {
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        event: SecurityEventType.AUTHENTICATION_FAILED,
        severity: SecuritySeverity.MEDIUM,
        srcip: clientIP,
        user_agent: userAgent,
        endpoint: req.url,
        method: req.method,
        success: false
      });
    }

    // Log rate limiting
    if (res.statusCode === 429) {
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        event: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: SecuritySeverity.MEDIUM,
        srcip: clientIP,
        user_agent: userAgent,
        endpoint: req.url,
        method: req.method
      });
    }

    // Log server errors that might indicate attacks
    if (res.statusCode >= 500) {
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        event: SecurityEventType.API_ABUSE,
        severity: SecuritySeverity.HIGH,
        srcip: clientIP,
        user_agent: userAgent,
        endpoint: req.url,
        method: req.method,
        details: `Server error ${res.statusCode}, duration: ${duration}ms`
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Helper function for logging successful authentication
export const logSuccessfulAuth = (req: Request, userId: string, authType: string = 'standard') => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: SecurityEventType.AUTHENTICATION_SUCCESS,
    severity: SecuritySeverity.LOW,
    srcip: getClientIP(req),
    user: userId,
    user_agent: getUserAgent(req),
    success: true,
    details: `Authentication successful via ${authType}`
  });
};

// Helper function for logging admin actions
export const logAdminAction = (req: Request, adminId: string, action: string, target?: string) => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: SecurityEventType.ADMIN_ACTION,
    severity: SecuritySeverity.MEDIUM,
    srcip: getClientIP(req),
    user: adminId,
    user_agent: getUserAgent(req),
    details: `Admin action: ${action}${target ? ` on ${target}` : ''}`
  });
};

export default {
  securityMonitoringMiddleware,
  logSecurityEvent,
  logSuccessfulAuth,
  logAdminAction,
  SecurityEventType,
  SecuritySeverity,
  securityTracker
};