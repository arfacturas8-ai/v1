import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'reward';
  amount: number;
  currency: string;
  usdValue: number;
  recipient?: string;
  sender?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount: 0.5,
    currency: 'ETH',
    usdValue: 1850.50,
    sender: '0x1234...5678',
    timestamp: '2024-01-15T14:30:00Z',
    status: 'completed',
    hash: '0xabcd...efgh',
  },
  {
    id: '2',
    type: 'send',
    amount: 100,
    currency: 'USDC',
    usdValue: 100.00,
    recipient: '0x8765...4321',
    timestamp: '2024-01-15T10:15:00Z',
    status: 'completed',
    hash: '0xijkl...mnop',
  },
  {
    id: '3',
    type: 'swap',
    amount: 0.25,
    currency: 'ETH',
    usdValue: 925.25,
    timestamp: '2024-01-14T16:45:00Z',
    status: 'completed',
    hash: '0xqrst...uvwx',
  },
  {
    id: '4',
    type: 'stake',
    amount: 1000,
    currency: 'CRYB',
    usdValue: 250.00,
    timestamp: '2024-01-13T09:00:00Z',
    status: 'completed',
    hash: '0xyzab...cdef',
  },
  {
    id: '5',
    type: 'reward',
    amount: 50,
    currency: 'CRYB',
    usdValue: 12.50,
    timestamp: '2024-01-12T12:00:00Z',
    status: 'completed',
    hash: '0xghij...klmn',
  },
  {
    id: '6',
    type: 'send',
    amount: 0.1,
    currency: 'ETH',
    usdValue: 370.10,
    recipient: '0x9876...1234',
    timestamp: '2024-01-11T08:30:00Z',
    status: 'pending',
    hash: '0xopqr...stuv',
  },
  {
    id: '7',
    type: 'receive',
    amount: 500,
    currency: 'USDC',
    usdValue: 500.00,
    sender: '0x4567...8901',
    timestamp: '2024-01-10T15:20:00Z',
    status: 'completed',
    hash: '0xwxyz...abcd',
  },
];

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filterOptions = [
    { value: 'all', label: 'All transactions' },
    { value: 'send', label: 'Sent' },
    { value: 'receive', label: 'Received' },
    { value: 'swap', label: 'Swaps' },
    { value: 'stake', label: 'Staking' },
    { value: 'reward', label: 'Rewards' },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sender?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight size={20} color={colors.semantic.error} />;
      case 'receive':
        return <ArrowDownLeft size={20} color={colors.semantic.success} />;
      case 'swap':
        return <TrendingUp size={20} color={colors.brand.primary} />;
      case 'stake':
      case 'unstake':
        return <TrendingDown size={20} color={colors.semantic.info} />;
      case 'reward':
        return <TrendingUp size={20} color={colors.semantic.success} />;
      default:
        return <ArrowUpRight size={20} color={colors.text.tertiary} />;
    }
  };

  const getTransactionLabel = (tx: Transaction): string => {
    switch (tx.type) {
      case 'send':
        return `Sent to ${tx.recipient}`;
      case 'receive':
        return `Received from ${tx.sender}`;
      case 'swap':
        return 'Swapped tokens';
      case 'stake':
        return 'Staked tokens';
      case 'unstake':
        return 'Unstaked tokens';
      case 'reward':
        return 'Staking reward';
      default:
        return 'Transaction';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return colors.semantic.success;
      case 'pending':
        return colors.semantic.warning;
      case 'failed':
        return colors.semantic.error;
      default:
        return colors.text.tertiary;
    }
  };

  const handleExport = () => {
    console.log('Exporting transaction history...');
    alert('Export functionality coming soon!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Transaction history
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: '8px',
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: spacing[4] }}>
        {/* Search and filter */}
        <div style={{ marginBottom: spacing[4] }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: spacing[3] }}>
            <Search
              size={20}
              color={colors.text.tertiary}
              style={{
                position: 'absolute',
                left: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              style={{
                width: '100%',
                padding: spacing[3],
                paddingLeft: `calc(${spacing[3]} + 28px)`,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
          </div>

          {/* Filter */}
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              overflowX: 'auto',
              padding: spacing[2],
              backgroundColor: colors.bg.secondary,
              borderRadius: '12px',
            }}
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: filterType === option.value ? colors.brand.primary : 'transparent',
                  color: filterType === option.value ? 'white' : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  whiteSpace: 'nowrap',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx, index) => (
            <div
              key={tx.id}
              onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
              style={{
                padding: spacing[4],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                marginBottom: index < filteredTransactions.length - 1 ? spacing[3] : 0,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor:
                      tx.type === 'send'
                        ? colors.semantic.error + '20'
                        : tx.type === 'receive'
                        ? colors.semantic.success + '20'
                        : colors.brand.primary + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getTransactionIcon(tx.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    {getTransactionLabel(tx)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatTimestamp(tx.timestamp)}
                    </span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>•</span>
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: getStatusColor(tx.status),
                      }}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: tx.type === 'send' ? colors.semantic.error : colors.semantic.success,
                      marginBottom: spacing[1],
                    }}
                  >
                    {tx.type === 'send' ? '-' : '+'}
                    {tx.amount} {tx.currency}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    ${tx.usdValue.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <Search size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No transactions found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No transactions match "${searchQuery}". Try a different search term.`
                : 'You haven\'t made any transactions yet. Start by making your first transaction.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
