/**
 * ==============================================
 * CRYB PLATFORM - PERFORMANCE MONITORING HOOK
 * ==============================================
 * React hook for tracking component performance and user interactions
 * Integrates with RUM system for comprehensive monitoring
 * ==============================================
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import RealUserMetrics from '../performance/RealUserMetrics';
import * as Sentry from '@sentry/react';

/**
 * Hook for monitoring React component performance
 * @param {string} componentName - Name of the component for tracking
 * @param {Object} options - Configuration options
 * @returns {Object} Performance monitoring utilities
 */
export const usePerformanceMonitoring = (componentName, options = {}) => {
  const {
    trackRender = true,
    trackInteractions = true,
    trackErrors = true,
    enableProfiling = import.meta.env.MODE === 'development',
    customMetrics = {}
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef(null);
  const lastRenderTime = useRef(null);
  const [performanceScore, setPerformanceScore] = useState(100);

  // ==============================================
  // COMPONENT LIFECYCLE TRACKING
  // ==============================================

  useEffect(() => {
    mountTime.current = performance.now();
    
    RealUserMetrics.trackEvent('component_mount', {
      component: componentName,
      mountTime: mountTime.current,
      ...customMetrics
    });

    return () => {
      const unmountTime = performance.now();
      const lifetimeDuration = mountTime.current ? unmountTime - mountTime.current : 0;
      
      RealUserMetrics.trackEvent('component_unmount', {
        component: componentName,
        lifetimeDuration,
        renderCount: renderCount.current,
        ...customMetrics
      });
    };
  }, [componentName]);

  // Track renders
  useEffect(() => {
    if (!trackRender) return;

    const renderStartTime = performance.now();
    renderCount.current++;

    // Track render performance
    requestIdleCallback(() => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;
      
      RealUserMetrics.trackTiming(`${componentName}_render`, renderStartTime, renderEndTime);
      
      RealUserMetrics.trackEvent('component_render', {
        component: componentName,
        renderCount: renderCount.current,
        renderDuration,
        timeSinceLastRender: lastRenderTime.current ? renderStartTime - lastRenderTime.current : 0,
        ...customMetrics
      });

      lastRenderTime.current = renderStartTime;

      // Update performance score based on render performance
      updatePerformanceScore(renderDuration);

      // Alert on slow renders
      if (renderDuration > 16) { // Over one frame (60fps)
        Sentry.captureMessage('Slow component render', {
          level: 'warning',
          tags: {
            component: componentName,
            performance_issue: true
          },
          extra: {
            renderDuration,
            renderCount: renderCount.current,
            threshold: 16
          }
        });
      }
    });
  });

  // ==============================================
  // PERFORMANCE UTILITIES
  // ==============================================

  const trackOperation = useCallback((operationName, operation, options = {}) => {
    const startTime = performance.now();
    
    try {
      const result = operation();
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((res) => {
            const endTime = performance.now();
            trackOperationComplete(operationName, startTime, endTime, true, options);
            return res;
          })
          .catch((error) => {
            const endTime = performance.now();
            trackOperationComplete(operationName, startTime, endTime, false, options);
            throw error;
          });
      } else {
        const endTime = performance.now();
        trackOperationComplete(operationName, startTime, endTime, true, options);
        return result;
      }
    } catch (error) {
      const endTime = performance.now();
      trackOperationComplete(operationName, startTime, endTime, false, options);
      throw error;
    }
  }, [componentName]);

  const trackOperationComplete = useCallback((operationName, startTime, endTime, success, options) => {
    const duration = endTime - startTime;
    
    RealUserMetrics.trackTiming(`${componentName}_${operationName}`, startTime, endTime);
    
    RealUserMetrics.trackEvent('component_operation', {
      component: componentName,
      operation: operationName,
      duration,
      success,
      ...customMetrics,
      ...options
    });

    // Alert on slow operations
    const threshold = options.threshold || 100;
    if (duration > threshold) {
      Sentry.captureMessage('Slow component operation', {
        level: 'warning',
        tags: {
          component: componentName,
          operation: operationName,
          performance_issue: true
        },
        extra: {
          duration,
          threshold,
          success
        }
      });
    }
  }, [componentName, customMetrics]);

  const trackInteraction = useCallback((interactionType, metadata = {}) => {
    if (!trackInteractions) return;

    RealUserMetrics.trackEvent('component_interaction', {
      component: componentName,
      interactionType,
      timestamp: performance.now(),
      renderCount: renderCount.current,
      ...metadata,
      ...customMetrics
    });
  }, [componentName, trackInteractions, customMetrics]);

  const trackError = useCallback((error, errorBoundary = false) => {
    if (!trackErrors) return;

    const errorData = {
      component: componentName,
      renderCount: renderCount.current,
      timeSinceMount: mountTime.current ? performance.now() - mountTime.current : 0,
      errorBoundary,
      ...customMetrics
    };

    RealUserMetrics.trackEvent('component_error', {
      error: error.message || error.toString(),
      stack: error.stack,
      ...errorData
    });

    Sentry.withScope((scope) => {
      scope.setTag('component', componentName);
      scope.setTag('error_boundary', errorBoundary);
      scope.setContext('component_state', errorData);
      Sentry.captureException(error);
    });
  }, [componentName, trackErrors, customMetrics]);

  // ==============================================
  // PERFORMANCE SCORING
  // ==============================================

  const updatePerformanceScore = useCallback((renderDuration) => {
    let score = 100;
    
    // Deduct points for slow renders
    if (renderDuration > 16) score -= 10;
    if (renderDuration > 33) score -= 20;
    if (renderDuration > 50) score -= 30;
    
    // Deduct points for frequent re-renders
    if (renderCount.current > 10) score -= 5;
    if (renderCount.current > 20) score -= 10;
    
    setPerformanceScore(Math.max(score, 0));
  }, []);

  // ==============================================
  // CUSTOM HOOKS FOR SPECIFIC MONITORING
  // ==============================================

  const useApiCallMonitoring = useCallback(() => {
    return {
      trackApiCall: (url, method, options = {}) => {
        const startTime = performance.now();
        
        return {
          onSuccess: (data) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            RealUserMetrics.trackEvent('api_call', {
              component: componentName,
              url,
              method,
              duration,
              success: true,
              dataSize: JSON.stringify(data).length,
              ...options
            });
          },
          onError: (error) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            RealUserMetrics.trackEvent('api_call', {
              component: componentName,
              url,
              method,
              duration,
              success: false,
              error: error.message,
              ...options
            });
            
            trackError(error);
          }
        };
      }
    };
  }, [componentName, trackError]);

  const useUserFlowMonitoring = useCallback(() => {
    return {
      trackFlowStep: (step, metadata = {}) => {
        RealUserMetrics.trackFunnelStep(step, {
          component: componentName,
          ...metadata,
          ...customMetrics
        });
      },
      trackFlowComplete: (flowName, totalSteps, metadata = {}) => {
        RealUserMetrics.trackEvent('user_flow_complete', {
          component: componentName,
          flowName,
          totalSteps,
          timeSinceMount: mountTime.current ? performance.now() - mountTime.current : 0,
          ...metadata,
          ...customMetrics
        });
      },
      trackFlowAbandonment: (flowName, step, reason, metadata = {}) => {
        RealUserMetrics.trackEvent('user_flow_abandonment', {
          component: componentName,
          flowName,
          abandonedAtStep: step,
          reason,
          ...metadata,
          ...customMetrics
        });
      }
    };
  }, [componentName, customMetrics]);

  // ==============================================
  // MEMORY MONITORING
  // ==============================================

  const useMemoryMonitoring = useCallback(() => {
    const [memoryUsage, setMemoryUsage] = useState(null);
    
    useEffect(() => {
      if (!('memory' in performance)) return;
      
      const interval = setInterval(() => {
        const memory = performance.memory;
        const usage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
        
        setMemoryUsage(usage);
        
        RealUserMetrics.trackEvent('component_memory', {
          component: componentName,
          ...usage,
          renderCount: renderCount.current
        });
        
        // Alert on high memory usage for this component
        if (usage.percentage > 80) {
          Sentry.captureMessage('High memory usage in component', {
            level: 'warning',
            tags: {
              component: componentName,
              memory_issue: true
            },
            extra: usage
          });
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }, []);
    
    return memoryUsage;
  }, [componentName]);

  // ==============================================
  // PROFILING UTILITIES
  // ==============================================

  const startProfiling = useCallback((profileName) => {
    if (!enableProfiling) return null;
    
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        RealUserMetrics.trackTiming(`${componentName}_${profileName}`, startTime, endTime);
        
        
        return duration;
      }
    };
  }, [componentName, enableProfiling]);

  // ==============================================
  // RETURN OBJECT
  // ==============================================

  return {
    // Performance data
    renderCount: renderCount.current,
    performanceScore,
    
    // Tracking functions
    trackOperation,
    trackInteraction,
    trackError,
    
    // Specialized hooks
    useApiCallMonitoring,
    useUserFlowMonitoring,
    useMemoryMonitoring,
    
    // Profiling
    startProfiling,
    
    // Custom metric tracking
    trackCustomMetric: (metricName, value, metadata = {}) => {
      RealUserMetrics.trackEvent('custom_metric', {
        component: componentName,
        metricName,
        value,
        ...metadata,
        ...customMetrics
      });
    },
    
    // Performance summary
    getPerformanceSummary: () => ({
      component: componentName,
      renderCount: renderCount.current,
      performanceScore,
      timeSinceMount: mountTime.current ? performance.now() - mountTime.current : 0,
      lastRenderTime: lastRenderTime.current
    })
  };
};

