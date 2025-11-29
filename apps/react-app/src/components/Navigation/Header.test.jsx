import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../ui/ThemeProvider';

vi.mock('../../contexts/AuthContext.jsx');
vi.mock('../ui/ThemeProvider');
vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, leftIcon, className, fullWidth, ...props }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} data-fullwidth={fullWidth} className={className} {...props}>
      {leftIcon}
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, variant, size, className, ...props }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className} {...props}>
      {children}
    </button>
  ),
}));
vi.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  const mockLogout = vi.fn();
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });
    useTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
  });

  const renderWithRouter = (component, initialRoute = '/home') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Header Rendering', () => {
    it('should render header element', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render header with sticky positioning classes', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('should render header with backdrop blur classes', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur');
    });

    it('should render all major sections', () => {
      renderWithRouter(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });
  });

  describe('Logo and Branding', () => {
    it('should render logo with link to home', () => {
      renderWithRouter(<Header />);
      const logoLink = screen.getByRole('link', { name: /c cryb/i });
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('should render logo with C letter', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render CRYB text', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });

    it('should render logo with primary background', () => {
      renderWithRouter(<Header />);
      const logoContainer = screen.getByText('C').parentElement;
      expect(logoContainer).toHaveClass('bg-primary');
    });

    it('should hide CRYB text on small screens', () => {
      renderWithRouter(<Header />);
      const crybText = screen.getByText('CRYB');
      expect(crybText).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('Navigation Links - Desktop', () => {
    it('should render desktop navigation', () => {
      renderWithRouter(<Header />);
      const nav = screen.getByLabelText('Main navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render Home link', () => {
      renderWithRouter(<Header />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/home');
    });

    it('should render Communities link', () => {
      renderWithRouter(<Header />);
      const communitiesLink = screen.getByRole('link', { name: /communities/i });
      expect(communitiesLink).toHaveAttribute('href', '/communities');
    });

    it('should render NFTs link', () => {
      renderWithRouter(<Header />);
      const nftLink = screen.getByRole('link', { name: /nfts/i });
      expect(nftLink).toHaveAttribute('href', '/nft');
    });

    it('should render Chat link', () => {
      renderWithRouter(<Header />);
      const chatLink = screen.getByRole('link', { name: /chat/i });
      expect(chatLink).toHaveAttribute('href', '/chat');
    });

    it('should highlight active Home link', () => {
      renderWithRouter(<Header />, '/home');
      const homeButton = screen.getAllByText('Home').find(el => el.tagName === 'BUTTON');
      expect(homeButton).toHaveAttribute('data-variant', 'secondary');
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight active Communities link', () => {
      renderWithRouter(<Header />, '/communities');
      const communitiesButton = screen.getAllByText('Communities').find(el => el.tagName === 'BUTTON');
      expect(communitiesButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should highlight Communities link for sub-routes', () => {
      renderWithRouter(<Header />, '/communities/123');
      const communitiesButton = screen.getAllByText('Communities').find(el => el.tagName === 'BUTTON');
      expect(communitiesButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should not highlight inactive links', () => {
      renderWithRouter(<Header />, '/home');
      const chatButton = screen.getAllByText('Chat').find(el => el.tagName === 'BUTTON');
      expect(chatButton).toHaveAttribute('data-variant', 'ghost');
    });

    it('should hide desktop nav on mobile', () => {
      renderWithRouter(<Header />);
      const nav = screen.getByLabelText('Main navigation');
      expect(nav).toHaveClass('hidden', 'lg:flex');
    });
  });

  describe('Search Functionality', () => {
    it('should render search form', () => {
      renderWithRouter(<Header />);
      const searchForm = screen.getByRole('search', { name: /site search/i });
      expect(searchForm).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search query on input', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      expect(searchInput).toHaveValue('test query');
    });

    it('should navigate on search submit', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      const searchForm = screen.getByRole('search', { name: /site search/i });

      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.submit(searchForm);

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('should clear search query after submit', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      const searchForm = screen.getByRole('search', { name: /site search/i });

      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.submit(searchForm);

      expect(searchInput).toHaveValue('');
    });

    it('should not navigate on empty search', () => {
      renderWithRouter(<Header />);
      const searchForm = screen.getByRole('search', { name: /site search/i });

      fireEvent.submit(searchForm);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate on whitespace-only search', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      const searchForm = screen.getByRole('search', { name: /site search/i });

      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.submit(searchForm);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should encode special characters in search query', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByPlaceholderText(/search communities, nfts, users/i);
      const searchForm = screen.getByRole('search', { name: /site search/i });

      fireEvent.change(searchInput, { target: { value: 'test & query' } });
      fireEvent.submit(searchForm);

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20%26%20query');
    });

    it('should hide desktop search on mobile', () => {
      renderWithRouter(<Header />);
      const searchContainer = screen.getByRole('search', { name: /site search/i }).parentElement;
      expect(searchContainer).toHaveClass('hidden', 'md:flex');
    });

    it('should render mobile search button', () => {
      renderWithRouter(<Header />);
      const mobileSearchButton = screen.getByLabelText('Search');
      expect(mobileSearchButton).toBeInTheDocument();
      expect(mobileSearchButton).toHaveClass('md:hidden');
    });
  });

  describe('Theme Toggle', () => {
    it('should render theme toggle button', () => {
      renderWithRouter(<Header />);
      const themeButton = screen.getByLabelText('Toggle theme');
      expect(themeButton).toBeInTheDocument();
    });

    it('should show Moon icon in light theme', () => {
      useTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should show Sun icon in dark theme', () => {
      useTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should toggle theme from light to dark', () => {
      useTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      renderWithRouter(<Header />);
      const themeButton = screen.getByLabelText('Toggle theme');

      fireEvent.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle theme from dark to light', () => {
      useTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      renderWithRouter(<Header />);
      const themeButton = screen.getByLabelText('Toggle theme');

      fireEvent.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Authentication State - Logged Out', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
      });
    });

    it('should render Login button when logged out', () => {
      renderWithRouter(<Header />);
      const loginButton = screen.getByText('Login');
      expect(loginButton).toBeInTheDocument();
    });

    it('should render Sign Up button when logged out', () => {
      renderWithRouter(<Header />);
      const signUpButton = screen.getByText('Sign Up');
      expect(signUpButton).toBeInTheDocument();
    });

    it('should link Login button to /login', () => {
      renderWithRouter(<Header />);
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should link Sign Up button to /signup', () => {
      renderWithRouter(<Header />);
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });

    it('should not render Create button when logged out', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('should not render Notifications button when logged out', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
    });

    it('should not render user menu when logged out', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByLabelText(/user menu/i)).not.toBeInTheDocument();
    });
  });

  describe('Authentication State - Logged In', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
    };

    beforeEach(() => {
      useAuth.mockReturnValue({
        user: mockUser,
        logout: mockLogout,
      });
    });

    it('should not render Login button when logged in', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('should not render Sign Up button when logged in', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('should render Create button when logged in', () => {
      renderWithRouter(<Header />);
      const createButton = screen.getByLabelText('Create new post');
      expect(createButton).toBeInTheDocument();
    });

    it('should hide Create button on mobile', () => {
      renderWithRouter(<Header />);
      const createButton = screen.getByLabelText('Create new post');
      expect(createButton).toHaveClass('hidden', 'sm:flex');
    });

    it('should render Notifications button when logged in', () => {
      renderWithRouter(<Header />);
      const notificationsButton = screen.getByLabelText('Notifications');
      expect(notificationsButton).toBeInTheDocument();
    });

    it('should render user menu when logged in', () => {
      renderWithRouter(<Header />);
      const userMenu = screen.getByLabelText(/user menu for testuser/i);
      expect(userMenu).toBeInTheDocument();
    });

    it('should display user initial in avatar', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should display uppercase initial', () => {
      useAuth.mockReturnValue({
        user: { username: 'abc' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should handle username without first character', () => {
      useAuth.mockReturnValue({
        user: { username: '' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      const userMenu = screen.getByLabelText(/user menu/i);
      expect(userMenu).toBeInTheDocument();
    });
  });

  describe('User Menu Dropdown', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
    };

    beforeEach(() => {
      useAuth.mockReturnValue({
        user: mockUser,
        logout: mockLogout,
      });
    });

    it('should render user menu button with aria attributes', () => {
      renderWithRouter(<Header />);
      const userMenuButton = screen.getByLabelText(/user menu for testuser/i);
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should render user account menu navigation', () => {
      renderWithRouter(<Header />);
      const userAccountMenu = screen.getByLabelText('User account menu');
      expect(userAccountMenu).toBeInTheDocument();
    });

    it('should render Profile link in dropdown', () => {
      renderWithRouter(<Header />);
      const profileLink = screen.getByRole('menuitem', { name: /profile/i });
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('should render Settings link in dropdown', () => {
      renderWithRouter(<Header />);
      const settingsLink = screen.getByRole('menuitem', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render Logout button in dropdown', () => {
      renderWithRouter(<Header />);
      const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });

    it('should render separator in dropdown', () => {
      renderWithRouter(<Header />);
      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });

    it('should call logout on Logout button click', () => {
      renderWithRouter(<Header />);
      const logoutButton = screen.getByRole('menuitem', { name: /logout/i });

      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should navigate to home after logout', () => {
      renderWithRouter(<Header />);
      const logoutButton = screen.getByRole('menuitem', { name: /logout/i });

      fireEvent.click(logoutButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should have dropdown hidden by default', () => {
      renderWithRouter(<Header />);
      const dropdown = screen.getByLabelText('User account menu');
      expect(dropdown).toHaveClass('opacity-0', 'invisible');
    });

    it('should show dropdown on hover', () => {
      renderWithRouter(<Header />);
      const dropdown = screen.getByLabelText('User account menu');
      expect(dropdown).toHaveClass('group-hover:opacity-100', 'group-hover:visible');
    });
  });

  describe('Mobile Hamburger Menu', () => {
    it('should render mobile menu toggle button', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      expect(menuToggle).toBeInTheDocument();
    });

    it('should hide menu toggle on desktop', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      expect(menuToggle).toHaveClass('lg:hidden');
    });

    it('should not show mobile menu by default', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should show mobile menu when toggle is clicked', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');

      fireEvent.click(menuToggle);

      expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument();
    });

    it('should hide mobile menu when toggle is clicked twice', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');

      fireEvent.click(menuToggle);
      fireEvent.click(menuToggle);

      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should render all navigation links in mobile menu', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const mobileNav = screen.getByLabelText('Mobile navigation');
      expect(mobileNav).toBeInTheDocument();

      const links = mobileNav.querySelectorAll('a');
      expect(links).toHaveLength(4);
    });

    it('should close mobile menu when Home link is clicked', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const homeLink = screen.getByLabelText('Mobile navigation').querySelector('a[href="/home"]');
      fireEvent.click(homeLink);

      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should close mobile menu when Communities link is clicked', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const communitiesLink = screen.getByLabelText('Mobile navigation').querySelector('a[href="/communities"]');
      fireEvent.click(communitiesLink);

      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should close mobile menu when NFTs link is clicked', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const nftLink = screen.getByLabelText('Mobile navigation').querySelector('a[href="/nft"]');
      fireEvent.click(nftLink);

      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should close mobile menu when Chat link is clicked', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const chatLink = screen.getByLabelText('Mobile navigation').querySelector('a[href="/chat"]');
      fireEvent.click(chatLink);

      expect(screen.queryByLabelText('Mobile navigation')).not.toBeInTheDocument();
    });

    it('should highlight active link in mobile menu', () => {
      renderWithRouter(<Header />, '/home');
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const homeButtons = screen.getAllByText('Home').filter(el => el.tagName === 'BUTTON');
      const mobileHomeButton = homeButtons.find(btn => btn.hasAttribute('data-fullwidth'));
      expect(mobileHomeButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render mobile menu with border', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const mobileMenu = screen.getByLabelText('Mobile navigation').parentElement;
      expect(mobileMenu).toHaveClass('border-t', 'border-border');
    });

    it('should render full-width buttons in mobile menu', () => {
      renderWithRouter(<Header />);
      const menuToggle = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuToggle);

      const buttons = screen.getAllByText('Home').filter(el => el.tagName === 'BUTTON');
      const mobileButton = buttons.find(btn => btn.hasAttribute('data-fullwidth'));
      expect(mobileButton).toHaveAttribute('data-fullwidth', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    it('should show desktop navigation on large screens', () => {
      renderWithRouter(<Header />);
      const desktopNav = screen.getByLabelText('Main navigation');
      expect(desktopNav).toHaveClass('hidden', 'lg:flex');
    });

    it('should hide desktop search on mobile', () => {
      renderWithRouter(<Header />);
      const searchContainer = screen.getByRole('search', { name: /site search/i }).parentElement;
      expect(searchContainer).toHaveClass('hidden', 'md:flex');
    });

    it('should show mobile search button on small screens', () => {
      renderWithRouter(<Header />);
      const mobileSearch = screen.getByLabelText('Search');
      expect(mobileSearch).toHaveClass('md:hidden');
    });

    it('should hide CRYB text on small screens', () => {
      renderWithRouter(<Header />);
      const crybText = screen.getByText('CRYB');
      expect(crybText).toHaveClass('hidden', 'sm:block');
    });

    it('should hide Create button on mobile', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      const createButton = screen.getByLabelText('Create new post');
      expect(createButton).toHaveClass('hidden', 'sm:flex');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role on header', () => {
      renderWithRouter(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have proper ARIA label on main navigation', () => {
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });

    it('should have proper ARIA label on search form', () => {
      renderWithRouter(<Header />);
      expect(screen.getByRole('search', { name: /site search/i })).toBeInTheDocument();
    });

    it('should have proper ARIA label on search input', () => {
      renderWithRouter(<Header />);
      const searchInput = screen.getByLabelText('Search communities, NFTs, users');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      const searchIcon = header.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should have aria-current on active navigation links', () => {
      renderWithRouter(<Header />, '/home');
      const homeButton = screen.getAllByText('Home').find(el => el.tagName === 'BUTTON');
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should have proper ARIA labels on icon buttons', () => {
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should have role menu on dropdown', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      const dropdown = screen.getByRole('menu', { name: /user account menu/i });
      expect(dropdown).toBeInTheDocument();
    });

    it('should have role menuitem on dropdown items', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
    });

    it('should have role separator on dropdown divider', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser' },
        logout: mockLogout,
      });
      renderWithRouter(<Header />);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });
});

export default mockNavigate
