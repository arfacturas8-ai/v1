import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Dialog, Select, Progress } from '@radix-ui/themes';
import { 
  Wallet, Shield, Smartphone, HardDrive, Zap,
  ChevronRight, ExternalLink, Copy, RefreshCw,
  AlertTriangle, CheckCircle, Info, Settings,
  Globe, Lock, Unlink, Download, QrCode
} from 'lucide-react';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { CHAIN_IDS, NETWORK_CONFIGS } from '../../lib/contracts/cryb-contracts.js';
import { getErrorMessage } from '../../utils/errorUtils'

// Supported wallet providers
const WALLET_PROVIDERS = {
  METAMASK: {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect using MetaMask browser extension',
    icon: '🦊',
    type: 'browser_extension',
    downloadUrl: 'https://metamask.io/download/',
    deepLink: null,
    isInstalled: () => typeof window !== 'undefined' && window.ethereum?.isMetaMask,
    connect: async () => {
      if (window.ethereum?.isMetaMask) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return window.ethereum;
      }
      throw new Error('MetaMask not installed');
    }
  },
  WALLETCONNECT: {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect using WalletConnect protocol',
    icon: '🔗',
    type: 'qr_code',
    downloadUrl: null,
    deepLink: null,
    isInstalled: () => true, // Always available
    connect: async () => {
      // In a real implementation, this would use WalletConnect SDK
      throw new Error('WalletConnect integration pending');
    }
  },
  COINBASE_WALLET: {
    id: 'coinbase_wallet',
    name: 'Coinbase Wallet',
    description: 'Connect using Coinbase Wallet',
    icon: '🟦',
    type: 'browser_extension',
    downloadUrl: 'https://wallet.coinbase.com/',
    deepLink: 'cbwallet://dapp',
    isInstalled: () => typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet,
    connect: async () => {
      if (window.ethereum?.isCoinbaseWallet) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return window.ethereum;
      }
      throw new Error('Coinbase Wallet not installed');
    }
  },
  TRUST_WALLET: {
    id: 'trust_wallet',
    name: 'Trust Wallet',
    description: 'Connect using Trust Wallet mobile app',
    icon: '🛡️',
    type: 'mobile_app',
    downloadUrl: 'https://trustwallet.com/download',
    deepLink: 'trust://dapp',
    isInstalled: () => typeof window !== 'undefined' && window.ethereum?.isTrust,
    connect: async () => {
      if (window.ethereum?.isTrust) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return window.ethereum;
      }
      throw new Error('Trust Wallet not installed');
    }
  },
  PHANTOM: {
    id: 'phantom',
    name: 'Phantom',
    description: 'Connect using Phantom wallet (Solana)',
    icon: '👻',
    type: 'browser_extension',
    downloadUrl: 'https://phantom.app/',
    deepLink: null,
    isInstalled: () => typeof window !== 'undefined' && window.solana?.isPhantom,
    connect: async () => {
      if (window.solana?.isPhantom) {
        await window.solana.connect();
        return window.solana;
      }
      throw new Error('Phantom wallet not installed');
    }
  },
  LEDGER: {
    id: 'ledger',
    name: 'Ledger',
    description: 'Connect using Ledger hardware wallet',
    icon: '🔐',
    type: 'hardware',
    downloadUrl: 'https://www.ledger.com/',
    deepLink: null,
    isInstalled: () => true, // Requires additional setup
    connect: async () => {
      // In a real implementation, this would use Ledger Connect SDK
      throw new Error('Ledger integration requires additional setup');
    }
  },
  TREZOR: {
    id: 'trezor',
    name: 'Trezor',
    description: 'Connect using Trezor hardware wallet',
    icon: '🔒',
    type: 'hardware',
    downloadUrl: 'https://trezor.io/',
    deepLink: null,
    isInstalled: () => true, // Requires additional setup
    connect: async () => {
      // In a real implementation, this would use Trezor Connect SDK
      throw new Error('Trezor integration requires additional setup');
    }
  }
};

// Network switching helper
const NETWORK_SWITCH_PARAMS = {
  [CHAIN_IDS.POLYGON]: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/']
  },
  [CHAIN_IDS.ARBITRUM]: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io/']
  },
  [CHAIN_IDS.OPTIMISM]: {
    chainId: '0xa',
    chainName: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io/']
  },
  [CHAIN_IDS.BASE]: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org/']
  }
};

