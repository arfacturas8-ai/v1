"use client";

import * as React from 'react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

interface VirtualScrollItem {
  id: string;
  height?: number;
  data: any;
}

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onLoadMore?: () => void;
  loadMoreThreshold?: number;
  maxItems?: number;
  enableSmoothScrolling?: boolean;
}

interface VirtualScrollState {
  scrollTop: number;
  isScrolling: boolean;
  startIndex: number;
  endIndex: number;
  visibleItems: VirtualScrollItem[];
}

interface SafeVirtualScrollReturn {
  containerProps: {
    ref: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  items: Array<{
    index: number;
    item: VirtualScrollItem;
    style: React.CSSProperties;
  }>;
  scrollTo: (index: number, alignment?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  totalHeight: number;
  isScrolling: boolean;
  error: Error | null;
  retry: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<VirtualScrollOptions, 'onScroll' | 'onLoadMore'>> = {
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5,
  scrollToAlignment: 'auto',
  loadMoreThreshold: 10,
  maxItems: 10000,
  enableSmoothScrolling: true,
};

export function useCrashSafeVirtualScroll(
  items: VirtualScrollItem[],
  options: VirtualScrollOptions
): SafeVirtualScrollReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);
  const measurementCacheRef = useRef<Map<string, number>>(new Map());

  // State
  const [state, setState] = useState<VirtualScrollState>({
    scrollTop: 0,
    isScrolling: false,
    startIndex: 0,
    endIndex: 0,
    visibleItems: [],
  });
  const [error, setError] = useState<Error | null>(null);
  const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());

  // Safety: Limit items to prevent memory issues
  const safeItems = useMemo(() => {
    if (items.length > config.maxItems) {
      console.warn(`Virtual scroll: Too many items (${items.length}), limiting to ${config.maxItems}`);
      return items.slice(0, config.maxItems);
    }
    return items;
  }, [items, config.maxItems]);

  // Calculate total height with dynamic heights
  const totalHeight = useMemo(() => {
    try {
      if (safeItems.length === 0) return 0;
      
      let total = 0;
      for (const item of safeItems) {
        const cachedHeight = measurementCacheRef.current.get(item.id) || itemHeights.get(item.id);
        total += cachedHeight || item.height || config.itemHeight;
      }
      return Math.max(total, 0);
    } catch (err) {
      console.error('Error calculating total height:', err);
      setError(err as Error);
      return safeItems.length * config.itemHeight;
    }
  }, [safeItems, itemHeights, config.itemHeight]);

  // Calculate visible range with error handling
  const calculateVisibleRange = useCallback((scrollTop: number): [number, number] => {
    try {
      if (safeItems.length === 0) return [0, 0];
      
      let cumulativeHeight = 0;
      let startIndex = 0;
      let endIndex = 0;

      // Find start index
      for (let i = 0; i < safeItems.length; i++) {
        const item = safeItems[i];
        const height = itemHeights.get(item.id) || item.height || config.itemHeight;
        
        if (cumulativeHeight + height > scrollTop) {
          startIndex = Math.max(0, i - config.overscan);
          break;
        }
        cumulativeHeight += height;
      }

      // Find end index
      const viewportBottom = scrollTop + config.containerHeight;
      cumulativeHeight = 0;
      
      for (let i = 0; i < safeItems.length; i++) {
        const item = safeItems[i];
        const height = itemHeights.get(item.id) || item.height || config.itemHeight;
        cumulativeHeight += height;
        
        if (cumulativeHeight >= viewportBottom) {
          endIndex = Math.min(safeItems.length - 1, i + config.overscan);
          break;
        }
      }

      // Ensure endIndex is at least startIndex
      if (endIndex <= startIndex) {
        endIndex = Math.min(safeItems.length - 1, startIndex + config.overscan);
      }

      return [startIndex, endIndex];
    } catch (err) {
      console.error('Error calculating visible range:', err);
      setError(err as Error);
      return [0, Math.min(10, safeItems.length - 1)];
    }
  }, [safeItems, itemHeights, config.itemHeight, config.overscan, config.containerHeight]);

  // Calculate item position
  const getItemOffset = useCallback((index: number): number => {
    try {
      let offset = 0;
      for (let i = 0; i < index && i < safeItems.length; i++) {
        const item = safeItems[i];
        const height = itemHeights.get(item.id) || item.height || config.itemHeight;
        offset += height;
      }
      return offset;
    } catch (err) {
      console.error('Error calculating item offset:', err);
      setError(err as Error);
      return index * config.itemHeight;
    }
  }, [safeItems, itemHeights, config.itemHeight]);

