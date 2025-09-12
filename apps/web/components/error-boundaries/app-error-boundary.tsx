"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  hasError: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorBoundary: string;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorBoundary: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorBoundary: error.stack || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log to external services here
    // Example: Sentry.captureException(error);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorBoundary: '',
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
            hasError={this.state.hasError}
          />
        );
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="max-w-lg w-full p-6 bg-gray-800 border-gray-700">
        <div className="text-center space-y-4">
          <div className="text-6xl">😵</div>
          <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400">
            We're sorry, but something unexpected happened. The error has been logged and we're working to fix it.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                Show error details
              </summary>
              <pre className="mt-2 p-2 bg-gray-900 text-xs text-red-400 overflow-auto rounded border border-gray-700">
                {error.message}
                {error.stack && (
                  <>
                    <br />
                    <br />
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={resetError}
              variant="brand"
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-4">
            If this problem persists, please contact support.
          </div>
        </div>
      </Card>
    </div>
  );
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <AppErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AppErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack: string }) => {
    console.error('Handled error:', error, errorInfo);
    // You can add custom error reporting logic here
  };
}

export default AppErrorBoundary;