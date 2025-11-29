/**
 * CRYB Design System - Media Viewer Component
 * Advanced media viewer with zoom, carousel, and fullscreen capabilities
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Minimize,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  Info,
  Image as ImageIcon,
  Video,
  Loader2,
  AlertCircle,
  Monitor,
  FileText
} from 'lucide-react';
import { Button, IconButton } from './button';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Slider from '@radix-ui/react-slider';
// ===== MEDIA VIEWER VARIANTS =====
const viewerVariants = cva([
  'relative bg-black/95 text-white overflow-hidden',
], {
  variants: {
    mode: {
      modal: 'fixed inset-0 z-50',
      inline: 'rounded-lg',
      fullscreen: 'fixed inset-0 z-50',
    },
  },
  defaultVariants: {
    mode: 'modal',
  },
});

// ===== MEDIA INTERFACES =====
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  alt?: string;
  width?: number;
  height?: number;
  duration?: number; // in seconds
  size?: number; // in bytes
  metadata?: {
    camera?: string;
    lens?: string;
    settings?: string;
    location?: string;
    dateTaken?: Date;
    author?: string;
    copyright?: string;
  };
  downloadUrl?: string;
}

export interface MediaViewerProps {
  /** Media items to display */
  items: MediaItem[];
  /** Initially selected item index */
  initialIndex?: number;
  /** Whether viewer is open */
  open?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Viewer mode */
  mode?: VariantProps<typeof viewerVariants>['mode'];
  /** Show navigation arrows */
  showNavigation?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Show thumbnails */
  showThumbnails?: boolean;
  /** Show metadata */
  showMetadata?: boolean;
  /** Enable fullscreen */
  enableFullscreen?: boolean;
  /** Enable download */
  enableDownload?: boolean;
  /** Enable sharing */
  enableSharing?: boolean;
  /** Enable zoom for images */
  enableZoom?: boolean;
  /** Enable rotation for images */
  enableRotation?: boolean;
  /** Auto-play videos */
  autoPlay?: boolean;
  /** Loop videos */
  loop?: boolean;
  /** Muted by default */
  muted?: boolean;
  /** Keyboard navigation */
  keyboardNavigation?: boolean;
  /** Gesture support */
  gestureSupport?: boolean;
  /** Custom actions */
  actions?: MediaAction[];
  /** Event handlers */
  onItemChange?: (index: number, item: MediaItem) => void;
  onDownload?: (item: MediaItem) => void;
  onShare?: (item: MediaItem) => void;
  onLike?: (item: MediaItem) => void;
  onComment?: (item: MediaItem) => void;
}

export interface MediaAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick: (item: MediaItem) => void;
}

