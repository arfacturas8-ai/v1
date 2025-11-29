/**
 * CRYB Design System - Navigation Components
 * Comprehensive navigation system with responsive behavior and accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Home,
  MessageSquare,
  Users,
  Bookmark,
  Compass
} from 'lucide-react';
import { Button, IconButton } from './button';
import { SearchInput } from './input';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Collapsible from '@radix-ui/react-collapsible';

// ===== NAVIGATION BAR VARIANTS =====
const navBarVariants = cva([
  'sticky top-0 z-40 w-full',
  'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
  'border-b border-border',
], {
  variants: {
    variant: {
      default: '',
      glass: 'bg-background/80 backdrop-blur-md',
      solid: 'bg-background',
      transparent: 'bg-transparent border-transparent',
    },
    size: {
      sm: 'h-12',
      default: 'h-16',
      lg: 'h-20',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// ===== HEADER COMPONENT =====
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation variant */
  variant?: VariantProps<typeof navBarVariants>['variant'];
  /** Navigation size */
  size?: VariantProps<typeof navBarVariants>['size'];
  /** Logo or brand element */
  logo?: React.ReactNode;
  /** Navigation items */
  navigation?: React.ReactNode;
  /** Search component */
  search?: React.ReactNode;
  /** Actions (user menu, notifications, etc.) */
  actions?: React.ReactNode;
  /** Mobile menu trigger */
  mobileMenuTrigger?: React.ReactNode;
  /** Whether to show mobile menu trigger */
  showMobileMenu?: boolean;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      variant,
      size,
      logo,
      navigation,
      search,
      actions,
      mobileMenuTrigger,
      showMobileMenu = true,
      children,
      ...props
    },
    ref
  ) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
      <header
        ref={ref}
        className={cn(navBarVariants({ variant, size }), className)}
        {...props}
      >
        <div className="flex h-full items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full justify-between gap-4">
          {/* Mobile Menu Trigger */}
          {showMobileMenu && (
            <div className="flex md:hidden">
              {mobileMenuTrigger || (
                <IconButton
                  icon={isMobileMenuOpen ? <X /> : <Menu />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle mobile menu"
                />
              )}
            </div>
          )}

          {/* Logo */}
          {logo && (
            <div className="flex items-center flex-shrink-0">
              {logo}
            </div>
          )}

          {/* Desktop Navigation */}
          {navigation && (
            <nav className="hidden md:flex items-center font-medium gap-6 ml-6">
              {navigation}
            </nav>
          )}

          {/* Search */}
          {search && (
            <div className="flex-1 flex justify-center px-4 md:px-6 max-w-md hidden sm:flex">
              {search}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}

          {/* Children (fallback) */}
          {children}
        </div>

        {/* Mobile Menu - you would implement this based on your mobile menu component */}
        {/* This is a placeholder for mobile menu integration */}
      </header>
    );
  }
);

Header.displayName = 'Header';

// ===== SIDEBAR VARIANTS =====
const sidebarVariants = cva([
  'flex flex-col bg-background border-r border-border',
  'transition-all duration-300 ease-in-out',
], {
  variants: {
    variant: {
      default: '',
      glass: 'bg-background/80 backdrop-blur-md',
      solid: 'bg-card',
    },
    size: {
      sm: 'w-60',
      default: 'w-64',
      lg: 'w-72',
      collapsed: 'w-16',
    },
    position: {
      left: '',
      right: 'border-l border-r-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    position: 'left',
  },
});

// ===== SIDEBAR COMPONENT =====
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sidebar variant */
  variant?: VariantProps<typeof sidebarVariants>['variant'];
  /** Sidebar size */
  size?: VariantProps<typeof sidebarVariants>['size'];
  /** Sidebar position */
  position?: VariantProps<typeof sidebarVariants>['position'];
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Header content */
  header?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether sidebar is collapsible */
  collapsible?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      size,
      position,
      collapsed = false,
      header,
      footer,
      collapsible = false,
      onCollapseChange,
      children,
      ...props
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

    React.useEffect(() => {
      setIsCollapsed(collapsed);
    }, [collapsed]);

    const handleToggleCollapse = () => {
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      onCollapseChange?.(newCollapsed);
    };

    const actualSize = isCollapsed ? 'collapsed' : size;

    return (
      <div
        ref={ref}
        className={cn(sidebarVariants({ variant, size: actualSize, position }), className)}
        {...props}
      >
        {/* Header */}
        {header && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px'
}}>
            {header}
            {collapsible && (
              <IconButton
                icon={<ChevronRight className={cn('transition-transform', isCollapsed ? '' : 'rotate-180')} />}
                variant="ghost"
                size="icon-sm"
                onClick={handleToggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div style={{
  flex: '1',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
  padding: '16px'
}}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';

// ===== SIDEBAR ITEM COMPONENT =====
export interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Item icon */
  icon?: React.ReactNode;
  /** Whether item is active */
  active?: boolean;
  /** Badge content */
  badge?: React.ReactNode;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Item href (for links) */
  href?: string;
  /** Render as child */
  asChild?: boolean;
}

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    {
      className,
      icon,
      active = false,
      badge,
      collapsed = false,
      href,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = href ? 'a' : 'button';
    
    return (
      <Comp
        ref={ref as any}
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 mx-2 text-left transition-all',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active && 'bg-accent text-accent-foreground font-medium',
          collapsed && 'justify-center px-2',
          className
        )}
        {...props}
      >
        {icon && (
          <div className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}>
            {icon}
          </div>
        )}
        
        {!collapsed && (
          <>
            <span style={{
  flex: '1'
}}>{children}</span>
            {badge && (
              <div className="flex-shrink-0 ml-auto">
                {badge}
              </div>
            )}
          </>
        )}
      </Comp>
    );
  }
);

