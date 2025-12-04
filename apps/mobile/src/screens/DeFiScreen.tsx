import React from 'react';
import { View } from 'react-native';
import { Coins } from 'lucide-react-native';
import { ComingSoonGate } from '../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function DeFiScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="DeFi"
        description="Access decentralized finance protocols. Stake, lend, borrow, and earn yield on your crypto assets with the best DeFi platforms."
        icon={<Coins size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
