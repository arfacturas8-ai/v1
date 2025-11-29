import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: number;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'nft_purchase';
  amount: string;
  token: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  from?: string;
  to?: string;
}

export default function WalletScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState('$1,234.56');
  const [tokens, setTokens] = useState<Token[]>([
    {
      id: '1',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '2.5',
      usdValue: '$4,500.00',
      change24h: 2.5,
      icon: '⟠',
    },
    {
      id: '2',
      symbol: 'MATIC',
      name: 'Polygon',
      balance: '500',
      usdValue: '$450.00',
      change24h: -1.2,
      icon: '◇',
    },
  ]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'receive',
      amount: '+0.5 ETH',
      token: 'ETH',
      timestamp: '2 hours ago',
      status: 'completed',
      from: '0x1234...5678',
    },
    {
      id: '2',
      type: 'send',
      amount: '-100 MATIC',
      token: 'MATIC',
      timestamp: '1 day ago',
      status: 'completed',
      to: '0xabcd...efgh',
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch wallet data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAction = async (action: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(action as never);
  };

  const renderTokenCard = ({ item }: { item: Token }) => (
    <TouchableOpacity
      style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('TokenDetail' as never, { tokenId: item.id } as never)}
    >
      <View style={styles.tokenLeft}>
        <View style={[styles.tokenIcon, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.tokenIconText}>{item.icon}</Text>
        </View>
        <View>
          <Text style={[styles.tokenSymbol, { color: colors.text }]}>{item.symbol}</Text>
          <Text style={[styles.tokenName, { color: colors.textSecondary }]}>{item.name}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={[styles.tokenBalance, { color: colors.text }]}>{item.balance}</Text>
        <View style={styles.tokenValueRow}>
          <Text style={[styles.tokenValue, { color: colors.textSecondary }]}>{item.usdValue}</Text>
          <Text
            style={[
              styles.tokenChange,
              { color: item.change24h >= 0 ? '#4CAF50' : '#F44336' },
            ]}
          >
            {item.change24h >= 0 ? '+' : ''}
            {item.change24h}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'send':
          return 'arrow-up-right';
        case 'receive':
          return 'arrow-down-left';
        case 'swap':
          return 'refresh-cw';
        case 'nft_purchase':
          return 'shopping-bag';
      }
    };

    const getColor = () => {
      switch (item.type) {
        case 'send':
          return '#F44336';
        case 'receive':
          return '#4CAF50';
        default:
          return colors.primary;
      }
    };

    return (
      <TouchableOpacity
        style={styles.transactionRow}
        onPress={() => navigation.navigate('TransactionDetail' as never, { txId: item.id } as never)}
      >
        <View style={[styles.transactionIcon, { backgroundColor: getColor() + '20' }]}>
          <Feather name={getIcon()} size={20} color={getColor()} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionType, { color: colors.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
          </Text>
          <Text style={[styles.transactionTime, { color: colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.transactionAmountText, { color: getColor() }]}>
            {item.amount}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === 'completed'
                      ? '#4CAF50'
                      : item.status === 'pending'
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Wallet</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('WalletSettings' as never)}
          >
            <Feather name="settings" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('TransactionHistory' as never)}
          >
            <Feather name="clock" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Balance Card */}
        <LinearGradient
          colors={[colors.primary, colors.primary + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{totalBalance}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Send')}
            >
              <Feather name="arrow-up" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Receive')}
            >
              <Feather name="arrow-down" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Swap')}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('Buy')}
            >
              <Feather name="credit-card" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tokens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Assets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddToken' as never)}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={tokens}
            keyExtractor={(item) => item.id}
            renderItem={renderTokenCard}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory' as never)}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
            <FlatList
              data={recentTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: spacing.lg,
    padding: spacing.xxl,
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: typography.body2,
    color: '#fff',
    opacity: 0.8,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: typography.h1,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
  },
  sectionAction: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  tokenCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: typography.h5,
  },
  tokenSymbol: {
    fontSize: typography.body1,
    fontWeight: 'bold',
  },
  tokenName: {
    fontSize: typography.caption,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  tokenValueRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  tokenValue: {
    fontSize: typography.caption,
  },
  tokenChange: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  transactionsCard: {
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    overflow: 'hidden',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: typography.caption,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  transactionAmountText: {
    fontSize: typography.body2,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
});