SidebarItem.displayName = 'SidebarItem';

// ===== SIDEBAR GROUP COMPONENT =====
export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Group title */
  title?: string;
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group is initially open */
  defaultOpen?: boolean;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
}

const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  (
    {
      className,
      title,
      collapsible = false,
      defaultOpen = true,
      sidebarCollapsed = false,
      children,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    if (sidebarCollapsed) {
      return (
        <div ref={ref} className={cn('space-y-1', className)} {...props}>
          {children}
        </div>
      );
    }

    if (!collapsible) {
      return (
        <div ref={ref} className={cn('space-y-1', className)} {...props}>
          {title && (
            <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  fontWeight: '500'
}}>
              {title}
            </div>
          )}
          {children}
        </div>
      );
    }

    return (
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
        <div ref={ref} className={cn('space-y-1', className)} {...props}>
          {title && (
            <Collapsible.Trigger asChild>
              <Button
                variant="ghost"
                style={{
  width: '100%',
  justifyContent: 'space-between',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  fontWeight: '500'
}}
              >
                {title}
                <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen ? 'rotate-180' : '')} />
              </Button>
            </Collapsible.Trigger>
          )}
          <Collapsible.Content className="space-y-1">
            {children}
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
    );
  }
);

SidebarGroup.displayName = 'SidebarGroup';

// ===== NAVIGATION MENU COMPONENT =====
export interface NavMenuProps extends React.ComponentProps<typeof NavigationMenu.Root> {
  /** Menu items */
  items?: NavMenuItem[];
}

export interface NavMenuItem {
  /** Item label */
  label: string;
  /** Item href */
  href?: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Submenu items */
  items?: NavMenuItem[];
  /** Whether item is active */
  active?: boolean;
  /** Whether item is disabled */
  disabled?: boolean;
}

const NavMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Root>,
  NavMenuProps
