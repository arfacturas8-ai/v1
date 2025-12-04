import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Search, Check, Plus, Lock, Globe } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface UserList {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  isMember: boolean;
}

const mockLists: UserList[] = [
  {
    id: '1',
    name: 'Web3 Builders',
    description: 'Developers and creators building the decentralized web',
    isPrivate: false,
    memberCount: 42,
    isMember: false,
  },
  {
    id: '2',
    name: 'Crypto News',
    description: 'Stay updated with the latest in crypto',
    isPrivate: false,
    memberCount: 128,
    isMember: true,
  },
  {
    id: '3',
    name: 'DeFi Researchers',
    isPrivate: true,
    memberCount: 15,
    isMember: false,
  },
  {
    id: '4',
    name: 'NFT Artists',
    description: 'Digital artists creating NFTs',
    isPrivate: false,
    memberCount: 67,
    isMember: false,
  },
  {
    id: '5',
    name: 'Tech Influencers',
    isPrivate: true,
    memberCount: 23,
    isMember: true,
  },
];

export default function AddToListPage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [lists, setLists] = useState<UserList[]>(mockLists);
  const [hasChanges, setHasChanges] = useState(false);

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMember = (listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, isMember: !list.isMember } : list
      )
    );
    setHasChanges(true);
  };

  const handleDone = () => {
    // In real app, would save changes here
    navigate(-1);
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
                Add @{username} to lists
              </h1>
            </div>
          </div>

          <button
            onClick={handleDone}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: hasChanges ? colors.brand.primary : colors.bg.tertiary,
              color: hasChanges ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: hasChanges ? 'pointer' : 'default',
              transition: 'all 150ms ease-out',
            }}
          >
            Done
          </button>
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
              placeholder="Search your lists"
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
        {/* Create new list option */}
        <div
          onClick={() => navigate('/lists/create')}
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
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
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: colors.brand.primary + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Plus size={24} color={colors.brand.primary} />
          </div>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.brand.primary,
              }}
            >
              Create a new list
            </div>
          </div>
        </div>

        {/* Lists */}
        {filteredLists.length > 0 ? (
          filteredLists.map((list) => (
            <div
              key={list.id}
              onClick={() => handleToggleMember(list.id)}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
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
              {/* Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: colors.bg.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {list.isPrivate ? (
                  <Lock size={20} color={colors.text.tertiary} />
                ) : (
                  <Globe size={20} color={colors.text.tertiary} />
                )}
              </div>

              {/* Info */}
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
                  {list.name}
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {list.description || `${list.memberCount} members`}
                </div>
              </div>

              {/* Checkbox */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `2px solid ${list.isMember ? colors.brand.primary : colors.border.default}`,
                  backgroundColor: list.isMember ? colors.brand.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 150ms ease-out',
                }}
              >
                {list.isMember && <Check size={16} color="white" />}
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
              No lists found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto', marginBottom: spacing[4] }}>
              {searchQuery
                ? `No lists match "${searchQuery}"`
                : "You haven't created any lists yet."}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/lists/create');
              }}
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
              Create your first list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
