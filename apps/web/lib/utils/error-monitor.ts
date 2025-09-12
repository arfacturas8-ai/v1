"use client";

import * as React from 'react';

// Comprehensive error monitoring and logging system

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  channelId?: string;
  serverId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  additional?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  type: 'javascript' | 'react' | 'network' | 'socket' | 'validation' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  tags: string[];
}

interface PerformanceMetrics {
  componentRenderTime: number;
  memoryUsage?: number;
  networkLatency?: number;
  messageLoadTime?: number;
  virtualScrollPerformance?: number;
}

class ErrorMonitor {
  private errors: Map<string, ErrorReport> = new Map();
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private sessionId: string;
  private userId: string | null = null;
  private context: Partial<ErrorContext> = {};
  private maxQueueSize: number = 100;
  private flushInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeContext();
    this.setupGlobalErrorHandlers();
    this.setupNetworkStatusListeners();
    this.setupPerformanceMonitoring();
    this.startPeriodicFlush();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeContext(): void {
    if (typeof window === 'undefined') return;

    this.context = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    };
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // JavaScript runtime errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'javascript',
        severity: 'high',
        context: {
          ...this.context,
          component: 'global',
          action: 'runtime_error',
          additional: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(`Unhandled promise rejection: ${event.reason}`), {
        type: 'javascript',
        severity: 'high',
        context: {
          ...this.context,
          component: 'global',
          action: 'unhandled_promise_rejection',
          additional: {
            reason: event.reason,
          },
        },
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.captureError(new Error(`Resource failed to load: ${target.tagName}`), {
          type: 'network',
          severity: 'medium',
          context: {
            ...this.context,
            component: 'resource_loader',
            action: 'load_error',
            additional: {
              tagName: target.tagName,
              src: (target as any).src || (target as any).href,
            },
          },
        });
      }
    }, true);
  }

  private setupNetworkStatusListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.captureError(new Error('Network connection lost'), {
        type: 'network',
        severity: 'medium',
        context: {
          ...this.context,
          component: 'network',
          action: 'connection_lost',
        },
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            if (entry.duration > 1000) { // Report slow operations
              this.captureError(new Error(`Slow operation detected: ${entry.name}`), {
                type: 'performance',
                severity: 'medium',
                context: {
                  ...this.context,
                  component: 'performance',
                  action: 'slow_operation',
                  additional: {
                    operationName: entry.name,
                    duration: entry.duration,
                    entryType: entry.entryType,
                  },
                },
              });
            }
          }
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });
    } catch (error) {
      console.error('Failed to setup performance monitoring:', error);
    }
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushErrorQueue();
      this.cleanupOldErrors();
    }, 30000); // Flush every 30 seconds
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    // Create a unique fingerprint for this error type
    const message = error.message || 'unknown_error';
    const component = context.component || 'unknown';
    const action = context.action || 'unknown';
    
    const fingerprintData = `${message}-${component}-${action}`;
    return this.hashString(fingerprintData);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public setUser(userId: string): void {
    this.userId = userId;
    this.context.userId = userId;
  }

  public setContext(context: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...context };
  }

  public captureError(
    error: Error, 
    options: {
      type?: ErrorReport['type'];
      severity?: ErrorReport['severity'];
      context?: Partial<ErrorContext>;
      tags?: string[];
    } = {}
  ): string {
    try {
      const {
        type = 'javascript',
        severity = 'medium',
        context = {},
        tags = [],
      } = options;

      const fullContext: ErrorContext = {
        ...this.context,
        ...context,
        timestamp: new Date().toISOString(),
      };

      const fingerprint = this.generateFingerprint(error, fullContext);
      const errorId = `${fingerprint}-${Date.now()}`;

      // Check if this error already exists
      const existingError = this.errors.get(fingerprint);
      
      if (existingError) {
        // Update existing error
        existingError.count++;
        existingError.lastSeen = new Date().toISOString();
        existingError.context = fullContext; // Update with latest context
      } else {
        // Create new error report
        const errorReport: ErrorReport = {
          id: errorId,
          type,
          severity,
          message: error.message || 'Unknown error',
          stack: error.stack,
          context: fullContext,
          fingerprint,
          count: 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          resolved: false,
          tags: [...tags, type, severity],
        };

        this.errors.set(fingerprint, errorReport);
        
        // Add to queue for transmission
        if (this.errorQueue.length < this.maxQueueSize) {
          this.errorQueue.push(errorReport);
        }
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Captured [${severity.toUpperCase()}]`);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Context:', fullContext);
        console.error('Fingerprint:', fingerprint);
        console.groupEnd();
      }

      // Immediate flush for critical errors
      if (severity === 'critical') {
        this.flushErrorQueue();
      }

      return errorId;
    } catch (captureError) {
      console.error('Failed to capture error:', captureError);
      return 'capture_failed';
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: Partial<ErrorContext> = {}): void {
    if (level === 'error') {
      this.captureError(new Error(message), {
        type: 'javascript',
        severity: 'low',
        context,
        tags: ['message', level],
      });
    } else {
      // For non-error messages, we could implement a separate logging system
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  public capturePerformanceMetric(name: string, duration: number, context: Partial<ErrorContext> = {}): void {
    if (duration > 5000) { // Report operations taking longer than 5 seconds
      this.captureError(new Error(`Performance issue: ${name}`), {
        type: 'performance',
        severity: duration > 10000 ? 'high' : 'medium',
        context: {
          ...context,
          additional: { duration, operationName: name },
        },
        tags: ['performance', 'slow_operation'],
      });
    }
  }

  public captureNetworkError(url: string, status: number, statusText: string, context: Partial<ErrorContext> = {}): void {
    const severity = status >= 500 ? 'high' : status >= 400 ? 'medium' : 'low';
    
    this.captureError(new Error(`Network error: ${status} ${statusText}`), {
      type: 'network',
      severity,
      context: {
        ...context,
        additional: { url, status, statusText },
      },
      tags: ['network', 'http_error', `status_${status}`],
    });
  }

  public captureSecurityViolation(violation: string, context: Partial<ErrorContext> = {}): void {
    this.captureError(new Error(`Security violation: ${violation}`), {
      type: 'security',
      severity: 'critical',
      context,
      tags: ['security', 'violation'],
    });
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }

    try {
      const errorsToSend = [...this.errorQueue];
      this.errorQueue = [];

      // In a real implementation, you would send these to your error reporting service
      // Example: await this.sendToErrorService(errorsToSend);
      
      // For now, we'll log them
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 Flushing ${errorsToSend.length} error reports`);
      }

      // Simulate sending to error service
      await this.simulateSendToErrorService(errorsToSend);
    } catch (error) {
      console.error('Failed to flush error queue:', error);
      // Re-queue errors if sending failed
      this.errorQueue.unshift(...this.errorQueue);
    }
  }

  private async simulateSendToErrorService(errors: ErrorReport[]): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, you would:
    // 1. Send to your error monitoring service (e.g., Sentry, LogRocket, Bugsnag)
    // 2. Send to your backend API
    // 3. Store in local storage as backup
    
    if (process.env.NODE_ENV === 'development') {
      errors.forEach(error => {
        console.log('📊 Error Report:', {
          id: error.id,
          type: error.type,
          severity: error.severity,
          message: error.message,
          fingerprint: error.fingerprint,
          count: error.count,
          context: error.context,
        });
      });
    }
  }

  private cleanupOldErrors(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [fingerprint, error] of this.errors.entries()) {
      const lastSeenTime = new Date(error.lastSeen).getTime();
      if (lastSeenTime < oneDayAgo) {
        this.errors.delete(fingerprint);
      }
    }
  }

  public getErrorStats(): { total: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const stats = {
      total: this.errors.size,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const error of this.errors.values()) {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    }

    return stats;
  }

  public clearErrors(): void {
    this.errors.clear();
    this.errorQueue = [];
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.flushErrorQueue();
    this.clearErrors();
  }
}

