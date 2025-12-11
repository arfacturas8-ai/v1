/**
 * GroupSettingsPage - Group chat settings
 * Features: Group info, member management, media gallery, shared files
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { formatFileSize, generateId } from '../../lib/utils';

// Icons
const BackIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M9.16667 3.33334H3.33333C2.89131 3.33334 2.46738 3.50893 2.15482 3.82149C1.84226 4.13405 1.66667 4.55798 1.66667 5.00001V16.6667C1.66667 17.1087 1.84226 17.5326 2.15482 17.8452C2.46738 18.1577 2.89131 18.3333 3.33333 18.3333H15C15.442 18.3333 15.866 18.1577 16.1785 17.8452C16.4911 17.5326 16.6667 17.1087 16.6667 16.6667V10.8333M15.4167 2.08334C15.7482 1.75181 16.1978 1.56556 16.6667 1.56556C17.1355 1.56556 17.5851 1.75181 17.9167 2.08334C18.2482 2.41487 18.4344 2.86448 18.4344 3.33334C18.4344 3.8022 18.2482 4.25181 17.9167 4.58334L10 12.5L6.66667 13.3333L7.5 10L15.4167 2.08334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CameraIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M18.3333 14.1667C18.3333 14.6087 18.1577 15.0326 17.8452 15.3452C17.5326 15.6577 17.1087 15.8333 16.6667 15.8333H3.33333C2.89131 15.8333 2.46738 15.6577 2.15482 15.3452C1.84226 15.0326 1.66667 14.6087 1.66667 14.1667V7.5C1.66667 7.05797 1.84226 6.63405 2.15482 6.32149C2.46738 6.00893 2.89131 5.83333 3.33333 5.83333H5.83333L7.5 3.33333H12.5L14.1667 5.83333H16.6667C17.1087 5.83333 17.5326 6.00893 17.8452 6.32149C18.1577 6.63405 18.3333 7.05797 18.3333 7.5V14.1667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="10.8333" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AddUserIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 10 12.5H4.16667C3.28261 12.5 2.43477 12.8512 1.80965 13.4763C1.18453 14.1014 0.833334 14.9493 0.833334 15.8333V17.5M17.5 6.66667V12.5M14.5833 9.58333H20.4167M10 9.16667C10 11.0076 8.50762 12.5 6.66667 12.5C4.82572 12.5 3.33333 11.0076 3.33333 9.16667C3.33333 7.32572 4.82572 5.83333 6.66667 5.83333C8.50762 5.83333 10 7.32572 10 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BellOffIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 16.6667C11.4784 17.0159 11.1984 17.3068 10.8567 17.5093C10.515 17.7119 10.124 17.8187 9.72583 17.8187C9.32762 17.8187 8.93659 17.7119 8.59491 17.5093C8.25323 17.3068 7.97326 17.0159 7.785 16.6667M2.5 2.5L17.5 17.5M9.16667 3.33333C10.2717 3.33333 11.3315 3.77232 12.1129 4.5537C12.8943 5.33509 13.3333 6.39493 13.3333 7.5C13.3333 9.26667 13.8667 10.4417 14.4917 11.325L3.50833 0.341667C4.39167 0.966667 5.56667 1.5 7.33333 1.5V3.33333C6.44928 3.33333 5.60143 3.68452 4.97631 4.30964C4.35119 4.93476 4 5.78261 4 6.66667V7.5C4 9.26667 3.46667 10.4417 2.84167 11.325C2.61667 11.6583 2.5 12.0667 2.5 12.5C2.5 13.1083 2.725 13.6667 3.10833 14.0833L3.33333 14.3083H15M15 14.3083L9.16667 3.33333V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ImageIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M17.5 12.5L13.75 8.75L6.25 16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11.6667 1.66667H5C4.55797 1.66667 4.13405 1.84226 3.82149 2.15482C3.50893 2.46738 3.33333 2.89131 3.33333 3.33333V16.6667C3.33333 17.1087 3.50893 17.5326 3.82149 17.8452C4.13405 18.1577 4.55797 18.3333 5 18.3333H15C15.442 18.3333 15.866 18.1577 16.1785 17.8452C16.4911 17.5326 16.6667 17.1087 16.6667 16.6667V6.66667L11.6667 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.6667 1.66667V6.66667H16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExitIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="4" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Types
interface Member {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline?: boolean;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  timestamp: Date;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  timestamp: Date;
  sender: string;
}

interface GroupSettings {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  members: Member[];
  createdAt: Date;
  createdBy: string;
  isMuted: boolean;
}

const GroupSettingsPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentUserId] = useState('user-1');

  // State
  const [groupSettings, setGroupSettings] = useState<GroupSettings | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string>('');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'files'>('members');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [showMemberOptions, setShowMemberOptions] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Mock data
  useEffect(() => {
    const mockSettings: GroupSettings = {
      id: conversationId || '1',
      name: 'NFT Collectors',
      description: 'A group for NFT enthusiasts to share and discuss collections',
      avatar: 'https://picsum.photos/200?random=1',
      members: [
        {
          id: 'user-1',
          name: 'You',
          username: '@you',
          role: 'admin',
          isOnline: true,
        },
        {
          id: 'user-2',
          name: 'Sarah Chen',
          username: '@sarahchen',
          avatar: 'https://i.pravatar.cc/150?img=1',
          role: 'admin',
          isOnline: true,
        },
        {
          id: 'user-3',
          name: 'Alex Martinez',
          username: '@alexm',
          avatar: 'https://i.pravatar.cc/150?img=2',
          role: 'member',
          isOnline: false,
        },
        {
          id: 'user-4',
          name: 'Jordan Lee',
          username: '@jordanlee',
          avatar: 'https://i.pravatar.cc/150?img=3',
          role: 'member',
          isOnline: true,
        },
        {
          id: 'user-5',
          name: 'Emma Wilson',
          username: '@emmaw',
          avatar: 'https://i.pravatar.cc/150?img=4',
          role: 'member',
          isOnline: false,
        },
      ],
      createdAt: new Date('2024-01-15'),
      createdBy: 'user-1',
      isMuted: false,
    };

    const mockMedia: MediaItem[] = [
      {
        id: '1',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=1',
        thumbnail: 'https://picsum.photos/200/150?random=1',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=2',
        thumbnail: 'https://picsum.photos/200/150?random=2',
        timestamp: new Date(Date.now() - 172800000),
      },
      {
        id: '3',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=3',
        thumbnail: 'https://picsum.photos/200/150?random=3',
        timestamp: new Date(Date.now() - 259200000),
      },
      {
        id: '4',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=4',
        thumbnail: 'https://picsum.photos/200/150?random=4',
        timestamp: new Date(Date.now() - 345600000),
      },
      {
        id: '5',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=5',
        thumbnail: 'https://picsum.photos/200/150?random=5',
        timestamp: new Date(Date.now() - 432000000),
      },
      {
        id: '6',
        type: 'image',
        url: 'https://picsum.photos/400/300?random=6',
        thumbnail: 'https://picsum.photos/200/150?random=6',
        timestamp: new Date(Date.now() - 518400000),
      },
    ];

    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: 'NFT_Collection_Analysis.pdf',
        size: 2457600,
        type: 'application/pdf',
        url: '#',
        timestamp: new Date(Date.now() - 86400000),
        sender: 'Sarah Chen',
      },
      {
        id: '2',
        name: 'Whitepaper_v2.docx',
        size: 1536000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '#',
        timestamp: new Date(Date.now() - 172800000),
        sender: 'Alex Martinez',
      },
      {
        id: '3',
        name: 'Smart_Contract.sol',
        size: 45678,
        type: 'text/plain',
        url: '#',
        timestamp: new Date(Date.now() - 259200000),
        sender: 'Jordan Lee',
      },
    ];

    setGroupSettings(mockSettings);
    setEditedName(mockSettings.name);
    setEditedDescription(mockSettings.description);
    setMediaItems(mockMedia);
    setFileItems(mockFiles);
  }, [conversationId]);

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      setNewAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Save group info
  const saveGroupInfo = () => {
    if (!groupSettings) return;

    setGroupSettings({
      ...groupSettings,
      name: editedName,
      description: editedDescription,
      avatar: newAvatarPreview || groupSettings.avatar,
    });
    setIsEditingInfo(false);
    setNewAvatar(null);
    setNewAvatarPreview('');
  };

  // Toggle mute
  const toggleMute = () => {
    if (!groupSettings) return;
    setGroupSettings({ ...groupSettings, isMuted: !groupSettings.isMuted });
  };

  // Remove member
  const removeMember = (memberId: string) => {
    if (!groupSettings) return;
    setGroupSettings({
      ...groupSettings,
      members: groupSettings.members.filter(m => m.id !== memberId),
    });
    setShowMemberOptions(null);
  };

  // Promote to admin
  const promoteToAdmin = (memberId: string) => {
    if (!groupSettings) return;
    setGroupSettings({
      ...groupSettings,
      members: groupSettings.members.map(m =>
        m.id === memberId ? { ...m, role: 'admin' as const } : m
      ),
    });
    setShowMemberOptions(null);
  };

  // Leave group
  const leaveGroup = () => {
    navigate('/messages');
  };

  if (!groupSettings) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.bg.primary,
          color: colors.text.primary,
        }}
      >
      </div>
    );
  }

  const currentUserRole = groupSettings.members.find(m => m.id === currentUserId)?.role;
  const isAdmin = currentUserRole === 'admin';
  const filteredMembers = groupSettings.members.filter(
    member =>
      member.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchMemberQuery.toLowerCase())
  );

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
          onClick={() => navigate(-1)}
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
        <h1 style={{ flex: 1, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, margin: 0 }}>
          Group Settings
        </h1>
        {isAdmin && !isEditingInfo && (
          <button
            onClick={() => setIsEditingInfo(true)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.secondary,
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Edit group info"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Group info */}
        <div
          style={{
            padding: spacing[6],
            background: colors.bg.secondary,
            borderBottom: `1px solid ${colors.border.subtle}`,
            textAlign: 'center',
          }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: spacing[4] }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: radii.full,
                overflow: 'hidden',
                background: colors.bg.tertiary,
                margin: '0 auto',
              }}
            >
              {(newAvatarPreview || groupSettings.avatar) && (
                <img
                  src={newAvatarPreview || groupSettings.avatar}
                  alt={groupSettings.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            {isEditingInfo && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '36px',
                    height: '36px',
                    borderRadius: radii.full,
                    background: colors.brand.primary,
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Change avatar"
                >
                  <CameraIcon />
                </button>
              </>
            )}
          </div>

          {/* Name */}
          {isEditingInfo ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: spacing[3],
                background: colors.bg.tertiary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.md,
                color: colors.text.primary,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                textAlign: 'center',
                outline: 'none',
                marginBottom: spacing[3],
              }}
            />
          ) : (
            <h2
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                margin: `0 0 ${spacing[2]} 0`,
              }}
            >
              {groupSettings.name}
            </h2>
          )}

          {/* Description */}
          {isEditingInfo ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: spacing[3],
                background: colors.bg.tertiary,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: radii.md,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                textAlign: 'center',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: typography.fontFamily.sans,
              }}
            />
          ) : (
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                margin: `0 0 ${spacing[4]} 0`,
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {groupSettings.description}
            </p>
          )}

          {/* Save/Cancel buttons */}
          {isEditingInfo && (
            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'center', marginTop: spacing[4] }}>
              <button
                onClick={() => {
                  setIsEditingInfo(false);
                  setEditedName(groupSettings.name);
                  setEditedDescription(groupSettings.description);
                  setNewAvatar(null);
                  setNewAvatarPreview('');
                }}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  background: colors.bg.tertiary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveGroupInfo}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  background: colors.brand.primary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Member count */}
          {!isEditingInfo && (
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
              {groupSettings.members.length} members • Created{' '}
              {groupSettings.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        {!isEditingInfo && (
          <div
            style={{
              background: colors.bg.secondary,
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            <button
              onClick={toggleMute}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[4],
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              <BellOffIcon />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {groupSettings.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </span>
              <div
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: radii.full,
                  background: groupSettings.isMuted ? colors.brand.primary : colors.bg.tertiary,
                  position: 'relative',
                  transition: `background ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: groupSettings.isMuted ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: radii.full,
                    background: '#FFFFFF',
                    transition: `left ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Tabs */}
        {!isEditingInfo && (
          <>
            <div
              style={{
                display: 'flex',
                background: colors.bg.secondary,
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              {(['members', 'media', 'files'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: spacing[4],
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? `2px solid ${colors.brand.primary}` : 'none',
                    color: activeTab === tab ? colors.brand.primary : colors.text.secondary,
                    fontSize: typography.fontSize.base,
                    fontWeight: activeTab === tab ? typography.fontWeight.semibold : typography.fontWeight.regular,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {/* Members tab */}
              {activeTab === 'members' && (
                <div>
                  {/* Search members */}
                  <div style={{ padding: spacing[4] }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        background: colors.bg.tertiary,
                        borderRadius: radii.md,
                        padding: spacing[3],
                      }}
                    >
                      <SearchIcon />
                      <input
                        type="text"
                        value={searchMemberQuery}
                        onChange={(e) => setSearchMemberQuery(e.target.value)}
                        placeholder="Search members..."
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          outline: 'none',
                          color: colors.text.primary,
                          fontSize: typography.fontSize.base,
                        }}
                      />
                    </div>
                  </div>

                  {/* Add member button */}
                  {isAdmin && (
                    <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
                      <button
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[3],
                          padding: spacing[4],
                          background: colors.bg.tertiary,
                          border: 'none',
                          borderRadius: radii.md,
                          color: colors.brand.primary,
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          cursor: 'pointer',
                        }}
                      >
                        <AddUserIcon />
                        Add Members
                      </button>
                    </div>
                  )}

                  {/* Members list */}
                  <div>
                    {filteredMembers.map(member => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[3],
                          padding: spacing[4],
                          borderBottom: `1px solid ${colors.border.subtle}`,
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
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
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
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {member.isOnline && (
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

                        {/* Member info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                            {member.username}
                            {member.role === 'admin' && ' • Admin'}
                          </div>
                        </div>

                        {/* Actions */}
                        {isAdmin && member.id !== currentUserId && (
                          <button
                            onClick={() => setShowMemberOptions(showMemberOptions === member.id ? null : member.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: colors.text.tertiary,
                              cursor: 'pointer',
                              padding: spacing[2],
                            }}
                            aria-label="Member options"
                          >
                            <MoreIcon />
                          </button>
                        )}

                        {/* Member options menu */}
                        {showMemberOptions === member.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: spacing[4],
                              background: colors.bg.elevated,
                              borderRadius: radii.md,
                              padding: spacing[2],
                              minWidth: '180px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                              zIndex: 10,
                            }}
                          >
                            {member.role !== 'admin' && (
                              <button
                                onClick={() => promoteToAdmin(member.id)}
                                style={{
                                  width: '100%',
                                  background: 'none',
                                  border: 'none',
                                  color: colors.text.primary,
                                  cursor: 'pointer',
                                  padding: spacing[3],
                                  textAlign: 'left',
                                  fontSize: typography.fontSize.base,
                                  borderRadius: radii.sm,
                                }}
                              >
                                Make Admin
                              </button>
                            )}
                            <button
                              onClick={() => removeMember(member.id)}
                              style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: colors.semantic.error,
                                cursor: 'pointer',
                                padding: spacing[3],
                                textAlign: 'left',
                                fontSize: typography.fontSize.base,
                                borderRadius: radii.sm,
                              }}
                            >
                              Remove from Group
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media tab */}
              {activeTab === 'media' && (
                <div style={{ padding: spacing[4] }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: spacing[2],
                    }}
                  >
                    {mediaItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          aspectRatio: '1',
                          borderRadius: radii.md,
                          overflow: 'hidden',
                          background: colors.bg.tertiary,
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={item.thumbnail || item.url}
                          alt="Media"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                  {mediaItems.length === 0 && (
                    <div
                      style={{
                        padding: spacing[8],
                        textAlign: 'center',
                        color: colors.text.tertiary,
                      }}
                    >
                      <ImageIcon />
                      <div style={{ marginTop: spacing[2] }}>No media shared yet</div>
                    </div>
                  )}
                </div>
              )}

              {/* Files tab */}
              {activeTab === 'files' && (
                <div>
                  {fileItems.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[3],
                        padding: spacing[4],
                        borderBottom: `1px solid ${colors.border.subtle}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: radii.md,
                          background: colors.bg.tertiary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.text.secondary,
                        }}
                      >
                        <FileIcon />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                          {formatFileSize(file.size)} • {file.sender}
                        </div>
                      </div>
                      <ChevronRightIcon />
                    </div>
                  ))}
                  {fileItems.length === 0 && (
                    <div
                      style={{
                        padding: spacing[8],
                        textAlign: 'center',
                        color: colors.text.tertiary,
                      }}
                    >
                      <FileIcon />
                      <div style={{ marginTop: spacing[2] }}>No files shared yet</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Leave group */}
        {!isEditingInfo && (
          <div style={{ padding: spacing[4], marginTop: spacing[4] }}>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[3],
                padding: spacing[4],
                background: 'none',
                border: `1px solid ${colors.semantic.error}`,
                borderRadius: radii.md,
                color: colors.semantic.error,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
              }}
            >
              <ExitIcon />
              Leave Group
            </button>
          </div>
        )}
      </div>

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <>
          <div
            onClick={() => setShowLeaveConfirm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: colors.bg.elevated,
              borderRadius: radii.lg,
              padding: spacing[6],
              maxWidth: '400px',
              width: '90%',
              zIndex: 1001,
            }}
          >
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                margin: `0 0 ${spacing[3]} 0`,
              }}
            >
              Leave "{groupSettings.name}"?
            </h3>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, margin: `0 0 ${spacing[6]} 0` }}>
              You will no longer receive messages from this group. You can rejoin if you're added again.
            </p>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.bg.tertiary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={leaveGroup}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.semantic.error,
                  border: 'none',
                  borderRadius: radii.md,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GroupSettingsPage;
