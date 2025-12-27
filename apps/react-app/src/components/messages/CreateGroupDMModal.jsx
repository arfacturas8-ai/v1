/**
 * CreateGroupDMModal - Create Group Direct Message
 * Modern iOS-style design for group DM creation
 */

import React, { useState, useCallback } from 'react';
import { X, Search, Users, Check } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export default function CreateGroupDMModal({ isOpen, onClose, onCreateGroup, availableUsers = [] }) {
  const { isMobile, isTablet } = useResponsive();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = useCallback((user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one person');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onCreateGroup({
        name: groupName || undefined,
        userIds: selectedUsers.map((u) => u.id),
      });
      onClose();
      setSelectedUsers([]);
      setGroupName('');
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '450px' : '500px',
          maxHeight: '80vh',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #E8EAED',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>
            Create Group DM
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F9FA')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} color="#666666" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Group Name */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '8px',
              }}
            >
              Group Name (optional)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #E8EAED',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#58a6ff')}
              onBlur={(e) => (e.target.style.borderColor = '#E8EAED')}
            />
          </div>

          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <Search size={18} color="#999999" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                style={{
                  width: '100%',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  height: '44px',
                  fontSize: '15px',
                  border: '1px solid #E8EAED',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#58a6ff')}
                onBlur={(e) => (e.target.style.borderColor = '#E8EAED')}
              />
            </div>
          </div>

          {/* Selected Users Pills */}
          {selectedUsers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'rgba(88, 166, 255, 0.1)',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#58a6ff',
                  }}
                >
                  <span>{user.displayName}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    style={{
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredUsers.map((user) => {
              const isSelected = selectedUsers.find((u) => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: isSelected ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#F8F9FA';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: user.avatar
                        ? `url(${user.avatar})`
                        : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {!user.avatar && user.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1A1A1A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666666' }}>@{user.username}</div>
                  </div>

                  {/* Checkbox */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#58a6ff' : '#E8EAED'}`,
                      background: isSelected ? '#58a6ff' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#666666' }}>
                <Users size={48} color="#CCCCCC" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '15px' }}>No users found</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E8EAED',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: '#F8F9FA',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || selectedUsers.length === 0}
            style={{
              flex: 1,
              padding: '12px 24px',
              background:
                creating || selectedUsers.length === 0
                  ? '#CCCCCC'
                  : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: creating || selectedUsers.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating...' : `Create Group (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
