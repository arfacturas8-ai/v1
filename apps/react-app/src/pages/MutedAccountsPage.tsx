import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, VolumeX } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface MutedAccount {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  mutedAt: string;
}

const mockMutedAccounts: MutedAccount[] = [
  {
    id: '1',
    username: 'spammer123',
    displayName: 'Spam Account',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=spammer123',
    bio: 'Promoting various products and services',
    isVerified: false,
    mutedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    username: 'annoying_bot',
    displayName: 'Annoying Bot',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=annoying_bot',
    bio: 'Automated posting bot',
    isVerified: false,
    mutedAt: '2024-01-08T14:30:00Z',
  },
  {
    id: '3',
    username: 'overposting',
    displayName: 'Over Poster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=overposting',
    bio: 'Posts too frequently',
    isVerified: false,
    mutedAt: '2024-01-05T09:15:00Z',
  },
];

export default function MutedAccountsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mutedAccounts, setMutedAccounts] = useState<MutedAccount[]>(mockMutedAccounts);

  const filteredAccounts = mutedAccounts.filter(
    (account) =>
      account.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnmute = (accountId: string) => {
    setMutedAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
              Muted accounts
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {mutedAccounts.length} {mutedAccounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={20}
              color={colors.text.tertiary}
              style={{
                position: 'absolute',
                left: spacing[3],
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search muted accounts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '24px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map((account) => (
            <div
              key={account.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
              }}
            >
              {/* Avatar */}
              <img
                src={account.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${account.username}`}
                alt={account.displayName}
                onClick={() => navigate(`/user/${account.username}`)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  cursor: 'pointer',
                  opacity: 0.5,
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    onClick={() => navigate(`/user/${account.username}`)}
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {account.displayName}
                  </span>
                  {account.isVerified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: `0 ${spacing[1]}`,
                        backgroundColor: colors.semantic.success,
                        borderRadius: '2px',
                        fontSize: typography.fontSize.xs,
                        color: 'white',
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  @{account.username}
                </div>
                {account.bio && (
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      margin: 0,
                      marginBottom: spacing[2],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {account.bio}
                  </p>
                )}
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Muted on {formatDate(account.mutedAt)}
                </div>
              </div>

              {/* Unmute button */}
              <button
                onClick={() => handleUnmute(account.id)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: colors.brand.primary,
                  color: 'white',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  flexShrink: 0,
                  height: 'fit-content',
                }}
              >
                Unmute
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <VolumeX size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {searchQuery ? 'No accounts found' : 'No muted accounts'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No muted accounts match "${searchQuery}"`
                : "When you mute accounts, they'll show up here. Muting prevents their posts from appearing in your timeline."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
