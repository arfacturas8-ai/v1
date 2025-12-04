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
    // Simulate connection
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
        backgroundColor: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '48px 24px',
        color: '#FFFFFF',
      }}
    >
      {/* Participant info */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        {callStatus === 'connecting' && (
          <div style={{ fontSize: '18px', color: '#A0A0A0', marginBottom: '24px', animation: 'pulse 2s ease-in-out infinite' }}>
            Calling...
          </div>
        )}
        {callStatus === 'connected' && (
          <div style={{ fontSize: '16px', color: '#A0A0A0', marginBottom: '24px' }}>
            {formatDuration(duration)}
          </div>
        )}
        <Avatar
          src={callData.user?.avatar}
          alt={callData.user?.displayName || 'User'}
          size="xl"
          fallback={callData.user?.displayName?.[0] || 'U'}
        />
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px' }}>
          {callData.user?.displayName || 'Unknown'}
        </h1>
        <div style={{ fontSize: '16px', color: '#A0A0A0' }}>
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
            borderRadius: '12px',
            backgroundColor: '#1A1A1A',
            border: '2px solid #2A2A2A',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#666666' }}>Your video</div>
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
            backgroundColor: isMuted ? '#FF3B3B' : '#2A2A2A',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            if (!isMuted) e.currentTarget.style.backgroundColor = '#333333';
          }}
          onMouseLeave={(e) => {
            if (!isMuted) e.currentTarget.style.backgroundColor = '#2A2A2A';
          }}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {callData.type === 'video' && (
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isVideoOn ? '#2A2A2A' : '#FF3B3B',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (isVideoOn) e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              if (isVideoOn) e.currentTarget.style.backgroundColor = '#2A2A2A';
            }}
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}

        {callData.type === 'video' && isVideoOn && (
          <button
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#2A2A2A',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2A2A2A';
            }}
          >
            <Camera size={24} />
          </button>
        )}

        <button
          onClick={handleEndCall}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#FF3B3B',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease-out',
            transform: 'scale(1.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#CC2F2F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FF3B3B';
          }}
        >
          <PhoneOff size={28} />
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
