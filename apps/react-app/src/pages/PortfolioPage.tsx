import React from 'react';
import { PieChart } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function PortfolioPage() {
  return (
    <ComingSoonGate
      feature="Portfolio Analytics"
      description="Track your crypto portfolio performance across all chains. View holdings, profits/losses, and detailed analytics."
      icon={<PieChart size={40} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default PortfolioPage;