>(({ className, items = [], children, ...props }, ref) => {
  return (
    <NavigationMenu.Root
      ref={ref}
      className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
      {...props}
    >
      <NavigationMenu.List style={{
  display: 'flex',
  flex: '1',
  alignItems: 'center',
  justifyContent: 'center'
}}>
        {items.map((item, index) => (
          <NavMenuItemComponent key={index} item={item} />
        ))}
        {children}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
});

NavMenu.displayName = 'NavMenu';

// ===== NAVIGATION MENU ITEM COMPONENT =====
const NavMenuItemComponent: React.FC<{ item: NavMenuItem }> = ({ item }) => {
  const hasSubmenu = item.items && item.items.length > 0;

  if (hasSubmenu) {
    return (
      <NavigationMenu.Item>
        <NavigationMenu.Trigger
          className={cn(
            'group inline-flex h-10 w-max items-center justify-center rounded-md',
            'bg-background px-4 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:bg-accent focus:text-accent-foreground focus:outline-none',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
            item.active && 'bg-accent text-accent-foreground',
            item.disabled && 'pointer-events-none opacity-50'
          )}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
          <ChevronDown
            style={{
  position: 'relative',
  height: '12px',
  width: '12px'
}}
            aria-hidden="true"
          />
        </NavigationMenu.Trigger>
        <NavigationMenu.Content style={{
  width: '100%'
}}>
          <div style={{
  margin: '0px',
  display: 'grid',
  gap: '24px',
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
            {item.items?.map((subItem, index) => (
              <a
                key={index}
                href={subItem.href}
                className={cn(
                  'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  subItem.active && 'bg-accent text-accent-foreground',
                  subItem.disabled && 'pointer-events-none opacity-50'
                )}
              >
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  {subItem.icon && <span>{subItem.icon}</span>}
                  <div style={{
  fontWeight: '500'
}}>{subItem.label}</div>
                </div>
              </a>
            ))}
          </div>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    );
  }

  return (
    <NavigationMenu.Item>
      <NavigationMenu.Link
        href={item.href}
        className={cn(
          'group inline-flex h-10 w-max items-center justify-center rounded-md',
          'bg-background px-4 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground focus:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          item.active && 'bg-accent text-accent-foreground',
          item.disabled && 'pointer-events-none opacity-50'
        )}
      >
        {item.icon && <span className="mr-2">{item.icon}</span>}
        {item.label}
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  );
};

// ===== USER MENU COMPONENT =====
export interface UserMenuProps {
  /** User avatar */
  avatar?: React.ReactNode;
  /** User name */
  name?: string;
  /** User email */
  email?: string;
  /** Menu items */
  items?: UserMenuItem[];
  /** Trigger component */
  trigger?: React.ReactNode;
}

export interface UserMenuItem {
  /** Item label */
  label: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Item href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether item is separator */
  separator?: boolean;
  /** Whether item is disabled */
  disabled?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({
  avatar,
  name,
  email,
  items = [],
  trigger,
}) => {
  const defaultItems: UserMenuItem[] = [
    { label: 'Profile', icon: <User style={{
  height: '16px',
  width: '16px'
}} />, href: '/profile' },
    { label: 'Settings', icon: <Settings style={{
  height: '16px',
  width: '16px'
}} />, href: '/settings' },
    { separator: true, label: '' },
    { label: 'Sign out', icon: <LogOut style={{
  height: '16px',
  width: '16px'
}} />, onClick: () => {} },
  ];

  const menuItems = items.length > 0 ? items : defaultItems;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" style={{
  position: 'relative',
  height: '32px',
  width: '32px',
  borderRadius: '50%'
}}>
            {avatar || <User style={{
  height: '16px',
  width: '16px'
}} />}
          </Button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          style={{
  width: '224px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '4px'
}}
          align="end"
          forceMount
        >
          {(name || email) && (
            <>
              <DropdownMenu.Label style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                <div style={{
  display: 'flex',
  flexDirection: 'column'
}}>
                  {name && <p style={{
  fontWeight: '500'
}}>{name}</p>}
                  {email && <p className="text-xs leading-none text-muted-foreground">{email}</p>}
                </div>
              </DropdownMenu.Label>
              <DropdownMenu.Separator style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: '4px',
  marginBottom: '4px'
}} />
            </>
          )}
          
          {menuItems.map((item, index) => {
            if (item.separator) {
              return <DropdownMenu.Separator key={index} style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: '4px',
  marginBottom: '4px'
}} />;
            }

            return (
              <DropdownMenu.Item
                key={index}
                className={cn(
                  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  'transition-colors focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  item.disabled && 'pointer-events-none opacity-50'
                )}
                onClick={item.onClick}
                disabled={item.disabled}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.href ? (
                  <a href={item.href} style={{
  flex: '1'
}}>
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

// ===== BREADCRUMB COMPONENT =====
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLNavElement> {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator element */
  separator?: React.ReactNode;
  /** Max items to show before collapsing */
  maxItems?: number;
}

export interface BreadcrumbItem {
  /** Item label */
  label: string;
  /** Item href */
  href?: string;
  /** Whether item is current */
  current?: boolean;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, separator, maxItems, ...props }, ref) => {
    const defaultSeparator = <ChevronRight style={{
  height: '16px',
  width: '16px'
}} />;
    const sep = separator !== undefined ? separator : defaultSeparator;

    // Handle item collapsing if maxItems is set
    let displayItems = items;
    if (maxItems && items.length > maxItems) {
      const start = items.slice(0, 1);
      const end = items.slice(-(maxItems - 1));
      displayItems = [...start, { label: '...', href: undefined }, ...end];
    }

    return (
      <nav
        ref={ref}
        className={cn('flex items-center space-x-1 text-sm', className)}
        aria-label="Breadcrumb"
        {...props}
      >
        <ol style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {displayItems.map((item, index) => (
            <li key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
              {index > 0 && (
                <span style={{
  marginLeft: '8px',
  marginRight: '8px'
}} aria-hidden="true">
                  {sep}
                </span>
              )}
              {item.href && !item.current ? (
                <a
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    item.current ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

// ===== EXPORTS =====
export {
  Header,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  NavMenu,
  UserMenu,
  Breadcrumb,
  navBarVariants,
  sidebarVariants,
};

export type {
  HeaderProps,
  SidebarProps,
  SidebarItemProps,
  SidebarGroupProps,
  NavMenuProps,
  NavMenuItem,
  UserMenuProps,
  UserMenuItem,
  BreadcrumbProps,
  BreadcrumbItem,
};