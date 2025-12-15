import React from 'react';
import { colors, spacing, typography, radii, animation, zIndex } from '../../design-system/tokens';

export type SnapPoint = number; // percentage of viewport height

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: SnapPoint[];
  initialSnap?: number;
  title?: string;
  children: React.ReactNode;
  showDragIndicator?: boolean;
  closeOnOverlayClick?: boolean;
  keyboardAvoidance?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  snapPoints = [90, 50],
  initialSnap = 0,
  title,
  children,
  showDragIndicator = true,
  closeOnOverlayClick = true,
  keyboardAvoidance = true,
}) => {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartY, setDragStartY] = React.useState(0);
  const [dragCurrentY, setDragCurrentY] = React.useState(0);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Handle keyboard
  React.useEffect(() => {
    if (!keyboardAvoidance) return;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      const keyboardHeight = windowHeight - visualViewportHeight;
      setKeyboardHeight(keyboardHeight);
    };

    if (isOpen) {
      window.visualViewport?.addEventListener('resize', handleResize);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, keyboardAvoidance]);

  const getCurrentHeight = () => {
    if (isDragging) {
      const dragDistance = dragCurrentY - dragStartY;
      const currentHeight = snapPoints[currentSnap];
      const newHeight = currentHeight - (dragDistance / window.innerHeight) * 100;
      return Math.max(0, Math.min(100, newHeight));
    }
    return snapPoints[currentSnap];
  };

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    setDragCurrentY(clientY);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const dragDistance = dragCurrentY - dragStartY;
    const dragVelocity = dragDistance / window.innerHeight;

    // Threshold for closing (dragging down more than 20vh or fast swipe)
    if (dragDistance > window.innerHeight * 0.2 || dragVelocity > 0.2) {
      onClose();
    } else {
      // Find nearest snap point
      const currentHeight = getCurrentHeight();
      const nearest = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
      );
      const newSnapIndex = snapPoints.indexOf(nearest);
      setCurrentSnap(newSnapIndex);
    }

    setIsDragging(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sheetHeight = getCurrentHeight();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--bg-tertiary)',
          backdropFilter: 'blur(4px)',
          zIndex: zIndex.modalBackdrop,
          animation: `fadeIn ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 0,
          height: `${sheetHeight}vh`,
          backgroundColor: colors.bg.elevated,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          zIndex: zIndex.modal,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: isDragging ? 'none' : `all ${animation.duration.normal} ${animation.easing.easeOut}`,
          animation: `slideUpFromBottom ${animation.duration.normal} ${animation.easing.easeOut}`,
          touchAction: 'none',
        }}
      >
        {/* Drag Handle */}
        {showDragIndicator && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: spacing[3],
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: colors.border.strong,
                borderRadius: radii.full,
              }}
            />
          </div>
        )}

        {/* Header */}
        {title && (
          <div
            style={{
              padding: `0 ${spacing[5]} ${spacing[4]} ${spacing[5]}`,
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            <h2
              id="bottom-sheet-title"
              style={{
                margin: 0,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.sans,
                color: colors.text.primary,
              }}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing[5],
            color: colors.text.primary,
          }}
        >
          {children}
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes slideUpFromBottom {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default BottomSheet;
