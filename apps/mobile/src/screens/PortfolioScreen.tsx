import React from 'react';
import { View } from 'react-native';
import { PieChart } from 'lucide-react-native';
import { ComingSoonGate } from '../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function PortfolioScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="Portfolio"
        description="Track your crypto portfolio with advanced analytics. Monitor your assets, view performance charts, and get insights into your holdings."
        icon={<PieChart size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
