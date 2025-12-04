import React from 'react';
import { colors, spacing, typography, radii, animation, shadows, zIndex } from '../../design-system/tokens';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  submenu?: MenuItem[];
}

export interface MenuGroup {
  id: string;
  title?: string;
  items: MenuItem[];
}

interface MenuProps {
  items?: MenuItem[];
  groups?: MenuGroup[];
  trigger: React.ReactNode;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  closeOnSelect?: boolean;
  onItemClick?: (itemId: string) => void;
}

const Menu: React.FC<MenuProps> = ({
  items = [],
  groups = [],
  trigger,
  placement = 'bottom-right',
  closeOnSelect = true,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submenuOpen, setSubmenuOpen] = React.useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;

    if (item.submenu && item.submenu.length > 0) {
      setSubmenuOpen(submenuOpen === item.id ? null : item.id);
    } else {
      if (onItemClick) onItemClick(item.id);
      if (closeOnSelect) {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    }
  };

  const handleMouseEnter = (item: MenuItem) => {
    if (item.disabled) return;

    setHoveredItem(item.id);

    if (item.submenu && item.submenu.length > 0) {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
      submenuTimeoutRef.current = setTimeout(() => {
        setSubmenuOpen(item.id);
      }, 200);
    } else {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
      setSubmenuOpen(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  };

  const getPlacementStyles = (): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      'bottom-left': { top: '100%', left: 0, marginTop: spacing[2] },
      'bottom-right': { top: '100%', right: 0, marginTop: spacing[2] },
      'top-left': { bottom: '100%', left: 0, marginBottom: spacing[2] },
      'top-right': { bottom: '100%', right: 0, marginBottom: spacing[2] },
    };
    return styles[placement];
  };

  const renderMenuItem = (item: MenuItem, isSubmenuItem = false) => {
    if (item.divider) {
      return (
        <div
          key={item.id}
          style={{
            height: '1px',
            backgroundColor: colors.border.subtle,
            margin: `${spacing[2]} 0`,
          }}
        />
      );
    }

    const isHovered = hoveredItem === item.id;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = submenuOpen === item.id;

    return (
      <div key={item.id} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={handleMouseLeave}
          disabled={item.disabled}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[3],
            padding: `${spacing[2]} ${spacing[3]}`,
            backgroundColor: isHovered && !item.disabled ? colors.bg.hover : 'transparent',
            border: 'none',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.5 : 1,
            transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flex: 1 }}>
            {item.icon && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: item.destructive ? colors.semantic.error : 'currentColor',
                }}
              >
                {item.icon}
              </span>
            )}
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.sans,
                color: item.destructive ? colors.semantic.error : colors.text.primary,
              }}
            >
              {item.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {item.shortcut && (
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.text.tertiary,
                }}
              >
                {item.shortcut}
              </span>
            )}
            {hasSubmenu && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4l4 4-4 4"
                  stroke={colors.text.tertiary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Submenu */}
        {hasSubmenu && isSubmenuOpen && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              marginLeft: spacing[1],
              minWidth: '200px',
              backgroundColor: colors.bg.elevated,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radii.lg,
              boxShadow: shadows.lg,
              padding: spacing[2],
              zIndex: zIndex.popover + 1,
            }}
            onMouseLeave={() => setSubmenuOpen(null)}
          >
            {item.submenu?.map((subItem) => renderMenuItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (groups.length > 0) {
      return groups.map((group, groupIndex) => (
        <div key={group.id}>
          {group.title && (
            <div
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {group.title}
            </div>
          )}
          {group.items.map((item) => renderMenuItem(item))}
          {groupIndex < groups.length - 1 && (
            <div
              style={{
                height: '1px',
                backgroundColor: colors.border.subtle,
                margin: `${spacing[2]} 0`,
              }}
            />
          )}
        </div>
      ));
    }

    return items.map((item) => renderMenuItem(item));
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {/* Menu Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...getPlacementStyles(),
            minWidth: '220px',
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.lg,
            boxShadow: shadows.lg,
            padding: spacing[2],
            zIndex: zIndex.popover,
            animation: `fadeIn ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default Menu;
