import React, { useEffect, useRef, useCallback } from 'react';
import Spinner from '../atoms/Spinner';
import { colors, spacing, typography } from '../../design-system/tokens';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  loader,
  endMessage,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return (
    <>
      {children}

      {/* Observer trigger */}
      <div ref={observerTarget} style={{ height: '1px', marginTop: spacing[4] }} />

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: spacing[6],
          }}
        >
          {loader || <Spinner size="md" variant="primary" />}
        </div>
      )}

      {/* End message */}
      {!hasMore && !isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing[6],
            fontSize: typography.fontSize.sm,
            color: colors.text.tertiary,
          }}
        >
          {endMessage || "You've reached the end"}
        </div>
      )}
    </>
  );
};

export default InfiniteScroll;
