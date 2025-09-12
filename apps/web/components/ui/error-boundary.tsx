"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { cn } from "@/lib/utils";

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
  level?: "page" | "component" | "feature";
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  showDetails?: boolean;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
  level: "page" | "component" | "feature";
  showDetails: boolean;
}

// Base Error Boundary Class Component
class ErrorBoundaryBase extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys !== prevProps.resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <div className={this.props.className}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetErrorBoundary={this.resetErrorBoundary}
            level={this.props.level || "component"}
            showDetails={this.props.showDetails ?? process.env.NODE_ENV === "development"}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  level,
  showDetails,
}: ErrorFallbackProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getTitle = () => {
    switch (level) {
      case "page":
        return "Page Error";
      case "feature":
        return "Feature Error";
      default:
        return "Something went wrong";
    }
  };

  const getDescription = () => {
    switch (level) {
      case "page":
        return "An error occurred while loading this page. Please try refreshing or go back to the home page.";
      case "feature":
        return "This feature is currently experiencing issues. Please try again or continue using other parts of the application.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  const getIcon = () => {
    switch (level) {
      case "page":
        return <AlertTriangle className="h-8 w-8 text-error" />;
      case "feature":
        return <Bug className="h-6 w-6 text-warning" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-error" />;
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center p-4",
      level === "page" && "min-h-[400px]",
      level === "feature" && "min-h-[200px]",
      level === "component" && "min-h-[100px]"
    )}>
      <Card className={cn(
        "w-full max-w-md",
        level === "page" && "max-w-lg",
        level === "component" && "max-w-sm"
      )}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className={cn(
            level === "page" && "text-xl",
            level === "feature" && "text-lg",
            level === "component" && "text-base"
          )}>
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button onClick={resetErrorBoundary} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            {level === "page" && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {showDetails && error && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full"
              >
                {isExpanded ? "Hide Details" : "Show Details"}
              </Button>

              {isExpanded && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription className="mt-2">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        Error Message
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {error.message}
                      </pre>
                    </details>
                    {errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">
                          Component Stack
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized Error Boundaries for different use cases

// Page-level error boundary
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundaryBase level="page" {...props}>
      {children}
    </ErrorBoundaryBase>
  );
}

// Feature-level error boundary
export function FeatureErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundaryBase level="feature" {...props}>
      {children}
    </ErrorBoundaryBase>
  );
}

// Component-level error boundary
export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundaryBase level="component" {...props}>
      {children}
    </ErrorBoundaryBase>
  );
}

// Async error boundary for handling async operations
export function AsyncErrorBoundary({ 
  children, 
  onError,
  ...props 
}: ErrorBoundaryProps) {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Log to external service
    onError?.(error, errorInfo);
    
    // You could send to monitoring service like Sentry here
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }, [onError]);

  return (
    <ErrorBoundaryBase onError={handleError} {...props}>
      {children}
    </ErrorBoundaryBase>
  );
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Wrapper hook to catch async errors
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  return React.useCallback((error: Error) => {
    handleError(error);
  }, [handleError]);
}

// Main Error Boundary export
export const ErrorBoundary = ErrorBoundaryBase;

export type { ErrorBoundaryProps, ErrorFallbackProps };