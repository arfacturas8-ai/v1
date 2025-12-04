import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Lock, Globe, Users, MoreVertical } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface List {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  subscriberCount: number;
  isPrivate: boolean;
  isOwned: boolean;
  coverImage?: string;
  members: {
    username: string;
    avatar: string;
  }[];
  createdAt: string;
}

const mockLists: List[] = [
  {
    id: '1',
    name: 'Crypto Artists',
    description: 'My favorite NFT creators and digital artists',
    memberCount: 24,
    subscriberCount: 156,
    isPrivate: false,
    isOwned: true,
    members: [
      {
        username: 'cryptoartist',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
      },
      {
        username: 'nftcollector',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nftcollector',
      },
      {
        username: 'digitalart',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=digitalart',
      },
    ],
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'DeFi Experts',
    description: 'Top voices in decentralized finance',
    memberCount: 18,
    subscriberCount: 203,
    isPrivate: false,
    isOwned: true,
    members: [
      {
        username: 'defiwhale',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
      },
      {
        username: 'yieldfarmer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=yieldfarmer',
      },
    ],
    createdAt: '2024-01-08T14:30:00Z',
  },
  {
    id: '3',
    name: 'Web3 Builders',
    description: 'Developers and founders building the decentralized web',
    memberCount: 32,
    subscriberCount: 412,
    isPrivate: true,
    isOwned: true,
    members: [
      {
        username: 'web3builder',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
      },
      {
        username: 'devfounder',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=devfounder',
      },
      {
        username: 'blockchain',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=blockchain',
      },
    ],
    createdAt: '2024-01-05T09:15:00Z',
  },
  {
    id: '4',
    name: 'Tech Innovators',
    description: null,
    memberCount: 45,
    subscriberCount: 89,
    isPrivate: false,
    isOwned: false,
    members: [
      {
        username: 'techguru',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=techguru',
      },
      {
        username: 'innovator',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=innovator',
      },
    ],
    createdAt: '2023-12-20T11:00:00Z',
  },
];

export default function ListsPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<List[]>(mockLists);
  const [showOwned, setShowOwned] = useState(true);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredLists = showOwned ? lists.filter((l) => l.isOwned) : lists.filter((l) => !l.isOwned);

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
              flexShrink: 0,
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
              Lists
            </h1>
          </div>

          <button
            onClick={() => navigate('/lists/create')}
            aria-label="Create list"
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
              flexShrink: 0,
            }}
          >
            <Plus size={20} color="white" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border.default}` }}>
          <button
            onClick={() => setShowOwned(true)}
            style={{
              flex: 1,
              padding: spacing[3],
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: showOwned ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
              color: showOwned ? colors.text.primary : colors.text.tertiary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            Your Lists
          </button>
          <button
            onClick={() => setShowOwned(false)}
            style={{
              flex: 1,
              padding: spacing[3],
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: !showOwned ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
              color: !showOwned ? colors.text.primary : colors.text.tertiary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            Subscribed
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredLists.length > 0 ? (
          filteredLists.map((list) => (
            <div
              key={list.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                transition: 'background-color 150ms ease-out',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/lists/${list.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', gap: spacing[3] }}>
                {/* Member avatars preview */}
                <div
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    flexShrink: 0,
                    backgroundColor: colors.bg.secondary,
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {list.members.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: list.members.length === 1 ? '1fr' : '1fr 1fr',
                        gridTemplateRows: list.members.length <= 2 ? '1fr' : '1fr 1fr',
                        width: '100%',
                        height: '100%',
                        gap: '2px',
                      }}
                    >
                      {list.members.slice(0, 4).map((member, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: colors.bg.secondary,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={member.avatar}
                            alt={member.username}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={32} color={colors.text.tertiary} />
                    </div>
                  )}
                </div>

                {/* List info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <h3
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      {list.name}
                    </h3>
                    {list.isPrivate ? (
                      <Lock size={14} color={colors.text.tertiary} />
                    ) : (
                      <Globe size={14} color={colors.text.tertiary} />
                    )}
                  </div>

                  {list.description && (
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
                      {list.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(list.memberCount)} members
                    </span>
                    {!list.isOwned && (
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(list.subscriberCount)} subscribers
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show menu
                  }}
                  aria-label="More options"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background-color 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <MoreVertical size={20} color={colors.text.tertiary} />
                </button>
              </div>
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
              <Users size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {showOwned ? 'No lists yet' : 'No subscribed lists'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto', marginBottom: spacing[4] }}>
              {showOwned
                ? 'Create your first list to organize accounts by topic or interest'
                : 'Subscribe to lists to see curated content from groups of accounts'}
            </p>
            {showOwned && (
              <button
                onClick={() => navigate('/lists/create')}
                style={{
                  padding: `${spacing[3]} ${spacing[5]}`,
                  backgroundColor: colors.brand.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                Create a list
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
