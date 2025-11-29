import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
}

const SendScreen = () => {
  const navigation = useNavigation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '2.5',
    usdValue: '$4,750.00',
    icon: '💎',
  });
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  const availableTokens: Token[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '2.5',
      usdValue: '$4,750.00',
      icon: '💎',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1000',
      usdValue: '$1,000.00',
      icon: '💵',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: '500',
      usdValue: '$500.00',
      icon: '💵',
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      balance: '1500',
      usdValue: '$1,200.00',
      icon: '🟣',
    },
  ];

  const validateAddress = (address: string): boolean => {
    // Simple validation - should be 0x followed by 40 hex characters
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleMaxAmount = () => {
    setAmount(selectedToken.balance);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleScanQR = () => {
    // Navigate to QR scanner
    Alert.alert('Coming Soon', 'QR code scanner will be available soon.');
    // navigation.navigate('QRScanner', { onScan: setRecipient });
  };

  const calculateUsdValue = (): string => {
    if (!amount || isNaN(parseFloat(amount))) return '$0.00';

    const tokenUsdValue = parseFloat(selectedToken.usdValue.replace(/[$,]/g, ''));
    const tokenBalance = parseFloat(selectedToken.balance);
    const pricePerToken = tokenUsdValue / tokenBalance;
    const totalValue = parseFloat(amount) * pricePerToken;

    return `$${totalValue.toFixed(2)}`;
  };

  const calculateFee = (): string => {
    // Mock fee calculation
    return '0.002 ETH (~$3.80)';
  };

  const handleSend = async () => {
    // Validation
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }

    if (!validateAddress(recipient)) {
      Alert.alert('Error', 'Please enter a valid Ethereum address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(selectedToken.balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Confirmation
    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${selectedToken.symbol} to ${recipient.substring(0, 10)}...?\n\nEstimated Fee: ${calculateFee()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Mock transaction
              await new Promise(resolve => setTimeout(resolve, 2000));

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert(
                'Success!',
                `Transaction submitted!\n\nYou sent ${amount} ${selectedToken.symbol}`,
                [
                  {
                    text: 'View Transaction',
                    onPress: () => navigation.navigate('TransactionHistory' as never),
                  },
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error sending transaction:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to send transaction. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (showTokenSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Token</Text>
          <TouchableOpacity onPress={() => setShowTokenSelector(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tokenList}>
          {availableTokens.map(token => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.tokenCard,
                selectedToken.symbol === token.symbol && styles.tokenCardSelected,
              ]}
              onPress={() => {
                setSelectedToken(token);
                setShowTokenSelector(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.tokenIcon}>{token.icon}</Text>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
              <View style={styles.tokenBalance}>
                <Text style={styles.tokenBalanceAmount}>{token.balance}</Text>
                <Text style={styles.tokenBalanceUsd}>{token.usdValue}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Selected Token */}
        <TouchableOpacity
          style={styles.selectedTokenCard}
          onPress={() => setShowTokenSelector(true)}
        >
          <Text style={styles.tokenIcon}>{selectedToken.icon}</Text>
          <View style={styles.selectedTokenInfo}>
            <Text style={styles.selectedTokenSymbol}>{selectedToken.symbol}</Text>
            <Text style={styles.selectedTokenBalance}>
              Balance: {selectedToken.balance} {selectedToken.symbol}
            </Text>
          </View>
          <Text style={styles.changeIcon}>›</Text>
        </TouchableOpacity>

        {/* Recipient Address */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipient Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#6B7280"
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
              <Text style={styles.scanButtonText}>📷</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount</Text>
            <TouchableOpacity onPress={handleMaxAmount}>
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor="#6B7280"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Text style={styles.amountToken}>{selectedToken.symbol}</Text>
          </View>

          {amount && (
            <Text style={styles.amountUsd}>≈ {calculateUsdValue()}</Text>
          )}
        </View>

        {/* Memo (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Memo (Optional)</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            placeholder="Add a note..."
            placeholderTextColor="#6B7280"
            value={memo}
            onChangeText={setMemo}
            multiline
          />
        </View>

        {/* Transaction Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              {amount || '0'} {selectedToken.symbol}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee</Text>
            <Text style={styles.summaryValue}>{calculateFee()}</Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>
              {amount ? (parseFloat(amount) + 0.002).toFixed(4) : '0.002'}{' '}
              {selectedToken.symbol}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!recipient || !amount || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!recipient || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send {selectedToken.symbol}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    fontSize: typography.h5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: typography.h4,
    color: '#9CA3AF',
  },
  content: {
    padding: spacing.lg,
  },
  selectedTokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.xxl,
  },
  selectedTokenInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  selectedTokenSymbol: {
    fontSize: typography.h6,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  selectedTokenBalance: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  changeIcon: {
    fontSize: typography.h4,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  maxButton: {
    fontSize: typography.body2,
    fontWeight: '700',
    color: '#4F46E5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    fontSize: typography.body1,
    color: '#FFFFFF',
  },
  scanButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginLeft: spacing.sm,
  },
  scanButtonText: {
    fontSize: typography.h5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.h4,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  amountToken: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: spacing.sm,
  },
  amountUsd: {
    fontSize: typography.body1,
    color: '#6B7280',
    marginTop: spacing.sm,
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  summaryTitle: {
    fontSize: typography.body1,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryRowTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  summaryLabel: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  summaryValue: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryLabelTotal: {
    fontSize: typography.body1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryValueTotal: {
    fontSize: typography.body1,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: typography.body1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tokenList: {
    padding: spacing.lg,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tokenCardSelected: {
    borderColor: '#4F46E5',
  },
  tokenIcon: {
    fontSize: typography.h2,
    marginRight: spacing.md,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: typography.body1,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenBalanceAmount: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tokenBalanceUsd: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SendScreen;
