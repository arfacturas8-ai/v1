import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type TransactionType = 'send' | 'receive' | 'swap' | 'nft' | 'contract';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  token: string;
  tokenSymbol: string;
  usdValue: string;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
  network: string;
  gasUsed?: string;
  gasPrice?: string;
}

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | TransactionType>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'receive',
          status: 'completed',
          amount: '0.5',
          token: 'ETH',
          tokenSymbol: 'ETH',
          usdValue: '$950.00',
          from: '0x1234...5678',
          to: '0xabcd...efgh',
          timestamp: '2 hours ago',
          txHash: '0x9876543210abcdef...',
          network: 'Ethereum',
          gasUsed: '21000',
          gasPrice: '50 Gwei',
        },
        {
          id: '2',
          type: 'send',
          status: 'completed',
          amount: '100',
          token: 'USDC',
          tokenSymbol: 'USDC',
          usdValue: '$100.00',
          from: '0xabcd...efgh',
          to: '0x9999...1111',
          timestamp: '1 day ago',
          txHash: '0xabcdef123456...',
          network: 'Polygon',
          gasUsed: '45000',
          gasPrice: '30 Gwei',
        },
        {
          id: '3',
          type: 'nft',
          status: 'completed',
          amount: '1',
          token: 'Bored Ape #1234',
          tokenSymbol: 'BAYC',
          usdValue: '$50,000.00',
          from: '0x2222...3333',
          to: '0xabcd...efgh',
          timestamp: '3 days ago',
          txHash: '0xfedcba987654...',
          network: 'Ethereum',
          gasUsed: '150000',
          gasPrice: '80 Gwei',
        },
        {
          id: '4',
          type: 'swap',
          status: 'completed',
          amount: '500',
          token: 'USDT → ETH',
          tokenSymbol: 'SWAP',
          usdValue: '$500.00',
          from: '0xabcd...efgh',
          to: '0xabcd...efgh',
          timestamp: '1 week ago',
          txHash: '0x1111222233334444...',
          network: 'Ethereum',
          gasUsed: '120000',
          gasPrice: '60 Gwei',
        },
        {
          id: '5',
          type: 'send',
          status: 'pending',
          amount: '0.1',
          token: 'ETH',
          tokenSymbol: 'ETH',
          usdValue: '$190.00',
          from: '0xabcd...efgh',
          to: '0x5555...6666',
          timestamp: 'Just now',
          txHash: '0x9999888877776666...',
          network: 'Ethereum',
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTransactionIcon = (type: TransactionType, status: TransactionStatus) => {
    if (status === 'pending') return '⏳';
    if (status === 'failed') return '❌';

    switch (type) {
      case 'send':
        return '↗️';
      case 'receive':
        return '↙️';
      case 'swap':
        return '🔄';
      case 'nft':
        return '🖼️';
      case 'contract':
        return '📝';
      default:
        return '💰';
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'send':
        return '#EF4444';
      case 'receive':
        return '#10B981';
      case 'swap':
        return '#3B82F6';
      case 'nft':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetail' as never, { transaction } as never);
  };

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter(tx => tx.type === filter);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {getTransactionIcon(item.type, item.status)}
        </Text>
      </View>

      <View style={styles.transactionInfo}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text
            style={[
              styles.transactionAmount,
              { color: getTypeColor(item.type) },
            ]}
          >
            {item.type === 'receive' ? '+' : item.type === 'send' ? '-' : ''}
            {item.amount} {item.tokenSymbol}
          </Text>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionToken}>{item.token}</Text>
          <Text style={styles.transactionUsd}>{item.usdValue}</Text>
        </View>

        <View style={styles.transactionFooter}>
          <Text style={styles.transactionNetwork}>{item.network}</Text>
          <Text style={styles.transactionTime}>{item.timestamp}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'send' && styles.filterButtonActive]}
          onPress={() => setFilter('send')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'send' && styles.filterButtonTextActive,
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'receive' && styles.filterButtonActive]}
          onPress={() => setFilter('receive')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'receive' && styles.filterButtonTextActive,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'swap' && styles.filterButtonActive]}
          onPress={() => setFilter('swap')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'swap' && styles.filterButtonTextActive,
            ]}
          >
            Swaps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'nft' && styles.filterButtonActive]}
          onPress={() => setFilter('nft')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'nft' && styles.filterButtonTextActive,
            ]}
          >
            NFTs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTransactions}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📜</Text>
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateText}>
              Your transaction history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: typography.body2,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionIconText: {
    fontSize: typography.h4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  transactionType: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionAmount: {
    fontSize: typography.body1,
    fontWeight: '700',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionToken: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  transactionUsd: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionNetwork: {
    fontSize: typography.caption,
    color: '#6B7280',
  },
  transactionTime: {
    fontSize: typography.caption,
    color: '#6B7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.h5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body1,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;
