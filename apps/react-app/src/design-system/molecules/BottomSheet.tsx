import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { colors, spacing, typography, radii } from '../tokens';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  snapPoints?: ('25%' | '50%' | '75%' | '90%')[];
  initialSnap?: number;
  showCloseButton?: boolean;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  snapPoints = ['50%', '90%'],
  initialSnap = 0,
  showCloseButton = true,
  showHandle = true,
}) => {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragCurrentY(clientY);
  };

  const handleDragEnd = () => {
    if (dragStartY === null || dragCurrentY === null) {
      setDragStartY(null);
      setDragCurrentY(null);
      return;
    }

    const deltaY = dragCurrentY - dragStartY;
    const threshold = 100;

    if (deltaY > threshold) {
      // Dragged down
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Dragged up
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      }
    }

    setDragStartY(null);
    setDragCurrentY(null);
  };

  const getTransform = () => {
    if (dragStartY !== null && dragCurrentY !== null) {
      const deltaY = dragCurrentY - dragStartY;
      return `translateY(${Math.max(0, deltaY)}px)`;
    }
    return 'translateY(0)';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--bg-tertiary)',
          zIndex: 1000,
          animation: 'fadeIn 200ms ease-out',
        }}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottomsheet-title' : undefined}
        aria-describedby={description ? 'bottomsheet-description' : undefined}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          backgroundColor: colors.bg.elevated,
          borderRadius: `${radii.xl} ${radii.xl} 0 0`,
          height: snapPoints[currentSnap],
          animation: 'slideUp 250ms ease-out',
          display: 'flex',
          flexDirection: 'column',
          transform: getTransform(),
          transition: dragStartY === null ? 'height 300ms ease-out, transform 300ms ease-out' : 'none',
        }}
      >
        {/* Drag handle */}
        {showHandle && (
          <div
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: spacing[3],
              cursor: 'grab',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: radii.full,
                backgroundColor: colors.border.default,
              }}
            />
          </div>
        )}

        {/* Header */}
        {(title || description || showCloseButton) && (
          <div
            style={{
              padding: `${spacing[4]} ${spacing[5]}`,
              borderBottom: `1px solid ${colors.border.default}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: spacing[4],
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <h2
                  id="bottomsheet-title"
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    margin: 0,
                    marginBottom: description ? spacing[2] : 0,
                  }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="bottomsheet-description"
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    margin: 0,
                    lineHeight: typography.lineHeight.relaxed,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} color={colors.text.secondary} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: spacing[5],
            overflow: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
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