const EnhancedWalletConnect = ({ onConnect, onDisconnect, showNetworkSwitcher = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    account: null,
    chainId: null,
    providerType: null,
    balance: '0'
  });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [error, setError] = useState('');
  const [availableWallets, setAvailableWallets] = useState([]);
  const [qrCodeModal, setQrCodeModal] = useState(false);
  const [networkSwitchModal, setNetworkSwitchModal] = useState(false);

  // Initialize and detect wallets
  useEffect(() => {
    detectAvailableWallets();
    setupWalletListeners();
    checkExistingConnection();
  }, []);

  const detectAvailableWallets = () => {
    const available = Object.values(WALLET_PROVIDERS).map(provider => ({
      ...provider,
      isAvailable: provider.isInstalled(),
      priority: getWalletPriority(provider)
    })).sort((a, b) => b.priority - a.priority);

    setAvailableWallets(available);
  };

  const getWalletPriority = (provider) => {
    // Prioritize installed wallets
    if (provider.isInstalled()) return 100;
    
    // Prioritize by type
    if (provider.type === 'browser_extension') return 80;
    if (provider.type === 'mobile_app') return 60;
    if (provider.type === 'hardware') return 40;
    if (provider.type === 'qr_code') return 20;
    
    return 0;
  };

  const setupWalletListeners = () => {
    if (typeof window === 'undefined') return;

    // MetaMask listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  };

  const checkExistingConnection = async () => {
    try {
      if (walletManager.isConnected) {
        setConnectionState({
          isConnected: true,
          isConnecting: false,
          account: walletManager.account,
          chainId: walletManager.currentChainId,
          providerType: walletManager.providerType,
          balance: await getWalletBalance(walletManager.account)
        });
      }
    } catch (error) {
      console.error('Failed to check existing connection:', error);
    }
  };

  const getWalletBalance = async (account) => {
    try {
      if (walletManager.provider && account) {
        const balance = await walletManager.provider.getBalance(account);
        return (Number(balance) / 1e18).toFixed(4);
      }
      return '0';
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0';
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setConnectionState(prev => ({
        ...prev,
        account: accounts[0]
      }));
    }
  };

  const handleChainChanged = (chainId) => {
    const numericChainId = parseInt(chainId, 16);
    setConnectionState(prev => ({
      ...prev,
      chainId: numericChainId
    }));
  };

  const handleDisconnect = () => {
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      account: null,
      chainId: null,
      providerType: null,
      balance: '0'
    });
    
    if (onDisconnect) onDisconnect();
  };

  const connectWallet = async (provider) => {
    try {
      setError('');
      setConnectionState(prev => ({ ...prev, isConnecting: true }));

      if (!provider.isAvailable) {
        if (provider.type === 'mobile_app' && provider.deepLink) {
          // Open mobile app
          window.open(provider.deepLink, '_blank');
          throw new Error(`Please open ${provider.name} mobile app to continue`);
        } else if (provider.downloadUrl) {
          // Show download prompt
          setError(`${provider.name} is not installed. Please install it first.`);
          return;
        } else {
          throw new Error(`${provider.name} is not available`);
        }
      }

      if (provider.type === 'qr_code') {
        setQrCodeModal(true);
        return;
      }

      // Connect to wallet
      const providerInstance = await provider.connect();
      
      // Initialize wallet manager
      await walletManager.connect(provider.id);

      const account = walletManager.account;
      const chainId = walletManager.currentChainId;
      const balance = await getWalletBalance(account);

      setConnectionState({
        isConnected: true,
        isConnecting: false,
        account,
        chainId,
        providerType: provider.id,
        balance
      });

      setIsModalOpen(false);
      
      if (onConnect) {
        onConnect({
          account,
          chainId,
          providerType: provider.id,
          provider: providerInstance
        });
      }

    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error.message);
      setConnectionState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletManager.disconnect();
      handleDisconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const switchNetwork = async (targetChainId) => {
    try {
      if (!window.ethereum) throw new Error('No wallet connected');

      const chainIdHex = `0x${targetChainId.toString(16)}`;
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        });
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          const networkParams = NETWORK_SWITCH_PARAMS[targetChainId];
          if (networkParams) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams]
            });
          }
        } else {
          throw switchError;
        }
      }

      setNetworkSwitchModal(false);
    } catch (error) {
      console.error('Network switch error:', error);
      setError(error.message);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId) => {
    return NETWORK_CONFIGS[chainId]?.name || `Chain ${chainId}`;
  };

  const getNetworkIcon = (chainId) => {
    return NETWORK_CONFIGS[chainId]?.iconUrl || '🌐';
  };

  // Wallet Selection Modal
  const WalletSelectionModal = () => (
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title style={{
  fontWeight: '600'
}}>
          Connect Wallet
        </Dialog.Title>

        <div className="space-y-3">
          {availableWallets.map((wallet) => (
            <Card 
              key={wallet.id}
              style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              onClick={() => {
                setSelectedProvider(wallet);
                connectWallet(wallet);
              }}
            >
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <p style={{
  fontWeight: '600'
}}>{wallet.name}</p>
                    <p style={{
  color: '#A0A0A0'
}}>{wallet.description}</p>
                  </div>
                </div>

                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  {wallet.isAvailable ? (
                    <Badge color="green">Detected</Badge>
                  ) : (
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <Badge variant="outline">Install</Badge>
                      {wallet.downloadUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(wallet.downloadUrl, '_blank');
                          }}
                        >
                          <Download style={{
  width: '12px',
  height: '12px'
}} />
                        </Button>
                      )}
                    </div>
                  )}
                  <ChevronRight style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {error && (
          <div style={{
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <AlertTriangle style={{
  width: '16px',
  height: '16px'
}} />
              <span className="text-sm">{typeof error === "string" ? error : getErrorMessage(error, "")}</span>
            </div>
          </div>
        )}

        <div style={{
  textAlign: 'center'
}}>
          <p style={{
  color: '#A0A0A0'
}}>
            By connecting a wallet, you agree to CRYB's Terms of Service
          </p>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );

  // QR Code Modal (for WalletConnect)
  const QRCodeModal = () => (
    <Dialog.Root open={qrCodeModal} onOpenChange={setQrCodeModal}>
      <Dialog.Content className="max-w-sm">
        <Dialog.Title style={{
  fontWeight: '600',
  textAlign: 'center'
}}>
          Scan QR Code
        </Dialog.Title>

        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  width: '192px',
  height: '192px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <QrCode style={{
  width: '64px',
  height: '64px',
  color: '#A0A0A0'
}} />
            <div style={{
  position: 'absolute'
}}>
              <p style={{
  color: '#A0A0A0'
}}>QR Code would appear here</p>
            </div>
          </div>

          <div>
            <p style={{
  color: '#A0A0A0'
}}>
              1. Open your wallet app
            </p>
            <p style={{
  color: '#A0A0A0'
}}>
              2. Scan this QR code
            </p>
            <p style={{
  color: '#A0A0A0'
}}>
              3. Approve the connection
            </p>
          </div>

          <Button variant="outline" onClick={() => setQrCodeModal(false)}>
            Cancel
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );

  // Network Switcher Modal
  const NetworkSwitcherModal = () => (
    <Dialog.Root open={networkSwitchModal} onOpenChange={setNetworkSwitchModal}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title style={{
  fontWeight: '600'
}}>
          Switch Network
        </Dialog.Title>

        <div className="space-y-3">
          {Object.entries(NETWORK_CONFIGS).map(([chainId, network]) => (
            <Card 
              key={chainId}
              style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              onClick={() => switchNetwork(parseInt(chainId))}
            >
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <img 
                    src={network.iconUrl} 
                    alt={network.name}
                    style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%'
}}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-2xl" style={{ display: 'none' }}>🌐</span>
                  <div>
                    <p style={{
  fontWeight: '600'
}}>{network.name}</p>
                    <p style={{
  color: '#A0A0A0'
}}>
                      {network.nativeCurrency.symbol}
                    </p>
                  </div>
                </div>

                {parseInt(chainId) === connectionState.chainId && (
                  <Badge color="green">
                    <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                    Connected
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );

  // Connected Wallet Display
  if (connectionState.isConnected) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        {/* Network Badge */}
        {showNetworkSwitcher && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNetworkSwitchModal(true)}
          >
            <Globe style={{
  width: '12px',
  height: '12px'
}} />
            {getNetworkName(connectionState.chainId)}
          </Button>
        )}

        {/* Wallet Info */}
        <Card style={{
  padding: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <Wallet style={{
  width: '16px',
  height: '16px'
}} />
            </div>
            
            <div>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <p style={{
  fontWeight: '500'
}}>{formatAddress(connectionState.account)}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(connectionState.account)}
                >
                  <Copy style={{
  width: '12px',
  height: '12px'
}} />
                </Button>
              </div>
              <p style={{
  color: '#A0A0A0'
}}>
                {connectionState.balance} ETH
              </p>
            </div>
          </div>
        </Card>

        {/* Disconnect Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
        >
          <Unlink style={{
  width: '12px',
  height: '12px'
}} />
          Disconnect
        </Button>

        {/* Modals */}
        <NetworkSwitcherModal />
      </div>
    );
  }

  // Connect Button
  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        disabled={connectionState.isConnecting}
        style={{
  position: 'relative'
}}
      >
        {connectionState.isConnecting ? (
          <>
            <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
            Connecting...
          </>
        ) : (
          <>
            <Wallet style={{
  width: '16px',
  height: '16px'
}} />
            Connect Wallet
          </>
        )}
      </Button>

      {/* Modals */}
      <WalletSelectionModal />
      <QRCodeModal />
    </>
  );
};




export default WALLET_PROVIDERS
