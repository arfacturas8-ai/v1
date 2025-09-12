"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Bug, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  level?: 'critical' | 'component' | 'minor';
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  retryCount: number;
  level: 'critical' | 'component' | 'minor';
}

// Default fallback components for different error levels
const CriticalErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retryCount }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white p-8">
    <div className="text-center max-w-md">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Chat Unavailable</h2>
      <p className="text-gray-400 mb-6">
        Something went wrong with the chat system. We're working to fix this issue.
      </p>
      <div className="space-y-3">
        <Button onClick={resetError} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again {retryCount > 0 && `(${retryCount} attempts)`}
        </Button>
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-auto text-red-400">
            {error?.message}
          </pre>
        </details>
      </div>
    </div>
  </div>
);

const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retryCount }) => (
  <div className="flex items-center justify-center p-4 bg-gray-600/30 border border-gray-500 rounded-lg">
    <div className="text-center">
      <Bug className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
      <p className="text-sm text-gray-300 mb-3">Component failed to load</p>
      <Button size="sm" variant="outline" onClick={resetError}>
        <RefreshCw className="w-3 h-3 mr-1" />
        Retry {retryCount > 0 && `(${retryCount})`}
      </Button>
    </div>
  </div>
);

const MinorErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => (
  <div className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-200">
    <AlertTriangle className="w-4 h-4" />
    <span className="text-sm">Content unavailable</span>
    <Button size="sm" variant="ghost" onClick={resetError} className="ml-auto h-auto p-1">
      <RefreshCw className="w-3 h-3" />
    </Button>
  </div>
);

export class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private prevPropsRef: React.RefObject<ChatErrorBoundaryProps>;

  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
    this.prevPropsRef = React.createRef();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ChatErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if props change and resetOnPropsChange is enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRetrying: false,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send error report to monitoring service
    try {
      // This would typically send to your error monitoring service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      };
      
      console.error('Error Report:', errorReport);
      
      // Example: send to your monitoring service
      // errorMonitoring.captureException(error, { extra: errorReport });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Maximum retry attempts (${maxRetries}) reached for error boundary`);
      return;
    }

    this.setState({ isRetrying: true });

    // Add delay before retry to prevent rapid retries
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    }, retryDelay);
  };

  render() {
    const { hasError, error, retryCount, isRetrying } = this.state;
    const { children, fallback: CustomFallback, level = 'component' } = this.props;

    if (hasError) {
      if (isRetrying) {
        return (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-400">Retrying...</span>
          </div>
        );
      }

      const fallbackProps: ErrorFallbackProps = {
        error,
        resetError: this.handleRetry,
        retryCount,
        level,
      };

      if (CustomFallback) {
        return <CustomFallback {...fallbackProps} />;
      }

      // Use default fallback based on error level
      switch (level) {
        case 'critical':
          return <CriticalErrorFallback {...fallbackProps} />;
        case 'component':
          return <ComponentErrorFallback {...fallbackProps} />;
        case 'minor':
          return <MinorErrorFallback {...fallbackProps} />;
        default:
          return <ComponentErrorFallback {...fallbackProps} />;
      }
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ChatErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ChatErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} ref={ref} />
    </ChatErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError, error };
}

// Specific error boundaries for chat components
export const MessageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatErrorBoundary
    level="minor"
    maxRetries={2}
    resetOnPropsChange={true}
    onError={(error, errorInfo) => {
      console.error('Message component error:', error);
    }}
  >
    {children}
  </ChatErrorBoundary>
);

export const MessageListErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatErrorBoundary
    level="component"
    maxRetries={3}
    resetOnPropsChange={true}
    fallback={({ resetError }) => (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <MessageSquare className="w-12 h-12 mb-4" />
        <p className="mb-4">Messages failed to load</p>
        <Button onClick={resetError} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Messages
        </Button>
      </div>
    )}
  >
    {children}
  </ChatErrorBoundary>
);

export const ChatAreaErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatErrorBoundary
    level="critical"
    maxRetries={5}
    onError={(error, errorInfo) => {
      console.error('Critical chat area error:', error, errorInfo);
      // This would typically report to your error monitoring service
    }}
  >
    {children}
  </ChatErrorBoundary>
);