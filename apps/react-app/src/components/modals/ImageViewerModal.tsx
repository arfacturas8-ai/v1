/**
 * CRYB Platform - Image Viewer Modal
 * Full screen image/video viewer with zoom, swipe, and gallery navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '../ui/modal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Maximize,
  Minimize,
} from 'lucide-react';

// ===== MEDIA ITEM =====
export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  downloadUrl?: string;
}

// ===== MODAL PROPS =====
export interface ImageViewerModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Media items to display */
  media: MediaItem[];
  /** Initial media index */
  initialIndex?: number;
  /** Allow download */
  allowDownload?: boolean;
  /** Allow share */
  allowShare?: boolean;
  /** Callback when share is clicked */
  onShare?: (item: MediaItem) => void;
  /** Show image info */
  showInfo?: boolean;
}

// ===== IMAGE VIEWER MODAL COMPONENT =====
export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  open,
  onOpenChange,
  media,
  initialIndex = 0,
  allowDownload = true,
  allowShare = true,
  onShare,
  showInfo = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentItem = media[currentIndex];
  const hasMultiple = media.length > 1;

  // Reset zoom and rotation when item changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, zoom]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Swipe left/right for navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    // Swipe down to dismiss
    if (deltaY > 100 && Math.abs(deltaX) < 50) {
      onOpenChange(false);
    }

    setTouchStart(null);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Rotation handler
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Download handler
  const handleDownload = () => {
    if (!currentItem) return;

    const downloadUrl = currentItem.downloadUrl || currentItem.url;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = currentItem.title || `download-${currentItem.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share handler
  const handleShareClick = () => {
    if (currentItem) {
      onShare?.(currentItem);
    }
  };

  // Fullscreen handler
  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Pinch to zoom (for touch devices)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="full"
      variant="glass"
      overlayVariant="dark"
    >
      <div
        ref={containerRef}
        style={{background: "var(--bg-primary)"}} className="relative w-full h-full flex flex-col "
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showInfo && currentItem?.title && (
                <div style={{color: "var(--text-primary)"}} className="">
                  <h3 className="font-semibold">{currentItem.title}</h3>
                  {currentItem.description && (
                    <p style={{color: "var(--text-primary)"}} className="text-sm /70">{currentItem.description}</p>
                  )}
                </div>
              )}
              {hasMultiple && (
                <div style={{color: "var(--text-primary)"}} className="text-sm /70">
                  {currentIndex + 1} / {media.length}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div style={{background: "var(--bg-primary)"}} className="flex items-center gap-1 /50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                >
                  <ZoomOut style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </Button>
                <span style={{color: "var(--text-primary)"}} className=" text-sm min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                >
                  <ZoomIn style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </Button>
              </div>

              {/* Rotate */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                aria-label="Rotate"
              >
                <RotateCw style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                ) : (
                  <Maximize style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                )}
              </Button>

              {/* Download */}
              {allowDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                  aria-label="Download"
                >
                  <Download style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </Button>
              )}

              {/* Share */}
              {allowShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareClick}
                  style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                  aria-label="Share"
                >
                  <Share2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </Button>
              )}

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                style={{color: "var(--text-primary)"}} className=" hover:bg-white/20"
                aria-label="Close"
              >
                <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </Button>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          {currentItem?.type === 'image' ? (
            <img
              ref={imageRef}
              src={currentItem.url}
              alt={currentItem.title || 'Image'}
              className={cn(
                'max-w-full max-h-full object-contain transition-transform duration-200',
                'cursor-grab active:cursor-grabbing'
              )}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
              onClick={handleResetZoom}
              draggable={false}
            />
          ) : currentItem?.type === 'video' ? (
            <video
              src={currentItem.url}
              controls
              className="max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 z-10',
                'w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm',
                'flex items-center justify-center',
                'text-white hover:bg-black/70 transition-colors',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
              )}
              aria-label="Previous"
            >
              <ChevronLeft style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === media.length - 1}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 z-10',
                'w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm',
                'flex items-center justify-center',
                'text-white hover:bg-black/70 transition-colors',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
              )}
              aria-label="Next"
            >
              <ChevronRight style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </>
        )}

        {/* Thumbnail Gallery */}
        {hasMultiple && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all',
                    index === currentIndex
                      ? 'border-white scale-110'
                      : 'border-white/30 hover:border-white/60'
                  )}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.title || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div style={{background: "var(--bg-primary)", color: "var(--text-primary)"}} className="w-full h-full /50 flex items-center justify-center ">
                      <span className="text-2xl">▶</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImageViewerModal;
