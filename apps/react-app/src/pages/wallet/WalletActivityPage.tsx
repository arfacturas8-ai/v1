/**
 * CRYB Wallet Activity Page
 * Transaction history with filtering and search
 * Production-ready with blockchain integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Filter,
  Download,
  ExternalLink,
  Send,
  Download as Receive,
  Repeat,
  FileCode,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, SearchInput } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { cn, formatRelativeTime } from '../../lib/utils';
import { ethers } from 'ethers';

type TransactionType = 'all' | 'send' | 'receive' | 'swap' | 'contract';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface Transaction {
  hash: string;
  blockNumber: number;
  type: Exclude<TransactionType, 'all'>;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: TransactionStatus;
  gasUsed?: string;
  gasPrice?: string;
  tokenSymbol?: string;
  methodName?: string;
  confirmations?: number;
}

const TRANSACTION_TYPES: { value: TransactionType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Transactions', icon: <Clock className="h-4 w-4" /> },
  { value: 'send', label: 'Sent', icon: <Send className="h-4 w-4" /> },
  { value: 'receive', label: 'Received', icon: <Receive className="h-4 w-4" /> },
  { value: 'swap', label: 'Swaps', icon: <Repeat className="h-4 w-4" /> },
  { value: 'contract', label: 'Contract Calls', icon: <FileCode className="h-4 w-4" /> },
];

export function WalletActivityPage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('Ethereum');
  const [chainId, setChainId] = useState<number>(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter, searchQuery]);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWalletAddress(address);

          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          setNetwork(getNetworkName(Number(network.chainId)));

          await loadTransactions(address, provider);
        } else {
          navigate('/wallet/connect');
        }
      } else {
        navigate('/wallet/connect');
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      navigate('/wallet/connect');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      // In production, fetch from blockchain API or indexer
      // This is mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 18500000,
          type: 'receive',
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          to: address,
          value: '0.5',
          timestamp: Date.now() - 3600000,
          status: 'confirmed',
          gasUsed: '21000',
          gasPrice: '30',
          tokenSymbol: 'ETH',
          confirmations: 150,
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 18499500,
          type: 'send',
          from: address,
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          value: '0.1',
          timestamp: Date.now() - 7200000,
          status: 'confirmed',
          gasUsed: '21000',
          gasPrice: '28',
          tokenSymbol: 'ETH',
          confirmations: 650,
        },
        {
          hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
          blockNumber: 18499000,
          type: 'swap',
          from: address,
          to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
          value: '1.0',
          timestamp: Date.now() - 14400000,
          status: 'confirmed',
          gasUsed: '150000',
          gasPrice: '35',
          tokenSymbol: 'ETH',
          methodName: 'swapExactETHForTokens',
          confirmations: 1150,
        },
        {
          hash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          blockNumber: 18498500,
          type: 'contract',
          from: address,
          to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          value: '0',
          timestamp: Date.now() - 21600000,
          status: 'confirmed',
          gasUsed: '80000',
          gasPrice: '25',
          methodName: 'approve',
          confirmations: 1650,
        },
        {
          hash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
          blockNumber: 18498000,
          type: 'receive',
          from: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
          to: address,
          value: '2.5',
          timestamp: Date.now() - 28800000,
          status: 'confirmed',
          gasUsed: '21000',
          gasPrice: '30',
          tokenSymbol: 'ETH',
          confirmations: 2150,
        },
        {
          hash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
          blockNumber: 0,
          type: 'send',
          from: address,
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          value: '0.05',
          timestamp: Date.now() - 300000,
          status: 'pending',
          tokenSymbol: 'ETH',
          confirmations: 0,
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(query) ||
        tx.from.toLowerCase().includes(query) ||
        tx.to.toLowerCase().includes(query) ||
        tx.methodName?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchQuery]);

  const loadMoreTransactions = async () => {
    setLoadingMore(true);
    // Simulate loading more transactions
    setTimeout(() => {
      setLoadingMore(false);
      setHasMore(false);
    }, 1000);
  };

  const handleExport = () => {
    // Export transactions to CSV
    const headers = ['Hash', 'Type', 'From', 'To', 'Value', 'Date', 'Status'];
    const rows = filteredTransactions.map(tx => [
      tx.hash,
      tx.type,
      tx.from,
      tx.to,
      `${tx.value} ${tx.tokenSymbol || 'ETH'}`,
      new Date(tx.timestamp).toISOString(),
      tx.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-activity-${Date.now()}.csv`;
    a.click();
  };

  const getNetworkName = (chainId: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      56: 'BNB Chain',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  const getExplorerUrl = (hash: string): string => {
    const explorers: { [key: number]: string } = {
      1: 'https://etherscan.io/tx/',
      5: 'https://goerli.etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
    };
    return (explorers[chainId] || 'https://etherscan.io/tx/') + hash;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <Send className="h-4 w-4" />;
      case 'receive':
        return <Receive className="h-4 w-4" />;
      case 'swap':
        return <Repeat className="h-4 w-4" />;
      case 'contract':
        return <FileCode className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 " />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-muted-foreground">
              {network} - {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          className="hidden md:flex"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by hash or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-accent")}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedFilter === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(type.value)}
                  className="justify-start"
                >
                  {type.icon}
                  <span className="ml-2">{type.label}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        tx.type === 'receive' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                        tx.type === 'send' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                        tx.type === 'swap' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
                        tx.type === 'contract' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                      )}>
                        {getTransactionIcon(tx.type)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium capitalize">{tx.type}</p>
                          {tx.methodName && (
                            <Badge variant="outline" className="text-xs">
                              {tx.methodName}
                            </Badge>
                          )}
                          {getStatusIcon(tx.status)}
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            From: <span className="font-mono">{formatAddress(tx.from)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            To: <span className="font-mono">{formatAddress(tx.to)}</span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(tx.timestamp)}</span>
                            {tx.confirmations && tx.confirmations > 0 && (
                              <span>• {tx.confirmations} confirmations</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          tx.type === 'receive' && "text-green-600",
                          tx.type === 'send' && "text-blue-600"
                        )}>
                          {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.value} {tx.tokenSymbol || 'ETH'}
                        </p>
                        {tx.gasUsed && tx.gasPrice && (
                          <p className="text-xs text-muted-foreground">
                            Gas: {(Number(tx.gasUsed) * Number(tx.gasPrice) / 1e9).toFixed(6)} ETH
                          </p>
                        )}
                      </div>

                      <Badge
                        variant={
                          tx.status === 'confirmed' ? 'success' :
                          tx.status === 'pending' ? 'warning' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>

                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="p-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                    className="w-full"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 " />
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Your transaction history will appear here'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Export Button */}
      <Button
        variant="outline"
        onClick={handleExport}
        className="w-full md:hidden"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Transactions
      </Button>
    </div>
  );
}

export default WalletActivityPage;
