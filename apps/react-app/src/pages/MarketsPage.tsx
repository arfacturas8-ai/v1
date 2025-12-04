import React from 'react';
import { TrendingUp } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function MarketsPage() {
  return (
    <ComingSoonGate
      feature="Markets"
      description="Track real-time crypto prices, view detailed charts, and monitor your favorite tokens. Get price alerts and stay ahead of the market."
      icon={<TrendingUp size={40} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default MarketsPage;
