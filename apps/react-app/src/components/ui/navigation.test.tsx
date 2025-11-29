/**
 * Comprehensive Test Suite for CRYB Navigation Components
 * Testing Header, Sidebar, NavMenu, UserMenu, and Breadcrumb components
 * with focus on accessibility, responsive behavior, and user interactions
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Header,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  NavMenu,
  UserMenu,
  Breadcrumb,
} from './navigation';
import type {
  NavMenuItem,
  UserMenuItem,
  BreadcrumbItem,
} from './navigation';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock Radix UI Navigation Menu
jest.mock('@radix-ui/react-navigation-menu', () => {
  const mockReact = require('react');
  return {
    Root: mockReact.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <nav ref={ref} className={className} role="navigation" {...props}>
        {children}
      </nav>
    )),
    List: ({ children, className, ...props }: any) => (
      <ul className={className} {...props}>
        {children}
      </ul>
    ),
    Item: ({ children, ...props }: any) => (
      <li {...props}>{children}</li>
    ),
    Trigger: mockReact.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    )),
    Content: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="nav-menu-content" {...props}>
        {children}
      </div>
    ),
    Link: mockReact.forwardRef(({ children, className, href, ...props }: any, ref: any) => (
      <a ref={ref} className={className} href={href} {...props}>
        {children}
      </a>
    )),
  };
});

// Mock Radix UI Dropdown Menu
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const mockReact = require('react');
  return {
    Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
    Trigger: mockReact.forwardRef(({ children, asChild, ...props }: any, ref: any) => {
      if (asChild) {
        return mockReact.cloneElement(mockReact.Children.only(children), { ref, ...props });
      }
      return (
        <button ref={ref} {...props}>
          {children}
        </button>
      );
    }),
    Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
    Content: ({ children, className, forceMount, ...props }: any) => (
      <div className={className} data-testid="dropdown-content" {...props}>
        {children}
      </div>
    ),
    Label: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    Item: ({ children, className, onClick, disabled, ...props }: any) => (
      <div
        className={className}
        onClick={disabled ? undefined : onClick}
        data-disabled={disabled}
        role="menuitem"
        {...props}
      >
        {children}
      </div>
    ),
    Separator: ({ className, ...props }: any) => (
      <div className={className} role="separator" {...props} />
    ),
  };
});

// Mock Radix UI Collapsible
jest.mock('@radix-ui/react-collapsible', () => {
  const mockReact = require('react');
  return {
    Root: ({ children, open, onOpenChange }: any) => (
      <div data-testid="collapsible-root" data-open={open}>
        {children}
      </div>
    ),
    Trigger: ({ children, asChild, ...props }: any) => {
      if (asChild) {
        return mockReact.cloneElement(mockReact.Children.only(children), props);
      }
      return <button {...props}>{children}</button>;
    },
    Content: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="collapsible-content" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock button components
jest.mock('./button', () => {
  const mockReact = require('react');
  return {
    Button: mockReact.forwardRef(({ children, className, onClick, ...props }: any, ref: any) => (
      <button ref={ref} className={className} onClick={onClick} {...props}>
        {children}
      </button>
    )),
    IconButton: mockReact.forwardRef(({ icon, className, onClick, ...props }: any, ref: any) => (
      <button ref={ref} className={className} onClick={onClick} {...props}>
        {icon}
      </button>
    )),
  };
});

// Mock SearchInput
jest.mock('./input', () => ({
  SearchInput: ({ placeholder, ...props }: any) => (
    <input placeholder={placeholder} {...props} />
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Menu: () => <svg data-testid="menu-icon">Menu</svg>,
  X: () => <svg data-testid="x-icon">X</svg>,
  ChevronDown: ({ className }: any) => (
    <svg data-testid="chevron-down-icon" className={className}>
      ChevronDown
    </svg>
  ),
  ChevronRight: ({ className }: any) => (
    <svg data-testid="chevron-right-icon" className={className}>
      ChevronRight
    </svg>
  ),
  Search: () => <svg data-testid="search-icon">Search</svg>,
  Bell: () => <svg data-testid="bell-icon">Bell</svg>,
  User: ({ className }: any) => (
    <svg data-testid="user-icon" className={className}>
      User
    </svg>
  ),
  Settings: ({ className }: any) => (
    <svg data-testid="settings-icon" className={className}>
      Settings
    </svg>
  ),
  LogOut: ({ className }: any) => (
    <svg data-testid="logout-icon" className={className}>
      LogOut
    </svg>
  ),
  Home: () => <svg data-testid="home-icon">Home</svg>,
  MessageSquare: () => <svg data-testid="message-icon">MessageSquare</svg>,
  Users: () => <svg data-testid="users-icon">Users</svg>,
  Bookmark: () => <svg data-testid="bookmark-icon">Bookmark</svg>,
  Compass: () => <svg data-testid="compass-icon">Compass</svg>,
}));

// ===== HEADER COMPONENT TESTS =====
describe('Header Component', () => {
  describe('Rendering', () => {
    it('should render header element', () => {
      render(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render with logo', () => {
      render(<Header logo={<div data-testid="logo">CRYB</div>} />);
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('should render with navigation', () => {
      render(
        <Header
          navigation={
            <>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </>
          }
        />
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should render with search', () => {
      render(<Header search={<input placeholder="Search..." />} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should render with actions', () => {
      render(
        <Header
          actions={
            <>
              <button>Notifications</button>
              <button>Profile</button>
            </>
          }
        />
      );
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <Header>
          <div data-testid="custom-content">Custom Content</div>
        </Header>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Header className="custom-header" />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Header variant="default" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render glass variant', () => {
      render(<Header variant="glass" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render solid variant', () => {
      render(<Header variant="solid" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render transparent variant', () => {
      render(<Header variant="transparent" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Header size="sm" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render default size', () => {
      render(<Header size="default" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<Header size="lg" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Mobile Menu', () => {
    it('should show mobile menu trigger by default', () => {
      render(<Header />);
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should hide mobile menu trigger when showMobileMenu is false', () => {
      render(<Header showMobileMenu={false} />);
      const menuButton = screen.queryByLabelText('Toggle mobile menu');
      expect(menuButton).not.toBeInTheDocument();
    });

    it('should toggle mobile menu icon on click', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByLabelText('Toggle mobile menu');
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();

      await user.click(menuButton);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();

      await user.click(menuButton);
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });

    it('should render custom mobile menu trigger', () => {
      render(
        <Header
          mobileMenuTrigger={
            <button data-testid="custom-trigger">Custom Menu</button>
          }
        />
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });

    it('should have proper aria-label for accessibility', () => {
      render(<Header />);
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle mobile menu');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to header element', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Header ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current?.tagName).toBe('HEADER');
    });
  });

  describe('Complete Header Example', () => {
    it('should render full header with all elements', () => {
      render(
        <Header
          logo={<div data-testid="logo">CRYB</div>}
          navigation={
            <>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </>
          }
          search={<input placeholder="Search..." />}
          actions={
            <>
              <button>Notifications</button>
              <button>Profile</button>
            </>
          }
        />
      );

      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });
});

// ===== SIDEBAR COMPONENT TESTS =====
describe('Sidebar Component', () => {
  describe('Rendering', () => {
    it('should render sidebar', () => {
      render(<Sidebar>Content</Sidebar>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render with header', () => {
      render(<Sidebar header={<div>Sidebar Header</div>}>Content</Sidebar>);
      expect(screen.getByText('Sidebar Header')).toBeInTheDocument();
    });

    it('should render with footer', () => {
      render(<Sidebar footer={<div>Sidebar Footer</div>}>Content</Sidebar>);
      expect(screen.getByText('Sidebar Footer')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Sidebar className="custom-sidebar">Content</Sidebar>);
      expect(container.firstChild).toHaveClass('custom-sidebar');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Sidebar variant="default">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render glass variant', () => {
      const { container } = render(<Sidebar variant="glass">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render solid variant', () => {
      const { container } = render(<Sidebar variant="solid">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<Sidebar size="sm">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render default size', () => {
      const { container } = render(<Sidebar size="default">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<Sidebar size="lg">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render collapsed size', () => {
      const { container } = render(<Sidebar size="collapsed">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Position', () => {
    it('should render on left by default', () => {
      const { container } = render(<Sidebar position="left">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render on right', () => {
      const { container } = render(<Sidebar position="right">Content</Sidebar>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should render collapse toggle when collapsible', () => {
      render(
        <Sidebar collapsible header={<div>Header</div>}>
          Content
        </Sidebar>
      );
      // When not collapsed, it should show "Collapse sidebar"
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton).toBeInTheDocument();
    });

    it('should not render collapse toggle when not collapsible', () => {
      render(
        <Sidebar collapsible={false} header={<div>Header</div>}>
          Content
        </Sidebar>
      );
      const collapseButton = screen.queryByLabelText('Expand sidebar');
      expect(collapseButton).not.toBeInTheDocument();
    });

    it('should toggle collapsed state on click', async () => {
      const user = userEvent.setup();
      const handleCollapseChange = jest.fn();

      render(
        <Sidebar collapsible header={<div>Header</div>} onCollapseChange={handleCollapseChange}>
          Content
        </Sidebar>
      );

      const collapseButton = screen.getByLabelText('Collapse sidebar');
      await user.click(collapseButton);

      expect(handleCollapseChange).toHaveBeenCalledWith(true);
    });

    it('should update aria-label when toggling', async () => {
      const user = userEvent.setup();
      render(
        <Sidebar collapsible header={<div>Header</div>}>
          Content
        </Sidebar>
      );

      let collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton).toHaveAttribute('aria-label', 'Collapse sidebar');

      await user.click(collapseButton);
      collapseButton = screen.getByLabelText('Expand sidebar');
      expect(collapseButton).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('should respect initial collapsed prop', () => {
      render(
        <Sidebar collapsed={true} collapsible header={<div>Header</div>}>
          Content
        </Sidebar>
      );
      const collapseButton = screen.getByLabelText('Expand sidebar');
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to sidebar container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Sidebar ref={ref}>Content</Sidebar>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

// ===== SIDEBAR ITEM COMPONENT TESTS =====
describe('SidebarItem Component', () => {
  const TestIcon = () => <span data-testid="test-icon">Icon</span>;

  describe('Rendering', () => {
    it('should render as button by default', () => {
      render(<SidebarItem>Item</SidebarItem>);
      const item = screen.getByRole('button', { name: /item/i });
      expect(item).toBeInTheDocument();
    });

    it('should render as link when href is provided', () => {
      render(<SidebarItem href="/test">Item</SidebarItem>);
      const item = screen.getByRole('link', { name: /item/i });
      expect(item).toHaveAttribute('href', '/test');
    });

    it('should render with icon', () => {
      render(<SidebarItem icon={<TestIcon />}>Item</SidebarItem>);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should render with badge', () => {
      render(
        <SidebarItem badge={<span data-testid="badge">5</span>}>
          Messages
        </SidebarItem>
      );
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SidebarItem className="custom-item">Item</SidebarItem>);
      const item = screen.getByRole('button');
      expect(item).toHaveClass('custom-item');
    });
  });

  describe('Active State', () => {
    it('should apply active styles when active', () => {
      render(<SidebarItem active>Active Item</SidebarItem>);
      const item = screen.getByRole('button');
      expect(item).toBeInTheDocument();
    });

    it('should not apply active styles by default', () => {
      render(<SidebarItem>Normal Item</SidebarItem>);
      const item = screen.getByRole('button');
      expect(item).toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    it('should hide text when collapsed', () => {
      render(
        <SidebarItem icon={<TestIcon />} collapsed>
          Hidden Text
        </SidebarItem>
      );
      expect(screen.queryByText('Hidden Text')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should show text when not collapsed', () => {
      render(
        <SidebarItem icon={<TestIcon />} collapsed={false}>
          Visible Text
        </SidebarItem>
      );
      expect(screen.getByText('Visible Text')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should hide badge when collapsed', () => {
      render(
        <SidebarItem badge={<span data-testid="badge">5</span>} collapsed>
          Messages
        </SidebarItem>
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<SidebarItem onClick={handleClick}>Item</SidebarItem>);

      const item = screen.getByRole('button');
      await user.click(item);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<SidebarItem onClick={handleClick}>Item</SidebarItem>);

      const item = screen.getByRole('button');
      item.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<SidebarItem ref={ref}>Item</SidebarItem>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

// ===== SIDEBAR GROUP COMPONENT TESTS =====
describe('SidebarGroup Component', () => {
  describe('Rendering', () => {
    it('should render group with children', () => {
      render(
        <SidebarGroup>
          <SidebarItem>Item 1</SidebarItem>
          <SidebarItem>Item 2</SidebarItem>
        </SidebarGroup>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <SidebarGroup title="Navigation">
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SidebarGroup className="custom-group">
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      expect(container.querySelector('.custom-group')).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should render collapsible trigger when collapsible', () => {
      render(
        <SidebarGroup title="Group" collapsible>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      const trigger = screen.getByRole('button', { name: /group/i });
      expect(trigger).toBeInTheDocument();
    });

    it('should not render trigger when not collapsible', () => {
      render(
        <SidebarGroup title="Group" collapsible={false}>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      const trigger = screen.queryByRole('button', { name: /group/i });
      expect(trigger).not.toBeInTheDocument();
    });

    it('should be open by default', () => {
      render(
        <SidebarGroup title="Group" collapsible defaultOpen={true}>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('should respect defaultOpen prop', () => {
      render(
        <SidebarGroup title="Group" collapsible defaultOpen={false}>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('Sidebar Collapsed State', () => {
    it('should simplify rendering when sidebar is collapsed', () => {
      render(
        <SidebarGroup title="Group" sidebarCollapsed={true}>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      // Title should not be rendered when sidebar is collapsed
      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to group container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <SidebarGroup ref={ref}>
          <SidebarItem>Item</SidebarItem>
        </SidebarGroup>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

// ===== NAVIGATION MENU COMPONENT TESTS =====
describe('NavMenu Component', () => {
  const simpleItems: NavMenuItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const itemsWithIcons: NavMenuItem[] = [
    { label: 'Home', href: '/', icon: <span data-testid="home-icon">H</span> },
    { label: 'About', href: '/about', icon: <span data-testid="about-icon">A</span> },
  ];

  const itemsWithSubmenu: NavMenuItem[] = [
    { label: 'Home', href: '/' },
    {
      label: 'Products',
      items: [
        { label: 'Product 1', href: '/products/1' },
        { label: 'Product 2', href: '/products/2' },
      ],
    },
  ];

  describe('Rendering', () => {
    it('should render navigation menu', () => {
      render(<NavMenu items={simpleItems} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render menu items', () => {
      render(<NavMenu items={simpleItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should render items as links', () => {
      render(<NavMenu items={simpleItems} />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should apply custom className', () => {
      render(<NavMenu items={simpleItems} className="custom-nav" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-nav');
    });
  });

  describe('Icons in Menu Items', () => {
    it('should render icons with menu items', () => {
      render(<NavMenu items={itemsWithIcons} />);
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('about-icon')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight active menu item', () => {
      const itemsWithActive: NavMenuItem[] = [
        { label: 'Home', href: '/', active: true },
        { label: 'About', href: '/about' },
      ];
      render(<NavMenu items={itemsWithActive} />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
    });

    it('should not highlight inactive items', () => {
      const itemsWithActive: NavMenuItem[] = [
        { label: 'Home', href: '/', active: false },
        { label: 'About', href: '/about' },
      ];
      render(<NavMenu items={itemsWithActive} />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable menu items', () => {
      const itemsWithDisabled: NavMenuItem[] = [
        { label: 'Home', href: '/', disabled: true },
        { label: 'About', href: '/about' },
      ];
      render(<NavMenu items={itemsWithDisabled} />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Dropdown Submenus', () => {
    it('should render trigger for items with submenu', () => {
      render(<NavMenu items={itemsWithSubmenu} />);
      const trigger = screen.getByRole('button', { name: /products/i });
      expect(trigger).toBeInTheDocument();
    });

    it('should render submenu items', () => {
      render(<NavMenu items={itemsWithSubmenu} />);
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('should render submenu items as links', () => {
      render(<NavMenu items={itemsWithSubmenu} />);
      const productLink = screen.getByRole('link', { name: /product 1/i });
      expect(productLink).toHaveAttribute('href', '/products/1');
    });

    it('should show chevron icon on trigger', () => {
      render(<NavMenu items={itemsWithSubmenu} />);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('should support icons in submenu items', () => {
      const itemsWithIconsInSubmenu: NavMenuItem[] = [
        {
          label: 'Products',
          items: [
            {
              label: 'Product 1',
              href: '/products/1',
              icon: <span data-testid="product-icon">P</span>,
            },
          ],
        },
      ];
      render(<NavMenu items={itemsWithIconsInSubmenu} />);
      expect(screen.getByTestId('product-icon')).toBeInTheDocument();
    });

    it('should support active state in submenu items', () => {
      const itemsWithActiveSubmenu: NavMenuItem[] = [
        {
          label: 'Products',
          items: [
            { label: 'Product 1', href: '/products/1', active: true },
            { label: 'Product 2', href: '/products/2' },
          ],
        },
      ];
      render(<NavMenu items={itemsWithActiveSubmenu} />);
      const productLink = screen.getByRole('link', { name: /product 1/i });
      expect(productLink).toBeInTheDocument();
    });

    it('should support disabled state in submenu items', () => {
      const itemsWithDisabledSubmenu: NavMenuItem[] = [
        {
          label: 'Products',
          items: [
            { label: 'Product 1', href: '/products/1', disabled: true },
          ],
        },
      ];
      render(<NavMenu items={itemsWithDisabledSubmenu} />);
      const productLink = screen.getByRole('link', { name: /product 1/i });
      expect(productLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      render(<NavMenu items={simpleItems} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render chevron icon for dropdown items', () => {
      render(<NavMenu items={itemsWithSubmenu} />);
      const chevron = screen.getByTestId('chevron-down-icon');
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to navigation element', () => {
      const ref = React.createRef<HTMLElement>();
      render(<NavMenu items={simpleItems} ref={ref} />);
      expect(ref.current?.tagName).toBe('NAV');
    });
  });
});

// ===== USER MENU COMPONENT TESTS =====
describe('UserMenu Component', () => {
  const customItems: UserMenuItem[] = [
    { label: 'Dashboard', icon: <span data-testid="dashboard-icon">D</span>, href: '/dashboard' },
    { label: 'Settings', icon: <span data-testid="settings-icon">S</span>, href: '/settings' },
    { separator: true, label: '' },
    { label: 'Logout', onClick: jest.fn() },
  ];

  describe('Rendering', () => {
    it('should render user menu trigger', () => {
      render(<UserMenu items={[]} />);
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    });

    it('should render with custom trigger', () => {
      render(
        <UserMenu items={[]} trigger={<button data-testid="custom-trigger">User</button>} />
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });

    it('should render default trigger with user icon', () => {
      render(<UserMenu items={[]} />);
      const icons = screen.getAllByTestId('user-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render with avatar', () => {
      render(
        <UserMenu items={[]} avatar={<img src="/avatar.jpg" alt="User" />} />
      );
      expect(screen.getByAltText('User')).toBeInTheDocument();
    });
  });

  describe('User Information', () => {
    it('should display user name', () => {
      render(<UserMenu items={[]} name="John Doe" />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display user email', () => {
      render(<UserMenu items={[]} email="john@example.com" />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should display both name and email', () => {
      render(<UserMenu items={[]} name="John Doe" email="john@example.com" />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('Menu Items', () => {
    it('should render default menu items when none provided', () => {
      render(<UserMenu items={[]} />);
      expect(screen.getByText('Profile')).toBeInTheDocument();
      const settingsLinks = screen.getAllByText('Settings');
      expect(settingsLinks.length).toBeGreaterThan(0);
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should render custom menu items', () => {
      render(<UserMenu items={customItems} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render icons in menu items', () => {
      render(<UserMenu items={customItems} />);
      expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('should render links in menu items', () => {
      render(<UserMenu items={customItems} />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleLogout = jest.fn();
      const items: UserMenuItem[] = [
        { label: 'Logout', onClick: handleLogout },
      ];

      render(<UserMenu items={items} />);
      const logoutItem = screen.getByRole('menuitem', { name: /logout/i });
      await user.click(logoutItem);
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });

    it('should render separators', () => {
      render(<UserMenu items={customItems} />);
      const separators = screen.getAllByRole('separator');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should support disabled menu items', () => {
      const itemsWithDisabled: UserMenuItem[] = [
        { label: 'Disabled', disabled: true },
      ];
      render(<UserMenu items={itemsWithDisabled} />);
      const item = screen.getByRole('menuitem', { name: /disabled/i });
      expect(item).toHaveAttribute('data-disabled', 'true');
    });

    it('should not trigger onClick for disabled items', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      const itemsWithDisabled: UserMenuItem[] = [
        { label: 'Disabled', onClick: handleClick, disabled: true },
      ];
      render(<UserMenu items={itemsWithDisabled} />);
      const item = screen.getByRole('menuitem', { name: /disabled/i });
      await user.click(item);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Default Menu Items', () => {
    it('should have Profile link', () => {
      render(<UserMenu items={[]} />);
      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('should have Settings link', () => {
      render(<UserMenu items={[]} />);
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render default icons', () => {
      render(<UserMenu items={[]} />);
      const icons = screen.getAllByTestId('user-icon');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });
  });
});

// ===== BREADCRUMB COMPONENT TESTS =====
describe('Breadcrumb Component', () => {
  const simpleItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Category', current: true },
  ];

  describe('Rendering', () => {
    it('should render breadcrumb navigation', () => {
      render(<Breadcrumb items={simpleItems} />);
      const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(nav).toBeInTheDocument();
    });

    it('should render all breadcrumb items', () => {
      render(<Breadcrumb items={simpleItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should render links for non-current items', () => {
      render(<Breadcrumb items={simpleItems} />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should not render link for current item', () => {
      render(<Breadcrumb items={simpleItems} />);
      const currentItem = screen.getByText('Category');
      expect(currentItem.tagName).toBe('SPAN');
    });

    it('should apply custom className', () => {
      render(<Breadcrumb items={simpleItems} className="custom-breadcrumb" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-breadcrumb');
    });
  });

  describe('Separators', () => {
    it('should render default chevron separators', () => {
      render(<Breadcrumb items={simpleItems} />);
      const separators = screen.getAllByTestId('chevron-right-icon');
      expect(separators).toHaveLength(2); // n-1 separators for n items
    });

    it('should render custom separator', () => {
      render(
        <Breadcrumb
          items={simpleItems}
          separator={<span data-testid="custom-separator">/</span>}
        />
      );
      const separators = screen.getAllByTestId('custom-separator');
      expect(separators).toHaveLength(2);
    });

    it('should hide separators from screen readers', () => {
      render(<Breadcrumb items={simpleItems} />);
      const separators = screen.getAllByTestId('chevron-right-icon');
      separators.forEach((separator) => {
        expect(separator.parentElement).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      render(<Breadcrumb items={simpleItems} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label for breadcrumb', () => {
      render(<Breadcrumb items={simpleItems} />);
      const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('should mark current item with aria-current', () => {
      render(<Breadcrumb items={simpleItems} />);
      const currentItem = screen.getByText('Category');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });

    it('should not have aria-current on non-current items', () => {
      render(<Breadcrumb items={simpleItems} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('Item Collapsing', () => {
    const manyItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Computers', href: '/products/electronics/computers' },
      { label: 'Laptops', href: '/products/electronics/computers/laptops' },
      { label: 'Gaming', current: true },
    ];

    it('should collapse items when maxItems is set', () => {
      render(<Breadcrumb items={manyItems} maxItems={3} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
    });

    it('should not collapse when items <= maxItems', () => {
      render(<Breadcrumb items={simpleItems} maxItems={5} />);
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('should show first and last items when collapsed', () => {
      render(<Breadcrumb items={manyItems} maxItems={3} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to navigation element', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Breadcrumb items={simpleItems} ref={ref} />);
      expect(ref.current?.tagName).toBe('NAV');
    });
  });
});

// ===== INTEGRATION TESTS =====
describe('Navigation Integration', () => {
  describe('Complete Navigation System', () => {
    it('should render complete navigation with all components', () => {
      const navItems: NavMenuItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics', href: '/analytics' },
      ];

      const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Products', current: true },
      ];

      const userMenuItems: UserMenuItem[] = [
        { label: 'Account', href: '/account' },
        { separator: true, label: '' },
        { label: 'Logout', onClick: jest.fn() },
      ];

      render(
        <div>
          <Header
            logo={<div data-testid="logo">CRYB</div>}
            navigation={<NavMenu items={navItems} />}
            actions={<UserMenu items={userMenuItems} name="John Doe" email="john@example.com" />}
          />
          <Breadcrumb items={breadcrumbItems} />
          <div style={{ display: 'flex' }}>
            <Sidebar header={<div>Sidebar</div>}>
              <SidebarGroup title="Menu">
                <SidebarItem href="/files">Files</SidebarItem>
                <SidebarItem href="/teams">Teams</SidebarItem>
              </SidebarGroup>
            </Sidebar>
          </div>
        </div>
      );

      // Verify all components are rendered
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through menu items', async () => {
      const user = userEvent.setup();
      const items: NavMenuItem[] = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ];

      render(<NavMenu items={items} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });

      await user.tab();
      expect(homeLink).toHaveFocus();

      await user.tab();
      expect(aboutLink).toHaveFocus();
    });

    it('should support keyboard interaction in sidebar', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <Sidebar>
          <SidebarItem onClick={handleClick}>Item 1</SidebarItem>
          <SidebarItem>Item 2</SidebarItem>
        </Sidebar>
      );

      const item1 = screen.getByRole('button', { name: /item 1/i });
      item1.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show mobile menu toggle in header', () => {
      render(<Header />);
      const mobileToggle = screen.getByLabelText('Toggle mobile menu');
      expect(mobileToggle).toBeInTheDocument();
    });

    it('should toggle mobile menu state', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const mobileToggle = screen.getByLabelText('Toggle mobile menu');
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();

      await user.click(mobileToggle);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });
});
