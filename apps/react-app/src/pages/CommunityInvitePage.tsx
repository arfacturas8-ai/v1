import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Search, UserPlus, Check, Copy, Link as LinkIcon } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
  isInvited: boolean;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'alice_dev',
    displayName: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_dev',
    bio: 'Frontend developer | React enthusiast',
    isVerified: true,
    isFollowing: true,
    isInvited: false,
  },
  {
    id: '2',
    username: 'bob_designer',
    displayName: 'Bob Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob_designer',
    bio: 'UI/UX Designer | Making the web beautiful',
    isVerified: false,
    isFollowing: true,
    isInvited: false,
  },
  {
    id: '3',
    username: 'carol_crypto',
    displayName: 'Carol Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=carol_crypto',
    bio: 'Crypto trader | DeFi enthusiast',
    isVerified: true,
    isFollowing: true,
    isInvited: true,
  },
  {
    id: '4',
    username: 'david_eng',
    displayName: 'David Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=david_eng',
    bio: 'Software engineer | Building cool stuff',
    isVerified: false,
    isFollowing: false,
    isInvited: false,
  },
];

export default function CommunityInvitePage() {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [communityName] = useState('Web3 Developers');
  const [inviteLink] = useState('https://platform.cryb.ai/c/web3-developers/invite/abc123');
  const [copied, setCopied] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleInvite = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isInvited: !user.isInvited } : user
      )
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const invitedCount = users.filter((u) => u.isInvited).length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Cancel"
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
              <X size={20} color={colors.text.primary} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Invite to {communityName}
              </h1>
              {invitedCount > 0 && (
                <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
                  {invitedCount} {invitedCount === 1 ? 'person' : 'people'} invited
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            disabled={invitedCount === 0}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: invitedCount > 0 ? colors.brand.primary : colors.bg.tertiary,
              color: invitedCount > 0 ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: invitedCount > 0 ? 'pointer' : 'default',
              transition: 'all 150ms ease-out',
            }}
          >
            Done
          </button>
        </div>

        {/* Invite link */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <LinkIcon size={20} color={colors.text.tertiary} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                  marginBottom: spacing[1],
                }}
              >
                Invite link
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {inviteLink}
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: copied ? colors.semantic.success + '20' : colors.brand.primary,
                color: copied ? colors.semantic.success : 'white',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                flexShrink: 0,
                transition: 'all 150ms ease-out',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
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
              placeholder="Search people to invite"
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
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
              }}
            >
              {/* Avatar */}
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`}
                alt={user.displayName}
                onClick={() => navigate(`/user/${user.username}`)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    onClick={() => navigate(`/user/${user.username}`)}
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
                    {user.displayName}
                  </span>
                  {user.isVerified && (
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
                  @{user.username}
                </div>
                {user.bio && (
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Invite button */}
              <button
                onClick={() => handleToggleInvite(user.id)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: '24px',
                  border: user.isInvited ? `1px solid ${colors.border.default}` : 'none',
                  backgroundColor: user.isInvited ? 'transparent' : colors.brand.primary,
                  color: user.isInvited ? colors.text.primary : 'white',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  flexShrink: 0,
                  height: 'fit-content',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!user.isInvited) {
                    e.currentTarget.style.backgroundColor = colors.brand.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!user.isInvited) {
                    e.currentTarget.style.backgroundColor = colors.brand.primary;
                  }
                }}
              >
                {user.isInvited ? (
                  <>
                    <Check size={16} />
                    Invited
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Invite
                  </>
                )}
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
              <UserPlus size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No people found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No users match "${searchQuery}"`
                : 'Search for people to invite to this community.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
