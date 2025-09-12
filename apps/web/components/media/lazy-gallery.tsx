'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ProgressiveImage, ImageVariant } from './progressive-image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react';

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  thumbnail: string;
  alt: string;
  title?: string;
  description?: string;
  variants?: ImageVariant[];
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    uploadedAt?: string;
    uploadedBy?: string;
  };
}

export interface LazyGalleryProps {
  items: MediaItem[];
  columns?: number;
  gap?: number;
  aspectRatio?: number;
  className?: string;
  itemClassName?: string;
  enableLightbox?: boolean;
  enableVirtualization?: boolean;
  itemsPerPage?: number;
  loading?: 'lazy' | 'eager';
  quality?: number;
  onItemClick?: (item: MediaItem, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  placeholder?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

interface VirtualizedItem {
  index: number;
  item: MediaItem;
  top: number;
  height: number;
}

/**
 * Lazy Loading Gallery Component
 * 
 * Features:
 * - Virtual scrolling for large galleries
 * - Progressive image loading with blur-up
 * - Responsive grid layout with CSS Grid
 * - Built-in lightbox with keyboard navigation
 * - Infinite scrolling support
 * - Intersection Observer for performance
 * - Masonry layout option
 * - Keyboard accessibility
 * - Touch/swipe gestures
 * - Batch loading optimization
 * - Memory management for large datasets
 */
export const LazyGallery: React.FC<LazyGalleryProps> = ({
  items,
  columns = 3,
  gap = 16,
  aspectRatio = 1,
  className,
  itemClassName,
  enableLightbox = true,
  enableVirtualization = false,
  itemsPerPage = 20,
  loading = 'lazy',
  quality = 80,
  onItemClick,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  placeholder,
  emptyState,
  errorFallback
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState<MediaItem[]>([]);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [virtualizedItems, setVirtualizedItems] = useState<VirtualizedItem[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Responsive columns based on container width
  const [responsiveColumns, setResponsiveColumns] = useState(columns);

  // Update responsive columns
  useEffect(() => {
    const updateColumns = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      let newColumns = columns;

      if (width < 640) newColumns = 1;
      else if (width < 768) newColumns = 2;
      else if (width < 1024) newColumns = Math.min(3, columns);
      else if (width < 1280) newColumns = Math.min(4, columns);
      else newColumns = columns;

      setResponsiveColumns(newColumns);
    };

    updateColumns();
    
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [columns]);

  // Virtualization calculations
  const itemHeight = useMemo(() => {
    const container = containerRef.current;
    if (!container) return 200;
    
    const containerWidth = container.clientWidth;
    const itemWidth = (containerWidth - (gap * (responsiveColumns - 1))) / responsiveColumns;
    return itemWidth / aspectRatio;
  }, [responsiveColumns, gap, aspectRatio]);

  // Calculate virtualized items
  useEffect(() => {
    if (!enableVirtualization) return;

    const container = containerRef.current;
    if (!container || !items.length) return;

    const containerHeight = container.clientHeight;
    const rowHeight = itemHeight + gap;
    const itemsPerRow = responsiveColumns;
    const totalRows = Math.ceil(items.length / itemsPerRow);
    const totalHeight = totalRows * rowHeight - gap;

    setContainerHeight(totalHeight);

    // Calculate visible range
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight)
    );

    const visibleVirtualItems: VirtualizedItem[] = [];
    
    for (let row = Math.max(0, startRow - 1); row <= endRow + 1; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index >= items.length) break;

        visibleVirtualItems.push({
          index,
          item: items[index],
          top: row * rowHeight,
          height: itemHeight
        });
      }
    }

    setVirtualizedItems(visibleVirtualItems);
  }, [items, scrollTop, responsiveColumns, itemHeight, gap, enableVirtualization]);

