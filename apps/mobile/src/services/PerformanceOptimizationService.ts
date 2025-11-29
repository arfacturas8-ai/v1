/**
 * PERFORMANCE OPTIMIZATION SERVICE
 * Advanced performance monitoring and optimization for production-ready mobile app
 */

import { InteractionManager, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { MMKV } from 'react-native-mmkv';
import { CrashDetector } from '../utils/CrashDetector';

// Performance metrics storage
const perfStorage = new MMKV({
  id: 'cryb-performance',
});

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryLevel: number;
  networkLatency: number;
  frameDrops: number;
  appLaunchTime: number;
  screenTransitionTime: number;
}

interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // %
  maxFrameDrops: number;
  maxNetworkLatency: number; // ms
  lowBatteryThreshold: number; // %
}

interface OptimizationSettings {
  imageQuality: 'low' | 'medium' | 'high';
  animationsEnabled: boolean;
  cacheSize: number; // MB
  prefetchEnabled: boolean;
  backgroundSyncEnabled: boolean;
  batterySaverMode: boolean;
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: PerformanceMetrics[] = [];
  private optimizationSettings: OptimizationSettings;
  private appLaunchTime: number = Date.now();
  private frameDropCounter: number = 0;

  private thresholds: PerformanceThresholds = {
    maxMemoryUsage: 150, // 150MB
    maxCpuUsage: 80, // 80%
    maxFrameDrops: 5,
    maxNetworkLatency: 1000, // 1 second
    lowBatteryThreshold: 20, // 20%
  };

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  constructor() {
    this.optimizationSettings = this.loadOptimizationSettings();
  }

