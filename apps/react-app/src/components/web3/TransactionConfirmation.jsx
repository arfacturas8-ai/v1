import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  ExternalLink, 
  AlertTriangle, 
  ArrowRight,
  Copy,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import { formatTokenAmount, formatUSDValue, generateTxHash } from '../../utils/web3Utils';
import { getErrorMessage } from '../../utils/errorUtils'

const TRANSACTION_STATES = {
  PREPARING: 'preparing',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const CONFIRMATION_BLOCKS = {
  LOW_VALUE: 1,    // < $100
  MEDIUM_VALUE: 3, // $100 - $1000
  HIGH_VALUE: 6,   // > $1000
  CRITICAL: 12     // > $10000
};

function TransactionConfirmation({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  onCancel,
  className = ''
}) {
  const [txState, setTxState] = useState(TRANSACTION_STATES.PREPARING);
  const [txHash, setTxHash] = useState(null);
  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(1);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isOpen && transaction) {
      resetState();
      calculateRequiredConfirmations();
    }
  }, [isOpen, transaction]);

  useEffect(() => {
    // Simulate confirmation updates when transaction is pending
    if (txState === TRANSACTION_STATES.PENDING && txHash) {
      const interval = setInterval(() => {
        setConfirmations(prev => {
          if (prev < requiredConfirmations) {
            const next = prev + 1;
            if (next >= requiredConfirmations) {
              setTxState(TRANSACTION_STATES.CONFIRMED);
            }
            return next;
          }
          return prev;
        });
      }, 3000); // Simulate 3 second block time

      return () => clearInterval(interval);
    }
  }, [txState, txHash, requiredConfirmations]);

  const resetState = () => {
    setTxState(TRANSACTION_STATES.PREPARING);
    setTxHash(null);
    setConfirmations(0);
    setError(null);
    setRetryCount(0);
  };

  const calculateRequiredConfirmations = () => {
    if (!transaction?.amount) return;
    
    const value = parseFloat(transaction.amount);
    const usdValue = transaction.usdValue || value * 2000; // Mock ETH price
    
    if (usdValue >= 10000) {
      setRequiredConfirmations(CONFIRMATION_BLOCKS.CRITICAL);
    } else if (usdValue >= 1000) {
      setRequiredConfirmations(CONFIRMATION_BLOCKS.HIGH_VALUE);
    } else if (usdValue >= 100) {
      setRequiredConfirmations(CONFIRMATION_BLOCKS.MEDIUM_VALUE);
    } else {
      setRequiredConfirmations(CONFIRMATION_BLOCKS.LOW_VALUE);
    }
  };

  const handleConfirm = async () => {
    try {
      setTxState(TRANSACTION_STATES.PENDING);
      setError(null);
      
      // Generate mock transaction hash
      const hash = generateTxHash();
      setTxHash(hash);
      
      // Simulate transaction confirmation delay
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          setConfirmations(1);
          if (onConfirm) {
            onConfirm({ txHash: hash, status: 'pending' });
          }
        } else {
          setTxState(TRANSACTION_STATES.FAILED);
          setError('Transaction failed: insufficient gas or network congestion');
        }
      }, 2000);
      
    } catch (err) {
      setTxState(TRANSACTION_STATES.FAILED);
      setError(err.message || 'Transaction failed');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    resetState();
    handleConfirm();
  };

  const handleCancel = () => {
    setTxState(TRANSACTION_STATES.CANCELLED);
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (hash) => {
    return `https://etherscan.io/tx/${hash}`;
  };

  const getConfirmationProgress = () => {
    return Math.min((confirmations / requiredConfirmations) * 100, 100);
  };

  const getStateIcon = () => {
    switch (txState) {
      case TRANSACTION_STATES.PREPARING:
        return <Clock style={{
  height: '24px',
  width: '24px'
}} />;
      case TRANSACTION_STATES.PENDING:
        return <Loader2 style={{
  height: '24px',
  width: '24px'
}} />;
      case TRANSACTION_STATES.CONFIRMED:
        return <CheckCircle style={{
  height: '24px',
  width: '24px'
}} />;
      case TRANSACTION_STATES.FAILED:
        return <XCircle style={{
  height: '24px',
  width: '24px'
}} />;
      case TRANSACTION_STATES.CANCELLED:
        return <XCircle style={{
  height: '24px',
  width: '24px'
}} />;
      default:
        return <Clock style={{
  height: '24px',
  width: '24px'
}} />;
    }
  };

  const getStateMessage = () => {
    switch (txState) {
      case TRANSACTION_STATES.PREPARING:
        return 'Preparing transaction...';
      case TRANSACTION_STATES.PENDING:
        return `Waiting for confirmations (${confirmations}/${requiredConfirmations})`;
      case TRANSACTION_STATES.CONFIRMED:
        return 'Transaction confirmed!';
      case TRANSACTION_STATES.FAILED:
        return 'Transaction failed';
      case TRANSACTION_STATES.CANCELLED:
        return 'Transaction cancelled';
      default:
        return '';
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  width: '100%'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            {getStateIcon()}
            <h3 style={{
  fontWeight: '600'
}}>
              {transaction.type === 'send' ? 'Send Transaction' : 
               transaction.type === 'tip' ? 'Crypto Tip' :
               transaction.type === 'stake' ? 'Stake Tokens' :
               'Transaction'}
            </h3>
          </div>
          <p className="text-sm text-muted">{getStateMessage()}</p>
        </div>

        {/* Transaction Details */}
        <div style={{
  padding: '24px'
}}>
          {/* Amount Display */}
          <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span className="text-sm text-muted">Amount</span>
              <div style={{
  textAlign: 'right'
}}>
                <div style={{
  fontWeight: '600'
}}>
                  {formatTokenAmount(transaction.amount, transaction.decimals || 18)} {transaction.symbol || 'ETH'}
                </div>
                {transaction.usdValue && (
                  <div className="text-sm text-muted">
                    ≈ {formatUSDValue(transaction.usdValue)}
                  </div>
                )}
              </div>
            </div>

            {/* Recipient */}
            {transaction.recipient && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">To</span>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <span className="font-mono text-primary">
                    {transaction.recipientName || 
                     `${transaction.recipient.slice(0, 6)}...${transaction.recipient.slice(-4)}`}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.recipient)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Copy style={{
  height: '12px',
  width: '12px'
}} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gas Information */}
          {gasEstimate && (
            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span className="text-sm text-muted">Network Fee</span>
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  fontWeight: '500'
}}>
                    {gasEstimate.fee} ETH
                  </div>
                  <div className="text-xs text-muted">
                    Gas: {gasEstimate.gasLimit?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span className="text-sm text-muted">Transaction Hash</span>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Copy style={{
  height: '12px',
  width: '12px'
}} />
                  </button>
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-secondary transition-colors"
                  >
                    <ExternalLink style={{
  height: '12px',
  width: '12px'
}} />
                  </a>
                </div>
              </div>
              <div className="font-mono text-xs text-primary break-all">
                {txHash}
              </div>
            </div>
          )}

          {/* Confirmation Progress */}
          {txState === TRANSACTION_STATES.PENDING && (
            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span className="text-sm text-muted">Confirmations</span>
                <span style={{
  fontWeight: '500'
}}>
                  {confirmations}/{requiredConfirmations}
                </span>
              </div>
              <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
                <div 
                  style={{
  height: '8px',
  borderRadius: '50%'
}}
                  style={{ width: `${getConfirmationProgress()}%` }}
                />
              </div>
              <div className="text-xs text-muted mt-2">
                {confirmations === 0 ? 'Broadcasting to network...' :
                 confirmations < requiredConfirmations ? 'Waiting for network confirmations...' :
                 'Fully confirmed!'}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <AlertTriangle style={{
  height: '16px',
  width: '16px'
}} />
                <span style={{
  fontWeight: '500'
}}>Transaction Failed</span>
              </div>
              <p className="text-sm text-error/80">{typeof error === "string" ? error : getErrorMessage(error, "")}</p>
              {retryCount < 3 && (
                <Button
                  onClick={handleRetry}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  <RefreshCw style={{
  height: '12px',
  width: '12px'
}} />
                  Retry Transaction
                </Button>
              )}
            </div>
          )}

          {/* Success Message */}
          {txState === TRANSACTION_STATES.CONFIRMED && (
            <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center'
}}>
              <CheckCircle style={{
  height: '48px',
  width: '48px'
}} />
              <h4 style={{
  fontWeight: '600'
}}>Transaction Confirmed!</h4>
              <p className="text-sm text-success/80">
                Your transaction has been successfully processed and confirmed on the blockchain.
              </p>
            </div>
          )}

          {/* Advanced Details Toggle */}
          {txHash && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
  width: '100%'
}}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Details
            </button>
          )}

          {/* Advanced Details */}
          {showAdvanced && txHash && (
            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Block Number:</span>
                <span className="font-mono">18,123,456</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Gas Price:</span>
                <span className="font-mono">25 gwei</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Gas Used:</span>
                <span className="font-mono">21,000</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Nonce:</span>
                <span className="font-mono">42</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
  padding: '24px'
}}>
          {txState === TRANSACTION_STATES.PREPARING && (
            <div style={{
  display: 'flex',
  gap: '12px'
}}>
              <Button
                onClick={handleCancel}
                variant="secondary"
                style={{
  flex: '1'
}}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                style={{
  flex: '1'
}}
              >
                Confirm Transaction
              </Button>
            </div>
          )}

          {(txState === TRANSACTION_STATES.CONFIRMED || txState === TRANSACTION_STATES.FAILED || txState === TRANSACTION_STATES.CANCELLED) && (
            <Button
              onClick={onClose}
              style={{
  width: '100%'
}}
            >
              Close
            </Button>
          )}

          {txState === TRANSACTION_STATES.PENDING && (
            <div style={{
  textAlign: 'center'
}}>
              <p className="text-sm text-muted mb-3">
                Do not close this window. Your transaction is being processed...
              </p>
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="sm"
                disabled={confirmations > 0}
              >
                Cancel Transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Copy feedback */}
      {copied && (
        <div style={{
  position: 'fixed',
  border: '1px solid var(--border-subtle)',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}>
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

// Transaction status indicator component
export function TransactionStatusIndicator({ status, confirmations, requiredConfirmations, className = '' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'confirmed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      default:
        return 'text-muted';
    }
  };

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      {status === 'pending' && <Loader2 style={{
  height: '16px',
  width: '16px'
}} />}
      {status === 'confirmed' && <CheckCircle style={{
  height: '16px',
  width: '16px'
}} />}
      {status === 'failed' && <XCircle style={{
  height: '16px',
  width: '16px'
}} />}
      
      <span style={{
  fontWeight: '500'
}}>
        {status === 'pending' && `${confirmations}/${requiredConfirmations} confirmations`}
        {status === 'confirmed' && 'Confirmed'}
        {status === 'failed' && 'Failed'}
      </span>
    </div>
  );
}



export default TransactionConfirmation;