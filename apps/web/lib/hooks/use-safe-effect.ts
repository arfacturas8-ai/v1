"use client";

import * as React from 'react';

// Utility to detect infinite loops and prevent them
interface EffectExecutionTracker {
  count: number;
  lastRun: number;
  dependencies: any[];
}

const effectTrackers = new Map<string, EffectExecutionTracker>();
const MAX_EXECUTIONS_PER_SECOND = 10;
const MAX_TOTAL_EXECUTIONS = 100;

function generateEffectId(effect: Function, deps: React.DependencyList | undefined): string {
  // Create a unique ID for this effect based on function string and dependencies
  const effectStr = effect.toString();
  const depsStr = deps ? JSON.stringify(deps) : 'no-deps';
  return `${effectStr.slice(0, 100)}-${depsStr}`;
}

function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function validateDependencies(deps: React.DependencyList | undefined): void {
  if (!deps) return;

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    
    // Check for objects/arrays that might cause unnecessary re-renders
    if (dep && typeof dep === 'object' && !React.isValidElement(dep)) {
      console.warn(`Dependency at index ${i} is an object/array. Consider using useMemo or useCallback to prevent unnecessary re-renders.`);
    }

    // Check for functions
    if (typeof dep === 'function') {
      console.warn(`Dependency at index ${i} is a function. Consider wrapping with useCallback to prevent unnecessary re-renders.`);
    }
  }
}

/**
 * A safer version of useEffect that prevents infinite loops
 */
export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const effectId = React.useMemo(() => generateEffectId(effect, deps), [effect, deps]);
  const isInitialMount = React.useRef(true);
  const lastDeps = React.useRef<any[]>(deps ? [...deps] : []);
  const executionCount = React.useRef(0);

  React.useEffect(() => {
    try {
      const now = Date.now();
      let tracker = effectTrackers.get(effectId);

      if (!tracker) {
        tracker = {
          count: 0,
          lastRun: now,
          dependencies: deps ? [...deps] : [],
        };
        effectTrackers.set(effectId, tracker);
      }

      // Check if dependencies actually changed
      if (!isInitialMount.current && deps && shallowEqual(lastDeps.current, deps)) {
        console.warn('useSafeEffect: Effect executed with same dependencies');
        return;
      }

      // Check for rapid execution
      if (now - tracker.lastRun < 1000 / MAX_EXECUTIONS_PER_SECOND) {
        console.error('useSafeEffect: Preventing rapid effect execution (potential infinite loop)');
        return;
      }

      // Check total execution count
      if (tracker.count > MAX_TOTAL_EXECUTIONS) {
        console.error('useSafeEffect: Maximum execution count reached (potential infinite loop)');
        return;
      }

      // Update tracker
      tracker.count++;
      tracker.lastRun = now;
      tracker.dependencies = deps ? [...deps] : [];
      executionCount.current++;

      // Validate dependencies on first run
      if (isInitialMount.current) {
        validateDependencies(deps);
      }

      // Update refs
      lastDeps.current = deps ? [...deps] : [];
      isInitialMount.current = false;

      // Execute the actual effect
      return effect();
    } catch (error) {
      console.error('Error in useSafeEffect:', error);
    }
  }, deps);

  // Cleanup tracker on unmount
  React.useEffect(() => {
    return () => {
      effectTrackers.delete(effectId);
    };
  }, [effectId]);
}

/**
 * A safer version of useMemo that prevents infinite loops
 */
export function useSafeMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  const factoryId = React.useMemo(() => generateEffectId(factory, deps), [factory, deps]);
  const lastDeps = React.useRef<any[]>(deps ? [...deps] : []);
  const lastResult = React.useRef<T>();
  const isInitialRun = React.useRef(true);

  return React.useMemo(() => {
    try {
      // Check if dependencies actually changed
      if (!isInitialRun.current && deps && shallowEqual(lastDeps.current, deps)) {
        console.warn('useSafeMemo: Memo recalculated with same dependencies');
        if (lastResult.current !== undefined) {
          return lastResult.current;
        }
      }

      // Validate dependencies on first run
      if (isInitialRun.current) {
        validateDependencies(deps);
        isInitialRun.current = false;
      }

      // Update refs
      lastDeps.current = deps ? [...deps] : [];

      // Calculate new result
      const result = factory();
      lastResult.current = result;
      return result;
    } catch (error) {
      console.error('Error in useSafeMemo:', error);
      // Return last known good result or undefined
      return lastResult.current!;
    }
  }, deps);
}

