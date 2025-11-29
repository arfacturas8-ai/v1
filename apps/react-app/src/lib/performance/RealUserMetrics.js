/**
 * ==============================================
 * CRYB PLATFORM - REAL USER METRICS (RUM)
 * ==============================================
 * Comprehensive performance monitoring for React application
 * Tracks Core Web Vitals, user interactions, and business metrics
 * ==============================================
 */

import * as Sentry from '@sentry/react';

class RealUserMetrics {
  constructor() {
    this.metrics = new Map();
    this.userJourney = [];
    this.sessionStart = Date.now();
    this.config = {
      apiEndpoint: import.meta.env.VITE_RUM_ENDPOINT || '/api/metrics/rum',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxMetrics: 1000,
      enableDebug: import.meta.env.MODE === 'development'
    };
    
    this.initialize();
  }

  initialize() {
    try {
      // Initialize performance observers
      this.initializePerformanceObservers();
      
      // Track Core Web Vitals
      this.trackCoreWebVitals();
      
      // Track user interactions
      this.trackUserInteractions();
      
      // Track navigation timing
      this.trackNavigationTiming();
      
      // Track resource loading
      this.trackResourceTiming();
      
      // Track custom business metrics
      this.trackBusinessMetrics();
      
      // Start periodic flushing
      this.startPeriodicFlush();
      
      // Track session lifecycle
      this.trackSessionLifecycle();
      
      this.log('RUM initialized successfully');
      
    } catch (error) {
      this.handleError('RUM initialization failed', error);
    }
  }

  // ==============================================
  // CORE WEB VITALS TRACKING
  // ==============================================

  trackCoreWebVitals() {
    // Cumulative Layout Shift (CLS)
    this.observeLayoutShift();
    
    // First Input Delay (FID)
    this.observeFirstInputDelay();
    
    // Largest Contentful Paint (LCP)
    this.observeLargestContentfulPaint();
    
    // First Contentful Paint (FCP)
    this.observeFirstContentfulPaint();
    
    // Time to First Byte (TTFB)
    this.observeTimeToFirstByte();
  }

