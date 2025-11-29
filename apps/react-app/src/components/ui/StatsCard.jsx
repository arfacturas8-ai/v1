import React, { useState, useEffect } from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend, 
  trendValue,
  color = '#00D4FF',
  format = 'number',
  className = '' 
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Format the value based on type
  const formatValue = (val, formatType) => {
    switch (formatType) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      case 'compact':
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString();
      default:
        return val.toLocaleString();
    }
  };

  // Animate counter
  useEffect(() => {
    let animationFrame;
    const targetValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    
    if (isVisible && targetValue > 0) {
      const startValue = 0;
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      
      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
        
        setAnimatedValue(currentValue);
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, isVisible]);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getTrendColor = () => {
    if (!trend) return 'var(--text-tertiary)';
    return trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-tertiary)';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↙';
    return '→';
  };

  return (
    <div className={`card depth-enhanced hover-lift ${className}`}>
      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          {icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${color}20`,
                color
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h3 style={{
  fontWeight: '500'
}}>
              {title}
            </h3>
          </div>
        </div>
        
        {trend && trendValue && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
            <span style={{ color: getTrendColor() }}>
              {getTrendIcon()}
            </span>
            <span style={{ color: getTrendColor(), fontWeight: '500' }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div
          style={{ fontWeight: 'bold', color }}
        >
          {formatValue(animatedValue, format)}
        </div>
        {subtitle && (
          <p className="text-sm text-tertiary">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Progress bar for visual enhancement */}
      <div className="mt-4">
        <div style={{
          width: '100%',
          borderRadius: '50%',
          height: '4px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              height: '4px',
              borderRadius: '50%',
              backgroundColor: color,
              width: isVisible ? '100%' : '0%',
              boxShadow: `0 0 8px ${color}40`
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Preset configurations for common stats
export const StatsPresets = {
  users: {
    title: 'Active Users',
    icon: '👥',
    color: '#00D4FF',
    format: 'compact',
    subtitle: 'Online now'
  },
  volume: {
    title: 'Trading Volume',
    icon: '💰',
    color: '#00FF90',
    format: 'currency',
    subtitle: '24h volume'
  },
  growth: {
    title: 'Growth Rate',
    icon: '📈',
    color: '#0052FF',
    format: 'percentage',
    subtitle: 'Month over month'
  },
  communities: {
    title: 'Communities',
    icon: '🏘️',
    color: '#00D4FF',
    format: 'number',
    subtitle: 'Active communities'
  },
  messages: {
    title: 'Messages',
    icon: '💬',
    color: '#00FF90',
    format: 'compact',
    subtitle: 'Sent today'
  },
  trades: {
    title: 'Trades',
    icon: '⚡',
    color: '#0052FF',
    format: 'number',
    subtitle: 'Completed today'
  }
};




export default StatsCard
