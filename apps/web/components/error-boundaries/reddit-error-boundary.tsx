'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RedditErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string; // e.g., 'post', 'comment', 'voting', 'karma'
}

interface RedditErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

export class RedditErrorBoundary extends Component<
  RedditErrorBoundaryProps,
  RedditErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: RedditErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RedditErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `reddit-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    console.error(`Reddit Error Boundary [${this.props.context || 'unknown'}]:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error to monitoring service
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          context: this.props.context,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(reportError => {
        console.warn('Failed to report error to monitoring service:', reportError);
      });
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Reload the page as last resort
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const contextName = this.props.context || 'content';

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg m-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong with {contextName}
          </h3>
          
          <p className="text-sm text-red-600 text-center mb-4 max-w-md">
            We encountered an error while loading this {contextName}. 
            {canRetry ? ' You can try refreshing or' : ''} we can reload the page for you.
          </p>

          <div className="text-xs text-red-500 font-mono mb-4">
            Error ID: {this.state.errorId}
          </div>

          <div className="flex gap-2">
            {canRetry && (
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again ({this.maxRetries - this.state.retryCount} left)
              </Button>
            )}
            
            <Button 
              onClick={this.handleReload}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="text-sm text-red-600 cursor-pointer">
                Debug Info (Development)
              </summary>
              <pre className="mt-2 p-2 bg-red-100 text-xs text-red-800 rounded overflow-auto max-h-40">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with Reddit error boundary
export function withRedditErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  context?: string
) {
  const WrappedComponent = (props: T) => (
    <RedditErrorBoundary context={context}>
      <Component {...props} />
    </RedditErrorBoundary>
  );

  WrappedComponent.displayName = `withRedditErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for reporting errors manually
export function useRedditErrorReporting(context?: string) {
  const reportError = React.useCallback((error: Error, additionalInfo?: any) => {
    const errorId = `reddit-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`Reddit Error [${context || 'manual'}]:`, {
      error: error.message,
      stack: error.stack,
      errorId,
      additionalInfo,
    });

    // Report to monitoring service
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorId,
        context,
        message: error.message,
        stack: error.stack,
        additionalInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(reportError => {
      console.warn('Failed to report error to monitoring service:', reportError);
    });

    return errorId;
  }, [context]);

  return { reportError };
}