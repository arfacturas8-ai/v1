import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, UserMinus } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ListMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  addedAt: string;
}

const mockMembers: ListMember[] = [
  {
    id: '1',
    username: 'vitalik',
    displayName: 'Vitalik Buterin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=vitalik',
    bio: 'Ethereum co-founder | Building decentralized systems',
    isVerified: true,
    addedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    username: 'satoshi_n',
    displayName: 'Satoshi Nakamoto',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=satoshi_n',
    bio: 'Creator of Bitcoin',
    isVerified: true,
    addedAt: '2024-01-09T14:30:00Z',
  },
  {
    id: '3',
    username: 'web3dev',
    displayName: 'Web3 Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3dev',
    bio: 'Building the decentralized future | Smart contracts & DApps',
    isVerified: false,
    addedAt: '2024-01-08T09:15:00Z',
  },
  {
    id: '4',
    username: 'crypto_alice',
    displayName: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=crypto_alice',
    bio: 'DeFi researcher | Crypto investor',
    isVerified: false,
    addedAt: '2024-01-07T16:45:00Z',
  },
  {
    id: '5',
    username: 'nft_artist',
    displayName: 'Digital Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nft_artist',
    bio: 'Creating digital art on the blockchain | NFT collector',
    isVerified: true,
    addedAt: '2024-01-06T11:20:00Z',
  },
];

export default function ListMembersPage() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<ListMember[]>(mockMembers);
  const [listName] = useState('Web3 Builders');
  const [isOwner] = useState(true);

  const filteredMembers = members.filter(
    (member) =>
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveMember = (memberId: string) => {
    if (!isOwner) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
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
              {listName}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Add member button */}
          {isOwner && (
            <button
              onClick={() => navigate(`/lists/${listId}/add-members`)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.primary;
              }}
            >
              <UserPlus size={20} color="white" />
            </button>
          )}
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
              placeholder="Search members"
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
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
              }}
            >
              {/* Avatar */}
              <img
                src={member.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${member.username}`}
                alt={member.displayName}
                onClick={() => navigate(`/user/${member.username}`)}
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
                    onClick={() => navigate(`/user/${member.username}`)}
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
                    {member.displayName}
                  </span>
                  {member.isVerified && (
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
                  @{member.username}
                </div>
                {member.bio && (
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
                    {member.bio}
                  </p>
                )}
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Added {formatDate(member.addedAt)}
                </div>
              </div>

              {/* Remove button (only for owner) */}
              {isOwner && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: '24px',
                    border: `1px solid ${colors.border.default}`,
                    backgroundColor: 'transparent',
                    color: colors.text.primary,
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
                    e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                    e.currentTarget.style.borderColor = colors.semantic.error;
                    e.currentTarget.style.color = colors.semantic.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                >
                  <UserMinus size={16} />
                  Remove
                </button>
              )}
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
              {searchQuery ? 'No members found' : 'No members yet'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto', marginBottom: spacing[4] }}>
              {searchQuery
                ? `No members match "${searchQuery}"`
                : 'Add members to this list to see their posts in a dedicated timeline.'}
            </p>
            {isOwner && !searchQuery && (
              <button
                onClick={() => navigate(`/lists/${listId}/add-members`)}
                style={{
                  padding: `${spacing[3]} ${spacing[6]}`,
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: colors.brand.primary,
                  color: 'white',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.primary;
                }}
              >
                Add members
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