// Create singleton instance
let errorMonitor: ErrorMonitor | null = null;

export function getErrorMonitor(): ErrorMonitor {
  if (!errorMonitor) {
    errorMonitor = new ErrorMonitor();
  }
  return errorMonitor;
}

// Convenience functions
export const captureError = (error: Error, options?: Parameters<ErrorMonitor['captureError']>[1]) => {
  return getErrorMonitor().captureError(error, options);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: Partial<ErrorContext>) => {
  return getErrorMonitor().captureMessage(message, level, context);
};

export const capturePerformanceMetric = (name: string, duration: number, context?: Partial<ErrorContext>) => {
  return getErrorMonitor().capturePerformanceMetric(name, duration, context);
};

export const captureNetworkError = (url: string, status: number, statusText: string, context?: Partial<ErrorContext>) => {
  return getErrorMonitor().captureNetworkError(url, status, statusText, context);
};

export const captureSecurityViolation = (violation: string, context?: Partial<ErrorContext>) => {
  return getErrorMonitor().captureSecurityViolation(violation, context);
};

export const setErrorContext = (context: Partial<ErrorContext>) => {
  return getErrorMonitor().setContext(context);
};

export const setErrorUser = (userId: string) => {
  return getErrorMonitor().setUser(userId);
};

// React integration
export function useErrorMonitor(componentName: string) {
  const monitor = getErrorMonitor();
  
  React.useEffect(() => {
    monitor.setContext({ component: componentName });
    
    return () => {
      // Cleanup component-specific context
      monitor.setContext({ component: undefined });
    };
  }, [monitor, componentName]);

  const captureComponentError = React.useCallback((error: Error, action?: string) => {
    return monitor.captureError(error, {
      type: 'react',
      severity: 'high',
      context: {
        component: componentName,
        action,
      },
      tags: ['react', 'component_error'],
    });
  }, [monitor, componentName]);

  return {
    captureError: captureComponentError,
    captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => {
      monitor.captureMessage(message, level, { component: componentName });
    },
    capturePerformanceMetric: (name: string, duration: number) => {
      monitor.capturePerformanceMetric(name, duration, { component: componentName });
    },
  };
}

// Export the singleton
export { ErrorMonitor };