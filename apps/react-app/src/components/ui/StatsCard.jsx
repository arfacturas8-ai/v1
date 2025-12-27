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
    if (!trend) return '#999999';
    return trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#999999';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↙';
    return '→';
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAED',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      className={className}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
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
              fontWeight: '600',
              fontSize: '15px',
              color: '#1A1A1A',
              margin: 0
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
            <span style={{ color: getTrendColor(), fontWeight: '600', fontSize: '14px' }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontWeight: '700',
            fontSize: '28px',
            color,
            marginBottom: '4px'
          }}
        >
          {formatValue(animatedValue, format)}
        </div>
        {subtitle && (
          <p style={{
            fontSize: '13px',
            color: '#666666',
            margin: 0
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Progress bar for visual enhancement */}
      <div style={{ marginTop: '16px' }}>
        <div style={{
          width: '100%',
          borderRadius: '9999px',
          height: '4px',
          overflow: 'hidden',
          background: '#F0F2F5'
        }}>
          <div
            style={{
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: color,
              width: isVisible ? '100%' : '0%',
              boxShadow: `0 0 8px ${color}40`,
              transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)'
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
