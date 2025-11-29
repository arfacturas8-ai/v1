/**
 * Tests for performance utilities
 */
import {
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
} from './performance';

describe('performance utilities', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('PerformanceMonitor', () => {
    it('starts and ends measurement', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test');

      const metric = performanceMonitor.getMetric('test');
      expect(metric).toBeDefined();
      expect(metric.duration).toBeGreaterThanOrEqual(0);
    });

    it('records timestamp', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test');

      const metric = performanceMonitor.getMetric('test');
      expect(metric.timestamp).toBeDefined();
      expect(typeof metric.timestamp).toBe('number');
    });

    it('returns duration from end()', () => {
      performanceMonitor.start('test');
      const duration = performanceMonitor.end('test');

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('handles multiple measurements', () => {
      performanceMonitor.start('test1');
      performanceMonitor.end('test1');

      performanceMonitor.start('test2');
      performanceMonitor.end('test2');

      expect(performanceMonitor.getMetric('test1')).toBeDefined();
      expect(performanceMonitor.getMetric('test2')).toBeDefined();
    });

    it('gets all metrics', () => {
      performanceMonitor.start('metric1');
      performanceMonitor.end('metric1');

      performanceMonitor.start('metric2');
      performanceMonitor.end('metric2');

      const allMetrics = performanceMonitor.getAllMetrics();

      expect(allMetrics.metric1).toBeDefined();
      expect(allMetrics.metric2).toBeDefined();
    });

    it('clears all metrics', () => {
      performanceMonitor.start('test');
      performanceMonitor.end('test');

      performanceMonitor.clear();

      const metric = performanceMonitor.getMetric('test');
      expect(metric).toBeUndefined();
    });

    it('generates performance report', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      performanceMonitor.start('test');
      performanceMonitor.end('test');

      const report = performanceMonitor.report();

      expect(consoleSpy).toHaveBeenCalledWith('📊 Performance Report');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
      expect(report.test).toBeDefined();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('handles missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      global.performance = undefined;

      performanceMonitor.start('test');
      const duration = performanceMonitor.end('test');

      expect(duration).toBe(null);

      global.performance = originalPerformance;
    });
  });

  describe('measureRenderTime', () => {
    it('returns start and end callbacks', () => {
      const helpers = measureRenderTime('TestComponent');

      expect(typeof helpers.onRenderStart).toBe('function');
      expect(typeof helpers.onRenderEnd).toBe('function');
    });

    it('measures component render time', () => {
      const helpers = measureRenderTime('TestComponent');

      helpers.onRenderStart();
      helpers.onRenderEnd();

      const metric = performanceMonitor.getMetric('render-TestComponent');
      expect(metric).toBeDefined();
      expect(metric.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureAPICall', () => {
    it('measures successful API call', async () => {
      const apiCall = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await measureAPICall('fetchData', apiCall);

      expect(result).toEqual({ data: 'test' });
      expect(apiCall).toHaveBeenCalled();

      const metric = performanceMonitor.getMetric('api-fetchData');
      expect(metric).toBeDefined();
    });

    it('measures failed API call', async () => {
      const apiCall = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(measureAPICall('fetchData', apiCall)).rejects.toThrow('API Error');

      const metric = performanceMonitor.getMetric('api-fetchData');
      expect(metric).toBeDefined();
    });

    it('records duration even on error', async () => {
      const apiCall = jest.fn().mockRejectedValue(new Error('Error'));

      try {
        await measureAPICall('test', apiCall);
      } catch (e) {
        // Expected
      }

      const metric = performanceMonitor.getMetric('api-test');
      expect(metric).toBeDefined();
      expect(metric.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const func = jest.fn();
      const debounced = debounce(func, 300);

      debounced();

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('cancels previous call on rapid invocations', () => {
      const func = jest.fn();
      const debounced = debounce(func, 300);

      debounced();
      jest.advanceTimersByTime(100);

      debounced();
      jest.advanceTimersByTime(100);

      debounced();
      jest.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to debounced function', () => {
      const func = jest.fn();
      const debounced = debounce(func, 300);

      debounced('arg1', 'arg2');

      jest.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('uses custom wait time', () => {
      const func = jest.fn();
      const debounced = debounce(func, 500);

      debounced();

      jest.advanceTimersByTime(400);
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('executes immediately on first call', () => {
      const func = jest.fn();
      const throttled = throttle(func, 300);

      throttled();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('ignores calls within throttle period', () => {
      const func = jest.fn();
      const throttled = throttle(func, 300);

      throttled();
      throttled();
      throttled();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('allows call after throttle period', () => {
      const func = jest.fn();
      const throttled = throttle(func, 300);

      throttled();

      jest.advanceTimersByTime(300);

      throttled();

      expect(func).toHaveBeenCalledTimes(2);
    });

    it('passes arguments to throttled function', () => {
      const func = jest.fn();
      const throttled = throttle(func, 300);

      throttled('arg1', 'arg2');

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('uses custom limit', () => {
      const func = jest.fn();
      const throttled = throttle(func, 500);

      throttled();
      throttled();

      jest.advanceTimersByTime(400);
      throttled();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();
      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('lazyLoadImage', () => {
    it('sets src immediately if IntersectionObserver not supported', () => {
      const originalIO = global.IntersectionObserver;
      global.IntersectionObserver = undefined;

      const img = document.createElement('img');
      lazyLoadImage(img, 'test.jpg');

      expect(img.src).toContain('test.jpg');

      global.IntersectionObserver = originalIO;
    });

    it('uses IntersectionObserver when available', () => {
      const observeMock = jest.fn();
      const unobserveMock = jest.fn();

      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: jest.fn()
      }));

      const img = document.createElement('img');
      lazyLoadImage(img, 'test.jpg');

      expect(observeMock).toHaveBeenCalledWith(img);
    });

    it('loads image when intersecting', () => {
      let callback;
      global.IntersectionObserver = jest.fn().mockImplementation((cb) => {
        callback = cb;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        };
      });

      const img = document.createElement('img');
      lazyLoadImage(img, 'test.jpg');

      // Simulate intersection
      callback([{
        isIntersecting: true,
        target: img
      }]);

      expect(img.src).toContain('test.jpg');
      expect(img.classList.contains('loaded')).toBe(true);
    });
  });

  describe('measurePageLoad', () => {
    it('returns null if performance API unavailable', () => {
      const originalPerformance = global.performance;
      global.performance = undefined;

      const result = measurePageLoad();

      expect(result).toBe(null);

      global.performance = originalPerformance;
    });

    it('returns page load metrics', () => {
      global.performance = {
        getEntriesByType: jest.fn().mockReturnValue([{
          domainLookupStart: 0,
          domainLookupEnd: 10,
          connectStart: 10,
          connectEnd: 20,
          requestStart: 20,
          responseStart: 30,
          responseEnd: 40,
          domContentLoadedEventStart: 40,
          domContentLoadedEventEnd: 50,
          loadEventStart: 50,
          loadEventEnd: 60,
          fetchStart: 0
        }])
      };

      const metrics = measurePageLoad();

      expect(metrics).toBeDefined();
      expect(metrics.dns).toBe(10);
      expect(metrics.tcp).toBe(10);
      expect(metrics.request).toBe(10);
      expect(metrics.response).toBe(10);
      expect(metrics.dom).toBe(10);
      expect(metrics.load).toBe(10);
      expect(metrics.total).toBe(60);
    });

    it('returns null if no navigation entry', () => {
      global.performance = {
        getEntriesByType: jest.fn().mockReturnValue([])
      };

      const result = measurePageLoad();

      expect(result).toBe(null);
    });
  });

  describe('getFCP', () => {
    it('returns null if performance API unavailable', () => {
      const originalPerformance = global.performance;
      global.performance = undefined;

      const result = getFCP();

      expect(result).toBe(null);

      global.performance = originalPerformance;
    });

    it('returns FCP time', () => {
      global.performance = {
        getEntriesByName: jest.fn().mockReturnValue([{
          startTime: 250
        }])
      };

      const fcp = getFCP();

      expect(fcp).toBe(250);
      expect(global.performance.getEntriesByName).toHaveBeenCalledWith('first-contentful-paint');
    });

    it('returns null if no FCP entry', () => {
      global.performance = {
        getEntriesByName: jest.fn().mockReturnValue([])
      };

      const result = getFCP();

      expect(result).toBe(null);
    });
  });

  describe('getLCP', () => {
    it('does nothing if PerformanceObserver unavailable', () => {
      const originalPO = global.PerformanceObserver;
      global.PerformanceObserver = undefined;

      const callback = jest.fn();
      getLCP(callback);

      expect(callback).not.toHaveBeenCalled();

      global.PerformanceObserver = originalPO;
    });

    it('observes largest-contentful-paint', () => {
      const observeMock = jest.fn();

      global.PerformanceObserver = jest.fn().mockImplementation(() => ({
        observe: observeMock
      }));

      const callback = jest.fn();
      getLCP(callback);

      expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  describe('getFID', () => {
    it('does nothing if PerformanceObserver unavailable', () => {
      const originalPO = global.PerformanceObserver;
      global.PerformanceObserver = undefined;

      const callback = jest.fn();
      getFID(callback);

      expect(callback).not.toHaveBeenCalled();

      global.PerformanceObserver = originalPO;
    });

    it('observes first-input', () => {
      const observeMock = jest.fn();

      global.PerformanceObserver = jest.fn().mockImplementation(() => ({
        observe: observeMock
      }));

      const callback = jest.fn();
      getFID(callback);

      expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['first-input'] });
    });
  });

  describe('getCLS', () => {
    it('does nothing if PerformanceObserver unavailable', () => {
      const originalPO = global.PerformanceObserver;
      global.PerformanceObserver = undefined;

      const callback = jest.fn();
      getCLS(callback);

      expect(callback).not.toHaveBeenCalled();

      global.PerformanceObserver = originalPO;
    });

    it('observes layout-shift', () => {
      const observeMock = jest.fn();

      global.PerformanceObserver = jest.fn().mockImplementation(() => ({
        observe: observeMock
      }));

      const callback = jest.fn();
      getCLS(callback);

      expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['layout-shift'] });
    });
  });

  describe('getMemoryUsage', () => {
    it('returns null if memory API unavailable', () => {
      const originalPerformance = global.performance;
      global.performance = {};

      const result = getMemoryUsage();

      expect(result).toBe(null);

      global.performance = originalPerformance;
    });

    it('returns memory usage stats', () => {
      global.performance = {
        memory: {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 20000000,
          jsHeapSizeLimit: 40000000
        }
      };

      const memory = getMemoryUsage();

      expect(memory.usedJSHeapSize).toBe(10000000);
      expect(memory.totalJSHeapSize).toBe(20000000);
      expect(memory.jsHeapSizeLimit).toBe(40000000);
      expect(memory.usedPercent).toBe(25);
    });
  });

  describe('reportWebVitals', () => {
    it('does nothing if callback not provided', () => {
      expect(() => reportWebVitals()).not.toThrow();
      expect(() => reportWebVitals(null)).not.toThrow();
    });

    it('calls callback with FCP', () => {
      global.performance = {
        getEntriesByName: jest.fn().mockReturnValue([{ startTime: 250 }])
      };

      const callback = jest.fn();
      reportWebVitals(callback);

      expect(callback).toHaveBeenCalledWith({ name: 'FCP', value: 250 });
    });

    it('sets up LCP observer', () => {
      const observeMock = jest.fn();

      global.PerformanceObserver = jest.fn().mockImplementation(() => ({
        observe: observeMock
      }));

      const callback = jest.fn();
      reportWebVitals(callback);

      expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid start/end calls', () => {
      for (let i = 0; i < 100; i++) {
        performanceMonitor.start(`test-${i}`);
        performanceMonitor.end(`test-${i}`);
      }

      const allMetrics = performanceMonitor.getAllMetrics();
      expect(Object.keys(allMetrics).length).toBe(100);
    });

    it('handles end without start', () => {
      const duration = performanceMonitor.end('never-started');
      expect(duration).toBeDefined();
    });

    it('handles multiple starts for same name', () => {
      performanceMonitor.start('test');
      performanceMonitor.start('test');
      const duration = performanceMonitor.end('test');

      expect(duration).toBeDefined();
    });
  });
});
