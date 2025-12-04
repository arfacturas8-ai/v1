/**
 * NewMessagePage - Start new conversation
 * Features: User search, recent conversations, suggested users, create group
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { debounce, generateId } from '../../lib/utils';

// Icons
const BackIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GroupIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M14.1667 17.5V15.8333C14.1667 14.9493 13.8155 14.1014 13.1904 13.4763C12.5652 12.8512 11.7174 12.5 10.8333 12.5H4.16667C3.28261 12.5 2.43477 12.8512 1.80965 13.4763C1.18453 14.1014 0.833332 14.9493 0.833332 15.8333V17.5M17.5 17.5V15.8333C17.4996 15.0948 17.2523 14.3773 16.7966 13.7936C16.3409 13.2099 15.7027 12.793 14.9833 12.6083M12.3167 2.60833C13.0375 2.79192 13.6774 3.20892 14.1343 3.79359C14.5913 4.37827 14.8391 5.09736 14.8391 5.8375C14.8391 6.57764 14.5913 7.29673 14.1343 7.88141C13.6774 8.46608 13.0375 8.88308 12.3167 9.06667M10.8333 5.83333C10.8333 7.67428 9.34095 9.16667 7.5 9.16667C5.65905 9.16667 4.16667 7.67428 4.16667 5.83333C4.16667 3.99238 5.65905 2.5 7.5 2.5C9.34095 2.5 10.8333 3.99238 10.8333 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CameraIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M18.3333 14.1667C18.3333 14.6087 18.1577 15.0326 17.8452 15.3452C17.5326 15.6577 17.1087 15.8333 16.6667 15.8333H3.33333C2.89131 15.8333 2.46738 15.6577 2.15482 15.3452C1.84226 15.0326 1.66667 14.6087 1.66667 14.1667V7.5C1.66667 7.05797 1.84226 6.63405 2.15482 6.32149C2.46738 6.00893 2.89131 5.83333 3.33333 5.83333H5.83333L7.5 3.33333H12.5L14.1667 5.83333H16.6667C17.1087 5.83333 17.5326 6.00893 17.8452 6.32149C18.1577 6.63405 18.3333 7.05797 18.3333 7.5V14.1667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="10.8333" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// Types
interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
  isFollowing?: boolean;
  mutualFollowers?: number;
}

interface RecentConversation {
  userId: string;
  lastMessage: string;
  timestamp: Date;
}

const NewMessagePage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [recentConversations, setRecentConversations] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGroupSetup, setShowGroupSetup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string>('');

  // Mock data
  useEffect(() => {
    // Recent conversations
    const mockRecent: User[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        username: '@sarahchen',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isOnline: true,
      },
      {
        id: '2',
        name: 'Alex Martinez',
        username: '@alexm',
        avatar: 'https://i.pravatar.cc/150?img=2',
        isOnline: false,
      },
      {
        id: '3',
        name: 'Jordan Lee',
        username: '@jordanlee',
        avatar: 'https://i.pravatar.cc/150?img=3',
        isOnline: true,
      },
    ];

    // Suggested users
    const mockSuggested: User[] = [
      {
        id: '4',
        name: 'Emma Wilson',
        username: '@emmaw',
        avatar: 'https://i.pravatar.cc/150?img=4',
        isFollowing: true,
        mutualFollowers: 12,
      },
      {
        id: '5',
        name: 'Michael Brown',
        username: '@mikeb',
        avatar: 'https://i.pravatar.cc/150?img=5',
        isFollowing: true,
        mutualFollowers: 8,
      },
      {
        id: '6',
        name: 'Sophia Taylor',
        username: '@sophiat',
        avatar: 'https://i.pravatar.cc/150?img=6',
        isFollowing: false,
        mutualFollowers: 5,
      },
    ];

    setRecentConversations(mockRecent);
    setSuggestedUsers(mockSuggested);
  }, []);

  // Search users
  const searchUsers = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockResults: User[] = [
      {
        id: '7',
        name: 'David Kim',
        username: '@davidk',
        avatar: 'https://i.pravatar.cc/150?img=7',
        isOnline: true,
        isFollowing: false,
        mutualFollowers: 3,
      },
      {
        id: '8',
        name: 'Lisa Anderson',
        username: '@lisaa',
        avatar: 'https://i.pravatar.cc/150?img=8',
        isOnline: false,
        isFollowing: true,
        mutualFollowers: 15,
      },
      {
        id: '9',
        name: 'Ryan White',
        username: '@ryanw',
        avatar: 'https://i.pravatar.cc/150?img=9',
        isOnline: true,
        isFollowing: false,
        mutualFollowers: 7,
      },
    ].filter(
      user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockResults);
    setIsSearching(false);
  }, 300);

  useEffect(() => {
    searchUsers(searchQuery);
  }, [searchQuery]);

  // Toggle user selection
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Start conversation
  const startConversation = (user: User) => {
    if (selectedUsers.length > 0) {
      // Multiple users selected - show group setup
      if (!selectedUsers.some(u => u.id === user.id)) {
        setSelectedUsers(prev => [...prev, user]);
      }
      setShowGroupSetup(true);
    } else {
      // Single user - start direct conversation
      navigate(`/messages/${generateId()}`);
    }
  };

  // Create group
  const createGroup = () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      // Single user - start direct conversation
      navigate(`/messages/${generateId()}`);
    } else {
      // Multiple users - create group
      if (!groupName.trim()) {
        alert('Please enter a group name');
        return;
      }

      // Simulate group creation
      navigate(`/messages/${generateId()}`);
    }
  };

  // Handle group avatar selection
  const handleGroupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupAvatar(file);
      setGroupAvatarPreview(URL.createObjectURL(file));
    }
  };

  // User list item component
  const UserListItem: React.FC<{ user: User; onClick: () => void; showCheckbox?: boolean }> = ({
    user,
    onClick,
    showCheckbox = false,
  }) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);

    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[3],
          cursor: 'pointer',
          borderRadius: radii.md,
          transition: `background ${animation.duration.fast} ${animation.easing.easeOut}`,
          background: isSelected ? colors.bg.elevated : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = colors.bg.tertiary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: radii.full,
              overflow: 'hidden',
              background: colors.bg.tertiary,
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {user.isOnline && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '14px',
                height: '14px',
                background: colors.semantic.success,
                border: `2px solid ${colors.bg.primary}`,
                borderRadius: radii.full,
              }}
            />
          )}
        </div>

        {/* User info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            {user.name}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
            {user.username}
            {user.mutualFollowers !== undefined && (
              <span> • {user.mutualFollowers} mutual</span>
            )}
          </div>
        </div>

        {/* Checkbox or status */}
        {showCheckbox ? (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: radii.full,
              border: `2px solid ${isSelected ? colors.brand.primary : colors.border.default}`,
              background: isSelected ? colors.brand.primary : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            {isSelected && <CheckIcon />}
          </div>
        ) : (
          user.isFollowing && (
            <div
              style={{
                padding: `${spacing[1]} ${spacing[2]}`,
                background: colors.bg.tertiary,
                borderRadius: radii.md,
                fontSize: typography.fontSize.xs,
                color: colors.text.tertiary,
              }}
            >
              Following
            </div>
          )
        )}
      </div>
    );
  };

  if (showGroupSetup) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg.primary,
          color: colors.text.primary,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing[4],
            background: colors.bg.secondary,
            borderBottom: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => setShowGroupSetup(false)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.primary,
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <h1 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, margin: 0 }}>
            New Group
          </h1>
        </div>

        {/* Group setup */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing[4],
          }}
        >
          {/* Group avatar */}
          <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
            <input
              ref={groupAvatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleGroupAvatarSelect}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => groupAvatarInputRef.current?.click()}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: radii.full,
                background: groupAvatarPreview ? 'transparent' : colors.bg.tertiary,
                margin: '0 auto',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px dashed ${colors.border.default}`,
              }}
            >
              {groupAvatarPreview ? (
                <img
                  src={groupAvatarPreview}
                  alt="Group avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <CameraIcon />
              )}
            </div>
            <div
              style={{
                marginTop: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
              }}
            >
              Add group photo
            </div>
          </div>

          {/* Group name */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                marginBottom: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.bg.tertiary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.md,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
            />
          </div>

          {/* Group description */}
          <div style={{ marginBottom: spacing[6] }}>
            <label
              style={{
                display: 'block',
                marginBottom: spacing[2],
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              Description (optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.bg.tertiary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.md,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: typography.fontFamily.sans,
              }}
            />
          </div>

          {/* Members */}
          <div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing[3],
              }}
            >
              Members ({selectedUsers.length})
            </div>
            <div
              style={{
                background: colors.bg.secondary,
                borderRadius: radii.lg,
                overflow: 'hidden',
              }}
            >
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    padding: spacing[3],
                    borderBottom: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: radii.full,
                      overflow: 'hidden',
                      background: colors.bg.tertiary,
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: typography.fontSize.base }}>{user.name}</div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {user.username}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.text.tertiary,
                      cursor: 'pointer',
                      padding: spacing[2],
                    }}
                    aria-label="Remove user"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create button */}
        <div
          style={{
            padding: spacing[4],
            background: colors.bg.secondary,
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
        >
          <button
            onClick={createGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            style={{
              width: '100%',
              padding: spacing[4],
              background: groupName.trim() && selectedUsers.length > 0
                ? colors.brand.primary
                : colors.bg.tertiary,
              border: 'none',
              borderRadius: radii.lg,
              color: '#FFFFFF',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: groupName.trim() && selectedUsers.length > 0 ? 'pointer' : 'not-allowed',
              opacity: groupName.trim() && selectedUsers.length > 0 ? 1 : 0.5,
            }}
          >
            Create Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: colors.bg.primary,
        color: colors.text.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        <button
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.primary,
            cursor: 'pointer',
            padding: spacing[2],
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back to messages"
        >
          <BackIcon />
        </button>
        <h1 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, margin: 0 }}>
          New Message
        </h1>
      </div>

      {/* Search bar */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            background: colors.bg.tertiary,
            borderRadius: radii.lg,
            padding: spacing[3],
          }}
        >
          <SearchIcon />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: 'pointer',
                padding: spacing[1],
              }}
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div
          style={{
            padding: spacing[3],
            background: colors.bg.secondary,
            borderBottom: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
          }}
        >
          {selectedUsers.map(user => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[1],
                minWidth: '60px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: radii.full,
                    overflow: 'hidden',
                    background: colors.bg.tertiary,
                    border: `2px solid ${colors.brand.primary}`,
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleUserSelection(user)}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: '20px',
                    height: '20px',
                    borderRadius: radii.full,
                    background: colors.bg.primary,
                    border: `1px solid ${colors.border.default}`,
                    color: colors.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Remove user"
                >
                  <CloseIcon />
                </button>
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Create group button */}
        {selectedUsers.length > 1 && (
          <div style={{ padding: spacing[4] }}>
            <button
              onClick={() => setShowGroupSetup(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[4],
                background: colors.brand.gradient,
                border: 'none',
                borderRadius: radii.lg,
                color: '#FFFFFF',
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
              }}
            >
              <GroupIcon />
              Create Group with {selectedUsers.length} people
            </button>
          </div>
        )}

        {/* Search results */}
        {searchQuery && (
          <div>
            <div
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {isSearching ? 'Searching...' : `${searchResults.length} Results`}
            </div>
            <div style={{ padding: `0 ${spacing[2]}` }}>
              {searchResults.map(user => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={() => toggleUserSelection(user)}
                  showCheckbox={true}
                />
              ))}
              {!isSearching && searchResults.length === 0 && (
                <div
                  style={{
                    padding: spacing[8],
                    textAlign: 'center',
                    color: colors.text.tertiary,
                  }}
                >
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent conversations */}
        {!searchQuery && recentConversations.length > 0 && (
          <div>
            <div
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Recent
            </div>
            <div style={{ padding: `0 ${spacing[2]}` }}>
              {recentConversations.map(user => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={() => selectedUsers.length > 0 ? toggleUserSelection(user) : startConversation(user)}
                  showCheckbox={selectedUsers.length > 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Suggested users */}
        {!searchQuery && suggestedUsers.length > 0 && (
          <div>
            <div
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Suggested
            </div>
            <div style={{ padding: `0 ${spacing[2]}` }}>
              {suggestedUsers.map(user => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={() => selectedUsers.length > 0 ? toggleUserSelection(user) : startConversation(user)}
                  showCheckbox={selectedUsers.length > 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next button (when users are selected) */}
      {selectedUsers.length > 0 && !searchQuery && (
        <div
          style={{
            padding: spacing[4],
            background: colors.bg.secondary,
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
        >
          <button
            onClick={() => {
              if (selectedUsers.length === 1) {
                startConversation(selectedUsers[0]);
              } else {
                setShowGroupSetup(true);
              }
            }}
            style={{
              width: '100%',
              padding: spacing[4],
              background: colors.brand.primary,
              border: 'none',
              borderRadius: radii.lg,
              color: '#FFFFFF',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            {selectedUsers.length === 1 ? 'Start Chat' : `Next (${selectedUsers.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewMessagePage;
