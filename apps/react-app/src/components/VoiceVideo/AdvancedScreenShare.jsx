import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Square, Circle, Type, Pen, Highlighter, ArrowRight, Trash2, Eye, EyeOff, Download, Settings, Users, X, Play, StopCircle } from 'lucide-react';

const AdvancedScreenShare = ({ onClose, onStartShare, onStopShare }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMode, setShareMode] = useState('screen'); // 'screen', 'window', 'tab'
  const [includeAudio, setIncludeAudio] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [layers, setLayers] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const startScreenShare = async () => {
    try {
      const displayMediaOptions = {
        video: {
          cursor: 'always',
          displaySurface: shareMode
        },
        audio: includeAudio
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setIsSharing(true);
      onStartShare?.(stream);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsSharing(false);
    setIsRecording(false);
    onStopShare?.();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatRecordingTime = () => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExport = (format) => {
    console.log('Exporting as', format);
  };

  if (!isSharing) {
    return (
      <div className="relative w-full h-full bg-black text-white font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] overflow-hidden">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
          <div className="bg-[#1e293b]/90 backdrop-blur-[20px] rounded-2xl p-10 text-center border border-[#334155]/50 min-w-[500px]">
            <h3 className="m-0 mb-2 text-2xl font-semibold text-white">Share Your Screen</h3>
            <p className="m-0 mb-8 text-[#94a3b8] text-base">Choose what you'd like to share</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { mode: 'screen', icon: Monitor, label: 'Entire Screen' },
                { mode: 'window', icon: Square, label: 'Window' },
                { mode: 'tab', icon: Type, label: 'Browser Tab' }
              ].map(({ mode, icon: Icon, label }) => (
                <div
                  key={mode}
                  onClick={() => setShareMode(mode)}
                  className={`bg-[#334155]/50 border-2 ${shareMode === mode ? 'border-[#58a6ff] bg-[#3b82f6]/20 text-white' : 'border-[#475569]/50 text-[#cbd5e1]'} rounded-xl px-4 py-6 cursor-pointer transition-all duration-300 hover:bg-[#475569]/70 hover:border-[#64748b]/70 hover:text-white hover:-translate-y-0.5 flex flex-col items-center gap-3`}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <label className="flex items-center gap-2 text-[#cbd5e1] text-sm cursor-pointer justify-center">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="accent-[#58a6ff] w-4 h-4"
                />
                Share System Audio
              </label>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={startScreenShare}
                className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer border-none transition-all duration-200 min-w-[120px] bg-[#58a6ff] text-white hover:bg-[#1a6fc7] hover:-translate-y-px"
              >
                Start Sharing
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer border-none transition-all duration-200 min-w-[120px] bg-[#334155]/80 text-[#cbd5e1] border border-[#475569]/50 hover:bg-[#475569]/90 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Video Container */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          className="w-full h-full object-contain"
        />
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 w-full h-full z-10 ${currentTool ? 'pointer-events-auto' : 'pointer-events-none'}`}
        />
      </div>

      {/* Annotation Toolbar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 backdrop-blur-[20px] rounded-xl px-4 py-3 flex items-center gap-4 border border-[#334155]/50 z-[100] transition-all duration-300">
        {/* Drawing Tools */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50">
          {[
            { tool: 'pen', icon: Pen },
            { tool: 'highlighter', icon: Highlighter },
            { tool: 'text', icon: Type },
            { tool: 'arrow', icon: ArrowRight },
            { tool: 'rectangle', icon: Square },
            { tool: 'circle', icon: Circle }
          ].map(({ tool, icon: Icon }) => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              className={`bg-[#334155]/60 border-none rounded-lg ${currentTool === tool ? 'bg-[#a371f7] text-white' : 'text-[#cbd5e1]'} cursor-pointer flex items-center justify-center w-8 h-8 transition-all duration-200 hover:bg-[#475569]/80 hover:text-white`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50">
          <input
            type="color"
            value={annotationColor}
            onChange={(e) => setAnnotationColor(e.target.value)}
            className="w-8 h-8 border-none rounded-md cursor-pointer bg-none"
          />
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50 w-20">
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(e.target.value)}
            className="w-full h-1 bg-[#334155]/80 rounded-sm outline-none appearance-none cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50">
          <button className="bg-[#334155]/60 border-none rounded-lg text-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-[#475569]/80 hover:text-white">
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        {/* Recording */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50">
          <button
            onClick={toggleRecording}
            className={`border-none rounded-lg text-white cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 ${isRecording ? 'bg-[#dc2626] ' : 'bg-[#334155]/60 hover:bg-[#475569]/80'}`}
          >
            {isRecording ? <StopCircle size={14} /> : <Play size={14} />}
            {isRecording ? formatRecordingTime() : 'Record'}
          </button>
        </div>

        {/* Collaboration */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50">
          <button
            onClick={() => setShowCollabPanel(!showCollabPanel)}
            className="bg-[#334155]/60 border-none rounded-lg text-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-[#475569]/80 hover:text-white relative"
          >
            <Users size={14} />
            <span className="bg-[#22c55e] text-white rounded-full text-[10px] font-semibold min-w-[16px] h-4 flex items-center justify-center ml-1">
              {collaborators.length}
            </span>
          </button>
        </div>

        {/* Export */}
        <div className="flex items-center gap-2 pr-4 border-r border-[#334155]/50 relative group">
          <button className="bg-[#334155]/60 border-none rounded-lg text-[#cbd5e1] cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-[#475569]/80 hover:text-white">
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Stop Sharing */}
        <button
          onClick={stopScreenShare}
          className="bg-[#dc2626] text-white border-none rounded-lg cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-[#b91c1c]"
        >
          <X size={14} />
          Stop Sharing
        </button>
      </div>

      {/* Collaboration Panel */}
      {showCollabPanel && (
        <div className="absolute top-0 right-0 bottom-0 w-[300px] bg-[#0f172a]/95 backdrop-blur-[20px] border-l border-[#334155]/50 z-[150] flex flex-col">
          <div className="px-5 py-5 border-b border-[#334155]/50 flex justify-between items-center">
            <h4 className="m-0 text-base font-semibold text-white">Collaborators</h4>
            <button
              onClick={() => setShowCollabPanel(false)}
              className="bg-transparent border-none text-[#94a3b8] cursor-pointer p-1 rounded transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6 pb-4 border-b border-[#334155]/50">
              <label className="flex items-center gap-2 text-[#cbd5e1] text-sm cursor-pointer">
                <input type="checkbox" className="accent-[#58a6ff] w-4 h-4" />
                Allow annotations from all
              </label>
            </div>
            <h5 className="m-0 mb-4 text-sm font-semibold text-[#cbd5e1] uppercase tracking-wider">Active ({collaborators.length})</h5>
            {collaborators.length === 0 && (
              <p className="text-sm text-[#64748b] text-center py-4">No collaborators yet</p>
            )}
          </div>
        </div>
      )}

      {/* Layers Panel */}
      {showLayersPanel && (
        <div className="absolute top-0 right-0 bottom-0 w-[300px] bg-[#0f172a]/95 backdrop-blur-[20px] border-l border-[#334155]/50 z-[150] flex flex-col">
          <div className="px-5 py-5 border-b border-[#334155]/50 flex justify-between items-center">
            <h4 className="m-0 text-base font-semibold text-white">Layers</h4>
            <button
              onClick={() => setShowLayersPanel(false)}
              className="bg-transparent border-none text-[#94a3b8] cursor-pointer p-1 rounded transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <h5 className="m-0 mb-3 text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Annotations</h5>
            {layers.length === 0 && (
              <p className="text-sm text-[#64748b] text-center py-4">No layers yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedScreenShare;
