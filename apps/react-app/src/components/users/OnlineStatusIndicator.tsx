/**
 * Online Status Indicator Component
 * Shows real-time online/offline status for users
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnlineStatus } from '../../hooks/useWebSocket';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showOffline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  userId,
  size = 'medium',
  showOffline = false,
  className,
  style,
}) => {
  const [isOnline, setIsOnline] = React.useState(false);

  // Listen to online/offline events via WebSocket
  useOnlineStatus(userId, (online) => {
    setIsOnline(online);
  });

  // Get online status from cache
  const { data: onlineUsers } = useQuery<Set<string>>({
    queryKey: ['users', 'online'],
    initialData: new Set(),
    staleTime: Infinity,
  });

  const online = onlineUsers.has(userId) || isOnline;

  // Don't show indicator if user is offline and showOffline is false
  if (!online && !showOffline) return null;

  const sizeMap = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const dotSize = sizeMap[size];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: dotSize,
        height: dotSize,
        ...style,
      }}
      title={online ? 'Online' : 'Offline'}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: online ? '#00D26A' : '#6E7681',
          border: '2px solid #FAFAFA',
          boxShadow: online ? '0 0 8px rgba(0, 210, 106, 0.5)' : 'none',
          transition: 'all 0.3s ease',
        }}
      />
      {online && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-primary)',
            opacity: 0.5,
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Online Status Badge (for avatars)
 */
interface OnlineStatusBadgeProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showOffline?: boolean;
}

export const OnlineStatusBadge: React.FC<OnlineStatusBadgeProps> = ({
  userId,
  size = 'medium',
  showOffline = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        transform: 'translate(25%, 25%)',
      }}
    >
      <OnlineStatusIndicator userId={userId} size={size} showOffline={showOffline} />
    </div>
  );
};

/**
 * Online Status Text
 */
interface OnlineStatusTextProps {
  userId: string;
  lastSeen?: string;
}

export const OnlineStatusText: React.FC<OnlineStatusTextProps> = ({ userId, lastSeen }) => {
  const [isOnline, setIsOnline] = React.useState(false);

  useOnlineStatus(userId, (online) => {
    setIsOnline(online);
  });

  const { data: onlineUsers } = useQuery<Set<string>>({
    queryKey: ['users', 'online'],
    initialData: new Set(),
    staleTime: Infinity,
  });

  const online = onlineUsers.has(userId) || isOnline;

  if (online) {
    return (
      <span
        style={{
          color: '#00D26A',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Online
      </span>
    );
  }

  if (lastSeen) {
    return (
      <span
        style={{
          color: '#8B949E',
          fontSize: '14px',
        }}
      >
        Last seen {formatLastSeen(lastSeen)}
      </span>
    );
  }

  return (
    <span
      style={{
        color: '#8B949E',
        fontSize: '14px',
      }}
    >
      Offline
    </span>
  );
};

/**
 * Format last seen time
 */
const formatLastSeen = (lastSeen: string): string => {
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

export default OnlineStatusIndicator;
