/**
 * GLOBAL ERROR BOUNDARY SYSTEM
 * Catches React errors and provides recovery mechanisms
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import RNRestart from 'react-native-restart';
import { CrashDetector } from '../utils/CrashDetector';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

interface ErrorInfo {
  componentStack: string;
}

interface CrashState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  CrashState
> {
  private maxRetries = 3;
  
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CrashState> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = await this.reportError(error, errorInfo);
    
    this.setState({
      errorInfo,
      errorId,
    });
  }

  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<string> {
    try {
      await CrashDetector.reportError(error, {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount.toString(),
      }, 'high');
      
      return 'Error reported successfully';
    } catch (reportingError) {
      console.error('[ErrorBoundary] Failed to report error:', reportingError);
      return 'Failed to report error';
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: this.state.retryCount + 1,
      });
    } else {
      this.handleRestart();
    }
  };

  private handleRestart = () => {
    RNRestart.Restart();
  };

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
            restart={this.handleRestart}
            dismiss={this.handleDismiss}
            canRetry={this.state.retryCount < this.maxRetries}
          />
        );
      }

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.subtitle}>
              The app encountered an unexpected error, but don't worry - we can fix this.
            </Text>

            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>
                {this.state.error?.name}: {this.state.error?.message}
              </Text>
              {this.state.errorId && (
                <Text style={styles.errorId}>ID: {this.state.errorId}</Text>
              )}
            </View>

            <View style={styles.actions}>
              {this.state.retryCount < this.maxRetries && (
                <TouchableOpacity style={styles.primaryButton} onPress={this.handleRetry}>
                  <Text style={styles.primaryButtonText}>
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleDismiss}>
                <Text style={styles.secondaryButtonText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
                <Text style={styles.restartButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              If this problem persists, please contact support.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Functional error fallback component
function ErrorFallback({ 
  error, 
  resetErrorBoundary: resetError, 
  restart = () => RNRestart.Restart() 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
  restart?: () => void;
}) {
  const handleRetry = async () => {
    try {
      await CrashDetector.reportError(error, { action: 'retry' }, 'medium');
      resetError();
    } catch (reportingError) {
      console.error('[ErrorFallback] Failed to report retry:', reportingError);
      resetError();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        
        <Text style={styles.subtitle}>
          We've encountered an unexpected error.
        </Text>

        <View style={styles.errorDetails}>
          <Text style={styles.errorTitle}>Error:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restartButton} onPress={restart}>
            <Text style={styles.restartButtonText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Hook for error boundary
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    CrashDetector.reportError(error, errorInfo || {}, 'medium');
  }, []);
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<any>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryClass fallback={fallback}>
      <Component {...props} />
    </ErrorBoundaryClass>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Main ErrorBoundary component using react-error-boundary
export function ErrorBoundary({ 
  children, 
  fallback,
  onError 
}: { 
  children: React.ReactNode;
  fallback?: React.ComponentType<any>;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}) {
  const handleError = React.useCallback(async (error: Error, errorInfo: any) => {
    try {
      await CrashDetector.reportError(error, { componentStack: errorInfo.componentStack || '' }, 'high');
      onError?.(error, errorInfo);
    } catch (reportingError) {
      console.error('[ErrorBoundary] Failed to report error:', reportingError);
    }
  }, [onError]);

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Clear any error state
        console.log('[ErrorBoundary] Resetting error state');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Screen-level error boundary
export function ScreenErrorBoundary({ children, screenName }: { children: React.ReactNode; screenName: string }) {
  const handleError = React.useCallback((error: Error, errorInfo: { componentStack: string }) => {
    CrashDetector.reportError(error, {
      screen: screenName,
      componentStack: errorInfo.componentStack,
    }, 'high');
  }, [screenName]);

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.h4,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.body1,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#0A0A0B',
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.xxxl,
    width: '100%',
  },
  errorTitle: {
    fontSize: typography.body2,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.caption,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorId: {
    fontSize: 10,
    color: '#888888',
    marginTop: spacing.sm,
  },
  actions: {
    width: '100%',
    gap: spacing.lg,
  },
  primaryButton: {
    backgroundColor: '#4a9eff',
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a9eff',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4a9eff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#ff6b6b',
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#ffffff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  footer: {
    fontSize: typography.caption,
    color: '#888888',
    textAlign: 'center',
    marginTop: spacing.xxxl,
    lineHeight: 18,
  },
});

export { ErrorBoundaryClass };