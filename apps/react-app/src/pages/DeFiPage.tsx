import React from 'react';
import { TrendingUp } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function DeFiPage() {
  return (
    <ComingSoonGate
      feature="DeFi"
      description="Stake tokens, provide liquidity, lend and borrow assets. Earn yield on your crypto with the best protocols."
      icon={<TrendingUp size={40} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default DeFiPage;
