import React from 'react';
import { View } from 'react-native';
import { ArrowLeftRight } from 'lucide-react-native';
import { ComingSoonGate } from '../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function TradeScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="Trade & Swap"
        description="Trade cryptocurrencies and swap tokens seamlessly. Access DEX aggregation for the best prices across multiple exchanges."
        icon={<ArrowLeftRight size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
