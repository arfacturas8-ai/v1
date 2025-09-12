"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollElement?: HTMLElement | null;
}

export interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    item: T;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollToBottom: () => void;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5, scrollElement } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Update scroll element ref
  useEffect(() => {
    scrollElementRef.current = scrollElement;
  }, [scrollElement]);

  // Handle scroll events
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollElement]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i],
      });
    }
    return result;
  }, [visibleRange, itemHeight, items]);

  const totalHeight = items.length * itemHeight;

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = scrollElementRef.current;
      if (!element) return;

      const targetScrollTop = index * itemHeight;
      element.scrollTop = targetScrollTop;
    },
    [itemHeight]
  );

  const scrollToBottom = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToBottom,
  };
}

// Hook for virtualizing message lists
export function useMessageVirtual<T>(
  messages: T[],
  containerRef: React.RefObject<HTMLElement>,
  estimatedItemHeight: number = 80
) {
  const [containerHeight, setContainerHeight] = useState(600);

  // Update container height when it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [containerRef]);

  const virtualResult = useVirtualScroll(messages, {
    itemHeight: estimatedItemHeight,
    containerHeight,
    overscan: 5,
    scrollElement: containerRef.current,
  });

  return virtualResult;
}

// Hook for dynamic item heights (more complex)
export interface DynamicVirtualScrollOptions<T> {
  estimateSize: (item: T, index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
  overscan?: number;
  scrollElement?: HTMLElement | null;
}

export function useDynamicVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  options: DynamicVirtualScrollOptions<T>
) {
  const { estimateSize, getItemKey, overscan = 5, scrollElement } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredSizes, setMeasuredSizes] = useState<Map<string | number, number>>(new Map());
  const scrollElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    scrollElementRef.current = scrollElement;
  }, [scrollElement]);

  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollElement]);

  // Calculate cumulative offsets
  const offsets = useMemo(() => {
    const result = [0];
    let offset = 0;
    
    for (let i = 0; i < items.length; i++) {
      const key = getItemKey ? getItemKey(items[i], i) : i;
      const size = measuredSizes.get(key) || estimateSize(items[i], i);
      offset += size;
      result.push(offset);
    }
    
    return result;
  }, [items, measuredSizes, estimateSize, getItemKey]);

  const totalHeight = offsets[offsets.length - 1] || 0;

  // Find visible range using binary search
  const visibleRange = useMemo(() => {
    const findIndex = (offset: number) => {
      let left = 0;
      let right = offsets.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (offsets[mid] <= offset) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return Math.max(0, Math.min(items.length - 1, right));
    };

    const start = findIndex(scrollTop);
    const end = findIndex(scrollTop + containerHeight);

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, containerHeight, offsets, items.length, overscan]);

  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        start: offsets[i],
        end: offsets[i + 1],
        item: items[i],
      });
    }
    return result;
  }, [visibleRange, offsets, items]);

  const measureItem = useCallback(
    (index: number, height: number) => {
      const key = getItemKey ? getItemKey(items[index], index) : index;
      setMeasuredSizes(prev => {
        const next = new Map(prev);
        next.set(key, height);
        return next;
      });
    },
    [items, getItemKey]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = scrollElementRef.current;
      if (!element || index < 0 || index >= offsets.length - 1) return;

      element.scrollTop = offsets[index];
    },
    [offsets]
  );

  const scrollToBottom = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.scrollTop = totalHeight;
  }, [totalHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToBottom,
    measureItem,
    visibleRange,
  };
}