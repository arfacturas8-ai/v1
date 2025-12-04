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
    // Mock data - replace with real data
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
    if (direction === 'missed') return <PhoneMissed size={18} />;
    if (direction === 'incoming') return <PhoneIncoming size={18} />;
    if (direction === 'outgoing') return <PhoneOutgoing size={18} />;
    return type === 'video' ? <Video size={18} /> : <Phone size={18} />;
  };

  const getCallColor = (direction: string) => {
    if (direction === 'missed') return '#FF3B3B';
    if (direction === 'incoming') return '#00D26A';
    return '#A0A0A0';
  };

  const handleCallBack = (call: CallHistoryItem) => {
    // Navigate to active call screen
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
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#FFFFFF' }}>
          Call History
        </h1>
        <EmptyState
          icon={<Phone size={64} />}
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
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#FFFFFF' }}>
        Call History
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: '#2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
        {callHistory.map((call) => (
          <div
            key={call.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#141414',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A1A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#141414';
            }}
          >
            <Avatar
              src={call.user.avatar}
              alt={call.user.displayName}
              size="md"
              fallback={call.user.displayName[0]}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>
                {call.user.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: getCallColor(call.direction), display: 'flex', alignItems: 'center' }}>
                  {getCallIcon(call.type, call.direction)}
                </span>
                <span style={{ fontSize: '13px', color: '#A0A0A0' }}>
                  {call.type === 'video' ? 'Video' : 'Voice'}
                </span>
                {call.duration && (
                  <>
                    <span style={{ color: '#666666' }}>•</span>
                    <span style={{ fontSize: '13px', color: '#A0A0A0' }}>
                      {formatDuration(call.duration)}
                    </span>
                  </>
                )}
                <span style={{ color: '#666666' }}>•</span>
                <span style={{ fontSize: '13px', color: '#A0A0A0' }}>
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
                background: 'none',
                border: 'none',
                color: '#00D26A',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2A2A2A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
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
