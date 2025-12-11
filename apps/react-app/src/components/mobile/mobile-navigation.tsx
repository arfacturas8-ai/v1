/**
 * CRYB Design System - Mobile Navigation Components
 * Touch-friendly navigation components optimized for mobile devices
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Search, 
  Bell, 
  User, 
  Plus,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Users,
  Bookmark,
  Settings,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { Button, IconButton } from '../ui/button';
import * as Sheet from '@radix-ui/react-dialog';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useDevice } from '@/hooks/useMediaQuery';

// ===== MOBILE NAVIGATION VARIANTS =====
const mobileNavVariants = cva([
  'fixed bottom-0 left-0 right-0 z-50',
  'bg-background/95 backdrop-blur-md',
  'border-t border-border',
  'safe-area-inset-bottom',
], {
  variants: {
    variant: {
      default: 'shadow-lg',
      floating: 'mx-4 mb-4 rounded-2xl shadow-xl',
      minimal: 'border-t-0 bg-transparent shadow-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabBarVariants = cva([
  'flex items-center justify-around',
  'px-2 py-2',
  'min-h-[60px]',
], {
  variants: {
    size: {
      compact: 'min-h-[50px] py-1',
      default: 'min-h-[60px] py-2',
      comfortable: 'min-h-[70px] py-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

// ===== MOBILE NAVIGATION INTERFACES =====
export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  badge?: number | string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface MobileNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation items */
  items: MobileNavItem[];
  /** Navigation variant */
  variant?: VariantProps<typeof mobileNavVariants>['variant'];
  /** Tab bar size */
  size?: VariantProps<typeof tabBarVariants>['size'];
  /** Show labels */
  showLabels?: boolean;
  /** Active item ID */
  activeItem?: string;
  /** Item change handler */
  onItemChange?: (itemId: string) => void;
  /** Floating action button */
  fab?: React.ReactNode;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
}

export interface MobileDrawerProps {
  /** Whether drawer is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer position */
  side?: 'left' | 'right' | 'bottom';
  /** Drawer content */
  children: React.ReactNode;
  /** Show overlay */
  showOverlay?: boolean;
  /** Enable swipe to close */
  swipeToClose?: boolean;
  /** Custom header */
  header?: React.ReactNode;
  /** Custom footer */
  footer?: React.ReactNode;
}

export interface MobileHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Header title */
  title?: string;
  /** Left action (usually back button) */
  leftAction?: React.ReactNode;
  /** Right actions */
  rightActions?: React.ReactNode[];
  /** Show back button */
  showBackButton?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Header variant */
  variant?: 'default' | 'transparent' | 'elevated';
  /** Sticky header */
  sticky?: boolean;
}

export interface PullToRefreshProps {
  /** Refresh handler */
  onRefresh: () => Promise<void>;
  /** Children to wrap */
  children: React.ReactNode;
  /** Pull threshold */
  threshold?: number;
  /** Refresh indicator */
  indicator?: React.ReactNode;
  /** Pull distance multiplier */
  pullMultiplier?: number;
  /** Disabled state */
  disabled?: boolean;
}

// ===== MOBILE TAB BAR ITEM =====
const MobileTabBarItem: React.FC<{
  item: MobileNavItem;
  active?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
  hapticFeedback?: boolean;
}> = ({ item, active, showLabel = true, onClick, hapticFeedback = true }) => {
  const IconComponent = item.icon;

  const handleClick = () => {
    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.();
    item.onClick?.();
  };

  return (
    <button}
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
        'min-w-0 flex-1 transition-colors duration-200',
        'active:bg-accent/50',
        active 
          ? 'text-cryb-primary' 
          : 'text-muted-foreground hover:text-foreground',
        item.disabled && 'opacity-50 pointer-events-none'
      )}
      onClick={handleClick}
      disabled={item.disabled}
      aria-label={item.label}
      role="tab"
      aria-selected={active}
    >
      <div className="relative">
        <IconComponent className={cn('h-6 w-6', active && 'text-cryb-primary')} />
        {item.badge && (
          <span className="absolute -top-1 -right-1 bg-cryb-primary text-cryb-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px] font-semibold">
            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={cn(
          'text-xs font-medium truncate max-w-full',
          active ? 'text-cryb-primary' : 'text-muted-foreground'
        )}>
          {item.label}
        </span>
      )}
    </button>
  );
};

