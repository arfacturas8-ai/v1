/**
 * Performance Monitoring Utilities
 * Track and optimize application performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  /**
   * Start performance measurement
   */
  start(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
      this.marks.set(name, Date.now());
    }
  }

  /**
   * End performance measurement
   */
  end(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);

      try {
        performance.measure(name, `${name}-start`, `${name}-end`);

        const measure = performance.getEntriesByName(name)[0];
        const duration = measure ? measure.duration : Date.now() - (this.marks.get(name) || 0);

        this.metrics.set(name, {
          duration,
          timestamp: Date.now()
        });

        // Cleanup marks
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);

        return duration;
      } catch (error) {
        console.warn('Performance measurement error:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Get metric by name
   */
  getMetric(name) {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.marks.clear();

    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Log performance report
   */
  report() {
    const metrics = this.getAllMetrics();

    console.group('📊 Performance Report');
    Object.entries(metrics).forEach(([name, data]) => {
      console.log(`${name}: ${data.duration.toFixed(2)}ms`);
    });
    console.groupEnd();

    return metrics;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName) => {
  return {
    onRenderStart: () => performanceMonitor.start(`render-${componentName}`),
    onRenderEnd: () => performanceMonitor.end(`render-${componentName}`)
  };
};

/**
 * Measure API call time
 */
export const measureAPICall = async (name, apiCall) => {
  performanceMonitor.start(`api-${name}`);

  try {
    const result = await apiCall();
    performanceMonitor.end(`api-${name}`);
    return result;
  } catch (error) {
    performanceMonitor.end(`api-${name}`);
    throw error;
  }
};

/**
 * Debounce function for performance
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (imageElement, src) => {
  if (!('IntersectionObserver' in window)) {
    imageElement.src = src;
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imageElement.src = src;
        imageElement.classList.add('loaded');
        observer.unobserve(imageElement);
      }
    });
  });

  observer.observe(imageElement);
};

/**
 * Measure page load performance
 */
export const measurePageLoad = () => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return null;
  }

  const perfData = performance.getEntriesByType('navigation')[0];

  if (!perfData) return null;

  return {
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    request: perfData.responseStart - perfData.requestStart,
    response: perfData.responseEnd - perfData.responseStart,
    dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    load: perfData.loadEventEnd - perfData.loadEventStart,
    total: perfData.loadEventEnd - perfData.fetchStart
  };
};

/**
 * Get FCP (First Contentful Paint)
 */
export const getFCP = () => {
  if (typeof performance === 'undefined') return null;

  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
  return fcpEntry ? fcpEntry.startTime : null;
};

/**
 * Get LCP (Largest Contentful Paint)
 */
export const getLCP = (callback) => {
  if (typeof PerformanceObserver === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    callback(lastEntry.renderTime || lastEntry.loadTime);
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
};

/**
 * Get FID (First Input Delay)
 */
export const getFID = (callback) => {
  if (typeof PerformanceObserver === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();

    entries.forEach((entry) => {
      callback(entry.processingStart - entry.startTime);
    });
  });

  observer.observe({ entryTypes: ['first-input'] });
};

/**
 * Get CLS (Cumulative Layout Shift)
 */
export const getCLS = (callback) => {
  if (typeof PerformanceObserver === 'undefined') return;

  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        callback(clsValue);
      }
    }
  });

  observer.observe({ entryTypes: ['layout-shift'] });
};

/**
 * Monitor memory usage
 */
export const getMemoryUsage = () => {
  if (typeof performance === 'undefined' || !performance.memory) {
    return null;
  }

  return {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    usedPercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
  };
};

/**
 * Report Web Vitals
 */
export const reportWebVitals = (onPerfEntry) => {
  if (!onPerfEntry || typeof onPerfEntry !== 'function') return;

  // FCP
  const fcp = getFCP();
  if (fcp) onPerfEntry({ name: 'FCP', value: fcp });

  // LCP
  getLCP((value) => onPerfEntry({ name: 'LCP', value }));

  // FID
  getFID((value) => onPerfEntry({ name: 'FID', value }));

  // CLS
  getCLS((value) => onPerfEntry({ name: 'CLS', value }));
};

export default {
  PerformanceMonitor,
  performanceMonitor,
  measureRenderTime,
  measureAPICall,
  debounce,
  throttle,
  lazyLoadImage,
  measurePageLoad,
  getFCP,
  getLCP,
  getFID,
  getCLS,
  getMemoryUsage,
  reportWebVitals
};
