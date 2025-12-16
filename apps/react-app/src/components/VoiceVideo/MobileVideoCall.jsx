import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Camera, CameraOff, RotateCw, Grid3x3, Maximize2 } from 'lucide-react';

const MobileVideoCall = ({ roomId, participants: initialParticipants = [], onLeave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState(initialParticipants);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [layout, setLayout] = useState('grid'); // 'grid' or 'speaker'
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState(5);
  const [networkQuality, setNetworkQuality] = useState('high');
  const [isPipMode, setIsPipMode] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    initializeCall();
    return () => cleanupCall();
  }, []);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to access media devices:', error);
      setIsLoading(false);
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = async () => {
    try {
      const newFacingMode = isFrontCamera ? 'environment' : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsFrontCamera(!isFrontCamera);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const getConnectionQualityColor = () => {
    if (connectionQuality === 5) return 'bg-[#00d2d3] shadow-[0_0_6px_rgba(0,210,211,0.5)]';
    if (connectionQuality === 4) return 'bg-[#5865f2] shadow-[0_0_6px_rgba(88,101,242,0.5)]';
    if (connectionQuality === 3) return 'bg-[#f39c12] shadow-[0_0_6px_rgba(243,156,18,0.5)]';
    return 'bg-[#ff4757] shadow-[0_0_6px_rgba(255,71,87,0.5)]';
  };

  const getNetworkQualityClass = () => {
    if (networkQuality === 'high') return 'bg-[#00d2d3]/30 text-[#00d2d3]';
    if (networkQuality === 'medium') return 'bg-[#f39c12]/30 text-[#f39c12]';
    return 'bg-[#ff4757]/30 text-[#ff4757]';
  };

  if (isLoading) {
    return (
      <div style={{color: "var(--text-primary)"}} className="flex flex-col justify-center items-center h-screen   gap-5">
        <div className="w-10 h-10 border-3 border-white/30 border-t-[#5865f2] rounded-full "></div>
        <p>Loading video call...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-black text-white font-['-apple-system',BlinkMacSystemFont,'Segoe_UI','Roboto',sans-serif] relative overflow-hidden select-none ${isPipMode ? 'pip-mode' : ''}`}>
      {/* Status Bar */}
      {!isPipMode && (
        <div style={{background: "var(--bg-primary)"}} className="flex justify-between items-center px-4 py-3 /80 backdrop-blur-[10px] absolute top-0 left-0 right-0 z-[100] text-sm">
          <div className="flex flex-col gap-0.5">
            <div style={{color: "var(--text-primary)"}} className="font-semibold ">{roomId}</div>
            <div className="text-xs text-[#b0b3b8]">{participants.length + 1} participants</div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionQualityColor()}`}></div>
            <div className={`text-[10px] px-1.5 py-0.5 rounded-lg font-semibold ${getNetworkQualityClass()}`}>
              {networkQuality.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {layout === 'grid' ? (
          <div className={`grid h-full gap-0.5 p-0.5 ${participants.length === 0 ? 'grid-cols-1' : participants.length === 1 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {/* Local Video */}
            <div className="relative bg-[#2c2f33] rounded-lg overflow-hidden border-2 border-[#5865f2]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{background: "var(--bg-primary)"}} className="w-full h-full object-cover "
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-[#2c2f33] flex items-center justify-center">
                  <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full bg-[#5865f2] flex items-center justify-center  font-semibold text-2xl">
                    U
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 flex justify-between items-end opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                  <span style={{color: "var(--text-primary)"}} className="text-sm font-semibold  drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">You</span>
                  {isMuted && <MicOff size={12} className="text-[#ff4757]" />}
                </div>
              </div>
            </div>

            {/* Remote Videos */}
            {participants.map((participant, idx) => (
              <div key={participant.id || idx} className={`relative bg-[#2c2f33] rounded-lg overflow-hidden ${participant.isActiveSpeaker ? 'border-2 border-[#00d2d3] shadow-[0_0_20px_rgba(0,210,211,0.3)]' : ''}`}>
                <video
                  ref={el => remoteVideoRefs.current[participant.id] = el}
                  autoPlay
                  playsInline
                  style={{background: "var(--bg-primary)"}} className="w-full h-full object-cover "
                />
                {!participant.videoEnabled && (
                  <div className="absolute inset-0 bg-[#2c2f33] flex items-center justify-center">
                    <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full bg-[#5865f2] flex items-center justify-center  font-semibold text-2xl">
                      {participant.name?.charAt(0) || '?'}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 flex justify-between items-end opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2">
                    <span style={{color: "var(--text-primary)"}} className="text-sm font-semibold  drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{participant.name}</span>
                    {!participant.audioEnabled && <MicOff size={12} className="text-[#ff4757]" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Main Speaker */}
            <div className="flex-1 relative">
              <video
                ref={activeSpeaker ? el => remoteVideoRefs.current[activeSpeaker.id] = el : localVideoRef}
                autoPlay
                muted={!activeSpeaker}
                playsInline
                style={{background: "var(--bg-primary)"}} className="w-full h-full object-cover "
              />
            </div>

            {/* Thumbnail Strip */}
            <div style={{background: "var(--bg-primary)"}} className="flex gap-2 px-4 py-2 /80 overflow-x-auto">
              <div className="min-w-[80px] w-20 h-15 rounded-lg overflow-hidden relative cursor-pointer transition-transform hover:scale-105 border-2 border-[#5865f2]">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
              {participants.map(p => (
                <div key={p.id} className="min-w-[80px] w-20 h-15 rounded-lg overflow-hidden relative cursor-pointer transition-transform hover:scale-105">
                  <video ref={el => remoteVideoRefs.current[p.id] = el} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isPipMode && (
        <div style={{background: "var(--bg-primary)"}} className="px-5 py-5 /90 backdrop-blur-[20px] flex flex-col gap-4">
          <div className="flex justify-center gap-5">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 border-none rounded-full ${isMuted ? 'bg-[#ff4757]/80 shadow-[0_8px_32px_rgba(255,71,87,0.3)]' : 'bg-white/10'} text-white cursor-pointer transition-all duration-200 flex items-center justify-center text-2xl active:scale-95 hover:scale-105 hover:bg-white/20`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>

            <button
              onClick={toggleVideo}
              className={`w-14 h-14 border-none rounded-full ${isVideoOff ? 'bg-[#ff4757]/80 shadow-[0_8px_32px_rgba(255,71,87,0.3)]' : 'bg-white/10'} text-white cursor-pointer transition-all duration-200 flex items-center justify-center text-2xl active:scale-95 hover:scale-105 hover:bg-white/20`}
            >
              {isVideoOff ? <VideoOff /> : <Video />}
            </button>

            <button
              onClick={() => onLeave()}
              style={{color: "var(--text-primary)"}} className="w-14 h-14 border-none rounded-full bg-[#ff4757]/80  cursor-pointer transition-all duration-200 flex items-center justify-center text-2xl active:scale-95 hover:bg-[#ff4757]/90"
            >
              <PhoneOff />
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={switchCamera}
              style={{color: "var(--text-primary)"}} className="w-11 h-11 border-none rounded-full bg-white/10  cursor-pointer transition-all duration-200 flex items-center justify-center text-lg active:scale-95 hover:scale-105 hover:bg-white/20"
            >
              <RotateCw size={18} />
            </button>

            <button
              onClick={() => setLayout(layout === 'grid' ? 'speaker' : 'grid')}
              style={{color: "var(--text-primary)"}} className="w-11 h-11 border-none rounded-full bg-white/10  cursor-pointer transition-all duration-200 flex items-center justify-center text-lg active:scale-95 hover:scale-105 hover:bg-white/20"
            >
              <Grid3x3 size={18} />
            </button>

            <button
              onClick={() => setIsPipMode(!isPipMode)}
              style={{color: "var(--text-primary)"}} className="w-11 h-11 border-none rounded-full bg-white/10  cursor-pointer transition-all duration-200 flex items-center justify-center text-lg active:scale-95 hover:scale-105 hover:bg-white/20"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileVideoCall;
