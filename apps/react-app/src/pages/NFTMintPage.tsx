import React from 'react';
import { Image } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function NFTMintPage() {
  return (
    <ComingSoonGate
      feature="NFT Minting"
      description="Create and mint your own NFTs directly on CRYB. Upload your artwork, set royalties, and launch your collection."
      icon={<Image size={40} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default NFTMintPage;
