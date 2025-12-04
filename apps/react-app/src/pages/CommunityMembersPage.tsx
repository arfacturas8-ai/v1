import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Shield, Crown, UserMinus, MoreVertical } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface CommunityMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

const mockMembers: CommunityMember[] = [
  {
    id: '1',
    username: 'john_founder',
    displayName: 'John Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=john_founder',
    bio: 'Community founder and lead developer',
    isVerified: true,
    role: 'owner',
    joinedAt: '2023-06-01T10:00:00Z',
  },
  {
    id: '2',
    username: 'sarah_admin',
    displayName: 'Sarah Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=sarah_admin',
    bio: 'Community administrator | Happy to help!',
    isVerified: true,
    role: 'admin',
    joinedAt: '2023-06-15T14:30:00Z',
  },
  {
    id: '3',
    username: 'mike_mod',
    displayName: 'Mike Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=mike_mod',
    bio: 'Moderator | Keeping things civil',
    isVerified: false,
    role: 'moderator',
    joinedAt: '2023-07-10T09:15:00Z',
  },
  {
    id: '4',
    username: 'alice_member',
    displayName: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_member',
    bio: 'Active community member | Love this place!',
    isVerified: false,
    role: 'member',
    joinedAt: '2024-01-05T16:45:00Z',
  },
  {
    id: '5',
    username: 'bob_dev',
    displayName: 'Bob Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob_dev',
    bio: 'Developer | Building cool projects',
    isVerified: true,
    role: 'member',
    joinedAt: '2024-01-12T11:20:00Z',
  },
];

export default function CommunityMembersPage() {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<CommunityMember[]>(mockMembers);
  const [communityName] = useState('Web3 Developers');
  const [currentUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member'>('admin');
  const [filter, setFilter] = useState<'all' | 'owner' | 'admin' | 'moderator' | 'member'>('all');

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || member.role === filter;
    return matchesSearch && matchesFilter;
  });

  const canManageMember = (memberRole: string) => {
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && memberRole !== 'owner' && memberRole !== 'admin') return true;
    if (currentUserRole === 'moderator' && memberRole === 'member') return true;
    return false;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { icon: <Crown size={14} />, label: 'Owner', color: colors.semantic.warning };
      case 'admin':
        return { icon: <Shield size={14} />, label: 'Admin', color: colors.brand.primary };
      case 'moderator':
        return { icon: <Shield size={14} />, label: 'Mod', color: colors.semantic.info };
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
              {communityName} members
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
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

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]} ${spacing[4]}`,
            overflowX: 'auto',
          }}
        >
          {['all', 'owner', 'admin', 'moderator', 'member'].map((roleFilter) => (
            <button
              key={roleFilter}
              onClick={() => setFilter(roleFilter as typeof filter)}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: '24px',
                border: 'none',
                backgroundColor: filter === roleFilter ? colors.brand.primary : colors.bg.secondary,
                color: filter === roleFilter ? 'white' : colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const roleBadge = getRoleBadge(member.role);

            return (
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
                    {roleBadge && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: spacing[1],
                          padding: `2px ${spacing[2]}`,
                          backgroundColor: roleBadge.color + '20',
                          color: roleBadge.color,
                          borderRadius: '12px',
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        {roleBadge.icon}
                        {roleBadge.label}
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
                    Joined {formatDate(member.joinedAt)}
                  </div>
                </div>

                {/* Actions */}
                {canManageMember(member.role) && (
                  <button
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
                )}
              </div>
            );
          })
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
              <Search size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No members found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No members match "${searchQuery}"`
                : `No ${filter === 'all' ? '' : filter + ' '}members in this community.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
