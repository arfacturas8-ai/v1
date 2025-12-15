import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ChevronDown, 
  Check, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  Zap,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import Button from '../ui/Button';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import { getNetworkByChainId } from '../../utils/web3Utils';

const SUPPORTED_NETWORKS = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    icon: '⟠',
    color: 'text-blue-500',
    gasPrice: 'High',
    gasPriceColor: 'text-red-500',
    security: 'Highest',
    fees: 'High',
    speed: 'Medium',
    isMainnet: true,
    isSupported: true,
    description: 'Original Ethereum network with highest security'
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    shortName: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    icon: '🔷',
    color: 'text-purple-500',
    gasPrice: 'Low',
    gasPriceColor: 'text-green-500',
    security: 'High',
    fees: 'Low',
    speed: 'Fast',
    isMainnet: true,
    isSupported: false, // Coming in Phase 2
    description: 'Low-cost, fast transactions on Polygon'
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    icon: '🔵',
    color: 'text-blue-400',
    gasPrice: 'Very Low',
    gasPriceColor: 'text-green-600',
    security: 'High',
    fees: 'Very Low',
    speed: 'Fast',
    isMainnet: true,
    isSupported: false, // Coming in Phase 2
    description: 'Ethereum Layer 2 with very low fees'
  },
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    shortName: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    icon: '🔵',
    color: 'text-blue-600',
    gasPrice: 'Low',
    gasPriceColor: 'text-green-500',
    security: 'High',
    fees: 'Low',
    speed: 'Fast',
    isMainnet: true,
    isSupported: false, // Coming in Phase 2
    description: 'Coinbase Layer 2 solution built on OP Stack'
  },
  10: {
    chainId: 10,
    name: 'Optimism Mainnet',
    shortName: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    icon: '🔴',
    color: 'text-red-500',
    gasPrice: 'Low',
    gasPriceColor: 'text-green-500',
    security: 'High',
    fees: 'Low',
    speed: 'Fast',
    isMainnet: true,
    isSupported: false, // Coming in Phase 2
    description: 'Ethereum Layer 2 with optimistic rollups'
  },
  56: {
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    icon: '🟡',
    color: 'text-yellow-500',
    gasPrice: 'Low',
    gasPriceColor: 'text-green-500',
    security: 'Medium',
    fees: 'Very Low',
    speed: 'Fast',
    isMainnet: true,
    isSupported: false, // Coming in Phase 3
    description: 'Binance ecosystem with low transaction fees'
  },
  // Testnets
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    symbol: 'SepoliaETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    icon: '⟠',
    color: 'text-blue-400',
    gasPrice: 'Free',
    gasPriceColor: 'text-green-600',
    security: 'Testnet',
    fees: 'Free',
    speed: 'Fast',
    isMainnet: false,
    isSupported: true,
    description: 'Ethereum testnet for development and testing'
  }
};

