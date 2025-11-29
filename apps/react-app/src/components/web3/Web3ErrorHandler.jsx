import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Info,
  Zap,
  Wifi,
  WifiOff,
  Shield,
  AlertCircle,
  Download,
  ArrowRight,
  X
} from 'lucide-react';
import Button from '../ui/Button';

// Error types and their user-friendly messages
const WEB3_ERROR_TYPES = {
  // Connection errors
  'wallet_not_found': {
    title: 'Wallet Not Found',
    message: 'No Web3 wallet detected. Please install a compatible wallet.',
    severity: 'error',
    actionable: true,
    solutions: [
      'Install MetaMask browser extension',
      'Install Coinbase Wallet',
      'Use a Web3-enabled browser'
    ]
  },
  'wallet_not_connected': {
    title: 'Wallet Not Connected',
    message: 'Please connect your wallet to continue.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Click the "Connect Wallet" button',
      'Check if your wallet is unlocked',
      'Refresh the page and try again'
    ]
  },
  'connection_rejected': {
    title: 'Connection Rejected',
    message: 'You rejected the wallet connection request.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Click "Connect Wallet" and approve the request',
      'Check your wallet for pending requests',
      'Make sure you trust this website'
    ]
  },
  'network_error': {
    title: 'Network Error',
    message: 'Unable to connect to the blockchain network.',
    severity: 'error',
    actionable: true,
    solutions: [
      'Check your internet connection',
      'Try switching to a different network',
      'Wait for network congestion to clear'
    ]
  },
  
  // Transaction errors
  'insufficient_funds': {
    title: 'Insufficient Funds',
    message: 'You don\'t have enough funds for this transaction.',
    severity: 'error',
    actionable: true,
    solutions: [
      'Add more funds to your wallet',
      'Reduce the transaction amount',
      'Check if you have enough gas fees'
    ]
  },
  'gas_estimation_failed': {
    title: 'Gas Estimation Failed',
    message: 'Unable to estimate gas fees for this transaction.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Try again in a few moments',
      'Set a custom gas limit',
      'Check if the contract is working properly'
    ]
  },
  'transaction_failed': {
    title: 'Transaction Failed',
    message: 'Your transaction could not be processed.',
    severity: 'error',
    actionable: true,
    solutions: [
      'Check the transaction details and try again',
      'Increase the gas limit or price',
      'Ensure you have sufficient balance'
    ]
  },
  'user_rejected_transaction': {
    title: 'Transaction Rejected',
    message: 'You cancelled the transaction.',
    severity: 'info',
    actionable: false,
    solutions: ['Try again when you\'re ready to proceed']
  },
  
  // Network and chain errors
  'unsupported_chain': {
    title: 'Unsupported Network',
    message: 'This network is not currently supported.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Switch to Ethereum Mainnet',
      'Use a supported network',
      'Check our roadmap for upcoming networks'
    ]
  },
  'chain_switch_rejected': {
    title: 'Network Switch Rejected',
    message: 'You rejected the network switch request.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Accept the network switch prompt',
      'Manually switch networks in your wallet',
      'Contact support if you need help'
    ]
  },
  'chain_not_added': {
    title: 'Network Not Added',
    message: 'This network is not added to your wallet.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Add the network to your wallet',
      'Use a different supported network',
      'Check the network configuration'
    ]
  },
  
  // Authentication errors
  'signature_rejected': {
    title: 'Signature Rejected',
    message: 'You rejected the signature request.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Click "Sign" in your wallet',
      'Verify the message before signing',
      'Try the authentication process again'
    ]
  },
  'auth_expired': {
    title: 'Authentication Expired',
    message: 'Your authentication session has expired.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Sign in again',
      'Refresh the page',
      'Check your wallet connection'
    ]
  },
  
  // General errors
  'timeout': {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    severity: 'warning',
    actionable: true,
    solutions: [
      'Try again with a faster network',
      'Increase gas price for faster processing',
      'Check your internet connection'
    ]
  },
  'unknown_error': {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    severity: 'error',
    actionable: true,
    solutions: [
      'Try again in a few moments',
      'Refresh the page',
      'Contact support if the issue persists'
    ]
  }
};

// Error severity levels
const ERROR_SEVERITY = {
  info: {
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    icon: <Info style={{
  height: '20px',
  width: '20px'
}} />
  },
  warning: {
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: <AlertTriangle style={{
  height: '20px',
  width: '20px'
}} />
  },
  error: {
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    icon: <XCircle style={{
  height: '20px',
  width: '20px'
}} />
  }
};

// Parse error message to determine type and details
function parseWeb3Error(error) {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code;
  
  // Check for specific error patterns
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
    if (errorMessage.includes('transaction')) {
      return { type: 'user_rejected_transaction', originalError: error };
    }
    if (errorMessage.includes('switch') || errorMessage.includes('chain')) {
      return { type: 'chain_switch_rejected', originalError: error };
    }
    if (errorMessage.includes('signature') || errorMessage.includes('sign')) {
      return { type: 'signature_rejected', originalError: error };
    }
    return { type: 'connection_rejected', originalError: error };
  }
  
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return { type: 'insufficient_funds', originalError: error };
  }
  
  if (errorMessage.includes('gas') && (errorMessage.includes('estimation') || errorMessage.includes('estimate'))) {
    return { type: 'gas_estimation_failed', originalError: error };
  }
  
  if (errorMessage.includes('network') && errorMessage.includes('error')) {
    return { type: 'network_error', originalError: error };
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return { type: 'timeout', originalError: error };
  }
  
  if (errorMessage.includes('unsupported') && errorMessage.includes('chain')) {
    return { type: 'unsupported_chain', originalError: error };
  }
  
  if (errorMessage.includes('No Web3') || errorMessage.includes('wallet not found')) {
    return { type: 'wallet_not_found', originalError: error };
  }
  
  if (errorMessage.includes('not connected') || errorMessage.includes('no account')) {
    return { type: 'wallet_not_connected', originalError: error };
  }
  
  if (errorCode === 4902) {
    return { type: 'chain_not_added', originalError: error };
  }
  
  if (errorMessage.includes('transaction failed') || errorMessage.includes('execution reverted')) {
    return { type: 'transaction_failed', originalError: error };
  }
  
  // Default to unknown error
  return { type: 'unknown_error', originalError: error };
}

