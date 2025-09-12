"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Check, AlertTriangle, Loader2, Shield, Smartphone, Chrome } from 'lucide-react';
import { useCrashSafeWeb3, useWalletConnection } from '@/lib/providers/crash-safe-web3-provider';
import { Web3ErrorBoundary } from '@/components/error-boundaries/web3-error-boundary';

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
  isRecommended?: boolean;
  description?: string;
}

interface WalletConnectButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showProviderList?: boolean;
  onConnect?: (providerId: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

const WALLET_PROVIDERS: WalletProvider[] = [
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

export function WalletConnectButton({
  size = 'md',
  variant = 'primary',
  showProviderList = true,
  onConnect,
  onDisconnect,
  className = ''
}: WalletConnectButtonProps) {
  return (
    <Web3ErrorBoundary>
      <WalletConnectButtonContent
        size={size}
        variant={variant}
        showProviderList={showProviderList}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        className={className}
      />
    </Web3ErrorBoundary>
  );
}

function WalletConnectButtonContent({
  size,
  variant,
  showProviderList,
  onConnect,
  onDisconnect,
  className
}: WalletConnectButtonProps) {
  const { state } = useCrashSafeWeb3();
  const { 
    isConnected, 
    isConnecting, 
    account, 
    ensName, 
    balance, 
    chainId, 
    error,
    connect, 
    disconnect 
  } = useWalletConnection();

  const [showDropdown, setShowDropdown] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<WalletProvider[]>([]);
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.wallet-dropdown')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const checkProviderInstalled = (providerId: string): boolean => {
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

  const handleConnect = async (providerId: string) => {
    try {
      setShowDropdown(false);
      await connect(providerId);
      setRetryCount(0);
      
      if (onConnect) {
        onConnect(providerId);
      }
    } catch (error: any) {
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
      await disconnect();
      
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
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300';
      case 'outline':
        return 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 border';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: bigint | null): string => {
    if (!balance) return '0';
    const eth = Number(balance) / 1e18;
    return eth.toFixed(4);
  };

  // Error state
  if (error && !isConnecting) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setRetryCount(0)}
          className={`
            flex items-center gap-2 rounded-lg font-medium transition-all
            bg-red-100 hover:bg-red-200 text-red-700 border-red-300
            ${getSizeClasses()}
          `}
        >
          <AlertTriangle className="h-4 w-4" />
          Connection Failed
          {retryCount > 0 && (
            <span className="text-xs">({retryCount})</span>
          )}
        </button>
        
        {/* Error tooltip */}
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-10 max-w-xs">
          {error}
        </div>
      </div>
    );
  }

  // Connected state
  if (isConnected && account) {
    return (
      <div className={`relative wallet-dropdown ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
            flex items-center gap-2 rounded-lg font-medium transition-all
            ${getVariantClasses()}
            ${getSizeClasses()}
            min-w-0
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {account.slice(2, 4).toUpperCase()}
            </div>
            <span className="truncate">
              {ensName || formatAddress(account)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </button>

        {/* Connected dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-72 z-50">
            <div className="space-y-3">
              {/* Account info */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {account.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {ensName || formatAddress(account)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {formatBalance(balance)} ETH
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  <Check className="h-3 w-3" />
                  Connected
                </div>
              </div>

              {/* Chain info */}
              {chainId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Network:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getChainName(chainId)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(account);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Copy Address
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
  if (isConnecting) {
    return (
      <button
        disabled
        className={`
          flex items-center gap-2 rounded-lg font-medium transition-all
          bg-blue-400 text-white cursor-not-allowed
          ${getSizeClasses()}
        `}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  // Disconnected state
  return (
    <div className={`relative wallet-dropdown ${className}`}>
      <button
        onClick={() => {
          if (showProviderList && availableProviders.length > 1) {
            setShowDropdown(true);
          } else {
            // Use first available provider
            const provider = availableProviders.find(p => p.isInstalled) || availableProviders[0];
            handleConnect(provider.id);
          }
        }}
        className={`
          flex items-center gap-2 rounded-lg font-medium transition-all
          ${getVariantClasses()}
          ${getSizeClasses()}
        `}
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
        {showProviderList && availableProviders.length > 1 && (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Provider selection dropdown */}
      {showDropdown && showProviderList && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-64 z-50">
          <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
            Choose a wallet
          </div>
          
          {availableProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleConnect(provider.id)}
              disabled={!provider.isInstalled}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${provider.isInstalled 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {getProviderIcon(provider.id)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{provider.name}</span>
                  {provider.isRecommended && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                {provider.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {provider.description}
                  </div>
                )}
              </div>
              
              {!provider.isInstalled && (
                <div className="text-xs text-gray-400">
                  Not installed
                </div>
              )}
            </button>
          ))}

          {/* Install instructions for non-installed wallets */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Don't have a wallet?
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Install MetaMask
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function getProviderIcon(providerId: string) {
  switch (providerId) {
    case 'metamask':
      return <Chrome className="h-4 w-4 text-orange-500" />;
    case 'walletconnect':
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    case 'coinbase':
      return <Shield className="h-4 w-4 text-blue-600" />;
    default:
      return <Wallet className="h-4 w-4" />;
  }
}

function getChainName(chainId: number): string {
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
export function WalletConnectButtonSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
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
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${getSizeClasses()}`} />
  );
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      selectedProvider?: any;
      providers?: any[];
    };
  }
}