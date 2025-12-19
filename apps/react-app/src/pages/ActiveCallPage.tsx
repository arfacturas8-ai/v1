/**
 * ActiveCallPage - Active call management interface
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Phone, Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, Camera } from 'lucide-react';
import { Avatar } from '../design-system/atoms/Avatar';

export default function ActiveCallPage() {
  const navigate = useNavigate();
  const { callId } = useParams();
  const location = useLocation();
  const callData = location.state || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callData.type === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      navigate('/calls');
    }, 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '48px 24px',
        color: '#000',
      }}
    >
      {/* Participant info */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        {callStatus === 'connecting' && (
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '24px', animation: 'pulse 2s ease-in-out infinite' }}>
            Calling...
          </div>
        )}
        {callStatus === 'connected' && (
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            {formatDuration(duration)}
          </div>
        )}
        <Avatar
          src={callData.user?.avatar}
          alt={callData.user?.displayName || 'User'}
          size="xl"
          fallback={callData.user?.displayName?.[0] || 'U'}
        />
        <h1 style={{ fontSize: '32px', fontWeight: '600', marginTop: '24px', marginBottom: '8px', color: '#000' }}>
          {callData.user?.displayName || 'Unknown'}
        </h1>
        <div style={{ fontSize: '16px', color: '#666' }}>
          @{callData.user?.username || 'unknown'}
        </div>
      </div>

      {/* Video preview (if video call) */}
      {isVideoOn && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '160px',
            height: '120px',
            borderRadius: '16px',
            background: '#fff',
            border: '2px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#666' }}>Your video</div>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '600px',
        }}
      >
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isMuted ? '#ef4444' : '#fff',
            color: isMuted ? '#fff' : '#000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {callData.type === 'video' && (
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: isVideoOn ? '#fff' : '#ef4444',
              color: isVideoOn ? '#000' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        )}

        {callData.type === 'video' && isVideoOn && (
          <button
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: '#fff',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Camera size={20} />
          </button>
        )}

        <button
          onClick={handleEndCall}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
            transform: 'scale(1.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1.1)';
          }}
        >
          <PhoneOff size={24} />
        </button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
