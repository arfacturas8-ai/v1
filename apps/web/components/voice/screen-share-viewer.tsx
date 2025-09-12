"use client";

import * as React from "react";
import { 
  Monitor, 
  MonitorOff, 
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Users,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Share2,
  X,
  Fullscreen,
  MousePointer2,
  Pencil,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
// import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ScreenShareViewerProps {
  isVisible: boolean;
  onClose: () => void;
  presenter: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  screenStream?: MediaStream;
  allowAnnotations?: boolean;
  allowRecording?: boolean;
}

interface Annotation {
  id: string;
  type: 'draw' | 'text' | 'pointer';
  x: number;
  y: number;
  data: any;
  timestamp: number;
  author: string;
}

export function ScreenShareViewer({
  isVisible,
  onClose,
  presenter,
  screenStream,
  allowAnnotations = false,
  allowRecording = false
}: ScreenShareViewerProps) {
  const { volume, setVolume } = useVoiceStore();
  const { user } = useAuthStore();

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [zoom, setZoom] = React.useState(100);
  const [showControls, setShowControls] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [annotationMode, setAnnotationMode] = React.useState<'none' | 'draw' | 'text' | 'pointer'>('none');
  const [showParticipantList, setShowParticipantList] = React.useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const recordingRef = React.useRef<MediaRecorder | null>(null);

  // Set up video stream
  React.useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Handle fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  React.useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (isVisible) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [isVisible]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            toggleFullscreen();
            e.preventDefault();
          }
          break;
        case '=':
        case '+':
          setZoom(prev => Math.min(200, prev + 10));
          e.preventDefault();
          break;
        case '-':
          setZoom(prev => Math.max(25, prev - 10));
          e.preventDefault();
          break;
        case '0':
          setZoom(100);
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, isFullscreen, onClose]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const startRecording = async () => {
    if (!screenStream) return;

    try {
      const mediaRecorder = new MediaRecorder(screenStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screen-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
      recordingRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.stop();
      recordingRef.current = null;
      setIsRecording(false);
    }
  };

  const handleAnnotationClick = (e: React.MouseEvent) => {
    if (annotationMode === 'none') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !user) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const annotation: Annotation = {
      id: Date.now().toString(),
      type: annotationMode as any,
      x,
      y,
      data: annotationMode === 'pointer' ? { duration: 3000 } : {},
      timestamp: Date.now(),
      author: user.id
    };

    setAnnotations(prev => [...prev, annotation]);

    // Auto-remove pointer annotations
    if (annotationMode === 'pointer') {
      setTimeout(() => {
        setAnnotations(prev => prev.filter(a => a.id !== annotation.id));
      }, 3000);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black text-white"
      >
        {/* Header */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar size="sm">
                    <AvatarImage src={presenter.avatar} alt={presenter.username} />
                    <AvatarFallback>
                      {presenter.displayName?.[0] || presenter.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full border-2 border-black flex items-center justify-center">
                    <Monitor className="w-2 h-2" />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-white">
                    {presenter.displayName || presenter.username}
                  </h3>
                  <p className="text-xs text-gray-400">Sharing screen</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Recording Status */}
              {isRecording && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2" />
                  Recording
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative h-full flex items-center justify-center p-4 pt-20 pb-20">
          <div 
            className="relative max-w-full max-h-full"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
          >
            {/* Video Stream */}
            <video
              ref={videoRef}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              autoPlay
              playsInline
              muted={volume === 0}
            />
            
            {/* Annotation Canvas */}
            {allowAnnotations && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onClick={handleAnnotationClick}
              />
            )}
            
            {/* Annotations Overlay */}
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${annotation.x * 100}%`,
                  top: `${annotation.y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {annotation.type === 'pointer' && (
                  <div className="relative">
                    <MousePointer2 className="w-6 h-6 text-red-500 animate-ping" />
                    <MousePointer2 className="w-6 h-6 text-red-500 absolute inset-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-white/70 hover:text-white"
                  onClick={() => setZoom(prev => Math.max(25, prev - 10))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                
                <div className="w-24">
                  {/* <Slider
                    value={[zoom]}
                    onValueChange={handleZoomChange}
                    max={200}
                    min={25}
                    step={5}
                    className="w-full"
                  /> */}
                  <div className="w-full h-2 bg-gray-600 rounded-full">
                    <div 
                      className="h-full bg-white rounded-full" 
                      style={{width: `${(zoom - 25) / 175 * 100}%`}}
                    />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-white/70 hover:text-white"
                  onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                <span className="text-xs text-white/70 min-w-[3rem]">
                  {zoom}%
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-white/70 hover:text-white"
                  onClick={() => setZoom(100)}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-3">
              {/* Volume */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setVolume(volume > 0 ? 0 : 100)}
                  >
                    {volume > 0 ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{volume > 0 ? "Mute" : "Unmute"} audio</p></TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle fullscreen (F)</p></TooltipContent>
              </Tooltip>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Annotation Tools */}
              {allowAnnotations && (
                <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8",
                          annotationMode === 'pointer' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                        )}
                        onClick={() => setAnnotationMode(annotationMode === 'pointer' ? 'none' : 'pointer')}
                      >
                        <MousePointer2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Pointer tool</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8",
                          annotationMode === 'draw' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                        )}
                        onClick={() => setAnnotationMode(annotationMode === 'draw' ? 'none' : 'draw')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Draw tool</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8",
                          annotationMode === 'text' ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                        )}
                        onClick={() => setAnnotationMode(annotationMode === 'text' ? 'none' : 'text')}
                      >
                        <Type className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Text tool</p></TooltipContent>
                  </Tooltip>
                </div>
              )}
              
              {/* Recording Controls */}
              {allowRecording && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-10 h-10 rounded-lg transition-all duration-200",
                        isRecording 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isRecording ? "Stop recording" : "Start recording"}</p></TooltipContent>
                </Tooltip>
              )}
              
              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy screen share link
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="w-4 h-4 mr-2" />
                    View participants
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Display settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="absolute top-20 left-4 text-xs text-white/50 space-y-1">
          <p>Press F for fullscreen</p>
          <p>Press +/- to zoom</p>
          <p>Press 0 to reset zoom</p>
          <p>Press ESC to exit</p>
        </div>
      </div>
    </TooltipProvider>
  );
}