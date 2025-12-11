import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Settings } from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../design-system/tokens';
import NotificationItem, {
  NotificationType,
  NotificationItemProps,
} from '../components/organisms/NotificationItem';

// Types
type NotificationFilter = 'all' | 'mentions' | 'likes' | 'follows' | 'sales' | 'system';

interface Notification extends Omit<NotificationItemProps, 'onClick' | 'onMarkAsRead' | 'onDismiss'> {
  filter?: NotificationFilter;
}

// Mock notifications data
const generateMockNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'like',
    actors: [
      { id: '1', name: 'CryptoWhale', username: 'cryptowhale', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=whale' },
      { id: '2', name: 'NFTCollector', username: 'nftcollector' },
    ],
    content: 'liked your post',
    timestamp: new Date(Date.now() - 300000),
    isRead: false,
    thumbnail: 'https://picsum.photos/200/200?random=1',
    filter: 'likes',
  },
  {
    id: '2',
    type: 'comment',
    actors: [{ id: '3', name: 'Web3Builder', username: 'web3builder', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=builder' }],
    content: 'commented on your post: "This is amazing! Love the artwork."',
    timestamp: new Date(Date.now() - 1800000),
    isRead: false,
    thumbnail: 'https://picsum.photos/200/200?random=2',
    filter: 'mentions',
  },
  {
    id: '3',
    type: 'follow',
    actors: [{ id: '4', name: 'ArtCollector', username: 'artcollector', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=collector' }],
    content: 'started following you',
    timestamp: new Date(Date.now() - 3600000),
    isRead: false,
    actionText: 'Follow Back',
    filter: 'follows',
  },
  {
    id: '4',
    type: 'mention',
    actors: [{ id: '5', name: 'DegenTrader', username: 'degentrader', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=trader' }],
    content: 'mentioned you in a comment',
    timestamp: new Date(Date.now() - 7200000),
    isRead: true,
    filter: 'mentions',
  },
  {
    id: '5',
    type: 'system',
    actors: [{ id: 'system', name: 'CRYB.AI' }],
    content: 'Your NFT "Cool Art #1234" sold for 2.5 ETH',
    timestamp: new Date(Date.now() - 10800000),
    isRead: false,
    iconColor: colors.semantic.success,
    filter: 'sales',
  },
  {
    id: '6',
    type: 'like',
    actors: [
      { id: '6', name: 'User1', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=user1' },
      { id: '7', name: 'User2' },
      { id: '8', name: 'User3' },
    ],
    content: 'and 12 others liked your post',
    timestamp: new Date(Date.now() - 14400000),
    isRead: true,
    thumbnail: 'https://picsum.photos/200/200?random=3',
    filter: 'likes',
  },
  {
    id: '7',
    type: 'share',
    actors: [{ id: '9', name: 'Influencer', username: 'influencer', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=influencer' }],
    content: 'shared your post',
    timestamp: new Date(Date.now() - 18000000),
    isRead: true,
    filter: 'mentions',
  },
  {
    id: '8',
    type: 'system',
    actors: [{ id: 'system', name: 'CRYB.AI' }],
    content: 'Your account has been verified! You now have a blue checkmark.',
    timestamp: new Date(Date.now() - 86400000),
    isRead: true,
    iconColor: colors.semantic.info,
    filter: 'system',
  },
  {
    id: '9',
    type: 'follow',
    actors: [
      { id: '10', name: 'NewUser1', avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=new1' },
      { id: '11', name: 'NewUser2' },
    ],
    content: 'and 5 others started following you',
    timestamp: new Date(Date.now() - 172800000),
    isRead: true,
    filter: 'follows',
  },
  {
    id: '10',
    type: 'system',
    actors: [{ id: 'system', name: 'CRYB.AI' }],
    content: 'New feature: You can now create polls! Check it out in the create menu.',
    timestamp: new Date(Date.now() - 259200000),
    isRead: true,
    iconColor: colors.brand.primary,
    filter: 'system',
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreNotifications();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const loadNotifications = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setNotifications(generateMockNotifications());
    setIsLoading(false);
  };

  const loadMoreNotifications = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Add more notifications
    const moreNotifications = generateMockNotifications().map((n, i) => ({
      ...n,
      id: `${page}-${i}`,
      timestamp: new Date(Date.now() - (page * 86400000 + i * 3600000)),
      isRead: true,
    }));

    setNotifications((prev) => [...prev, ...moreNotifications]);
    setPage((p) => p + 1);

    // Stop after 3 pages
    if (page >= 3) {
      setHasMore(false);
    }

    setIsLoading(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'share':
        navigate('/post/123');
        break;
      case 'follow':
        if (notification?.actors?.[0]?.username) {
          navigate(`/user/${notification.actors[0].username}`);
        }
        break;
      case 'mention':
        navigate('/post/456');
        break;
      case 'system':
        // System notifications might not have a target
        break;
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification?.type === 'follow' && notification?.actors?.[0]?.id) {
      console.log('Follow back:', notification.actors[0].id);
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'sales', label: 'Sales' },
    { id: 'system', label: 'System' },
  ] as const;

  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications?.filter((n) => n?.filter === activeFilter) || [];

  const unreadCount = notifications?.filter((n) => !n?.isRead)?.length || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[4],
          }}
        >
          <h1
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: spacing[3],
                  padding: `${spacing[1]} ${spacing[3]}`,
                  backgroundColor: colors.brand.primary,
                  borderRadius: radii.full,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                {unreadCount}
              </span>
            )}
          </h1>

          <div style={{ display: 'flex', gap: spacing[2] }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]} ${spacing[3]}`,
                  backgroundColor: colors.bg.elevated,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.elevated;
                }}
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}

            <button
              onClick={() => navigate('/settings/notifications')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.md,
                border: 'none',
                backgroundColor: colors.bg.elevated,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.elevated;
              }}
              aria-label="Notification settings"
            >
              <Settings size={20} color={colors.text.primary} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]} ${spacing[3]}`,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            const count =
              filter.id === 'all'
                ? notifications?.length || 0
                : notifications?.filter((n) => n?.filter === filter.id)?.length || 0;

            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: isActive ? colors.brand.primary : colors.bg.elevated,
                  color: isActive ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                  }
                }}
              >
                {filter.label}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: spacing[2],
                      fontSize: typography.fontSize.xs,
                      opacity: 0.8,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Notifications List */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* Loading - Initial */}
        {isLoading && notifications?.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationItem key={i} id={`loading-${i}`} type="like" actors={[]} content="" timestamp={new Date()} loading />
            ))}
          </div>
        )}

        {/* Notifications */}
        {!isLoading && filteredNotifications?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {filteredNotifications?.map((notification) => (
              <NotificationItem
                key={notification.id}
                {...notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onDismiss={() => handleDismiss(notification.id)}
                onAction={notification.actionText ? () => handleAction(notification) : undefined}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNotifications?.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: radii.full,
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <CheckCheck size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              All caught up!
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {activeFilter === 'all'
                ? "You don't have any notifications yet"
                : `No ${activeFilter} notifications`}
            </p>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && filteredNotifications?.length > 0 && (
          <div ref={observerTarget} style={{ padding: spacing[4], textAlign: 'center' }}>
            {isLoading && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: `3px solid ${colors.bg.elevated}`,
                  borderTopColor: colors.brand.primary,
                  borderRadius: radii.full,
                  margin: '0 auto',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}

        {/* End of List */}
        {!hasMore && filteredNotifications?.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: spacing[6],
              color: colors.text.tertiary,
              fontSize: typography.fontSize.sm,
            }}
          >
            You've reached the end
          </div>
        )}
      </div>
    </div>
  );
}
