import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Eye, Heart, MessageCircle, Repeat, Calendar } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface StatCard {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

const mockStats: StatCard[] = [
  {
    id: 'followers',
    label: 'Followers',
    value: '12.5K',
    change: 12.5,
    icon: <Users size={24} />,
    color: colors.brand.primary,
  },
  {
    id: 'views',
    label: 'Profile views',
    value: '45.2K',
    change: 8.3,
    icon: <Eye size={24} />,
    color: colors.semantic.info,
  },
  {
    id: 'likes',
    label: 'Total likes',
    value: '89.1K',
    change: 15.7,
    icon: <Heart size={24} />,
    color: colors.semantic.error,
  },
  {
    id: 'engagement',
    label: 'Engagement rate',
    value: '6.8%',
    change: -2.1,
    icon: <TrendingUp size={24} />,
    color: colors.semantic.success,
  },
];

const mockChartData: ChartDataPoint[] = [
  { date: '2024-01-01', value: 120 },
  { date: '2024-01-02', value: 150 },
  { date: '2024-01-03', value: 135 },
  { date: '2024-01-04', value: 180 },
  { date: '2024-01-05', value: 165 },
  { date: '2024-01-06', value: 200 },
  { date: '2024-01-07', value: 220 },
  { date: '2024-01-08', value: 195 },
  { date: '2024-01-09', value: 240 },
  { date: '2024-01-10', value: 225 },
  { date: '2024-01-11', value: 260 },
  { date: '2024-01-12', value: 245 },
  { date: '2024-01-13', value: 280 },
  { date: '2024-01-14', value: 270 },
  { date: '2024-01-15', value: 300 },
];

interface TopPost {
  id: string;
  content: string;
  likes: number;
  reposts: number;
  comments: number;
  views: number;
  timestamp: string;
}

const mockTopPosts: TopPost[] = [
  {
    id: '1',
    content: 'Just launched our new feature! Check it out and let me know what you think. This is going to change everything! 🚀',
    likes: 1234,
    reposts: 567,
    comments: 89,
    views: 12500,
    timestamp: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    content: 'Interesting thoughts on the future of decentralized social media and how it will impact content creation.',
    likes: 892,
    reposts: 234,
    comments: 45,
    views: 8900,
    timestamp: '2024-01-13T14:30:00Z',
  },
  {
    id: '3',
    content: 'Great meeting with the team today! Excited about what we\'re building.',
    likes: 654,
    reposts: 123,
    comments: 34,
    views: 6200,
    timestamp: '2024-01-11T16:00:00Z',
  },
];

export default function StatsPage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const timeRanges = [
    { value: '7d' as const, label: '7 days' },
    { value: '30d' as const, label: '30 days' },
    { value: '90d' as const, label: '90 days' },
    { value: 'all' as const, label: 'All time' },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maxValue = Math.max(...mockChartData.map((d) => d.value));

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
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              {username ? `@${username}'s stats` : 'Your stats'}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              Performance analytics
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[4] }}>
        {/* Time range selector */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            marginBottom: spacing[4],
            overflowX: 'auto',
            padding: spacing[2],
            backgroundColor: colors.bg.secondary,
            borderRadius: '12px',
          }}
        >
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: timeRange === range.value ? colors.brand.primary : 'transparent',
                color: timeRange === range.value ? 'white' : colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing[4],
            marginBottom: spacing[4],
          }}
        >
          {mockStats.map((stat) => (
            <div
              key={stat.id}
              style={{
                padding: spacing[4],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: stat.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary,
                      marginBottom: spacing[1],
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <div
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    backgroundColor: stat.change >= 0 ? colors.semantic.success + '10' : colors.semantic.error + '10',
                    borderRadius: '6px',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: stat.change >= 0 ? colors.semantic.success : colors.semantic.error,
                  }}
                >
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </div>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  vs previous period
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '12px',
            marginBottom: spacing[4],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[4] }}>
            <Calendar size={20} color={colors.text.tertiary} />
            <h2
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Follower growth
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[2], height: '200px' }}>
            {mockChartData.map((point, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${(point.value / maxValue) * 100}%`,
                    backgroundColor: colors.brand.primary,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 150ms ease-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.brand.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.brand.primary;
                  }}
                  title={`${point.date}: ${point.value}`}
                />
                {index % 3 === 0 && (
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                    {new Date(point.date).getDate()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top posts */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '12px',
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[4],
            }}
          >
            Top posts
          </h2>

          {mockTopPosts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              style={{
                padding: spacing[4],
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                marginBottom: index < mockTopPosts.length - 1 ? spacing[3] : 0,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  lineHeight: typography.lineHeight.relaxed,
                  marginBottom: spacing[3],
                }}
              >
                {post.content}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: spacing[3],
                  paddingTop: spacing[3],
                  borderTop: `1px solid ${colors.border.default}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Eye size={16} color={colors.text.tertiary} />
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {formatNumber(post.views)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Heart size={16} color={colors.text.tertiary} />
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {formatNumber(post.likes)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Repeat size={16} color={colors.text.tertiary} />
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {formatNumber(post.reposts)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <MessageCircle size={16} color={colors.text.tertiary} />
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {formatNumber(post.comments)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: spacing[2] }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  {formatTimestamp(post.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