function NetworkSwitcher({
  onNetworkChange,
  showDropdown = true,
  size = 'md',
  variant = 'secondary',
  className = ''
}) {
  const { state, actions } = useWeb3Auth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState(null);
  const [detectedNetwork, setDetectedNetwork] = useState(null);

  const currentNetwork = state.chainId ? SUPPORTED_NETWORKS[state.chainId] : null;

  useEffect(() => {
    // Detect if user is on an unsupported network
    if (state.chainId && !SUPPORTED_NETWORKS[state.chainId]) {
      setDetectedNetwork({
        chainId: state.chainId,
        name: `Unknown Network (${state.chainId})`,
        isSupported: false
      });
    } else {
      setDetectedNetwork(null);
    }
  }, [state.chainId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.network-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleNetworkSwitch = async (targetChainId) => {
    try {
      setIsSwitching(true);
      setSwitchError(null);
      setIsOpen(false);

      const targetNetwork = SUPPORTED_NETWORKS[targetChainId];
      
      if (!targetNetwork.isSupported) {
        throw new Error(`${targetNetwork.name} is not yet supported. Coming soon!`);
      }

      // Try to switch to the network
      await actions.switchChain(targetChainId);
      
      if (onNetworkChange) {
        onNetworkChange(targetNetwork);
      }

    } catch (error) {
      console.error('Network switch failed:', error);
      setSwitchError(error.message);
      
      // Handle specific error cases
      if (error.code === 4902) {
        // Network not added to wallet
        await addNetworkToWallet(targetChainId);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const addNetworkToWallet = async (chainId) => {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorerUrl]
        }]
      });

      // Retry the switch after adding
      await handleNetworkSwitch(chainId);
      
    } catch (addError) {
      setSwitchError(`Failed to add ${network.name} to wallet: ${addError.message}`);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'outline':
        return 'border border-accent-primary/30 bg-transparent hover:bg-accent-primary/10';
      default:
        return 'bg-secondary hover:bg-secondary/80 text-secondary';
    }
  };

  // Not connected state
  if (!state.isConnected) {
    return (
      <div className={`opacity-50 cursor-not-allowed ${className}`}>
        <button
          disabled
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
        >
          <Globe style={{
  height: '16px',
  width: '16px'
}} />
          <span>Not Connected</span>
        </button>
      </div>
    );
  }

  // Switching state
  if (isSwitching) {
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
        <span>Switching...</span>
      </button>
    );
  }

  // Error state
  if (switchError) {
    return (
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => setSwitchError(null)}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  border: '1px solid var(--border-subtle)'
}}
        >
          <AlertTriangle style={{
  height: '16px',
  width: '16px'
}} />
          <span>Switch Failed</span>
        </button>
        
        {/* Error tooltip */}
        <div style={{
  position: 'absolute',
  padding: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
          {switchError}
        </div>
      </div>
    );
  }

  // Unsupported network warning
  if (detectedNetwork && !detectedNetwork.isSupported) {
    return (
      <div style={{
  position: 'relative'
}}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  border: '1px solid var(--border-subtle)'
}}
        >
          <AlertTriangle style={{
  height: '16px',
  width: '16px'
}} />
          <span>Unsupported Network</span>
          <ChevronDown style={{
  height: '12px',
  width: '12px'
}} />
        </button>

        {/* Dropdown for unsupported network */}
        {isOpen && (
          <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '16px'
}}>
            <div className="mb-4">
              <h4 style={{
  fontWeight: '600'
}}>Unsupported Network</h4>
              <p className="text-sm text-muted mb-3">
                You're connected to an unsupported network. Please switch to a supported network.
              </p>
            </div>
            
            <div className="space-y-2">
              {Object.values(SUPPORTED_NETWORKS)
                .filter(network => network.isSupported)
                .map(network => (
                <button
                  key={network.chainId}
                  onClick={() => handleNetworkSwitch(network.chainId)}
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
                  <span className="text-lg">{network.icon}</span>
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  fontWeight: '500'
}}>{network.shortName}</div>
                    <div className="text-xs text-muted">{network.description}</div>
                  </div>
                  <div style={{
  textAlign: 'right'
}}>
                    <div className={`text-xs ${network.gasPriceColor}`}>
                      {network.gasPrice} fees
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main network switcher
  return (
    <div style={{
  position: 'relative'
}}>
      <button
        onClick={() => showDropdown && setIsOpen(!isOpen)}
        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
      >
        {currentNetwork ? (
          <>
            <span className="text-lg">{currentNetwork.icon}</span>
            <span>{currentNetwork.shortName}</span>
            {showDropdown && <ChevronDown style={{
  height: '12px',
  width: '12px'
}} />}
          </>
        ) : (
          <>
            <Globe style={{
  height: '16px',
  width: '16px'
}} />
            <span>Unknown Network</span>
            {showDropdown && <ChevronDown style={{
  height: '12px',
  width: '12px'
}} />}
          </>
        )}
      </button>

      {/* Network selection dropdown */}
      {isOpen && showDropdown && (
        <div style={{
  position: 'absolute',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '16px'
}}>
          <div className="mb-4">
            <h4 style={{
  fontWeight: '600'
}}>Select Network</h4>
            <p className="text-xs text-muted">Choose a blockchain network for your transactions</p>
          </div>

          {/* Current network */}
          {currentNetwork && (
            <div style={{
  padding: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                <span className="text-lg">{currentNetwork.icon}</span>
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
}}>{currentNetwork.shortName}</span>
                    <Check style={{
  height: '16px',
  width: '16px'
}} />
                  </div>
                  <div className="text-xs text-muted">Currently connected</div>
                </div>
              </div>
            </div>
          )}

          {/* Available networks */}
          <div className="space-y-1">
            <h5 style={{
  fontWeight: '500'
}}>AVAILABLE NETWORKS</h5>
            {Object.values(SUPPORTED_NETWORKS)
              .filter(network => network.isSupported && network.chainId !== state.chainId)
              .map(network => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
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
                <span className="text-lg">{network.icon}</span>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  fontWeight: '500'
}}>
                    {network.shortName}
                  </div>
                  <div className="text-xs text-muted">{network.description}</div>
                </div>
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <DollarSign style={{
  height: '12px',
  width: '12px'
}} />
                      <span className={network.gasPriceColor}>{network.fees}</span>
                    </div>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Zap style={{
  height: '12px',
  width: '12px'
}} />
                      <span className="text-muted">{network.speed}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Coming soon networks */}
          <div className="space-y-1 mt-4">
            <h5 style={{
  fontWeight: '500'
}}>COMING SOON</h5>
            {Object.values(SUPPORTED_NETWORKS)
              .filter(network => !network.isSupported && network.isMainnet)
              .map(network => (
              <div
                key={network.chainId}
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
                <span className="text-lg opacity-50">{network.icon}</span>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  fontWeight: '500'
}}>{network.shortName}</div>
                  <div className="text-xs text-muted">{network.description}</div>
                </div>
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                    Phase 2
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Network comparison */}
          <div className="mt-4 pt-4 border-t border-muted/20">
            <div className="text-xs text-muted">
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Shield style={{
  height: '12px',
  width: '12px'
}} />
                <span>All networks provide enterprise-grade security</span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Clock style={{
  height: '12px',
  width: '12px'
}} />
                <span>Transaction speeds vary by network congestion</span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <ExternalLink style={{
  height: '12px',
  width: '12px'
}} />
                <span>View network status and fees on block explorers</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Network indicator component
export function NetworkIndicator({ chainId, showName = true, size = 'sm', className = '' }) {
  const network = SUPPORTED_NETWORKS[chainId];
  
  if (!network) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
        <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
        {showName && <span className="text-xs text-error">Unknown</span>}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      <div 
        style={{
  borderRadius: '50%'
}} 
      />
      {showName && (
        <span className={`text-xs ${network.color}`}>
          {network.shortName}
        </span>
      )}
    </div>
  );
}



export default NetworkSwitcher;