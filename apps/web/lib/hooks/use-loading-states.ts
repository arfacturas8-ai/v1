"use client";

import * as React from 'react';
import { captureError, capturePerformanceMetric } from '@/lib/utils/error-monitor';

// Loading state types
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

interface LoadingStateContext {
  state: LoadingState;
  error: Error | null;
  data: any;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  retryCount: number;
  isRetrying: boolean;
}

// Global loading state manager
class LoadingStateManager {
  private loadingStates = new Map<string, LoadingStateContext>();
  private listeners = new Set<(states: Map<string, LoadingStateContext>) => void>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private retryTimeouts = new Map<string, NodeJS.Timeout>();

  public createLoadingState(key: string, options: LoadingOptions = {}): LoadingStateContext {
    const context: LoadingStateContext = {
      state: 'idle',
      error: null,
      data: null,
      retryCount: 0,
      isRetrying: false,
    };

    this.loadingStates.set(key, context);
    this.notifyListeners();
    return context;
  }

  public setLoading(key: string, progress?: number): void {
    const context = this.loadingStates.get(key);
    if (!context) return;

    context.state = 'loading';
    context.error = null;
    context.progress = progress;
    context.startTime = new Date();
    context.isRetrying = false;

    this.loadingStates.set(key, context);
    this.notifyListeners();
  }

  public setSuccess(key: string, data: any): void {
    const context = this.loadingStates.get(key);
    if (!context) return;

    context.state = 'success';
    context.data = data;
    context.error = null;
    context.endTime = new Date();
    context.isRetrying = false;

    // Calculate and report performance metrics
    if (context.startTime) {
      const duration = context.endTime.getTime() - context.startTime.getTime();
      capturePerformanceMetric(`loading_state_${key}`, duration);
    }

    this.clearTimeouts(key);
    this.loadingStates.set(key, context);
    this.notifyListeners();
  }

  public setError(key: string, error: Error): void {
    const context = this.loadingStates.get(key);
    if (!context) return;

    context.state = 'error';
    context.error = error;
    context.endTime = new Date();

    // Report error
    captureError(error, {
      type: 'javascript',
      severity: 'medium',
      context: {
        component: 'loading_state_manager',
        action: 'set_error',
        additional: { loadingKey: key, retryCount: context.retryCount },
      },
    });

    this.clearTimeouts(key);
    this.loadingStates.set(key, context);
    this.notifyListeners();
  }

  public retry(key: string, asyncFn: () => Promise<any>, options: LoadingOptions = {}): void {
    const context = this.loadingStates.get(key);
    if (!context) return;

    const maxRetries = options.retries ?? 3;
    if (context.retryCount >= maxRetries) {
      captureError(new Error(`Max retry attempts reached for ${key}`), {
        type: 'javascript',
        severity: 'high',
        context: {
          component: 'loading_state_manager',
          action: 'max_retries_reached',
          additional: { loadingKey: key, retryCount: context.retryCount },
        },
      });
      return;
    }

    context.retryCount++;
    context.isRetrying = true;
    context.state = 'loading';
    context.error = null;

    const delay = options.retryDelay ?? Math.min(1000 * Math.pow(2, context.retryCount - 1), 10000);
    
    const retryTimeout = setTimeout(async () => {
      try {
        this.setLoading(key);
        const result = await asyncFn();
        this.setSuccess(key, result);
        options.onSuccess?.(result);
      } catch (error) {
        this.setError(key, error as Error);
        options.onError?.(error as Error);
        
        // Schedule another retry if we haven't hit the limit
        if (context.retryCount < maxRetries) {
          this.retry(key, asyncFn, options);
        }
      }
    }, delay);

    this.retryTimeouts.set(key, retryTimeout);
    this.loadingStates.set(key, context);
    this.notifyListeners();
  }

  public setupTimeout(key: string, timeout: number, onTimeout?: () => void): void {
    this.clearTimeouts(key);

    const timeoutId = setTimeout(() => {
      const context = this.loadingStates.get(key);
      if (context && context.state === 'loading') {
        const timeoutError = new Error(`Operation timed out after ${timeout}ms`);
        this.setError(key, timeoutError);
        onTimeout?.();
      }
    }, timeout);

    this.timeouts.set(key, timeoutId);
  }

  public clearTimeouts(key: string): void {
    const timeout = this.timeouts.get(key);
    const retryTimeout = this.retryTimeouts.get(key);

    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      this.retryTimeouts.delete(key);
    }
  }

  public getLoadingState(key: string): LoadingStateContext | null {
    return this.loadingStates.get(key) || null;
  }

  public removeLoadingState(key: string): void {
    this.clearTimeouts(key);
    this.loadingStates.delete(key);
    this.notifyListeners();
  }

  public subscribe(listener: (states: Map<string, LoadingStateContext>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(new Map(this.loadingStates));
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    }
  }

  public cleanup(): void {
    // Clear all timeouts
    for (const [key] of this.loadingStates) {
      this.clearTimeouts(key);
    }

    // Clear all states
    this.loadingStates.clear();
    this.listeners.clear();
    this.notifyListeners();
  }
}

