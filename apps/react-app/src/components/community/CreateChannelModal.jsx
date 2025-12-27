/**
 * Create Channel Modal - Discord-style Channel Creation
 * iOS-Style Modern Design
 */

import React, { useState } from 'react';
import { Hash, Volume2, Video, X, Lock } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export default function CreateChannelModal({ community, onClose, onCreate }) {
  const { isMobile, isTablet } = useResponsive();
  const [channelData, setChannelData] = useState({
    name: '',
    type: 'GUILD_TEXT',
    description: '',
    category: 'General',
    isPrivate: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const channelTypes = [
    { value: 'GUILD_TEXT', label: 'Text Channel', icon: Hash, description: 'Send messages, images, and links' },
    { value: 'GUILD_VOICE', label: 'Voice Channel', icon: Volume2, description: 'Voice chat with community members' },
    { value: 'GUILD_VIDEO', label: 'Video Channel', icon: Video, description: 'Video calls with screen share' },
  ];

  const handleCreate = async () => {
    if (!channelData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onCreate({
        ...channelData,
        serverId: community.id,
        name: channelData.name.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '450px' : '500px',
          background: '#FFFFFF',
          borderRadius: isMobile ? '24px 24px 0 0' : '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '16px 20px' : '20px 24px',
            borderBottom: '1px solid #E8EAED',
          }}
        >
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>
            Create Channel
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
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} color="#666666" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '20px' : '24px' }}>
          {/* Channel Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
              Channel Type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {channelTypes.map(type => {
                const Icon = type.icon;
                const isSelected = channelData.type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setChannelData({ ...channelData, type: type.value })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: isSelected ? 'rgba(88, 166, 255, 0.1)' : '#F8F9FA',
                      border: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={24} color={isSelected ? '#58a6ff' : '#666666'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666666' }}>
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
              Channel Name
            </label>
            <input
              type="text"
              value={channelData.name}
              onChange={(e) => setChannelData({ ...channelData, name: e.target.value })}
              placeholder="Enter channel name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #E8EAED',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
              onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
              Category
            </label>
            <input
              type="text"
              value={channelData.category}
              onChange={(e) => setChannelData({ ...channelData, category: e.target.value })}
              placeholder="General, Voice Channels, etc..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #E8EAED',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
              onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
              Description (optional)
            </label>
            <textarea
              value={channelData.description}
              onChange={(e) => setChannelData({ ...channelData, description: e.target.value })}
              placeholder="What's this channel about?"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #E8EAED',
                borderRadius: '10px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
              onBlur={(e) => e.target.style.borderColor = '#E8EAED'}
            />
          </div>

          {/* Private Channel Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#F8F9FA',
              borderRadius: '10px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={20} color="#666666" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                  Private Channel
                </div>
                <div style={{ fontSize: '13px', color: '#666666' }}>
                  Only selected members can access
                </div>
              </div>
            </div>
            <button
              onClick={() => setChannelData({ ...channelData, isPrivate: !channelData.isPrivate })}
              style={{
                width: '48px',
                height: '28px',
                background: channelData.isPrivate ? '#58a6ff' : '#CCCCCC',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  background: '#FFFFFF',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '3px',
                  left: channelData.isPrivate ? '23px' : '3px',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
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
                transition: 'opacity 0.2s',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !channelData.name.trim()}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: creating || !channelData.name.trim() ? '#CCCCCC' : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: creating || !channelData.name.trim() ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!creating && channelData.name.trim()) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {creating ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