  observeLayoutShift() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let clsEntries = [];

    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }
      
      this.recordMetric('core_web_vitals', 'cls', {
        value: clsValue,
        rating: this.getCLSRating(clsValue),
        entries: clsEntries.length,
        timestamp: Date.now()
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  observeFirstInputDelay() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      if (firstInput) {
        const fid = firstInput.processingStart - firstInput.startTime;
        
        this.recordMetric('core_web_vitals', 'fid', {
          value: fid,
          rating: this.getFIDRating(fid),
          inputType: firstInput.name,
          target: firstInput.target?.tagName || 'unknown',
          timestamp: firstInput.startTime
        });
        
        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  observeLargestContentfulPaint() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        this.recordMetric('core_web_vitals', 'lcp', {
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || 'inline',
          timestamp: Date.now()
        });
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeFirstContentfulPaint() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('core_web_vitals', 'fcp', {
            value: entry.startTime,
            rating: this.getFCPRating(entry.startTime),
            timestamp: Date.now()
          });
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  observeTimeToFirstByte() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      
      this.recordMetric('core_web_vitals', 'ttfb', {
        value: ttfb,
        rating: this.getTTFBRating(ttfb),
        timestamp: Date.now()
      });
    }
  }

  // ==============================================
  // PERFORMANCE OBSERVERS
  // ==============================================

  initializePerformanceObservers() {
    // Long tasks observer
    this.observeLongTasks();
    
    // Memory usage observer
    this.observeMemoryUsage();
    
    // Navigation observer
    this.observeNavigation();
  }

  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordMetric('performance', 'long_task', {
          duration: entry.duration,
          startTime: entry.startTime,
          attribution: entry.attribution?.[0]?.name || 'unknown',
          timestamp: Date.now()
        });
        
        // Alert on very long tasks
        if (entry.duration > 100) {
          this.triggerPerformanceAlert('long_task', {
            duration: entry.duration,
            threshold: 100
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        
        this.recordMetric('performance', 'memory', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          timestamp: Date.now()
        });
        
        // Alert on high memory usage
        const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (memoryUsagePercentage > 90) {
          this.triggerPerformanceAlert('high_memory_usage', {
            percentage: memoryUsagePercentage,
            threshold: 90
          });
        }
      }, 10000); // Every 10 seconds
    }
  }

  observeNavigation() {
    // Track page navigation performance
    window.addEventListener('beforeunload', () => {
      this.trackPageUnload();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange();
    });
  }

  // ==============================================
  // USER INTERACTION TRACKING
  // ==============================================

  trackUserInteractions() {
    // Track clicks with performance impact
    this.trackClickInteractions();
    
    // Track form interactions
    this.trackFormInteractions();
    
    // Track scroll performance
    this.trackScrollPerformance();
    
    // Track keyboard interactions
    this.trackKeyboardInteractions();
  }

  trackClickInteractions() {
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      // Use requestAnimationFrame to measure rendering delay
      requestAnimationFrame(() => {
        const renderDelay = performance.now() - startTime;
        
        this.recordMetric('user_interaction', 'click', {
          element: event.target.tagName,
          className: event.target.className,
          id: event.target.id,
          renderDelay,
          timestamp: startTime,
          coordinates: { x: event.clientX, y: event.clientY }
        });
        
        // Track slow click responses
        if (renderDelay > 100) {
          this.triggerPerformanceAlert('slow_click_response', {
            delay: renderDelay,
            element: event.target.tagName,
            threshold: 100
          });
        }
      });
    }, { passive: true });
  }

  trackFormInteractions() {
    // Track form submission performance
    document.addEventListener('submit', (event) => {
      const startTime = performance.now();
      const form = event.target;
      
      this.recordMetric('user_interaction', 'form_submit', {
        formId: form.id,
        formClass: form.className,
        fieldCount: form.elements.length,
        timestamp: startTime
      });
    });

    // Track input responsiveness
    document.addEventListener('input', this.debounce((event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const inputDelay = performance.now() - startTime;
        
        this.recordMetric('user_interaction', 'input', {
          inputType: event.target.type,
          inputDelay,
          timestamp: startTime
        });
      });
    }, 100), { passive: true });
  }

  trackScrollPerformance() {
    let scrollStartTime = null;
    let frameCount = 0;
    
    const trackScrollFrame = () => {
      if (scrollStartTime) {
        frameCount++;
        requestAnimationFrame(trackScrollFrame);
      }
    };

    document.addEventListener('scroll', this.throttle(() => {
      if (!scrollStartTime) {
        scrollStartTime = performance.now();
        frameCount = 0;
        requestAnimationFrame(trackScrollFrame);
      }
    }, 16), { passive: true });

    document.addEventListener('scrollend', () => {
      if (scrollStartTime) {
        const scrollDuration = performance.now() - scrollStartTime;
        const fps = frameCount / (scrollDuration / 1000);
        
        this.recordMetric('user_interaction', 'scroll', {
          duration: scrollDuration,
          frameCount,
          fps,
          jankyFrames: frameCount - Math.floor(fps * (scrollDuration / 1000)),
          timestamp: scrollStartTime
        });
        
        // Alert on poor scroll performance
        if (fps < 30) {
          this.triggerPerformanceAlert('poor_scroll_performance', {
            fps,
            threshold: 30
          });
        }
        
        scrollStartTime = null;
      }
    }, { passive: true });
  }

  trackKeyboardInteractions() {
    document.addEventListener('keydown', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const keyDelay = performance.now() - startTime;
        
        this.recordMetric('user_interaction', 'keydown', {
          key: event.key,
          keyCode: event.keyCode,
          delay: keyDelay,
          timestamp: startTime
        });
      });
    }, { passive: true });
  }

  // ==============================================
  // BUSINESS METRICS TRACKING
  // ==============================================

  trackBusinessMetrics() {
    // Track feature usage
    this.trackFeatureUsage();
    
    // Track user engagement
    this.trackUserEngagement();
    
    // Track conversion funnels
    this.trackConversionFunnels();
    
    // Track error impact on business metrics
    this.trackErrorBusinessImpact();
  }

  trackFeatureUsage() {
    // Track when users interact with key features
    const features = [
      { selector: '[data-feature="voice-chat"]', name: 'voice_chat' },
      { selector: '[data-feature="community"]', name: 'community' },
      { selector: '[data-feature="messaging"]', name: 'messaging' },
      { selector: '[data-feature="search"]', name: 'search' },
      { selector: '[data-feature="profile"]', name: 'profile' }
    ];

    features.forEach(({ selector, name }) => {
      document.addEventListener('click', (event) => {
        if (event.target.closest(selector)) {
          this.recordMetric('business', 'feature_usage', {
            feature: name,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.sessionStart
          });
        }
      });
    });
  }

  trackUserEngagement() {
    let engagementScore = 0;
    let lastInteraction = Date.now();
    
    const updateEngagement = () => {
      const timeSinceLastInteraction = Date.now() - lastInteraction;
      
      if (timeSinceLastInteraction < 30000) { // Active in last 30 seconds
        engagementScore += 1;
      }
      
      this.recordMetric('business', 'engagement', {
        score: engagementScore,
        sessionDuration: Date.now() - this.sessionStart,
        lastInteraction: timeSinceLastInteraction,
        timestamp: Date.now()
      });
    };

    // Update engagement score every 30 seconds
    setInterval(updateEngagement, 30000);

    // Track user interactions for engagement
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        lastInteraction = Date.now();
      }, { passive: true });
    });
  }

  trackConversionFunnels() {
    const funnelSteps = [
      'landing_page_view',
      'signup_form_view',
      'signup_form_submit',
      'email_verification',
      'profile_setup',
      'first_community_join',
      'first_message_sent'
    ];

    // Track funnel progression
    this.trackFunnelStep = (step, metadata = {}) => {
      if (funnelSteps.includes(step)) {
        this.recordMetric('business', 'conversion_funnel', {
          step,
          stepIndex: funnelSteps.indexOf(step),
          metadata,
          sessionDuration: Date.now() - this.sessionStart,
          timestamp: Date.now()
        });
        
        this.userJourney.push({
          step,
          timestamp: Date.now(),
          metadata
        });
      }
    };
  }

  trackErrorBusinessImpact() {
    // Override console.error to track JavaScript errors with business context
    const originalError = console.error;
    console.error = (...args) => {
      this.recordMetric('business', 'error_impact', {
        error: args[0]?.toString?.() || 'Unknown error',
        currentPage: window.location.pathname,
        userJourneyStep: this.userJourney[this.userJourney.length - 1]?.step || 'unknown',
        sessionDuration: Date.now() - this.sessionStart,
        timestamp: Date.now()
      });
      
      originalError.apply(console, args);
    };

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('business', 'error_impact', {
        error: 'Unhandled Promise Rejection',
        reason: event.reason?.toString?.() || 'Unknown reason',
        currentPage: window.location.pathname,
        userJourneyStep: this.userJourney[this.userJourney.length - 1]?.step || 'unknown',
        sessionDuration: Date.now() - this.sessionStart,
        timestamp: Date.now()
      });
    });
  }

  // ==============================================
  // RESOURCE TIMING TRACKING
  // ==============================================

  trackResourceTiming() {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.recordMetric('resource', 'timing', {
          name: entry.name,
          type: this.getResourceType(entry.name),
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          timestamp: entry.startTime
        });
        
        // Alert on slow resource loading
        if (entry.duration > 5000) { // 5 seconds
          this.triggerPerformanceAlert('slow_resource_loading', {
            resource: entry.name,
            duration: entry.duration,
            threshold: 5000
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // ==============================================
  // SESSION LIFECYCLE TRACKING
  // ==============================================

  trackSessionLifecycle() {
    // Track page load
    window.addEventListener('load', () => {
      this.recordMetric('session', 'page_load', {
        loadTime: performance.now(),
        timestamp: Date.now()
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackPageUnload();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange();
    });

    // Track online/offline status
    window.addEventListener('online', () => {
      this.recordMetric('session', 'connectivity', {
        status: 'online',
        timestamp: Date.now()
      });
    });

    window.addEventListener('offline', () => {
      this.recordMetric('session', 'connectivity', {
        status: 'offline',
        timestamp: Date.now()
      });
    });
  }

  trackPageUnload() {
    const sessionDuration = Date.now() - this.sessionStart;
    
    this.recordMetric('session', 'unload', {
      sessionDuration,
      userJourney: this.userJourney,
      finalPage: window.location.pathname,
      timestamp: Date.now()
    });
    
    // Send any remaining metrics immediately
    this.flush();
  }

  trackVisibilityChange() {
    this.recordMetric('session', 'visibility_change', {
      visibilityState: document.visibilityState,
      timestamp: Date.now()
    });
  }

  // ==============================================
  // NAVIGATION TIMING
  // ==============================================

  trackNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
          this.recordMetric('navigation', 'timing', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domComplete: navigation.domComplete - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            domProcessing: navigation.domComplete - navigation.responseEnd,
            timestamp: Date.now()
          });
        }
      }, 0);
    });
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  recordMetric(category, type, data) {
    const metric = {
      id: this.generateId(),
      category,
      type,
      data,
      timestamp: data.timestamp || Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    this.metrics.set(metric.id, metric);
    
    if (this.config.enableDebug) {
      this.log('Metric recorded', metric);
    }

    // Send to Sentry for real-time monitoring
    Sentry.addBreadcrumb({
      category: 'rum',
      message: `${category}:${type}`,
      data,
      level: 'info'
    });

    // Auto-flush if batch size is reached
    if (this.metrics.size >= this.config.batchSize) {
      this.flush();
    }

    // Prevent memory leaks by limiting stored metrics
    if (this.metrics.size > this.config.maxMetrics) {
      const oldestKey = this.metrics.keys().next().value;
      this.metrics.delete(oldestKey);
    }
  }

  triggerPerformanceAlert(alertType, data) {
    Sentry.captureMessage('Performance Alert', {
      level: 'warning',
      tags: {
        alert_type: alertType,
        performance_issue: true
      },
      extra: data
    });

    this.recordMetric('alert', 'performance', {
      alertType,
      ...data
    });
  }

  flush() {
    if (this.metrics.size === 0) return;

    const metricsArray = Array.from(this.metrics.values());
    this.metrics.clear();

    // Send to backend
    this.sendMetrics(metricsArray);
  }

  async sendMetrics(metrics) {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.log(`Sent ${metrics.length} metrics to backend`);

    } catch (error) {
      this.handleError('Failed to send metrics', error);
      
      // Re-add metrics to queue for retry (with limit)
      if (this.metrics.size < this.config.maxMetrics / 2) {
        metrics.forEach(metric => this.metrics.set(metric.id, metric));
      }
    }
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // ==============================================
  // RATING HELPERS
  // ==============================================

  getCLSRating(value) {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  getFIDRating(value) {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  getLCPRating(value) {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  getFCPRating(value) {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  getTTFBRating(value) {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  // ==============================================
  // UTILITY HELPERS
  // ==============================================

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
    if (url.match(/\.(mp4|webm|ogg)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
    if (url.includes('/api/')) return 'xhr';
    return 'other';
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('rum-session-id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('rum-session-id', sessionId);
    }
    return sessionId;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  log(...args) {
    if (this.config.enableDebug) {
      console.log('[RUM]', ...args);
    }
  }

  handleError(message, error) {
    console.error('[RUM]', message, error);
    Sentry.captureException(error, {
      tags: { source: 'rum' },
      extra: { message }
    });
  }

  // ==============================================
  // PUBLIC API
  // ==============================================

  // Track custom business events
  trackEvent(event, data = {}) {
    this.recordMetric('custom', 'event', {
      event,
      ...data
    });
  }

  // Track conversion funnel steps
  trackFunnelStep(step, metadata = {}) {
    this.recordMetric('business', 'conversion_funnel', {
      step,
      metadata,
      sessionDuration: Date.now() - this.sessionStart,
      timestamp: Date.now()
    });
  }

  // Track performance timing for custom operations
  trackTiming(name, startTime, endTime = performance.now()) {
    this.recordMetric('custom', 'timing', {
      name,
      duration: endTime - startTime,
      startTime,
      endTime
    });
  }

  // Get current performance summary
  getPerformanceSummary() {
    const metrics = Array.from(this.metrics.values());
    return {
      totalMetrics: metrics.length,
      sessionDuration: Date.now() - this.sessionStart,
      userJourney: this.userJourney,
      lastMetric: metrics[metrics.length - 1]
    };
  }
}

// Export singleton instance
export default new RealUserMetrics();