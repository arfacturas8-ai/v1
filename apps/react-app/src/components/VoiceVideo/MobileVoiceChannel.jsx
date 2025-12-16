import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Headphones, Volume2, VolumeX, PhoneOff, Minimize2, X, Wifi, WifiOff, Battery } from 'lucide-react';

const MobileVoiceChannel = ({ roomTitle, participants: initialParticipants = [], onLeave, onMinimize }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState(initialParticipants);
  const [speakingParticipants, setSpeakingParticipants] = useState(new Set());
  const [connectionQuality, setConnectionQuality] = useState('excellent'); // excellent, good, fair, poor, none
  const [isConnected, setIsConnected] = useState(true);
  const [batteryOptimized, setBatteryOptimized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showToastMessage(isMuted ? 'Unmuted' : 'Muted');
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    if (!isDeafened) {
      setIsMuted(true);
    }
    showToastMessage(isDeafened ? 'Undeafened' : 'Deafened');
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize?.();
  };

  const handleClose = () => {
    onLeave?.();
  };

  const getConnectionClass = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'bg-[#00d2d3] shadow-[0_0_8px_rgba(0,210,211,0.5)]';
      case 'good':
        return 'bg-[#5865f2] shadow-[0_0_8px_rgba(88,101,242,0.5)]';
      case 'fair':
        return 'bg-[#f39c12] shadow-[0_0_8px_rgba(243,156,18,0.5)]';
      case 'poor':
        return 'bg-[#ff4757] shadow-[0_0_8px_rgba(255,71,87,0.5)]';
      default:
        return 'bg-[#7f8c8d]';
    }
  };

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{borderColor: "var(--border-default)"}} className="fixed top-[50px] right-4 w-[280px] /90 backdrop-blur-[20px] rounded-[20px] border  cursor-pointer z-[9999]  transition-all duration-300 hover:scale-105"
      >
        <div className="flex items-center gap-3 p-4">
          <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
            <Volume2 size={24} style={{color: "var(--text-primary)"}} className="" />
          </div>

          <div className="flex-1 flex flex-col gap-0.5">
            <div style={{color: "var(--text-primary)"}} className="text-sm font-semibold  whitespace-nowrap overflow-hidden text-ellipsis">
              {roomTitle}
            </div>
            <div className="text-xs text-[#b0b3b8]">
              {participants.length + 1} participants
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`w-9 h-9 rounded-full border-none text-base cursor-pointer transition-all duration-200 flex items-center justify-center ${isMuted ? 'bg-[#ff4757]/80' : 'bg-white/10'} text-white`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-['-apple-system',BlinkMacSystemFont,'Segoe_UI','Roboto',sans-serif] relative overflow-hidden select-none ${batteryOptimized ? 'bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a]' : ''}`}>
      {/* Header */}
      <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center px-5 py-4 bg-white/10 backdrop-blur-[20px] border-b  min-h-[60px]">
        <div className="flex-1">
          <h2 style={{color: "var(--text-primary)"}} className="text-lg font-semibold m-0 mb-1  whitespace-nowrap overflow-hidden text-ellipsis">
            {roomTitle}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full relative ${getConnectionClass()}`}></div>
            {isConnected ? (
              <Wifi size={24} style={{color: "var(--text-primary)"}} className="/60" />
            ) : (
              <WifiOff size={24} className="text-[#ff4757]" />
            )}
            {batteryOptimized && (
              <Battery size={24} className="text-[#f39c12]" />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMinimize}
            style={{color: "var(--text-primary)"}} className="w-9 h-9 border-none rounded-full bg-white/10  cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-white/20"
          >
            <Minimize2 size={24} />
          </button>
          <button
            onClick={handleClose}
            style={{color: "var(--text-primary)"}} className="w-9 h-9 border-none rounded-full bg-white/10  cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-[#ff4757]/80"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 max-w-full">
          {participants.map((participant, idx) => (
            <div
              key={participant.id || idx}
              className={`flex flex-col items-center px-3 py-4 bg-white/5 rounded-2xl transition-all duration-300 relative min-h-[120px] ${speakingParticipants.has(participant.id) ? 'bg-[#00d2d3]/15 border-2 border-[#00d2d3] shadow-[0_0_20px_rgba(0,210,211,0.3)] ' : ''}`}
            >
              <div style={{ width: "80px", height: "80px", flexShrink: 0 }}>
                {participant.avatar ? (
                  <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                ) : (
                  <div style={{color: "var(--text-primary)"}} className="w-full h-full flex items-center justify-center  font-semibold text-2xl bg-gradient-to-br from-[#5865f2] to-[#7289da]">
                    {participant.name?.charAt(0) || '?'}
                  </div>
                )}
                {speakingParticipants.has(participant.id) && (
                  <div style={{ width: "24px", height: "24px", flexShrink: 0 }}></div>
                )}
              </div>

              <div className="text-center w-full">
                <div style={{color: "var(--text-primary)"}} className="text-sm font-medium  mb-1 whitespace-nowrap overflow-hidden text-ellipsis block">
                  {participant.name}
                </div>
                <div className="flex justify-center gap-1">
                  {participant.isMuted && (
                    <MicOff size={24} className="text-[#ff4757] opacity-80" />
                  )}
                  {participant.isDeafened && (
                    <VolumeX size={24} className="text-[#f39c12] opacity-80" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{borderColor: "var(--border-subtle)"}} className="px-5 py-5 bg-white/5 backdrop-blur-[20px] border-t ">
        <div className="flex gap-4 mb-4">
          <button
            onClick={toggleMute}
            className={`flex-1 flex flex-col items-center justify-center gap-2 border-none rounded-[20px] ${isMuted ? 'bg-[#ff4757]/80 shadow-[0_8px_32px_rgba(255,71,87,0.3)]' : 'bg-white/10'} text-white cursor-pointer transition-all duration-200 font-['inherit'] font-medium h-20 text-sm active:scale-95`}
          >
            <span className="text-2xl">{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</span>
            <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={toggleDeafen}
            className={`flex-1 flex flex-col items-center justify-center gap-2 border-none rounded-[20px] ${isDeafened ? 'bg-[#f39c12]/80 shadow-[0_8px_32px_rgba(243,156,18,0.3)]' : 'bg-white/10'} text-white cursor-pointer transition-all duration-200 font-['inherit'] font-medium h-20 text-sm active:scale-95`}
          >
            <span className="text-2xl">{isDeafened ? <VolumeX size={24} /> : <Headphones size={24} />}</span>
            <span className="text-xs font-medium">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
          </button>
        </div>

        <div className="flex justify-center gap-5">
          <button
            onClick={handleClose}
            style={{color: "var(--text-primary)"}} className="w-14 h-14 border-none rounded-full bg-[#ff4757]/80  cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 hover:bg-[#ff4757]/90"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{background: "var(--bg-primary)"}} className="flex justify-between items-center px-5 py-3 /30 text-xs text-[#b0b3b8]">
        <div className="flex items-center gap-2">
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span className="opacity-50">•</span>
          <span>{participants.length + 1} participants</span>
        </div>
        <div>
          {batteryOptimized && (
            <div style={{color: "var(--text-primary)"}} className="bg-[#ff4757]/80 px-2 py-1 rounded-xl text-[11px]  font-semibold">
              BACKGROUND
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white px-5 py-3 rounded-[20px] text-sm font-medium z-[10000] backdrop-blur-[20px] border border-white/20 transition-all duration-300 ${showToast ? 'opacity-100 scale-100' : 'opacity-0 scale-80'}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MobileVoiceChannel;