function Web3ErrorHandler({ 
  error, 
  onRetry, 
  onDismiss,
  showTechnicalDetails = false,
  className = '' 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);

  if (!error) return null;

  const parsedError = parseWeb3Error(error);
  const errorInfo = WEB3_ERROR_TYPES[parsedError.type] || WEB3_ERROR_TYPES.unknown_error;
  const severityInfo = ERROR_SEVERITY[errorInfo.severity];

  return (
    <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
        <div className={severityInfo.color}>
          {severityInfo.icon}
        </div>
        
        <div style={{
  flex: '1'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h4 style={{
  fontWeight: '600'
}}>
              {errorInfo.title}
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`${severityInfo.color} hover:opacity-70 transition-opacity`}
              >
                <X style={{
  height: '16px',
  width: '16px'
}} />
              </button>
            )}
          </div>
          
          <p className={`text-sm mb-3 ${severityInfo.color}`}>
            {errorInfo.message}
          </p>

          {/* Action buttons */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            {onRetry && errorInfo.actionable && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="secondary"
                className="text-xs"
              >
                <RefreshCw style={{
  height: '12px',
  width: '12px'
}} />
                Try Again
              </Button>
            )}
            
            {errorInfo.solutions && errorInfo.solutions.length > 0 && (
              <button
                onClick={() => setShowSolutions(!showSolutions)}
                className={`text-xs ${severityInfo.color} hover:opacity-70 transition-opacity`}
              >
                {showSolutions ? 'Hide Solutions' : 'Show Solutions'}
              </button>
            )}
            
            {showTechnicalDetails && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`text-xs ${severityInfo.color} hover:opacity-70 transition-opacity`}
              >
                {isExpanded ? 'Hide Details' : 'Technical Details'}
              </button>
            )}
          </div>

          {/* Solutions */}
          {showSolutions && errorInfo.solutions && (
            <div className="mb-3">
              <h5 style={{
  fontWeight: '500'
}}>
                Suggested Solutions:
              </h5>
              <ul className="space-y-1">
                {errorInfo.solutions.map((solution, index) => (
                  <li key={index} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
                    <ArrowRight style={{
  height: '12px',
  width: '12px'
}} />
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical details */}
          {isExpanded && (
            <div style={{
  borderRadius: '4px',
  padding: '12px'
}}>
              <h5 style={{
  fontWeight: '500'
}}>
                Technical Details:
              </h5>
              <div style={{
  borderRadius: '4px',
  padding: '8px'
}}>
                {parsedError.originalError?.message || 'No additional details available'}
              </div>
              {parsedError.originalError?.stack && (
                <details className="mt-2">
                  <summary className={`cursor-pointer ${severityInfo.color} hover:opacity-70`}>
                    Stack Trace
                  </summary>
                  <pre style={{
  borderRadius: '4px',
  padding: '8px',
  overflow: 'auto'
}}>
                    {parsedError.originalError.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error boundary for Web3 components
export class Web3ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Web3 Error Boundary caught an error:', error, errorInfo);
    
    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => {
          this.setState({ hasError: false, error: null, errorId: null });
        });
      }

      return (
        <div style={{
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <XCircle style={{
  height: '48px',
  width: '48px'
}} />
            <h3 style={{
  fontWeight: '600'
}}>
              Web3 Component Error
            </h3>
            <p className="text-sm text-muted mb-4">
              A Web3 component encountered an unexpected error and has been safely isolated.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorId: null });
                }}
                size="sm"
              >
                <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />
                Try Again
              </Button>
              <div className="text-xs text-muted">
                Error ID: {this.state.errorId}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling Web3 errors
export function useWeb3ErrorHandler() {
  const [errors, setErrors] = useState([]);

  const addError = (error, options = {}) => {
    const errorId = Math.random().toString(36).substr(2, 9);
    const errorEntry = {
      id: errorId,
      error,
      timestamp: new Date(),
      dismissed: false,
      ...options
    };
    
    setErrors(prev => [errorEntry, ...prev.slice(0, 4)]); // Keep max 5 errors
    
    // Auto-dismiss info errors after 5 seconds
    if (WEB3_ERROR_TYPES[parseWeb3Error(error).type]?.severity === 'info') {
      setTimeout(() => {
        dismissError(errorId);
      }, 5000);
    }
    
    return errorId;
  };

  const dismissError = (errorId) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  return {
    errors: errors.filter(err => !err.dismissed),
    addError,
    dismissError,
    clearAllErrors
  };
}

// Utility function to get user-friendly error message
export function getWeb3ErrorMessage(error) {
  const parsedError = parseWeb3Error(error);
  const errorInfo = WEB3_ERROR_TYPES[parsedError.type] || WEB3_ERROR_TYPES.unknown_error;
  return errorInfo.message;
}




export default WEB3_ERROR_TYPES
