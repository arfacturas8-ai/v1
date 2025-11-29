/**
 * Performance Testing Helpers
 * Utilities for measuring and analyzing performance metrics
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.startTime = performance.now();
  }

  /**
   * Start measuring a specific metric
   */
  startMeasure(name) {
    const startTime = performance.now();
    this.metrics.set(name, { startTime, measurements: [] });
    return startTime;
  }

  /**
   * End measuring a specific metric
   */
  endMeasure(name) {
    const endTime = performance.now();
    const metric = this.metrics.get(name);
    
    if (metric) {
      const duration = endTime - metric.startTime;
      metric.measurements.push(duration);
      return duration;
    }
    
    return null;
  }

  /**
   * Record a custom metric value
   */
  recordMetric(name, value, unit = 'ms') {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { measurements: [], unit });
    }
    
    this.metrics.get(name).measurements.push(value);
  }

  /**
   * Get performance statistics for a metric
   */
  getStats(name) {
    const metric = this.metrics.get(name);
    if (!metric || metric.measurements.length === 0) {
      return null;
    }

    const measurements = metric.measurements;
    const sorted = [...measurements].sort((a, b) => a - b);
    
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      mean: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      unit: metric.unit || 'ms'
    };
  }

  /**
   * Generate a performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testDuration: performance.now() - this.startTime,
      metrics: {}
    };

    for (const [name] of this.metrics) {
      report.metrics[name] = this.getStats(name);
    }

    return report;
  }

  /**
   * Export report to file
   */
  exportReport(filename) {
    const report = this.generateReport();
    const reportPath = path.join(process.cwd(), 'test-results', filename);
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.isMonitoring = false;
  }

  start(interval = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      const usage = process.memoryUsage();
      this.snapshots.push({
        timestamp: Date.now(),
        ...usage
      });
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isMonitoring = false;
    }
  }

  getMemoryReport() {
    if (this.snapshots.length === 0) return null;

    const metrics = ['rss', 'heapUsed', 'heapTotal', 'external'];
    const report = {
      sampleCount: this.snapshots.length,
      duration: this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp,
      metrics: {}
    };

    metrics.forEach(metric => {
      const values = this.snapshots.map(s => s[metric]);
      const sorted = [...values].sort((a, b) => a - b);
      
      report.metrics[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        unit: 'bytes'
      };
    });

    return report;
  }

  detectMemoryLeaks() {
    if (this.snapshots.length < 10) return null;

    const recentSnapshots = this.snapshots.slice(-10);
    const earlySnapshots = this.snapshots.slice(0, 10);
    
    const recentAvg = recentSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / recentSnapshots.length;
    const earlyAvg = earlySnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / earlySnapshots.length;
    
    const growthRate = (recentAvg - earlyAvg) / earlyAvg;
    
    return {
      suspiciousGrowth: growthRate > 0.1, // 10% growth
      growthRate,
      earlyAverage: earlyAvg,
      recentAverage: recentAvg
    };
  }
}

/**
 * Network performance monitor
 */
export class NetworkMonitor {
  constructor() {
    this.requests = [];
  }

  recordRequest(url, method, startTime, endTime, size, status) {
    this.requests.push({
      url,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      size,
      status,
      timestamp: Date.now()
    });
  }

  getNetworkStats() {
    if (this.requests.length === 0) return null;

    const durations = this.requests.map(r => r.duration);
    const sizes = this.requests.filter(r => r.size).map(r => r.size);
    const sorted = [...durations].sort((a, b) => a - b);
    
    return {
      totalRequests: this.requests.length,
      successfulRequests: this.requests.filter(r => r.status >= 200 && r.status < 400).length,
      failedRequests: this.requests.filter(r => r.status >= 400).length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianDuration: sorted[Math.floor(sorted.length / 2)],
      p95Duration: sorted[Math.floor(sorted.length * 0.95)],
      totalDataTransferred: sizes.reduce((a, b) => a + b, 0),
      avgRequestSize: sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0
    };
  }

  getSlowRequests(threshold = 1000) {
    return this.requests.filter(r => r.duration > threshold);
  }
}

/**
 * Web Vitals monitor for browser performance
 */
export class WebVitalsMonitor {
  constructor() {
    this.vitals = {};
    this.setupObservers();
  }

  setupObservers() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcpEntry = entries[entries.length - 1];
      this.vitals.lcp = lcpEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      this.vitals.fid = firstInput.processingStart - firstInput.startTime;
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.vitals.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  getWebVitals() {
    return {
      lcp: this.vitals.lcp || null, // Should be < 2.5s
      fid: this.vitals.fid || null, // Should be < 100ms
      cls: this.vitals.cls || null, // Should be < 0.1
      scores: {
        lcp: this.vitals.lcp ? (this.vitals.lcp <= 2500 ? 'good' : this.vitals.lcp <= 4000 ? 'needs-improvement' : 'poor') : null,
        fid: this.vitals.fid ? (this.vitals.fid <= 100 ? 'good' : this.vitals.fid <= 300 ? 'needs-improvement' : 'poor') : null,
        cls: this.vitals.cls ? (this.vitals.cls <= 0.1 ? 'good' : this.vitals.cls <= 0.25 ? 'needs-improvement' : 'poor') : null
      }
    };
  }
}

/**
 * Performance test utilities
 */
export const performanceUtils = {
  /**
   * Measure function execution time
   */
  async measureFunction(fn, iterations = 1) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      measurements.push(end - start);
    }
    
    return {
      measurements,
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements)
    };
  },

  /**
   * Create test data of specified size
   */
  generateTestData(size) {
    const data = [];
    for (let i = 0; i < size; i++) {
      data.push({
        id: i,
        name: `Test Item ${i}`,
        value: Math.random() * 1000,
        timestamp: Date.now() + i,
        data: 'x'.repeat(100) // Add some bulk
      });
    }
    return data;
  },

  /**
   * Simulate network delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Calculate percentiles
   */
  calculatePercentiles(values, percentiles = [50, 90, 95, 99]) {
    const sorted = [...values].sort((a, b) => a - b);
    const result = {};
    
    percentiles.forEach(p => {
      const index = Math.floor((sorted.length - 1) * (p / 100));
      result[`p${p}`] = sorted[index];
    });
    
    return result;
  }
};

export { PerformanceMonitor, MemoryMonitor, NetworkMonitor, WebVitalsMonitor };