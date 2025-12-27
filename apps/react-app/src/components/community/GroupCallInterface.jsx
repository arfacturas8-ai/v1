/**
 * Group Call Interface - Enterprise-Grade Video/Audio Calling
 * iOS-Style Modern Design with LiveKit Integration
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Settings,
  Monitor, Users, Grid, Maximize2, Volume2, VolumeX, MoreVertical
} from 'lucide-react';

const ParticipantTile = memo(({ participant, isLocal, isSpeaking }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: '#1A1A1A',
        borderRadius: '12px',
        overflow: 'hidden',
        aspectRatio: '16/9',
        border: isSpeaking ? '3px solid #10B981' : '3px solid transparent',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Video Element */}
      {participant.videoEnabled ? (
        <video
          ref={participant.videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: '700',
              color: '#FFFFFF',
            }}
          >
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
            {participant.displayName}
            {isLocal && ' (You)'}
          </span>
          {participant.isMuted && (
            <div
              style={{
                padding: '4px 6px',
                background: 'rgba(239, 68, 68, 0.9)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <MicOff size={12} color="#FFFFFF" />
            </div>
          )}
        </div>
      </div>

      {/* Connection Quality Indicator */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '6px',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {participant.connectionQuality || 'Good'}
        </div>
      )}
    </div>
  );
});

export default function GroupCallInterface({
  channelName,
  participants = [],
  localParticipant,
  onLeave,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSpeaker,
  isMicMuted,
  isVideoOff,
  isScreenSharing,
  isSpeakerMuted,
}) {
  const [layout, setLayout] = useState('grid'); // grid | spotlight | sidebar
  const [showSettings, setShowSettings] = useState(false);

  const getGridLayout = () => {
    const count = participants.length;
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    if (count <= 16) return { cols: 4, rows: 4 };
    return { cols: 5, rows: Math.ceil(count / 5) };
  };

  const gridLayout = getGridLayout();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0F0F0F',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
            {channelName}
          </h2>
          <p style={{ fontSize: '13px', color: '#AAAAAA', margin: '4px 0 0' }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Layout Switcher */}
          <button
            onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Grid size={16} />
            {layout === 'grid' ? 'Grid' : 'Spotlight'}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Video Grid */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
          gap: '16px',
          alignContent: 'start',
        }}
      >
        {/* Local Participant First */}
        {localParticipant && (
          <ParticipantTile
            participant={localParticipant}
            isLocal={true}
            isSpeaking={false}
          />
        )}

        {/* Remote Participants */}
        {participants.map(participant => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            isLocal={false}
            isSpeaking={participant.isSpeaking}
          />
        ))}
      </div>

      {/* Control Bar */}
      <div
        style={{
          padding: '20px 24px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        {/* Microphone Toggle */}
        <button
          onClick={onToggleMic}
          style={{
            width: '56px',
            height: '56px',
            background: isMicMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          style={{
            width: '56px',
            height: '56px',
            background: isVideoOff ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          style={{
            width: '56px',
            height: '56px',
            background: isScreenSharing ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Monitor size={24} />
        </button>

        {/* Speaker Toggle */}
        <button
          onClick={onToggleSpeaker}
          style={{
            width: '56px',
            height: '56px',
            background: isSpeakerMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isSpeakerMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        {/* Leave Call */}
        <button
          onClick={onLeave}
          style={{
            width: '56px',
            height: '56px',
            background: '#EF4444',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            marginLeft: '24px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = '#DC2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#EF4444';
          }}
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
