/**
 * CRYB Design System - Animated Modal Components
 * Enhanced modal system with Framer Motion animations
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../lib/accessibility';
import { 
  backdropVariants,
  modalVariants,
  drawerVariants,
  slideVariants,
  fadeVariants,
  staggerContainer,
  staggerItem,
} from '../../lib/animations';
import { useSwipeGesture } from '../../hooks/useAnimations';
import { Button } from './button';
import { X } from 'lucide-react';

// ===== MODAL VARIANTS =====
const modalContentVariants = cva(
  [
    'relative bg-background border border-border shadow-2xl',
    'max-h-[90vh] overflow-hidden flex flex-col',
  ],
  {
    variants: {
      variant: {
        modal: 'rounded-lg',
        drawer: 'rounded-t-lg',
        fullscreen: 'rounded-none w-screen h-screen',
        sidebar: 'rounded-l-lg h-screen',
      },
      size: {
        sm: 'max-w-sm w-full',
        default: 'max-w-lg w-full',
        lg: 'max-w-2xl w-full',
        xl: 'max-w-4xl w-full',
        full: 'w-[95vw] h-[95vh]',
      },
    },
    defaultVariants: {
      variant: 'modal',
      size: 'default',
    },
  }
);

// ===== ENHANCED MODAL COMPONENT =====
export interface AnimatedModalProps extends VariantProps<typeof modalContentVariants> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  animationVariant?: 'spring' | 'slide' | 'fade' | 'scale';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  swipeToClose?: boolean;
  preventScroll?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  variant = 'modal',
  size = 'default',
  animationVariant = 'spring',
  position = 'center',
  swipeToClose = false,
  preventScroll = true,
}) => {
  const focusTrapRef = useFocusTrap(isOpen);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, preventScroll]);

  // Escape key handler
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Swipe to close gesture
  const swipeHandlers = useSwipeGesture(
    (direction) => {
      if (swipeToClose) {
        if (
          (variant === 'drawer' && direction === 'down') ||
          (variant === 'sidebar' && (direction === 'left' || direction === 'right')) ||
          (variant === 'modal' && direction === 'down')
        ) {
          onClose();
        }
      }
    },
    50
  );

  // Get animation variants based on type and position
  const getAnimationVariants = () => {
    switch (animationVariant) {
      case 'slide':
        switch (position) {
          case 'top':
            return slideVariants.down;
          case 'bottom':
            return slideVariants.up;
          case 'left':
            return slideVariants.right;
          case 'right':
            return slideVariants.left;
          default:
            return slideVariants.up;
        }
      case 'fade':
        return fadeVariants;
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 },
        };
      default:
        return modalVariants;
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'items-start justify-center pt-12';
      case 'bottom':
        return 'items-end justify-center pb-12';
      case 'left':
        return 'items-center justify-start pl-12';
      case 'right':
        return 'items-center justify-end pr-12';
      default:
        return 'items-center justify-center';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    
      {isOpen && (
        <div style={{
  position: 'fixed',
  display: 'flex'
}} style={{ pointerEvents: 'auto' }}>
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/50 backdrop-blur-sm',
              overlayClassName
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Modal Container */}
          <div
            className={cn('relative z-10 flex w-full', getPositionClasses())}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Modal Content */}
            <div
              ref={focusTrapRef}
              className={cn(modalContentVariants({ variant, size }), className)}
              {...(swipeToClose ? swipeHandlers : {})}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || description || showCloseButton) && (
                <div
                  style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '24px'
}}
                >
                  <div style={{
  flex: '1'
}}>
                    {title && (
                      <h2
                        style={{
  fontWeight: '600'
}}
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        className="mt-1 text-sm text-muted-foreground"
                      >
                        {description}
                      </p>
                    )}
                  </div>

                  {showCloseButton && (
                    <div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        className="shrink-0 ml-4"
                        aria-label="Close modal"
                      >
                        <X style={{
  width: '16px',
  height: '16px'
}} />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div
                style={{
  flex: '1'
}}
              >
                {children}
              </div>

              {/* Swipe indicator for mobile */}
              {swipeToClose && variant === 'drawer' && (
                <div
                  style={{
  position: 'absolute',
  width: '48px',
  height: '4px',
  borderRadius: '50%'
}}
                />
              )}
            </div>
          </div>
        </div>
      )}
    
  );

  return createPortal(modalContent, document.body);
};

// ===== DRAWER COMPONENT =====
export interface DrawerProps extends Omit<AnimatedModalProps, 'variant' | 'position'> {
  direction?: 'bottom' | 'top' | 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  direction = 'bottom',
  animationVariant = 'slide',
  swipeToClose = true,
  ...props
}) => {
  const getPosition = () => {
    switch (direction) {
      case 'top':
        return 'top';
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      default:
        return 'bottom';
    }
  };

  return (
    <AnimatedModal
      {...props}
      variant="drawer"
      position={getPosition()}
      animationVariant={animationVariant}
      swipeToClose={swipeToClose}
    />
  );
};

// ===== SIDEBAR MODAL =====
export interface SidebarProps extends Omit<AnimatedModalProps, 'variant' | 'position'> {
  side?: 'left' | 'right';
}

export const Sidebar: React.FC<SidebarProps> = ({
  side = 'left',
  size = 'sm',
  animationVariant = 'slide',
  swipeToClose = true,
  ...props
}) => {
  return (
    <AnimatedModal
      {...props}
      variant="sidebar"
      position={side}
      size={size}
      animationVariant={animationVariant}
      swipeToClose={swipeToClose}
    />
  );
};

// ===== CONFIRMATION MODAL =====
export interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  icon,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close modal
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnBackdropClick={false}
    >
      <div style={{
  padding: '24px'
}}>
        <div
          style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}
          initial="hidden"
          animate="visible"
        >
          {icon && (
            <div
              className="shrink-0 mt-1"
            >
              {icon}
            </div>
          )}
          
          <div style={{
  flex: '1'
}}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end'
}}
          initial="hidden"
          animate="visible"
        >
          <div>
            <Button
              variant="outline"
              onClick={onCancel}
              className="min-w-[80px]"
            >
              {cancelLabel}
            </Button>
          </div>
          
          <div>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onClick={handleConfirm}
              className="min-w-[80px]"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

// ===== MODAL HOOKS =====
export const useModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

export const useConfirmationModal = () => {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirmation = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant,
    });
  }, []);

  const hideConfirmation = React.useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmationModalComponent = React.useCallback(() => (
    <ConfirmationModal
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      onConfirm={state.onConfirm}
      onCancel={hideConfirmation}
      variant={state.variant}
    />
  ), [state, hideConfirmation]);

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationModal: ConfirmationModalComponent,
  };
};

// ===== EXPORTS =====


const styles = {
  card: {
    background: 'rgba(20, 20, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '16px'
  },
  button: {
    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  container: {
    background: 'var(--bg-primary)',
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
  AnimatedModal,
  Drawer,
  Sidebar,
  ConfirmationModal,
  useModal,
  useConfirmationModal,
};