/**
 * COMPREHENSIVE PERFORMANCE MONITORING SERVICE
 * Monitors app performance, memory usage, and provides detailed analytics
 */

import { Platform, DeviceEventEmitter, AppState } from 'react-native';
import { CrashDetector } from '../utils/CrashDetector';

export interface PerformanceMetric {
  label: string;
  duration: number;
  timestamp: number;
  category: 'api' | 'navigation' | 'render' | 'animation' | 'async' | 'custom';
  metadata?: any;
}

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export interface FPSInfo {
  fps: number;
  timestamp: number;
  dropped: number;
}

export interface PerformanceReport {
  averageResponseTime: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  totalOperations: number;
  memoryUsage: MemoryInfo[];
  fpsData: FPSInfo[];
  appStartTime: number;
  reportGeneratedAt: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memorySnapshots: MemoryInfo[] = [];
  private fpsData: FPSInfo[] = [];
  private appStartTime = Date.now();
  private monitoringEnabled = true;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private fpsMonitorInterval: NodeJS.Timeout | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    try {
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      // Start FPS monitoring
      this.startFPSMonitoring();
      
      // Monitor app state changes
      AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      
      console.log('[PerformanceMonitor] Initialized successfully');
    } catch (error) {
      console.error('[PerformanceMonitor] Initialization error:', error);
    }
  }

  private startMemoryMonitoring(): void {
    // Monitor memory every 30 seconds
    this.memoryMonitorInterval = setInterval(() => {
      this.captureMemorySnapshot();
    }, 30000);
  }

  private startFPSMonitoring(): void {
    // Monitor FPS every second
    this.fpsMonitorInterval = setInterval(() => {
      this.captureFPSData();
    }, 1000);
  }

  private captureMemorySnapshot(): void {
    try {
      // Use performance.memory if available (in some React Native environments)
      const memory = (global as any).performance?.memory;
      
      if (memory) {
        const memoryInfo: MemoryInfo = {
          used: memory.usedJSHeapSize || 0,
          total: memory.totalJSHeapSize || 0,
          percentage: memory.totalJSHeapSize 
            ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 
            : 0,
          timestamp: Date.now(),
        };

        this.memorySnapshots.push(memoryInfo);

        // Keep only last 100 snapshots
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift();
        }

        // Warn about high memory usage
        if (memoryInfo.percentage > 80) {
          console.warn(`[PerformanceMonitor] High memory usage: ${memoryInfo.percentage.toFixed(2)}%`);
          
          // Report critical memory usage
          if (memoryInfo.percentage > 90) {
            CrashDetector.reportError(
              new Error(`Critical memory usage: ${memoryInfo.percentage.toFixed(2)}%`),
              { memoryInfo },
              'high'
            );
          }
        }
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Memory snapshot error:', error);
    }
  }

  private captureFPSData(): void {
    try {
      const now = Date.now();
      const fps = this.frameCount; // Approximate FPS based on frame count
      const dropped = Math.max(0, 60 - fps); // Assuming 60 FPS target

      const fpsInfo: FPSInfo = {
        fps,
        timestamp: now,
        dropped,
      };

      this.fpsData.push(fpsInfo);

      // Keep only last 60 measurements (1 minute at 1 second intervals)
      if (this.fpsData.length > 60) {
        this.fpsData.shift();
      }

      // Warn about low FPS
      if (fps < 30) {
        console.warn(`[PerformanceMonitor] Low FPS detected: ${fps}`);
      }

      // Reset frame count
      this.frameCount = 0;
    } catch (error) {
      console.error('[PerformanceMonitor] FPS capture error:', error);
    }
  }

  private handleAppStateChange(nextAppState: string): void {
    if (nextAppState === 'active') {
      // Resume monitoring when app becomes active
      this.monitoringEnabled = true;
      this.captureMemorySnapshot();
    } else if (nextAppState === 'background') {
      // Reduce monitoring frequency in background
      this.monitoringEnabled = false;
    }
  }

  // Public API
  startTiming(label: string, category: PerformanceMetric['category'] = 'custom', metadata?: any): void {
    if (!this.monitoringEnabled) return;

    const key = `${label}_${Date.now()}_${Math.random()}`;
    this.startTimes.set(key, Date.now());
    
    // Store metadata for later use
    if (metadata) {
      this.startTimes.set(`${key}_metadata`, metadata);
    }
  }

  endTiming(label: string): number {
    if (!this.monitoringEnabled) return 0;

    // Find the most recent start time for this label
    const keys = Array.from(this.startTimes.keys()).filter(key => key.startsWith(label));
    if (keys.length === 0) {
      console.warn(`[PerformanceMonitor] No start time found for label: ${label}`);
      return 0;
    }

    const key = keys[keys.length - 1]; // Get most recent
    const startTime = this.startTimes.get(key);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    const metadata = this.startTimes.get(`${key}_metadata`);

    const metric: PerformanceMetric = {
      label,
      duration,
      timestamp: Date.now(),
      category: 'custom', // Default, can be overridden
      metadata,
    };

    // Store the metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(metric);

    // Clean up
    this.startTimes.delete(key);
    if (metadata) {
      this.startTimes.delete(`${key}_metadata`);
    }

    // Log slow operations
    if (__DEV__ && duration > 1000) {
      console.warn(`[PerformanceMonitor] Slow operation: ${label} took ${duration}ms`);
    }

    // Keep only last 50 metrics per label
    const labelMetrics = this.metrics.get(label)!;
    if (labelMetrics.length > 50) {
      labelMetrics.shift();
    }

    return duration;
  }

  measureAsync<T>(
    label: string, 
    promise: Promise<T>, 
    category: PerformanceMetric['category'] = 'async',
    metadata?: any
  ): Promise<T> {
    this.startTiming(label, category, metadata);
    return promise.finally(() => {
      this.endTiming(label);
    });
  }

  measureFunction<T extends (...args: any[]) => any>(
    label: string,
    fn: T,
    category: PerformanceMetric['category'] = 'custom'
  ): T {
    return ((...args: any[]) => {
      this.startTiming(label, category);
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.finally(() => {
            this.endTiming(label);
          });
        }
        this.endTiming(label);
        return result;
      } catch (error) {
        this.endTiming(label);
        throw error;
      }
    }) as T;
  }

  // Navigation Performance
  measureNavigation(screenName: string): void {
    this.startTiming(`navigation_${screenName}`, 'navigation');
    
    // Auto-end timing after a reasonable delay
    setTimeout(() => {
      this.endTiming(`navigation_${screenName}`);
    }, 100);
  }

  // API Performance
  measureApiCall<T>(endpoint: string, promise: Promise<T>): Promise<T> {
    return this.measureAsync(`api_${endpoint}`, promise, 'api', { endpoint });
  }

  // Render Performance
  measureRender(componentName: string): () => void {
    this.startTiming(`render_${componentName}`, 'render');
    return () => this.endTiming(`render_${componentName}`);
  }

  // Frame counting (called by components during render)
  incrementFrameCount(): void {
    this.frameCount++;
  }

  // Analytics and Reporting
  getMetrics(label?: string): Record<string, PerformanceMetric[]> {
    if (label) {
      return { [label]: this.metrics.get(label) || [] };
    }
    return Object.fromEntries(this.metrics);
  }

  getAverageMetric(label: string): number {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  getSlowestMetric(label?: string): PerformanceMetric | null {
    let allMetrics: PerformanceMetric[] = [];
    
    if (label) {
      allMetrics = this.metrics.get(label) || [];
    } else {
      allMetrics = Array.from(this.metrics.values()).flat();
    }
    
    if (allMetrics.length === 0) return null;
    
    return allMetrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
  }

  getFastestMetric(label?: string): PerformanceMetric | null {
    let allMetrics: PerformanceMetric[] = [];
    
    if (label) {
      allMetrics = this.metrics.get(label) || [];
    } else {
      allMetrics = Array.from(this.metrics.values()).flat();
    }
    
    if (allMetrics.length === 0) return null;
    
    return allMetrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );
  }

  generateReport(): PerformanceReport {
    const allMetrics = Array.from(this.metrics.values()).flat();
    const totalDuration = allMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    
    return {
      averageResponseTime: allMetrics.length > 0 ? totalDuration / allMetrics.length : 0,
      slowestOperation: this.getSlowestMetric(),
      fastestOperation: this.getFastestMetric(),
      totalOperations: allMetrics.length,
      memoryUsage: [...this.memorySnapshots],
      fpsData: [...this.fpsData],
      appStartTime: this.appStartTime,
      reportGeneratedAt: Date.now(),
    };
  }

  // Memory Management
  getCurrentMemoryUsage(): MemoryInfo | null {
    return this.memorySnapshots.length > 0 
      ? this.memorySnapshots[this.memorySnapshots.length - 1] 
      : null;
  }

  getAverageMemoryUsage(): number {
    if (this.memorySnapshots.length === 0) return 0;
    
    const total = this.memorySnapshots.reduce((sum, snapshot) => sum + snapshot.percentage, 0);
    return total / this.memorySnapshots.length;
  }

  // FPS Management
  getCurrentFPS(): number {
    return this.fpsData.length > 0 
      ? this.fpsData[this.fpsData.length - 1].fps 
      : 0;
  }

  getAverageFPS(): number {
    if (this.fpsData.length === 0) return 0;
    
    const total = this.fpsData.reduce((sum, data) => sum + data.fps, 0);
    return total / this.fpsData.length;
  }

  // Configuration
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    
    if (enabled) {
      this.startMemoryMonitoring();
      this.startFPSMonitoring();
    } else {
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
      }
      if (this.fpsMonitorInterval) {
        clearInterval(this.fpsMonitorInterval);
        this.fpsMonitorInterval = null;
      }
    }
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.memorySnapshots = [];
    this.fpsData = [];
  }

  // Utility Methods
  getAppUptime(): number {
    return Date.now() - this.appStartTime;
  }

  logPerformanceSummary(): void {
    const report = this.generateReport();
    console.log('[PerformanceMonitor] Performance Summary:', {
      uptime: this.getAppUptime(),
      averageResponseTime: report.averageResponseTime,
      totalOperations: report.totalOperations,
      averageMemoryUsage: this.getAverageMemoryUsage(),
      averageFPS: this.getAverageFPS(),
    });
  }

  // Cleanup
  destroy(): void {
    this.setMonitoringEnabled(false);
    this.clearMetrics();
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default PerformanceMonitor;
