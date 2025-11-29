import React, { useState, useEffect } from 'react';

const LiveTicker = ({ className = '', speed = 30 }) => {
  const [tickerItems, setTickerItems] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  // Mock crypto prices and platform stats
  const generateTickerData = () => [
    { type: 'price', symbol: 'BTC', value: 45250.30, change: '+2.5%', trend: 'up' },
    { type: 'price', symbol: 'ETH', value: 3120.45, change: '+1.8%', trend: 'up' },
    { type: 'price', symbol: 'SOL', value: 98.76, change: '-0.3%', trend: 'down' },
    { type: 'price', symbol: 'ADA', value: 0.52, change: '+4.2%', trend: 'up' },
    { type: 'stat', label: 'Active Users', value: '12.5K', icon: '👥' },
    { type: 'stat', label: 'Messages Today', value: '2.1M', icon: '💬' },
    { type: 'price', symbol: 'MATIC', value: 1.23, change: '+3.1%', trend: 'up' },
    { type: 'stat', label: 'Communities', value: '450+', icon: '🏘️' },
    { type: 'price', symbol: 'DOT', value: 7.89, change: '-1.2%', trend: 'down' },
    { type: 'stat', label: 'Trades', value: '15.8K', icon: '⚡' },
    { type: 'price', symbol: 'AVAX', value: 23.45, change: '+5.7%', trend: 'up' },
    { type: 'stat', label: 'Volume 24h', value: '$2.3M', icon: '💰' }
  ];

  // Initialize ticker data
  useEffect(() => {
    setTickerItems(generateTickerData());
  }, []);

  // Update prices periodically
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setTickerItems(prevItems => 
          prevItems.map(item => {
            if (item.type === 'price') {
              // Simulate price fluctuations
              const changePercent = (Math.random() - 0.5) * 0.2; // ±0.1%
              const newValue = item.value * (1 + changePercent / 100);
              const changeValue = ((newValue - item.value) / item.value * 100).toFixed(1);
              
              return {
                ...item,
                value: parseFloat(newValue.toFixed(2)),
                change: `${changeValue >= 0 ? '+' : ''}${changeValue}%`,
                trend: changeValue >= 0 ? 'up' : 'down'
              };
            }
            return item;
          })
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const formatPrice = (value) => {
    if (value >= 1000) return `$${value.toLocaleString()}`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? '#00FF90' : trend === 'down' ? '#FF4444' : '#00D4FF';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? '↗' : trend === 'down' ? '↙' : '→';
  };

  return (
    <div style={{
  position: 'relative',
  overflow: 'hidden'
}}>
      {/* Gradient masks for smooth fade */}
      <div style={{
  position: 'absolute',
  width: '80px'
}} />
      <div style={{
  position: 'absolute',
  width: '80px'
}} />
      
      <div 
        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '32px'
}}
        style={{
          animation: isPaused ? 'none' : `scroll ${speed}s linear infinite`,
          paddingLeft: '100%'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Duplicate items for seamless loop */}
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <div 
            key={`${item.symbol || item.label}-${index}`}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
          >
            {item.type === 'price' ? (
              <>
                <span style={{
  fontWeight: '600'
}}>
                  {item.symbol}
                </span>
                <span style={{
  fontWeight: '500'
}}>
                  {formatPrice(item.value)}
                </span>
                <span 
                  style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}
                  style={{ color: getTrendColor(item.trend) }}
                >
                  <span>{getTrendIcon(item.trend)}</span>
                  {item.change}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-secondary">
                  {item.label}:
                </span>
                <span style={{
  fontWeight: '600'
}}>
                  {item.value}
                </span>
              </>
            )}
            
            {/* Hover glow effect */}
            <div style={{
  position: 'absolute',
  borderRadius: '12px'
}} />
          </div>
        ))}
      </div>
      
      {/* Live indicator */}
      <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
        <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
        <span style={{
  fontWeight: '500'
}}>
          Live
        </span>
      </div>
    </div>
  );
};

// Add CSS animation
const tickerStyles = `
@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
`;

// Inject styles (this would be better in your main CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = tickerStyles;
  document.head.appendChild(styleSheet);
}




export default LiveTicker
