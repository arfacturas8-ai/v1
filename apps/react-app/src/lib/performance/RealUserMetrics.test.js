/**
 * ==============================================
 * CRYB PLATFORM - REAL USER METRICS (RUM) TESTS
 * ==============================================
 * Comprehensive test coverage for RUM monitoring
 * ==============================================
 */

import * as Sentry from '@sentry/react';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn()
}));

// Mock environment variables
const originalEnv = import.meta.env;

describe('RealUserMetrics', () => {
  let RealUserMetrics;
  let rum;
  let performanceObserverCallbacks;
  let mockPerformanceObserver;
  let mockPerformance;
  let originalPerformance;
  let originalConsoleError;
  let eventListeners;

  beforeEach(() => {
    // Reset environment
    import.meta.env = {
      ...originalEnv,
      VITE_RUM_ENDPOINT: '/api/metrics/rum',
      MODE: 'development'
    };

    // Reset event listeners tracking
    eventListeners = {};

    // Mock performance API
    performanceObserverCallbacks = {};

    mockPerformanceObserver = jest.fn((callback) => {
      const observerType = Math.random().toString(36);
      performanceObserverCallbacks[observerType] = {
        callback,
        observe: jest.fn((options) => {
          performanceObserverCallbacks[observerType].entryTypes = options.entryTypes;
        }),
        disconnect: jest.fn()
      };
      return performanceObserverCallbacks[observerType];
    });

    mockPerformance = {
      now: jest.fn(() => Date.now()),
      getEntriesByType: jest.fn((type) => {
        if (type === 'navigation') {
          return [{
            navigationStart: 0,
            requestStart: 100,
            responseStart: 200,
            responseEnd: 300,
            domContentLoadedEventStart: 400,
            domContentLoadedEventEnd: 500,
            domComplete: 600,
            loadEventEnd: 700,
            domainLookupStart: 50,
            domainLookupEnd: 80,
            connectStart: 80,
            connectEnd: 100
          }];
        }
        return [];
      }),
      memory: {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 200000000
      }
    };

    originalPerformance = global.performance;
    global.performance = mockPerformance;
    global.PerformanceObserver = mockPerformanceObserver;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });

    // Mock sessionStorage
    const sessionStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();
    global.sessionStorage = sessionStorageMock;

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      })
    );

    // Mock addEventListener to track listeners
    const originalAddEventListener = global.addEventListener;
    global.addEventListener = jest.fn((event, handler, options) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push({ handler, options });
      if (originalAddEventListener) {
        originalAddEventListener.call(global, event, handler, options);
      }
    });

    document.addEventListener = jest.fn((event, handler, options) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push({ handler, options });
    });

    window.addEventListener = global.addEventListener;

    // Save original console.error
    originalConsoleError = console.error;

    // Mock timers
    jest.useFakeTimers();

    // Clear module cache and re-import
    jest.resetModules();

    // Dynamic import to get fresh instance
    RealUserMetrics = require('./RealUserMetrics').default;
    rum = RealUserMetrics;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    global.performance = originalPerformance;
    console.error = originalConsoleError;
    import.meta.env = originalEnv;
  });

  // ==============================================
  // INITIALIZATION TESTS
  // ==============================================

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(rum.config).toBeDefined();
      expect(rum.config.apiEndpoint).toBe('/api/metrics/rum');
      expect(rum.config.batchSize).toBe(10);
      expect(rum.config.flushInterval).toBe(30000);
      expect(rum.config.maxMetrics).toBe(1000);
      expect(rum.config.enableDebug).toBe(true);
    });

    test('should initialize metrics Map', () => {
      expect(rum.metrics).toBeInstanceOf(Map);
      expect(rum.metrics.size).toBe(0);
    });

    test('should initialize userJourney array', () => {
      expect(Array.isArray(rum.userJourney)).toBe(true);
      expect(rum.userJourney.length).toBe(0);
    });

    test('should set sessionStart timestamp', () => {
      expect(rum.sessionStart).toBeGreaterThan(0);
      expect(rum.sessionStart).toBeLessThanOrEqual(Date.now());
    });

    test('should initialize performance observers', () => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    test('should handle initialization errors gracefully', () => {
      // Mock PerformanceObserver to throw error
      global.PerformanceObserver = jest.fn(() => {
        throw new Error('PerformanceObserver not supported');
      });

      // Re-import with error
      jest.resetModules();
      const RUMWithError = require('./RealUserMetrics').default;

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  // ==============================================
  // CORE WEB VITALS TESTS
  // ==============================================

  describe('Core Web Vitals - CLS (Cumulative Layout Shift)', () => {
    test('should observe and record CLS entries', () => {
      const clsObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('layout-shift')
      );

      expect(clsObserver).toBeDefined();
      expect(clsObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['layout-shift']
      });

      // Simulate CLS entry
      const mockEntries = [
        { value: 0.05, hadRecentInput: false },
        { value: 0.03, hadRecentInput: false },
        { value: 0.1, hadRecentInput: true } // Should be ignored
      ];

      clsObserver.callback({
        getEntries: () => mockEntries
      });

      // CLS should be 0.05 + 0.03 = 0.08
      const clsMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'cls'
      );

      expect(clsMetric).toBeDefined();
      expect(clsMetric.data.value).toBe(0.08);
      expect(clsMetric.data.rating).toBe('good');
      expect(clsMetric.data.entries).toBe(2);
    });

    test('should rate CLS correctly', () => {
      expect(rum.getCLSRating(0.05)).toBe('good');
      expect(rum.getCLSRating(0.1)).toBe('good');
      expect(rum.getCLSRating(0.15)).toBe('needs-improvement');
      expect(rum.getCLSRating(0.25)).toBe('needs-improvement');
      expect(rum.getCLSRating(0.3)).toBe('poor');
    });

    test('should ignore layout shifts with recent input', () => {
      const clsObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('layout-shift')
      );

      const mockEntries = [
        { value: 0.5, hadRecentInput: true }
      ];

      clsObserver.callback({
        getEntries: () => mockEntries
      });

      const clsMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'cls'
      );

      expect(clsMetric.data.value).toBe(0);
    });
  });

  describe('Core Web Vitals - FID (First Input Delay)', () => {
    test('should observe and record FID', () => {
      const fidObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('first-input')
      );

      expect(fidObserver).toBeDefined();

      // Simulate FID entry
      const mockEntry = {
        startTime: 100,
        processingStart: 150,
        name: 'pointerdown',
        target: { tagName: 'BUTTON' }
      };

      fidObserver.callback({
        getEntries: () => [mockEntry]
      });

      const fidMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'fid'
      );

      expect(fidMetric).toBeDefined();
      expect(fidMetric.data.value).toBe(50);
      expect(fidMetric.data.rating).toBe('good');
      expect(fidMetric.data.inputType).toBe('pointerdown');
      expect(fidMetric.data.target).toBe('BUTTON');
    });

    test('should disconnect observer after first input', () => {
      const fidObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('first-input')
      );

      fidObserver.callback({
        getEntries: () => [{
          startTime: 100,
          processingStart: 200,
          name: 'click',
          target: { tagName: 'DIV' }
        }]
      });

      expect(fidObserver.disconnect).toHaveBeenCalled();
    });

    test('should rate FID correctly', () => {
      expect(rum.getFIDRating(50)).toBe('good');
      expect(rum.getFIDRating(100)).toBe('good');
      expect(rum.getFIDRating(150)).toBe('needs-improvement');
      expect(rum.getFIDRating(300)).toBe('needs-improvement');
      expect(rum.getFIDRating(400)).toBe('poor');
    });

    test('should handle missing target in FID entry', () => {
      const fidObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('first-input')
      );

      fidObserver.callback({
        getEntries: () => [{
          startTime: 100,
          processingStart: 150,
          name: 'click',
          target: null
        }]
      });

      const fidMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'fid'
      );

      expect(fidMetric.data.target).toBe('unknown');
    });
  });

  describe('Core Web Vitals - LCP (Largest Contentful Paint)', () => {
    test('should observe and record LCP', () => {
      const lcpObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('largest-contentful-paint')
      );

      expect(lcpObserver).toBeDefined();

      // Simulate LCP entries (last one is the final LCP)
      const mockEntries = [
        { startTime: 1000, element: { tagName: 'IMG' }, url: 'image.jpg' },
        { startTime: 2000, element: { tagName: 'DIV' }, url: '' }
      ];

      lcpObserver.callback({
        getEntries: () => mockEntries
      });

      const lcpMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'lcp'
      );

      expect(lcpMetric).toBeDefined();
      expect(lcpMetric.data.value).toBe(2000);
      expect(lcpMetric.data.rating).toBe('good');
      expect(lcpMetric.data.element).toBe('DIV');
      expect(lcpMetric.data.url).toBe('inline');
    });

    test('should rate LCP correctly', () => {
      expect(rum.getLCPRating(1500)).toBe('good');
      expect(rum.getLCPRating(2500)).toBe('good');
      expect(rum.getLCPRating(3000)).toBe('needs-improvement');
      expect(rum.getLCPRating(4000)).toBe('needs-improvement');
      expect(rum.getLCPRating(5000)).toBe('poor');
    });

    test('should handle missing element in LCP entry', () => {
      const lcpObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('largest-contentful-paint')
      );

      lcpObserver.callback({
        getEntries: () => [{
          startTime: 2000,
          element: null,
          url: null
        }]
      });

      const lcpMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'lcp'
      );

      expect(lcpMetric.data.element).toBe('unknown');
      expect(lcpMetric.data.url).toBe('inline');
    });
  });

  describe('Core Web Vitals - FCP (First Contentful Paint)', () => {
    test('should observe and record FCP', () => {
      const fcpObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('paint')
      );

      expect(fcpObserver).toBeDefined();

      // Simulate paint entries
      const mockEntries = [
        { name: 'first-paint', startTime: 500 },
        { name: 'first-contentful-paint', startTime: 800 }
      ];

      fcpObserver.callback({
        getEntries: () => mockEntries
      });

      const fcpMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'fcp'
      );

      expect(fcpMetric).toBeDefined();
      expect(fcpMetric.data.value).toBe(800);
      expect(fcpMetric.data.rating).toBe('good');
    });

    test('should rate FCP correctly', () => {
      expect(rum.getFCPRating(1000)).toBe('good');
      expect(rum.getFCPRating(1800)).toBe('good');
      expect(rum.getFCPRating(2000)).toBe('needs-improvement');
      expect(rum.getFCPRating(3000)).toBe('needs-improvement');
      expect(rum.getFCPRating(3500)).toBe('poor');
    });

    test('should only record first-contentful-paint events', () => {
      const fcpObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('paint')
      );

      const mockEntries = [
        { name: 'first-paint', startTime: 500 },
        { name: 'other-paint', startTime: 600 }
      ];

      rum.metrics.clear();
      fcpObserver.callback({
        getEntries: () => mockEntries
      });

      const fcpMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'fcp'
      );

      expect(fcpMetric).toBeUndefined();
    });
  });

  describe('Core Web Vitals - TTFB (Time To First Byte)', () => {
    test('should calculate and record TTFB from navigation timing', () => {
      const ttfbMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'ttfb'
      );

      expect(ttfbMetric).toBeDefined();
      // responseStart (200) - requestStart (100) = 100
      expect(ttfbMetric.data.value).toBe(100);
      expect(ttfbMetric.data.rating).toBe('good');
    });

    test('should rate TTFB correctly', () => {
      expect(rum.getTTFBRating(500)).toBe('good');
      expect(rum.getTTFBRating(800)).toBe('good');
      expect(rum.getTTFBRating(1000)).toBe('needs-improvement');
      expect(rum.getTTFBRating(1800)).toBe('needs-improvement');
      expect(rum.getTTFBRating(2000)).toBe('poor');
    });

    test('should handle missing navigation timing', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      const ttfbMetric = Array.from(RUMNew.metrics.values()).find(
        m => m.category === 'core_web_vitals' && m.type === 'ttfb'
      );

      expect(ttfbMetric).toBeUndefined();
    });
  });

  // ==============================================
  // PERFORMANCE OBSERVER TESTS
  // ==============================================

  describe('Performance Observers', () => {
    test('should observe long tasks', () => {
      const longTaskObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('longtask')
      );

      expect(longTaskObserver).toBeDefined();

      const mockEntries = [
        {
          duration: 150,
          startTime: 1000,
          attribution: [{ name: 'script' }]
        }
      ];

      longTaskObserver.callback({
        getEntries: () => mockEntries
      });

      const longTaskMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'performance' && m.type === 'long_task'
      );

      expect(longTaskMetric).toBeDefined();
      expect(longTaskMetric.data.duration).toBe(150);
      expect(longTaskMetric.data.attribution).toBe('script');
    });

    test('should trigger alert for very long tasks', () => {
      const longTaskObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('longtask')
      );

      const mockEntries = [
        {
          duration: 250,
          startTime: 1000,
          attribution: [{ name: 'unknown' }]
        }
      ];

      longTaskObserver.callback({
        getEntries: () => mockEntries
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          level: 'warning',
          tags: {
            alert_type: 'long_task',
            performance_issue: true
          },
          extra: expect.objectContaining({
            duration: 250,
            threshold: 100
          })
        })
      );
    });

    test('should handle long tasks with no attribution', () => {
      const longTaskObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('longtask')
      );

      const mockEntries = [
        {
          duration: 150,
          startTime: 1000,
          attribution: null
        }
      ];

      longTaskObserver.callback({
        getEntries: () => mockEntries
      });

      const longTaskMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'performance' && m.type === 'long_task'
      );

      expect(longTaskMetric.data.attribution).toBe('unknown');
    });

    test('should observe memory usage periodically', () => {
      jest.advanceTimersByTime(10000);

      const memoryMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'performance' && m.type === 'memory'
      );

      expect(memoryMetric).toBeDefined();
      expect(memoryMetric.data.usedJSHeapSize).toBe(50000000);
      expect(memoryMetric.data.totalJSHeapSize).toBe(100000000);
      expect(memoryMetric.data.jsHeapSizeLimit).toBe(200000000);
      expect(memoryMetric.data.memoryUsagePercentage).toBe(25);
    });

    test('should trigger alert for high memory usage', () => {
      mockPerformance.memory.usedJSHeapSize = 185000000;

      jest.advanceTimersByTime(10000);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          tags: {
            alert_type: 'high_memory_usage',
            performance_issue: true
          },
          extra: expect.objectContaining({
            percentage: 92.5,
            threshold: 90
          })
        })
      );
    });

    test('should handle missing performance.memory API', () => {
      delete mockPerformance.memory;

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      jest.advanceTimersByTime(10000);

      const memoryMetric = Array.from(RUMNew.metrics.values()).find(
        m => m.category === 'performance' && m.type === 'memory'
      );

      expect(memoryMetric).toBeUndefined();
    });
  });

  // ==============================================
  // USER INTERACTION TRACKING TESTS
  // ==============================================

  describe('User Interaction Tracking', () => {
    test('should track click interactions', () => {
      const clickHandler = eventListeners['click']?.[0]?.handler;
      expect(clickHandler).toBeDefined();

      const mockEvent = {
        target: {
          tagName: 'BUTTON',
          className: 'btn-primary',
          id: 'submit-btn'
        },
        clientX: 100,
        clientY: 200
      };

      clickHandler(mockEvent);

      jest.advanceTimersByTime(100);

      const clickMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'user_interaction' && m.type === 'click'
      );

      expect(clickMetric).toBeDefined();
      expect(clickMetric.data.element).toBe('BUTTON');
      expect(clickMetric.data.className).toBe('btn-primary');
      expect(clickMetric.data.id).toBe('submit-btn');
      expect(clickMetric.data.coordinates).toEqual({ x: 100, y: 200 });
    });

    test('should trigger alert for slow click responses', () => {
      const clickHandler = eventListeners['click']?.[0]?.handler;

      // Mock slow render
      mockPerformance.now = jest.fn()
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200);

      const mockEvent = {
        target: {
          tagName: 'BUTTON',
          className: '',
          id: ''
        },
        clientX: 0,
        clientY: 0
      };

      clickHandler(mockEvent);
      jest.advanceTimersByTime(100);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          tags: {
            alert_type: 'slow_click_response',
            performance_issue: true
          }
        })
      );
    });

    test('should track form submission', () => {
      const submitHandler = eventListeners['submit']?.[0]?.handler;
      expect(submitHandler).toBeDefined();

      const mockForm = {
        id: 'login-form',
        className: 'form-container',
        elements: [{}, {}, {}]
      };

      submitHandler({ target: mockForm });

      const formMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'user_interaction' && m.type === 'form_submit'
      );

      expect(formMetric).toBeDefined();
      expect(formMetric.data.formId).toBe('login-form');
      expect(formMetric.data.fieldCount).toBe(3);
    });

    test('should track input responsiveness with debounce', () => {
      const inputHandlers = eventListeners['input'];
      expect(inputHandlers).toBeDefined();
      expect(inputHandlers.length).toBeGreaterThan(0);

      const mockEvent = {
        target: {
          type: 'text'
        }
      };

      // Trigger multiple inputs rapidly
      inputHandlers[0].handler(mockEvent);
      inputHandlers[0].handler(mockEvent);
      inputHandlers[0].handler(mockEvent);

      // Fast-forward past debounce
      jest.advanceTimersByTime(150);

      // Should only record once due to debounce
      const inputMetrics = Array.from(rum.metrics.values()).filter(
        m => m.category === 'user_interaction' && m.type === 'input'
      );

      expect(inputMetrics.length).toBeLessThanOrEqual(1);
    });

    test('should track scroll performance', () => {
      const scrollHandlers = eventListeners['scroll'];
      expect(scrollHandlers).toBeDefined();

      // Simulate scroll start
      scrollHandlers[0].handler();
      jest.advanceTimersByTime(20);

      // Simulate scroll end
      const scrollendHandlers = eventListeners['scrollend'];
      expect(scrollendHandlers).toBeDefined();
      scrollendHandlers[0].handler();

      const scrollMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'user_interaction' && m.type === 'scroll'
      );

      expect(scrollMetric).toBeDefined();
      expect(scrollMetric.data.duration).toBeGreaterThan(0);
    });

    test('should trigger alert for poor scroll performance', () => {
      const scrollHandlers = eventListeners['scroll'];
      scrollHandlers[0].handler();

      // Mock poor FPS
      mockPerformance.now = jest.fn()
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const scrollendHandlers = eventListeners['scrollend'];
      scrollendHandlers[0].handler();

      jest.advanceTimersByTime(100);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          tags: {
            alert_type: 'poor_scroll_performance',
            performance_issue: true
          }
        })
      );
    });

    test('should track keyboard interactions', () => {
      const keydownHandlers = eventListeners['keydown'];
      expect(keydownHandlers).toBeDefined();

      const mockEvent = {
        key: 'Enter',
        keyCode: 13
      };

      keydownHandlers[0].handler(mockEvent);
      jest.advanceTimersByTime(100);

      const keyMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'user_interaction' && m.type === 'keydown'
      );

      expect(keyMetric).toBeDefined();
      expect(keyMetric.data.key).toBe('Enter');
      expect(keyMetric.data.keyCode).toBe(13);
    });
  });

  // ==============================================
  // BUSINESS METRICS TRACKING TESTS
  // ==============================================

  describe('Business Metrics Tracking', () => {
    test('should track feature usage', () => {
      const clickHandlers = eventListeners['click'];

      const mockEvent = {
        target: {
          closest: jest.fn((selector) => {
            if (selector === '[data-feature="voice-chat"]') {
              return true;
            }
            return null;
          }),
          tagName: 'BUTTON',
          className: '',
          id: ''
        },
        clientX: 0,
        clientY: 0
      };

      clickHandlers[0].handler(mockEvent);

      const featureMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'business' && m.type === 'feature_usage'
      );

      expect(featureMetric).toBeDefined();
      expect(featureMetric.data.feature).toBe('voice_chat');
    });

    test('should track user engagement score', () => {
      // Simulate user interactions
      const clickHandlers = eventListeners['click'];
      clickHandlers[0].handler({
        target: { tagName: 'DIV', className: '', id: '', closest: () => null },
        clientX: 0,
        clientY: 0
      });

      // Advance time to trigger engagement tracking
      jest.advanceTimersByTime(30000);

      const engagementMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'business' && m.type === 'engagement'
      );

      expect(engagementMetric).toBeDefined();
      expect(engagementMetric.data.score).toBeGreaterThanOrEqual(0);
      expect(engagementMetric.data.sessionDuration).toBeGreaterThan(0);
    });

    test('should track conversion funnel steps', () => {
      rum.trackFunnelStep('signup_form_view', { source: 'homepage' });

      const funnelMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'business' && m.type === 'conversion_funnel'
      );

      expect(funnelMetric).toBeDefined();
      expect(funnelMetric.data.step).toBe('signup_form_view');
      expect(funnelMetric.data.metadata.source).toBe('homepage');
      expect(rum.userJourney.length).toBeGreaterThan(0);
    });

    test('should only track valid funnel steps', () => {
      const initialMetricsCount = rum.metrics.size;

      rum.trackFunnelStep('invalid_step');

      // Should not create a metric for invalid step
      const funnelMetrics = Array.from(rum.metrics.values()).filter(
        m => m.category === 'business' && m.type === 'conversion_funnel'
      );

      expect(funnelMetrics.length).toBe(0);
    });

    test('should track error business impact', () => {
      rum.trackFunnelStep('signup_form_submit');

      const errorHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      errorHandler({
        reason: new Error('Network failure')
      });

      const errorMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'business' && m.type === 'error_impact'
      );

      expect(errorMetric).toBeDefined();
      expect(errorMetric.data.error).toBe('Unhandled Promise Rejection');
      expect(errorMetric.data.userJourneyStep).toBe('signup_form_submit');
    });

    test('should override console.error to track errors', () => {
      const testError = new Error('Test error');
      console.error(testError);

      const errorMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'business' && m.type === 'error_impact'
      );

      expect(errorMetric).toBeDefined();
      expect(errorMetric.data.error).toContain('Test error');
    });
  });

  // ==============================================
  // RESOURCE TIMING TESTS
  // ==============================================

  describe('Resource Timing', () => {
    test('should track resource loading', () => {
      const resourceObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('resource')
      );

      expect(resourceObserver).toBeDefined();

      const mockEntries = [
        {
          name: 'https://example.com/script.js',
          duration: 150,
          transferSize: 5000,
          decodedBodySize: 5000,
          startTime: 100
        },
        {
          name: 'https://example.com/style.css',
          duration: 200,
          transferSize: 0,
          decodedBodySize: 3000,
          startTime: 200
        }
      ];

      resourceObserver.callback({
        getEntries: () => mockEntries
      });

      const resourceMetrics = Array.from(rum.metrics.values()).filter(
        m => m.category === 'resource' && m.type === 'timing'
      );

      expect(resourceMetrics.length).toBe(2);
      expect(resourceMetrics[0].data.type).toBe('script');
      expect(resourceMetrics[0].data.cached).toBe(false);
      expect(resourceMetrics[1].data.type).toBe('stylesheet');
      expect(resourceMetrics[1].data.cached).toBe(true);
    });

    test('should trigger alert for slow resource loading', () => {
      const resourceObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('resource')
      );

      const mockEntries = [
        {
          name: 'https://example.com/large-image.jpg',
          duration: 6000,
          transferSize: 1000000,
          decodedBodySize: 1000000,
          startTime: 100
        }
      ];

      resourceObserver.callback({
        getEntries: () => mockEntries
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          tags: {
            alert_type: 'slow_resource_loading',
            performance_issue: true
          },
          extra: expect.objectContaining({
            resource: 'https://example.com/large-image.jpg',
            duration: 6000,
            threshold: 5000
          })
        })
      );
    });

    test('should correctly identify resource types', () => {
      expect(rum.getResourceType('app.js')).toBe('script');
      expect(rum.getResourceType('style.css')).toBe('stylesheet');
      expect(rum.getResourceType('image.png')).toBe('image');
      expect(rum.getResourceType('image.jpg')).toBe('image');
      expect(rum.getResourceType('image.svg')).toBe('image');
      expect(rum.getResourceType('video.mp4')).toBe('video');
      expect(rum.getResourceType('audio.mp3')).toBe('audio');
      expect(rum.getResourceType('/api/users')).toBe('xhr');
      expect(rum.getResourceType('unknown.txt')).toBe('other');
    });
  });

  // ==============================================
  // NAVIGATION TIMING TESTS
  // ==============================================

  describe('Navigation Timing', () => {
    test('should track navigation timing metrics', () => {
      const loadHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      expect(loadHandler).toBeDefined();
      loadHandler();

      jest.advanceTimersByTime(100);

      const navMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'navigation' && m.type === 'timing'
      );

      expect(navMetric).toBeDefined();
      expect(navMetric.data.domContentLoaded).toBe(100);
      expect(navMetric.data.domComplete).toBe(600);
      expect(navMetric.data.loadComplete).toBe(700);
      expect(navMetric.data.dnsLookup).toBe(30);
      expect(navMetric.data.tcpConnect).toBe(20);
      expect(navMetric.data.request).toBe(100);
      expect(navMetric.data.response).toBe(100);
      expect(navMetric.data.domProcessing).toBe(300);
    });
  });

  // ==============================================
  // SESSION LIFECYCLE TESTS
  // ==============================================

  describe('Session Lifecycle', () => {
    test('should track page load', () => {
      const loadHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];

      loadHandler();

      const loadMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'session' && m.type === 'page_load'
      );

      expect(loadMetric).toBeDefined();
      expect(loadMetric.data.loadTime).toBeGreaterThanOrEqual(0);
    });

    test('should track page unload', () => {
      const unloadHandlers = global.addEventListener.mock.calls.filter(
        call => call[0] === 'beforeunload'
      );

      expect(unloadHandlers.length).toBeGreaterThan(0);

      unloadHandlers[0][1]();

      const unloadMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'session' && m.type === 'unload'
      );

      expect(unloadMetric).toBeDefined();
      expect(unloadMetric.data.sessionDuration).toBeGreaterThanOrEqual(0);
      expect(unloadMetric.data.finalPage).toBeDefined();
    });

    test('should track visibility changes', () => {
      const visibilityHandler = document.addEventListener.mock.calls.find(
        call => call[0] === 'visibilitychange'
      )?.[1];

      document.visibilityState = 'hidden';
      visibilityHandler();

      const visibilityMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'session' && m.type === 'visibility_change'
      );

      expect(visibilityMetric).toBeDefined();
      expect(visibilityMetric.data.visibilityState).toBe('hidden');
    });

    test('should track online/offline status', () => {
      const onlineHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];

      const offlineHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];

      onlineHandler();
      const onlineMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'session' && m.type === 'connectivity' && m.data.status === 'online'
      );
      expect(onlineMetric).toBeDefined();

      offlineHandler();
      const offlineMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'session' && m.type === 'connectivity' && m.data.status === 'offline'
      );
      expect(offlineMetric).toBeDefined();
    });
  });

  // ==============================================
  // METRICS RECORDING AND MANAGEMENT TESTS
  // ==============================================

  describe('Metrics Recording and Management', () => {
    test('should record metric with all required fields', () => {
      rum.recordMetric('test', 'example', { value: 123 });

      const metric = Array.from(rum.metrics.values())[0];

      expect(metric).toMatchObject({
        id: expect.any(String),
        category: 'test',
        type: 'example',
        data: { value: 123 },
        timestamp: expect.any(Number),
        url: expect.any(String),
        userAgent: expect.any(String),
        sessionId: expect.any(String)
      });
    });

    test('should send breadcrumb to Sentry', () => {
      rum.recordMetric('test', 'example', { value: 456 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'rum',
          message: 'test:example',
          data: { value: 456 },
          level: 'info'
        })
      );
    });

    test('should auto-flush when batch size is reached', () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      for (let i = 0; i < 10; i++) {
        rum.recordMetric('test', 'batch', { index: i });
      }

      expect(fetchSpy).toHaveBeenCalled();
    });

    test('should prevent memory leaks by limiting stored metrics', () => {
      // Record more than maxMetrics
      for (let i = 0; i < 1050; i++) {
        rum.recordMetric('test', 'memory', { index: i });
      }

      // Should not exceed maxMetrics + batchSize
      expect(rum.metrics.size).toBeLessThanOrEqual(rum.config.maxMetrics);
    });

    test('should generate unique IDs', () => {
      const id1 = rum.generateId();
      const id2 = rum.generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });

    test('should manage session ID in sessionStorage', () => {
      const sessionId1 = rum.getSessionId();
      const sessionId2 = rum.getSessionId();

      expect(sessionId1).toBe(sessionId2);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'rum-session-id',
        expect.any(String)
      );
    });
  });

  // ==============================================
  // METRICS BATCHING AND FLUSHING TESTS
  // ==============================================

  describe('Metrics Batching and Flushing', () => {
    test('should flush metrics to backend', async () => {
      rum.recordMetric('test', 'flush', { value: 1 });
      rum.recordMetric('test', 'flush', { value: 2 });

      await rum.flush();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/metrics/rum',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        })
      );
    });

    test('should clear metrics after successful flush', async () => {
      rum.recordMetric('test', 'clear', { value: 1 });
      expect(rum.metrics.size).toBeGreaterThan(0);

      await rum.flush();
      jest.advanceTimersByTime(100);

      expect(rum.metrics.size).toBe(0);
    });

    test('should not flush if no metrics', async () => {
      rum.metrics.clear();
      const fetchSpy = jest.spyOn(global, 'fetch');

      rum.flush();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('should handle flush errors and retry', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      rum.recordMetric('test', 'error', { value: 1 });
      const metricsCount = rum.metrics.size;

      await rum.flush();
      jest.advanceTimersByTime(100);

      expect(Sentry.captureException).toHaveBeenCalled();
      expect(rum.metrics.size).toBe(metricsCount);
    });

    test('should not retry if metrics exceed half of maxMetrics', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Add more than maxMetrics / 2
      for (let i = 0; i < 600; i++) {
        rum.recordMetric('test', 'no-retry', { index: i });
      }

      await rum.flush();
      jest.advanceTimersByTime(100);

      expect(rum.metrics.size).toBe(0);
    });

    test('should flush periodically', () => {
      const flushSpy = jest.spyOn(rum, 'flush');

      jest.advanceTimersByTime(30000);

      expect(flushSpy).toHaveBeenCalled();
    });

    test('should handle HTTP errors in sendMetrics', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      rum.recordMetric('test', 'http-error', { value: 1 });
      await rum.flush();

      jest.advanceTimersByTime(100);

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  // ==============================================
  // PUBLIC API TESTS
  // ==============================================

  describe('Public API', () => {
    test('should track custom events', () => {
      rum.trackEvent('button_clicked', { buttonId: 'submit' });

      const eventMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'custom' && m.type === 'event'
      );

      expect(eventMetric).toBeDefined();
      expect(eventMetric.data.event).toBe('button_clicked');
      expect(eventMetric.data.buttonId).toBe('submit');
    });

    test('should track custom timing', () => {
      const startTime = performance.now();
      const endTime = startTime + 500;

      rum.trackTiming('api_call', startTime, endTime);

      const timingMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'custom' && m.type === 'timing'
      );

      expect(timingMetric).toBeDefined();
      expect(timingMetric.data.name).toBe('api_call');
      expect(timingMetric.data.duration).toBe(500);
      expect(timingMetric.data.startTime).toBe(startTime);
      expect(timingMetric.data.endTime).toBe(endTime);
    });

    test('should get performance summary', () => {
      rum.recordMetric('test', 'summary', { value: 1 });
      rum.trackFunnelStep('landing_page_view');

      const summary = rum.getPerformanceSummary();

      expect(summary).toMatchObject({
        totalMetrics: expect.any(Number),
        sessionDuration: expect.any(Number),
        userJourney: expect.any(Array),
        lastMetric: expect.any(Object)
      });

      expect(summary.totalMetrics).toBeGreaterThan(0);
      expect(summary.userJourney.length).toBeGreaterThan(0);
    });
  });

  // ==============================================
  // UTILITY HELPERS TESTS
  // ==============================================

  describe('Utility Helpers', () => {
    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = rum.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = rum.throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should log only in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      rum.config.enableDebug = true;
      rum.log('test message');

      rum.config.enableDebug = false;
      rum.log('should not log');

      consoleSpy.mockRestore();
    });

    test('should handle errors and report to Sentry', () => {
      const testError = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      rum.handleError('Test message', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[RUM]',
        'Test message',
        testError
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          tags: { source: 'rum' },
          extra: { message: 'Test message' }
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==============================================
  // BROWSER COMPATIBILITY TESTS
  // ==============================================

  describe('Browser Compatibility', () => {
    test('should handle missing PerformanceObserver API', () => {
      delete global.PerformanceObserver;

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      // Should initialize without errors
      expect(RUMNew.config).toBeDefined();
    });

    test('should handle missing performance.memory API', () => {
      delete mockPerformance.memory;

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      jest.advanceTimersByTime(10000);

      const memoryMetrics = Array.from(RUMNew.metrics.values()).filter(
        m => m.category === 'performance' && m.type === 'memory'
      );

      expect(memoryMetrics.length).toBe(0);
    });

    test('should handle missing navigation timing API', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      const navMetrics = Array.from(RUMNew.metrics.values()).filter(
        m => m.category === 'navigation' && m.type === 'timing'
      );

      expect(navMetrics.length).toBe(0);
    });

    test('should handle missing sessionStorage', () => {
      const originalSessionStorage = global.sessionStorage;
      delete global.sessionStorage;

      jest.resetModules();

      // Should throw or handle gracefully
      expect(() => {
        const RUMNew = require('./RealUserMetrics').default;
        RUMNew.getSessionId();
      }).toThrow();

      global.sessionStorage = originalSessionStorage;
    });
  });

  // ==============================================
  // PERFORMANCE ALERT TESTS
  // ==============================================

  describe('Performance Alerts', () => {
    test('should trigger performance alert with correct data', () => {
      rum.triggerPerformanceAlert('custom_alert', {
        metric: 'test',
        value: 100
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert',
        expect.objectContaining({
          level: 'warning',
          tags: {
            alert_type: 'custom_alert',
            performance_issue: true
          },
          extra: {
            metric: 'test',
            value: 100
          }
        })
      );

      const alertMetric = Array.from(rum.metrics.values()).find(
        m => m.category === 'alert' && m.type === 'performance'
      );

      expect(alertMetric).toBeDefined();
      expect(alertMetric.data.alertType).toBe('custom_alert');
    });
  });

  // ==============================================
  // CONFIGURATION TESTS
  // ==============================================

  describe('Configuration', () => {
    test('should use environment variable for API endpoint', () => {
      expect(rum.config.apiEndpoint).toBe('/api/metrics/rum');
    });

    test('should use default API endpoint if not set', () => {
      import.meta.env.VITE_RUM_ENDPOINT = undefined;

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      expect(RUMNew.config.apiEndpoint).toBe('/api/metrics/rum');
    });

    test('should enable debug mode in development', () => {
      expect(rum.config.enableDebug).toBe(true);
    });

    test('should disable debug mode in production', () => {
      import.meta.env.MODE = 'production';

      jest.resetModules();
      const RUMNew = require('./RealUserMetrics').default;

      expect(RUMNew.config.enableDebug).toBe(false);
    });
  });

  // ==============================================
  // EDGE CASES AND ERROR HANDLING
  // ==============================================

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty metric data', () => {
      rum.recordMetric('test', 'empty', {});

      const metric = Array.from(rum.metrics.values()).find(
        m => m.category === 'test' && m.type === 'empty'
      );

      expect(metric).toBeDefined();
      expect(metric.data).toEqual({});
    });

    test('should handle null performance entries', () => {
      const resourceObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => []
      });

      // Should not throw error
      expect(rum.metrics.size).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid session storage operations', () => {
      sessionStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should handle error gracefully
      expect(() => rum.getSessionId()).not.toThrow();
    });

    test('should handle fetch network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      rum.recordMetric('test', 'network-fail', { value: 1 });

      await expect(rum.flush()).resolves.not.toThrow();
    });

    test('should handle malformed metric data', () => {
      const circularRef = {};
      circularRef.self = circularRef;

      // Should handle circular references
      expect(() => {
        rum.recordMetric('test', 'circular', { ref: circularRef });
      }).not.toThrow();
    });

    test('should handle very large metric values', () => {
      rum.recordMetric('test', 'large', {
        value: Number.MAX_SAFE_INTEGER
      });

      const metric = Array.from(rum.metrics.values()).find(
        m => m.category === 'test' && m.type === 'large'
      );

      expect(metric.data.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    test('should handle observer callbacks with no entries', () => {
      const lcpObserver = Object.values(performanceObserverCallbacks).find(
        obs => obs.entryTypes?.includes('largest-contentful-paint')
      );

      lcpObserver.callback({
        getEntries: () => []
      });

      // Should not crash
      expect(rum.metrics.size).toBeGreaterThanOrEqual(0);
    });
  });

  // ==============================================
  // INTEGRATION TESTS
  // ==============================================

  describe('Integration Tests', () => {
    test('should handle complete user session flow', () => {
      // User lands on page
      const loadHandler = global.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )?.[1];
      loadHandler();

      // User clicks button
      const clickHandler = eventListeners['click']?.[0]?.handler;
      clickHandler({
        target: { tagName: 'BUTTON', className: '', id: '', closest: () => null },
        clientX: 100,
        clientY: 200
      });

      // User submits form
      rum.trackFunnelStep('signup_form_submit');

      // Advance time for engagement tracking
      jest.advanceTimersByTime(30000);

      // User leaves page
      const unloadHandlers = global.addEventListener.mock.calls.filter(
        call => call[0] === 'beforeunload'
      );
      unloadHandlers[0][1]();

      // Verify metrics were collected
      expect(rum.metrics.size).toBeGreaterThan(0);
      expect(rum.userJourney.length).toBeGreaterThan(0);
    });

    test('should track and flush metrics throughout session', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      // Generate multiple metrics
      for (let i = 0; i < 5; i++) {
        rum.recordMetric('test', 'integration', { index: i });
      }

      // Trigger periodic flush
      jest.advanceTimersByTime(30000);

      expect(fetchSpy).toHaveBeenCalled();
    });

    test('should maintain data integrity across operations', () => {
      rum.trackEvent('purchase', { amount: 99.99, currency: 'USD' });
      rum.trackTiming('checkout_process', 1000, 5000);
      rum.trackFunnelStep('first_community_join', { communityId: '123' });

      const eventMetric = Array.from(rum.metrics.values()).find(
        m => m.type === 'event' && m.data.event === 'purchase'
      );

      const timingMetric = Array.from(rum.metrics.values()).find(
        m => m.type === 'timing' && m.data.name === 'checkout_process'
      );

      const funnelMetric = Array.from(rum.metrics.values()).find(
        m => m.type === 'conversion_funnel' && m.data.step === 'first_community_join'
      );

      expect(eventMetric.data.amount).toBe(99.99);
      expect(timingMetric.data.duration).toBe(4000);
      expect(funnelMetric.data.metadata.communityId).toBe('123');
    });
  });
});