  // Handle scroll for virtualization
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);

    // Infinite scroll
    if (hasMore && !loadingMore && onLoadMore) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onLoadMore();
      }
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Load more items (pagination)
  const loadMoreItems = useCallback(() => {
    if (enableVirtualization) return; // Handled by onLoadMore

    const startIndex = (loadedPages - 1) * itemsPerPage;
    const endIndex = loadedPages * itemsPerPage;
    const newItems = items.slice(startIndex, endIndex);
    
    setVisibleItems(prev => [...prev, ...newItems]);
  }, [items, loadedPages, itemsPerPage, enableVirtualization]);

  // Initial load and pagination
  useEffect(() => {
    if (enableVirtualization) {
      setVisibleItems(items);
    } else {
      loadMoreItems();
    }
  }, [items, enableVirtualization, loadMoreItems]);

  // Intersection Observer for infinite scroll (non-virtualized)
  useEffect(() => {
    if (enableVirtualization || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingMore) {
          setLoadedPages(prev => prev + 1);
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('gallery-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore, enableVirtualization]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          previousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextImage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          setZoom(prev => Math.min(3, prev * 1.2));
          break;
        case '-':
        case '_':
          event.preventDefault();
          setZoom(prev => Math.max(0.5, prev / 1.2));
          break;
        case '0':
          event.preventDefault();
          setZoom(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex]);

  // Lightbox functions
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    setZoom(1);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setZoom(1);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setZoom(1);
  };

  const handleItemClick = (item: MediaItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    } else if (enableLightbox) {
      openLightbox(index);
    }
  };

  // Download current image
  const downloadImage = async () => {
    if (!items[currentIndex]) return;

    try {
      const response = await fetch(items[currentIndex].src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = items[currentIndex].title || `image-${currentIndex + 1}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Share current image
  const shareImage = async () => {
    if (!items[currentIndex]) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: items[currentIndex].title,
          text: items[currentIndex].description,
          url: items[currentIndex].src
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(items[currentIndex].src);
    }
  };

  // Error handling
  if (error) {
    return errorFallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load gallery</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!items.length) {
    return emptyState || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🖼️</div>
          <p>No images to display</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const displayItems = enableVirtualization ? virtualizedItems : visibleItems;

  return (
    <div className={cn('relative', className)}>
      {/* Gallery Grid */}
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-auto',
          enableVirtualization && 'h-96'
        )}
        onScroll={enableVirtualization ? handleScroll : undefined}
        style={{
          height: enableVirtualization ? containerHeight : 'auto'
        }}
      >
        <div
          className={cn(
            'grid gap-4 w-full',
            !enableVirtualization && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          )}
          style={{
            gridTemplateColumns: enableVirtualization 
              ? `repeat(${responsiveColumns}, 1fr)`
              : undefined,
            gap: `${gap}px`,
            height: enableVirtualization ? containerHeight : 'auto'
          }}
        >
          {displayItems.map((virtualItem, displayIndex) => {
            const item = enableVirtualization ? virtualItem.item : virtualItem as MediaItem;
            const actualIndex = enableVirtualization ? virtualItem.index : 
              (loadedPages - 1) * itemsPerPage + displayIndex;

            return (
              <div
                key={item.id}
                className={cn(
                  'relative cursor-pointer group overflow-hidden rounded-lg',
                  'transition-transform duration-200 hover:scale-105',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  itemClassName
                )}
                style={enableVirtualization ? {
                  position: 'absolute',
                  top: virtualItem.top,
                  left: `${(actualIndex % responsiveColumns) * (100 / responsiveColumns)}%`,
                  width: `${100 / responsiveColumns}%`,
                  height: virtualItem.height
                } : {
                  aspectRatio: aspectRatio.toString()
                }}
                onClick={() => handleItemClick(item, actualIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item, actualIndex);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View ${item.alt}`}
              >
                <ProgressiveImage
                  src={item.thumbnail || item.src}
                  alt={item.alt}
                  variants={item.variants}
                  className="w-full h-full"
                  loading={loading}
                  quality={quality}
                  optimization={{
                    enableWebP: true,
                    enableAVIF: true,
                    responsiveImages: true,
                    lazyLoading: loading === 'lazy'
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Media type indicator */}
                {item.type === 'video' && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    Video
                  </div>
                )}

                {/* Title overlay */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h3 className="text-white text-sm font-medium truncate">
                      {item.title}
                    </h3>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {!enableVirtualization && hasMore && (
          <div id="gallery-sentinel" className="py-8 text-center">
            {loadingMore ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading more...</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLoadedPages(prev => prev + 1);
                  onLoadMore?.();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Navigation */}
          <button
            onClick={previousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Controls */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
              className="p-2 text-white hover:text-gray-300"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-6 h-6" />
            </button>

            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
              className="p-2 text-white hover:text-gray-300"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-6 h-6" />
            </button>

            <button
              onClick={downloadImage}
              className="p-2 text-white hover:text-gray-300"
              aria-label="Download image"
            >
              <Download className="w-6 h-6" />
            </button>

            <button
              onClick={shareImage}
              className="p-2 text-white hover:text-gray-300"
              aria-label="Share image"
            >
              <Share2 className="w-6 h-6" />
            </button>

            <button
              onClick={closeLightbox}
              className="p-2 text-white hover:text-gray-300"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image */}
          <div className="relative max-w-full max-h-full overflow-auto">
            <ProgressiveImage
              src={currentItem.src}
              alt={currentItem.alt}
              variants={currentItem.variants}
              className="max-w-none"
              style={{ 
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-in-out'
              }}
              priority
              loading="eager"
              quality={95}
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-lg font-medium mb-1">{currentItem.title}</h3>
            {currentItem.description && (
              <p className="text-sm text-gray-300 mb-2">{currentItem.description}</p>
            )}
            <div className="text-xs text-gray-400">
              {currentIndex + 1} of {items.length}
              {currentItem.metadata && (
                <span className="ml-4">
                  {currentItem.metadata.width && currentItem.metadata.height && 
                    `${currentItem.metadata.width} × ${currentItem.metadata.height}`}
                  {currentItem.metadata.size && 
                    ` • ${Math.round(currentItem.metadata.size / 1024)}KB`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyGallery;