import React from "react";
import { Star, Crown, Gem, Zap } from 'lucide-react'
import { Card } from '../ui/Card';

// OpenSea-inspired rarity config
const rarityConfig = {
  common: { color: '#6B7280', bgColor: 'bg-muted/20', borderColor: 'border-muted/30', icon: null },
  rare: { color: '#58a6ff', bgColor: 'bg-info/20', borderColor: 'border-info/30', icon: Star },
  epic: { color: '#8B5CF6', bgColor: 'bg-accent-primary/20', borderColor: 'border-accent-primary/30', icon: Gem },
  legendary: { color: '#F59E0B', bgColor: 'bg-warning/20', borderColor: 'border-warning/30', icon: Crown },
  mythic: { color: '#EF4444', bgColor: 'bg-error/20', borderColor: 'border-error/30', icon: Zap }
};

const sizeConfig = {
  xs: 'h-4 px-2 text-xs',
  sm: 'h-5 px-3 text-xs',
  md: 'h-6 px-3 text-sm',
  lg: 'h-7 px-4 text-sm'
};

function NFTProfileBadge({ 
  collection, 
  tokenId,
  rarity = 'common',
  size = 'sm',
  className = '',
  showTooltip = true 
}) {
  const config = rarityConfig[rarity];
  const Icon = config.icon;

  // NFT features coming soon - show OpenSea-style disabled badge
  const comingSoonBadge = (
    <div style={{
  position: 'relative'
}}>
      <span
        style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  borderRadius: '12px',
  fontWeight: '500',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: `${config.color}15`,
  borderColor: `${config.color}30`,
  color: config.color,
  opacity: 0.7
}}
      >
        <Gem style={{
  width: '12px',
  height: '12px'
}} />
        <span style={{
  fontWeight: '600'
}}>
          NFT Badge
        </span>
      </span>
      <span style={{
  position: 'absolute',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  color: '#ffffff',
  fontWeight: 'bold',
  borderRadius: '50%'
}}>
        SOON
      </span>
    </div>
  );

  if (!showTooltip) {
    return comingSoonBadge;
  }

  return (
    <div style={{
  position: 'relative'
}}>
      {comingSoonBadge}

      {/* OpenSea-style Tooltip */}
      <Card
        variant="elevated"
        padding="sm"
        style={{
  position: 'absolute'
}}
      >
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center'
}}>
            <Gem size={14} className="text-primary" />
            NFT Profile Badges
          </div>
          <div style={{
  fontWeight: '500'
}}>Coming Soon!</div>
          <div className="text-text-muted text-xs">Show off your NFT collections</div>
        </div>
        {/* Arrow */}
        <div style={{
  position: 'absolute',
  width: '0px',
  height: '0px'
}}></div>
      </Card>
    </div>
  );
}




export default rarityConfig
