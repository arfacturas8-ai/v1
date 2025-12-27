import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Check, AlertTriangle, Loader2, Shield, Smartphone, Chrome } from 'lucide-react';
import Button from '../ui/Button';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';

const WALLET_PROVIDERS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/icons/metamask.svg',
    isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
    isRecommended: true,
    description: 'Connect using MetaMask browser extension'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/icons/walletconnect.svg',
    isInstalled: true, // Always available
    description: 'Connect using WalletConnect protocol'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg',
    isInstalled: typeof window !== 'undefined' && (
      !!window.ethereum?.isCoinbaseWallet || 
      !!window.ethereum?.selectedProvider?.isCoinbaseWallet
    ),
    description: 'Connect using Coinbase Wallet'
  }
];

function WalletConnectButton({
  size = 'md',
  variant = 'primary',
  showProviderList = true,
  onConnect,
  onDisconnect,
  className = ''
}) {
  const { state, actions } = useWeb3Auth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

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
      setShowDropdown(false);
      await actions.connect(providerId);
      setRetryCount(0);
      
      if (onConnect) {
        onConnect(providerId);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      
      // Auto-retry for certain errors
      if (retryCount < 2 && (
        error.message.includes('network') || 
        error.message.includes('connection')
      )) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleConnect(providerId);
        }, 2000);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await actions.disconnect();
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-sm py-xs text-sm';
      case 'lg':
        return 'px-xl py-lg text-lg';
      default:
        return 'px-md py-sm text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'outline':
        return 'btn-secondary border';
      default:
        return 'btn-primary';
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    // Balance is already formatted from WalletManager.formatBalance()
    const num = parseFloat(balance);
    return isNaN(num) ? '0' : num.toFixed(4);
  };

  // Error state
  if (state.connectionError && !state.isConnecting) {
    return (
      <div className="wallet-dropdown" style={{ position: 'relative' }}>
        <button
          onClick={() => actions.retry()}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <AlertTriangle style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)', color: 'var(--color-error)' }} />
          <span>Connection Failed</span>
          {retryCount > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>({retryCount})</span>
          )}
        </button>

        {/* Error tooltip */}
        <div style={{
          position: 'absolute',
          top: 'calc(100% + var(--space-2))',
          left: '0',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--color-error)',
          fontSize: 'var(--text-sm)',
          whiteSpace: 'nowrap',
          zIndex: 'var(--z-tooltip)'
        }}>
          {state.connectionError}
        </div>
      </div>
    );
  }

  // Connected state
  if (state.isConnected && state.account) {
    return (
      <div className="wallet-dropdown" style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div className="avatar avatar-sm" style={{
              background: 'var(--brand-gradient)',
              color: 'var(--text-inverse)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-bold)'
            }}>
              {state.account.slice(2, 4).toUpperCase()}
            </div>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)'
            }}>
              {state.ensName || formatAddress(state.account)}
            </span>
          </div>
          <ChevronDown style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
        </button>

        {/* Connected dropdown */}
        {showDropdown && (
          <div className="card card-elevated" style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-2))',
            right: '0',
            minWidth: '280px',
            padding: 'var(--space-4)',
            zIndex: 'var(--z-dropdown)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Account info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="avatar avatar-md" style={{
                  background: 'var(--brand-gradient)',
                  color: 'var(--text-inverse)',
                  fontWeight: 'var(--font-bold)'
                }}>
                  {state.account.slice(2, 4).toUpperCase()}
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {state.ensName || formatAddress(state.account)}
                  </div>
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {formatBalance(state.balance)} ETH
                  </div>
                </div>
                <div className="badge badge-beginner" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)'
                }}>
                  <Check style={{ height: '12px', width: '12px' }} />
                  <span>Connected</span>
                </div>
              </div>

              {/* Chain info */}
              {state.chainId && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Network:</span>
                  <span style={{
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    {getChainName(state.chainId)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
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
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  Copy Address
                </button>
                <button
                  onClick={handleDisconnect}
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-error)'
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Connecting state
  if (state.isConnecting) {
    return (
      <button
        disabled
        className="btn btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          opacity: 0.7
        }}
      >
        <Loader2 className="spinner" style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
        <span>Connecting...</span>
      </button>
    );
  }

  // Disconnected state - Show provider selection or Coming Soon
  const isComingSoon = import.meta.env.VITE_ENABLE_WEB3_FEATURES !== 'true';

  if (isComingSoon) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          disabled
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            opacity: 0.6
          }}
        >
          <Wallet style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
          <span>Connect Wallet</span>
        </button>
        <span className="badge badge-coming-soon" style={{
          position: 'absolute',
          top: '-var(--space-2)',
          right: '-var(--space-2)',
          fontSize: 'var(--text-xs)',
          padding: 'var(--space-1) var(--space-2)'
        }}>
          Coming Soon
        </span>
      </div>
    );
  }

  // Available for connection
  return (
    <div className="wallet-dropdown" style={{ position: 'relative' }}>
      <button
        onClick={() => showProviderList ? setShowDropdown(!showDropdown) : handleConnect('metamask')}
        className="btn btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}
      >
        <Wallet style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
        <span>Connect Wallet</span>
        {showProviderList && <ChevronDown style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />}
      </button>

      {/* Provider selection dropdown */}
      {showDropdown && showProviderList && (
        <div className="card card-elevated" style={{
          position: 'absolute',
          top: 'calc(100% + var(--space-2))',
          right: '0',
          minWidth: '300px',
          padding: 'var(--space-4)',
          zIndex: 'var(--z-dropdown)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-lg)',
              margin: 0
            }}>Connect Wallet</h4>

            {availableProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleConnect(provider.id)}
                disabled={!provider.isInstalled}
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
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                {getProviderIcon(provider.id)}
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span style={{
                      fontWeight: 'var(--font-medium)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-base)'
                    }}>{provider.name}</span>
                    {provider.isRecommended && (
                      <span className="badge badge-new" style={{
                        fontSize: 'var(--text-xs)',
                        padding: 'var(--space-1) var(--space-2)'
                      }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{provider.description}</div>
                  {!provider.isInstalled && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 'var(--space-1)' }}>Not installed</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getProviderIcon(providerId) {
  const iconStyle = { height: 'var(--icon-md)', width: 'var(--icon-md)', color: 'var(--brand-primary)' };

  switch (providerId) {
    case 'metamask':
      return <Chrome style={iconStyle} />;
    case 'walletconnect':
      return <Smartphone style={iconStyle} />;
    case 'coinbase':
      return <Shield style={iconStyle} />;
    default:
      return <Wallet style={iconStyle} />;
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
    default:
      return `Chain ${chainId}`;
  }
}

// Loading skeleton for wallet button
export function WalletConnectButtonSkeleton({ size = 'md' }) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: '32px', width: '128px' };
      case 'lg':
        return { height: '48px', width: '160px' };
      default:
        return { height: '40px', width: '144px' };
    }
  };

  return (
    <div
      className="skeleton"
      style={{
        ...getSizeStyles(),
        borderRadius: 'var(--radius-full)'
      }}
    />
  );
}



export default WalletConnectButton
