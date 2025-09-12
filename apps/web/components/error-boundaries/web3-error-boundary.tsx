"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Shield, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface Web3ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolateError?: boolean;
}

interface Web3ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
}

export class Web3ErrorBoundary extends Component<Web3ErrorBoundaryProps, Web3ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Web3ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<Web3ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `web3_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error('Web3ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      web3Context: this.gatherWeb3Context()
    };

    // Send to error reporting service
    try {
      fetch('/api/errors/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(err => console.warn('Failed to report error:', err));
    } catch (reportError) {
      console.warn('Failed to report error:', reportError);
    }
  };

  private gatherWeb3Context = () => {
    try {
      return {
        hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
        isMetaMaskInstalled: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
        chainId: window.ethereum?.chainId,
        networkVersion: window.ethereum?.networkVersion,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
    } catch {
      return { error: 'Failed to gather Web3 context' };
    }
  };

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Wait before retry with exponential backoff
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
  };

  private handleReset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private getErrorType = (error: Error): 'connection' | 'wallet' | 'transaction' | 'network' | 'unknown' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('rpc') || message.includes('connection')) {
      return 'connection';
    }
    if (message.includes('wallet') || message.includes('metamask') || message.includes('user rejected')) {
      return 'wallet';
    }
    if (message.includes('transaction') || message.includes('gas') || message.includes('nonce')) {
      return 'transaction';
    }
    if (message.includes('chain') || message.includes('network')) {
      return 'network';
    }
    
    return 'unknown';
  };

  private renderErrorUI = () => {
    const { error } = this.state;
    if (!error) return null;

    const errorType = this.getErrorType(error);
    const canRetry = this.state.retryCount < this.maxRetries;

    return (
      <Web3ErrorFallback
        error={error}
        errorType={errorType}
        errorId={this.state.errorId}
        retryCount={this.state.retryCount}
        maxRetries={this.maxRetries}
        isRetrying={this.state.isRetrying}
        canRetry={canRetry}
        onRetry={this.handleRetry}
        onReset={this.handleReset}
      />
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Error fallback component
interface Web3ErrorFallbackProps {
  error: Error;
  errorType: 'connection' | 'wallet' | 'transaction' | 'network' | 'unknown';
  errorId: string | null;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  canRetry: boolean;
  onRetry: () => void;
  onReset: () => void;
}

function Web3ErrorFallback({
  error,
  errorType,
  errorId,
  retryCount,
  maxRetries,
  isRetrying,
  canRetry,
  onRetry,
  onReset
}: Web3ErrorFallbackProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'connection':
        return <WifiOff className="h-12 w-12 text-red-500" />;
      case 'wallet':
        return <Shield className="h-12 w-12 text-orange-500" />;
      case 'transaction':
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
      case 'network':
        return <Wifi className="h-12 w-12 text-blue-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'connection':
        return 'Connection Failed';
      case 'wallet':
        return 'Wallet Error';
      case 'transaction':
        return 'Transaction Error';
      case 'network':
        return 'Network Error';
      default:
        return 'Web3 Error';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'connection':
        return 'Unable to connect to the blockchain. Please check your internet connection and try again.';
      case 'wallet':
        return 'There was an issue with your wallet. Please ensure your wallet is connected and try again.';
      case 'transaction':
        return 'The transaction failed. This could be due to insufficient gas, network congestion, or other issues.';
      case 'network':
        return 'Network connectivity issues detected. Please check your connection and retry.';
      default:
        return 'An unexpected error occurred with Web3 functionality.';
    }
  };

  const getSuggestions = () => {
    switch (errorType) {
      case 'connection':
        return [
          'Check your internet connection',
          'Verify your wallet is connected',
          'Try switching to a different network',
          'Refresh the page and try again'
        ];
      case 'wallet':
        return [
          'Make sure your wallet is unlocked',
          'Check if you rejected the transaction',
          'Verify you have sufficient funds',
          'Try reconnecting your wallet'
        ];
      case 'transaction':
        return [
          'Check if you have enough gas',
          'Verify your balance is sufficient',
          'Try increasing the gas limit',
          'Wait and retry during lower network congestion'
        ];
      case 'network':
        return [
          'Switch to a different RPC endpoint',
          'Check network status pages',
          'Try again in a few minutes',
          'Clear browser cache and cookies'
        ];
      default:
        return [
          'Refresh the page',
          'Clear browser cache',
          'Try again later',
          'Contact support if issue persists'
        ];
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          {getErrorIcon()}
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {getErrorTitle()}
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {getErrorDescription()}
        </p>

        {/* Error Details (Collapsible) */}
        <details className="mb-6 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-200 mb-2">
            Technical Details
          </summary>
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium">Error ID:</span> {errorId || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Type:</span> {errorType}
            </div>
            <div>
              <span className="font-medium">Retry Count:</span> {retryCount}/{maxRetries}
            </div>
            <div>
              <span className="font-medium">Message:</span>
              <pre className="mt-1 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </div>
          </div>
        </details>

        {/* Suggestions */}
        <div className="mb-6 text-left">
          <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
            Try these steps:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {canRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : `Retry (${maxRetries - retryCount} left)`}
            </button>
          )}
          
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Help Link */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Need help? <a 
            href="/support" 
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

// Specific error boundaries for different Web3 components
export function WalletConnectionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Web3ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Shield className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Wallet Connection Error</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            Unable to connect to your wallet. Please check your wallet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      {children}
    </Web3ErrorBoundary>
  );
}

export function TransactionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Web3ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Transaction Error</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            The transaction could not be processed. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      }
    >
      {children}
    </Web3ErrorBoundary>
  );
}

export function NFTErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Web3ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">NFT Loading Error</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            Unable to load NFT data. This could be due to network issues or metadata problems.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      }
    >
      {children}
    </Web3ErrorBoundary>
  );
}

// Hook for programmatic error reporting
export function useWeb3ErrorReporting() {
  const reportError = (error: Error, context?: any) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      fetch('/api/errors/web3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(err => console.warn('Failed to report error:', err));
    } catch (reportError) {
      console.warn('Failed to report error:', reportError);
    }
  };

  return { reportError };
}

// Global error handler for unhandled Web3 errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('web3') || 
        event.reason?.message?.includes('ethereum') ||
        event.reason?.message?.includes('wallet')) {
      console.error('Unhandled Web3 Promise Rejection:', event.reason);
      
      // Could report to error service here
      try {
        fetch('/api/errors/web3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'unhandledRejection',
            timestamp: new Date().toISOString(),
            error: event.reason?.message || 'Unknown error',
            url: window.location.href
          })
        }).catch(() => {});
      } catch {}
    }
  });
}