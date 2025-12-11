/**
 * CRYB Platform - Transaction Confirmation Modal
 * Transaction confirmation with gas estimates and explorer link
 */

import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/modal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  ArrowRight,
  Check,
  AlertCircle,
  ExternalLink,
  Fuel,
  Clock,
  DollarSign,
} from 'lucide-react';

// ===== TRANSACTION TYPES =====
export type TransactionType =
  | 'transfer'
  | 'swap'
  | 'approve'
  | 'mint'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'contract';

// ===== TRANSACTION DATA =====
export interface TransactionData {
  type: TransactionType;
  title: string;
  description?: string;
  from: string;
  to: string;
  amount?: string;
  tokenSymbol?: string;
  gasEstimate?: string;
  gasPriceGwei?: string;
  totalCostUSD?: string;
  estimatedTime?: string;
  warnings?: string[];
}

// ===== TRANSACTION STATE =====
type TransactionState = 'confirm' | 'signing' | 'pending' | 'success' | 'error';

// ===== MODAL PROPS =====
export interface TransactionConfirmationModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Transaction data */
  transaction: TransactionData;
  /** Callback when transaction is confirmed */
  onConfirm?: () => Promise<{ hash: string; explorerUrl?: string }>;
  /** Callback when transaction is rejected */
  onReject?: () => void;
  /** Network name */
  networkName?: string;
  /** Block explorer base URL */
  explorerBaseUrl?: string;
}

// ===== TRANSACTION TYPE CONFIG =====
const TRANSACTION_TYPE_CONFIG: Record<TransactionType, { icon: string; color: string }> = {
  transfer: { icon: '💸', color: 'text-blue-500' },
  swap: { icon: '🔄', color: 'text-purple-500' },
  approve: { icon: '✓', color: 'text-green-500' },
  mint: { icon: '⚡', color: 'text-yellow-500' },
  stake: { icon: '🔒', color: 'text-indigo-500' },
  unstake: { icon: '🔓', color: 'text-orange-500' },
  claim: { icon: '🎁', color: 'text-pink-500' },
  contract: { icon: '📜', color: 'text-gray-500' },
};

