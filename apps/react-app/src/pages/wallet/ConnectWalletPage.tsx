/**
 * CRYB Connect Wallet Page
 * Wallet connection flow with multiple providers
 * Production-ready with network switching and error handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Monitor,
  ExternalLink,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { ethers } from 'ethers';
import { getErrorMessage } from '../../utils/errorUtils';

interface WalletProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  installed: boolean;
  downloadUrl: string;
  type: 'injected' | 'walletconnect';
  color: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'wrong_network';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org' },
];

export function ConnectWalletPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<WalletProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    detectWallets();
    checkDevice();
    checkExistingConnection();
  }, []);

  const checkDevice = () => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
  };

  const detectWallets = () => {
    const detectedProviders: WalletProvider[] = [
      {
        id: 'metamask',
        name: 'MetaMask',
        description: 'Connect with MetaMask browser extension or mobile app',
        icon: '🦊',
        installed: typeof window.ethereum !== 'undefined' && (window.ethereum as any).isMetaMask,
        downloadUrl: 'https://metamask.io/download/',
        type: 'injected',
        color: 'from-orange-500 to-orange-600',
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        description: 'Secure wallet from Coinbase exchange',
        icon: '🔷',
        installed: typeof window.ethereum !== 'undefined' && (window.ethereum as any).isCoinbaseWallet,
        downloadUrl: 'https://www.coinbase.com/wallet/downloads',
        type: 'injected',
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        description: 'Fun, simple, and secure crypto wallet',
        icon: '🌈',
        installed: typeof window.ethereum !== 'undefined' && (window.ethereum as any).isRainbow,
        downloadUrl: 'https://rainbow.me/download',
        type: 'injected',
        color: 'from-purple-500 to-pink-500',
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        description: 'Scan QR code with your mobile wallet',
        icon: '🔗',
        installed: true, // Always available via QR code
        downloadUrl: 'https://walletconnect.com/',
        type: 'walletconnect',
        color: 'from-cyan-500 to-blue-500',
      },
    ];

    setProviders(detectedProviders);
  };

  const checkExistingConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = accounts[0].address;
          const network = await provider.getNetwork();

          setConnectedAddress(address);
          setChainId(Number(network.chainId));
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  const connectWallet = async (providerId: string) => {
    setSelectedProvider(providerId);
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      if (providerId === 'walletconnect') {
        await connectWalletConnect();
      } else {
        await connectInjectedWallet(providerId);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(getErrorMessage(error, 'Failed to connect wallet'));
    }
  };

  const connectInjectedWallet = async (providerId: string) => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No wallet extension detected. Please install a wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      setConnectedAddress(accounts[0]);
      setChainId(currentChainId);

      // Check if on supported network
      const supportedChainIds = SUPPORTED_CHAINS.map(chain => chain.id);
      if (!supportedChainIds.includes(currentChainId)) {
        setConnectionStatus('wrong_network');
        return;
      }

      setConnectionStatus('connected');

      // Save connection
      localStorage.setItem('cryb_wallet_connection', JSON.stringify({
        provider: providerId,
        address: accounts[0],
        chainId: currentChainId,
      }));

      // Setup event listeners
      setupEventListeners();

      // Redirect to wallet overview
      setTimeout(() => {
        navigate('/wallet');
      }, 1500);

    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw error;
    }
  };

  const connectWalletConnect = async () => {
    // WalletConnect implementation
    // This requires @walletconnect/ethereum-provider
    setErrorMessage('WalletConnect integration coming soon. Please use a browser wallet for now.');
    setConnectionStatus('error');
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Account changed
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setConnectedAddress(accounts[0]);
          window.location.reload();
        }
      });

      // Chain changed
      window.ethereum.on('chainChanged', (chainId: string) => {
        window.location.reload();
      });

      // Disconnect
      window.ethereum.on('disconnect', () => {
        handleDisconnect();
      });
    }
  };

  const handleDisconnect = () => {
    setConnectedAddress(null);
    setChainId(null);
    setConnectionStatus('idle');
    localStorage.removeItem('cryb_wallet_connection');
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const chain = SUPPORTED_CHAINS.find(c => c.id === targetChainId);
      if (!chain) return;

      const chainIdHex = `0x${targetChainId.toString(16)}`;

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });

        setChainId(targetChainId);
        setConnectionStatus('connected');

        setTimeout(() => {
          navigate('/wallet');
        }, 1000);

      } catch (switchError: any) {
        // Chain not added to wallet
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: chain.name,
              nativeCurrency: {
                name: chain.symbol,
                symbol: chain.symbol,
                decimals: 18,
              },
              rpcUrls: [chain.rpc],
            }],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Error switching network:', error);
      setErrorMessage('Failed to switch network');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: number): string => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  // Already Connected State
  if (connectionStatus === 'connected' && connectedAddress) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/wallet')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Wallet Connected</h1>
        </div>

        <Card variant="glass">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Successfully Connected</h2>
            <p className="text-muted-foreground mb-4">
              Your wallet is now connected to CRYB Platform
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Connected Address</p>
              <p className="font-mono font-semibold text-lg">{formatAddress(connectedAddress)}</p>
              {chainId && (
                <Badge variant="outline" className="mt-2">
                  {getChainName(chainId)}
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
              <Button
                onClick={() => navigate('/wallet')}
                className="flex-1"
              >
                Go to Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wrong Network State
  if (connectionStatus === 'wrong_network') {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setConnectionStatus('idle')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Wrong Network</h1>
        </div>

        <Card variant="outline" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-xl font-bold mb-2">Unsupported Network</h2>
            <p className="text-muted-foreground mb-6">
              Please switch to one of the supported networks to continue
            </p>

            <div className="space-y-3">
              {SUPPORTED_CHAINS.map((chain) => (
                <Button
                  key={chain.id}
                  variant="outline"
                  onClick={() => switchNetwork(chain.id)}
                  className="w-full justify-between"
                >
                  <span>{chain.name}</span>
                  <Badge variant="outline">{chain.symbol}</Badge>
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="w-full mt-4"
            >
              Disconnect & Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Connect Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Choose your preferred wallet to get started
          </p>
        </div>
      </div>

      {/* Error Message */}
      {connectionStatus === 'error' && errorMessage && (
        <Card variant="outline" className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                  Connection Failed
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errorMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Info */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Monitor className="h-5 w-5 text-primary" />
            )}
            <p className="text-sm">
              {isMobile
                ? 'Mobile wallet detected - You can use in-app browsers or WalletConnect'
                : 'Desktop browser detected - Install a wallet extension or use WalletConnect'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Providers */}
      <div className="grid md:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            variant="interactive"
            className={cn(
              "cursor-pointer",
              selectedProvider === provider.id && connectionStatus === 'connecting' && "ring-2 ring-primary"
            )}
            onClick={() => provider.installed && connectWallet(provider.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br",
                  provider.color
                )}>
                  {provider.icon}
                </div>

                {provider.installed ? (
                  <Badge variant="success">Detected</Badge>
                ) : (
                  <Badge variant="outline">Not Installed</Badge>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-2">{provider.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {provider.description}
              </p>

              {provider.installed ? (
                <Button
                  className="w-full"
                  disabled={connectionStatus === 'connecting'}
                  loading={selectedProvider === provider.id && connectionStatus === 'connecting'}
                >
                  {selectedProvider === provider.id && connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Connect'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(provider.downloadUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Install {provider.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Why Connect Section */}
      <Card>
        <CardHeader>
          <CardTitle>Why Connect Your Wallet?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">View Your Assets</p>
              <p className="text-sm text-muted-foreground">
                See all your tokens, NFTs, and transaction history in one place
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Instant Transactions</p>
              <p className="text-sm text-muted-foreground">
                Send, receive, and swap crypto directly from the platform
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Secure & Private</p>
              <p className="text-sm text-muted-foreground">
                Your keys stay in your wallet - we never have access to your funds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Networks */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Networks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {SUPPORTED_CHAINS.map((chain) => (
              <div
                key={chain.id}
                className="text-center p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <p className="font-semibold mb-1">{chain.name}</p>
                <Badge variant="outline" className="text-xs">
                  {chain.symbol}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConnectWalletPage;
