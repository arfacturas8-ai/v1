/**
 * CRASH REPORTING SERVICE
 * Integrates with Sentry for comprehensive crash reporting and error tracking
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { CrashDetector } from '../utils/CrashDetector';

export interface CrashReportConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  dist?: string;
  enableInExpoDevelopment?: boolean;
  enableAutoSessionTracking?: boolean;
  enableOutOfMemoryTracking?: boolean;
  sessionTrackingIntervalMillis?: number;
  enableAutoPerformanceTracing?: boolean;
  enableUserInteractionTracing?: boolean;
  enableNativeCrashHandling?: boolean;
  maxBreadcrumbs?: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
  subscription?: string;
  experimentalFeatures?: string[];
}

export interface DeviceContext {
  deviceId: string;
  model: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  locale: string;
  timezone: string;
  screenResolution: string;
  memorySize?: number;
  storageSize?: number;
  networkType?: string;
  batteryLevel?: number;
}

export interface PerformanceMetrics {
  appStartTime: number;
  navigationTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage?: number;
}

class CrashReportingService {
  private static instance: CrashReportingService;
  private isInitialized = false;
  private config: CrashReportConfig | null = null;
  private userContext: UserContext | null = null;
  private deviceContext: DeviceContext | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;
  private sessionStartTime = Date.now();

  static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  async initialize(config: CrashReportConfig): Promise<void> {
    try {
      this.config = config;

      // Don't initialize Sentry in Expo development unless explicitly enabled
      if (__DEV__ && !config.enableInExpoDevelopment && Constants.appOwnership === 'expo') {
        console.log('[CrashReporting] Skipping Sentry initialization in Expo development');
        return;
      }

      // Initialize Sentry
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release || Constants.manifest?.version,
        dist: config.dist || Constants.manifest?.revisionId,
        enableInExpoDevelopment: config.enableInExpoDevelopment || false,
        enableAutoSessionTracking: config.enableAutoSessionTracking !== false,
        enableOutOfMemoryTracking: config.enableOutOfMemoryTracking !== false,
        sessionTrackingIntervalMillis: config.sessionTrackingIntervalMillis || 30000,
        enableAutoPerformanceTracing: config.enableAutoPerformanceTracing !== false,
        enableUserInteractionTracing: config.enableUserInteractionTracing !== false,
        enableNativeCrashHandling: config.enableNativeCrashHandling !== false,
        maxBreadcrumbs: config.maxBreadcrumbs || 100,
        beforeSend: config.beforeSend || this.defaultBeforeSend.bind(this),
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            enableNativeFramesTracking: !__DEV__,
            enableStallTracking: !__DEV__,
          }),
        ],
        tracesSampleRate: __DEV__ ? 1.0 : 0.1,
        enableNdkScopeSync: true,
        enableAutoPerformanceTracing: true,
      });

      // Set up device context
      await this.setupDeviceContext();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Integrate with our custom crash detector
      this.integrateCrashDetector();

      // Set initial tags
      this.setInitialTags();

      this.isInitialized = true;
      console.log('[CrashReporting] Sentry initialized successfully');

    } catch (error) {
      console.error('[CrashReporting] Initialization error:', error);
      throw error;
    }
  }

  private defaultBeforeSend(event: Sentry.Event): Sentry.Event | null {
    try {
      // Filter out development-only errors
      if (__DEV__) {
        // Skip certain development errors
        if (event.message?.includes('Warning:') || 
            event.message?.includes('ReactDOM.render is deprecated')) {
          return null;
        }
      }

      // Add custom context
      event.extra = {
        ...event.extra,
        sessionStartTime: this.sessionStartTime,
        performanceMetrics: this.performanceMetrics,
        deviceContext: this.deviceContext,
        appState: 'foreground', // This would be dynamically set
      };

      // Sanitize sensitive data
      event = this.sanitizeEvent(event);

      return event;

    } catch (error) {
      console.error('[CrashReporting] BeforeSend error:', error);
      return event;
    }
  }

  private sanitizeEvent(event: Sentry.Event): Sentry.Event {
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const sanitized: any = {};
      
      Object.keys(obj).forEach(key => {
        if (sensitiveKeys.some(sensitiveKey => 
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )) {
          sanitized[key] = '[Redacted]';
        } else {
          sanitized[key] = sanitize(obj[key]);
        }
      });

      return sanitized;
    };

    // Sanitize different parts of the event
    if (event.extra) {
      event.extra = sanitize(event.extra);
    }

    if (event.contexts) {
      event.contexts = sanitize(event.contexts);
    }

    if (event.request?.data) {
      event.request.data = sanitize(event.request.data);
    }

    return event;
  }

  private async setupDeviceContext(): Promise<void> {
    try {
      const deviceContext: DeviceContext = {
        deviceId: Constants.installationId || 'unknown',
        model: Constants.deviceName || 'unknown',
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: Constants.manifest?.version || '1.0.0',
        buildNumber: Constants.manifest?.revisionId || 'development',
        locale: 'en-US', // This would be dynamically determined
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${Constants.screenPixels?.width || 0}x${Constants.screenPixels?.height || 0}`,
      };

      this.deviceContext = deviceContext;

      // Set Sentry context
      Sentry.setContext('device', deviceContext);

    } catch (error) {
      console.error('[CrashReporting] Device context setup error:', error);
    }
  }

  private setupPerformanceMonitoring(): void {
    try {
      this.performanceMetrics = {
        appStartTime: Date.now() - this.sessionStartTime,
        navigationTime: 0,
        apiResponseTime: 0,
        renderTime: 0,
        memoryUsage: 0,
      };

      // Monitor memory usage periodically
      setInterval(() => {
        this.updatePerformanceMetrics();
      }, 60000); // Every minute

    } catch (error) {
      console.error('[CrashReporting] Performance monitoring setup error:', error);
    }
  }

  private async updatePerformanceMetrics(): Promise<void> {
    try {
      // This would integrate with performance monitoring tools
      // For now, we'll use basic metrics
      const memoryUsage = (global as any).performance?.memory?.usedJSHeapSize || 0;
      
      if (this.performanceMetrics) {
        this.performanceMetrics.memoryUsage = memoryUsage;
        
        // Set Sentry context
        Sentry.setContext('performance', this.performanceMetrics);
      }

    } catch (error) {
      console.error('[CrashReporting] Performance metrics update error:', error);
    }
  }

  private integrateCrashDetector(): void {
    try {
      // Listen to crashes from our custom detector
      CrashDetector.onCrash((crash) => {
        try {
          Sentry.addBreadcrumb({
            message: 'Custom crash detected',
            category: 'crash',
            level: 'error',
            data: {
              crashId: crash.id,
              type: crash.type,
              severity: crash.severity,
            },
          });

          // Report to Sentry
          const error = new Error(crash.error.message);
          error.name = crash.error.name;
          error.stack = crash.error.stack;

          Sentry.withScope((scope) => {
            scope.setTag('crash_type', crash.type);
            scope.setLevel(this.getSentryLevel(crash.severity));
            scope.setContext('crash_details', {
              id: crash.id,
              timestamp: crash.timestamp,
              deviceInfo: crash.deviceInfo,
              appState: crash.appState,
            });

            Sentry.captureException(error);
          });

        } catch (error) {
          console.error('[CrashReporting] Crash integration error:', error);
        }
      });

    } catch (error) {
      console.error('[CrashReporting] Crash detector integration error:', error);
    }
  }

  private getSentryLevel(severity: string): Sentry.SeverityLevel {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
  }

  private setInitialTags(): void {
    try {
      Sentry.setTag('platform', Platform.OS);
      Sentry.setTag('environment', this.config?.environment || 'unknown');
      Sentry.setTag('expo', Constants.appOwnership === 'expo');
      
      if (__DEV__) {
        Sentry.setTag('development', true);
      }

    } catch (error) {
      console.error('[CrashReporting] Initial tags setup error:', error);
    }
  }

  // Public methods
  setUser(user: UserContext): void {
    try {
      this.userContext = user;

      Sentry.setUser({
        id: user.id,
        username: user.username,
        email: user.email,
      });

      Sentry.setTag('subscription', user.subscription || 'free');
      
      if (user.experimentalFeatures) {
        Sentry.setContext('experimental_features', {
          enabled: user.experimentalFeatures,
        });
      }

    } catch (error) {
      console.error('[CrashReporting] Set user error:', error);
    }
  }

  clearUser(): void {
    try {
      this.userContext = null;
      Sentry.setUser(null);
    } catch (error) {
      console.error('[CrashReporting] Clear user error:', error);
    }
  }

  captureException(error: Error, extra?: any): void {
    try {
      if (!this.isInitialized) {
        console.warn('[CrashReporting] Service not initialized, skipping error capture');
        return;
      }

      Sentry.withScope((scope) => {
        if (extra) {
          Object.keys(extra).forEach(key => {
            scope.setExtra(key, extra[key]);
          });
        }

        scope.setTimestamp(Date.now() / 1000);
        Sentry.captureException(error);
      });

    } catch (captureError) {
      console.error('[CrashReporting] Capture exception error:', captureError);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', extra?: any): void {
    try {
      if (!this.isInitialized) {
        console.warn('[CrashReporting] Service not initialized, skipping message capture');
        return;
      }

      Sentry.withScope((scope) => {
        scope.setLevel(level);
        
        if (extra) {
          Object.keys(extra).forEach(key => {
            scope.setExtra(key, extra[key]);
          });
        }

        Sentry.captureMessage(message);
      });

    } catch (captureError) {
      console.error('[CrashReporting] Capture message error:', captureError);
    }
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: any;
  }): void {
    try {
      if (!this.isInitialized) return;

      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'custom',
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
        timestamp: Date.now() / 1000,
      });

    } catch (error) {
      console.error('[CrashReporting] Add breadcrumb error:', error);
    }
  }

  setTag(key: string, value: string): void {
    try {
      if (!this.isInitialized) return;
      Sentry.setTag(key, value);
    } catch (error) {
      console.error('[CrashReporting] Set tag error:', error);
    }
  }

  setContext(key: string, context: any): void {
    try {
      if (!this.isInitialized) return;
      Sentry.setContext(key, context);
    } catch (error) {
      console.error('[CrashReporting] Set context error:', error);
    }
  }

  // Performance monitoring
  startTransaction(name: string, description?: string): Sentry.Transaction | null {
    try {
      if (!this.isInitialized) return null;

      return Sentry.startTransaction({
        name,
        description,
        op: 'navigation',
      });

    } catch (error) {
      console.error('[CrashReporting] Start transaction error:', error);
      return null;
    }
  }

  measureApiCall<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(`API: ${name}`);
    
    return operation()
      .then(result => {
        transaction?.setStatus('ok');
        transaction?.finish();
        return result;
      })
      .catch(error => {
        transaction?.setStatus('internal_error');
        transaction?.finish();
        this.captureException(error, { apiCall: name });
        throw error;
      });
  }

  // Session management
  startSession(): void {
    try {
      this.sessionStartTime = Date.now();
      Sentry.startSession();
    } catch (error) {
      console.error('[CrashReporting] Start session error:', error);
    }
  }

  endSession(): void {
    try {
      Sentry.endSession();
    } catch (error) {
      console.error('[CrashReporting] End session error:', error);
    }
  }

  // Native crash handling
  enableNativeCrashHandling(): void {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // This would enable native crash handling
        console.log('[CrashReporting] Native crash handling enabled');
      }
    } catch (error) {
      console.error('[CrashReporting] Enable native crash handling error:', error);
    }
  }

  // Health checks
  isHealthy(): boolean {
    try {
      return this.isInitialized && Sentry.getCurrentHub().getClient() !== undefined;
    } catch (error) {
      console.error('[CrashReporting] Health check error:', error);
      return false;
    }
  }

  async getLastEventId(): Promise<string | null> {
    try {
      return Sentry.lastEventId() || null;
    } catch (error) {
      console.error('[CrashReporting] Get last event ID error:', error);
      return null;
    }
  }

  // Configuration
  getConfiguration(): CrashReportConfig | null {
    return this.config;
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup
  close(): Promise<boolean> {
    try {
      this.isInitialized = false;
      return Sentry.close();
    } catch (error) {
      console.error('[CrashReporting] Close error:', error);
      return Promise.resolve(false);
    }
  }
}

// Singleton export
export const CrashReportingService = CrashReportingService.getInstance();

// Convenience functions
export const initializeCrashReporting = (config: CrashReportConfig) => 
  CrashReportingService.initialize(config);

export const captureException = (error: Error, extra?: any) => 
  CrashReportingService.captureException(error, extra);

export const captureMessage = (message: string, level?: Sentry.SeverityLevel, extra?: any) => 
  CrashReportingService.captureMessage(message, level, extra);

export const addBreadcrumb = (breadcrumb: Parameters<typeof CrashReportingService.addBreadcrumb>[0]) => 
  CrashReportingService.addBreadcrumb(breadcrumb);

export const setUser = (user: UserContext) => 
  CrashReportingService.setUser(user);

export const clearUser = () => 
  CrashReportingService.clearUser();

export const measureApiCall = <T>(name: string, operation: () => Promise<T>) => 
  CrashReportingService.measureApiCall(name, operation);