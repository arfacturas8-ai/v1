import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Filter, 
  Calendar, 
  Search,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../ui/Button';
import { formatTokenAmount, formatUSDValue, formatWalletAddress } from '../../utils/web3Utils';
import { TransactionStatusIndicator } from './TransactionConfirmation';
import { getErrorMessage } from '../../utils/errorUtils'

const TRANSACTION_TYPES = {
  SEND: 'send',
  RECEIVE: 'receive',
  SWAP: 'swap',
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  APPROVE: 'approve',
  MINT: 'mint',
  BURN: 'burn',
  CONTRACT: 'contract'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Mock transaction data generator
const generateMockTransactions = (count = 20) => {
  const types = Object.values(TRANSACTION_TYPES);
  const statuses = Object.values(TRANSACTION_STATUS);
  const tokens = ['ETH', 'USDC', 'CRYB', 'DAI', 'UNI'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = i < 3 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const amount = (Math.random() * 1000).toFixed(6);
    const usdValue = parseFloat(amount) * (token === 'ETH' ? 2000 : token === 'CRYB' ? 0.5 : 1);
    
    return {
      id: `tx_${i + 1}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      type,
      status,
      amount,
      token,
      symbol: token,
      usdValue,
      from: '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F',
      to: '0x' + Math.random().toString(16).substr(2, 40),
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      blockNumber: 18000000 + Math.floor(Math.random() * 100000),
      gasPrice: Math.floor(Math.random() * 50 + 10),
      gasUsed: Math.floor(Math.random() * 100000 + 21000),
      gasFee: (Math.random() * 0.01).toFixed(6),
      confirmations: status === 'confirmed' ? Math.floor(Math.random() * 20 + 1) : 0,
      description: getTransactionDescription(type, token, amount)
    };
  });
};

const getTransactionDescription = (type, token, amount) => {
  switch (type) {
    case TRANSACTION_TYPES.SEND:
      return `Sent ${amount} ${token}`;
    case TRANSACTION_TYPES.RECEIVE:
      return `Received ${amount} ${token}`;
    case TRANSACTION_TYPES.SWAP:
      return `Swapped ${amount} ${token}`;
    case TRANSACTION_TYPES.STAKE:
      return `Staked ${amount} ${token}`;
    case TRANSACTION_TYPES.UNSTAKE:
      return `Unstaked ${amount} ${token}`;
    case TRANSACTION_TYPES.APPROVE:
      return `Approved ${token} spending`;
    case TRANSACTION_TYPES.MINT:
      return `Minted ${amount} ${token}`;
    case TRANSACTION_TYPES.BURN:
      return `Burned ${amount} ${token}`;
    default:
      return `Contract interaction`;
  }
};

function TransactionHistory({
  account,
  showFilters = true,
  maxTransactions = 50,
  className = ''
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    token: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showValues, setShowValues] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, [account]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock transactions
      const mockTxs = generateMockTransactions(maxTransactions);
      setTransactions(mockTxs);
      
    } catch (err) {
      setError('Failed to load transaction history');
      console.error('Transaction history error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }
    
    if (filters.token !== 'all') {
      filtered = filtered.filter(tx => tx.token === filters.token);
    }
    
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      }[filters.dateRange];
      
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(tx => tx.timestamp > cutoff);
      }
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'gasFee':
          aValue = parseFloat(a.gasFee);
          bValue = parseFloat(b.gasFee);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, filters, searchTerm, sortBy, sortOrder]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getTransactionIcon = (type, status) => {
    if (status === 'pending') {
      return <Loader2 style={{
  height: '16px',
  width: '16px'
}} />;
    }
    
    switch (type) {
      case TRANSACTION_TYPES.SEND:
        return <ArrowUpRight style={{
  height: '16px',
  width: '16px'
}} />;
      case TRANSACTION_TYPES.RECEIVE:
        return <ArrowDownLeft style={{
  height: '16px',
  width: '16px'
}} />;
      case TRANSACTION_TYPES.SWAP:
        return <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />;
      case TRANSACTION_TYPES.STAKE:
        return <TrendingUp style={{
  height: '16px',
  width: '16px'
}} />;
      case TRANSACTION_TYPES.UNSTAKE:
        return <TrendingDown style={{
  height: '16px',
  width: '16px'
}} />;
      default:
        return <Clock style={{
  height: '16px',
  width: '16px'
}} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.SEND:
        return 'text-error';
      case TRANSACTION_TYPES.RECEIVE:
        return 'text-success';
      case TRANSACTION_TYPES.SWAP:
        return 'text-accent-primary';
      case TRANSACTION_TYPES.STAKE:
        return 'text-success';
      case TRANSACTION_TYPES.UNSTAKE:
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getExplorerUrl = (hash) => {
    return `https://etherscan.io/tx/${hash}`;
  };

  if (loading) {
    return (
      <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <Loader2 style={{
  height: '20px',
  width: '20px'
}} />
          <h3 style={{
  fontWeight: '600'
}}>Loading Transaction History...</h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '12px'
}} />
                <div style={{
  flex: '1'
}}>
                  <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
                  <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
                </div>
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  height: '16px',
  borderRadius: '4px',
  width: '80px'
}} />
                  <div style={{
  height: '12px',
  borderRadius: '4px',
  width: '64px'
}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <XCircle style={{
  height: '48px',
  width: '48px'
}} />
          <h3 style={{
  fontWeight: '600'
}}>Failed to Load Transactions</h3>
          <p className="text-sm text-muted mb-4">{typeof error === "string" ? error : getErrorMessage(error, "")}</p>
          <Button onClick={loadTransactions} size="sm">
            <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
      {/* Header */}
      <div style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <History style={{
  height: '20px',
  width: '20px'
}} />
            <h3 style={{
  fontWeight: '600'
}}>Transaction History</h3>
            <span className="text-sm text-muted">
              ({filteredTransactions.length} transactions)
            </span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <button
              onClick={() => setShowValues(!showValues)}
              className="text-muted hover:text-primary transition-colors"
              title={showValues ? 'Hide values' : 'Show values'}
            >
              {showValues ? <EyeOff style={{
  height: '16px',
  width: '16px'
}} /> : <Eye style={{
  height: '16px',
  width: '16px'
}} />}
            </button>
            <Button
              onClick={loadTransactions}
              size="sm"
              variant="secondary"
            >
              <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-4">
            {/* Search */}
            <div style={{
  position: 'relative'
}}>
              <Search style={{
  height: '16px',
  width: '16px',
  position: 'absolute'
}} />
              <input
                type="text"
                placeholder="Search by hash, description, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
              />
            </div>

            {/* Filter controls */}
            <div style={{
  display: 'grid',
  gap: '12px'
}}>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              >
                <option value="all">All Types</option>
                <option value="send">Send</option>
                <option value="receive">Receive</option>
                <option value="swap">Swap</option>
                <option value="stake">Stake</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filters.token}
                onChange={(e) => setFilters(prev => ({ ...prev, token: e.target.value }))}
                style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              >
                <option value="all">All Tokens</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="CRYB">CRYB</option>
                <option value="DAI">DAI</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-accent-primary/10">
        {paginatedTransactions.length === 0 ? (
          <div style={{
  padding: '32px',
  textAlign: 'center'
}}>
            <History style={{
  height: '48px',
  width: '48px'
}} />
            <h4 style={{
  fontWeight: '500'
}}>No Transactions Found</h4>
            <p className="text-sm text-muted">
              {searchTerm || filters.type !== 'all' || filters.status !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Your transaction history will appear here once you start using Web3 features.'
              }
            </p>
          </div>
        ) : (
          paginatedTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
              style={{
  padding: '16px'
}}
            >
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                {/* Transaction Icon */}
                <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {getTransactionIcon(tx.type, tx.status)}
                </div>

                {/* Transaction Info */}
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
}}>
                      {tx.description}
                    </span>
                    <TransactionStatusIndicator
                      status={tx.status}
                      confirmations={tx.confirmations}
                      requiredConfirmations={12}
                    />
                  </div>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                    <span>{tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}</span>
                    <span className="font-mono">{formatWalletAddress(tx.hash, 8, 6)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(tx.hash);
                      }}
                      className="hover:text-primary transition-colors"
                      title="Copy hash"
                    >
                      <Copy style={{
  height: '12px',
  width: '12px'
}} />
                    </button>
                    <a
                      href={getExplorerUrl(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink style={{
  height: '12px',
  width: '12px'
}} />
                    </a>
                  </div>
                </div>

                {/* Amount */}
                <div style={{
  textAlign: 'right'
}}>
                  {showValues ? (
                    <>
                      <div style={{
  fontWeight: '500'
}}>
                        {tx.type === TRANSACTION_TYPES.SEND ? '-' : '+'}
                        {formatTokenAmount(tx.amount, 18, 4)} {tx.symbol}
                      </div>
                      <div className="text-xs text-muted">
                        ≈ {formatUSDValue(tx.usdValue)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted">
                      ••••••
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedTx?.id === tx.id && (
                <div className="mt-4 pt-4 border-t border-muted/20">
                  <div style={{
  display: 'grid',
  gap: '16px'
}}>
                    <div className="space-y-2">
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">From:</span>
                        <span className="font-mono text-primary">{formatWalletAddress(tx.from)}</span>
                      </div>
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">To:</span>
                        <span className="font-mono text-primary">{formatWalletAddress(tx.to)}</span>
                      </div>
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">Block:</span>
                        <span className="font-mono text-primary">{tx.blockNumber.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">Gas Price:</span>
                        <span className="font-mono text-primary">{tx.gasPrice} gwei</span>
                      </div>
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">Gas Used:</span>
                        <span className="font-mono text-primary">{tx.gasUsed.toLocaleString()}</span>
                      </div>
                      <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">Gas Fee:</span>
                        <span className="font-mono text-primary">{tx.gasFee} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div className="text-sm text-muted">
              Page {currentPage} of {totalPages}
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default TransactionHistory;