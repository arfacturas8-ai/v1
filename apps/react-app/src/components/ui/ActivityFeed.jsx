import React, { useState, useEffect } from 'react';

const ActivityFeed = ({ className = '' }) => {
  const [activities, setActivities] = useState([]);

  // Sample activity types with modern styling
  const activityTypes = [
    { type: 'join', emoji: '🎉', color: '#00FF90', text: 'joined the platform' },
    { type: 'post', emoji: '📝', color: '#00D4FF', text: 'created a new post' },
    { type: 'comment', emoji: '💬', color: '#0052FF', text: 'left a comment' },
    { type: 'trade', emoji: '⚡', color: '#00FF90', text: 'made a trade' },
    { type: 'win', emoji: '🏆', color: '#00FF90', text: 'won a game' },
    { type: 'level', emoji: '⭐', color: '#00D4FF', text: 'leveled up' },
    { type: 'achievement', emoji: '🎖️', color: '#0052FF', text: 'earned an achievement' }
  ];

  // Mock users
  const users = [
    'CryptoKing', 'DiamondHands', 'MoonRider', 'BlockChainBoss', 'NFTCollector',
    'CoinMaster', 'TradeWizard', 'CryptoNinja', 'TokenHunter', 'DeFiGuru',
    'GameFiPro', 'MetaTrader', 'CryptoSage', 'DigitalNomad', 'BlockExplorer'
  ];

  const generateRandomActivity = () => {
    const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const timeAgo = Math.floor(Math.random() * 30) + 1; // 1-30 minutes ago

    return {
      id: Date.now() + Math.random(),
      user,
      ...activity,
      timeAgo: `${timeAgo}m ago`,
      timestamp: Date.now()
    };
  };

  // Initialize with some activities
  useEffect(() => {
    const initialActivities = Array.from({ length: 8 }, () => generateRandomActivity());
    setActivities(initialActivities.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  // Add new activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = generateRandomActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 7)]); // Keep only 8 most recent
    }, 3000 + Math.random() * 2000); // Random interval 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`card depth-enhanced ${className}`}>
      <div className="card-header">
        <h3 style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
          Live Activity
        </h3>
        <p className="card-description">See what's happening in real-time</p>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderRadius: '12px'
}}
            style={{
              animation: index === 0 ? 'slideUp 0.5s ease-out' : 'none'
            }}
          >
            <div 
              style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
              style={{ backgroundColor: `${activity.color}20`, color: activity.color }}
            >
              {activity.emoji}
            </div>
            
            <div style={{
  flex: '1'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <span style={{
  fontWeight: '600'
}}>
                  {activity.user}
                </span>
                <span className="text-secondary text-sm">
                  {activity.text}
                </span>
              </div>
              <div className="text-xs text-tertiary">
                {activity.timeAgo}
              </div>
            </div>
            
            <div 
              style={{
  width: '4px',
  height: '32px',
  borderRadius: '50%'
}}
              style={{ backgroundColor: activity.color }}
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-secondary">
        <button style={{
  width: '100%'
}}>
          View All Activity
        </button>
      </div>
    </div>
  );
};




export default ActivityFeed