// ===== MOBILE NAVIGATION COMPONENT =====
const MobileNavigation = React.forwardRef<HTMLElement, MobileNavigationProps>(
  ({
    className,
    items,
    variant,
    size,
    showLabels = true,
    activeItem,
    onItemChange,
    fab,
    hapticFeedback = true,
    ...props
  }, ref) => {
    const { isMobile } = useDevice();

    if (!isMobile) {
      return null; // Only show on mobile devices
    }

    return (
      <nav
        ref={ref}
        className={cn(mobileNavVariants({ variant }), className)}
        role="tablist"
        {...props}
      >
        <div className={cn(tabBarVariants({ size }))}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <MobileTabBarItem
                item={item}
                active={activeItem === item.id}
                showLabel={showLabels}
                onClick={() => onItemChange?.(item.id)}
                hapticFeedback={hapticFeedback}
              />
              
              {/* Floating Action Button in the middle */}
              {fab && index === Math.floor(items.length / 2) - 1 && (
                <div className="px-2">
                  {fab}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>
    );
  }
);

MobileNavigation.displayName = 'MobileNavigation';

// ===== MOBILE DRAWER COMPONENT =====
const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  side = 'left',
  children,
  showOverlay = true,
  swipeToClose = true,
  header,
  footer,
}) => {
  const [dragX, setDragX] = React.useState(0);

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!swipeToClose) return;

    if (side === 'left' && info.offset.x < -50) {
      setDragX(info.offset.x);
    } else if (side === 'right' && info.offset.x > 50) {
      setDragX(info.offset.x);
    } else if (side === 'bottom' && info.offset.y > 50) {
      setDragX(info.offset.y);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!swipeToClose) return;

    const threshold = 100;
    const shouldClose = 
      (side === 'left' && info.offset.x < -threshold) ||
      (side === 'right' && info.offset.x > threshold) ||
      (side === 'bottom' && info.offset.y > threshold);

    if (shouldClose) {
      onClose();
    }
    
    setDragX(0);
  };

  const drawerVariants = {
    hidden: {
      x: side === 'left' ? '-100%' : side === 'right' ? '100%' : 0,
      y: side === 'bottom' ? '100%' : 0,
    },
    visible: {
      x: 0,
      y: 0,
    },
  };

  return (
    <Sheet.Root open={open} onOpenChange={onClose}>
      <Sheet.Portal>
        {showOverlay && (
          <Sheet.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        )}
        
        <Sheet.Content asChild>
          <div
            initial="hidden"
            animate="visible"
            exit="hidden"
            drag={swipeToClose ? (side === 'bottom' ? 'y' : 'x') : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{
              transform: `translate${side === 'bottom' ? 'Y' : 'X'}(${dragX}px)`,
            }}
            className={cn(
              'fixed z-50 bg-background border-border shadow-xl',
              'flex flex-col',
              side === 'left' && 'left-0 top-0 h-full w-80 max-w-[80vw] border-r',
              side === 'right' && 'right-0 top-0 h-full w-80 max-w-[80vw] border-l',
              side === 'bottom' && 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl border-t'
            )}
          >
            {/* Drag Handle for bottom drawer */}
            {side === 'bottom' && swipeToClose && (
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 bg-muted rounded-full" />
              </div>
            )}

            {/* Header */}
            {header && (
              <div className="p-4 border-b border-border">
                {header}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-border">
                {footer}
              </div>
            )}
          </div>
        </Sheet.Content>
      </Sheet.Portal>
    </Sheet.Root>
  );
};