// Global instance
const loadingStateManager = new LoadingStateManager();

// React hook for individual loading states
export function useLoadingState(key: string, options: LoadingOptions = {}) {
  const [context, setContext] = React.useState<LoadingStateContext>(() => 
    loadingStateManager.getLoadingState(key) || loadingStateManager.createLoadingState(key, options)
  );

  React.useEffect(() => {
    const unsubscribe = loadingStateManager.subscribe((states) => {
      const updatedContext = states.get(key);
      if (updatedContext) {
        setContext({ ...updatedContext });
      }
    });

    return unsubscribe;
  }, [key]);

  const executeAsync = React.useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customOptions: LoadingOptions = {}
  ): Promise<T | null> => {
    const mergedOptions = { ...options, ...customOptions };
    
    try {
      loadingStateManager.setLoading(key);
      
      // Setup timeout if specified
      if (mergedOptions.timeout) {
        loadingStateManager.setupTimeout(key, mergedOptions.timeout, mergedOptions.onTimeout);
      }

      const result = await asyncFn();
      loadingStateManager.setSuccess(key, result);
      mergedOptions.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error as Error;
      loadingStateManager.setError(key, err);
      mergedOptions.onError?.(err);
      
      // Auto-retry if configured
      if (mergedOptions.retries && mergedOptions.retries > 0) {
        loadingStateManager.retry(key, asyncFn, mergedOptions);
      }
      
      return null;
    }
  }, [key, options]);

  const retry = React.useCallback(() => {
    if (context.error) {
      // We need the original async function to retry, so this is limited
      // In practice, you'd store the original function reference
      console.warn('Manual retry requires re-calling executeAsync with the original function');
    }
  }, [context.error]);

  const reset = React.useCallback(() => {
    loadingStateManager.createLoadingState(key, options);
  }, [key, options]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      loadingStateManager.removeLoadingState(key);
    };
  }, [key]);

  return {
    ...context,
    executeAsync,
    retry,
    reset,
    isIdle: context.state === 'idle',
    isLoading: context.state === 'loading',
    isSuccess: context.state === 'success',
    isError: context.state === 'error',
  };
}

// Hook for managing multiple loading states
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = React.useState<Map<string, LoadingStateContext>>(new Map());

  React.useEffect(() => {
    const unsubscribe = loadingStateManager.subscribe((states) => {
      setLoadingStates(new Map(states));
    });

    return unsubscribe;
  }, []);

  const hasAnyLoading = React.useMemo(() => {
    for (const context of loadingStates.values()) {
      if (context.state === 'loading') {
        return true;
      }
    }
    return false;
  }, [loadingStates]);

  const hasAnyError = React.useMemo(() => {
    for (const context of loadingStates.values()) {
      if (context.state === 'error') {
        return true;
      }
    }
    return false;
  }, [loadingStates]);

  const getLoadingProgress = React.useMemo(() => {
    const withProgress = Array.from(loadingStates.values()).filter(ctx => 
      ctx.state === 'loading' && typeof ctx.progress === 'number'
    );
    
    if (withProgress.length === 0) return undefined;
    
    const totalProgress = withProgress.reduce((sum, ctx) => sum + (ctx.progress || 0), 0);
    return totalProgress / withProgress.length;
  }, [loadingStates]);

  return {
    loadingStates,
    hasAnyLoading,
    hasAnyError,
    loadingProgress: getLoadingProgress,
    totalStates: loadingStates.size,
  };
}

// Hook for async operations with automatic loading state management
export function useAsyncOperation<T>(
  key: string,
  asyncFn: () => Promise<T>,
  options: LoadingOptions & {
    immediate?: boolean;
    dependencies?: React.DependencyList;
  } = {}
) {
  const { immediate = false, dependencies = [], ...loadingOptions } = options;
  const { executeAsync, ...loadingState } = useLoadingState(key, loadingOptions);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    const result = await executeAsync(asyncFn);
    if (result !== null) {
      setData(result);
    }
    return result;
  }, [executeAsync, asyncFn]);

  // Execute immediately if requested
  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  return {
    ...loadingState,
    data: data || loadingState.data,
    execute,
  };
}

// Utility components for loading states
export const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, loadingComponent, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          {loadingComponent || <LoadingSpinner size="lg" />}
        </div>
      )}
    </div>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showPercentage?: boolean;
}> = ({ progress, className = '', showPercentage = false }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm text-gray-600">{Math.round(safeProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};

// Cleanup function for testing
export function cleanupLoadingStates() {
  loadingStateManager.cleanup();
}

// Export the manager for advanced use cases
export { loadingStateManager };