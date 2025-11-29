/**
 * Production Safety Utilities
 */

export class ProductionSafety {
  static isDevelopment(): boolean {
    return __DEV__;
  }

  static isProduction(): boolean {
    return !__DEV__ && process.env.NODE_ENV === 'production';
  }

  static safeLog(message: string, ...args: any[]): void {
    if (this.isDevelopment()) {
      console.log(message, ...args);
    }
  }

  static safeError(message: string, error?: Error): void {
    if (this.isDevelopment()) {
      console.error(message, error);
    }
    // In production, send to crash reporting service
    // CrashReporting.recordError(error || new Error(message));
  }

  static validateEnvironment(): boolean {
    const requiredEnvVars = [
      'EXPO_PUBLIC_API_BASE_URL',
      'EXPO_PUBLIC_WS_URL',
      'EXPO_PUBLIC_ENVIRONMENT',
    ];

    const missing = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missing.length > 0) {
      this.safeError(`Missing environment variables: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  static sanitizeUserInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default ProductionSafety;
