import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ban } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface BlockedAccount {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  blockedAt: string;
}

const mockBlockedAccounts: BlockedAccount[] = [
  {
    id: '1',
    username: 'harasser',
    displayName: 'Harasser Account',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=harasser',
    bio: 'Sending unwanted messages',
    isVerified: false,
    blockedAt: '2024-01-12T10:00:00Z',
  },
  {
    id: '2',
    username: 'scammer2024',
    displayName: 'Scam Account',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=scammer2024',
    bio: 'Trying to steal crypto',
    isVerified: false,
    blockedAt: '2024-01-09T14:30:00Z',
  },
];

export default function BlockedAccountsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedAccounts, setBlockedAccounts] = useState<BlockedAccount[]>(mockBlockedAccounts);

  const filteredAccounts = blockedAccounts.filter(
    (account) =>
      account.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnblock = (accountId: string) => {
    setBlockedAccounts((prev) => prev.filter((a) => a.id !== accountId));
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
              Blocked accounts
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {blockedAccounts.length} {blockedAccounts.length === 1 ? 'account' : 'accounts'}
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
              placeholder="Search blocked accounts"
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

        {/* Info banner */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Blocked accounts cannot follow you, see your posts, or message you. They won't be notified that you've blocked them.
          </p>
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
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <img
                  src={account.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${account.username}`}
                  alt={account.displayName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: colors.semantic.error + '30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ban size={20} color={colors.semantic.error} />
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
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
                  Blocked on {formatDate(account.blockedAt)}
                </div>
              </div>

              {/* Unblock button */}
              <button
                onClick={() => handleUnblock(account.id)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: '24px',
                  border: `1px solid ${colors.semantic.error}`,
                  backgroundColor: 'transparent',
                  color: colors.semantic.error,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  flexShrink: 0,
                  height: 'fit-content',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.semantic.error;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.semantic.error;
                }}
              >
                Unblock
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
              <Ban size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {searchQuery ? 'No accounts found' : 'No blocked accounts'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No blocked accounts match "${searchQuery}"`
                : "When you block accounts, they'll show up here. Blocking prevents them from seeing your content or contacting you."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