  // Generate visible items with error handling
  const visibleItems = useMemo(() => {
    try {
      const [startIndex, endIndex] = calculateVisibleRange(state.scrollTop);
      const items: Array<{
        index: number;
        item: VirtualScrollItem;
        style: React.CSSProperties;
      }> = [];

      for (let i = startIndex; i <= endIndex && i < safeItems.length; i++) {
        const item = safeItems[i];
        const height = itemHeights.get(item.id) || item.height || config.itemHeight;
        const offset = getItemOffset(i);

        items.push({
          index: i,
          item,
          style: {
            position: 'absolute',
            top: offset,
            left: 0,
            right: 0,
            height,
            willChange: state.isScrolling ? 'transform' : 'auto',
          },
        });
      }

      return items;
    } catch (err) {
      console.error('Error generating visible items:', err);
      setError(err as Error);
      return [];
    }
  }, [
    state.scrollTop,
    state.isScrolling,
    calculateVisibleRange,
    getItemOffset,
    safeItems,
    itemHeights,
    config.itemHeight,
  ]);

  // Handle scroll events with debouncing and error handling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    try {
      const scrollTop = Math.max(0, e.currentTarget.scrollTop);
      const scrollLeft = e.currentTarget.scrollLeft;

      // Cancel existing frame
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        try {
          const [startIndex, endIndex] = calculateVisibleRange(scrollTop);
          
          setState(prevState => ({
            ...prevState,
            scrollTop,
            startIndex,
            endIndex,
            isScrolling: true,
          }));

          // Call onScroll callback
          options.onScroll?.(scrollTop, scrollLeft);

          // Check if should load more
          if (options.onLoadMore && endIndex >= safeItems.length - (config.loadMoreThreshold || 10)) {
            options.onLoadMore();
          }

          // Clear scrolling state after a delay
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          scrollTimeoutRef.current = setTimeout(() => {
            setState(prevState => ({
              ...prevState,
              isScrolling: false,
            }));
          }, 150);
        } catch (err) {
          console.error('Error in scroll frame:', err);
          setError(err as Error);
        }
      });
    } catch (err) {
      console.error('Error handling scroll:', err);
      setError(err as Error);
    }
  }, [calculateVisibleRange, options, safeItems.length, config.loadMoreThreshold]);

  // Scroll to specific index
  const scrollTo = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
    try {
      if (!containerRef.current || index < 0 || index >= safeItems.length) {
        return;
      }

      const itemOffset = getItemOffset(index);
      const itemHeight = itemHeights.get(safeItems[index].id) || safeItems[index].height || config.itemHeight;
      const containerHeight = config.containerHeight;

      let scrollTop = itemOffset;

      switch (alignment) {
        case 'center':
          scrollTop = itemOffset - (containerHeight / 2) + (itemHeight / 2);
          break;
        case 'end':
          scrollTop = itemOffset - containerHeight + itemHeight;
          break;
        case 'auto':
          const currentScrollTop = state.scrollTop;
          if (itemOffset < currentScrollTop) {
            scrollTop = itemOffset;
          } else if (itemOffset + itemHeight > currentScrollTop + containerHeight) {
            scrollTop = itemOffset - containerHeight + itemHeight;
          } else {
            return; // Item is already visible
          }
          break;
      }

      scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight));

      if (config.enableSmoothScrolling) {
        containerRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        });
      } else {
        containerRef.current.scrollTop = scrollTop;
      }
    } catch (err) {
      console.error('Error scrolling to index:', err);
      setError(err as Error);
    }
  }, [
    safeItems,
    getItemOffset,
    itemHeights,
    config.itemHeight,
    config.containerHeight,
    config.enableSmoothScrolling,
    state.scrollTop,
    totalHeight,
  ]);

  // Convenience methods
  const scrollToTop = useCallback(() => {
    scrollTo(0, 'start');
  }, [scrollTo]);

  const scrollToBottom = useCallback(() => {
    scrollTo(safeItems.length - 1, 'end');
  }, [scrollTo, safeItems.length]);

  // Retry function for error recovery
  const retry = useCallback(() => {
    setError(null);
    measurementCacheRef.current.clear();
    setItemHeights(new Map());
    setState({
      scrollTop: 0,
      isScrolling: false,
      startIndex: 0,
      endIndex: Math.min(config.overscan, safeItems.length - 1),
      visibleItems: [],
    });
  }, [config.overscan, safeItems.length]);

  // Update item height measurements
  const updateItemHeight = useCallback((itemId: string, height: number) => {
    if (height > 0) {
      measurementCacheRef.current.set(itemId, height);
      setItemHeights(prev => new Map(prev).set(itemId, height));
    }
  }, []);

  // Initialize state
  useEffect(() => {
    const [startIndex, endIndex] = calculateVisibleRange(0);
    setState(prevState => ({
      ...prevState,
      startIndex,
      endIndex,
    }));
  }, [calculateVisibleRange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        height: config.containerHeight,
        overflow: 'auto',
        position: 'relative',
      },
    },
    items: visibleItems,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    totalHeight,
    isScrolling: state.isScrolling,
    error,
    retry,
  };
}