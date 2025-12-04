/**
 * Notification Badge Component
 * Shows unread notification count with real-time updates
 */

import React from 'react';
import { useUnreadNotificationsCountQuery } from '../../hooks/api/useNotifications';

interface NotificationBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className, style }) => {
  const { data } = useUnreadNotificationsCountQuery();
  const count = data?.count || 0;

  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        backgroundColor: '#FF3B3B',
        color: 'white',
        borderRadius: '10px',
        minWidth: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '0 6px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        ...style,
      }}
    >
      {displayCount}
    </div>
  );
};

export default NotificationBadge;
