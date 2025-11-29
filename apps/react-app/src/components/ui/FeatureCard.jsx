import React, { useState } from 'react';

const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  image,
  status = 'active', // active, coming-soon, beta
  onClick,
  badge,
  features = [],
  className = '',
  size = 'default' // compact, default, large
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'coming-soon':
        return {
          badge: 'Coming Soon',
          overlay: true,
          badgeColor: '#00D4FF',
          cursor: 'not-allowed'
        };
      case 'beta':
        return {
          badge: 'Beta',
          overlay: false,
          badgeColor: '#00FF90',
          cursor: 'pointer'
        };
      default:
        return {
          badge: badge || null,
          overlay: false,
          badgeColor: '#0052FF',
          cursor: 'pointer'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isClickable = status !== 'coming-soon' && onClick;

  const sizeClasses = {
    compact: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  return (
    <div 
      style={{
  position: 'relative'
}}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered 
          ? 'rgba(31, 41, 55, 0.95)' 
          : 'rgba(31, 41, 55, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: isHovered 
          ? '1px solid rgba(0, 212, 255, 0.3)' 
          : '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)' 
          : '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Background Pattern */}
      <div 
        style={{
  position: 'absolute'
}}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)`,
          animation: isHovered ? 'pulse 2s ease-in-out infinite' : 'none'
        }}
      />

      {/* Status Badge */}
      {statusConfig.badge && (
        <div 
          style={{
  position: 'absolute',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '600'
}}
          style={{ 
            backgroundColor: statusConfig.badgeColor,
            color: 'white',
            boxShadow: `0 4px 12px ${statusConfig.badgeColor}40`
          }}
        >
          {statusConfig.badge}
        </div>
      )}

      {/* Coming Soon Overlay */}
      {statusConfig.overlay && (
        <div style={{
  position: 'absolute',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-4xl mb-2">🚀</div>
            <div style={{
  fontWeight: '600'
}}>Coming Soon</div>
            <div className="text-sm text-tertiary">Stay tuned for updates</div>
          </div>
        </div>
      )}

      <div style={{
  position: 'relative'
}}>
        {/* Header */}
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
          {icon && (
            <div 
              style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
              style={{ 
                backgroundColor: isHovered ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.1)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {icon}
            </div>
          )}
          
          {image && (
            <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
              <img 
                src={image} 
                alt={title} 
                style={{
  width: '100%',
  height: '100%'
}}
              />
            </div>
          )}
          
          <div style={{
  flex: '1'
}}>
            <h3 style={{
  fontWeight: '600'
}}>
              {title}
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Features List */}
        {features.length > 0 && (
          <div className="space-y-2 mb-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
                style={{
                  animation: isHovered ? `fadeInUp 0.3s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                <div style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%'
}} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Indicator */}
        {isClickable && (
          <div 
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '500'
}}
            style={{
              color: isHovered ? '#00D4FF' : 'var(--text-tertiary)',
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
            }}
          >
            <span>Explore</span>
            <span className="text-lg">→</span>
          </div>
        )}

        {/* Hover Glow Effect */}
        {isHovered && (
          <div 
            style={{
  position: 'absolute',
  borderRadius: '12px'
}}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 50%, rgba(0, 82, 255, 0.05) 100%)',
              animation: 'glowPulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>
    </div>
  );
};

// Preset feature configurations
export const FeaturePresets = {
  communities: {
    title: 'Community Forums',
    description: 'Join discussions, share insights, and connect with like-minded crypto enthusiasts.',
    icon: '🏘️',
    features: [
      'Create and join communities',
      'Post discussions and polls',
      'Real-time interactions',
      'Reputation system'
    ],
    status: 'active'
  },
  chat: {
    title: 'Live Chat',
    description: 'Real-time messaging with advanced features for seamless communication.',
    icon: '💬',
    features: [
      'Instant messaging',
      'File sharing',
      'Voice messages',
      'Group chats'
    ],
    status: 'active'
  },
  crypto: {
    title: 'Crypto Trading',
    description: 'Advanced trading tools and portfolio management for crypto enthusiasts.',
    icon: '⚡',
    features: [
      'Portfolio tracking',
      'Real-time prices',
      'Trading signals',
      'DeFi integration'
    ],
    status: 'coming-soon'
  },
  nft: {
    title: 'NFT Marketplace',
    description: 'Buy, sell, and showcase your NFT collection in our integrated marketplace.',
    icon: '🎨',
    features: [
      'Browse collections',
      'Create listings',
      'Auction system',
      'Rarity analysis'
    ],
    status: 'coming-soon'
  },
  gaming: {
    title: 'GameFi Platform',
    description: 'Play-to-earn games with cryptocurrency rewards and NFT integration.',
    icon: '🎮',
    features: [
      'P2E games',
      'Tournament system',
      'NFT rewards',
      'Leaderboards'
    ],
    status: 'beta'
  },
  analytics: {
    title: 'Market Analytics',
    description: 'Comprehensive market data and analysis tools for informed decision making.',
    icon: '📊',
    features: [
      'Real-time charts',
      'Technical indicators',
      'Market sentiment',
      'Price alerts'
    ],
    status: 'beta'
  }
};

// CSS animations (add to your CSS file)
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
`;




export default FeatureCard