  async initialize(): Promise<void> {
    try {
      // Detect device capabilities
      await this.detectDeviceCapabilities();
      
      // Set up performance monitoring
      this.startPerformanceMonitoring();
      
      // Set up frame drop detection
      this.setupFrameDropDetection();
      
      // Apply initial optimizations
      await this.applyInitialOptimizations();
      
      console.log('[PerformanceOptimizationService] Initialized successfully');
    } catch (error) {
      console.error('[PerformanceOptimizationService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializePerformanceOptimization' },
        'medium'
      );
    }
  }

  private async detectDeviceCapabilities(): Promise<void> {
    try {
      const { width, height } = Dimensions.get('screen');
      const deviceType = Device.deviceType;
      const totalMemory = Device.totalMemory || 0;
      const pixelRatio = PixelRatio.get();
      
      const deviceInfo = {
        screenWidth: width,
        screenHeight: height,
        deviceType,
        totalMemory: totalMemory / (1024 * 1024), // Convert to MB
        pixelRatio,
        isLowEndDevice: this.isLowEndDevice(totalMemory, deviceType),
      };

      console.log('[PerformanceOptimizationService] Device capabilities:', deviceInfo);
      
      // Adjust settings based on device capabilities
      if (deviceInfo.isLowEndDevice) {
        this.optimizationSettings = {
          ...this.optimizationSettings,
          imageQuality: 'low',
          animationsEnabled: false,
          cacheSize: 50, // Smaller cache for low-end devices
          prefetchEnabled: false,
        };
      }

      // Store device info for future reference
      perfStorage.set('device_info', JSON.stringify(deviceInfo));
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Detect device capabilities error:', error);
    }
  }

  private isLowEndDevice(totalMemory: number, deviceType: Device.DeviceType | null): boolean {
    const memoryMB = totalMemory / (1024 * 1024);
    
    // Consider devices with less than 3GB RAM as low-end
    if (memoryMB < 3000) return true;
    
    // Tablets generally have better performance
    if (deviceType === Device.DeviceType.TABLET) return false;
    
    return false;
  }

  private startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectPerformanceMetrics();
    }, 10000); // Collect metrics every 10 seconds

    console.log('[PerformanceOptimizationService] Performance monitoring started');
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Get memory usage
      const memoryUsage = await this.getMemoryUsage();
      
      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      
      // Get network latency (simplified)
      const networkLatency = await this.measureNetworkLatency();
      
      const metrics: PerformanceMetrics = {
        timestamp,
        memoryUsage,
        cpuUsage: 0, // CPU usage is harder to get on mobile
        batteryLevel: batteryLevel * 100,
        networkLatency,
        frameDrops: this.frameDropCounter,
        appLaunchTime: timestamp - this.appLaunchTime,
        screenTransitionTime: 0, // To be set by navigation events
      };

      this.performanceMetrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.performanceMetrics.length > 100) {
        this.performanceMetrics = this.performanceMetrics.slice(-100);
      }

      // Check for performance issues
      await this.checkPerformanceThresholds(metrics);
      
      // Reset frame drop counter
      this.frameDropCounter = 0;
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Collect performance metrics error:', error);
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      // Memory usage is not directly available in React Native
      // This is a placeholder - in a real app you might use a native module
      // or estimate based on app state
      return 0;
    } catch (error) {
      console.error('[PerformanceOptimizationService] Get memory usage error:', error);
      return 0;
    }
  }

  private async measureNetworkLatency(): Promise<number> {
    try {
      const startTime = Date.now();
      
      // Simple ping test
      const response = await fetch('https://api.cryb.ai/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      
      if (response.ok) {
        return endTime - startTime;
      } else {
        return 999999; // High latency for failed requests
      }
    } catch (error) {
      console.error('[PerformanceOptimizationService] Measure network latency error:', error);
      return 999999;
    }
  }

  private setupFrameDropDetection(): void {
    try {
      // This is a simplified frame drop detection
      // In a real implementation, you might use react-native-flipper-performance-plugin
      // or similar tools
      
      let lastFrameTime = Date.now();
      
      const checkFrameRate = () => {
        const currentTime = Date.now();
        const frameTime = currentTime - lastFrameTime;
        
        // Expect 60fps = ~16.67ms per frame
        // If frame time > 33ms, consider it a dropped frame
        if (frameTime > 33) {
          this.frameDropCounter++;
        }
        
        lastFrameTime = currentTime;
        requestAnimationFrame(checkFrameRate);
      };
      
      requestAnimationFrame(checkFrameRate);
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Setup frame drop detection error:', error);
    }
  }

  private async checkPerformanceThresholds(metrics: PerformanceMetrics): Promise<void> {
    try {
      let issuesDetected = false;
      
      // Check memory usage
      if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
        console.warn('[PerformanceOptimizationService] High memory usage detected:', metrics.memoryUsage, 'MB');
        await this.optimizeMemoryUsage();
        issuesDetected = true;
      }
      
      // Check frame drops
      if (metrics.frameDrops > this.thresholds.maxFrameDrops) {
        console.warn('[PerformanceOptimizationService] High frame drops detected:', metrics.frameDrops);
        await this.optimizeRendering();
        issuesDetected = true;
      }
      
      // Check network latency
      if (metrics.networkLatency > this.thresholds.maxNetworkLatency) {
        console.warn('[PerformanceOptimizationService] High network latency detected:', metrics.networkLatency, 'ms');
        await this.optimizeNetworking();
        issuesDetected = true;
      }
      
      // Check battery level
      if (metrics.batteryLevel < this.thresholds.lowBatteryThreshold) {
        console.warn('[PerformanceOptimizationService] Low battery detected:', metrics.batteryLevel, '%');
        await this.enableBatterySaverMode();
        issuesDetected = true;
      }
      
      if (issuesDetected) {
        // Save current metrics for analysis
        this.savePerformanceReport(metrics);
      }
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Check performance thresholds error:', error);
    }
  }

  // Optimization methods

  private async applyInitialOptimizations(): Promise<void> {
    try {
      console.log('[PerformanceOptimizationService] Applying initial optimizations');
      
      // Apply settings based on device capabilities
      await this.optimizeImageLoading();
      await this.optimizeCaching();
      await this.optimizeAnimations();
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Apply initial optimizations error:', error);
    }
  }

  private async optimizeMemoryUsage(): Promise<void> {
    try {
      console.log('[PerformanceOptimizationService] Optimizing memory usage');
      
      // Force garbage collection after interactions
      InteractionManager.runAfterInteractions(() => {
        // Trigger garbage collection (not directly available in JS)
        // This is more of a hint to the system
        global.gc && global.gc();
      });
      
      // Reduce image cache size
      this.optimizationSettings.cacheSize = Math.max(20, this.optimizationSettings.cacheSize * 0.8);
      
      // Disable prefetching temporarily
      this.optimizationSettings.prefetchEnabled = false;
      
      this.saveOptimizationSettings();
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize memory usage error:', error);
    }
  }

  private async optimizeRendering(): Promise<void> {
    try {
      console.log('[PerformanceOptimizationService] Optimizing rendering');
      
      // Disable animations if frame drops are too high
      this.optimizationSettings.animationsEnabled = false;
      
      // Reduce image quality
      if (this.optimizationSettings.imageQuality === 'high') {
        this.optimizationSettings.imageQuality = 'medium';
      } else if (this.optimizationSettings.imageQuality === 'medium') {
        this.optimizationSettings.imageQuality = 'low';
      }
      
      this.saveOptimizationSettings();
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize rendering error:', error);
    }
  }

  private async optimizeNetworking(): Promise<void> {
    try {
      console.log('[PerformanceOptimizationService] Optimizing networking');
      
      // Disable background sync if network is slow
      this.optimizationSettings.backgroundSyncEnabled = false;
      
      // Reduce image quality for network requests
      this.optimizationSettings.imageQuality = 'low';
      
      this.saveOptimizationSettings();
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize networking error:', error);
    }
  }

  private async enableBatterySaverMode(): Promise<void> {
    try {
      console.log('[PerformanceOptimizationService] Enabling battery saver mode');
      
      this.optimizationSettings.batterySaverMode = true;
      this.optimizationSettings.animationsEnabled = false;
      this.optimizationSettings.backgroundSyncEnabled = false;
      this.optimizationSettings.prefetchEnabled = false;
      this.optimizationSettings.imageQuality = 'low';
      
      this.saveOptimizationSettings();
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Enable battery saver mode error:', error);
    }
  }

  private async optimizeImageLoading(): Promise<void> {
    try {
      // Configure image optimization based on settings
      const imageConfig = {
        quality: this.getImageQualityValue(),
        cacheSize: this.optimizationSettings.cacheSize,
        placeholder: true,
        progressiveLoading: !this.optimizationSettings.batterySaverMode,
      };
      
      console.log('[PerformanceOptimizationService] Image optimization config:', imageConfig);
      
      // Store image config for use by image components
      perfStorage.set('image_config', JSON.stringify(imageConfig));
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize image loading error:', error);
    }
  }

  private async optimizeCaching(): Promise<void> {
    try {
      const cacheConfig = {
        maxSize: this.optimizationSettings.cacheSize * 1024 * 1024, // Convert MB to bytes
        ttl: this.optimizationSettings.batterySaverMode ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 1 hour vs 24 hours
        prefetchEnabled: this.optimizationSettings.prefetchEnabled,
      };
      
      console.log('[PerformanceOptimizationService] Cache optimization config:', cacheConfig);
      
      // Store cache config for use by cache services
      perfStorage.set('cache_config', JSON.stringify(cacheConfig));
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize caching error:', error);
    }
  }

  private async optimizeAnimations(): Promise<void> {
    try {
      const animationConfig = {
        enabled: this.optimizationSettings.animationsEnabled,
        duration: this.optimizationSettings.animationsEnabled ? 300 : 0,
        useNativeDriver: true,
        reduceMotion: this.optimizationSettings.batterySaverMode,
      };
      
      console.log('[PerformanceOptimizationService] Animation optimization config:', animationConfig);
      
      // Store animation config for use by animation components
      perfStorage.set('animation_config', JSON.stringify(animationConfig));
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Optimize animations error:', error);
    }
  }

  // Settings management

  private loadOptimizationSettings(): OptimizationSettings {
    try {
      const stored = perfStorage.getString('optimization_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PerformanceOptimizationService] Load optimization settings error:', error);
    }
    
    // Default settings
    return {
      imageQuality: 'high',
      animationsEnabled: true,
      cacheSize: 100, // 100MB
      prefetchEnabled: true,
      backgroundSyncEnabled: true,
      batterySaverMode: false,
    };
  }

  private saveOptimizationSettings(): void {
    try {
      perfStorage.set('optimization_settings', JSON.stringify(this.optimizationSettings));
    } catch (error) {
      console.error('[PerformanceOptimizationService] Save optimization settings error:', error);
    }
  }

  private getImageQualityValue(): number {
    switch (this.optimizationSettings.imageQuality) {
      case 'low': return 0.6;
      case 'medium': return 0.8;
      case 'high': return 1.0;
      default: return 0.8;
    }
  }

  private savePerformanceReport(metrics: PerformanceMetrics): void {
    try {
      const report = {
        timestamp: Date.now(),
        metrics,
        settings: this.optimizationSettings,
        deviceInfo: perfStorage.getString('device_info'),
      };
      
      // Store the last 10 performance reports
      const reportsKey = 'performance_reports';
      const existingReports = perfStorage.getString(reportsKey);
      let reports = existingReports ? JSON.parse(existingReports) : [];
      
      reports.push(report);
      reports = reports.slice(-10); // Keep only last 10
      
      perfStorage.set(reportsKey, JSON.stringify(reports));
      
    } catch (error) {
      console.error('[PerformanceOptimizationService] Save performance report error:', error);
    }
  }

  // Public methods

  getOptimizationSettings(): OptimizationSettings {
    return { ...this.optimizationSettings };
  }

  async updateOptimizationSettings(newSettings: Partial<OptimizationSettings>): Promise<void> {
    try {
      this.optimizationSettings = { ...this.optimizationSettings, ...newSettings };
      this.saveOptimizationSettings();
      
      // Apply new optimizations
      await this.applyInitialOptimizations();
      
      console.log('[PerformanceOptimizationService] Settings updated:', this.optimizationSettings);
    } catch (error) {
      console.error('[PerformanceOptimizationService] Update optimization settings error:', error);
    }
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.performanceMetrics.length > 0 
      ? this.performanceMetrics[this.performanceMetrics.length - 1]
      : null;
  }

  recordScreenTransition(transitionTime: number): void {
    if (this.performanceMetrics.length > 0) {
      const latest = this.performanceMetrics[this.performanceMetrics.length - 1];
      latest.screenTransitionTime = transitionTime;
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      const reports = perfStorage.getString('performance_reports');
      return reports ? JSON.parse(reports) : [];
    } catch (error) {
      console.error('[PerformanceOptimizationService] Get performance report error:', error);
      return [];
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      this.optimizationSettings = {
        imageQuality: 'high',
        animationsEnabled: true,
        cacheSize: 100,
        prefetchEnabled: true,
        backgroundSyncEnabled: true,
        batterySaverMode: false,
      };
      
      this.saveOptimizationSettings();
      await this.applyInitialOptimizations();
      
      console.log('[PerformanceOptimizationService] Reset to defaults');
    } catch (error) {
      console.error('[PerformanceOptimizationService] Reset to defaults error:', error);
    }
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('[PerformanceOptimizationService] Performance monitoring stopped');
  }

  cleanup(): void {
    this.stopMonitoring();
    this.performanceMetrics = [];
    console.log('[PerformanceOptimizationService] Cleaned up');
  }
}

export const performanceOptimizationService = PerformanceOptimizationService.getInstance();