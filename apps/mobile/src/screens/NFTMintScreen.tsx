import React from 'react';
import { View } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import { ComingSoonGate } from '../components/ComingSoonGate';
import { useNavigation } from '@react-navigation/native';

export default function NFTMintScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonGate
        feature="NFT Minting"
        description="Create and mint your own NFTs directly on the blockchain. Upload your artwork, set royalties, and launch your digital collectibles."
        icon={<ImageIcon size={48} color="#6366F1" />}
        onBack={() => navigation.goBack()}
      />
    </View>
  );
}
