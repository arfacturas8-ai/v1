import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Check, Loader2, Shield, Smartphone, Chrome, Download } from 'lucide-react'
import Button from '../ui/Button';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import Web3ErrorHandler, { useWeb3ErrorHandler } from './Web3ErrorHandler';
import { WalletConnectSkeleton } from './Web3Skeletons';

const WALLET_PROVIDERS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/icons/metamask.svg',
    isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
    isRecommended: true,
    description: 'Connect using MetaMask browser extension',
    downloadUrl: 'https://metamask.io/download/',
    installInstructions: 'Click "Add to Chrome" and follow the setup instructions'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/icons/walletconnect.svg',
    isInstalled: true, // Always available
    description: 'Connect using WalletConnect protocol',
    downloadUrl: 'https://walletconnect.com/wallets',
    installInstructions: 'Choose from 300+ supported mobile wallets'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg',
    isInstalled: typeof window !== 'undefined' && (
      !!window.ethereum?.isCoinbaseWallet || 
      !!window.ethereum?.selectedProvider?.isCoinbaseWallet
    ),
    description: 'Connect using Coinbase Wallet',
    downloadUrl: 'https://wallet.coinbase.com/',
    installInstructions: 'Download the app or browser extension'
  }
];

function EnhancedWalletConnectButton({
  size = 'md',
  variant = 'primary',
  showProviderList = true,
  showInstallPrompts = true,
  onConnect,
  onDisconnect,
  onError,
  className = ''
}) {
  const { state, actions } = useWeb3Auth();
  const { errors, addError, dismissError } = useWeb3ErrorHandler();
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(null);

  useEffect(() => {
    // Update provider availability
    const providers = WALLET_PROVIDERS.map(provider => ({
      ...provider,
      isInstalled: checkProviderInstalled(provider.id)
    }));
    setAvailableProviders(providers);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.wallet-dropdown')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const checkProviderInstalled = (providerId) => {
    if (typeof window === 'undefined') return false;

    switch (providerId) {
      case 'metamask':
        return !!window.ethereum?.isMetaMask;
      case 'coinbase':
        return !!(window.ethereum?.isCoinbaseWallet || window.ethereum?.selectedProvider?.isCoinbaseWallet);
      case 'walletconnect':
        return true; // Always available
      default:
        return false;
    }
  };

  const handleConnect = async (providerId) => {
    try {
      setIsLoading(true);
      setShowDropdown(false);
      
      const provider = availableProviders.find(p => p.id === providerId);
      if (!provider?.isInstalled && showInstallPrompts) {
        setShowInstallModal(provider);
        return;
      }
      
      await actions.connect(providerId);
      
      if (onConnect) {
        onConnect(providerId, state.account);
      }
      
    } catch (error) {
      console.error('Connection failed:', error);
      
      const errorId = addError(error, { 
        action: () => handleConnect(providerId),
        actionLabel: `Retry ${WALLET_PROVIDERS.find(p => p.id === providerId)?.name} Connection`
      });
      
      if (onError) {
        onError(error, providerId);
      }
      
      // Auto-dismiss certain errors
      if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        setTimeout(() => dismissError(errorId), 3000);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await actions.disconnect();
      
      if (onDisconnect) {
        onDisconnect();
      }
      
    } catch (error) {
      console.error('Disconnect failed:', error);
      addError(error, { 
        action: handleDisconnect,
        actionLabel: 'Retry Disconnect'
      });
      
      if (onError) {
        onError(error, 'disconnect');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary hover:bg-secondary/80 text-secondary border border-muted/30';
      case 'outline':
        return 'bg-transparent hover:bg-accent-primary/10 text-primary border border-accent-primary/30';
      default:
        return 'bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-primary/90 hover:to-accent-secondary/90 text-white';
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    const eth = Number(balance) / 1e18;
    return eth.toFixed(4);
  };

  // Show loading skeleton during initialization
  if (!state.isInitialized) {
    return <WalletConnectSkeleton size={size} className={className} />;
  }

  // Show errors if any
  const currentError = errors[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Main wallet button */}
      {renderWalletButton()}

      {/* Error display */}
      {currentError && (
        <div style={{ position: 'absolute' }}>
          <Web3ErrorHandler
            error={currentError.error}
            onRetry={() => {
              if (currentError.action) {
                currentError.action();
              } else {
                actions.retry();
              }
            }}
            onDismiss={() => dismissError(currentError.id)}
            showTechnicalDetails={false}
          />
        </div>
      )}

      {/* Install Modal */}
      {showInstallModal && (
        <InstallWalletModal
          provider={showInstallModal}
          onClose={() => setShowInstallModal(null)}
          onInstallComplete={() => {
            setShowInstallModal(null);
            // Refresh providers after install
            setTimeout(() => {
              const providers = WALLET_PROVIDERS.map(provider => ({
                ...provider,
                isInstalled: checkProviderInstalled(provider.id)
              }));
              setAvailableProviders(providers);
            }, 1000);
          }}
        />
      )}
    </div>
  );

  function renderWalletButton() {
    // Connected state
    if (state.isConnected && state.account) {
      return (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div className="avatar avatar-sm" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-inverse)',
                fontWeight: 'var(--font-bold)',
              }}>
                {state.account.slice(2, 4).toUpperCase()}
              </div>
              <span className="truncate">
                {state.ensName || formatAddress(state.account)}
              </span>
            </div>
            <ChevronDown size={16} />
          </button>

          {/* Connected dropdown */}
          {showDropdown && (
            <div className="card" style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-2)',
              minWidth: '280px',
              zIndex: 'var(--z-dropdown)',
            }}>
              <div className="space-y-4">
                {/* Account info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="avatar avatar-md" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-inverse)',
                    fontWeight: 'var(--font-bold)',
                    backgroundColor: 'var(--brand-primary)',
                  }}>
                    {state.account.slice(2, 4).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                      {state.ensName || formatAddress(state.account)}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} className="truncate">
                      {formatBalance(state.balance)} ETH
                    </div>
                  </div>
                  <div className="badge badge-beginner" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                  }}>
                    <Check size={12} />
                    Connected
                  </div>
                </div>

                {/* Network info */}
                {state.chainId && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Network:</span>
                    <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                      {getChainName(state.chainId)}
                    </span>
                  </div>
                )}

                {/* Provider info */}
                {state.providerType && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Connected via:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {getProviderIcon(state.providerType)}
                      <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                        {state.providerType}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(state.account);
                      setShowDropdown(false);
                    }}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                    }}
                  >
                    Copy Address
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="btn-ghost"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      color: 'var(--color-error)',
                    }}
                  >
                    {isLoading ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Connecting state
    if (state.isConnecting || isLoading) {
      return (
        <button
          disabled
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Loader2 className="spinner" size={16} />
          {state.isConnecting ? 'Connecting...' : ''}
        </button>
      );
    }

    // Coming Soon state
    const isComingSoon = import.meta.env.VITE_ENABLE_WEB3_FEATURES !== 'true';

    if (isComingSoon) {
      return (
        <div style={{ position: 'relative' }}>
          <button
            disabled
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
          <span className="badge badge-coming-soon" style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
          }}>
            Coming Soon
          </span>
        </div>
      );
    }

    // Available for connection
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => showProviderList ? setShowDropdown(!showDropdown) : handleConnect('metamask')}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Wallet size={16} />
          Connect Wallet
          {showProviderList && <ChevronDown size={16} />}
        </button>

        {/* Provider selection dropdown */}
        {showDropdown && showProviderList && (
          <div className="card" style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 'var(--space-2)',
            minWidth: '320px',
            zIndex: 'var(--z-dropdown)',
          }}>
            <div className="space-y-3">
              <h4 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>Connect Wallet</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Choose how you want to connect to Web3</p>
              
              {availableProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {getProviderIcon(provider.id)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{provider.name}</span>
                      {provider.isRecommended && (
                        <span className="badge badge-new" style={{ fontSize: 'var(--text-xs)' }}>
                          Recommended
                        </span>
                      )}
                      {!provider.isInstalled && (
                        <span className="badge badge-coming-soon" style={{ fontSize: 'var(--text-xs)' }}>
                          Install
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{provider.description}</div>
                  </div>
                  {!provider.isInstalled && (
                    <Download size={16} />
                  )}
                </button>
              ))}

              <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <p>New to Web3? <span style={{ color: 'var(--brand-primary)' }}>Learn more about wallets</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

// Install wallet modal component
function InstallWalletModal({ provider, onClose, onInstallComplete }) {
  if (!provider) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--bg-tertiary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      zIndex: 'var(--z-modal)',
    }}>
      <div className="card card-elevated" style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="avatar avatar-lg" style={{
            margin: '0 auto var(--space-4)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {getProviderIcon(provider.id)}
          </div>

          <h3 style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Install {provider.name}
          </h3>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            {provider.installInstructions}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => {
                window.open(provider.downloadUrl, '_blank');
                onInstallComplete();
              }}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
            >
              <Download size={16} />
              Install {provider.name}
            </Button>

            <Button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-4)' }}>
            After installation, refresh this page to connect
          </p>
        </div>
      </div>
    </div>
  );
}

function getProviderIcon(providerId, className = 'h-4 w-4') {
  switch (providerId) {
    case 'metamask':
      return <Chrome className={`${className} text-orange-500`} />;
    case 'walletconnect':
      return <Smartphone className={`${className} text-blue-500`} />;
    case 'coinbase':
      return <Shield className={`${className} text-blue-600`} />;
    default:
      return <Wallet className={className} />;
  }
}

function getChainName(chainId) {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 137:
      return 'Polygon';
    case 42161:
      return 'Arbitrum';
    case 8453:
      return 'Base';
    case 10:
      return 'Optimism';
    case 56:
      return 'BNB Chain';
    case 11155111:
      return 'Sepolia Testnet';
    default:
      return `Chain ${chainId}`;
  }
}



export default EnhancedWalletConnectButton;