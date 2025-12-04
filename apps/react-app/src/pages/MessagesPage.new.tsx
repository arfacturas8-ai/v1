import React, { useState } from 'react';
import { Search, Edit, CheckCheck, Clock, MoreVertical } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { TabBar } from '../design-system/molecules/TabBar';
import { Avatar } from '../design-system/atoms/Avatar';
import { Text } from '../design-system/atoms/Text';
import { Badge } from '../design-system/atoms/Badge';
import { EmptyState } from '../design-system/molecules/EmptyState';
import { Skeleton } from '../design-system/atoms/Skeleton';
import { colors, spacing, radii, typography, shadows } from '../design-system/tokens';

interface MessagesPageProps {
  onNavigate?: (route: string, params?: any) => void;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participant?: {
    username: string;
    displayName: string;
    avatar?: string;
    isVerified?: boolean;
    isOnline?: boolean;
  };
  groupName?: string;
  groupAvatar?: string;
  lastMessage: {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    read: boolean;
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

// Mock data generator
const generateMockConversation = (id: number, isRequest: boolean = false): Conversation => {
  const isGroup = id % 5 === 0;
  const now = Date.now();
  const timeAgo = id * 3600000;

  return {
    id: `conv-${id}`,
    type: isGroup ? 'group' : 'direct',
    participant: !isGroup
      ? {
          username: `user${id}`,
          displayName: `User ${id}`,
          avatar: `https://i.pravatar.cc/150?u=conv${id}`,
          isVerified: Math.random() > 0.7,
          isOnline: Math.random() > 0.5,
        }
      : undefined,
    groupName: isGroup ? `Group Chat ${id}` : undefined,
    groupAvatar: isGroup ? `https://i.pravatar.cc/150?u=group${id}` : undefined,
    lastMessage: {
      id: `msg-${id}`,
      sender: isGroup ? `Member ${id % 3}` : `user${id}`,
      content: [
        'Hey! How are you doing?',
        'Did you see the latest post?',
        'Thanks for the follow!',
        'Love your recent work!',
        'Can we collaborate?',
        'Check out my new collection',
        'Great to connect with you!',
      ][id % 7],
      timestamp: new Date(now - timeAgo).toISOString(),
      read: isRequest ? false : Math.random() > 0.4,
    },
    unreadCount: isRequest || Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : 0,
    isPinned: !isRequest && Math.random() > 0.8,
    isMuted: Math.random() > 0.9,
  };
};

export const MessagesPage: React.FC<MessagesPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(
    Array.from({ length: 12 }, (_, i) => generateMockConversation(i, false))
  );
  const [requests, setRequests] = useState<Conversation[]>(
    Array.from({ length: 3 }, (_, i) => generateMockConversation(i + 100, true))
  );

  const tabs = [
    { id: 'primary', label: 'Primary', badge: conversations.filter((c) => c.unreadCount > 0).length },
    { id: 'requests', label: 'Requests', badge: requests.length },
  ];

  const displayedConversations = activeTab === 'primary' ? conversations : requests;
  const filteredConversations = searchQuery
    ? displayedConversations.filter((conv) => {
        const name = conv.type === 'group' ? conv.groupName : conv.participant?.displayName;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : displayedConversations;

  const handleConversationClick = (conversation: Conversation) => {
    onNavigate?.(`/messages/${conversation.id}`);
  };

  const handleNewMessage = () => {
    onNavigate?.('/messages/new');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout
      activeTab="messages"
      onTabChange={(tab) => onNavigate?.(`/${tab}`)}
      onSearch={() => onNavigate?.('/search')}
      onNotifications={() => onNavigate?.('/notifications')}
      onWallet={() => onNavigate?.('/wallet')}
    >
      {/* Header Actions */}
      <div
        style={{
          padding: spacing[4],
          borderBottom: `1px solid ${colors.border.default}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        {/* Search Bar */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.tertiary,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: spacing[10],
              paddingRight: spacing[3],
              borderRadius: radii.full,
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              outline: 'none',
              transition: 'all 150ms ease-out',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.brand.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border.default;
            }}
          />
        </div>

        {/* New Message Button */}
        <button
          onClick={handleNewMessage}
          aria-label="New message"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: radii.full,
            border: 'none',
            background: colors.brand.gradient,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: shadows.sm,
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = shadows.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = shadows.sm;
          }}
        >
          <Edit size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: `${spacing[2]} ${spacing[4]}`,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>

      {/* Conversations List */}
      <div>
        {isLoading ? (
          // Loading Skeletons
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.subtle}`,
                  display: 'flex',
                  gap: spacing[3],
                }}
              >
                <Skeleton circle width={56} height={56} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} style={{ marginBottom: spacing[2] }} />
                  <Skeleton width="80%" height={14} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon={<Edit size={64} />}
            title={searchQuery ? 'No messages found' : activeTab === 'primary' ? 'No messages yet' : 'No message requests'}
            description={
              searchQuery
                ? 'Try searching for a different name'
                : activeTab === 'primary'
                ? 'Start a conversation with someone!'
                : 'Message requests from people you don\'t follow will appear here'
            }
            action={
              !searchQuery && activeTab === 'primary'
                ? {
                    label: 'New Message',
                    onClick: handleNewMessage,
                  }
                : undefined
            }
          />
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => handleConversationClick(conversation)}
            />
          ))
        )}
      </div>
    </AppLayout>
  );
};

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isGroup = conversation.type === 'group';
  const name = isGroup ? conversation.groupName : conversation.participant?.displayName;
  const avatar = isGroup ? conversation.groupAvatar : conversation.participant?.avatar;
  const isVerified = !isGroup && conversation.participant?.isVerified;
  const isOnline = !isGroup && conversation.participant?.isOnline;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: spacing[4],
        borderBottom: `1px solid ${colors.border.subtle}`,
        backgroundColor: isHovered ? colors.bg.hover : 'transparent',
        border: 'none',
        borderLeft: conversation.isPinned ? `3px solid ${colors.brand.primary}` : 'none',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        gap: spacing[3],
        alignItems: 'flex-start',
        transition: 'background-color 150ms ease-out',
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <Avatar
          src={avatar}
          alt={name || 'User'}
          size="lg"
          fallback={name?.[0] || '?'}
        />
        {isOnline && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '14px',
              height: '14px',
              borderRadius: radii.full,
              backgroundColor: colors.semantic.success,
              border: `2px solid ${colors.bg.primary}`,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name and Timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[1],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], minWidth: 0 }}>
            <Text
              size="base"
              weight={hasUnread ? 'semibold' : 'regular'}
              truncate
              style={{ color: colors.text.primary }}
            >
              {name}
            </Text>
            {isVerified && <Badge variant="success" size="sm">✓</Badge>}
            {conversation.isMuted && (
              <span style={{ fontSize: typography.fontSize.xs }}>🔇</span>
            )}
          </div>
          <Text size="xs" variant="tertiary">
            {formatTimestamp(conversation.lastMessage.timestamp)}
          </Text>
        </div>

        {/* Last Message */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[2],
          }}
        >
          <Text
            size="sm"
            variant="secondary"
            truncate
            style={{
              fontWeight: hasUnread ? typography.fontWeight.medium : typography.fontWeight.regular,
            }}
          >
            {isGroup && `${conversation.lastMessage.sender}: `}
            {conversation.lastMessage.content}
          </Text>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {/* Read Status */}
            {conversation.lastMessage.read ? (
              <CheckCheck size={14} color={colors.brand.primary} />
            ) : (
              <Clock size={14} color={colors.text.tertiary} />
            )}

            {/* Unread Badge */}
            {hasUnread && (
              <div
                style={{
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: radii.full,
                  backgroundColor: colors.brand.primary,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `0 ${spacing[1]}`,
                }}
              >
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default MessagesPage;
