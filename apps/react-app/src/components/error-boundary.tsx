'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Here you could send error to monitoring service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='flex min-h-screen items-center justify-center p-4 bg-background'>
          <Card className='w-full max-w-lg'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
                <svg
                  className='h-6 w-6 text-destructive'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <CardTitle className='text-xl font-bold text-destructive'>
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className='text-base'>
                We encountered an unexpected error. This has been logged and we&apos;ll look into it.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className='rounded border p-3 text-sm bg-muted/50'>
                  <summary className='cursor-pointer font-medium text-foreground mb-2'>
                    Error Details (Development)
                  </summary>
                  <div className='space-y-2'>
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className='mt-1 text-xs overflow-auto max-h-32 p-2 bg-background rounded'>
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className='mt-1 text-xs overflow-auto max-h-32 p-2 bg-background rounded'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button onClick={this.handleReset} className='flex-1'>
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant='outline' className='flex-1'>
                  Reload Page
                </Button>
              </div>
              
              <div className='text-center'>
                <Button variant='link' asChild>
                  <a href='/' className='text-sm'>
                    Return to Home
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}