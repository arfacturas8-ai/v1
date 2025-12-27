/**
 * Community Channels Sidebar - Discord-like Channel Management
 * iOS-Style Modern Design with Voice/Video Support
 */

import React, { useState, useCallback, memo } from 'react';
import {
  Hash, Volume2, Video, Plus, ChevronDown, ChevronRight,
  Settings, Lock, Users, Headphones, Mic, MicOff, PhoneOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChannelItem = memo(({ channel, isActive, onClick, onJoinVoice, currentUserInVoice }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'GUILD_VOICE':
        return <Volume2 size={20} />;
      case 'GUILD_VIDEO':
        return <Video size={20} />;
      default:
        return <Hash size={20} />;
    }
  };

  const isVoiceChannel = channel.type === 'GUILD_VOICE' || channel.type === 'GUILD_VIDEO';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginBottom: '2px',
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: isActive ? 'rgba(88, 166, 255, 0.1)' : isHovered ? '#F8F9FA' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: isActive ? '#58a6ff' : '#1A1A1A',
          fontSize: '15px',
          fontWeight: isActive ? '600' : '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'left',
        }}
      >
        {getChannelIcon()}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {channel.name}
        </span>
        {channel.isPrivate && <Lock size={14} color="#666666" />}
        {channel.userCount > 0 && isVoiceChannel && (
          <span style={{ fontSize: '12px', color: '#666666' }}>
            {channel.userCount}
          </span>
        )}
      </button>

      {/* Voice Channel Active Users */}
      {isVoiceChannel && channel.activeUsers && channel.activeUsers.length > 0 && (
        <div style={{ paddingLeft: '40px', marginTop: '4px' }}>
          {channel.activeUsers.map(voiceUser => (
            <div
              key={voiceUser.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                fontSize: '13px',
                color: '#666666',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: voiceUser.avatarUrl ? `url(${voiceUser.avatarUrl})` : '#58a6ff',
                  backgroundSize: 'cover',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{voiceUser.displayName}</span>
              {voiceUser.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </div>
          ))}
        </div>
      )}

      {/* Join Voice Button */}
      {isVoiceChannel && !currentUserInVoice && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoinVoice(channel.id);
          }}
          style={{
            width: 'calc(100% - 40px)',
            marginLeft: '40px',
            marginTop: '4px',
            padding: '6px 12px',
            background: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Headphones size={14} />
          Join Channel
        </button>
      )}
    </div>
  );
});

const ChannelCategory = memo(({ category, channels, activeChannelId, onChannelClick, onJoinVoice, currentUserInVoice }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          color: '#666666',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
        }}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {category}
      </button>

      {isExpanded && (
        <div>
          {channels.map(channel => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onChannelClick(channel)}
              onJoinVoice={onJoinVoice}
              currentUserInVoice={currentUserInVoice}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function ChannelSidebar({
  community,
  channels = [],
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  onJoinVoice,
  currentUserInVoice,
  isMobile,
}) {
  const navigate = useNavigate();

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, channel) => {
    const category = channel.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {});

  return (
    <div
      style={{
        width: isMobile ? '100%' : '240px',
        height: isMobile ? 'auto' : '100%',
        background: '#FFFFFF',
        borderRight: isMobile ? 'none' : '1px solid #E8EAED',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Community Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E8EAED',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1A1A1A',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {community?.name || 'Community'}
          </h3>
          <button
            onClick={() => navigate(`/community/${community?.slug}/settings`)}
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
            <Settings size={16} color="#666666" />
          </button>
        </div>
      </div>

      {/* Channels List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
        }}
      >
        {/* Create Channel Button */}
        <button
          onClick={onCreateChannel}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={16} />
          Create Channel
        </button>

        {/* Channel Categories */}
        {Object.keys(channelsByCategory).length > 0 ? (
          Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
            <ChannelCategory
              key={category}
              category={category}
              channels={categoryChannels}
              activeChannelId={activeChannelId}
              onChannelClick={onChannelSelect}
              onJoinVoice={onJoinVoice}
              currentUserInVoice={currentUserInVoice}
            />
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#666666',
              fontSize: '14px',
            }}
          >
            <Hash size={32} color="#CCCCCC" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>No channels yet</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Create your first channel</p>
          </div>
        )}
      </div>

      {/* Voice Status Bar (if user is in voice) */}
      {currentUserInVoice && (
        <div
          style={{
            padding: '12px 16px',
            background: '#10B981',
            color: '#FFFFFF',
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Voice Connected</span>
            </div>
            <button
              onClick={() => onJoinVoice(null)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PhoneOff size={14} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