// ===== MEDIA CONTROLS COMPONENT =====
const MediaControls: React.FC<{
  item: MediaItem;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onFullscreen?: () => void;
}> = ({ 
  item,
  isPlaying, 
  isMuted, 
  volume, 
  currentTime, 
  duration,
  onPlayPause,
  onMuteToggle,
  onVolumeChange,
  onSeek,
  onFullscreen
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
  position: 'absolute',
  padding: '24px'
}}>
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider.Root
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={([value]) => onSeek(value)}
            style={{
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '20px'
}}
          >
            <Slider.Track style={{
  position: 'relative',
  borderRadius: '50%',
  height: '4px'
}}>
              <Slider.Range style={{
  position: 'absolute',
  borderRadius: '50%',
  height: '100%'
}} />
            </Slider.Track>
            <Slider.Thumb style={{
  display: 'block',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
          </Slider.Root>
          
          <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  color: '#ffffff'
}}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {/* Play/Pause */}
            <IconButton
              icon={isPlaying ? <Pause /> : <Play />}
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              style={{
  color: '#ffffff'
}}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            />

            {/* Skip Back */}
            <IconButton
              icon={<SkipBack />}
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              style={{
  color: '#ffffff'
}}
              aria-label="Skip back 10 seconds"
            />

            {/* Skip Forward */}
            <IconButton
              icon={<SkipForward />}
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              style={{
  color: '#ffffff'
}}
              aria-label="Skip forward 10 seconds"
            />

            {/* Volume */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <IconButton
                icon={isMuted ? <VolumeX /> : <Volume2 />}
                variant="ghost"
                size="icon-sm"
                onClick={onMuteToggle}
                style={{
  color: '#ffffff'
}}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              />
              
              <Slider.Root
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={([value]) => onVolumeChange(value)}
                style={{
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '80px',
  height: '20px'
}}
              >
                <Slider.Track style={{
  position: 'relative',
  borderRadius: '50%',
  height: '4px'
}}>
                  <Slider.Range style={{
  position: 'absolute',
  borderRadius: '50%',
  height: '100%'
}} />
                </Slider.Track>
                <Slider.Thumb style={{
  display: 'block',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
              </Slider.Root>
            </div>
          </div>

          {/* Right Side Controls */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {/* Fullscreen */}
            {onFullscreen && (
              <IconButton
                icon={<Maximize2 />}
                variant="ghost"
                size="icon-sm"
                onClick={onFullscreen}
                style={{
  color: '#ffffff'
}}
                aria-label="Fullscreen"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== IMAGE VIEWER COMPONENT =====
const ImageViewer: React.FC<{
  item: MediaItem;
  enableZoom?: boolean;
  enableRotation?: boolean;
  gestureSupport?: boolean;
}> = ({ item, enableZoom = true, enableRotation = true, gestureSupport = true }) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    x.set(0);
    y.set(0);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation(prev => prev + (direction === 'cw' ? 90 : -90));
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale > 1) {
      setPosition(prev => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y,
      }));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableZoom) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  React.useEffect(() => {
    resetTransform();
    setIsLoading(true);
    setHasError(false);
  }, [item.url]);

  return (
    <div style={{
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      {/* Loading State */}
      {isLoading && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <Loader2 style={{
  height: '32px',
  width: '32px',
  color: '#ffffff'
}} />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  textAlign: 'center',
  color: '#ffffff'
}}>
            <AlertCircle style={{
  height: '48px',
  width: '48px'
}} />
            <p>Failed to load image</p>
          </div>
        </div>
      )}

      {/* Image */}
      <div
        drag={scale > 1 && gestureSupport}
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        onPan={handlePan}
        style={{
          scale,
          rotate: rotation,
          x: position.x,
          y: position.y,
        }}
        className="cursor-grab active:cursor-grabbing"}
      >
        <img
          src={item.url}
          alt={item.alt || item.title}
          className="max-w-full max-h-full object-contain select-none"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onWheel={handleWheel}
          draggable={false}
        />
      </div>

      {/* Image Controls */}
      {(enableZoom || enableRotation) && !isLoading && !hasError && (
        <div style={{
  position: 'absolute'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  padding: '8px'
}}>
            {enableZoom && (
              <>
                <IconButton
                  icon={<ZoomOut />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomOut}
                  style={{
  color: '#ffffff'
}}
                  aria-label="Zoom out"
                />
                <span style={{
  color: '#ffffff',
  textAlign: 'center'
}}>
                  {Math.round(scale * 100)}%
                </span>
                <IconButton
                  icon={<ZoomIn />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomIn}
                  style={{
  color: '#ffffff'
}}
                  aria-label="Zoom in"
                />
              </>
            )}

            {enableRotation && (
              <>
                <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}} />
                <IconButton
                  icon={<RotateCcw />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRotate('ccw')}
                  style={{
  color: '#ffffff'
}}
                  aria-label="Rotate counter-clockwise"
                />
                <IconButton
                  icon={<RotateCw />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRotate('cw')}
                  style={{
  color: '#ffffff'
}}
                  aria-label="Rotate clockwise"
                />
              </>
            )}

            <div style={{
  height: '24px',
  marginLeft: '4px',
  marginRight: '4px'
}} />
            <IconButton
              icon={<Monitor />}
              variant="ghost"
              size="icon-sm"
              onClick={resetTransform}
              style={{
  color: '#ffffff'
}}
              aria-label="Fit to screen"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ===== VIDEO VIEWER COMPONENT =====
const VideoViewer: React.FC<{
  item: MediaItem;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onFullscreen?: () => void;
}> = ({ item, autoPlay = false, loop = false, muted = true, onFullscreen }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [isMuted, setIsMuted] = React.useState(muted);
  const [volume, setVolume] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
  };

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  return (
    <div style={{
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      {/* Loading State */}
      {isLoading && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <Loader2 style={{
  height: '32px',
  width: '32px',
  color: '#ffffff'
}} />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  textAlign: 'center',
  color: '#ffffff'
}}>
            <AlertCircle style={{
  height: '48px',
  width: '48px'
}} />
            <p>Failed to load video</p>
          </div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={item.url}
        poster={item.thumbnail}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        className="max-w-full max-h-full object-contain"
        onClick={handlePlayPause}
      />

      {/* Video Controls */}
      {!hasError && (
        <MediaControls
          item={item}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handlePlayPause}
          onMuteToggle={handleMuteToggle}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
          onFullscreen={onFullscreen}
        />
      )}
    </div>
  );
};

// ===== THUMBNAIL NAVIGATION =====
const ThumbnailNavigation: React.FC<{
  items: MediaItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
}> = ({ items, currentIndex, onSelect }) => {
  const thumbnailsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (thumbnailsRef.current) {
      const currentThumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (currentThumbnail) {
        currentThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentIndex]);

  return (
    <div style={{
  position: 'absolute',
  padding: '16px'
}}>
      <div
        ref={thumbnailsRef}
        style={{
  display: 'flex',
  gap: '8px'
}}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(index)}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
              currentIndex === index
                ? 'border-white shadow-lg'
                : 'border-white/30 hover:border-white/60'
            )}
          >
            {item.type === 'image' ? (
              <img
                src={item.thumbnail || item.url}
                alt={item.alt || item.title}
                style={{
  width: '100%',
  height: '100%'
}}
              />
            ) : item.type === 'video' ? (
              <div style={{
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.alt || item.title}
                    style={{
  width: '100%',
  height: '100%'
}}
                  />
                ) : (
                  <Video style={{
  height: '24px',
  width: '24px',
  color: '#ffffff'
}} />
                )}
                <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Play style={{
  height: '16px',
  width: '16px',
  color: '#ffffff'
}} />
                </div>
              </div>
            ) : (
              <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <ImageIcon style={{
  height: '24px',
  width: '24px',
  color: '#ffffff'
}} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ===== MEDIA METADATA PANEL =====
const MediaMetadataPanel: React.FC<{
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
}> = ({ item, isOpen, onClose }) => {
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) {
      return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
  position: 'absolute',
  width: '320px',
  height: '100%'
}}
    >
      <div style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Media Info</h3>
          <IconButton
            icon={<X />}
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            style={{
  color: '#ffffff'
}}
          />
        </div>

        <div className="space-y-6 text-sm">
          {/* Basic Info */}
          <div>
            <h4 style={{
  color: '#ffffff',
  fontWeight: '500'
}}>Details</h4>
            <div style={{
  color: '#ffffff'
}}>
              {item.title && (
                <div>
                  <span style={{
  color: '#ffffff'
}}>Title:</span>
                  <br />
                  {item.title}
                </div>
              )}
              {item.description && (
                <div>
                  <span style={{
  color: '#ffffff'
}}>Description:</span>
                  <br />
                  {item.description}
                </div>
              )}
              <div>
                <span style={{
  color: '#ffffff'
}}>Type:</span> {item.type}
              </div>
              {item.size && (
                <div>
                  <span style={{
  color: '#ffffff'
}}>Size:</span> {formatFileSize(item.size)}
                </div>
              )}
              {item.duration && (
                <div>
                  <span style={{
  color: '#ffffff'
}}>Duration:</span> {formatDuration(item.duration)}
                </div>
              )}
              {item.width && item.height && (
                <div>
                  <span style={{
  color: '#ffffff'
}}>Dimensions:</span> {item.width} × {item.height}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {item.metadata && (
            <div>
              <h4 style={{
  color: '#ffffff',
  fontWeight: '500'
}}>Metadata</h4>
              <div style={{
  color: '#ffffff'
}}>
                {item.metadata.camera && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Camera:</span>
                    <br />
                    {item.metadata.camera}
                  </div>
                )}
                {item.metadata.lens && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Lens:</span>
                    <br />
                    {item.metadata.lens}
                  </div>
                )}
                {item.metadata.settings && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Settings:</span>
                    <br />
                    {item.metadata.settings}
                  </div>
                )}
                {item.metadata.location && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Location:</span>
                    <br />
                    {item.metadata.location}
                  </div>
                )}
                {item.metadata.dateTaken && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Date Taken:</span>
                    <br />
                    {item.metadata.dateTaken.toLocaleDateString()}
                  </div>
                )}
                {item.metadata.author && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Author:</span>
                    <br />
                    {item.metadata.author}
                  </div>
                )}
                {item.metadata.copyright && (
                  <div>
                    <span style={{
  color: '#ffffff'
}}>Copyright:</span>
                    <br />
                    {item.metadata.copyright}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== MAIN MEDIA VIEWER COMPONENT =====
const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialIndex = 0,
  open = false,
  onClose,
  mode = 'modal',
  showNavigation = true,
  showToolbar = true,
  showThumbnails = true,
  showMetadata = false,
  enableFullscreen = true,
  enableDownload = true,
  enableSharing = true,
  enableZoom = true,
  enableRotation = true,
  autoPlay = false,
  loop = false,
  muted = true,
  keyboardNavigation = true,
  gestureSupport = true,
  actions = [],
  onItemChange,
  onDownload,
  onShare,
  onLike,
  onComment,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = React.useState(false);

  const currentItem = items[currentIndex];

  const goToPrevious = React.useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    setCurrentIndex(newIndex);
    onItemChange?.(newIndex, items[newIndex]);
  }, [currentIndex, items, onItemChange]);

  const goToNext = React.useCallback(() => {
    const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onItemChange?.(newIndex, items[newIndex]);
  }, [currentIndex, items, onItemChange]);

  const goToIndex = React.useCallback((index: number) => {
    setCurrentIndex(index);
    onItemChange?.(index, items[index]);
  }, [items, onItemChange]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!keyboardNavigation || !open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case ' ':
          e.preventDefault();
          // Toggle play/pause for videos
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation, open, goToPrevious, goToNext, onClose]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!open || !currentItem) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
  position: 'fixed'
}} />
        <Dialog.Content className={cn(viewerVariants({ mode }))}>
          {/* Toolbar */}
          {showToolbar && (
            <div style={{
  position: 'absolute',
  padding: '24px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <span style={{
  color: '#ffffff',
  fontWeight: '500'
}}>
                    {currentIndex + 1} / {items.length}
                  </span>
                  {currentItem.title && (
                    <span style={{
  color: '#ffffff'
}}>{currentItem.title}</span>
                  )}
                </div>

                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  {/* Custom Actions */}
                  {actions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <IconButton
                        key={action.id}
                        icon={<IconComponent />}
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => action.onClick(currentItem)}
                        style={{
  color: '#ffffff'
}}
                        aria-label={action.label}
                      />
                    );
                  })}

                  {/* Built-in Actions */}
                  {onLike && (
                    <IconButton
                      icon={<Heart />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onLike(currentItem)}
                      style={{
  color: '#ffffff'
}}
                      aria-label="Like"
                    />
                  )}

                  {onComment && (
                    <IconButton
                      icon={<MessageCircle />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onComment(currentItem)}
                      style={{
  color: '#ffffff'
}}
                      aria-label="Comment"
                    />
                  )}

                  {enableSharing && onShare && (
                    <IconButton
                      icon={<Share2 />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onShare(currentItem)}
                      style={{
  color: '#ffffff'
}}
                      aria-label="Share"
                    />
                  )}

                  {enableDownload && (onDownload || currentItem.downloadUrl) && (
                    <IconButton
                      icon={<Download />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (onDownload) {
                          onDownload(currentItem);
                        } else if (currentItem.downloadUrl) {
                          window.open(currentItem.downloadUrl, '_blank');
                        }
                      }}
                      style={{
  color: '#ffffff'
}}
                      aria-label="Download"
                    />
                  )}

                  {showMetadata && (
                    <IconButton
                      icon={<Info />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                      style={{
  color: '#ffffff'
}}
                      aria-label="Info"
                    />
                  )}

                  {enableFullscreen && (
                    <IconButton
                      icon={isFullscreen ? <Minimize /> : <Maximize />}
                      variant="ghost"
                      size="icon-sm"
                      onClick={toggleFullscreen}
                      style={{
  color: '#ffffff'
}}
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    />
                  )}

                  <IconButton
                    icon={<X />}
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    style={{
  color: '#ffffff'
}}
                    aria-label="Close"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          {showNavigation && items.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                style={{
  position: 'absolute',
  padding: '8px',
  borderRadius: '50%',
  color: '#ffffff'
}}
                aria-label="Previous media"
              >
                <ChevronLeft style={{
  height: '24px',
  width: '24px'
}} />
              </button>
              
              <button
                onClick={goToNext}
                style={{
  position: 'absolute',
  padding: '8px',
  borderRadius: '50%',
  color: '#ffffff'
}}
                aria-label="Next media"
              >
                <ChevronRight style={{
  height: '24px',
  width: '24px'
}} />
              </button>
            </>
          )}

          {/* Media Content */}
          <div style={{
  width: '100%',
  height: '100%'
}}>
            {currentItem.type === 'image' && (
              <ImageViewer
                item={currentItem}
                enableZoom={enableZoom}
                enableRotation={enableRotation}
                gestureSupport={gestureSupport}
              />
            )}

            {currentItem.type === 'video' && (
              <VideoViewer
                item={currentItem}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                onFullscreen={enableFullscreen ? toggleFullscreen : undefined}
              />
            )}

            {(currentItem.type === 'audio' || currentItem.type === 'document') && (
              <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <div style={{
  textAlign: 'center',
  color: '#ffffff'
}}>
                  <div className="mb-4">
                    {currentItem.type === 'audio' ? (
                      <Volume2 style={{
  height: '64px',
  width: '64px',
  color: '#ffffff'
}} />
                    ) : (
                      <FileText style={{
  height: '64px',
  width: '64px',
  color: '#ffffff'
}} />
                    )}
                  </div>
                  <h3 style={{
  fontWeight: '500'
}}>
                    {currentItem.title || 'Untitled'}
                  </h3>
                  {currentItem.description && (
                    <p style={{
  color: '#ffffff'
}}>{currentItem.description}</p>
                  )}
                  {(enableDownload && currentItem.downloadUrl) && (
                    <Button
                      onClick={() => window.open(currentItem.downloadUrl, '_blank')}
                      style={{
  color: '#ffffff'
}}
                    >
                      <Download style={{
  height: '16px',
  width: '16px'
}} />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {showThumbnails && items.length > 1 && (
            <ThumbnailNavigation
              items={items}
              currentIndex={currentIndex}
              onSelect={goToIndex}
            />
          )}

          {/* Metadata Panel */}
          
            {showMetadataPanel && (
              <MediaMetadataPanel
                item={currentItem}
                isOpen={showMetadataPanel}
                onClose={() => setShowMetadataPanel(false)}
              />
            )}
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ===== EXPORTS =====
export { 
  MediaViewer, 
  ImageViewer, 
  VideoViewer, 
  MediaControls,
  ThumbnailNavigation,
  MediaMetadataPanel
};

export type { 
  MediaViewerProps, 
  MediaItem, 
  MediaAction 
};