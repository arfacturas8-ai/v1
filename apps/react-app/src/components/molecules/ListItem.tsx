import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  backgroundColor: string;
  color?: string;
  onAction: () => void;
}

interface ListItemProps {
  leftIcon?: React.ReactNode;
  leftAvatar?: string;
  title: string;
  subtitle?: string;
  rightAccessory?: React.ReactNode;
  rightText?: string;
  swipeActions?: SwipeAction[];
  disabled?: boolean;
  selected?: boolean;
  divider?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
}

const ListItem: React.FC<ListItemProps> = ({
  leftIcon,
  leftAvatar,
  title,
  subtitle,
  rightAccessory,
  rightText,
  swipeActions = [],
  disabled = false,
  selected = false,
  divider = true,
  onClick,
  onLongPress,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const startX = React.useRef(0);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeActions.length) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;

    if (Math.abs(diff) > 10) {
      setIsSwiping(true);
    }

    if (diff > 0 && diff <= 200) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (swipeOffset > 100) {
      setSwipeOffset(200);
    } else {
      setSwipeOffset(0);
    }

    setTimeout(() => setIsSwiping(false), 100);
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
        }, 500);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = () => {
    if (!isSwiping && onClick && !disabled) {
      onClick();
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    setSwipeOffset(0);
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: divider ? `1px solid ${colors.border.subtle}` : 'none',
      }}
    >
      {/* Swipe Actions */}
      {swipeActions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            transform: `translateX(${swipeOffset > 0 ? 0 : '100%'})`,
            transition: isSwiping ? 'none' : `transform ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
        >
          {swipeActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              style={{
                width: '80px',
                backgroundColor: action.backgroundColor,
                color: action.color || colors.text.primary,
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[1],
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                fontFamily: typography.fontFamily.sans,
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
          handleMouseUp();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: `${spacing[3]} ${spacing[4]}`,
          backgroundColor: selected
            ? colors.bg.elevated
            : isPressed
            ? colors.bg.tertiary
            : isHovered
            ? colors.bg.hover
            : 'transparent',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          opacity: disabled ? 0.5 : 1,
          transition: isSwiping ? 'none' : `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          transform: `translateX(-${swipeOffset}px)`,
          userSelect: 'none',
        }}
      >
        {/* Left Content */}
        {(leftIcon || leftAvatar) && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {leftAvatar ? (
              <img
                src={leftAvatar}
                alt=""
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.full,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ color: colors.text.secondary, display: 'flex' }}>
                {leftIcon}
              </div>
            )}
          </div>
        )}

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.sans,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                fontFamily: typography.fontFamily.sans,
                marginTop: spacing[1],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Right Content */}
        {(rightAccessory || rightText) && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            {rightText && (
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {rightText}
              </span>
            )}
            {rightAccessory}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListItem;