/**
 * A safer version of useCallback that prevents infinite loops
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackId = React.useMemo(() => generateEffectId(callback, deps), [callback, deps]);
  const lastDeps = React.useRef<any[]>([...deps]);
  const lastCallback = React.useRef<T>(callback);
  const isInitialRun = React.useRef(true);

  return React.useCallback((...args: Parameters<T>) => {
    try {
      // Check if dependencies actually changed
      if (!isInitialRun.current && shallowEqual(lastDeps.current, deps)) {
        // Use cached callback if dependencies haven't changed
        return lastCallback.current(...args);
      }

      // Validate dependencies on first run
      if (isInitialRun.current) {
        validateDependencies(deps);
        isInitialRun.current = false;
      }

      // Update refs
      lastDeps.current = [...deps];
      lastCallback.current = callback;

      return callback(...args);
    } catch (error) {
      console.error('Error in useSafeCallback:', error);
      throw error;
    }
  }, deps) as T;
}

/**
 * Hook to detect and warn about potential dependency issues
 */
export function useDependencyValidator(
  hookName: string,
  deps: React.DependencyList | undefined,
  previousDeps?: React.DependencyList | undefined
): void {
  const prevDepsRef = React.useRef(previousDeps);
  const renderCountRef = React.useRef(0);

  React.useEffect(() => {
    renderCountRef.current++;

    if (!deps) {
      console.warn(`${hookName}: No dependencies provided. This will run on every render.`);
      return;
    }

    if (renderCountRef.current > 1 && prevDepsRef.current) {
      // Check for potentially problematic dependencies
      deps.forEach((dep, index) => {
        const prevDep = prevDepsRef.current![index];
        
        if (dep !== prevDep) {
          if (typeof dep === 'object' && typeof prevDep === 'object') {
            if (JSON.stringify(dep) === JSON.stringify(prevDep)) {
              console.warn(
                `${hookName}: Dependency at index ${index} is a new object reference but with same content. Consider using useMemo.`
              );
            }
          }
          
          if (typeof dep === 'function') {
            console.warn(
              `${hookName}: Function dependency at index ${index} changed. Consider using useCallback.`
            );
          }
        }
      });
    }

    prevDepsRef.current = deps ? [...deps] : undefined;
  });
}

/**
 * Custom hook to monitor component re-renders
 */
export function useRenderTracker(componentName: string, props?: Record<string, any>): void {
  const renderCount = React.useRef(0);
  const previousProps = React.useRef(props);

  React.useEffect(() => {
    renderCount.current++;
    
    if (renderCount.current > 10) {
      console.warn(`${componentName}: Component has re-rendered ${renderCount.current} times`);
      
      if (props && previousProps.current) {
        const changedProps = Object.keys(props).filter(
          key => props[key] !== previousProps.current![key]
        );
        
        if (changedProps.length > 0) {
          console.log(`${componentName}: Props that changed:`, changedProps);
        }
      }
    }

    previousProps.current = props;
  });
}

/**
 * Hook to safely handle async operations in useEffect
 */
export function useSafeAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps: React.DependencyList
): void {
  const mountedRef = React.useRef(true);
  const currentEffectRef = React.useRef<AbortController | null>(null);

  useSafeEffect(() => {
    const abortController = new AbortController();
    currentEffectRef.current = abortController;

    const runEffect = async () => {
      try {
        if (!mountedRef.current || abortController.signal.aborted) {
          return;
        }

        const cleanup = await effect();
        
        if (cleanup && typeof cleanup === 'function' && mountedRef.current) {
          return cleanup;
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error in useSafeAsyncEffect:', error);
        }
      }
    };

    const cleanup = runEffect();

    return () => {
      abortController.abort();
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then((cleanupFn) => {
          if (cleanupFn && typeof cleanupFn === 'function') {
            cleanupFn();
          }
        }).catch((error) => {
          console.error('Error in async effect cleanup:', error);
        });
      }
    };
  }, deps);

  React.useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (currentEffectRef.current) {
        currentEffectRef.current.abort();
      }
    };
  }, []);
}

/**
 * Clear all effect trackers (useful for testing or debugging)
 */
export function clearEffectTrackers(): void {
  effectTrackers.clear();
}

/**
 * Get current effect tracker statistics
 */
export function getEffectTrackerStats(): Array<{id: string, count: number, lastRun: number}> {
  return Array.from(effectTrackers.entries()).map(([id, tracker]) => ({
    id,
    count: tracker.count,
    lastRun: tracker.lastRun,
  }));
}