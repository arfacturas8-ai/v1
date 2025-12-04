import React from 'react';
import { Repeat } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function TradePage() {
  return (
    <ComingSoonGate
      feature="Trading"
      description="Swap tokens instantly with the best rates across multiple DEXs. Low slippage, fast execution, and gas optimization."
      icon={<Repeat size={40} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default TradePage;
