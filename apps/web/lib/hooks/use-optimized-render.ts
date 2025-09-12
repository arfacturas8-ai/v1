"use client";

import * as React from 'react';
import { 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect,
  startTransition,
  useDeferredValue,
  useTransition
} from 'react';

// React 19 optimized rendering hooks
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  
  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return stable callback that always calls the latest version
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Optimized memo with custom comparison
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const depsRef = useRef<React.DependencyList>();
  const valueRef = useRef<T>();
  
  // Deep comparison function
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    
    return deps.some((dep, index) => {
      const prevDep = depsRef.current![index];
      return !Object.is(dep, prevDep);
    });
  }, [deps]);

  if (depsChanged) {
    depsRef.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current!;
}

// Debounced value with React 19's useDeferredValue
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const deferredValue = useDeferredValue(value);
  const [debouncedValue, setDebouncedValue] = React.useState(deferredValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedValue(deferredValue);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [deferredValue, delay]);

  return debouncedValue;
}

// Optimized list rendering with React 19 features
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  renderItem: (item: T, index: number) => React.ReactNode
) {
  const [isPending, startTransition] = useTransition();
  const deferredItems = useDeferredValue(items);
  
  const renderedItems = useMemo(() => {
    return deferredItems.map((item, index) => {
      const key = keyExtractor(item, index);
      return {
        key,
        node: renderItem(item, index),
        item,
        index,
      };
    });
  }, [deferredItems, keyExtractor, renderItem]);

  const updateItems = useCallback((newItems: T[]) => {
    startTransition(() => {
      // This would typically update state that contains the items
      console.log('Updating items with transition', newItems);
    });
  }, []);

  return {
    items: renderedItems,
    isPending,
    updateItems,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const averageRenderTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    // Calculate rolling average
    averageRenderTime.current = 
      (averageRenderTime.current * (renderCount.current - 1) + renderTime) / renderCount.current;

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms (avg: ${averageRenderTime.current.toFixed(2)}ms)`);
      
      // Warn if render time is consistently high
      if (renderCount.current > 10 && averageRenderTime.current > 16) {
        console.warn(`${componentName} is rendering slowly (avg: ${averageRenderTime.current.toFixed(2)}ms)`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: averageRenderTime.current,
  };
}

// Optimized scroll handler with RAF
export function useOptimizedScroll(
  callback: (scrollTop: number, scrollDirection: 'up' | 'down') => void,
  element?: HTMLElement | null,
  throttle: number = 16
) {
  const rafId = useRef<number>();
  const lastScrollTop = useRef<number>(0);
  const lastCallTime = useRef<number>(0);

  const handleScroll = useCallback(() => {
    if (rafId.current) return; // Already scheduled

    rafId.current = requestAnimationFrame(() => {
      const now = performance.now();
      
      if (now - lastCallTime.current < throttle) {
        rafId.current = undefined;
        return;
      }

      const scrollElement = element || (typeof window !== 'undefined' ? window : null);
      if (!scrollElement) {
        rafId.current = undefined;
        return;
      }

      const scrollTop = 'scrollY' in scrollElement 
        ? scrollElement.scrollY 
        : (scrollElement as HTMLElement).scrollTop;

      const scrollDirection = scrollTop > lastScrollTop.current ? 'down' : 'up';
      
      startTransition(() => {
        callback(scrollTop, scrollDirection);
      });

      lastScrollTop.current = scrollTop;
      lastCallTime.current = now;
      rafId.current = undefined;
    });
  }, [callback, element, throttle]);

  useEffect(() => {
    const scrollElement = element || window;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll, element]);
}

// Intersection Observer hook with React 19 optimizations
export function useOptimizedIntersection(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        startTransition(() => {
          setIsIntersecting(entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '0px',
        ...options,
      }
    );

    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return { isIntersecting, isPending };
}

// Custom hook for optimizing large lists with windowing
export function useWindowedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const deferredScrollTop = useDeferredValue(scrollTop);

  const visibleRange = useMemo(() => {
    const start = Math.floor(deferredScrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
    };
  }, [deferredScrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetY: (visibleRange.start + index) * itemHeight,
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const updateScroll = useCallback((newScrollTop: number) => {
    startTransition(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    updateScroll,
    visibleRange,
  };
}