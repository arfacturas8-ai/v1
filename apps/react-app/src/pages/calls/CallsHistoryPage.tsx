import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Video,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  X,
  Clock,
  MoreVertical,
  Trash2,
  Info,
} from 'lucide-react';
import { Avatar } from '../../design-system/atoms/Avatar';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type CallType = 'voice' | 'video';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';
export type CallFilter = 'all' | 'missed' | 'incoming' | 'outgoing';

export interface CallHistoryItem {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  type: CallType;
  direction: CallDirection;
  timestamp: Date;
  duration?: number; // in seconds
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
}

const CallsHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<CallFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  // Mock data - replace with real data from API/WebRTC service
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([
    {
      id: '1',
      user: {
        id: 'u1',
        username: 'alice',
        displayName: 'Alice Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice',
      },
      type: 'video',
      direction: 'incoming',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 1825,
      quality: 'excellent',
    },
    {
      id: '2',
      user: {
        id: 'u2',
        username: 'bob',
        displayName: 'Bob Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob',
      },
      type: 'voice',
      direction: 'outgoing',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      duration: 542,
      quality: 'good',
    },
    {
      id: '3',
      user: {
        id: 'u3',
        username: 'charlie',
        displayName: 'Charlie Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=charlie',
      },
      type: 'video',
      direction: 'missed',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      user: {
        id: 'u4',
        username: 'diana',
        displayName: 'Diana Prince',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=diana',
      },
      type: 'voice',
      direction: 'incoming',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      duration: 1234,
      quality: 'fair',
    },
    {
      id: '5',
      user: {
        id: 'u5',
        username: 'ethan',
        displayName: 'Ethan Hunt',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=ethan',
      },
      type: 'video',
      direction: 'missed',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getCallIcon = (type: CallType, direction: CallDirection) => {
    if (direction === 'missed') {
      return <PhoneMissed size={18} />;
    }
    if (direction === 'incoming') {
      return <PhoneIncoming size={18} />;
    }
    if (direction === 'outgoing') {
      return <PhoneOutgoing size={18} />;
    }
    return type === 'video' ? <Video size={18} /> : <Phone size={18} />;
  };

  const getCallColor = (direction: CallDirection): string => {
    switch (direction) {
      case 'missed':
        return colors.semantic.error;
      case 'incoming':
        return colors.semantic.success;
      case 'outgoing':
        return colors.text.secondary;
      default:
        return colors.text.tertiary;
    }
  };

  const handleCallBack = (call: CallHistoryItem) => {
    navigate(`/calls/active/${call.id}`, {
      state: {
        user: call.user,
        type: call.type,
        direction: 'outgoing',
        isCallback: true,
      },
    });
  };

  const handleDeleteCall = (callId: string) => {
    setCallHistory((prev) => prev.filter((call) => call.id !== callId));
    setSelectedCall(null);
  };

  const handleViewDetails = (call: CallHistoryItem) => {
    navigate(`/calls/details/${call.id}`, { state: { call } });
  };

  const filteredCalls = callHistory
    .filter((call) => {
      if (activeFilter !== 'all' && call.direction !== activeFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          call.user.displayName.toLowerCase().includes(query) ||
          call.user.username.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filterButtons: { key: CallFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: callHistory.length },
    {
      key: 'missed',
      label: 'Missed',
      count: callHistory.filter((c) => c.direction === 'missed').length,
    },
    {
      key: 'incoming',
      label: 'Incoming',
      count: callHistory.filter((c) => c.direction === 'incoming').length,
    },
    {
      key: 'outgoing',
      label: 'Outgoing',
      count: callHistory.filter((c) => c.direction === 'outgoing').length,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        color: colors.text.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: spacing[4],
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[4],
            }}
          >
            <h1
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                margin: 0,
              }}
            >
              Calls
            </h1>
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.secondary,
                cursor: 'pointer',
                padding: spacing[2],
                display: 'flex',
                alignItems: 'center',
                borderRadius: radii.md,
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              {showSearch ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div style={{ marginBottom: spacing[4] }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: spacing[3],
                    color: colors.text.tertiary,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} 44px`,
                    backgroundColor: colors.bg.secondary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radii.lg,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    outline: 'none',
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: spacing[3],
                      background: 'none',
                      border: 'none',
                      color: colors.text.tertiary,
                      cursor: 'pointer',
                      padding: spacing[1],
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              overflowX: 'auto',
              paddingBottom: spacing[2],
            }}
          >
            {filterButtons.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  backgroundColor:
                    activeFilter === filter.key ? colors.brand.primary : colors.bg.secondary,
                  color: activeFilter === filter.key ? '#FFFFFF' : colors.text.secondary,
                  border: 'none',
                  borderRadius: radii.full,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter.key) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter.key) {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }
                }}
              >
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span
                    style={{
                      backgroundColor:
                        activeFilter === filter.key
                          ? 'rgba(255, 255, 255, 0.2)'
                          : colors.bg.elevated,
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: radii.full,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                      minWidth: '20px',
                      textAlign: 'center',
                    }}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Call History List */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: spacing[4],
        }}
      >
        {filteredCalls.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing[12]} ${spacing[4]}`,
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                marginBottom: spacing[4],
                borderRadius: radii.full,
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeFilter === 'missed' ? (
                <PhoneMissed size={40} color={colors.text.tertiary} />
              ) : (
                <Phone size={40} color={colors.text.tertiary} />
              )}
            </div>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[2],
                color: colors.text.primary,
              }}
            >
              {searchQuery
                ? 'No calls found'
                : activeFilter === 'all'
                ? 'No calls yet'
                : `No ${activeFilter} calls`}
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                marginBottom: spacing[5],
              }}
            >
              {searchQuery
                ? 'Try searching for something else'
                : 'Start a voice or video call from any conversation'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/messages')}
                style={{
                  padding: `${spacing[3]} ${spacing[6]}`,
                  backgroundColor: colors.brand.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: radii.lg,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.hover;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Go to Messages
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              backgroundColor: colors.border.subtle,
              borderRadius: radii.xl,
              overflow: 'hidden',
            }}
          >
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[4],
                  padding: spacing[4],
                  backgroundColor: colors.bg.secondary,
                  position: 'relative',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.secondary;
                }}
              >
                {/* Avatar */}
                <Avatar
                  src={call.user.avatar}
                  alt={call.user.displayName}
                  name={call.user.displayName}
                  size="lg"
                  onClick={() => navigate(`/profile/${call.user.username}`)}
                />

                {/* Call Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {call.user.displayName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: getCallColor(call.direction),
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {getCallIcon(call.type, call.direction)}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                      }}
                    >
                      {call.type === 'video' ? 'Video' : 'Voice'}
                    </span>
                    {call.duration && (
                      <>
                        <span style={{ color: colors.text.tertiary }}>•</span>
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[1],
                          }}
                        >
                          <Clock size={14} />
                          {formatDuration(call.duration)}
                        </span>
                      </>
                    )}
                    <span style={{ color: colors.text.tertiary }}>•</span>
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                      }}
                    >
                      {formatTimestamp(call.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallBack(call);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.semantic.success,
                      cursor: 'pointer',
                      padding: spacing[2],
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: radii.md,
                      transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Call back"
                  >
                    {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCall(selectedCall === call.id ? null : call.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text.secondary,
                        cursor: 'pointer',
                        padding: spacing[2],
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: radii.md,
                        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                        e.currentTarget.style.color = colors.text.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.text.secondary;
                      }}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {/* Context Menu */}
                    {selectedCall === call.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: spacing[1],
                          backgroundColor: colors.bg.elevated,
                          border: `1px solid ${colors.border.default}`,
                          borderRadius: radii.lg,
                          overflow: 'hidden',
                          zIndex: 100,
                          minWidth: '160px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(call);
                          }}
                          style={{
                            width: '100%',
                            padding: `${spacing[3]} ${spacing[4]}`,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: colors.text.primary,
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: typography.fontSize.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.bg.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Info size={16} />
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCall(call.id);
                          }}
                          style={{
                            width: '100%',
                            padding: `${spacing[3]} ${spacing[4]}`,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: colors.semantic.error,
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: typography.fontSize.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.bg.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsHistoryPage;
