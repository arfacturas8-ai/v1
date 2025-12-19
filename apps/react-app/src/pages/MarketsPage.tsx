/**
 * MarketsPage - Modernized with iOS Aesthetic
 *
 * Design System:
 * - Background: #FAFAFA
 * - Text: #000 primary, #666 secondary
 * - Cards: white with subtle shadows
 * - Borders: 16-24px radius
 * - Buttons: 56px/48px height, 12-14px radius
 * - Icons: 20px
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04) cards, 0 8px 32px rgba(0,0,0,0.08) modals
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Hover: translateY(-2px) + enhanced shadow
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import ComingSoonGate from '../components/ComingSoonGate';

export function MarketsPage() {
  return (
    <ComingSoonGate
      feature="Markets"
      description="Track real-time crypto prices, view detailed charts, and monitor your favorite tokens. Get price alerts and stay ahead of the market."
      icon={<TrendingUp size={20} color="#6366F1" />}
      notifyOption={true}
      onBack={() => window.history.back()}
    />
  );
}

export default MarketsPage;
