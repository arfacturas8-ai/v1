'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  format: 'jpeg' | 'webp' | 'avif' | 'png';
  quality: number;
  size: number;
}

export interface ProgressiveImageProps {
  src: string;
  alt: string;
  variants?: ImageVariant[];
  placeholder?: string | 'blur' | 'empty';
  blurDataURL?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  intersection?: {
    rootMargin?: string;
    threshold?: number;
  };
  optimization?: {
    enableWebP?: boolean;
    enableAVIF?: boolean;
    responsiveImages?: boolean;
    lazyLoading?: boolean;
    prefetch?: boolean;
  };
}

interface ImageLoadState {
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  currentSrc: string | null;
  loadStartTime: number;
  loadEndTime?: number;
}

/**
 * Progressive Image Component
 * 
 * Features:
 * - Progressive loading with blur-up effect
 * - Responsive images with srcset
 * - Modern format support (WebP, AVIF)
 * - Lazy loading with Intersection Observer
 * - Automatic placeholder generation
 * - Performance monitoring
 * - Error handling with fallbacks
 * - Bandwidth-aware loading
 * - Preloading for critical images
 * - Accessibility optimizations
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  variants = [],
  placeholder = 'blur',
  blurDataURL,
  width,
  height,
  aspectRatio,
  className,
  imgClassName,
  priority = false,
  quality = 80,
  sizes = '100vw',
  onLoad,
  onError,
  fallback,
  loading = 'lazy',
  intersection = {},
  optimization = {}
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<ImageLoadState>({
    loaded: false,
    loading: false,
    error: null,
    currentSrc: null,
    loadStartTime: 0
  });
  const [isInView, setIsInView] = useState(priority);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // Optimization settings with defaults
  const opts = {
    enableWebP: true,
    enableAVIF: true,
    responsiveImages: true,
    lazyLoading: !priority,
    prefetch: priority,
    ...optimization
  };

  // Monitor network conditions
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        saveData: connection.saveData
      });

      const handleConnectionChange = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          saveData: connection.saveData
        });
      };

      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!opts.lazyLoading || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: intersection.rootMargin || '50px',
        threshold: intersection.threshold || 0.1
      }
    );

    const container = containerRef.current;
    if (container) {
      observer.observe(container);
    }

    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [opts.lazyLoading, isInView, intersection]);

  // Generate responsive image sources
  const responsiveImages = useMemo(() => {
    if (!opts.responsiveImages || variants.length === 0) {
      return { src, srcSet: '', sizes };
    }

    // Sort variants by width
    const sortedVariants = [...variants].sort((a, b) => a.width - b.width);

    // Generate WebP sources
    const webpSources = sortedVariants
      .filter(v => v.format === 'webp')
      .map(v => `${v.url} ${v.width}w`)
      .join(', ');

    // Generate AVIF sources
    const avifSources = sortedVariants
      .filter(v => v.format === 'avif')
      .map(v => `${v.url} ${v.width}w`)
      .join(', ');

    // Generate fallback sources
    const fallbackSources = sortedVariants
      .filter(v => ['jpeg', 'png'].includes(v.format))
      .map(v => `${v.url} ${v.width}w`)
      .join(', ');

    return {
      avif: avifSources,
      webp: webpSources,
      fallback: fallbackSources || src,
      sizes
    };
  }, [src, variants, sizes, opts.responsiveImages]);

  // Select best image based on network conditions
  const optimalSrc = useMemo(() => {
    if (!networkInfo || variants.length === 0) {
      return src;
    }

    // Use lower quality on slow connections or data saver mode
    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g') {
      const lowQualityVariant = variants.find(v => v.quality <= 60);
      return lowQualityVariant?.url || src;
    }

    // Use adaptive quality based on connection speed
    let targetQuality = quality;
    if (networkInfo.effectiveType === '2g') targetQuality = Math.min(60, quality);
    else if (networkInfo.effectiveType === '3g') targetQuality = Math.min(75, quality);

    const suitableVariant = variants.find(v => 
      Math.abs(v.quality - targetQuality) <= 10
    );

    return suitableVariant?.url || src;
  }, [src, variants, quality, networkInfo]);

  // Handle image loading
  const handleImageLoad = () => {
    const endTime = performance.now();
    setLoadState(prev => ({
      ...prev,
      loaded: true,
      loading: false,
      loadEndTime: endTime
    }));

    // Track loading performance
    const loadTime = endTime - loadState.loadStartTime;
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'image_load', {
        custom_metric_name: 'image_load_time',
        value: loadTime,
        custom_parameter_1: src,
        custom_parameter_2: loadState.currentSrc
      });
    }

    onLoad?.();
  };

  const handleImageError = (error: Event) => {
    const errorObj = new Error('Failed to load image');
    setLoadState(prev => ({
      ...prev,
      loading: false,
      error: errorObj
    }));

    // Track error
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'image_error', {
        custom_parameter_1: src,
        custom_parameter_2: loadState.currentSrc
      });
    }

    onError?.(errorObj);
  };

  const startImageLoad = (imageSrc: string) => {
    setLoadState(prev => ({
      ...prev,
      loading: true,
      error: null,
      currentSrc: imageSrc,
      loadStartTime: performance.now()
    }));
  };

  // Preload critical images
  useEffect(() => {
    if (priority && opts.prefetch && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimalSrc;
        if (responsiveImages.sizes) {
          link.setAttribute('imagesizes', responsiveImages.sizes);
        }
        if (responsiveImages.fallback && responsiveImages.fallback !== optimalSrc) {
          link.setAttribute('imagesrcset', responsiveImages.fallback);
        }
        document.head.appendChild(link);
      });
    }
  }, [priority, opts.prefetch, optimalSrc, responsiveImages]);

  // Generate blur placeholder
  const blurPlaceholder = useMemo(() => {
    if (placeholder !== 'blur') return null;
    
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return null;
    
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, 10, 10);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 10, 10);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }, [placeholder, blurDataURL]);

  // Calculate aspect ratio
  const calculatedAspectRatio = useMemo(() => {
    if (aspectRatio) return aspectRatio;
    if (width && height) return width / height;
    return 16 / 9; // Default aspect ratio
  }, [aspectRatio, width, height]);

  // Error fallback
  if (loadState.error && fallback) {
    return <>{fallback}</>;
  }

  const shouldLoad = priority || isInView;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-200',
        'transition-colors duration-300',
        className
      )}
      style={{
        aspectRatio: calculatedAspectRatio.toString(),
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurPlaceholder && !loadState.loaded && (
        <img
          src={blurPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
          style={{ filter: 'blur(20px)' }}
          aria-hidden="true"
        />
      )}

      {/* Loading shimmer */}
      {placeholder === 'blur' && loadState.loading && (
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        </div>
      )}

      {/* Main image */}
      {shouldLoad && (
        <picture className="absolute inset-0">
          {/* AVIF source */}
          {opts.enableAVIF && responsiveImages.avif && (
            <source
              srcSet={responsiveImages.avif}
              sizes={responsiveImages.sizes}
              type="image/avif"
            />
          )}
          
          {/* WebP source */}
          {opts.enableWebP && responsiveImages.webp && (
            <source
              srcSet={responsiveImages.webp}
              sizes={responsiveImages.sizes}
              type="image/webp"
            />
          )}

          {/* Main image element */}
          <img
            ref={imgRef}
            src={optimalSrc}
            srcSet={opts.responsiveImages ? responsiveImages.fallback : undefined}
            sizes={opts.responsiveImages ? responsiveImages.sizes : undefined}
            alt={alt}
            loading={priority ? 'eager' : loading}
            decoding={priority ? 'sync' : 'async'}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-500',
              loadState.loaded ? 'opacity-100' : 'opacity-0',
              imgClassName
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onLoadStart={() => startImageLoad(optimalSrc)}
          />
        </picture>
      )}

      {/* Error state */}
      {loadState.error && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 text-4xl mb-2">📷</div>
            <p className="text-gray-600 text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && loadState.loaded && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-1 rounded">
          <div>Load time: {loadState.loadEndTime ? Math.round(loadState.loadEndTime - loadState.loadStartTime) : 0}ms</div>
          <div>Network: {networkInfo?.effectiveType || 'unknown'}</div>
          <div>Source: {loadState.currentSrc?.includes('avif') ? 'AVIF' : 
                      loadState.currentSrc?.includes('webp') ? 'WebP' : 'Original'}</div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;