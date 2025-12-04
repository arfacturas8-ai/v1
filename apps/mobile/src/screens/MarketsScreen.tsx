import React from 'react';
import { View } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { ComingSoonGate } from '../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function MarketsScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="Markets"
        description="Track real-time cryptocurrency prices, market caps, and trends. Get insights into the latest market movements and make informed decisions."
        icon={<TrendingUp size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
