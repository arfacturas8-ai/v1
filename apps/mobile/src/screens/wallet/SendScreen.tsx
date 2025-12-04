import React from 'react';
import { View } from 'react-native';
import { Send } from 'lucide-react-native';
import { ComingSoonGate } from '../../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function SendScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="Send Crypto"
        description="Send cryptocurrencies to any wallet address. Transfer tokens securely with low fees."
        icon={<Send size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
