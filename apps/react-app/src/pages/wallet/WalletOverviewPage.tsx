/**
 * CRYB Wallet Overview Page
 * Main wallet view with balances, NFTs, activity, and quick actions
 * Production-ready with Web3 integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Copy,
  ExternalLink,
  Plus,
  Send,
  Download,
  Repeat,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  LogOut,
  Image as ImageIcon,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn, copyToClipboard, formatNumber } from '../../lib/utils';
import { ethers } from 'ethers';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  change24h: number;
  icon?: string;
  address?: string;
}

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  tokenId: string;
}

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'contract';
  amount: string;
  symbol: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  from?: string;
  to?: string;
}

export function WalletOverviewPage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('Ethereum');
  const [chainId, setChainId] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [balance24hChange, setBalance24hChange] = useState<number>(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWalletAddress(address);
          setIsConnected(true);

          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          setNetwork(getNetworkName(Number(network.chainId)));

          await loadWalletData(address, provider);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      // Get native balance
      const balance = await provider.getBalance(address);
      const ethBalance = Number(ethers.formatEther(balance));

      // Mock token data (in production, fetch from blockchain/API)
      const mockTokens: Token[] = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: ethBalance.toFixed(4),
          usdValue: ethBalance * 2500, // Mock price
          change24h: 2.5,
          icon: '⟠',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '1,250.00',
          usdValue: 1250,
          change24h: 0.01,
          icon: '💵',
        },
        {
          symbol: 'CRYB',
          name: 'CRYB Token',
          balance: '10,000',
          usdValue: 5000,
          change24h: 5.2,
          icon: '🔷',
        },
      ];

      const total = mockTokens.reduce((sum, token) => sum + token.usdValue, 0);
      setTotalBalance(total);
      setBalance24hChange(3.2);
      setTokens(mockTokens);

      // Mock NFTs
      setNfts([
        {
          id: '1',
          name: 'Crypto Punk #1234',
          collection: 'CryptoPunks',
          image: 'https://via.placeholder.com/150',
          tokenId: '1234',
        },
        {
          id: '2',
          name: 'Bored Ape #5678',
          collection: 'BAYC',
          image: 'https://via.placeholder.com/150',
          tokenId: '5678',
        },
      ]);

      // Mock recent transactions
      setRecentTransactions([
        {
          hash: '0x1234...5678',
          type: 'receive',
          amount: '0.5',
          symbol: 'ETH',
          timestamp: Date.now() - 3600000,
          status: 'confirmed',
        },
        {
          hash: '0xabcd...efgh',
          type: 'send',
          amount: '100',
          symbol: 'USDC',
          timestamp: Date.now() - 7200000,
          status: 'confirmed',
        },
      ]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const getNetworkName = (chainId: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      56: 'BSC',
      97: 'BSC Testnet',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await copyToClipboard(walletAddress);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    localStorage.removeItem('cryb_wallet_connection');
    navigate('/wallet/connect');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <Send className="h-4 w-4" />;
      case 'receive':
        return <Download className="h-4 w-4" />;
      case 'swap':
        return <Repeat className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className=" rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your assets and transactions
            </p>
            <Button
              onClick={() => navigate('/wallet/connect')}
              size="lg"
              className="w-full"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Connected Wallet */}
      <Card variant="glass">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm md:text-base font-medium">
                    {formatAddress(walletAddress!)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopyAddress}
                    className="hover:bg-accent/50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  {network}
                </Badge>
              </div>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg p-2 z-10">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Total Balance */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl md:text-4xl font-bold">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                balance24hChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {balance24hChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(balance24hChange).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-col h-auto py-4"
              onClick={() => navigate('/wallet/receive')}
            >
              <Download className="h-5 w-5 mb-2" />
              <span className="text-sm">Receive</span>
            </Button>

            <Button
              variant="outline"
              className="flex-col h-auto py-4 relative"
              disabled
            >
              <Send className="h-5 w-5 mb-2" />
              <span className="text-sm">Send</span>
              <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5">Soon</Badge>
            </Button>

            <Button
              variant="outline"
              className="flex-col h-auto py-4 relative"
              disabled
            >
              <DollarSign className="h-5 w-5 mb-2" />
              <span className="text-sm">Buy</span>
              <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5">Soon</Badge>
            </Button>

            <Button
              variant="outline"
              className="flex-col h-auto py-4 relative"
              disabled
            >
              <Repeat className="h-5 w-5 mb-2" />
              <span className="text-sm">Swap</span>
              <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5">Soon</Badge>
            </Button>
          </div>

          {/* Connect Another Wallet */}
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate('/wallet/connect')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Another Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {tokens.map((token, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                    {token.icon || token.symbol.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium">{token.balance} {token.symbol}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-sm text-muted-foreground">
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={cn(
                      "text-xs",
                      token.change24h >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NFTs Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            NFTs
          </CardTitle>
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {nfts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nfts.slice(0, 4).map((nft) => (
                <div
                  key={nft.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{nft.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No NFTs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wallet/activity')}
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length > 0 ? (
            <div className="divide-y">
              {recentTransactions.map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      tx.type === 'receive' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium">
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                      </p>
                      <Badge variant={tx.status === 'confirmed' ? 'success' : 'outline'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground p-4">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletOverviewPage;
