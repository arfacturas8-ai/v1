/**
 * CRYB Design System - Gesture Components
 * Touch and gesture-enhanced UI components
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { 
  useSwipeGesture, 
  useLongPress, 
  useDragPhysics,
  useHover,
} from '../../hooks/useAnimations';
import { 
  slideVariants, 
  scaleVariants, 
  cardHover,
  swipeConfidenceThreshold,
  swipePower,
} from '../../lib/animations';

// ===== SWIPEABLE CARD =====
export interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  disabled?: boolean;
  threshold?: number;
  snapBack?: boolean;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  disabled = false,
  threshold = 100,
  snapBack = true,
  leftAction,
  rightAction,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  
  const leftActionOpacity = useTransform(x, [-150, -50], [1, 0]);
  const rightActionOpacity = useTransform(x, [50, 150], [0, 1]);
  const cardRotate = useTransform(x, [-200, 200], [-10, 10]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold && onSwipeLeft) {
      controls.start({ x: -1000, opacity: 0 }).then(() => onSwipeLeft());
    } else if (swipe > swipeConfidenceThreshold && onSwipeRight) {
      controls.start({ x: 1000, opacity: 0 }).then(() => onSwipeRight());
    } else if (Math.abs(offset.y) > threshold) {
      if (offset.y < 0 && onSwipeUp) {
        controls.start({ y: -1000, opacity: 0 }).then(() => onSwipeUp());
      } else if (offset.y > 0 && onSwipeDown) {
        controls.start({ y: 1000, opacity: 0 }).then(() => onSwipeDown());
      }
    } else if (snapBack) {
      controls.start({ x: 0, y: 0 });
    }
  };

  return (
    <div style={{
  position: 'relative'
}}>
      {/* Background Actions */}
      {leftAction && (
        <div
          style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderRadius: '12px'
}}
          style={{ 
            backgroundColor: leftAction.color,
            opacity: leftActionOpacity,
          }}
        >
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#ffffff'
}}>
            {leftAction.icon}
            <span style={{
  fontWeight: '500'
}}>{leftAction.label}</span>
          </div>
        </div>
      )}
      
      {rightAction && (
        <div
          style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  borderRadius: '12px'
}}
          style={{ 
            backgroundColor: rightAction.color,
            opacity: rightActionOpacity,
          }}
        >
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#ffffff'
}}>
            <span style={{
  fontWeight: '500'
}}>{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        className={cn(
          'relative bg-background border rounded-lg shadow-sm cursor-grab active:cursor-grabbing',
          disabled && 'cursor-default',
          className
        )}
        style={{ x, y, rotate: cardRotate, scale: cardScale }}
        drag={!disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd} : undefined} : undefined}
      >
        {children}
      </div>
    </div>
  );
};

// ===== PULL TO REFRESH =====
export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const y = useMotionValue(0);
  
  const refreshOpacity = useTransform(y, [0, threshold], [0, 1]);
  const refreshRotate = useTransform(y, [0, threshold], [0, 180]);

  const handleDrag = (event: any, info: PanInfo) => {
    const { offset } = info;
    if (offset.y > 0) {
      setPullDistance(offset.y);
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const { offset } = info;
    
    if (offset.y > threshold && !disabled && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Refresh Indicator */}
      <div
        style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '64px'
}}
        style={{ 
          opacity: refreshOpacity,
          y: useTransform(y, [0, threshold], [-64, 0]),
        }}
      >
        <div
          style={{ rotate: refreshRotate }} : {}} : {}}
        >
          <svg style={{
  width: '24px',
  height: '24px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </div>
    </div>
  );
};

// ===== LONG PRESS BUTTON =====
export interface LongPressButtonProps {
  children: React.ReactNode;
  onLongPress: () => void;
  duration?: number;
  className?: string;
  disabled?: boolean;
  showProgress?: boolean;
}

export const LongPressButton: React.FC<LongPressButtonProps> = ({
  children,
  onLongPress,
  duration = 800,
  className,
  disabled = false,
  showProgress = true,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const progressInterval = React.useRef<NodeJS.Timeout>();

  const longPressHandlers = useLongPress(() => {
    if (!disabled) {
      onLongPress();
      setProgress(0);
    }
  }, duration);

  const handlePressStart = () => {
    if (disabled) return;
    
    setIsPressed(true);
    setProgress(0);
    
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (duration / 50));
        return next >= 100 ? 100 : next;
      });
    }, 50);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-lg border bg-background p-4 text-foreground',
        'transition-colors hover:bg-accent/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd} : undefined} : undefined}
      {...longPressHandlers}
    >
      {/* Progress Ring */}
      {showProgress && isPressed && (
        <div
          style={{
  position: 'absolute',
  borderRadius: '12px'
}}
        >
          <svg style={{
  position: 'absolute',
  width: '100%',
  height: '100%'
}}>
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="100%"
              strokeDashoffset={`${100 - progress}%`}
              className="text-primary"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div style={{
  position: 'relative'
}}>
        {children}
      </div>
    </button>
  );
};

