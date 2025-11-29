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
    <div style={{
  position: 'relative'
}}>
      {/* Main wallet button */}
      {renderWalletButton()}
      
      {/* Error display */}
      {currentError && (
        <div style={{
  position: 'absolute'
}}>
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
        <div style={{
  position: 'relative'
}}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
          >
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                {state.account.slice(2, 4).toUpperCase()}
              </div>
              <span className="truncate">
                {state.ensName || formatAddress(state.account)}
              </span>
            </div>
            <ChevronDown style={{
  height: '16px',
  width: '16px'
}} />
          </button>

          {/* Connected dropdown */}
          {showDropdown && (
            <div style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
              <div className="space-y-4">
                {/* Account info */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                  <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                    {state.account.slice(2, 4).toUpperCase()}
                  </div>
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  fontWeight: '500'
}}>
                      {state.ensName || formatAddress(state.account)}
                    </div>
                    <div className="text-sm text-muted truncate">
                      {formatBalance(state.balance)} ETH
                    </div>
                  </div>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                    <Check style={{
  height: '12px',
  width: '12px'
}} />
                    Connected
                  </div>
                </div>

                {/* Network info */}
                {state.chainId && (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <span className="text-muted">Network:</span>
                    <span style={{
  fontWeight: '500'
}}>
                      {getChainName(state.chainId)}
                    </span>
                  </div>
                )}

                {/* Provider info */}
                {state.providerType && (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <span className="text-muted">Connected via:</span>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                      {getProviderIcon(state.providerType)}
                      <span style={{
  fontWeight: '500'
}}>
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
                    style={{
  width: '100%',
  textAlign: 'left',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
}}
                  >
                    Copy Address
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    style={{
  width: '100%',
  textAlign: 'left',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
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
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#ffffff'
}}
        >
          <Loader2 style={{
  height: '16px',
  width: '16px'
}} />
          {state.isConnecting ? 'Connecting...' : 'Loading...'}
        </button>
      );
    }

    // Coming Soon state
    const isComingSoon = import.meta.env.VITE_ENABLE_WEB3_FEATURES !== 'true';
    
    if (isComingSoon) {
      return (
        <div style={{
  position: 'relative'
}}>
          <button
            disabled
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
          >
            <Wallet style={{
  height: '16px',
  width: '16px'
}} />
            Connect Wallet
          </button>
          <span style={{
  position: 'absolute',
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%'
}}>
            Coming Soon
          </span>
        </div>
      );
    }

    // Available for connection
    return (
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => showProviderList ? setShowDropdown(!showDropdown) : handleConnect('metamask')}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
        >
          <Wallet style={{
  height: '16px',
  width: '16px'
}} />
          Connect Wallet
          {showProviderList && <ChevronDown style={{
  height: '16px',
  width: '16px'
}} />}
        </button>

        {/* Provider selection dropdown */}
        {showDropdown && showProviderList && (
          <div style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
            <div className="space-y-3">
              <h4 style={{
  fontWeight: '600'
}}>Connect Wallet</h4>
              <p className="text-xs text-muted">Choose how you want to connect to Web3</p>
              
              {availableProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderRadius: '12px',
  textAlign: 'left'
}}
                >
                  {getProviderIcon(provider.id)}
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                      <span style={{
  fontWeight: '500'
}}>{provider.name}</span>
                      {provider.isRecommended && (
                        <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                          Recommended
                        </span>
                      )}
                      {!provider.isInstalled && (
                        <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                          Install
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{provider.description}</div>
                  </div>
                  {!provider.isInstalled && (
                    <Download style={{
  height: '16px',
  width: '16px'
}} />
                  )}
                </button>
              ))}

              <div className="pt-2 border-t border-muted/20 text-xs text-muted">
                <p>New to Web3? <span className="text-accent-primary">Learn more about wallets</span></p>
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  width: '100%',
  padding: '24px'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            {getProviderIcon(provider.id, 'h-8 w-8 text-white')}
          </div>
          
          <h3 style={{
  fontWeight: '600'
}}>
            Install {provider.name}
          </h3>
          
          <p className="text-sm text-muted mb-4">
            {provider.installInstructions}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => {
                window.open(provider.downloadUrl, '_blank');
                onInstallComplete();
              }}
              style={{
  width: '100%'
}}
            >
              <Download style={{
  height: '16px',
  width: '16px'
}} />
              Install {provider.name}
            </Button>
            
            <Button
              onClick={onClose}
              variant="secondary"
              style={{
  width: '100%'
}}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted mt-4">
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