// ===== TRANSACTION CONFIRMATION MODAL COMPONENT =====
export const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  open,
  onOpenChange,
  transaction,
  onConfirm,
  onReject,
  networkName = 'Ethereum',
  explorerBaseUrl = 'https://etherscan.io',
}) => {
  const [state, setState] = useState<TransactionState>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];

  // Handle confirm
  const handleConfirm = async () => {
    setState('signing');
    setError(null);

    try {
      const result = await onConfirm?.();

      if (result) {
        setTxHash(result.hash);
        setExplorerUrl(result.explorerUrl || `${explorerBaseUrl}/tx/${result.hash}`);
        setState('pending');

        // Simulate transaction confirmation (in real app, listen to blockchain)
        setTimeout(() => {
          setState('success');
        }, 3000);
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  // Handle reject
  const handleReject = () => {
    onReject?.();
    onOpenChange(false);
    resetState();
  };

  // Handle close
  const handleClose = () => {
    if (state === 'confirm' || state === 'error' || state === 'success') {
      onOpenChange(false);
      resetState();
    }
  };

  // Reset state
  const resetState = () => {
    setState('confirm');
    setError(null);
    setTxHash(null);
    setExplorerUrl(null);
  };

  // Truncate address
  const truncateAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Render confirmation view
  const renderConfirmation = () => (
    <>
      <ModalBody>
        <div className="space-y-4">
          {/* Transaction Type */}
          <div className="text-center pb-4 border-b border-border">
            <div className="text-4xl mb-2">{typeConfig.icon}</div>
            <h3 className="text-lg font-semibold mb-1">{transaction.title}</h3>
            {transaction.description && (
              <p className="text-sm text-muted-foreground">{transaction.description}</p>
            )}
          </div>

          {/* Amount (if applicable) */}
          {transaction.amount && (
            <div className="text-center py-4 border-b border-border">
              <p className="text-3xl font-bold">
                {transaction.amount} {transaction.tokenSymbol}
              </p>
            </div>
          )}

          {/* From/To */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">From</p>
              <p className="font-mono text-sm font-medium">
                {truncateAddress(transaction.from)}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <p className="font-mono text-sm font-medium">
                {truncateAddress(transaction.to)}
              </p>
            </div>
          </div>

          {/* Gas Fees */}
          <div className="space-y-3">
            {transaction.gasEstimate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fuel className="h-4 w-4" />
                  Gas Estimate
                </div>
                <div className="font-medium">{transaction.gasEstimate}</div>
              </div>
            )}

            {transaction.gasPriceGwei && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Gas Price
                </div>
                <div className="font-medium">{transaction.gasPriceGwei} Gwei</div>
              </div>
            )}

            {transaction.estimatedTime && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Estimated Time
                </div>
                <div className="font-medium">{transaction.estimatedTime}</div>
              </div>
            )}

            {transaction.totalCostUSD && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-sm font-semibold">Total Cost</div>
                <div className="text-lg font-bold">${transaction.totalCostUSD}</div>
              </div>
            )}
          </div>

          {/* Warnings */}
          {transaction.warnings && transaction.warnings.length > 0 && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {transaction.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="text-center text-xs text-muted-foreground">
            Network: {networkName}
          </div>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleReject}>
          Reject
        </Button>
        <Button onClick={handleConfirm}>
          Confirm Transaction
        </Button>
      </ModalFooter>
    </>
  );

  // Render signing state
  const renderSigning = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 " />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary " />
        </div>
        <h3 className="text-lg font-semibold mb-2">Waiting for Signature</h3>
        <p className="text-sm text-muted-foreground text-center">
          Please sign the transaction in your wallet
        </p>
      </div>
    </ModalBody>
  );

  // Render pending state
  const renderPending = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500/20" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 " />
        </div>
        <h3 className="text-lg font-semibold mb-2">Transaction Pending</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Your transaction is being processed on the blockchain
        </p>
        {explorerUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(explorerUrl, '_blank')}
            rightIcon={<ExternalLink className="h-4 w-4" />}
          >
            View on Explorer
          </Button>
        )}
      </div>
    </ModalBody>
  );

  // Render success state
  const renderSuccess = () => (
    <>
      <ModalBody>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Transaction Successful!</h3>
          <p className="text-sm text-muted-foreground text-center mb-2">
            Your transaction has been confirmed
          </p>
          {txHash && (
            <p className="text-xs font-mono text-muted-foreground mb-6">
              {truncateAddress(txHash)}
            </p>
          )}
          {explorerUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(explorerUrl, '_blank')}
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              View on Explorer
            </Button>
          )}
        </div>
      </ModalBody>

      <ModalFooter justify="center">
        <Button variant="primary" onClick={handleClose}>
          Close
        </Button>
      </ModalFooter>
    </>
  );

  // Render error state
  const renderError = () => (
    <>
      <ModalBody>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Transaction Failed</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            {error || 'The transaction failed. Please try again.'}
          </p>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm}>
          Try Again
        </Button>
      </ModalFooter>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      size="default"
      disableOutsideClick={state === 'signing' || state === 'pending'}
      disableEscapeKey={state === 'signing' || state === 'pending'}
    >
      <ModalHeader>
        <ModalTitle>
          {state === 'confirm' && 'Confirm Transaction'}
          {state === 'signing' && 'Sign Transaction'}
          {state === 'pending' && 'Transaction Pending'}
          {state === 'success' && 'Transaction Complete'}
          {state === 'error' && 'Transaction Error'}
        </ModalTitle>
      </ModalHeader>

      {state === 'confirm' && renderConfirmation()}
      {state === 'signing' && renderSigning()}
      {state === 'pending' && renderPending()}
      {state === 'success' && renderSuccess()}
      {state === 'error' && renderError()}
    </Modal>
  );
};

export default TransactionConfirmationModal;