// ===== DRAGGABLE LIST ITEM =====
export interface DraggableListItemProps {
  children: React.ReactNode;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  index: number;
  className?: string;
  disabled?: boolean;
}

export const DraggableListItem: React.FC<DraggableListItemProps> = ({
  children,
  onReorder,
  index,
  className,
  disabled = false,
}) => {
  const { isHovered, handlers } = useHover();
  const dragPhysics = useDragPhysics();

  return (
    <div
      className={cn(
        'relative bg-background border rounded-lg p-4 cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow',
        disabled && 'cursor-default opacity-50',
        className
      )}
      layout
      layoutId={`item-${index}`}
      drag={!disabled ? 'y' : false}
      dragSnapToOrigin
      dragElastic={0.1} : undefined}
      whileDrag={!disabled ? { scale: 1.05, zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' } : undefined}
      initial="rest"
      {...handlers}
      {...dragPhysics}
    >
      {/* Drag Handle */}
      {!disabled && (
        <div 
          style={{
  position: 'absolute'
}}}
        >
          <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </div>
      )}

      {/* Content */}
      <div className={!disabled ? 'ml-6' : ''}>
        {children}
      </div>
    </div>
  );
};

// ===== PINCH TO ZOOM =====
export interface PinchToZoomProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

export const PinchToZoom: React.FC<PinchToZoomProps> = ({
  children,
  minZoom = 0.5,
  maxZoom = 3,
  className,
}) => {
  const scale = useMotionValue(1);
  const [currentScale, setCurrentScale] = React.useState(1);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.01;
    const newScale = Math.min(Math.max(currentScale + delta, minZoom), maxZoom);
    setCurrentScale(newScale);
    scale.set(newScale);
  };

  const resetZoom = () => {
    setCurrentScale(1);
    scale.set(1);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Reset Button */}
      {currentScale !== 1 && (
        <button
          style={{
  position: 'absolute',
  padding: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
          onClick={resetZoom}
        >
          <svg style={{
  width: '16px',
  height: '16px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {/* Zoomable Content */}
      <div
        style={{ scale }}
        onWheel={handleWheel}
        drag
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        dragElastic={0.1}
        className="origin-center"
      >
        {children}
      </div>

      {/* Zoom Indicator */}
      {currentScale !== 1 && (
        <div
          style={{
  position: 'absolute',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
        >
          {Math.round(currentScale * 100)}%
        </div>
      )}
    </div>
  );
};

// ===== TILT CARD =====
export interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
  disabled?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  maxTilt = 10,
  className,
  disabled = false,
}) => {
  const [tiltX, setTiltX] = React.useState(0);
  const [tiltY, setTiltY] = React.useState(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    const tiltX = (mouseY / (rect.height / 2)) * maxTilt;
    const tiltY = -(mouseX / (rect.width / 2)) * maxTilt;

    setTiltX(tiltX);
    setTiltY(tiltY);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <div
      className={cn('transform-gpu', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}}}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {children}
    </div>
  );
};

// ===== FLOATING ACTION BUTTON WITH GESTURES =====
export interface GestureFabProps {
  icon: React.ReactNode;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const GestureFab: React.FC<GestureFabProps> = ({
  icon,
  actions = [],
  className,
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isHovered, handlers } = useHover();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const actionDirection = position.includes('bottom') ? 'up' : 'down';

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Action Items */}
      
        {isExpanded && actions.map((action, index) => (
          <button
            key={index}
            style={{
  position: 'absolute',
  width: '48px',
  height: '48px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [actionDirection === 'up' ? 'bottom' : 'top']: `${(index + 1) * 60}px`
}}
            onClick={action.onClick}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      

      {/* Main FAB */}
      <button
        style={{
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
        onClick={() => setIsExpanded(!isExpanded)}
        initial="rest"}
        {...handlers}
      >
        <div}}
        >
          {icon}
        </div>
      </button>
    </div>
  );
};

// ===== EXPORTS =====


const styles = {
  card: {
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '16px'
  },
  button: {
    background: 'linear-gradient(to right, #58a6ff, #a371f7)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  container: {
    background: '#0D0D0D',
    padding: '16px'
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  text: {
    color: '#A0A0A0',
    fontSize: '14px',
    margin: '0'
  },
  textTertiary: {
    color: '#666666',
    fontSize: '14px'
  }
}

export default {
  SwipeableCard,
  PullToRefresh,
  LongPressButton,
  DraggableListItem,
  PinchToZoom,
  TiltCard,
  GestureFab,
};