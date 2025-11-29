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
    const eth = Number(balance) / 1e18;
    return eth.toFixed(4);
  };

  // Error state
  if (state.connectionError && !state.isConnecting) {
    return (
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => actions.retry()}
          style={{
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
  fontWeight: '500'
}}
        >
          <AlertTriangle style={{
  height: '16px',
  width: '16px'
}} />
          Connection Failed
          {retryCount > 0 && (
            <span className="text-xs">({retryCount})</span>
          )}
        </button>
        
        {/* Error tooltip */}
        <div style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}>
          {state.connectionError}
        </div>
      </div>
    );
  }

  // Connected state
  if (state.isConnected && state.account) {
    return (
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
  fontWeight: '500'
}}
        >
          <div style={{
  display: 'flex',
  alignItems: 'center'
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
  borderRadius: '12px'
}}>
            <div className="space-y-md">
              {/* Account info */}
              <div style={{
  display: 'flex',
  alignItems: 'center'
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
  borderRadius: '4px'
}}>
                  <Check style={{
  height: '12px',
  width: '12px'
}} />
                  Connected
                </div>
              </div>

              {/* Chain info */}
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

              {/* Actions */}
              <div className="pt-sm space-y-sm">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(state.account);
                    setShowDropdown(false);
                  }}
                  style={{
  width: '100%',
  textAlign: 'left',
  borderRadius: '4px'
}}
                >
                  Copy Address
                </button>
                <button
                  onClick={handleDisconnect}
                  style={{
  width: '100%',
  textAlign: 'left',
  borderRadius: '4px'
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
        style={{
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#ffffff'
}}
      >
        <Loader2 style={{
  height: '16px',
  width: '16px'
}} />
        Connecting...
      </button>
    );
  }

  // Disconnected state - Show provider selection or Coming Soon
  const isComingSoon = import.meta.env.VITE_ENABLE_WEB3_FEATURES !== 'true';
  
  if (isComingSoon) {
    return (
      <div style={{
  position: 'relative'
}}>
        <div style={{
  position: 'relative'
}}>
          <button
            disabled
            style={{
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
  fontWeight: '500'
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
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%'
}}>
            Coming Soon
          </span>
        </div>
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
  borderRadius: '12px'
}}>
          <div className="space-y-sm">
            <h4 style={{
  fontWeight: '600'
}}>Connect Wallet</h4>
            
            {availableProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleConnect(provider.id)}
                disabled={!provider.isInstalled}
                style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
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
  alignItems: 'center'
}}>
                    <span style={{
  fontWeight: '500'
}}>{provider.name}</span>
                    {provider.isRecommended && (
                      <span style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{provider.description}</div>
                  {!provider.isInstalled && (
                    <div className="text-xs text-warning">Not installed</div>
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
  switch (providerId) {
    case 'metamask':
      return <Chrome style={{
  height: '16px',
  width: '16px'
}} />;
    case 'walletconnect':
      return <Smartphone style={{
  height: '16px',
  width: '16px'
}} />;
    case 'coinbase':
      return <Shield style={{
  height: '16px',
  width: '16px'
}} />;
    default:
      return <Wallet style={{
  height: '16px',
  width: '16px'
}} />;
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
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-32';
      case 'lg':
        return 'h-12 w-40';
      default:
        return 'h-10 w-36';
    }
  };

  return (
    <div style={{
  borderRadius: '12px'
}} />
  );
}



export default WalletConnectButton
