/**
 * CRYB Platform - Sign Message Modal
 * Message signing modal with security warnings
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
  FileSignature,
  Check,
  AlertTriangle,
  AlertCircle,
  Shield,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

// ===== SIGNATURE STATE =====
type SignatureState = 'confirm' | 'signing' | 'success' | 'error';

// ===== MODAL PROPS =====
export interface SignMessageModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Message to sign */
  message: string;
  /** Wallet address */
  walletAddress: string;
  /** App name requesting signature */
  appName?: string;
  /** Custom warnings */
  warnings?: string[];
  /** Callback when message is signed */
  onSign?: () => Promise<{ signature: string }>;
  /** Callback when signing is rejected */
  onReject?: () => void;
  /** Show technical details */
  showTechnicalDetails?: boolean;
}

// ===== SIGN MESSAGE MODAL COMPONENT =====
export const SignMessageModal: React.FC<SignMessageModalProps> = ({
  open,
  onOpenChange,
  message,
  walletAddress,
  appName = 'This application',
  warnings = [],
  onSign,
  onReject,
  showTechnicalDetails = true,
}) => {
  const [state, setState] = useState<SignatureState>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Truncate address
  const truncateAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle copy
  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle sign
  const handleSign = async () => {
    setState('signing');
    setError(null);

    try {
      const result = await onSign?.();

      if (result) {
        setSignature(result.signature);
        setState('success');

        // Auto-close after success
        setTimeout(() => {
          onOpenChange(false);
          resetState();
        }, 2000);
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to sign message');
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
    setSignature(null);
    setCopied(false);
  };

  // Default warnings
  const defaultWarnings = [
    'Signing messages can authorize actions on your behalf',
    'Only sign messages from trusted applications',
    'This signature does not cost any gas fees',
  ];

  const allWarnings = warnings.length > 0 ? warnings : defaultWarnings;

  // Render confirmation view
  const renderConfirmation = () => (
    <>
      <ModalBody>
        <div className="space-y-4">
          {/* Security Warning */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
            <div className="flex gap-3">
              <AlertTriangle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">
                  Signature Request
                </h4>
                <div className="space-y-1">
                  {allWarnings.map((warning, i) => (
                    <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400">
                      • {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requesting App */}
          <div className="flex items-center gap-2 text-sm">
            <Shield style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className="text-muted-foreground">Requested by:</span>
            <span className="font-medium">{appName}</span>
          </div>

          {/* Wallet Address */}
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground mb-2">Signing Wallet</div>
            <div className="font-mono text-sm font-medium flex items-center justify-between">
              <span>{truncateAddress(walletAddress)}</span>
              <button
                onClick={() => handleCopy(walletAddress)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
              >
                {copied ? (
                  <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                ) : (
                  <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                )}
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">Message to Sign</div>
              <button
                onClick={() => handleCopy(message)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {message}
              </pre>
            </div>
          </div>

          {/* Technical Details */}
          {showTechnicalDetails && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-mono">personal_sign</span>
                </div>
                <div className="flex justify-between">
                  <span>Message Length:</span>
                  <span className="font-mono">{message.length} characters</span>
                </div>
              </div>
            </details>
          )}
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleReject}>
          Reject
        </Button>
        <Button onClick={handleSign} leftIcon={<FileSignature style={{ width: "24px", height: "24px", flexShrink: 0 }} />}>
          Sign Message
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
          Please sign the message in your wallet
        </p>
      </div>
    </ModalBody>
  );

  // Render success state
  const renderSuccess = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <Check style={{ width: "48px", height: "48px", flexShrink: 0 }} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Message Signed!</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Your signature has been successfully created
        </p>
        {signature && (
          <div className="w-full max-w-sm rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Signature</span>
              <button
                onClick={() => handleCopy(signature)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Copy
              </button>
            </div>
            <div className="font-mono text-xs break-all text-muted-foreground">
              {signature.slice(0, 20)}...{signature.slice(-20)}
            </div>
          </div>
        )}
      </div>
    </ModalBody>
  );

  // Render error state
  const renderError = () => (
    <>
      <ModalBody>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle style={{ width: "48px", height: "48px", flexShrink: 0 }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Signature Failed</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            {error || 'Failed to sign the message. Please try again.'}
          </p>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSign}>
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
      disableOutsideClick={state === 'signing'}
      disableEscapeKey={state === 'signing'}
    >
      <ModalHeader>
        <ModalTitle>
          <div className="flex items-center gap-2">
            <FileSignature style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            {state === 'confirm' && 'Sign Message'}
            {state === 'signing' && 'Signing...'}
            {state === 'success' && 'Signature Complete'}
            {state === 'error' && 'Signature Error'}
          </div>
        </ModalTitle>
        {state === 'confirm' && (
          <ModalDescription>
            Review the message carefully before signing
          </ModalDescription>
        )}
      </ModalHeader>

      {state === 'confirm' && renderConfirmation()}
      {state === 'signing' && renderSigning()}
      {state === 'success' && renderSuccess()}
      {state === 'error' && renderError()}
    </Modal>
  );
};

export default SignMessageModal;