/**
 * Higher-order component for automatic performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, options = {}) => {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MonitoredComponent = (props) => {
    const monitoring = usePerformanceMonitoring(displayName, options);
    
    // Create error boundary
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      const handleError = (error, errorInfo) => {
        setHasError(true);
        monitoring.trackError(error, true);
      };
      
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleError);
      };
    }, [monitoring]);
    
    if (hasError) {
      return <div>Something went wrong with {displayName}</div>;
    }
    
    return <WrappedComponent {...props} performanceMonitoring={monitoring} />;
  };
  
  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return MonitoredComponent;
};

/**
 * Hook for tracking route performance
 */
export const useRoutePerformanceMonitoring = (routeName) => {
  const routeStartTime = useRef(null);
  
  useEffect(() => {
    routeStartTime.current = performance.now();
    
    RealUserMetrics.trackEvent('route_enter', {
      route: routeName,
      timestamp: routeStartTime.current
    });
    
    return () => {
      if (routeStartTime.current) {
        const routeEndTime = performance.now();
        const routeDuration = routeEndTime - routeStartTime.current;
        
        RealUserMetrics.trackEvent('route_exit', {
          route: routeName,
          duration: routeDuration,
          timestamp: routeEndTime
        });
      }
    };
  }, [routeName]);
  
  return {
    trackRouteAction: (action, metadata = {}) => {
      const actionTime = performance.now();
      const timeSinceRouteEnter = routeStartTime.current ? actionTime - routeStartTime.current : 0;
      
      RealUserMetrics.trackEvent('route_action', {
        route: routeName,
        action,
        timeSinceRouteEnter,
        ...metadata
      });
    }
  };
};

export default usePerformanceMonitoring;