// ===== MOBILE HEADER COMPONENT =====
const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
  ({
    className,
    title,
    leftAction,
    rightActions = [],
    showBackButton = false,
    onBack,
    variant = 'default',
    sticky = true,
    children,
    ...props
  }, ref) => {
    const { isMobile } = useDevice();

    const headerClasses = cn(
      'flex items-center justify-between h-14 px-4 z-40',
      sticky && 'sticky top-0',
      variant === 'default' && 'bg-background/95 backdrop-blur-md border-b border-border',
      variant === 'transparent' && 'bg-transparent',
      variant === 'elevated' && 'bg-background shadow-sm',
      'safe-area-inset-top',
      className
    );

    if (!isMobile) {
      return null; // Only show on mobile devices
    }

    return (
      <header ref={ref} className={headerClasses} {...props}>
        {/* Left Side */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <IconButton
              icon={<ArrowLeft />}
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              aria-label="Go back"
            />
          )}
          {leftAction}
        </div>

        {/* Center */}
        <div className="flex-1 flex items-center justify-center px-4 min-w-0">
          {title && (
            <h1 className="text-base font-semibold text-center truncate">
              {title}
            </h1>
          )}
          {children}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {rightActions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      </header>
    );
  }
);

MobileHeader.displayName = 'MobileHeader';

// ===== PULL TO REFRESH COMPONENT =====
const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 60,
  indicator,
  pullMultiplier = 0.5,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [canPull, setCanPull] = React.useState(false);
  const startY = React.useRef(0);
  const scrollElement = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = scrollElement.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setCanPull(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;

    const currentY = e.touches[0].clientY;
    const diff = (currentY - startY.current) * pullMultiplier;
    
    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff, threshold * 2));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !canPull) return;

    setCanPull(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={scrollElement}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {indicator || (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 border-2 border-current border-t-transparent rounded-full',
                  isRefreshing ? '' : ''
                )}
                style={{
                  transform: `rotate(${progress * 360}deg)`,
                }}
              />
              <span className="text-sm font-medium">
                {isRefreshing ? 'Refreshing...' :
                 progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
};

// ===== FLOATING ACTION BUTTON =====
export interface FloatingActionButtonProps {
  /** FAB icon */
  icon: React.ComponentType<any>;
  /** Click handler */
  onClick?: () => void;
  /** FAB position */
  position?: 'center' | 'right';
  /** Extended FAB with text */
  extended?: boolean;
  /** Extended FAB text */
  text?: string;
  /** Hide when scrolling down */
  hideOnScroll?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: IconComponent,
  onClick,
  position = 'center',
  extended = false,
  text,
  hideOnScroll = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScroll]);

  return (
    <>
      {isVisible && (
        <button
          onClick={onClick}
          className={cn(
            'flex items-center gap-2 bg-cryb-primary text-cryb-primary-foreground',
            'rounded-full shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200',
            'font-medium z-40 active:scale-95',
            extended ? 'px-4 py-3' : 'p-4',
            position === 'center' ? 'absolute left-1/2 -translate-x-1/2 -translate-y-1/2' : 'mr-4 -mt-8'
          )}
          aria-label={text || 'Action button'}
        >
          <IconComponent className="h-6 w-6" />
          {extended && text && (
            <span className="text-sm font-semibold">{text}</span>
          )}
        </button>
      )}
    </>
  );
};

// ===== EXPORTS =====
export {
  MobileNavigation,
  MobileDrawer,
  MobileHeader,
  PullToRefresh,
  FloatingActionButton,
  MobileTabBarItem,
  mobileNavVariants,
  tabBarVariants,
};

export type {
  MobileNavigationProps,
  MobileNavItem,
  MobileDrawerProps,
  MobileHeaderProps,
  PullToRefreshProps,
  FloatingActionButtonProps,
};