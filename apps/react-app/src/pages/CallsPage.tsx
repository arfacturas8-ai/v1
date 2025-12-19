/**
 * CallsPage - Call history and management
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { Avatar } from '../design-system/atoms/Avatar';
import { EmptyState } from '../design-system/molecules/EmptyState';

interface CallHistoryItem {
  id: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: Date;
  duration?: number;
}

export default function CallsPage() {
  const navigate = useNavigate();
  const [callHistory] = useState<CallHistoryItem[]>([
    {
      id: '1',
      user: {
        username: 'alice',
        displayName: 'Alice Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice',
      },
      type: 'video',
      direction: 'incoming',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 1825,
    },
    {
      id: '2',
      user: {
        username: 'bob',
        displayName: 'Bob Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob',
      },
      type: 'voice',
      direction: 'outgoing',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      duration: 542,
    },
    {
      id: '3',
      user: {
        username: 'charlie',
        displayName: 'Charlie Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=charlie',
      },
      type: 'video',
      direction: 'missed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCallIcon = (type: string, direction: string) => {
    if (direction === 'missed') return <PhoneMissed size={20} />;
    if (direction === 'incoming') return <PhoneIncoming size={20} />;
    if (direction === 'outgoing') return <PhoneOutgoing size={20} />;
    return type === 'video' ? <Video size={20} /> : <Phone size={20} />;
  };

  const getCallColor = (direction: string) => {
    if (direction === 'missed') return '#FF3B3B';
    if (direction === 'incoming') return '#00D26A';
    return '#666';
  };

  const handleCallBack = (call: CallHistoryItem) => {
    navigate(`/calls/${call.id}`, {
      state: {
        user: call.user,
        type: call.type,
        direction: 'outgoing',
      },
    });
  };

  if (callHistory.length === 0) {
    return (
      <div style={{ padding: '24px', minHeight: '100vh', background: '#FAFAFA' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#000' }}>
          Call History
        </h1>
        <EmptyState
          icon={<Phone size={48} />}
          title="No calls yet"
          description="Start a voice or video call from any conversation"
          action={{
            label: 'Go to Messages',
            onClick: () => navigate('/messages'),
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#FAFAFA'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#000' }}>
        Call History
      </h1>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {callHistory.map((call) => (
          <div
            key={call.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Avatar
              src={call.user.avatar}
              alt={call.user.displayName}
              size="md"
              fallback={call.user.displayName[0]}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                {call.user.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: getCallColor(call.direction), display: 'flex', alignItems: 'center' }}>
                  {getCallIcon(call.type, call.direction)}
                </span>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {call.type === 'video' ? 'Video' : 'Voice'}
                </span>
                {call.duration && (
                  <>
                    <span style={{ color: '#666' }}>•</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      {formatDuration(call.duration)}
                    </span>
                  </>
                )}
                <span style={{ color: '#666' }}>•</span>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {formatTimestamp(call.timestamp)}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCallBack(call);
              }}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '12px',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
