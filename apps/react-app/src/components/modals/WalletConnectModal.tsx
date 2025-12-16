/**
 * CRYB Platform - WalletConnect Modal
 * Wallet selection modal with provider detection and QR code support
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose
} from '../ui/modal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  Wallet,
  QrCode,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Smartphone
} from 'lucide-react';

// ===== WALLET PROVIDER TYPES =====
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  installed?: boolean;
  mobileOnly?: boolean;
  downloadUrl?: string;
}

// ===== DEFAULT WALLET PROVIDERS =====
const DEFAULT_PROVIDERS: WalletProvider[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    mobileOnly: true,
    downloadUrl: 'https://trustwallet.com/',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    downloadUrl: 'https://rainbow.me/',
  },
];

// ===== CONNECTION STATES =====
type ConnectionState = 'idle' | 'connecting' | 'success' | 'error';

// ===== MODAL PROPS =====
export interface WalletConnectModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Custom wallet providers */
  providers?: WalletProvider[];
  /** Callback when wallet is selected */
  onConnect?: (providerId: string) => Promise<void>;
  /** Show QR code option */
  showQRCode?: boolean;
  /** Custom QR code data */
  qrCodeData?: string;
  /** Title */
  title?: string;
  /** Description */
  description?: string;
}

// ===== WALLET CONNECT MODAL COMPONENT =====
export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  open,
  onOpenChange,
  providers = DEFAULT_PROVIDERS,
  onConnect,
  showQRCode = true,
  qrCodeData,
  title = 'Connect Wallet',
  description = 'Choose your preferred wallet to connect',
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<Set<string>>(new Set());

  // Detect installed wallets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detected = new Set<string>();

    // Check for MetaMask
    if ((window as any).ethereum?.isMetaMask) {
      detected.add('metamask');
    }

    // Check for Coinbase Wallet
    if ((window as any).ethereum?.isCoinbaseWallet) {
      detected.add('coinbase');
    }

    // Check for Trust Wallet
    if ((window as any).ethereum?.isTrust) {
      detected.add('trust');
    }

    // Check for Rainbow
    if ((window as any).ethereum?.isRainbow) {
      detected.add('rainbow');
    }

    setDetectedWallets(detected);
  }, []);

  // Handle wallet connection
  const handleConnect = async (providerId: string) => {
    setSelectedProvider(providerId);
    setConnectionState('connecting');
    setError(null);

    try {
      await onConnect?.(providerId);
      setConnectionState('success');

      // Close modal after success animation
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (err) {
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  // Handle retry
  const handleRetry = () => {
    if (selectedProvider) {
      handleConnect(selectedProvider);
    }
  };

  // Reset state
  const resetState = () => {
    setConnectionState('idle');
    setSelectedProvider(null);
    setError(null);
    setShowQR(false);
  };

  // Handle modal close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  // Render wallet list
  const renderWalletList = () => {
    const sortedProviders = [...providers].sort((a, b) => {
      const aInstalled = detectedWallets.has(a.id);
      const bInstalled = detectedWallets.has(b.id);
      if (aInstalled && !bInstalled) return -1;
      if (!aInstalled && bInstalled) return 1;
      return 0;
    });

    return (
      <div className="space-y-2">
        {sortedProviders.map((provider) => {
          const isInstalled = detectedWallets.has(provider.id);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
          const isAvailable = provider.id === 'walletconnect' || isInstalled || (!provider.mobileOnly || isMobile);

          return (
            <button
              key={provider.id}
              onClick={() => {
                if (provider.id === 'walletconnect' && showQRCode) {
                  setShowQR(true);
                } else if (isInstalled || provider.id === 'walletconnect') {
                  handleConnect(provider.id);
                } else if (provider.downloadUrl) {
                  window.open(provider.downloadUrl, '_blank');
                }
              }}
              disabled={!isAvailable}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all',
                'hover:border-primary hover:bg-accent/5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isInstalled && 'border-primary/50 bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{provider.icon}</div>
                <div className="text-left">
                  <div className="font-medium">{provider.name}</div>
                  {isInstalled && (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      Detected
                    </div>
                  )}
                  {!isInstalled && provider.mobileOnly && !isMobile && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Smartphone style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      Mobile only
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    );
  };

  // Render QR code view
  const renderQRCode = () => (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="p-4 bg-white rounded-lg mb-4">
        {qrCodeData ? (
          <div className="w-64 h-64 flex items-center justify-center">
            <QrCode className="w-full h-full text-gray-900" />
          </div>
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
            <div className="text-center text-gray-500">
              <QrCode style={{ width: "80px", height: "80px", flexShrink: 0 }} />
              <p className="text-sm">QR Code will appear here</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Scan this QR code with your mobile wallet app
      </p>
      <Button
        variant="outline"
        onClick={() => setShowQR(false)}
      >
        Back to wallets
      </Button>
    </div>
  );

  // Render loading state
  const renderConnecting = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 " />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary " />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
      <p className="text-sm text-muted-foreground text-center">
        Please confirm the connection in your wallet
      </p>
    </div>
  );

  // Render success state
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
        <Check style={{ width: "48px", height: "48px", flexShrink: 0 }} />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connected!</h3>
      <p className="text-sm text-muted-foreground text-center">
        Your wallet has been successfully connected
      </p>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle style={{ width: "48px", height: "48px", flexShrink: 0 }} />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {error || 'Failed to connect to wallet. Please try again.'}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setConnectionState('idle');
            setError(null);
          }}
        >
          Choose Another Wallet
        </Button>
        <Button onClick={handleRetry} leftIcon={<RefreshCw style={{ width: "24px", height: "24px", flexShrink: 0 }} />}>
          Try Again
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      size="default"
    >
      <ModalHeader>
        <div>
          <ModalTitle>
            <div className="flex items-center gap-2">
              <Wallet style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              {title}
            </div>
          </ModalTitle>
          {connectionState === 'idle' && !showQR && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </div>
      </ModalHeader>

      <ModalBody>
        {connectionState === 'idle' && !showQR && renderWalletList()}
        {connectionState === 'idle' && showQR && renderQRCode()}
        {connectionState === 'connecting' && renderConnecting()}
        {connectionState === 'success' && renderSuccess()}
        {connectionState === 'error' && renderError()}
      </ModalBody>

      {connectionState === 'idle' && !showQR && (
        <ModalFooter justify="center">
          <p className="text-xs text-muted-foreground text-center">
            By connecting your wallet, you agree to our Terms of Service
          </p>
        </ModalFooter>
      )}
    </Modal>
  );
};

export default WalletConnectModal;
